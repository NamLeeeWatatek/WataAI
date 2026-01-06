import { registerAs } from '@nestjs/config';
import { KbConfig } from './kb-config.type';
import { IsString, IsNumber, IsOptional } from 'class-validator';
import validateConfig from '../../utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  KB_VECTOR_COLLECTION_NAME: string;

  @IsString()
  @IsOptional()
  KB_STORAGE_BUCKET: string;

  @IsNumber()
  @IsOptional()
  @IsNumber()
  @IsOptional()
  KB_VECTOR_SIZE: number;
}

export default registerAs<KbConfig>('kb', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    vectorCollectionName:
      process.env.KB_VECTOR_COLLECTION_NAME || 'knowledge-base',
    storageBucket: process.env.KB_STORAGE_BUCKET || 'documents',
    maxFileSize: process.env.KB_MAX_FILE_SIZE
      ? parseInt(process.env.KB_MAX_FILE_SIZE, 10)
      : 50 * 1024 * 1024, // 50MB
    vectorSize: process.env.KB_VECTOR_SIZE
      ? parseInt(process.env.KB_VECTOR_SIZE, 10)
      : 768,
  };
});
