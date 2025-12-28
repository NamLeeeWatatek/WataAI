/**
 * UserProviderConfig domain entity
 * SINGLE RESPONSIBILITY: User-level AI provider configuration
 * Separated from workspace configs for clear ownership boundaries
 */

import { ApiProperty } from '@nestjs/swagger';
import { OwnershipType } from '../enums';
import {
  UserProviderConfig as IUserProviderConfig,
  ConnectionConfig,
  ModelSettings,
} from '../interfaces';

export class UserProviderConfig implements IUserProviderConfig {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  providerId: string;

  @ApiProperty({
    type: String,
    example: 'My Personal OpenAI Config',
  })
  displayName: string;

  @ApiProperty({
    type: 'object',
    description: 'Provider-specific configuration',
    additionalProperties: true,
  })
  config: Record<string, any>;

  @ApiProperty({
    type: [String],
    example: ['gpt-4', 'gpt-3.5-turbo'],
  })
  modelList: string[];

  @ApiProperty({ enum: OwnershipType, default: OwnershipType.USER })
  readonly ownerType: OwnershipType = OwnershipType.USER;

  @ApiProperty({
    type: String,
    description: 'User ID (same as ownerId for consistency)',
  })
  get ownerId(): string {
    return this.userId;
  }

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ type: Boolean, default: false })
  isDefault: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Business logic methods
  getConnectionConfig(): ConnectionConfig {
    return {
      baseUrl: this.config.baseUrl,
      timeout: this.config.timeout ?? 60000,
      apiVersion: this.config.apiVersion ?? 'v1',
      streamEnabled: this.config.useStream ?? true,
      retryAttempts: this.config.retryAttempts ?? 3,
      rateLimitPerMinute: this.config.rateLimitPerMinute ?? 60,
    };
  }

  getModelSettings(): ModelSettings {
    const defaultModel =
      this.modelList.length > 0 ? this.modelList[0] : 'gpt-3.5-turbo';

    return {
      availableModels: this.modelList,
      defaultModel: this.config.defaultModel ?? defaultModel,
      contextWindow: this.config.contextWindow ?? 4096,
      supportsFunctionCalling: this.config.supportsFunctionCalling ?? true,
    };
  }

  // Domain behavior methods
  hasApiKey(): boolean {
    // Check if this config has associated API key (not stored here)
    return true; // In reality would check SecureApiKey existence
  }

  updateConfig(updates: Partial<Record<string, any>>): void {
    this.config = { ...this.config, ...updates };
    this.updatedAt = new Date();
  }

  setAsDefault(): void {
    this.isDefault = true;
    this.updatedAt = new Date();
  }

  unsetAsDefault(): void {
    this.isDefault = false;
    this.updatedAt = new Date();
  }

  addModel(modelName: string): void {
    if (!this.modelList.includes(modelName)) {
      this.modelList.push(modelName);
      this.updatedAt = new Date();
    }
  }

  removeModel(modelName: string): void {
    const index = this.modelList.indexOf(modelName);
    if (index > -1) {
      this.modelList.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  // Security validation
  canModify(requestingUserId: string): boolean {
    return this.userId === requestingUserId;
  }

  canDelete(requestingUserId: string): boolean {
    return this.canModify(requestingUserId);
  }

  // Factory method for clean creation
  static create(
    userId: string,
    providerId: string,
    displayName: string,
    config: Record<string, any>,
    modelList: string[],
  ): UserProviderConfig {
    const userConfig = new UserProviderConfig();
    userConfig.id = crypto.randomUUID();
    userConfig.userId = userId;
    userConfig.providerId = providerId;
    userConfig.displayName = displayName;
    userConfig.config = config;
    userConfig.modelList = modelList;
    userConfig.isActive = true;
    userConfig.isDefault = false;
    userConfig.createdAt = new Date();
    userConfig.updatedAt = new Date();
    return userConfig;
  }

  // Domain service methods
  validateConfig(): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!this.displayName || this.displayName.trim().length === 0) {
      errors.push('Display name is required');
    }

    if (!this.providerId) {
      errors.push('Provider ID is required');
    }

    if (!this.userId) {
      errors.push('User ID is required');
    }

    if (this.modelList.length === 0) {
      errors.push('At least one model must be selected');
    }

    // Config-specific validations
    if (this.config.baseUrl && !this.isValidUrl(this.config.baseUrl)) {
      errors.push('Invalid base URL format');
    }

    if (
      this.config.timeout &&
      (this.config.timeout < 1000 || this.config.timeout > 300000)
    ) {
      errors.push('Timeout must be between 1000-300000ms');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Metadata for API responses
  toPublicResponse() {
    return {
      id: this.id,
      userId: this.userId,
      providerId: this.providerId,
      displayName: this.displayName,
      modelList: this.modelList,
      isActive: this.isActive,
      isDefault: this.isDefault,
      // Exclude sensitive config details
      connectionInfo: {
        baseUrl: this.getConnectionConfig().baseUrl,
        timeout: this.getConnectionConfig().timeout,
        streamEnabled: this.getConnectionConfig().streamEnabled,
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
