import Stripe from 'stripe';
import { stripeConfig } from '../config';
import { AppError } from '../types';

class StripeService {
  private stripe: Stripe;

  constructor() {
    if (!stripeConfig.secretKey) {
      throw new Error('Stripe secret key is required');
    }

    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Create a new Stripe customer
   */
  async createCustomer(params: {
    email: string;
    name?: string;
    phone?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: {
          source: 'yoake_registration',
          ...params.metadata,
        },
      });

      return customer;
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      throw new AppError('顧客の作成に失敗しました', 500);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return null;
      }

      return customer as Stripe.Customer;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw new AppError('顧客情報の取得に失敗しました', 500);
    }
  }

  /**
   * Create a payment intent for one-time payment
   */
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    customerId: string;
    metadata?: Record<string, string>;
    description?: string;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency || 'jpy',
        customer: params.customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        description: params.description || 'YOAKE会員費',
        metadata: {
          service: 'yoake',
          type: 'membership_fee',
          ...params.metadata,
        },
      });

      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent creation error:', error);
      throw new AppError('決済の準備に失敗しました', 500);
    }
  }

  /**
   * Create a subscription for recurring payments
   */
  async createSubscription(params: {
    customerId: string;
    priceId: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: params.customerId,
        items: [
          {
            price: params.priceId,
          },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          service: 'yoake',
          ...params.metadata,
        },
      });

      return subscription;
    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      throw new AppError('サブスクリプションの作成に失敗しました', 500);
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw new AppError('サブスクリプション情報の取得に失敗しました', 500);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      console.error('Stripe subscription cancellation error:', error);
      throw new AppError('サブスクリプションのキャンセルに失敗しました', 500);
    }
  }

  /**
   * Get payment intent by ID
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw new AppError('決済情報の取得に失敗しました', 500);
    }
  }

  /**
   * List customer's payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Stripe payment methods retrieval error:', error);
      throw new AppError('支払い方法の取得に失敗しました', 500);
    }
  }

  /**
   * Create a setup intent for saving payment method
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session',
      });

      return setupIntent;
    } catch (error) {
      console.error('Stripe setup intent creation error:', error);
      throw new AppError('支払い方法の設定に失敗しました', 500);
    }
  }

  /**
   * Process webhook events
   */
  async processWebhook(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ): Promise<Stripe.Event> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret
      );

      return event;
    } catch (error) {
      console.error('Stripe webhook verification error:', error);
      throw new AppError('Webhook verification failed', 400);
    }
  }

  /**
   * Handle successful payment
   */
  async handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Add any post-payment processing logic here
      console.log(`Payment successful for customer: ${paymentIntent.customer}`);
      
      // Update user status, send confirmation email, etc.
      // This would integrate with your user management system
      
    } catch (error) {
      console.error('Error handling successful payment:', error);
      // Don't throw here as payment was successful
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      console.log(`Payment failed for customer: ${paymentIntent.customer}`);
      
      // Handle payment failure - send notification, update user status, etc.
      
    } catch (error) {
      console.error('Error handling failed payment:', error);
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
    try {
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      return invoice;
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        return null;
      }
      throw new AppError('請求書の取得に失敗しました', 500);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: params.paymentIntentId,
        amount: params.amount,
        reason: params.reason as Stripe.RefundCreateParams.Reason,
        metadata: params.metadata,
      });

      return refund;
    } catch (error) {
      console.error('Stripe refund creation error:', error);
      throw new AppError('返金処理に失敗しました', 500);
    }
  }

  /**
   * Get customer's billing portal session
   */
  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: params.customerId,
        return_url: params.returnUrl,
      });

      return session;
    } catch (error) {
      console.error('Stripe billing portal creation error:', error);
      throw new AppError('課金ポータルの作成に失敗しました', 500);
    }
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string | Buffer, signature: string, secret: string): boolean {
    try {
      this.stripe.webhooks.constructEvent(payload, signature, secret);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;