import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from '../../shared/services/encryption.service';

@Injectable()
export class AiEncryptionService {
  private readonly logger = new Logger(AiEncryptionService.name);

  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Encrypt an API key
   */
  encryptApiKey(apiKey: string): string {
    return this.encryptionService.encrypt(apiKey);
  }

  /**
   * Decrypt an API key
   */
  decryptApiKey(encryptedApiKey: string): string {
    return this.encryptionService.decrypt(encryptedApiKey);
  }

  /**
   * Encrypts sensitive configuration fields like API keys and URLs.
   * Handles nested config objects and recursively encrypts sensitive fields.
   */
  encryptConfig(config: any): any {
    if (!config) return config;
    const encrypted = { ...config };

    // Handle domain object structure (e.g., WorkspaceAiProviderConfig)
    if (encrypted.config && typeof encrypted.config === 'object') {
      encrypted.config = this.encryptConfig(encrypted.config);
      return encrypted;
    }

    // Encrypt API keys
    if (encrypted.apiKey && typeof encrypted.apiKey === 'string') {
      encrypted.apiKey = this.encryptionService.encrypt(encrypted.apiKey);
    }

    // For custom providers, encrypt URL as well to prevent visibility
    if (
      encrypted.baseUrl &&
      typeof encrypted.baseUrl === 'string' &&
      encrypted.baseUrl.includes('//')
    ) {
      encrypted.baseUrl = this.encryptionService.encrypt(encrypted.baseUrl);
    }

    return encrypted;
  }

  /**
   * Decrypts sensitive configuration fields like API keys and URLs.
   * Handles nested config objects and recursively decrypts sensitive fields.
   */
  decryptConfig(config: any): any {
    if (!config) return config;
    const decrypted = { ...config };

    // Handle domain object structure (e.g., WorkspaceAiProviderConfig)
    if (decrypted.config && typeof decrypted.config === 'object') {
      decrypted.config = this.decryptConfig(decrypted.config);
      return decrypted;
    }

    // Decrypt API keys
    if (decrypted.apiKey && typeof decrypted.apiKey === 'string') {
      try {
        decrypted.apiKey = this.encryptionService.decrypt(decrypted.apiKey);
      } catch (error) {
        this.logger.warn(`Decryption of API key failed: ${error.message}`);
      }
    }

    // Decrypt URLs for custom providers
    if (
      decrypted.baseUrl &&
      typeof decrypted.baseUrl === 'string' &&
      decrypted.baseUrl.includes(':') &&
      !decrypted.baseUrl.startsWith('http')
    ) {
      try {
        // Only try to decrypt if it looks like encrypted format (has :)
        if (decrypted.baseUrl.split(':').length === 3) {
          decrypted.baseUrl = this.encryptionService.decrypt(decrypted.baseUrl);
        }
      } catch (error) {
        // Not encrypted or wrong format
      }
    }

    return decrypted;
  }

  /**
   * Masks sensitive configuration fields for frontend display.
   */
  maskConfig(config: any): any {
    if (!config) return config;
    const masked = { ...config };

    Object.keys(masked).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (
        (lowerKey.includes('key') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('password')) &&
        typeof masked[key] === 'string' &&
        masked[key].length > 0
      ) {
        masked[key] = '••••••••••••';
      }
    });

    return masked;
  }
}
