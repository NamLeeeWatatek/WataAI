import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  Logger,
  Headers,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StripeService } from './stripe.service';
import { PayOSService } from './payos.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Request } from 'express';
// We need raw body for webhook verification
// In NestJS we can't easily get raw body if bodyParser is global.
// Assuming raw-body middleware or similar is setup, or we rely on 'rawBody' property (NestJS 9+)

@Controller({
  path: 'billing',
  version: '1',
})
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly payOSService: PayOSService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  async createCheckoutSession(
    @Req() req: any,
    @Body()
    body: {
      planId: string;
      workspaceId: string;
      provider?: 'stripe' | 'payos';
    },
  ) {
    const { planId, workspaceId, provider = 'stripe' } = body;
    const user = req.user;

    // 1. Get Plan
    const plan = await this.subscriptionsService.getPlan(planId);
    if (!plan) {
      throw new BadRequestException('Invalid plan');
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`;

    // 2. Handle Free Plan
    if (plan.name === 'Free' || plan.priceMonthly <= 0) {
      await this.subscriptionsService.changePlan(workspaceId, planId);
      return { url: `${returnUrl}?status=success` };
    }

    if (provider === 'payos') {
      // PayOS implementation
      const amount = Number(plan.priceMonthly) || 0; // Ensure number
      if (amount <= 0) throw new BadRequestException('Plan is free');

      try {
        const result = await this.payOSService.createCheckoutSession(
          user.id,
          workspaceId,
          planId,
          amount,
          returnUrl,
        );
        return { url: result.url };
      } catch (e: any) {
        this.logger.error(`PayOS Error: ${e.message}`);
        throw new BadRequestException(`PayOS not configured: ${e.message}`);
      }
    }

    // Stripe implementation
    if (!plan.stripePriceId) {
      throw new BadRequestException('Plan does not support Stripe payment');
    }

    try {
      // Get/Create Stripe Customer
      const sub = await this.subscriptionsService.getSubscription(workspaceId);
      let customerId = sub?.stripeCustomerId;

      if (!customerId) {
        const customer = await this.stripeService.createCustomer(
          user.email,
          user.name,
        );
        customerId = customer.id;
      }

      const url = await this.stripeService.createCheckoutSession(
        customerId,
        plan.stripePriceId,
        workspaceId,
        returnUrl,
      );

      return { url };
    } catch (e: any) {
      this.logger.error(`Stripe Checkour Error: ${e.message}`);
      throw new BadRequestException(`Stripe not configured: ${e.message}`);
    }
  }

  @Post('portal')
  @UseGuards(AuthGuard('jwt'))
  async createPortalSession(@Body() body: { workspaceId: string }) {
    const sub = await this.subscriptionsService.getSubscription(
      body.workspaceId,
    );
    if (!sub || !sub.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing`;
    const url = await this.stripeService.createPortalSession(
      sub.stripeCustomerId,
      returnUrl,
    );
    return { url };
  }

  @Get('admin/invoices')
  @UseGuards(AuthGuard('jwt'))
  // @Roles('admin') // Ideally strict role check here
  async getAdminInvoices(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.subscriptionsService.getAllInvoices({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status,
    });
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: Request & { rawBody: Buffer }, // NestJS rawBody support
  ) {
    if (!signature) throw new BadRequestException('Missing signature');

    // NOTE: This requires NestJS to be configured with { rawBody: true }
    // If not, req.body might already be parsed JSON, making verification fail.
    const event = this.stripeService.constructWebhookEvent(
      req.rawBody || (req as any).body,
      signature,
    );

    // Handle specific events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const workspaceId = session.metadata?.workspaceId;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (workspaceId && subscriptionId) {
        this.logger.log(`Checkout completed for Workspace ${workspaceId}`);
        // Update DB
        const sub = await this.subscriptionsService.createSubscription({
          workspaceId,
          planId: 'pro', // TODO: Look up plan from price ID or metadata
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
        });

        // Create Invoice Record
        await this.subscriptionsService.createInvoice({
          workspaceId,
          subscriptionId: sub.id, // Assuming sub is returned
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'usd',
          status: 'paid',
          provider: 'stripe',
          providerInvoiceId: session.invoice as string,
          periodStart: new Date(),
          periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        });
      }
    }

    // Other events: 'invoice.payment_succeeded', 'customer.subscription.updated', etc.

    return { received: true };
  }

  @Post('payos-webhook')
  async handlePayOSWebhook(@Body() body: any) {
    // Verify webhook data
    const data = this.payOSService.verifyWebhook(body);
    if (!data) throw new BadRequestException('Invalid Webhook Data');

    this.logger.log(`PayOS Webhook: ${data.desc}`);

    if (data.desc && data.desc.includes('Work')) {
      // Parse context from description: "Plan PRO Work 123"
      // This is brittle; better to store orderCode mapping in DB.
      // For now, extract workspaceId via Regex or Splitting
      const parts = data.desc.split(' ');
      const planIndex = parts.indexOf('Plan');
      const workIndex = parts.indexOf('Work');

      if (planIndex !== -1 && workIndex !== -1) {
        const planId = parts[planIndex + 1];
        const workspaceId = parts[workIndex + 1];

        if (workspaceId && planId) {
          const sub = await this.subscriptionsService.createSubscription({
            workspaceId,
            planId,
            // No Stripe IDs for PayOS, maybe add separate columns or use generic 'providerId'
            stripeCustomerId: `payos_cust_${data.accountNumber}`,
            stripeSubscriptionId: `payos_tx_${data.orderCode}`,
          });

          // Create Invoice
          await this.subscriptionsService.createInvoice({
            workspaceId,
            subscriptionId: sub?.id || 'unknown', // Handle potential void return if sub service not updated to return value
            amount: data.amount,
            currency: 'vnd', // PayOS is VND
            status: 'paid',
            provider: 'payos',
            providerInvoiceId: `payos_${data.orderCode}`,
            periodStart: new Date(),
            periodEnd: new Date(new Date().setMonth(new Date().getMonth() + 1)),
          });
        }
      }
    }

    return { success: true };
  }
}
