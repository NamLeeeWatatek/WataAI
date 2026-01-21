import {
  HttpStatus,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FileRepository } from '../../persistence/file.repository';
import { AllConfigType } from '../../../../config/config.type';
import { FileType } from '../../../domain/file';
import { FileDriver } from '../../../domain/file-driver.interface';

@Injectable()
export class FilesLocalService implements FileDriver {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly fileRepository: FileRepository,
  ) { }

  async create(file: Express.Multer.File): Promise<{ file: FileType }> {
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
        path: `/${this.configService.get('app.apiPrefix', {
          infer: true,
        })}/v1/${file.path}`,
        bucket: 'local',
      }),
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.fileRepository.delete(fileId);
  }

  async generateDownloadUrl(filePath: string): Promise<string> {
    return filePath;
  }
}
