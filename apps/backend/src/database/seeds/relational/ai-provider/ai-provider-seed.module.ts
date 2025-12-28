import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AiProviderSeedService } from './ai-provider-seed.service';
import { AiProviderEntity } from '../../../../ai-providers/infrastructure/persistence/relational/entities/ai-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiProviderEntity])],
  providers: [AiProviderSeedService],
  exports: [AiProviderSeedService],
})
export class AiProviderSeedModule {}
