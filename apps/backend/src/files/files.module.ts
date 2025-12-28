import { Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';

import { DocumentFilePersistenceModule } from './infrastructure/persistence/document/document-persistence.module';
import { RelationalFilePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesService } from './files.service';
import { FilesLocalModule } from './infrastructure/uploader/local/files.module';
import { FilesS3Module } from './infrastructure/uploader/s3/files.module';
import { FilesMinioModule } from './infrastructure/uploader/minio/files.module';
import { FilesMinioService } from './infrastructure/uploader/minio/files.service';
import { FilesCronService } from './files-cleanup.cron'; // Import Cron Service
import { DatabaseConfig } from '../database/config/database-config.type';
import databaseConfig from '../database/config/database.config';

const infrastructurePersistenceModule = (databaseConfig() as DatabaseConfig)
  .isDocumentDatabase
  ? DocumentFilePersistenceModule
  : RelationalFilePersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    // Currently using MinIO as configured in .env FILE_DRIVER=minio
    FilesMinioModule,
    // Keep the others for forward compatibility
    forwardRef(() => FilesLocalModule),
    forwardRef(() => FilesS3Module),
    AuditModule,
  ],
  providers: [FilesService, FilesCronService], // Add Cron Service
  exports: [FilesService, infrastructurePersistenceModule],
})
export class FilesModule implements OnModuleInit {
  constructor(
    private readonly filesService: FilesService,
    // Only inject the active MinIO service
    private readonly minioService: FilesMinioService,
  ) {}

  onModuleInit() {
    // Set MinIO service as the active upload service (FILE_DRIVER=minio)
    this.filesService.setUploadService(this.minioService);
  }
}
