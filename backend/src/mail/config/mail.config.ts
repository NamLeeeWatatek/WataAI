import { registerAs } from '@nestjs/config';

import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import validateConfig from '../../utils/validate-config';
import { MailConfig } from './mail-config.type';

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MAIL_PORT: number;

  @IsString()
  MAIL_HOST: string;

  @IsString()
  @IsOptional()
  MAIL_USER: string;

  @IsString()
  @IsOptional()
  MAIL_PASSWORD: string;

  @IsEmail()
  MAIL_DEFAULT_EMAIL: string;

  @IsString()
  MAIL_DEFAULT_NAME: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  MAIL_IGNORE_TLS: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  MAIL_SECURE: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  MAIL_REQUIRE_TLS: boolean;
}

export default registerAs<MailConfig>('mail', () => {
  const config = validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    port: config.MAIL_PORT ? config.MAIL_PORT : 587,
    host: config.MAIL_HOST,
    user: config.MAIL_USER,
    password: config.MAIL_PASSWORD,
    defaultEmail: config.MAIL_DEFAULT_EMAIL,
    defaultName: config.MAIL_DEFAULT_NAME,
    ignoreTLS: config.MAIL_IGNORE_TLS ?? false,
    secure: config.MAIL_SECURE ?? false,
    requireTLS: config.MAIL_REQUIRE_TLS ?? false,
  };
});
