import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Encryption utility using AES-256-GCM (Galois/Counter Mode)
 * GCM provides both confidentiality and authenticity
 */
@Injectable()
export class EncryptionUtil {
  private readonly logger = new Logger(EncryptionUtil.name);

  // Algorithm configuration
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly IV_LENGTH = 16; // 128 bits
  private readonly AUTH_TAG_LENGTH = 16; // 128 bits
  private readonly KEY_LENGTH = 32; // 256 bits

  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const envKey = this.configService.get<string>('ENCRYPTION_KEY');

    if (!envKey) {
      const errorMsg =
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"";

      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Hash the key to ensure it's exactly 32 bytes
    this.encryptionKey = crypto.createHash('sha256').update(envKey).digest();

    this.logger.log('Encryption service initialized with AES-256-GCM');
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param plainText - Data to encrypt
   * @returns Encrypted string in format: iv:encrypted:authTag (all hex)
   */
  encrypt(plainText: string): string {
    if (!plainText) {
      throw new Error('Cannot encrypt empty string');
    }

    try {
      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Create cipher
      const cipher = crypto.createCipheriv(
        this.ALGORITHM,
        this.encryptionKey,
        iv,
      );

      // Encrypt
      let encrypted = cipher.update(plainText, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag (this is what makes GCM secure)
      const authTag = cipher.getAuthTag();

      // Combine: iv:encrypted:authTag
      return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
      this.logger.error('Encryption failed', error.stack);
      throw new InternalServerErrorException('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data and verify authenticity
   * @param encryptedText - Encrypted string in format: iv:encrypted:authTag
   * @returns Original plain text
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      throw new Error('Cannot decrypt empty string');
    }

    try {
      // Parse the encrypted format
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error(
          `Invalid encrypted format. Expected 3 parts (iv:encrypted:authTag), got ${parts.length}`,
        );
      }

      const [ivHex, encryptedHex, authTagHex] = parts;

      // Convert from hex to Buffer
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Validate lengths
      if (iv.length !== this.IV_LENGTH) {
        throw new Error(
          `Invalid IV length: ${iv.length} bytes, expected ${this.IV_LENGTH} bytes`,
        );
      }
      if (authTag.length !== this.AUTH_TAG_LENGTH) {
        throw new Error(
          `Invalid auth tag length: ${authTag.length} bytes, expected ${this.AUTH_TAG_LENGTH} bytes`,
        );
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(
        this.ALGORITHM,
        this.encryptionKey,
        iv,
      );

      // Set auth tag for verification
      decipher.setAuthTag(authTag);

      // Decrypt and verify
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed', error.message);

      // Don't log the encrypted text for security
      if (
        error.message.includes(
          'Unsupported state or unable to authenticate data',
        )
      ) {
        throw new InternalServerErrorException(
          'Failed to decrypt: Data has been tampered with or encrypted with a different key',
        );
      }

      throw new InternalServerErrorException(
        `Failed to decrypt data: ${error.message}`,
      );
    }
  }

  /**
   * One-way hash (cannot be decrypted)
   * Use for passwords or data that only needs verification
   */
  hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  /**
   * Verify a hash
   */
  verifyHash(value: string, hash: string): boolean {
    return this.hash(value) === hash;
  }

  /**
   * Generate a secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask sensitive data for display (e.g., API keys)
   * Shows first 4 and last 4 characters only
   */
  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (!data || data.length <= visibleChars * 2) {
      return '****';
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const maskLength = Math.min(data.length - visibleChars * 2, 20);

    return `${start}${'*'.repeat(maskLength)}${end}`;
  }

  /**
   * Migrate data from old CBC encryption to new GCM encryption
   * Use this for migration scripts
   */
  migrateFromCBC(oldEncrypted: string, oldKey: string): string {
    try {
      // Decrypt using old CBC method
      const [ivHex, encrypted] = oldEncrypted.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = Buffer.from(oldKey.padEnd(32).slice(0, 32));

      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      // Re-encrypt using new GCM method
      return this.encrypt(decrypted);
    } catch (error) {
      this.logger.error('Migration from CBC failed', error);
      throw new Error(`Failed to migrate encryption: ${error.message}`);
    }
  }
}
