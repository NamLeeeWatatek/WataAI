import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY', {
      infer: true,
    });
    if (!apiKey) {
      this.logger.warn('STRIPE_SECRET_KEY not set. Billing disabled.');
      return;
    }

    this.stripe = new Stripe(apiKey);
    this.logger.log('StripeService initialized');
  }

  async createCustomer(email: string, name?: string): Promise<Stripe.Customer> {
    if (!this.stripe) throw new Error('Stripe not configured');

    const customers = await this.stripe.customers.list({ email, limit: 1 });
    if (customers.data.length > 0) {
      return customers.data[0];
    }

    return this.stripe.customers.create({ email, name });
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    workspaceId: string,
    returnUrl: string,
  ): Promise<string> {
    if (!this.stripe) throw new Error('Stripe not configured');

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?session_id = { CHECKOUT_SESSION_ID }`,
      cancel_url: returnUrl,
      subscription_data: {
        metadata: { workspaceId },
      },
      metadata: { workspaceId },
    });

    return session.url!;
  }

  async createPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<string> {
    if (!this.stripe) throw new Error('Stripe not configured');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return session.url;
  }

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Stripe.Event {
    if (!this.stripe) throw new Error('Stripe not configured');
    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET', {
      infer: true,
    });
    if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }

  async retrieveSubscription(subId: string): Promise<Stripe.Subscription> {
    if (!this.stripe) throw new Error('Stripe not configured');
    return this.stripe.subscriptions.retrieve(subId);
  }
}
