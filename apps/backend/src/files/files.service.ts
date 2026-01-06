import { Injectable, Inject } from '@nestjs/common';
import { FileRepository } from './infrastructure/persistence/file.repository';
import { FileType } from './domain/file';
import { NullableType } from '../utils/types/nullable.type';
import { AuditService } from '../audit/audit.service';
import { FileDriver } from './domain/file-driver.interface';

@Injectable()
export class FilesService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly auditService: AuditService,
    @Inject('FILE_DRIVER') private readonly fileDriver: FileDriver,
  ) {}

  private readonly uuidRegex =
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

  findById(id: FileType['id']): Promise<NullableType<FileType>> {
    return this.fileRepository.findById(id);
  }

  findByIds(ids: FileType['id'][]): Promise<FileType[]> {
    return this.fileRepository.findByIds(ids);
  }

  async delete(id: FileType['id']): Promise<void> {
    return this.fileDriver.deleteFile(id);
  }

  confirm(id: FileType['id']): Promise<void> {
    return this.fileRepository.update(id, { isTemp: false });
  }

  async confirmFromUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;
    const fileIdMatch = url.match(this.uuidRegex);
    if (fileIdMatch) {
      await this.confirm(fileIdMatch[0]);
    }
  }

  async confirmManyFromUrls(urls: string[] | null | undefined): Promise<void> {
    if (!urls || !urls.length) return;
    for (const url of urls) {
      await this.confirmFromUrl(url);
    }
  }

  async deleteFromUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;
    const fileIdMatch = url.match(this.uuidRegex);
    if (fileIdMatch) {
      await this.delete(fileIdMatch[0]);
    }
  }

  async create(
    file:
      | Express.Multer.File
      | Express.MulterS3.File
      | { fileName: string; fileSize: number; bucket?: string },
    workspaceId?: string,
    userId?: string,
  ): Promise<{
    file: FileType;
    uploadSignedUrl?: string;
    downloadSignedUrl?: string;
  }> {
    const result = await this.fileDriver.create(file, workspaceId);

    if (userId && workspaceId) {
      await this.auditService.log({
        userId,
        workspaceId,
        action: 'FILE_UPLOADED',
        resourceType: 'file',
        resourceId: result.file.id,
        details: {
          fileName: result.file.path,
          fileSize: result.file.size,
          mimeType: result.file.mimeType,
        },
      });
    }

    return result;
  }

  async generateDownloadUrl(
    filePath: string,
    bucket?: string,
    expiresIn?: number,
  ): Promise<string> {
    return this.fileDriver.generateDownloadUrl(filePath, bucket, expiresIn);
  }
}
