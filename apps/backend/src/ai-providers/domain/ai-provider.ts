import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AiProviderOwnerType } from '../ai-providers.enum';

/**
 * AiProvider domain entity
 * Table: ai_providers
 */
export class AiProvider {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String, example: 'openai' })
  key: string;

  @ApiProperty({ type: String, example: 'OpenAI GPT' })
  label: string;

  @ApiPropertyOptional({ type: String, example: 'AiOutlineOpenAI' })
  icon?: string;

  @ApiPropertyOptional({ type: String })
  description?: string;

  @ApiProperty({ type: [String], description: 'Required configuration fields' })
  requiredFields: string[];

  @ApiProperty({ type: [String], description: 'Optional configuration fields' })
  optionalFields: string[];

  @ApiProperty({
    type: 'object',
    description: 'Default values for fields',
    additionalProperties: true,
  })
  defaultValues: Record<string, any>;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * AiProviderConfig domain entity
 * Table: ai_provider_configs
 */
export class AiProviderConfig {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  providerId: string;

  @ApiProperty({ type: AiProvider })
  provider?: AiProvider;

  @ApiProperty({ type: String, example: 'gpt-4.1' })
  model: string;

  @ApiProperty({ type: String, description: 'Encrypted API key' })
  apiKey: string;

  @ApiPropertyOptional({ type: String })
  baseUrl?: string;

  @ApiPropertyOptional({ type: String })
  apiVersion?: string;

  @ApiPropertyOptional({ type: Number })
  timeout?: number;

  @ApiProperty({ type: Boolean, default: true })
  useStream: boolean;

  // @ApiProperty({ type: 'object', description: 'Provider-specific extra fields' })
  // extra: Record<string, any>;

  @ApiProperty({ enum: AiProviderOwnerType })
  ownerType: AiProviderOwnerType;

  @ApiProperty({ type: String })
  ownerId?: string;

  @ApiProperty({ type: Boolean, default: false })
  isDefault: boolean;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * AiUsageLog domain entity - theo schema má»›i
 * Table: ai_usage_logs
 */
export class AiUsageLog {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  provider: string;

  @ApiProperty({ type: String })
  model: string;

  @ApiProperty({ type: Number })
  inputTokens: number;

  @ApiProperty({ type: Number })
  outputTokens: number;

  @ApiProperty({ type: Number, description: 'Cost in USD' })
  cost: number;

  @ApiProperty()
  requestedAt: Date;
}

/**
 * UserAiProviderConfig domain entity
 * Table: user_ai_provider_configs
 */
export class UserAiProviderConfig {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  providerId: string;

  @ApiProperty({ type: AiProvider })
  provider?: AiProvider;

  @ApiProperty({ type: String, example: 'My OpenAI Key' })
  displayName: string;

  @ApiProperty({
    type: 'object',
    description: 'Provider configuration',
    additionalProperties: true,
  })
  config: Record<string, any>;

  @ApiProperty({ type: [String], example: ['gpt-4', 'gpt-3.5-turbo'] })
  modelList: string[];

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * WorkspaceAiProviderConfig domain entity
 * Table: workspace_ai_provider_configs
 */
export class WorkspaceAiProviderConfig {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  providerId: string;

  @ApiProperty({ type: AiProvider })
  provider?: AiProvider;

  @ApiProperty({ type: String, example: 'Team OpenAI Key' })
  displayName: string;

  @ApiProperty({
    type: 'object',
    description: 'Provider configuration',
    additionalProperties: true,
  })
  config: Record<string, any>;

  @ApiProperty({ type: [String] })
  modelList: string[];

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * SystemAiSettings domain entity
 * Table: system_ai_settings
 */
export class SystemAiSettings {
  @ApiProperty({ type: String })
  id: string;

  @ApiPropertyOptional({ type: String })
  defaultProviderId?: string;

  @ApiPropertyOptional({ type: String })
  defaultModel?: string;

  @ApiProperty({ type: Number, default: 0.0 })
  minTemperature: number;

  @ApiProperty({ type: Number, default: 2.0 })
  maxTemperature: number;

  @ApiProperty({ type: Boolean, default: true })
  contentModeration: boolean;

  @ApiProperty({ type: Boolean, default: true })
  safeFallbacks: boolean;

  @ApiProperty({ type: Boolean, default: true })
  contextAware: boolean;

  @ApiProperty({ type: Number, default: 1000 })
  maxRequestsPerHour: number;

  @ApiProperty({ type: Number, default: 100 })
  maxRequestsPerUser: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
