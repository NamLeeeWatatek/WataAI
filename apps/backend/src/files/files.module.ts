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
// import { AllConfigType } from '../config/config.type';
import fileConfig from './config/file.config'; // Import file config
import { FileConfig, FileDriver } from './config/file-config.type';
import { AuditModule } from '../audit/audit.module';

// Determine persistence module
const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentFilePersistenceModule
  : RelationalFilePersistenceModule;

// Determine driver module
const driver = (fileConfig() as FileConfig).driver;

const infrastructureUploaderModule =
  driver === FileDriver.MINIO
    ? FilesMinioModule
    : driver === FileDriver.S3 || driver === FileDriver.S3_PRESIGNED
      ? FilesS3Module
      : FilesLocalModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    infrastructureUploaderModule,
    AuditModule,
  ],
  providers: [
    FilesService,
    FilesCronService,
    {
      provide: 'FILE_DRIVER',
      useExisting:
        driver === FileDriver.MINIO
          ? FilesMinioService
          : driver === FileDriver.S3 || driver === FileDriver.S3_PRESIGNED
            ? FilesS3Service
            : FilesLocalService,
    },
  ],
  exports: [FilesService, infrastructurePersistenceModule],
})
export class FilesModule { }
