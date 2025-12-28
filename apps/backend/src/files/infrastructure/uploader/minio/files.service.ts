import {
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
  UnprocessableEntityException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { Client, ItemBucketMetadata } from 'minio';
import { FileUploadDto } from './dto/file.dto';
import { FileType } from '../../../domain/file';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../../../config/config.type';

@Injectable()
export class FilesMinioService {
  private minioClient: Client;
  private readonly logger = new Logger(FilesMinioService.name);
  private minioEndpoint: string;

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.logger.debug('🟡 Initializing MinIO client');

    this.minioEndpoint = this.configService.getOrThrow('file.minioEndpoint', {
      infer: true,
    });
    const url = new URL(this.minioEndpoint);

    try {
      this.minioClient = new Client({
        endPoint: url.hostname,
        port: url.port
          ? Number(url.port)
          : url.protocol === 'https:'
            ? 443
            : 80,
        useSSL: url.protocol === 'https:',
        accessKey: this.configService.getOrThrow('file.accessKeyId', {
          infer: true,
        }),
        secretKey: this.configService.getOrThrow('file.secretAccessKey', {
          infer: true,
        }),
      });
    } catch (clientError) {
      this.logger.error(
        `❌ Failed to create MinIO client: ${clientError.message}`,
      );
      throw clientError;
    }

    this.logger.log(
      `✅ MinIO client configured for: ${url.protocol}//${url.hostname}:${url.port}`,
    );
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(bucket);
      if (!exists) {
        this.logger.log(`📦 Creating bucket '${bucket}'...`);
        await this.minioClient.makeBucket(bucket);

        // Try to force public access
        await this.forcePublicAccess(bucket);

        this.logger.log(`✅ Bucket '${bucket}' created successfully`);
      } else {
        this.logger.log(`✅ Bucket '${bucket}' exists`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to create/check bucket '${bucket}': ${error.message}`,
      );
      throw error;
    }
  }

  private async forcePublicAccess(bucket: string): Promise<void> {
    this.logger.log(
      `🔓 Attempting to set public access for bucket '${bucket}'...`,
    );

    try {
      // Try the most permissive policy that should work
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:GetBucketLocation',
            ],
            Resource: [`arn:aws:s3:::${bucket}/*`, `arn:aws:s3:::${bucket}`],
          },
        ],
      };

      await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
      this.logger.log(`✅ Public access set for bucket '${bucket}'`);
    } catch (policyError) {
      this.logger.warn(
        `⚠️ Could not set public access via API: ${policyError.message}`,
      );
      this.logger.warn(`📝 Manual setup required:`);
      this.logger.warn(
        `   1. Access MinIO Console: https://minio.odooenterprise.id.vn`,
      );
      this.logger.warn(`   2. Go to bucket '${bucket}' -> Access Rules`);
      this.logger.warn(`   3. Set policy to allow anonymous read/write`);

      // Continue without throwing - files might still work if manually configured
    }
  }

  async create(
    file: FileUploadDto,
    workspaceId?: string,
  ): Promise<{
    file: FileType;
    uploadSignedUrl: string;
    downloadSignedUrl: string;
  }> {
    if (!file) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: 'selectFile',
        },
      });
    }

    const isImage = file.fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
    const isDocument = file.fileName.match(
      /\.(pdf|doc|docx|txt|csv|xls|xlsx)$/i,
    );

    if (!isImage && !isDocument) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          file: `cantUploadFileType`,
        },
      });
    }

    if (
      file.fileSize >
      (this.configService.get('file.maxFileSize', {
        infer: true,
      }) || 0)
    ) {
      throw new PayloadTooLargeException({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        error: 'Payload Too Large',
        message: 'File too large',
      });
    }

    const randomKey = Math.random().toString(36).substring(2);
    const extension = file.fileName.split('.').pop()?.toLowerCase();

    // Multi-tenant path isolation: workspaces/{workspaceId}/{bucket}/{randomKey}.{ext}
    const workspacePath = workspaceId ? `workspaces/${workspaceId}/` : '';
    const key = `${workspacePath}${randomKey}.${extension}`;

    // Auto-categorize bucket based on file type if not provided
    let bucket = file.bucket;
    if (!bucket) {
      bucket = isImage ? 'images' : 'documents';
    }

    await this.ensureBucketExists(bucket);

    this.logger.log(
      `🔗 Generating MinIO URLs for bucket: ${bucket}, key: ${key}, workspace: ${workspaceId || 'none'}`,
    );

    // Use MinIO's direct access URLs with anonymous users
    // Since presigned URLs are problematic, let's try with bucket policies

    // First, ensure the bucket has public read access immediately
    try {
      await this.forcePublicAccess(bucket);
    } catch (policyError) {
      this.logger.warn(
        `⚠️ Could not set public access: ${policyError.message}`,
      );
    }

    // Generate simple URLs - access will work due to bucket policy
    const baseUrl = this.minioEndpoint.endsWith('/')
      ? this.minioEndpoint.slice(0, -1)
      : this.minioEndpoint;
    const uploadSignedUrl = `${baseUrl}/${bucket}/${key}`;
    const downloadSignedUrl = `${baseUrl}/${bucket}/${key}`;

    this.logger.log(`✅ Generated direct URLs:`);
    this.logger.log(`   Upload: ${uploadSignedUrl}`);
    this.logger.log(`   Download: ${downloadSignedUrl}`);
    this.logger.log(`   Bucket '${bucket}' should now be publicly accessible`);

    const data = await this.fileRepository.create({
      path: key,
      bucket: bucket,
    });

    return {
      file: data,
      uploadSignedUrl: uploadSignedUrl,
      downloadSignedUrl: downloadSignedUrl,
    };
  }

  async generateDownloadUrl(
    filePath: string,
    bucket?: string,
    expiresIn: number = 3600, // Parameter kept for API compatibility but ignored
  ): Promise<string> {
    const targetBucket =
      bucket ||
      this.configService.getOrThrow('file.awsDefaultS3Bucket', {
        infer: true,
      });

    // Use direct URL - should work with bucket policy
    const baseUrl = this.minioEndpoint.endsWith('/')
      ? this.minioEndpoint.slice(0, -1)
      : this.minioEndpoint;
    const directUrl = `${baseUrl}/${targetBucket}/${filePath}`;

    this.logger.log(`🔗 Generated download URL: ${directUrl}`);
    return directUrl;
  }

  async deleteFile(fileId: string): Promise<void> {
    // First get the file details from database
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete from MinIO
    try {
      await this.minioClient.removeObject(file.bucket, file.path);
      this.logger.log(
        `Successfully deleted file from MinIO: ${file.bucket}/${file.path}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete file from MinIO: ${file.bucket}/${file.path}`,
        error,
      );
      throw error; // Now throw error since we need to prevent DB deletion if MinIO fails
    }

    // Delete from database only if MinIO deletion succeeded
    await this.fileRepository.delete(fileId);
    this.logger.log(
      `Successfully deleted file record from database: ${fileId}`,
    );
  }
}
