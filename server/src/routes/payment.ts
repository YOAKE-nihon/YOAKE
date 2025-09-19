import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { stripeService } from '../services/stripe';
import { db } from '../services/database';
import { 
  CreatePaymentIntentRequest, 
  AppError,
  AuthenticatedRequest 
} from '../types';
import { 
  createSuccessResponse, 
  createErrorResponse,
  validateEmail 
} from '../utils';
import { 
  rateLimitMiddleware,
  strictRateLimitMiddleware,
  asyncWrapper 
} from '../middleware';

const router = Router();

/**
 * POST /api/create-payment-intent
 * Create a payment intent for membership fee
 */
router.post('/create-payment-intent', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount, email, stripeCustomerId }: CreatePaymentIntentRequest = req.body;

      if (!amount || !email) {
        res.status(400).json(createErrorResponse('金額とメールアドレスが必要です'));
        return;
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        res.status(400).json(createErrorResponse(emailValidation.errors[0]?.message || '無効なメールアドレス'));
        return;
      }

      const user = await db.getUserByEmail(email);
      if (!user) {
        res.status(404).json(createErrorResponse('ユーザーが見つかりません'));
        return;
      }

      let customerId = stripeCustomerId || user.stripe_customer_id;

      if (!customerId) {
        const customer = await stripeService.createCustomer({
          email: user.email,
          phone: user.phone,
          metadata: {
            userId: user.id,
            source: 'yoake_payment',
          },
        });

        customerId = customer.id;
        await db.updateUser(user.id, { stripe_customer_id: customerId });
      }

      const paymentIntent = await stripeService.createPaymentIntent({
        amount: Math.round(amount),
        customerId,
        description: 'YOAKE会員費',
        metadata: {
          userId: user.id,
          email: user.email,
          type: 'membership_fee',
        },
      });

      res.json(createSuccessResponse(
        {
          clientSecret: paymentIntent.client_secret,
          customerId,
          amount: paymentIntent.amount,
        },
        '決済準備が完了しました'
      ));

    } catch (error) {
      console.error('Payment intent creation error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('決済準備中にエラーが発生しました'));
    }
  })
);

/**
 * POST /api/create-subscription
 * Create a subscription for recurring payments (future feature)
 */
router.post('/create-subscription', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId, priceId } = req.body;

      if (!customerId || !priceId) {
        res.status(400).json(createErrorResponse('顧客IDと価格IDが必要です'));
        return;
      }

      const subscription = await stripeService.createSubscription({
        customerId,
        priceId,
        metadata: {
          service: 'yoake_subscription',
        },
      });

      let clientSecret = null;
      if (subscription.latest_invoice) {
        if (typeof subscription.latest_invoice === 'object' && 
            'payment_intent' in subscription.latest_invoice && 
            subscription.latest_invoice.payment_intent) {
          const paymentIntent = subscription.latest_invoice.payment_intent as Stripe.PaymentIntent;
          clientSecret = paymentIntent.client_secret;
        }
      }

      res.json(createSuccessResponse(
        {
          subscriptionId: subscription.id,
          clientSecret,
        },
        'サブスクリプションが作成されました'
      ));

    } catch (error) {
      console.error('Subscription creation error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('サブスクリプション作成中にエラーが発生しました'));
    }
  })
);

/**
 * GET /api/payment-methods/:customerId
 * Get customer's saved payment methods
 */
router.get('/payment-methods/:customerId', 
  rateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        res.status(400).json(createErrorResponse('顧客IDが必要です'));
        return;
      }

      const customer = await stripeService.getCustomer(customerId);
      if (!customer) {
        res.status(404).json(createErrorResponse('顧客が見つかりません'));
        return;
      }

      const paymentMethods = await stripeService.getPaymentMethods(customerId);

      res.json(createSuccessResponse(
        { paymentMethods },
        '支払い方法を取得しました'
      ));

    } catch (error) {
      console.error('Payment methods retrieval error:', error);

      if (error instanceof AppError) {
        res.status(error.statusCode).json(createErrorResponse(error.message));
        return;
      }

      res.status(500).json(createErrorResponse('支払い方法の取得中にエラーが発生しました'));
    }
  })
);

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhooks
 */
router.post('/webhook/stripe',
  strictRateLimitMiddleware,
  asyncWrapper(async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        res.status(400).json(createErrorResponse('Webhook署名が無効です'));
        return;
      }

      const event = stripeService.validateWebhookSignature(
        req.body,
        signature,
        webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentSuccess(paymentIntent);
          break;

        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await handlePaymentFailure(failedPayment);
          break;

        case 'customer.subscription.created':
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCreated(subscription);
          break;

        case 'customer.subscription.deleted':
          const deletedSubscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(deletedSubscription);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(400).json(createErrorResponse('Webhook処理中にエラーが発生しました'));
    }
  })
);

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const userId = paymentIntent.metadata?.userId;
    if (userId) {
      console.log(`Payment succeeded for user ${userId}: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const userId = paymentIntent.metadata?.userId;
    if (userId) {
      console.log(`Payment failed for user ${userId}: ${paymentIntent.id}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  try {
    console.log(`Subscription created: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription creation:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  try {
    console.log(`Subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

export default router;