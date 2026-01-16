import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AiProviderEntity,
  AiProviderConfigEntity,
  AiUsageLogEntity,
} from './entities/ai-provider.entity';
import { AiProviderConfigRepository } from '../ai-provider-config.repository';
import { AiProviderConfigRelationalRepository } from './repositories/ai-provider-config.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiProviderEntity,
      AiProviderConfigEntity,
      AiUsageLogEntity,
    ]),
  ],
  providers: [
    {
      provide: AiProviderConfigRepository,
      useClass: AiProviderConfigRelationalRepository,
    },
  ],
  exports: [AiProviderConfigRepository],
})
export class RelationalAiProviderPersistenceModule {}
