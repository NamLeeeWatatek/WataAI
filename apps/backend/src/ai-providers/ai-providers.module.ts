import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProvidersController } from './ai-providers.controller';
import { AiProvidersService } from './ai-providers.service';
import { AiEncryptionService } from './services/ai-encryption.service';
import { AiConfigService } from './services/ai-config.service';
import { AiModelService } from './services/ai-model.service';
import {
  AiProviderEntity,
  AiProviderConfigEntity,
  UserAiProviderConfigEntity,
  WorkspaceAiProviderConfigEntity,
  AiUsageLogEntity,
  SystemAiSettingsEntity,
} from './infrastructure/persistence/relational/entities/ai-provider.entity';
import { AiProviderConfigRelationalRepository } from './infrastructure/persistence/relational/repositories/ai-provider-config.repository';
import { AiProviderConfigRepository } from './infrastructure/persistence/ai-provider-config.repository';
import { SystemAiSettingsRepository } from './infrastructure/system/system-ai-settings.repository';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiProviderEntity,
      AiProviderConfigEntity,
      UserAiProviderConfigEntity,
      WorkspaceAiProviderConfigEntity,
      AiUsageLogEntity,
      SystemAiSettingsEntity,
    ]),
    forwardRef(() => WorkspacesModule),
    PermissionsModule,
  ],
  controllers: [AiProvidersController],
  providers: [
    AiProvidersService,
    AiEncryptionService,
    AiConfigService,
    AiModelService,
    SystemAiSettingsRepository,
    {
      provide: AiProviderConfigRepository,
      useClass: AiProviderConfigRelationalRepository,
    },
  ],
  exports: [AiProvidersService],
})
export class AiProvidersModule {}
