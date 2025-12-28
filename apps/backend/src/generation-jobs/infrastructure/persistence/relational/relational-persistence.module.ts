import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationJobEntity } from './entities/generation-job.entity';
import { GenerationJobRepository } from '../generation-job.repository';
import { GenerationJobRelationalRepository } from './repositories/generation-job.repository';

@Module({
  imports: [TypeOrmModule.forFeature([GenerationJobEntity])],
  providers: [
    {
      provide: GenerationJobRepository,
      useClass: GenerationJobRelationalRepository,
    },
  ],
  exports: [GenerationJobRepository],
})
export class RelationalGenerationJobPersistenceModule {}
