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
      apiVersion: '2023-10-16', // Use supported version
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
        items: [{ price: params.priceId }],
        metadata: {
          service: 'yoake',
          type: 'monthly_subscription',
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
   * Get customer's payment methods
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
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
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string, secret: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      console.error('Stripe webhook signature validation error:', error);
      throw new AppError('Webhookの検証に失敗しました', 400);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      console.error('Stripe subscription cancellation error:', error);
      throw new AppError('サブスクリプションのキャンセルに失敗しました', 500);
    }
  }
}

export const stripeService = new StripeService();
export default stripeService;