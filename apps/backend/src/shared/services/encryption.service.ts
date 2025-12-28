import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const secret = this.configService.getOrThrow<string>('ENCRYPTION_SECRET');

    if (!secret || secret.length < 32) {
      throw new Error('ENCRYPTION_SECRET must be at least 32 characters');
    }

    // Derive a 256-bit key from the secret
    this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
  }

  /**
   * Encrypt sensitive data
   * Format: salt:iv:encrypted:authTag (all base64 encoded)
   */
  encrypt(plaintext: string): string {
    if (!plaintext) {
      return plaintext;
    }

    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get auth tag
      const authTag = cipher.getAuthTag();

      // Combine: iv:encrypted:authTag (all base64)
      return `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypt encrypted data
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) {
      return encryptedData;
    }

    try {
      // Check if data is encrypted (has our format)
      if (!encryptedData.includes(':')) {
        // Not encrypted, return as-is (backward compatibility)
        return encryptedData;
      }

      const parts = encryptedData.split(':');

      // New format: iv:encrypted:authTag
      if (parts.length !== 3) {
        // Old plaintext data
        return encryptedData;
      }

      const iv = Buffer.from(parts[0], 'base64');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'base64');

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        iv,
      );
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Hash a value (one-way, for verification)
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Compare a value with its hash
   */
  compareHash(value: string, hash: string): boolean {
    return this.hash(value) === hash;
  }

  /**
   * Generate a secure random token
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
