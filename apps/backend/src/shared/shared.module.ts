import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './services/encryption.service';

/**
 * Shared Module - Global utilities and services
 *
 * This module provides common services used across the application.
 * Marked as @Global() so services are available everywhere without explicit imports.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class SharedModule {}
