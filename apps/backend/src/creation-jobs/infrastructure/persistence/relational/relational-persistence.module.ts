import { Module } from '@nestjs/common';
import { CreationJobsRepository } from '../creation-jobs.repository';
import { CreationJobsRelationalRepository } from './repositories/creation-jobs.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreationJobEntity } from './entities/creation-jobs.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CreationJobEntity])],
  providers: [
    {
      provide: CreationJobsRepository,
      useClass: CreationJobsRelationalRepository,
    },
  ],
  exports: [CreationJobsRepository],
})
export class RelationalCreationJobsPersistenceModule {}
