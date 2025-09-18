import { Router, Request, Response } from 'express';
import { 
  CheckInRequest, 
  SubmitVisitSurveyRequest, 
  AppError 
} from '../types';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  parseQRCodeData,
  getCurrentTimestamp 
} from '../utils';
import { db } from '../services/database';
import { lineService } from '../services/line';

const router = Router();

/**
 * POST /api/check-in
 * Handle store check-in via QR code
 */
router.post('/check-in', async (req: Request, res: Response) => {
  try {
    const { lineUserId, storeId }: CheckInRequest = req.body;

    if (!lineUserId || !storeId) {
      return res.status(400).json(
        createErrorResponse('LINE IDと店舗IDが必要です')
      );
    }

    // Get user by LINE ID
    const user = await db.getUserByLineId(lineUserId);
    if (!user) {
      return res.status(404).json(
        createErrorResponse('ユーザーが見つかりません。アカウント連携を完了してください。')
      );
    }

    // Verify store exists
    const store = await db.getStoreById(storeId);
    if (!store) {
      return res.status(404).json(
        createErrorResponse('指定された店舗が見つかりません')
      );
    }

    // Check if user has already checked in today at this store
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const existingVisits = await db.getVisitsByUserId(user.id, {
      dateFrom: `${today}T00:00:00Z`,
      dateTo: `${today}T23:59:59Z`,
    });

    const todayVisitAtStore = existingVisits.find(visit => visit.store_id === storeId);
    if (todayVisitAtStore) {
      return res.status(409).json(
        createErrorResponse('本日は既にこの店舗にチェックインしています')
      );
    }

    // Create visit record
    const visit = await db.createVisit({
      user_id: user.id,
      store_id: storeId,
      check_in_at: getCurrentTimestamp(),
    });

    // Send check-in notification (non-blocking)
    lineService.sendCheckinNotification(lineUserId, store.name)
      .catch(error => {
        console.warn('Failed to send check-in notification:', error);
      });

    res.status(201).json(
      createSuccessResponse(
        { visitId: visit.id },
        `${store.name}へのチェックインが完了しました`
      )
    );

  } catch (error) {
    console.error('Check-in error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('チェックイン処理中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/submit-visit-survey
 * Submit visit survey data
 */
router.post('/submit-visit-survey', async (req: Request, res: Response) => {
  try {
    const { 
      visitId, 
      visitType, 
      visitPurpose, 
      companionIndustries, 
      companionJobTypes 
    }: SubmitVisitSurveyRequest = req.body;

    if (!visitId || !visitType || !visitPurpose) {
      return res.status(400).json(
        createErrorResponse('必須項目が不足しています')
      );
    }

    // Verify visit exists
    const visit = await db.getVisitById(visitId);
    if (!visit) {
      return res.status(404).json(
        createErrorResponse('指定された来店記録が見つかりません')
      );
    }

    // Update visit with survey data
    const updatedVisit = await db.updateVisit(visitId, {
      visit_type: visitType === '１人です' ? 'single' : 'group',
      visit_purpose: visitPurpose,
      companion_industries: visitType === '１人です' ? [] : companionIndustries,
      companion_job_types: visitType === '１人です' ? [] : companionJobTypes,
    });

    res.json(
      createSuccessResponse(
        { visitId: updatedVisit.id },
        'アンケートの送信が完了しました'
      )
    );

  } catch (error) {
    console.error('Visit survey submission error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('アンケート送信中にエラーが発生しました')
    );
  }
});

/**
 * GET /api/membership-card
 * Get membership card data for a user
 */
router.get('/membership-card', async (req: Request, res: Response) => {
  try {
    const { lineUserId } = req.query;

    if (!lineUserId || typeof lineUserId !== 'string') {
      return res.status(400).json(
        createErrorResponse('LINE IDが必要です')
      );
    }

    // Get membership card data
    const cardData = await db.getMembershipCardData(lineUserId);
    if (!cardData) {
      return res.status(404).json(
        createErrorResponse('会員証データが見つかりません。アカウント連携を完了してください。')
      );
    }

    // Get LINE profile for updated avatar/name
    try {
      const lineProfile = await lineService.getUserProfile(lineUserId);
      cardData.profile = {
        name: lineProfile.displayName,
        avatarUrl: lineProfile.pictureUrl || cardData.profile.avatarUrl,
      };
    } catch (error) {
      console.warn('Failed to get LINE profile:', error);
      // Use existing profile data
    }

    res.json(
      createSuccessResponse(cardData, '会員証データを取得しました')
    );

  } catch (error) {
    console.error('Membership card data error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('会員証データの取得中にエラーが発生しました')
    );
  }
});

/**
 * GET /api/visit-history
 * Get visit history for a user
 */
router.get('/visit-history', async (req: Request, res: Response) => {
  try {
    const { lineUserId, page = '1', limit = '50' } = req.query;

    if (!lineUserId || typeof lineUserId !== 'string') {
      return res.status(400).json(
        createErrorResponse('LINE IDが必要です')
      );
    }

    // Get user by LINE ID
    const user = await db.getUserByLineId(lineUserId);
    if (!user) {
      return res.status(404).json(
        createErrorResponse('ユーザーが見つかりません。アカウント連携を完了してください。')
      );
    }

    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Get visit history
    const visits = await db.getVisitsByUserId(user.id, {
      limit: limitNum,
      offset,
    });

    // Transform data for frontend
    const visitHistory = visits.map(visit => ({
      id: visit.id,
      storeName: (visit as any).stores?.name || 'Unknown Store',
      checkInAt: visit.check_in_at,
      visitPurpose: visit.visit_purpose,
      visitType: visit.visit_type,
    }));

    res.json(
      createSuccessResponse(visitHistory, '来店履歴を取得しました')
    );

  } catch (error) {
    console.error('Visit history error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('来店履歴の取得中にエラーが発生しました')
    );
  }
});

/**
 * GET /api/user/profile
 * Get user profile information
 */
router.get('/user/profile', async (req: Request, res: Response) => {
  try {
    const { lineUserId } = req.query;

    if (!lineUserId || typeof lineUserId !== 'string') {
      return res.status(400).json(
        createErrorResponse('LINE IDが必要です')
      );
    }

    // Get user by LINE ID
    const user = await db.getUserByLineId(lineUserId);
    if (!user) {
      return res.status(404).json(
        createErrorResponse('ユーザーが見つかりません')
      );
    }

    // Get user profile
    const userProfile = await db.getUserProfile(user.id);
    
    // Get survey data
    const survey = await db.getSurveyByUserId(user.id);

    // Get LINE profile
    let lineProfile = null;
    try {
      lineProfile = await lineService.getUserProfile(lineUserId);
    } catch (error) {
      console.warn('Failed to get LINE profile:', error);
    }

    const profileData = {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        birthDate: user.birth_date,
        createdAt: user.created_at,
      },
      profile: userProfile,
      survey,
      lineProfile,
    };

    res.json(
      createSuccessResponse(profileData, 'プロフィール情報を取得しました')
    );

  } catch (error) {
    console.error('User profile error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('プロフィール情報の取得中にエラーが発生しました')
    );
  }
});

/**
 * PUT /api/user/profile
 * Update user profile information
 */
router.put('/user/profile', async (req: Request, res: Response) => {
  try {
    const { lineUserId, updates } = req.body;

    if (!lineUserId) {
      return res.status(400).json(
        createErrorResponse('LINE IDが必要です')
      );
    }

    // Get user by LINE ID
    const user = await db.getUserByLineId(lineUserId);
    if (!user) {
      return res.status(404).json(
        createErrorResponse('ユーザーが見つかりません')
      );
    }

    // Update user information
    const updatedUser = await db.updateUser(user.id, {
      phone: updates.phone,
      gender: updates.gender,
    });

    res.json(
      createSuccessResponse(
        { userId: updatedUser.id },
        'プロフィール情報を更新しました'
      )
    );

  } catch (error) {
    console.error('User profile update error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('プロフィール更新中にエラーが発生しました')
    );
  }
});

/**
 * GET /api/stores
 * Get all available stores
 */
router.get('/stores', async (req: Request, res: Response) => {
  try {
    const stores = await db.getAllStores();

    res.json(
      createSuccessResponse(stores, '店舗一覧を取得しました')
    );

  } catch (error) {
    console.error('Stores retrieval error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('店舗一覧の取得中にエラーが発生しました')
    );
  }
});

/**
 * GET /api/stores/:storeId
 * Get specific store information
 */
router.get('/stores/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;

    if (!storeId) {
      return res.status(400).json(
        createErrorResponse('店舗IDが必要です')
      );
    }

    const store = await db.getStoreById(storeId);
    if (!store) {
      return res.status(404).json(
        createErrorResponse('指定された店舗が見つかりません')
      );
    }

    res.json(
      createSuccessResponse(store, '店舗情報を取得しました')
    );

  } catch (error) {
    console.error('Store retrieval error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('店舗情報の取得中にエラーが発生しました')
    );
  }
});

export default router;