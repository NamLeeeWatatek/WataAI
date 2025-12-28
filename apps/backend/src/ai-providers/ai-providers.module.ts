import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiProvidersController } from './ai-providers.controller';
import { AiProvidersService } from './ai-providers.service';
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
import { EncryptionUtil } from '../common/utils/encryption.util';
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
    EncryptionUtil,
    SystemAiSettingsRepository,
    {
      provide: AiProviderConfigRepository,
      useClass: AiProviderConfigRelationalRepository,
    },
  ],
  exports: [AiProvidersService],
})
export class AiProvidersModule { }
