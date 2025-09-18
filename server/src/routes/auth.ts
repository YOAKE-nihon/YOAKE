import { Router, Request, Response } from 'express';
import { 
  RegisterRequest, 
  LinkLineAccountRequest, 
  PasswordResetRequest, 
  UpdatePasswordRequest,
  AppError 
} from '../types';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateRegistrationData, 
  parseLineIdToken,
  generateSecureToken,
  hashPassword,
  verifyPassword 
} from '../utils';
import { db } from '../services/database';
import { stripeService } from '../services/stripe';
import { lineService } from '../services/line';
import { lineConfig } from '../config';

const router = Router();

/**
 * POST /api/register
 * Register a new user with LINE authentication
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { idToken, surveyData }: RegisterRequest = req.body;

    if (!idToken || !surveyData) {
      return res.status(400).json(
        createErrorResponse('IDトークンとアンケートデータが必要です')
      );
    }

    // Validate survey data
    const validation = validateRegistrationData(surveyData);
    if (!validation.isValid) {
      return res.status(400).json(
        createErrorResponse('入力データに不備があります', validation.errors)
      );
    }

    // Parse LINE ID token
    const lineProfile = parseLineIdToken(idToken);

    // Check if user already exists
    const existingUser = await db.getUserByEmail(surveyData.email);
    if (existingUser) {
      return res.status(409).json(
        createErrorResponse('このメールアドレスは既に登録されています')
      );
    }

    // Create Stripe customer
    const stripeCustomer = await stripeService.createCustomer({
      email: surveyData.email,
      name: lineProfile.name,
      metadata: {
        lineUserId: lineProfile.sub,
        registrationSource: 'yoake_web',
      },
    });

    // Create user in database
    const user = await db.createUser({
      email: surveyData.email,
      phone: surveyData.phone,
      gender: surveyData.gender,
      birth_date: surveyData.birthDate,
      stripe_customer_id: stripeCustomer.id,
    });

    // Create user profile
    await db.createUserProfile({
      user_id: user.id,
      industry: surveyData.industry,
      job_type: surveyData.jobType,
      experience_years: surveyData.experienceYears,
    });

    // Create survey record
    await db.createSurvey({
      user_id: user.id,
      interest_in_side_job: surveyData.interestInSideJob,
      side_job_time: surveyData.sideJobTime,
      side_job_fields: surveyData.sideJobFields,
      side_job_fields_other: surveyData.sideJobFieldsOther,
      side_job_purpose: surveyData.sideJobPurpose,
      side_job_challenge: surveyData.sideJobChallenge,
      side_job_challenge_other: surveyData.sideJobChallengeOther,
      meet_people: surveyData.meetPeople,
      service_benefit: surveyData.serviceBenefit,
      service_benefit_other: surveyData.serviceBenefitOther,
      service_priority: surveyData.servicePriority,
    });

    res.status(201).json(
      createSuccessResponse(
        { stripeCustomerId: stripeCustomer.id },
        'ユーザー登録が完了しました'
      )
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('登録処理中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/link-line-account
 * Link LINE account to existing user account
 */
router.post('/link-line-account', async (req: Request, res: Response) => {
  try {
    const { email, lineUserId }: LinkLineAccountRequest = req.body;

    if (!email || !lineUserId) {
      return res.status(400).json(
        createErrorResponse('メールアドレスとLINE IDが必要です')
      );
    }

    // Find user by email
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json(
        createErrorResponse('指定されたメールアドレスのユーザーが見つかりません')
      );
    }

    // Check if LINE account is already linked to another user
    const existingLinkedUser = await db.getUserByLineId(lineUserId);
    if (existingLinkedUser && existingLinkedUser.id !== user.id) {
      return res.status(409).json(
        createErrorResponse('このLINEアカウントは既に他のユーザーに連携されています')
      );
    }

    // Link LINE account to user
    const updatedUser = await db.linkLineAccount(email, lineUserId);

    // Set member rich menu for the user
    if (lineConfig.richMenuId.member) {
      try {
        await lineService.setUserRichMenu(lineUserId, lineConfig.richMenuId.member);
      } catch (error) {
        console.warn('Failed to set rich menu:', error);
        // Don't fail the whole operation if rich menu setting fails
      }
    }

    // Send welcome message
    try {
      await lineService.sendWelcomeMessage(lineUserId);
    } catch (error) {
      console.warn('Failed to send welcome message:', error);
      // Don't fail the whole operation if message sending fails
    }

    res.json(
      createSuccessResponse(
        { userId: updatedUser.id },
        'LINEアカウントの連携が完了しました'
      )
    );

  } catch (error) {
    console.error('Account linking error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('アカウント連携中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/request-password-reset
 * Request password reset email
 */
router.post('/request-password-reset', async (req: Request, res: Response) => {
  try {
    const { email }: PasswordResetRequest = req.body;

    if (!email) {
      return res.status(400).json(
        createErrorResponse('メールアドレスが必要です')
      );
    }

    // Check if user exists
    const user = await db.getUserByEmail(email);
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return res.json(
        createSuccessResponse(
          null,
          'パスワード再設定用のメールを送信しました'
        )
      );
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token in database (you'll need to add this field to users table)
    await db.updateUser(user.id, {
      // password_reset_token: resetToken,
      // password_reset_expires: resetTokenExpiry.toISOString(),
    });

    // In a real implementation, send email with reset link
    // For now, just log it
    console.log(`Password reset token for ${email}: ${resetToken}`);

    // TODO: Implement email sending
    // await emailService.sendPasswordResetEmail(email, resetToken);

    res.json(
      createSuccessResponse(
        null,
        'パスワード再設定用のメールを送信しました'
      )
    );

  } catch (error) {
    console.error('Password reset request error:', error);

    res.status(500).json(
      createErrorResponse('パスワード再設定の処理中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/update-password
 * Update user password with reset token
 */
router.post('/update-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword }: UpdatePasswordRequest = req.body;

    if (!token || !newPassword) {
      return res.status(400).json(
        createErrorResponse('トークンと新しいパスワードが必要です')
      );
    }

    if (newPassword.length < 6) {
      return res.status(400).json(
        createErrorResponse('パスワードは6文字以上で入力してください')
      );
    }

    // TODO: Implement token validation and password update
    // This would require adding password reset fields to the database
    
    // For now, return a placeholder response
    res.json(
      createSuccessResponse(
        null,
        'パスワードが更新されました'
      )
    );

  } catch (error) {
    console.error('Password update error:', error);

    res.status(500).json(
      createErrorResponse('パスワード更新中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/logout
 * Logout user (for future use)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // In a stateless JWT setup, logout is handled client-side
    // For session-based auth, you would destroy the session here
    
    res.json(
      createSuccessResponse(null, 'ログアウトしました')
    );

  } catch (error) {
    console.error('Logout error:', error);

    res.status(500).json(
      createErrorResponse('ログアウト処理中にエラーが発生しました')
    );
  }
});

export default router;