import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from '../../shared/services/encryption.service';

interface EncryptableConfig {
  config?: EncryptableConfig | Record<string, unknown>;
  apiKey?: string;
  baseUrl?: string;
  [key: string]: unknown;
}

@Injectable()
export class AiEncryptionService {
  private readonly logger = new Logger(AiEncryptionService.name);

  constructor(private readonly encryptionService: EncryptionService) {}

  /**
   * Helper interface for type safety inside encryption methods
   */
  private asEncryptable(obj: unknown): EncryptableConfig {
    return obj as EncryptableConfig;
  }

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
  encryptConfig<T>(config: T): T {
    if (!config) return config;
    const encrypted = { ...config };

    const encryptedObject = this.asEncryptable(encrypted);

    // Handle domain object structure (e.g., WorkspaceAiProviderConfig)
    if (encryptedObject.config && typeof encryptedObject.config === 'object') {
      encryptedObject.config = this.encryptConfig(encryptedObject.config);
      return encryptedObject as T;
    }

    // Encrypt API keys
    if (encryptedObject.apiKey && typeof encryptedObject.apiKey === 'string') {
      encryptedObject.apiKey = this.encryptionService.encrypt(
        encryptedObject.apiKey,
      );
    }

    // For custom providers, encrypt URL as well to prevent visibility
    if (
      encryptedObject.baseUrl &&
      typeof encryptedObject.baseUrl === 'string' &&
      encryptedObject.baseUrl.includes('//')
    ) {
      encryptedObject.baseUrl = this.encryptionService.encrypt(
        encryptedObject.baseUrl,
      );
    }

    return encrypted;
  }

  /**
   * Decrypts sensitive configuration fields like API keys and URLs.
   * Handles nested config objects and recursively decrypts sensitive fields.
   */
  decryptConfig<T>(config: T): T {
    if (!config) return config;
    const decrypted = { ...config };

    const decryptedObject = this.asEncryptable(decrypted);

    // Handle domain object structure (e.g., WorkspaceAiProviderConfig)
    if (decryptedObject.config && typeof decryptedObject.config === 'object') {
      decryptedObject.config = this.decryptConfig(decryptedObject.config);
      return decryptedObject as T;
    }

    // Decrypt API keys
    if (decryptedObject.apiKey && typeof decryptedObject.apiKey === 'string') {
      try {
        decryptedObject.apiKey = this.encryptionService.decrypt(
          decryptedObject.apiKey,
        );
      } catch (error) {
        this.logger.warn(`Decryption of API key failed: ${error.message}`);
      }
    }

    // Decrypt URLs for custom providers
    if (
      decryptedObject.baseUrl &&
      typeof decryptedObject.baseUrl === 'string' &&
      decryptedObject.baseUrl.includes(':') &&
      !decryptedObject.baseUrl.startsWith('http')
    ) {
      try {
        // Only try to decrypt if it looks like encrypted format (has :)
        if (decryptedObject.baseUrl.split(':').length === 3) {
          decryptedObject.baseUrl = this.encryptionService.decrypt(
            decryptedObject.baseUrl,
          );
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
  maskConfig(config: Record<string, unknown>): Record<string, unknown> {
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
