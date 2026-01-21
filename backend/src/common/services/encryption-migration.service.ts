import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as crypto from 'crypto';
import { AiProviderConfigEntity } from 'src/ai-providers/infrastructure/persistence/relational/entities/ai-provider.entity';
import { EncryptionService } from '../../shared/services/encryption.service';

/**
 * Migration service to upgrade encryption from AES-256-CBC to AES-256-GCM
 *
 * Usage:
 * 1. Backup your database first!
 * 2. Set OLD_ENCRYPTION_KEY in environment (the old key)
 * 3. Set ENCRYPTION_KEY in environment (the new key)
 * 4. Run: npm run migration:encrypt
 */
@Injectable()
export class EncryptionMigrationService {
  private readonly logger = new Logger(EncryptionMigrationService.name);
  private readonly oldEncryptionKey: string;

  constructor(
    @InjectRepository(AiProviderConfigEntity)
    private providerRepo: Repository<AiProviderConfigEntity>,
    private readonly encryptionService: EncryptionService,
  ) {
    this.oldEncryptionKey =
      process.env.OLD_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY || '';

    if (!this.oldEncryptionKey) {
      throw new Error(
        'OLD_ENCRYPTION_KEY or ENCRYPTION_KEY must be set for migration',
      );
    }
  }

  /**
   * Decrypt using old CBC method
   */
  private decryptCBC(encryptedText: string): string | null {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');

      // Check if this is already GCM format (has 3 parts)
      if (encryptedText.split(':').length === 3) {
        this.logger.warn('Data appears to be already in GCM format, skipping');
        return null;
      }

      const iv = Buffer.from(ivHex, 'hex');
      const key = Buffer.from(this.oldEncryptionKey.padEnd(32).slice(0, 32));

      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (_) {
      this.logger.error('Failed to decrypt with CBC', _);
      throw _;
    }
  }

  /**
   * Migrate a single provider's API key
   */
  private async migrateProvider(
    provider: AiProviderConfigEntity,
  ): Promise<boolean> {
    // For new schema, API key is stored in config.apiKey
    const apiKeyEncrypted = provider.config?.apiKey as string | undefined;

    if (!apiKeyEncrypted) {
      return false;
    }

    try {
      // Try to decrypt with old CBC method
      const decrypted = this.decryptCBC(apiKeyEncrypted);

      if (!decrypted) {
        // Already migrated
        return false;
      }

      // Re-encrypt with new GCM method
      const newEncrypted = this.encryptionService.encrypt(decrypted);

      // Update in database
      provider.config = { ...provider.config, apiKey: newEncrypted };
      await this.providerRepo.save(provider);

      this.logger.log(
        `✅ Migrated provider ${provider.id} (${provider.providerId})`,
      );
      return true;
    } catch (_) {
      this.logger.error(`❌ Failed to migrate provider ${provider.id}`, _);
      return false;
    }
  }

  /**
   * Run full migration
   */
  async runMigration(): Promise<void> {
    this.logger.log('🚀 Starting encryption migration from CBC to GCM...');
    this.logger.warn('⚠️  Make sure you have backed up your database!');

    const providers = await this.providerRepo.find();
    let success = 0;
    let failed = 0;
    let skipped = 0;

    this.logger.log(`Found ${providers.length} provider configs to check.`);

    for (const provider of providers) {
      try {
        const migrated = await this.migrateProvider(provider);
        if (migrated) {
          success++;
        } else {
          skipped++;
        }
      } catch (_) {
        failed++;
      }
    }

    this.logger.log('');
    this.logger.log('📊 Migration Summary:');
    this.logger.log(`   ✅ Successfully migrated: ${success}`);
    this.logger.log(`   ⏭️  Skipped (already migrated): ${skipped}`);
    this.logger.log(`   ❌ Failed: ${failed}`);
    this.logger.log('');

    if (failed > 0) {
      this.logger.error(
        '⚠️  Some migrations failed. Please check the logs above.',
      );
      throw new Error(`Migration completed with ${failed} failures`);
    }

    this.logger.log('✅ Migration completed successfully!');
    this.logger.log(
      '💡 You can now remove OLD_ENCRYPTION_KEY from your .env file',
    );
  }
}
