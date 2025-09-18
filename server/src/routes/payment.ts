import { Router, Request, Response } from 'express';
import { CreatePaymentIntentRequest, AppError } from '../types';
import { createSuccessResponse, createErrorResponse } from '../utils';
import { stripeService } from '../services/stripe';
import { db } from '../services/database';

const router = Router();

/**
 * POST /api/create-payment-intent
 * Create a payment intent for membership fee
 */
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amount, email, stripeCustomerId }: CreatePaymentIntentRequest = req.body;

    // Validate input
    if (!amount || !email || !stripeCustomerId) {
      return res.status(400).json(
        createErrorResponse('金額、メールアドレス、顧客IDが必要です')
      );
    }

    if (amount <= 0) {
      return res.status(400).json(
        createErrorResponse('金額は0より大きい値である必要があります')
      );
    }

    // Verify customer exists in Stripe
    const customer = await stripeService.getCustomer(stripeCustomerId);
    if (!customer) {
      return res.status(404).json(
        createErrorResponse('指定された顧客が見つかりません')
      );
    }

    // Verify customer email matches
    if (customer.email !== email) {
      return res.status(400).json(
        createErrorResponse('顧客情報が一致しません')
      );
    }

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: Math.round(amount), // Ensure integer amount
      currency: 'jpy',
      customerId: stripeCustomerId,
      description: 'YOAKE月額会員費',
      metadata: {
        email,
        service: 'yoake_membership',
        type: 'monthly_fee',
      },
    });

    res.json(
      createSuccessResponse(
        { 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id 
        },
        '決済準備が完了しました'
      )
    );

  } catch (error) {
    console.error('Payment intent creation error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('決済準備中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/create-subscription
 * Create a subscription for recurring payments (future feature)
 */
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    const { customerId, priceId } = req.body;

    if (!customerId || !priceId) {
      return res.status(400).json(
        createErrorResponse('顧客IDと価格IDが必要です')
      );
    }

    // Create subscription
    const subscription = await stripeService.createSubscription({
      customerId,
      priceId,
      metadata: {
        service: 'yoake_subscription',
      },
    });

    res.json(
      createSuccessResponse(
        {
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        },
        'サブスクリプションが作成されました'
      )
    );

  } catch (error) {
    console.error('Subscription creation error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('サブスクリプション作成中にエラーが発生しました')
    );
  }
});

/**
 * GET /api/payment-methods/:customerId
 * Get customer's saved payment methods
 */
router.get('/payment-methods/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json(
        createErrorResponse('顧客IDが必要です')
      );
    }

    // Verify customer exists
    const customer = await stripeService.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json(
        createErrorResponse('指定された顧客が見つかりません')
      );
    }

    // Get payment methods
    const paymentMethods = await stripeService.getCustomerPaymentMethods(customerId);

    res.json(
      createSuccessResponse(
        { paymentMethods },
        '支払い方法を取得しました'
      )
    );

  } catch (error) {
    console.error('Payment methods retrieval error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('支払い方法の取得中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/setup-intent
 * Create a setup intent for saving payment method
 */
router.post('/setup-intent', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json(
        createErrorResponse('顧客IDが必要です')
      );
    }

    // Verify customer exists
    const customer = await stripeService.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json(
        createErrorResponse('指定された顧客が見つかりません')
      );
    }

    // Create setup intent
    const setupIntent = await stripeService.createSetupIntent(customerId);

    res.json(
      createSuccessResponse(
        { 
          clientSecret: setupIntent.client_secret,
          setupIntentId: setupIntent.id 
        },
        '支払い方法の設定準備が完了しました'
      )
    );

  } catch (error) {
    console.error('Setup intent creation error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('支払い方法設定の準備中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/billing-portal
 * Create billing portal session for customer
 */
router.post('/billing-portal', async (req: Request, res: Response) => {
  try {
    const { customerId, returnUrl } = req.body;

    if (!customerId || !returnUrl) {
      return res.status(400).json(
        createErrorResponse('顧客IDと戻り先URLが必要です')
      );
    }

    // Verify customer exists
    const customer = await stripeService.getCustomer(customerId);
    if (!customer) {
      return res.status(404).json(
        createErrorResponse('指定された顧客が見つかりません')
      );
    }

    // Create billing portal session
    const session = await stripeService.createBillingPortalSession({
      customerId,
      returnUrl,
    });

    res.json(
      createSuccessResponse(
        { url: session.url },
        '課金ポータルセッションが作成されました'
      )
    );

  } catch (error) {
    console.error('Billing portal creation error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('課金ポータルの作成中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/refund
 * Create a refund for a payment
 */
router.post('/refund', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json(
        createErrorResponse('決済IDが必要です')
      );
    }

    // Verify payment intent exists
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);
    if (!paymentIntent) {
      return res.status(404).json(
        createErrorResponse('指定された決済が見つかりません')
      );
    }

    // Create refund
    const refund = await stripeService.createRefund({
      paymentIntentId,
      amount: amount ? Math.round(amount) : undefined,
      reason: reason || 'requested_by_customer',
      metadata: {
        refunded_by: 'admin', // In a real app, this would be the admin user ID
        refund_date: new Date().toISOString(),
      },
    });

    res.json(
      createSuccessResponse(
        { 
          refundId: refund.id,
          amount: refund.amount,
          status: refund.status 
        },
        '返金処理が完了しました'
      )
    );

  } catch (error) {
    console.error('Refund creation error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(500).json(
      createErrorResponse('返金処理中にエラーが発生しました')
    );
  }
});

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhook events
 */
router.post('/webhook/stripe', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !endpointSecret) {
      return res.status(400).json(
        createErrorResponse('Webhook signature verification failed')
      );
    }

    // Verify webhook signature
    const event = await stripeService.processWebhook(
      req.body,
      signature,
      endpointSecret
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await stripeService.handleSuccessfulPayment(event.data.object as any);
        console.log('Payment succeeded:', event.data.object.id);
        break;

      case 'payment_intent.payment_failed':
        await stripeService.handleFailedPayment(event.data.object as any);
        console.log('Payment failed:', event.data.object.id);
        break;

      case 'customer.subscription.created':
        console.log('Subscription created:', event.data.object.id);
        break;

      case 'customer.subscription.updated':
        console.log('Subscription updated:', event.data.object.id);
        break;

      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object.id);
        break;

      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object.id);
        break;

      case 'invoice.payment_failed':
        console.log('Invoice payment failed:', event.data.object.id);
        break;

      default:
        console.log('Unhandled Stripe event type:', event.type);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);

    if (error instanceof AppError) {
      return res.status(error.statusCode).json(
        createErrorResponse(error.message)
      );
    }

    res.status(400).json(
      createErrorResponse('Webhook処理中にエラーが発生しました')
    );
  }
});

export default router;