import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  IsUrl,
} from 'class-validator';

export class AiConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString() // We don't use @IsUrl because it might be a partial path or localhost
  baseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizationId?: string;

  // Allow other properties but known ones are improved
  [key: string]: any;
}

export class CreateUserAiProviderConfigDto {
  @ApiProperty({ description: 'UUID of the AI provider' })
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  @ApiProperty({ example: 'My OpenAI Key' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Configuration object for the provider',
    type: AiConfigDto,
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => AiConfigDto)
  config: AiConfigDto;

  @ApiPropertyOptional({
    type: [String],
    example: ['gpt-4', 'gpt-3.5-turbo'],
    description: 'List of model names supported by this configuration',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];
}

export class UpdateUserAiProviderConfigDto {
  @ApiPropertyOptional({ example: 'My OpenAI Key' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Updated configuration object for the provider',
    type: AiConfigDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AiConfigDto)
  config?: AiConfigDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateWorkspaceAiProviderConfigDto {
  @ApiProperty({ description: 'UUID of the AI provider' })
  @IsNotEmpty()
  @IsUUID()
  providerId: string;

  @ApiProperty({ example: 'Team OpenAI Key' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiProperty({
    description: 'Configuration object for the provider',
    type: AiConfigDto,
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => AiConfigDto)
  config: AiConfigDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];
}

export class UpdateWorkspaceAiProviderConfigDto {
  @ApiPropertyOptional({ example: 'Team OpenAI Key' })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Updated configuration object for the provider',
    type: AiConfigDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AiConfigDto)
  config?: AiConfigDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modelList?: string[];

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class VerifyApiKeyDto {
  @ApiProperty({
    description: 'Configuration to verify',
    type: AiConfigDto,
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => AiConfigDto)
  config: AiConfigDto;

  @ApiProperty({
    enum: ['openai', 'anthropic', 'google', 'azure', 'ollama', 'custom'],
  })
  @IsNotEmpty()
  @IsString()
  providerName: string;
}

export class UpdateSystemAiSettingsDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  defaultProviderId?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  defaultModel?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  minTemperature?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  maxTemperature?: number;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  contentModeration?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  safeFallbacks?: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @IsBoolean()
  contextAware?: boolean;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  maxRequestsPerHour?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  maxRequestsPerUser?: number;
}
