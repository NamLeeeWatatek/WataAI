/**
 * Common interfaces for AI Providers domain
 * Clean contracts between layers
 */

import { ProviderKey, OwnershipType, AiProviderErrorCode } from './enums';

// Core domain interfaces - Business logic contracts
export interface IAiProvider {
  id: string;
  key: ProviderKey;
  label: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  requiredFields: ConfigField[];
  defaultValues: Record<string, any>;
  getRequiredConfigFields(): ConfigField[];
  getDefaultValues(): Record<string, any>;
  supportsStreaming(): boolean;
  getContextWindow(model?: string): number;
  hasFunctionCalling(model?: string): boolean;
}

export interface IProviderConfiguration {
  id: string;
  providerId: string;
  ownerType: OwnershipType;
  ownerId: string;
  isActive: boolean;
  isDefault: boolean;
  getConnectionConfig(): ConnectionConfig;
  getModelSettings(): ModelSettings;
}

// Value Objects - Immutable data structures
export interface ConfigField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  default?: any;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string | RegExp;
  };
}

export interface ConnectionConfig {
  baseUrl?: string;
  timeout?: number;
  apiVersion?: string;
  streamEnabled: boolean;
  retryAttempts: number;
  rateLimitPerMinute: number;
}

export interface ModelSettings {
  availableModels: string[];
  defaultModel: string;
  contextWindow: number;
  supportsFunctionCalling: boolean;
}

// Application layer interfaces - Service contracts
export interface IAiConversationalService {
  generateChat(request: ChatRequest): Promise<ChatResponse>;
  generateEmbedding(text: string, model?: string): Promise<number[]>;
  validateProviderAvailability(providerId: string): Promise<boolean>;
}

export interface IProviderManagementService {
  getActiveProviders(): Promise<IAiProvider[]>;
  createProvider(config: CreateProviderRequest): Promise<IAiProvider>;
  updateProvider(
    id: string,
    updates: Partial<CreateProviderRequest>,
  ): Promise<IAiProvider>;
  deactivateProvider(id: string): Promise<void>;
}

export interface IConfigurationService {
  createUserConfig(
    request: CreateUserConfigRequest,
  ): Promise<UserProviderConfig>;
  createWorkspaceConfig(
    request: CreateWorkspaceConfigRequest,
  ): Promise<WorkspaceProviderConfig>;
  updateConfig(
    id: string,
    updates: UpdateConfigRequest,
  ): Promise<IProviderConfiguration>;
  deleteConfig(
    id: string,
    ownerType: OwnershipType,
    ownerId: string,
  ): Promise<void>;
}

export interface IUsageTrackingService {
  logUsage(logEntry: UsageLogEntry): Promise<void>;
  getUsageStats(
    ownerType: OwnershipType,
    ownerId: string,
    period: UsagePeriod,
  ): Promise<UsageStats>;
  enforceRateLimits(
    providerId: string,
    ownerType: OwnershipType,
    ownerId: string,
  ): Promise<RateLimitStatus>;
}

// Infrastructure layer interfaces - Technical contracts
export interface IAiClient {
  chat(request: ChatRequest): Promise<ChatResponse>;
  generateEmbedding(text: string, model?: string): Promise<number[]>;
  validateConnection(): Promise<boolean>;
}

export interface IAiProviderRepository {
  findById(id: string): Promise<IAiProvider | null>;
  findByKey(key: ProviderKey): Promise<IAiProvider | null>;
  findActiveProviders(): Promise<IAiProvider[]>;
  save(provider: IAiProvider): Promise<IAiProvider>;
}

export interface IConfigurationRepository {
  saveUserConfig(config: UserProviderConfig): Promise<UserProviderConfig>;
  saveWorkspaceConfig(
    config: WorkspaceProviderConfig,
  ): Promise<WorkspaceProviderConfig>;
  findUserConfigs(userId: string): Promise<UserProviderConfig[]>;
  findWorkspaceConfigs(workspaceId: string): Promise<WorkspaceProviderConfig[]>;
  findById(
    id: string,
    ownerType: OwnershipType,
  ): Promise<IProviderConfiguration | null>;
}

export interface ISecureKeyRepository {
  saveKey(keyData: SecureKeyData): Promise<SecureKey>;
  getKey(keyId: string, ownerId: string): Promise<SecureKey>;
  updateKey(keyId: string, encryptedKey: string): Promise<void>;
  deleteKey(keyId: string, ownerId: string): Promise<void>;
}

// Request/Response DTOs - Application boundaries
export interface CreateProviderRequest {
  key: ProviderKey;
  label: string;
  description?: string;
  requiredFields: ConfigField[];
  defaultValues: Record<string, any>;
  isActive?: boolean;
}

export interface CreateUserConfigRequest {
  providerId: string;
  displayName: string;
  config: Record<string, any>;
  modelList: string[];
}

export interface CreateWorkspaceConfigRequest {
  providerId: string;
  displayName: string;
  config: Record<string, any>;
  modelList: string[];
  workspaceId: string;
}

export interface UpdateConfigRequest {
  displayName?: string;
  config?: Record<string, any>;
  modelList?: string[];
  isActive?: boolean;
  isDefault?: boolean;
}

export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  providerConfig?: IProviderConfiguration;
}

export interface ChatResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  metadata: {
    model: string;
    finishReason: string;
    latency: number;
  };
}

// Error types with structured information
export interface AiProviderErrorDetails {
  code: AiProviderErrorCode;
  message: string;
  provider?: ProviderKey;
  retryable: boolean;
  details?: Record<string, any>;
}

// Supporting types
export interface SecureKey {
  id: string;
  encryptedKey: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecureKeyData {
  encryptedKey: string;
  ownerId: string;
}

export interface UsageLogEntry {
  workspaceId?: string;
  userId: string;
  provider: ProviderKey;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestDuration: number;
  success: boolean;
  errorCode?: AiProviderErrorCode;
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  period: UsagePeriod;
  breakdowns: {
    byProvider: Record<ProviderKey, number>;
    byModel: Record<string, number>;
    byDay: Record<string, number>;
  };
}

export interface UsagePeriod {
  startDate: Date;
  endDate: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface RateLimitStatus {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  currentUsage: number;
}

// Domain entities - Simplified interfaces
export interface UserProviderConfig extends IProviderConfiguration {
  userId: string;
  displayName: string;
  config: Record<string, any>;
  modelList: string[];
}

export interface WorkspaceProviderConfig extends IProviderConfiguration {
  workspaceId: string;
  displayName: string;
  config: Record<string, any>;
  modelList: string[];
}
