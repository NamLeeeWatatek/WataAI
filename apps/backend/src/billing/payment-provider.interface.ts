export interface CheckoutResult {
  url: string;
  providerId: string;
}

export interface PaymentProvider {
  createCheckoutSession(
    userId: string,
    workspaceId: string,
    planId: string,
    amount: number,
    redirectUrl: string,
  ): Promise<CheckoutResult>;

  verifyWebhook(payload: any, signature: string): any;
}
