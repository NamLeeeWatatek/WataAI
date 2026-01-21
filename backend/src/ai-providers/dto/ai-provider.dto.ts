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
  IsNumber,
} from 'class-validator';
import { Transform, plainToInstance } from 'class-transformer';
import { BaseFilterDto, BaseSortDto } from '../../utils/dto/base-query.dto';

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
  [key: string]: unknown;
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
  @IsNumber()
  maxRequestsPerHour?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  maxRequestsPerUser?: number;
}

export class FilterAiModelDto extends BaseFilterDto {
  @ApiPropertyOptional({ description: 'Filter by provider ID' })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({ description: 'Filter by config ID' })
  @IsOptional()
  @IsString()
  configId?: string;

  @ApiPropertyOptional({
    description: 'Filter by owner type',
    enum: ['user', 'workspace'],
  })
  @IsOptional()
  @IsString()
  ownerType?: string;

  @ApiPropertyOptional({ description: 'Filter by owner ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by model type',
    enum: ['chat', 'embedding'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Search in name or display name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Only show stable/main models' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  onlyStable?: boolean;
}

export class SortAiModelDto extends BaseSortDto {
  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsString()
  orderBy: string;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], description: 'Sort order' })
  @IsString()
  order: 'ASC' | 'DESC';
}

export class QueryAiModelDto {
  @ApiPropertyOptional({ default: 1 })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 100 })
  @Transform(({ value }) => (value ? Number(value) : 50))
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of FilterAiModelDto',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object')
      return plainToInstance(FilterAiModelDto, value);
    try {
      return plainToInstance(FilterAiModelDto, JSON.parse(value));
    } catch {
      return undefined;
    }
  })
  @ValidateNested()
  @Type(() => FilterAiModelDto)
  filters?: FilterAiModelDto | null;

  @ApiPropertyOptional({
    type: String,
    description: 'JSON string of SortAiModelDto[]',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'object')
      return plainToInstance(SortAiModelDto, value);
    try {
      return plainToInstance(SortAiModelDto, JSON.parse(value));
    } catch (_) {
      return undefined;
    }
  })
  @ValidateNested({ each: true })
  @Type(() => SortAiModelDto)
  sort?: SortAiModelDto[] | null;
}
