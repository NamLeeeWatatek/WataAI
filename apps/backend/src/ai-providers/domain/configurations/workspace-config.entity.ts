/**
 * WorkspaceProviderConfig domain entity
 * SINGLE RESPONSIBILITY: Workspace-level AI provider configuration
 * Separated from user configs for clear multi-tenancy boundaries
 * Supports team collaboration on AI configurations
 */

import { ApiProperty } from '@nestjs/swagger';
import { OwnershipType } from '../enums';
import {
  WorkspaceProviderConfig as IWorkspaceProviderConfig,
  ConnectionConfig,
  ModelSettings,
} from '../interfaces';

export class WorkspaceProviderConfig implements IWorkspaceProviderConfig {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  providerId: string;

  @ApiProperty({
    type: String,
    example: 'Team OpenAI Config',
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
    example: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
  })
  modelList: string[];

  @ApiProperty({ enum: OwnershipType, default: OwnershipType.WORKSPACE })
  readonly ownerType: OwnershipType = OwnershipType.WORKSPACE;

  @ApiProperty({
    type: String,
    description: 'Workspace ID (same as ownerId for consistency)',
  })
  get ownerId(): string {
    return this.workspaceId;
  }

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ type: Boolean, default: false })
  isDefault: boolean;

  @ApiProperty({
    type: String,
    description: 'User who created this configuration',
  })
  createdBy: string;

  @ApiProperty({
    type: String,
    description: 'Last user who modified this configuration',
  })
  updatedBy: string;

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
      rateLimitPerMinute: this.config.rateLimitPerMinute ?? 100, // Higher for workspaces
    };
  }

  getModelSettings(): ModelSettings {
    const defaultModel =
      this.modelList.length > 0 ? this.modelList[0] : 'gpt-4';

    return {
      availableModels: this.modelList,
      defaultModel: this.config.defaultModel ?? defaultModel,
      contextWindow: this.config.contextWindow ?? 8192, // Higher default for workspaces
      supportsFunctionCalling: this.config.supportsFunctionCalling ?? true,
    };
  }

  // Workspace-specific business logic
  canModify(requestingUserId: string, userRole?: string): boolean {
    // In workspace context, different roles have different permissions
    if (this.createdBy === requestingUserId) {
      return true; // Creator can always modify
    }

    // Check workspace role-based permissions
    const allowedRoles = ['admin', 'owner', 'editor'];
    return userRole ? allowedRoles.includes(userRole.toLowerCase()) : false;
  }

  canDelete(requestingUserId: string, userRole?: string): boolean {
    // Stricter delete permissions
    if (this.createdBy === requestingUserId) {
      return true; // Creator can delete their configs
    }

    // Only admin/owner can delete others' configs
    const adminRoles = ['admin', 'owner'];
    return userRole ? adminRoles.includes(userRole.toLowerCase()) : false;
  }

  // Collaboration features
  addTeamMember(userId: string): void {
    if (!this.config.teamMembers) {
      this.config.teamMembers = [];
    }

    if (!this.config.teamMembers.includes(userId)) {
      this.config.teamMembers.push(userId);
      this.updatedAt = new Date();
    }
  }

  removeTeamMember(userId: string): void {
    if (this.config.teamMembers) {
      const index = this.config.teamMembers.indexOf(userId);
      if (index > -1) {
        this.config.teamMembers.splice(index, 1);
        this.updatedAt = new Date();
      }
    }
  }

  getTeamMembers(): string[] {
    return this.config.teamMembers || [];
  }

  isTeamMember(userId: string): boolean {
    return this.config.teamMembers?.includes(userId) ?? false;
  }

  // Workspace usage analytics
  trackUsage(
    userId: string,
    action: 'chat' | 'embedding' | 'moderation',
  ): void {
    const today = new Date().toISOString().split('T')[0];

    if (!this.config.usageStats) {
      this.config.usageStats = {};
    }

    if (!this.config.usageStats[today]) {
      this.config.usageStats[today] = {
        chat: 0,
        embedding: 0,
        moderation: 0,
        users: new Set(),
        cost: 0,
      };
    }

    this.config.usageStats[today][action]++;
    this.config.usageStats[today].users.add(userId);
    this.updatedAt = new Date();
  }

  getUsageStats(date?: string): WorkspaceUsageStats {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const stats = this.config.usageStats?.[targetDate];

    if (!stats) {
      return { chat: 0, embedding: 0, moderation: 0, uniqueUsers: 0, cost: 0 };
    }

    return {
      chat: stats.chat || 0,
      embedding: stats.embedding || 0,
      moderation: stats.moderation || 0,
      uniqueUsers: stats.users?.size || 0,
      cost: stats.cost || 0,
    };
  }

  // Budget controls for workspaces
  hasExceededBudget(): boolean {
    const stats = this.getUsageStats();
    const budget = this.config.monthlyBudget || 1000; // Default $1000
    return stats.cost > budget;
  }

  addBudgetWarning(): void {
    this.config.budgetWarnings = (this.config.budgetWarnings || 0) + 1;
  }

  // Domain validation
  validateConfig(): WorkspaceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!this.displayName || this.displayName.trim().length === 0) {
      errors.push('Display name is required');
    }

    if (!this.providerId) {
      errors.push('Provider ID is required');
    }

    if (!this.workspaceId) {
      errors.push('Workspace ID is required');
    }

    if (!this.createdBy) {
      errors.push('Creator is required');
    }

    if (this.modelList.length === 0) {
      errors.push('At least one model must be selected');
    }

    // Workspace-specific validations
    if (this.modelList.length > 10) {
      warnings.push(
        'Large number of models selected - consider reducing for cost control',
      );
    }

    if (this.config.baseUrl && !this.isValidUrl(this.config.baseUrl)) {
      errors.push('Invalid base URL format');
    }

    if (
      this.config.timeout &&
      (this.config.timeout < 5000 || this.config.timeout > 300000)
    ) {
      errors.push('Timeout recommended to be between 5000-300000ms');
    }

    // Budget validation
    if (this.config.monthlyBudget && this.config.monthlyBudget < 50) {
      warnings.push('Monthly budget seems too low - consider increasing');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      criticalWarnings: warnings.filter(
        (w) => w.includes('budget') || w.includes('cost'),
      ),
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

  // Factory method for clean creation
  static create(
    workspaceId: string,
    providerId: string,
    displayName: string,
    config: Record<string, any>,
    modelList: string[],
    createdBy: string,
  ): WorkspaceProviderConfig {
    const workspaceConfig = new WorkspaceProviderConfig();
    workspaceConfig.id = crypto.randomUUID();
    workspaceConfig.workspaceId = workspaceId;
    workspaceConfig.providerId = providerId;
    workspaceConfig.displayName = displayName;
    workspaceConfig.config = config;
    workspaceConfig.modelList = modelList;
    workspaceConfig.isActive = true;
    workspaceConfig.isDefault = false;
    workspaceConfig.createdBy = createdBy;
    workspaceConfig.updatedBy = createdBy;
    workspaceConfig.createdAt = new Date();
    workspaceConfig.updatedAt = new Date();
    return workspaceConfig;
  }

  // Enhanced public response for workspaces
  toWorkspaceResponse(teamMemberView: boolean = false) {
    const baseResponse = {
      id: this.id,
      workspaceId: this.workspaceId,
      providerId: this.providerId,
      displayName: this.displayName,
      modelList: this.modelList,
      isActive: this.isActive,
      isDefault: this.isDefault,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };

    if (teamMemberView) {
      // Team members see usage stats but not sensitive config
      const todayStats = this.getUsageStats();
      return {
        ...baseResponse,
        connectionInfo: {
          timeout: this.getConnectionConfig().timeout,
          streamEnabled: this.getConnectionConfig().streamEnabled,
        },
        teamSize: this.getTeamMembers().length,
        todayUsage: todayStats,
        budgetStatus: {
          exceeded: this.hasExceededBudget(),
          warnings: this.config.budgetWarnings || 0,
        },
      };
    }

    // Admin/owner view gets full response
    return {
      ...baseResponse,
      config: this.config, // Full config for admins
      teamMembers: this.getTeamMembers(),
      usageStats: this.config.usageStats,
      budgetConfig: {
        monthlyBudget: this.config.monthlyBudget,
        budgetWarnings: this.config.budgetWarnings,
      },
    };
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface WorkspaceValidationResult extends ValidationResult {
  warnings: string[];
  criticalWarnings: string[];
}

interface WorkspaceUsageStats {
  chat: number;
  embedding: number;
  moderation: number;
  uniqueUsers: number;
  cost: number;
}
