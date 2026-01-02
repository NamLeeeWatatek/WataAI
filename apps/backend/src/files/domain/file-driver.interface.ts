import { FileType } from './file';
import { FileUploadDto } from '../infrastructure/uploader/minio/dto/file.dto';

export interface FileDriver {
    create(
        file: FileUploadDto | Express.Multer.File | Express.MulterS3.File,
        workspaceId?: string,
    ): Promise<{
        file: FileType;
        uploadSignedUrl?: string;
        downloadSignedUrl?: string;
    }>;

    deleteFile(fileId: string): Promise<void>;

    generateDownloadUrl(
        filePath: string,
        bucket?: string,
        expiresIn?: number,
    ): Promise<string>;
}
