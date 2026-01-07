import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FilesService } from './files.service';
import { FileRepository } from './infrastructure/persistence/file.repository';

@Injectable()
export class FilesCronService {
  private readonly logger = new Logger(FilesCronService.name);

  constructor(
    private readonly filesService: FilesService,
    private readonly fileRepository: FileRepository,
  ) { }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Starting cleanup of orphaned files...');

    try {
      const oldFiles = await this.fileRepository.findOldTemporaryFiles();
      this.logger.log(`Found ${oldFiles.length} orphaned files to delete.`);

      for (const file of oldFiles) {
        try {
          // Delete from storage and DB
          await this.filesService.delete(file.id);
        } catch (err) {
          this.logger.error(
            `Failed to delete file ${file.id}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error during orphaned file cleanup:', error);
    }

    this.logger.log('Cleanup finished.');
  }
}
