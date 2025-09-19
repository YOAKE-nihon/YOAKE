import { Router, Request, Response } from 'express';
import { 
  CheckInRequest, 
  SubmitVisitSurveyRequest,
  AppError,
  Visit
} from '../types';
import { 
  createSuccessResponse, 
  createErrorResponse,
  parseQRData,
  getCurrentTimestamp,
  validateQRData
} from '../utils';
import { db } from '../services/database';
import { lineService } from '../services/line';
import { 
  rateLimitMiddleware,
  asyncWrapper 
} from '../middleware';

const router = Router();

/**
 * POST /api/check-in
 * Check in to a store using QR code data
 */
router.post('/check-in', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { lineUserId, storeId }: CheckInRequest = req.body;

      if (!lineUserId || !storeId) {
        res.status(400).json(createErrorResponse('LINE IDと店舗IDが必要です'));
        return;
      }

      // Get user by LINE ID
      const user = await db.getUserByLineId(lineUserId);
      if (!user) {
        res.status(404).json(createErrorResponse('ユーザーが見つかりません。アカウント連携を完了してください。'));
        return;
      }

      // Verify store exists
      const store = await db.getStoreById(storeId);
      if (!store) {
        res.status(404).json(createErrorResponse('店舗が見つかりません'));
        return;
      }

      // Check for duplicate check-in within last hour
      const recentVisits = await db.getVisitsByUserId(user.id, 1);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentVisit = recentVisits.find((visit: Visit) => {
        const visitTime = new Date(visit.check_in_at);
        return visit.store_id === storeId && visitTime > oneHourAgo;
      });

      if (recentVisit) {
        res.status(409).json(createErrorResponse('同じ店舗への1時間以内の重複チェックインはできません'));
        return;
      }

      // Create visit record
      const visit = await db.createVisit({
        user_id: user.id,
        store_id: storeId,
        check_in_at: getCurrentTimestamp(),
      });

      res.status(201).json(
        createSuccessResponse(
          {
            visitId: visit.id,
            storeName: store.name,
            checkInTime: visit.check_in_at,
          },
          `${store.name}にチェックインしました`
        )
      );

    } catch (error) {
      console.error('Check-in error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('チェックイン中にエラーが発生しました'));
    }
  })
);

/**
 * POST /api/submit-visit-survey
 * Submit survey data for a visit
 */
router.post('/submit-visit-survey', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { 
        visitId, 
        visitType, 
        visitPurpose, 
        companionIndustries, 
        companionJobTypes 
      }: SubmitVisitSurveyRequest = req.body;

      if (!visitId || !visitType || !visitPurpose) {
        res.status(400).json(createErrorResponse('必須項目が不足しています'));
        return;
      }

      // Verify visit exists
      const existingVisit = await db.getVisitById(visitId);
      if (!existingVisit) {
        res.status(404).json(createErrorResponse('来店記録が見つかりません'));
        return;
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
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('アンケート送信中にエラーが発生しました'));
    }
  })
);

/**
 * GET /api/membership-card
 * Get membership card data for a user
 */
router.get('/membership-card', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { lineUserId } = req.query;

      if (!lineUserId || typeof lineUserId !== 'string') {
        res.status(400).json(createErrorResponse('LINE IDが必要です'));
        return;
      }

      // Get membership card data
      const cardData = await db.getMembershipCardData(lineUserId);
      if (!cardData) {
        res.status(404).json(createErrorResponse('会員証データが見つかりません。アカウント連携を完了してください。'));
        return;
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

      res.json(createSuccessResponse(cardData, '会員証データを取得しました'));

    } catch (error) {
      console.error('Membership card data error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('会員証データの取得中にエラーが発生しました'));
    }
  })
);

/**
 * GET /api/visit-history
 * Get visit history for a user
 */
router.get('/visit-history', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { lineUserId } = req.query;

      if (!lineUserId || typeof lineUserId !== 'string') {
        res.status(400).json(createErrorResponse('LINE IDが必要です'));
        return;
      }

      // Get user by LINE ID
      const user = await db.getUserByLineId(lineUserId);
      if (!user) {
        res.status(404).json(createErrorResponse('ユーザーが見つかりません。アカウント連携を完了してください。'));
        return;
      }

      // Get visit history
      const visits = await db.getVisitsByUserId(user.id);

      // Format visits for response
      const formattedVisits = visits.map((visit: Visit) => ({
        id: visit.id,
        storeName: (visit as any).stores?.name || '不明な店舗',
        checkInAt: visit.check_in_at,
        visitType: visit.visit_type,
        visitPurpose: visit.visit_purpose,
        companionIndustries: visit.companion_industries || [],
        companionJobTypes: visit.companion_job_types || [],
      }));

      res.json(createSuccessResponse(
        { visits: formattedVisits },
        '来店履歴を取得しました'
      ));

    } catch (error) {
      console.error('Visit history error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('来店履歴の取得中にエラーが発生しました'));
    }
  })
);

/**
 * GET /api/stores
 * Get list of available stores
 */
router.get('/stores', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const stores = await db.getStores();

      res.json(createSuccessResponse(
        { stores },
        '店舗一覧を取得しました'
      ));

    } catch (error) {
      console.error('Stores list error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('店舗一覧の取得中にエラーが発生しました'));
    }
  })
);

/**
 * POST /api/validate-qr
 * Validate QR code data
 */
router.post('/validate-qr', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { qrData } = req.body;

      if (!qrData) {
        res.status(400).json(createErrorResponse('QRコードデータが必要です'));
        return;
      }

      // Parse and validate QR data
      const parsedData = parseQRData(qrData);
      const isValid = validateQRData(parsedData);

      if (!isValid || !parsedData) {
        res.status(400).json(createErrorResponse('無効なQRコードです'));
        return;
      }

      // Verify store exists
      const store = await db.getStoreById(parsedData.store_id);
      if (!store) {
        res.status(404).json(createErrorResponse('店舗が見つかりません'));
        return;
      }

      res.json(createSuccessResponse(
        {
          storeId: parsedData.store_id,
          storeName: store.name,
          storeAddress: store.address,
          isValid: true,
        },
        'QRコードが有効です'
      ));

    } catch (error) {
      console.error('QR validation error:', error);

      res.status(500).json(createErrorResponse('QRコードの検証中にエラーが発生しました'));
    }
  })
);

export default router;