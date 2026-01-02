import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesCronService } from './files-cleanup.cron'; // Import Cron Service
import { FilesMinioModule } from './infrastructure/uploader/minio/files.module';
import { FilesMinioService } from './infrastructure/uploader/minio/files.service';
import { FilesS3Module } from './infrastructure/uploader/s3/files.module';
import { FilesS3Service } from './infrastructure/uploader/s3/files.service';
import { FilesLocalModule } from './infrastructure/uploader/local/files.module';
import { FilesLocalService } from './infrastructure/uploader/local/files.service';
import { DocumentFilePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { RelationalFilePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { DatabaseConfig } from '../database/config/database-config.type';
import databaseConfig from '../database/config/database.config';
import { ConfigService, ConfigModule } from '@nestjs/config'; // Added ConfigModule
import { AllConfigType } from '../config/config.type';

// Determine persistence module
const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentFilePersistenceModule
  : RelationalFilePersistenceModule;

import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    infrastructurePersistenceModule,
    FilesMinioModule,
    FilesLocalModule,
    FilesS3Module,
    AuditModule,
  ],
  providers: [
    FilesService,
    FilesCronService,
    {
      provide: 'FILE_DRIVER',
      useFactory: (
        configService: ConfigService<AllConfigType>,
        minioService: FilesMinioService,
        s3Service: FilesS3Service,
        localService: FilesLocalService,
      ) => {
        const driver = configService.getOrThrow('file.driver', { infer: true });

        if (driver === 'minio') {
          return minioService;
        } else if (driver === 's3') {
          return s3Service;
        } else {
          return localService;
        }
      },
      inject: [
        ConfigService,
        FilesMinioService,
        FilesS3Service,
        FilesLocalService,
      ],
    },
  ],
  exports: [FilesService, infrastructurePersistenceModule],
})
export class FilesModule { }
