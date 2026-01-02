import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { FileType } from '../../../domain/file';
import { FileDriver } from '../../../domain/file-driver.interface';

@Injectable()
export class FilesS3Service implements FileDriver {
  constructor(private readonly fileRepository: FileRepository) { }

  async create(file: Express.MulterS3.File): Promise<{ file: FileType }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    return {
      file: await this.fileRepository.create({
        path: file.key,
        bucket: file.bucket || 'images',
      }),
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    // Basic implementation: just delete from DB since S3 delete logic wasn't here before
    // In a real refactor we would add S3 delete logic
    await this.fileRepository.delete(fileId);
  }

  async generateDownloadUrl(filePath: string): Promise<string> {
    // Placeholder - return raw path or public URL if available
    return filePath;
  }
}
