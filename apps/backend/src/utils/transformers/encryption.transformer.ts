import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard for GCM
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

export class EncryptionTransformer implements ValueTransformer {
  private encryptionKey: Buffer;

  constructor() {
    if (!ENCRYPTION_KEY) {
      console.error(
        'CRITICAL: ENCRYPTION_KEY is not defined in environment variables.',
      );
    }

    // Ensure the key is exactly 32 bytes (256 bits) for AES-256-GCM
    if (ENCRYPTION_KEY) {
      // Hash the key to ensure it's exactly 32 bytes
      this.encryptionKey = crypto
        .createHash('sha256')
        .update(ENCRYPTION_KEY)
        .digest();
    }
  }

  to(value: string | null): string | null {
    if (!value || !this.encryptionKey) return value;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      this.encryptionKey,
      iv,
    ) as crypto.CipherGCM;

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: v1:iv:authTag:ciphertext
    return `v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  from(value: string | null): string | null {
    if (!value || !this.encryptionKey) return value;

    try {
      // Handle versioning (e.g., v1:)
      if (!value.startsWith('v1:')) {
        // Return as is for legacy or plain data during migration
        return value;
      }

      const parts = value.split(':');
      if (parts.length !== 4) return value;

      const [, ivHex, authTagHex, encryptedText] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        this.encryptionKey,
        iv,
      ) as crypto.DecipherGCM;

      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      console.error(
        'Decryption failed. Data might be tampered or key is incorrect:',
        e.message,
      );
      return null;
    }
  }
}
