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
  addHours
} from '../utils';
import { db } from '../services/database';
import { stripeService } from '../services/stripe';
import { lineService } from '../services/line';
import { 
  rateLimitMiddleware,
  strictRateLimitMiddleware,
  asyncWrapper 
} from '../middleware';

const router = Router();

/**
 * POST /api/register
 * Register a new user with survey data and create Stripe customer
 */
router.post('/register', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { idToken, surveyData }: RegisterRequest = req.body;

      if (!idToken || !surveyData) {
        res.status(400).json(createErrorResponse('IDトークンとアンケートデータが必要です'));
        return;
      }

      // Validate survey data
      const validation = validateRegistrationData(surveyData);
      if (!validation.isValid) {
        res.status(400).json(createErrorResponse(
          validation.errors.map(e => e.message).join(', ')
        ));
        return;
      }

      // Verify LINE ID token
      const lineProfile = await lineService.verifyIdToken(idToken);
      if (!lineProfile) {
        res.status(401).json(createErrorResponse('無効なIDトークンです'));
        return;
      }

      // Check if user already exists
      const existingUser = await db.getUserByEmail(surveyData.email);
      if (existingUser) {
        res.status(409).json(createErrorResponse('このメールアドレスは既に登録されています'));
        return;
      }

      // Create Stripe customer
      const stripeCustomer = await stripeService.createCustomer({
        email: surveyData.email,
        phone: surveyData.phone,
        metadata: {
          lineUserId: lineProfile.sub,
          registrationSource: 'yoake_app',
        },
      });

      // Create user in database
      const userData = {
        email: surveyData.email,
        phone: surveyData.phone,
        gender: surveyData.gender,
        birth_date: surveyData.birthDate,
        line_user_id: lineProfile.sub,
        stripe_customer_id: stripeCustomer.id,
      };

      const user = await db.createUser(userData);

      // Create user profile
      const profileData = {
        user_id: user.id,
        industry: surveyData.industry,
        job_type: surveyData.jobType,
        experience_years: surveyData.experienceYears,
      };

      await db.createProfile(profileData);

      // Create survey responses
      const surveyResponse = {
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
      };

      await db.createSurvey(surveyResponse);

      res.status(201).json(
        createSuccessResponse(
          {
            userId: user.id,
            stripeCustomerId: stripeCustomer.id,
            email: user.email,
          },
          'ユーザー登録が完了しました'
        )
      );

    } catch (error) {
      console.error('Registration error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('登録中にエラーが発生しました'));
    }
  })
);

/**
 * POST /api/link-line-account
 * Link LINE account to existing user account
 */
router.post('/link-line-account', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, lineUserId }: LinkLineAccountRequest = req.body;

      if (!email || !lineUserId) {
        res.status(400).json(createErrorResponse('メールアドレスとLINE IDが必要です'));
        return;
      }

      // Check if LINE account is already linked
      const existingLineUser = await db.getUserByLineId(lineUserId);
      if (existingLineUser) {
        res.status(409).json(createErrorResponse('このLINEアカウントは既に連携されています'));
        return;
      }

      // Link the accounts
      const linkedUser = await db.linkLineAccount(email, lineUserId);

      res.json(
        createSuccessResponse(
          { 
            userId: linkedUser.id,
            email: linkedUser.email,
            lineLinked: true,
          },
          'LINEアカウントの連携が完了しました'
        )
      );

    } catch (error) {
      console.error('Account linking error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('アカウント連携中にエラーが発生しました'));
    }
  })
);

/**
 * POST /api/request-password-reset
 * Request password reset (future feature)
 */
router.post('/request-password-reset', 
  strictRateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email }: PasswordResetRequest = req.body;

      if (!email) {
        res.status(400).json(createErrorResponse('メールアドレスが必要です'));
        return;
      }

      // Check if user exists
      const user = await db.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        res.json(
          createSuccessResponse(
            {},
            'パスワードリセットメールを送信しました（該当するアカウントが存在する場合）'
          )
        );
        return;
      }

      // Generate reset token
      const resetToken = generateSecureToken();
      const expiresAt = addHours(new Date(), 1); // 1 hour expiration

      // Save reset token
      await db.setPasswordResetToken(email, resetToken, expiresAt);

      // TODO: Send email with reset link
      // await emailService.sendPasswordResetEmail(email, resetToken);

      res.json(
        createSuccessResponse(
          {},
          'パスワードリセットメールを送信しました'
        )
      );

    } catch (error) {
      console.error('Password reset request error:', error);

      res.status(500).json(createErrorResponse('パスワードリセット要求中にエラーが発生しました'));
    }
  })
);

/**
 * POST /api/update-password
 * Update password using reset token (future feature)
 */
router.post('/update-password', 
  strictRateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword }: UpdatePasswordRequest = req.body;

      if (!token || !newPassword) {
        res.status(400).json(createErrorResponse('トークンと新しいパスワードが必要です'));
        return;
      }

      // Verify reset token
      const user = await db.verifyPasswordResetToken(token);
      if (!user) {
        res.status(400).json(createErrorResponse('無効または期限切れのトークンです'));
        return;
      }

      // TODO: Hash and update password
      // const hashedPassword = await hashPassword(newPassword);
      // await db.updateUser(user.id, { password: hashedPassword });

      // Clear reset token
      await db.clearPasswordResetToken(user.id);

      res.json(
        createSuccessResponse(
          {},
          'パスワードが更新されました'
        )
      );

    } catch (error) {
      console.error('Password update error:', error);

      res.status(500).json(createErrorResponse('パスワード更新中にエラーが発生しました'));
    }
  })
);

export default router;