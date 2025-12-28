import {
  HttpStatus,
  Injectable,
  PayloadTooLargeException,
  UnprocessableEntityException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { FileRepository } from '../../persistence/file.repository';
import { FilesService } from '../../../files.service';

import { FileUploadDto } from './dto/file.dto';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { FileType } from '../../../domain/file';
import { AllConfigType } from '../../../../config/config.type';

@Injectable()
export class FilesS3PresignedService {
  private s3: S3Client;
  private readonly logger = new Logger(FilesS3PresignedService.name);
  private bucketsChecked = new Set<string>();

  constructor(
    private readonly fileRepository: FileRepository,
    private readonly configService: ConfigService<AllConfigType>,
  ) {
    this.logger.debug(
      `Initializing S3 presigned client for region: ${this.configService.get(
        'file.awsS3Region',
        {
          infer: true,
        },
      )}`,
    );

    this.s3 = new S3Client({
      region: configService.get('file.awsS3Region', { infer: true }),
      credentials: {
        accessKeyId: configService.getOrThrow('file.accessKeyId', {
          infer: true,
        }),
        secretAccessKey: configService.getOrThrow('file.secretAccessKey', {
          infer: true,
        }),
      },
    });
  }

  private async ensureBucketExists(bucket: string): Promise<void> {
    if (this.bucketsChecked.has(bucket)) {
      return;
    }

    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
      this.logger.log(`âœ… Bucket '${bucket}' exists`);
      this.bucketsChecked.add(bucket);
    } catch (error) {
      // Check if bucket already exists (alternative success case)
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        this.logger.log(`ðŸ“¦ Creating bucket '${bucket}'...`);

        try {
          await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));

          // Try to set bucket policy, but don't fail if it doesn't work
          try {
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: '*',
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucket}/*`],
                },
              ],
            };

            await this.s3.send(
              new PutBucketPolicyCommand({
                Bucket: bucket,
                Policy: JSON.stringify(policy),
              }),
            );
          } catch (policyError) {
            this.logger.warn(
              `âš ï¸ Failed to set bucket policy for '${bucket}': ${policyError.message}`,
            );
          }

          this.logger.log(`âœ… Bucket '${bucket}' created successfully`);
          this.bucketsChecked.add(bucket);
        } catch (createError) {
          // If bucket creation also fails, log and assume it already exists
          if (
            createError.$metadata?.httpStatusCode === 409 ||
            createError.name === 'BucketAlreadyExists'
          ) {
            this.logger.log(
              `âš ï¸ Bucket '${bucket}' already exists (creation failed but continuing)`,
            );
            this.bucketsChecked.add(bucket);
          } else if (createError.$metadata?.httpStatusCode === 403) {
            this.logger.warn(
              `âš ï¸ Permission denied creating bucket '${bucket}'. Assuming it exists. (${createError.message})`,
            );
            this.bucketsChecked.add(bucket);
          } else {
            this.logger.error(
              `âŒ Failed to create bucket '${bucket}': ${createError.message}`,
            );
            throw createError;
          }
        }
      } else if (
        error.$metadata?.httpStatusCode === 403 ||
        error.$metadata?.httpStatusCode === 400
      ) {
        // No permission to check bucket, or SSL/invalid request - but assuming it exists
        this.logger.warn(
          `âš ï¸ Permission denied or invalid request checking bucket '${bucket}'. Assuming it exists. (${error.name}: ${error.message})`,
        );
        this.bucketsChecked.add(bucket);
      } else if (
        error.name === 'NetworkingError' ||
        error.name === 'UnknownEndpoint'
      ) {
        // Network/S3 endpoint issues - continue anyway
        this.logger.warn(
          `âš ï¸ S3 network/endpoint error for bucket '${bucket}': ${error.message}. Assuming bucket exists.`,
        );
        this.bucketsChecked.add(bucket);
      } else {
        this.logger.error(
          `âŒ Unexpected error checking bucket '${bucket}': ${error.name} - ${error.message}`,
        );
        // For now, don't throw on bucket check errors
        this.logger.log(
          `âš ï¸ Ignoring bucket check error and assuming '${bucket}' exists`,
        );
        this.bucketsChecked.add(bucket);
      }
    }
  }

  async create(file: FileUploadDto): Promise<{
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

    const key = `${randomStringGenerator()}.${file.fileName
      .split('.')
      .pop()
      ?.toLowerCase()}`;

    // Auto-categorize bucket based on file type if not provided
    let bucket = file.bucket;
    if (!bucket) {
      bucket = isImage ? 'images' : 'documents';
    }

    await this.ensureBucketExists(bucket);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentLength: file.fileSize,
    });
    const uploadSignedUrl = await getSignedUrl(this.s3, command, {
      expiresIn: 3600,
    });

    const downloadCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    const downloadSignedUrl = await getSignedUrl(this.s3, downloadCommand, {
      expiresIn: 3600,
    });

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
    expiresIn: number = 3600,
  ): Promise<string> {
    const targetBucket =
      bucket ||
      this.configService.getOrThrow('file.awsDefaultS3Bucket', {
        infer: true,
      });

    const { GetObjectCommand } = await import('@aws-sdk/client-s3');
    const downloadCommand = new GetObjectCommand({
      Bucket: targetBucket,
      Key: filePath,
    });

    const signedUrl = await getSignedUrl(this.s3, downloadCommand, {
      expiresIn,
    });

    return signedUrl;
  }

  async deleteFile(fileId: string): Promise<void> {
    // First get the file details from database
    const file = await this.fileRepository.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    // Delete from S3
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: file.bucket,
        Key: file.path,
      });

      await this.s3.send(deleteCommand);
      this.logger.log(
        `Successfully deleted file from S3: ${file.bucket}/${file.path}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete file from S3: ${file.bucket}/${file.path}`,
        error,
      );
      // Don't throw here - we still want to delete from DB
    }
  }
}
