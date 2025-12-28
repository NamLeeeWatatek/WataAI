import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as crypto from 'crypto';
import {
  UserAiProviderConfigEntity,
  WorkspaceAiProviderConfigEntity,
} from 'src/ai-providers/infrastructure/persistence/relational/entities/ai-provider.entity';
import { EncryptionUtil } from '../utils/encryption.util';

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
    @InjectRepository(UserAiProviderConfigEntity)
    private userProviderRepo: Repository<UserAiProviderConfigEntity>,
    @InjectRepository(WorkspaceAiProviderConfigEntity)
    private workspaceProviderRepo: Repository<WorkspaceAiProviderConfigEntity>,
    private readonly encryptionUtil: EncryptionUtil,
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
    } catch (error) {
      this.logger.error('Failed to decrypt with CBC', error);
      throw error;
    }
  }

  /**
   * Migrate a single provider's API key
   */
  private async migrateProvider(
    provider: UserAiProviderConfigEntity | WorkspaceAiProviderConfigEntity,
    repo: Repository<any>,
  ): Promise<boolean> {
    // For new schema, API key is stored in config.apiKey
    const apiKeyEncrypted = provider.config?.apiKey;

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
      const newEncrypted = this.encryptionUtil.encrypt(decrypted);

      // Update in database
      provider.config = { ...provider.config, apiKey: newEncrypted };
      await repo.save(provider);

      this.logger.log(
        `âœ… Migrated provider ${provider.id} (${provider.providerId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(`âŒ Failed to migrate provider ${provider.id}`, error);
      return false;
    }
  }

  /**
   * Migrate all user providers
   */
  async migrateUserProviders(): Promise<{
    success: number;
    failed: number;
    skipped: number;
  }> {
    this.logger.log('ðŸ”„ Starting migration of user providers...');

    const providers = await this.userProviderRepo.find();
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const provider of providers) {
      try {
        const migrated = await this.migrateProvider(
          provider,
          this.userProviderRepo,
        );
        if (migrated) {
          success++;
        } else {
          skipped++;
        }
      } catch (error) {
        failed++;
      }
    }

    this.logger.log(
      `âœ… User providers migration complete: ${success} migrated, ${skipped} skipped, ${failed} failed`,
    );

    return { success, failed, skipped };
  }

  /**
   * Migrate all workspace providers
   */
  async migrateWorkspaceProviders(): Promise<{
    success: number;
    failed: number;
    skipped: number;
  }> {
    this.logger.log('ðŸ”„ Starting migration of workspace providers...');

    const providers = await this.workspaceProviderRepo.find();
    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const provider of providers) {
      try {
        const migrated = await this.migrateProvider(
          provider,
          this.workspaceProviderRepo,
        );
        if (migrated) {
          success++;
        } else {
          skipped++;
        }
      } catch (error) {
        failed++;
      }
    }

    this.logger.log(
      `âœ… Workspace providers migration complete: ${success} migrated, ${skipped} skipped, ${failed} failed`,
    );

    return { success, failed, skipped };
  }

  /**
   * Run full migration
   */
  async runMigration(): Promise<void> {
    this.logger.log('ðŸš€ Starting encryption migration from CBC to GCM...');
    this.logger.warn('âš ï¸  Make sure you have backed up your database!');

    const userResults = await this.migrateUserProviders();
    const workspaceResults = await this.migrateWorkspaceProviders();

    const totalSuccess = userResults.success + workspaceResults.success;
    const totalFailed = userResults.failed + workspaceResults.failed;
    const totalSkipped = userResults.skipped + workspaceResults.skipped;

    this.logger.log('');
    this.logger.log('ðŸ“Š Migration Summary:');
    this.logger.log(`   âœ… Successfully migrated: ${totalSuccess}`);
    this.logger.log(`   â­ï¸  Skipped (already migrated): ${totalSkipped}`);
    this.logger.log(`   âŒ Failed: ${totalFailed}`);
    this.logger.log('');

    if (totalFailed > 0) {
      this.logger.error(
        'âš ï¸  Some migrations failed. Please check the logs above.',
      );
      throw new Error(`Migration completed with ${totalFailed} failures`);
    }

    this.logger.log('âœ… Migration completed successfully!');
    this.logger.log(
      'ðŸ’¡ You can now remove OLD_ENCRYPTION_KEY from your .env file',
    );
  }
}
