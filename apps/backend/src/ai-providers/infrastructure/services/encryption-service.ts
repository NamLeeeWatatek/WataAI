import { Injectable } from '@nestjs/common';
import { EncryptionUtil } from '../../../common/utils/encryption.util';

@Injectable()
export class AiProviderEncryptionService {
  constructor(private readonly encryptionUtil: EncryptionUtil) {}

  /**
   * Encrypt sensitive configuration data
   */
  encryptConfig(config: Record<string, any>): Record<string, any> {
    const encrypted = { ...config };

    // Encrypt API keys
    if (encrypted.apiKey && typeof encrypted.apiKey === 'string') {
      encrypted.apiKey = this.encryptionUtil.encrypt(encrypted.apiKey);
    }

    // For custom providers, encrypt URL as well to prevent visibility
    if (
      encrypted.baseUrl &&
      typeof encrypted.baseUrl === 'string' &&
      encrypted.baseUrl.includes('//')
    ) {
      encrypted.baseUrl = this.encryptionUtil.encrypt(encrypted.baseUrl);
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive configuration data
   */
  decryptConfig(config: Record<string, any>): Record<string, any> {
    const decrypted = { ...config };

    // Decrypt API keys
    if (decrypted.apiKey && typeof decrypted.apiKey === 'string') {
      decrypted.apiKey = this.encryptionUtil.decrypt(decrypted.apiKey);
    }

    // Decrypt URLs for custom providers
    if (decrypted.baseUrl && typeof decrypted.baseUrl === 'string') {
      decrypted.baseUrl = this.encryptionUtil.decrypt(decrypted.baseUrl);
    }

    return decrypted;
  }

  /**
   * Encrypt a single value
   */
  encrypt(value: string): string {
    return this.encryptionUtil.encrypt(value);
  }

  /**
   * Decrypt a single value
   */
  decrypt(value: string): string {
    return this.encryptionUtil.decrypt(value);
  }
}
