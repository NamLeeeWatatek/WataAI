import { Module } from '@nestjs/common';
import { FilesMinioController } from './files.controller';
import { FilesMinioService } from './files.service';

import { DocumentFilePersistenceModule } from '../../persistence/document/document-persistence.module';
import { RelationalFilePersistenceModule } from '../../persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../../../../database/config/database-config.type';
import databaseConfig from '../../../../database/config/database.config';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentFilePersistenceModule
  : RelationalFilePersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule],
  controllers: [FilesMinioController],
  providers: [FilesMinioService],
  exports: [FilesMinioService],
})
export class FilesMinioModule {}
