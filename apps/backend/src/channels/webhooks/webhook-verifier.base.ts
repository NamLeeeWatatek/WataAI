import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

/**
 * Base Webhook Verifier
 *
 * Abstract class providing signature verification for webhooks.
 * Each channel (Facebook, Instagram, Telegram, etc.) extends this
 * and implements channel-specific verification logic.
 */
export abstract class BaseWebhookVerifier {
  protected abstract readonly logger: Logger;
  protected readonly channelName: string = 'Unknown';

  /**
   * Verify webhook signature
   *
   * @param payload - The webhook payload
   * @param signature - The signature from headers
   * @param secret - The app secret/token for verification
   * @returns true if signature is valid
   */
  abstract verifySignature(
    payload: any,
    signature: string,
    secret: string,
  ): boolean;

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  protected timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }

  /**
   * Log verification attempt
   */
  protected logVerification(success: boolean, signature?: string): void {
    if (success) {
      this.logger.log(`âœ… ${this.channelName} webhook signature verified`);
    } else {
      this.logger.warn(
        `âŒ ${this.channelName} webhook signature verification failed`,
      );
      this.logger.warn(`Signature received: ${signature?.substring(0, 20)}...`);
    }
  }
}

/**
 * Facebook/Instagram Webhook Verifier
 *
 * Uses HMAC-SHA256 with x-hub-signature-256 header
 */
export class FacebookWebhookVerifier extends BaseWebhookVerifier {
  protected readonly logger = new Logger('FacebookWebhookVerifier');
  protected channelName = 'Facebook';

  verifySignature(payload: any, signature: string, appSecret: string): boolean {
    if (!signature || !appSecret) {
      this.logVerification(false, signature);
      return false;
    }

    try {
      // Remove 'sha256=' prefix if present
      const signatureHash = signature.replace('sha256=', '');

      // âœ… FIX: Handle both string (raw body) and object (parsed body)
      let bodyString: string;
      if (typeof payload === 'string') {
        bodyString = payload;
      } else if (Buffer.isBuffer(payload)) {
        bodyString = payload.toString('utf8');
      } else {
        // Object - stringify it (may not match Facebook's original format)
        bodyString = JSON.stringify(payload);
      }

      // Compute expected signature
      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(bodyString)
        .digest('hex');

      // Timing-safe comparison
      const isValid = this.timingSafeEqual(signatureHash, expectedSignature);

      if (!isValid) {
        this.logger.debug(`Signature mismatch:`);
        this.logger.debug(`  Received: ${signatureHash.substring(0, 20)}...`);
        this.logger.debug(
          `  Expected: ${expectedSignature.substring(0, 20)}...`,
        );
        this.logger.debug(`  Body type: ${typeof payload}`);
        this.logger.debug(`  Body length: ${bodyString.length}`);
      }

      this.logVerification(isValid, signature);
      return isValid;
    } catch (error: any) {
      this.logger.error(`Signature verification error: ${error.message}`);
      this.logVerification(false, signature);
      return false;
    }
  }
}

/**
 * Instagram Webhook Verifier
 *
 * Uses same verification as Facebook (same API)
 */
export class InstagramWebhookVerifier extends FacebookWebhookVerifier {
  protected readonly logger = new Logger('InstagramWebhookVerifier');
  protected override readonly channelName = 'Instagram';
}

/**
 * Telegram Webhook Verifier
 *
 * Telegram uses secret token verification
 */
export class TelegramWebhookVerifier extends BaseWebhookVerifier {
  protected readonly logger = new Logger('TelegramWebhookVerifier');
  protected readonly channelName = 'Telegram';

  verifySignature(
    payload: any,
    signature: string,
    secretToken: string,
  ): boolean {
    if (!signature || !secretToken) {
      // Telegram webhooks can work without signature in some cases
      // but it's recommended to use it
      this.logger.warn('No signature or secret token provided for Telegram');
      return true; // Allow but log warning
    }

    try {
      // Telegram sends X-Telegram-Bot-Api-Secret-Token header
      const isValid = this.timingSafeEqual(signature, secretToken);

      this.logVerification(isValid, signature);
      return isValid;
    } catch (error: any) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Generic Webhook Verifier
 *
 * For channels that use simple HMAC or custom verification
 */
export class GenericWebhookVerifier extends BaseWebhookVerifier {
  protected readonly logger = new Logger('GenericWebhookVerifier');
  protected channelName = 'Generic';

  constructor(channelName?: string) {
    super();
    if (channelName) {
      this.channelName = channelName;
    }
  }

  verifySignature(
    payload: any,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha1' = 'sha256',
  ): boolean {
    if (!signature || !secret) {
      this.logVerification(false, signature);
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac(algorithm, secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      const isValid = this.timingSafeEqual(signature, expectedSignature);

      this.logVerification(isValid, signature);
      return isValid;
    } catch (error: any) {
      this.logger.error(`Signature verification error: ${error.message}`);
      return false;
    }
  }
}

/**
 * Webhook Verifier Factory
 *
 * Creates appropriate verifier based on channel type
 */
export class WebhookVerifierFactory {
  private static verifiers = new Map<string, BaseWebhookVerifier>([
    ['facebook', new FacebookWebhookVerifier()],
    ['instagram', new InstagramWebhookVerifier()],
    ['telegram', new TelegramWebhookVerifier()],
  ]);

  static getVerifier(channelType: string): BaseWebhookVerifier {
    const verifier = this.verifiers.get(channelType.toLowerCase());

    if (!verifier) {
      // Return generic verifier for unknown channels
      return new GenericWebhookVerifier(channelType);
    }

    return verifier;
  }

  /**
   * Register custom verifier for new channel
   */
  static registerVerifier(
    channelType: string,
    verifier: BaseWebhookVerifier,
  ): void {
    this.verifiers.set(channelType.toLowerCase(), verifier);
  }
}
