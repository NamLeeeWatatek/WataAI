import { registerAs } from '@nestjs/config';
import { IsString, IsInt, IsOptional } from 'class-validator';
import validateConfig from '../../utils/validate-config';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsInt()
  @IsOptional()
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsString()
  @IsOptional()
  REDIS_URL: string;
}

export default registerAs('queue', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
    url: process.env.REDIS_URL,
  };
});
