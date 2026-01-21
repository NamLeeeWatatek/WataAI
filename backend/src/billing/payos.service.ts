import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PayOSLib = require('@payos/node');
import { CheckoutResult, PaymentProvider } from './payment-provider.interface';

@Injectable()
export class PayOSService implements PaymentProvider, OnModuleInit {
  private payOS: any;
  private readonly logger = new Logger(PayOSService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID', {
      infer: true,
    });
    const apiKey = this.configService.get<string>('PAYOS_API_KEY', {
      infer: true,
    });
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY', {
      infer: true,
    });

    if (!clientId || !apiKey || !checksumKey) {
      this.logger.warn('PayOS keys not set. Local payments disabled.');
      return;
    }

    // Check if PayOSLib itself is the constructor or if it has a named property
    // Debug output showed { PayOS: [Getter] }
    const PayOSConstructor = PayOSLib.PayOS || PayOSLib;
    this.payOS = new PayOSConstructor(clientId, apiKey, checksumKey);
    this.logger.log('PayOSService initialized');
  }

  async createCheckoutSession(
    userId: string,
    workspaceId: string,
    planId: string,
    amount: number,
    redirectUrl: string,
  ): Promise<CheckoutResult> {
    if (!this.payOS) throw new Error('PayOS not configured');

    const orderCode = Number(String(Date.now()).slice(-6)); // Simple order code (should be unique in prod)
    // Improve OrderCode generation for production (use DB sequence or UUID mapping)

    // PayOS requires integer amount
    const requestData = {
      orderCode,
      amount: Math.round(amount),
      description: `Plan ${planId} Work ${workspaceId}`.slice(0, 25), // Limited chars
      items: [
        {
          name: `Subscription ${planId}`,
          quantity: 1,
          price: Math.round(amount),
        },
      ],
      returnUrl: `${redirectUrl}?status=success&provider=payos`,
      cancelUrl: `${redirectUrl}?status=cancel&provider=payos`,
    };

    const paymentLink = await this.payOS.createPaymentLink(requestData);

    return {
      url: paymentLink.checkoutUrl,
      providerId: String(orderCode),
    };
  }

  verifyWebhook(payload: any, _?: string): any {
    if (!this.payOS) throw new Error('PayOS not configured');
    // PayOS verifies data integrity via checksum in the payload, not just a signature header
    return this.payOS.verifyPaymentWebhookData(payload);
  }
}
