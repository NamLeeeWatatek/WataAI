import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiProvidersService } from './ai-providers.service';
import { AiModel } from './domain/ai-provider';
import {
  CreateUserAiProviderConfigDto,
  UpdateUserAiProviderConfigDto,
  CreateWorkspaceAiProviderConfigDto,
  UpdateWorkspaceAiProviderConfigDto,
  UpdateSystemAiSettingsDto,
  VerifyApiKeyDto,
  QueryAiModelDto,
} from './dto/ai-provider.dto';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import {
  AiProvider,
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiUsageLog,
  SystemAiSettings,
} from './domain/ai-provider';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('AI Providers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({
  path: 'ai-providers',
  version: '1',
})
@ApiExtraModels(AiModel)
export class AiProvidersController {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

  @Get('models')
  @ApiOperation({ summary: 'Find AI models with pagination' })
  @ApiOkResponse({ type: InfinityPaginationResponseDto })
  async getPagedModels(@Query() query: QueryAiModelDto) {
    return this.aiProvidersService.findModelsWithPagination(query);
  }

  @Permissions('ai:Get')
  @Get('unified-config/:id/details')
  @ApiOperation({ summary: 'Get unified config details' })
  @ApiOkResponse({ type: UserAiProviderConfig }) // or WorkspaceAiProviderConfig
  async getConfigDetails(
    @Param('id') id: string,
    @Request() req,
    @Query('workspaceId') workspaceId?: string,
  ) {
    const config = await this.aiProvidersService.getConfigDetails(
      id,
      req.user.id,
      workspaceId,
    );
    if (!config) return null;
    return {
      ...config,
      config: this.aiProvidersService.maskConfig(config.config),
    };
  }

  // Get all available AI providers (global list)
  @Get()
  @ApiOperation({ summary: 'Get all available AI providers' })
  @ApiOkResponse({ type: [AiProvider] })
  getAvailableProviders() {
    return this.aiProvidersService.getAvailableProviders();
  }

  // Get a specific provider by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get AI provider by ID' })
  @ApiOkResponse({ type: AiProvider })
  @ApiParam({ name: 'id', type: String })
  getProviderById(@Param('id') id: string) {
    return this.aiProvidersService.getProviderById(id);
  }

  // User configs
  @Post('user/configs')
  @Permissions('ai:Create')
  @ApiOperation({ summary: 'Create user AI provider config' })
  @ApiCreatedResponse({ type: UserAiProviderConfig })
  @HttpCode(HttpStatus.CREATED)
  async createUserConfig(
    @Body() dto: CreateUserAiProviderConfigDto,
    @Request() req,
  ) {
    const config = await this.aiProvidersService.createUserConfig(
      req.user.id,
      dto,
    );
    return {
      ...config,
      config: this.aiProvidersService.maskConfig(config.config),
    };
  }

  @Get('user/configs')
  @Permissions('ai:List')
  @ApiOperation({ summary: 'Get user AI provider configs' })
  @ApiOkResponse({ type: [UserAiProviderConfig] })
  async getUserConfigs(@Request() req) {
    const configs = await this.aiProvidersService.getUserConfigs(req.user.id);
    return configs.map((c) => ({
      ...c,
      config: this.aiProvidersService.maskConfig(c.config),
    }));
  }

  @Get('user/configs/:id')
  @Permissions('ai:Get')
  @ApiOperation({ summary: 'Get user AI provider config by ID' })
  @ApiOkResponse({ type: UserAiProviderConfig })
  @ApiParam({ name: 'id', type: String })
  async getUserConfig(@Param('id') id: string, @Request() req) {
    const config = await this.aiProvidersService.getUserConfig(req.user.id, id);
    if (!config) return null;
    return {
      ...config,
      config: this.aiProvidersService.maskConfig(config.config),
    };
  }

  @Patch('user/configs/:id')
  @Permissions('ai:Update')
  @ApiOperation({ summary: 'Update user AI provider config' })
  @ApiOkResponse({ type: UserAiProviderConfig })
  @ApiParam({ name: 'id', type: String })
  async updateUserConfig(
    @Param('id') id: string,
    @Body() dto: UpdateUserAiProviderConfigDto,
    @Request() req,
  ) {
    const config = await this.aiProvidersService.updateUserConfig(
      req.user.id,
      id,
      dto,
    );
    return {
      ...config,
      config: this.aiProvidersService.maskConfig(config.config),
    };
  }

  @Delete('user/configs/:id')
  @Permissions('ai:Delete')
  @ApiOperation({ summary: 'Delete user AI provider config' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUserConfig(@Param('id') id: string, @Request() req) {
    return this.aiProvidersService.deleteUserConfig(req.user.id, id);
  }

  @Post('user/configs/:id/verify')
  @ApiOperation({ summary: 'Verify user AI provider config API key' })
  @ApiOkResponse({ type: UserAiProviderConfig })
  @ApiParam({ name: 'id', type: String })
  verifyUserConfig(@Param('id') id: string, @Request() req) {
    return this.aiProvidersService.verifyUserConfig(req.user.id, id);
  }

  @Permissions('ai:Create')
  @Post('workspace/:workspaceId/configs')
  @ApiOperation({ summary: 'Create workspace AI provider config' })
  @ApiCreatedResponse({ type: WorkspaceAiProviderConfig })
  @ApiParam({ name: 'workspaceId', type: String })
  @HttpCode(HttpStatus.CREATED)
  async createWorkspaceConfig(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkspaceAiProviderConfigDto,
  ) {
    const config = await this.aiProvidersService.createWorkspaceConfig(
      workspaceId,
      dto,
    );
    return {
      ...config,
      config: this.aiProvidersService.maskConfig(config.config),
    };
  }

  @Permissions('ai:List')
  @Get('workspace/:workspaceId/configs')
  @ApiOperation({ summary: 'Get workspace AI provider configs' })
  @ApiOkResponse({ type: [WorkspaceAiProviderConfig] })
  @ApiParam({ name: 'workspaceId', type: String })
  async getWorkspaceConfigs(@Param('workspaceId') workspaceId: string) {
    const configs =
      await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
    return configs.map((c) => ({
      ...c,
      config: this.aiProvidersService.maskConfig(c.config),
    }));
  }

  @Permissions('ai:Get')
  @Get('workspace/:workspaceId/configs/:id')
  @ApiOperation({ summary: 'Get workspace AI provider config by ID' })
  @ApiOkResponse({ type: WorkspaceAiProviderConfig })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  async getWorkspaceConfig(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    const config = await this.aiProvidersService.getWorkspaceConfig(
      workspaceId,
      id,
    );
    if (!config) return null;
    return {
      ...config,
      config: this.aiProvidersService.maskConfig(config.config),
    };
  }

  @Permissions('ai:Update')
  @Patch('workspace/:workspaceId/configs/:id')
  @ApiOperation({ summary: 'Update workspace AI provider config' })
  @ApiOkResponse({ type: WorkspaceAiProviderConfig })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  async updateWorkspaceConfig(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceAiProviderConfigDto,
  ) {
    const config = await this.aiProvidersService.updateWorkspaceConfig(
      workspaceId,
      id,
      dto,
    );
    return {
      ...config,
      config: this.aiProvidersService.maskConfig(config.config),
    };
  }

  @Permissions('ai:Delete')
  @Delete('workspace/:workspaceId/configs/:id')
  @ApiOperation({ summary: 'Delete workspace AI provider config' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteWorkspaceConfig(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.aiProvidersService.deleteWorkspaceConfig(workspaceId, id);
  }

  @Permissions('ai:List')
  @Get('workspace/:workspaceId/usage')
  @ApiOperation({ summary: 'Get workspace AI usage logs' })
  @ApiOkResponse({ type: [AiUsageLog] })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'provider', required: false, type: String })
  getUsageLogs(
    @Param('workspaceId') workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('provider') provider?: string,
  ) {
    return this.aiProvidersService.getUsageLogs(workspaceId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      provider,
    });
  }

  @Permissions('ai:List')
  @Get('workspace/:workspaceId/usage/stats')
  @ApiOperation({ summary: 'Get workspace AI usage statistics' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'], required: false })
  getUsageStats(
    @Param('workspaceId') workspaceId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.aiProvidersService.getUsageStats(workspaceId, period);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify an API key without saving' })
  async verifyApiKey(@Body() dto: VerifyApiKeyDto) {
    await this.aiProvidersService.verifyApiKey(dto);
    return { valid: true, message: 'API key verification endpoint' };
  }

  @Get('user/models')
  @ApiOperation({ summary: 'Get available AI models from user configs' })
  @ApiOkResponse({
    description: 'List of available AI models from user configured providers',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          providerId: { type: 'string' },
          providerKey: { type: 'string' },
          providerName: { type: 'string' },
          configId: { type: 'string' },
          models: {
            type: 'array',
            items: { $ref: getSchemaPath(AiModel) },
          },
        },
      },
    },
  })
  async getUserAvailableModels(@Request() req) {
    const userId = req.user.id;
    const configs = await this.aiProvidersService.getUserConfigs(userId);

    const results = await Promise.all(
      configs
        .filter((config) => config.isActive)
        .map(async (config) => {
          const models = await this.aiProvidersService.getModelsByConfig(
            config.id,
            'user',
            userId,
          );

          return {
            providerId: config.providerId,
            providerKey: config.provider?.key || '',
            providerName:
              config.displayName || config.provider?.label || config.providerId,
            configId: config.id,
            models,
          };
        }),
    );

    return results;
  }
  @Get('user/config/:configId/models')
  @ApiOperation({ summary: 'Get persisted AI models for a user config' })
  @ApiParam({ name: 'configId', type: String })
  @ApiOkResponse({ type: [AiModel] })
  async getUserModelsByConfig(
    @Param('configId') configId: string,
    @Query('type') type: string,
    @Request() req,
  ) {
    return this.aiProvidersService.getModelsByConfig(
      configId,
      'user',
      req.user.id,
      type,
    );
  }

  @Post('user/config/:configId/fetch-models')
  @ApiOperation({ summary: 'Fetch models from provider and update cache' })
  @ApiParam({ name: 'configId', type: String })
  @ApiOkResponse({ type: [AiModel] })
  async fetchUserModels(@Param('configId') configId: string, @Request() req) {
    return this.aiProvidersService.fetchProviderModels(
      configId,
      'user',
      req.user.id,
    );
  }

  @Post('workspace/:workspaceId/config/:configId/fetch-models')
  @Permissions('ai:List')
  @ApiOperation({ summary: 'Fetch models from provider and update cache' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'configId', type: String })
  @ApiOkResponse({ type: [AiModel] })
  async fetchWorkspaceModels(
    @Param('workspaceId') workspaceId: string,
    @Param('configId') configId: string,
  ) {
    return this.aiProvidersService.fetchProviderModels(
      configId,
      'workspace',
      workspaceId,
    );
  }

  @Get('workspace/:workspaceId/config/:configId/models')
  @ApiOperation({ summary: 'Get persisted AI models for a workspace config' })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'configId', type: String })
  @ApiOkResponse({ type: [AiModel] })
  async getWorkspaceModelsByConfig(
    @Param('configId') configId: string,
    @Param('workspaceId') workspaceId: string,
    @Query('type') type: string,
  ) {
    return this.aiProvidersService.getModelsByConfig(
      configId,
      'workspace',
      workspaceId,
      type,
    );
  }

  @Get('workspace/:workspaceId/models')
  @ApiOperation({ summary: 'Get available AI models from workspace configs' })
  @ApiOkResponse({
    description:
      'List of available AI models from workspace configured providers',
  })
  @ApiParam({ name: 'workspaceId', type: String })
  async getWorkspaceAvailableModels(@Param('workspaceId') workspaceId: string) {
    const configs =
      await this.aiProvidersService.getWorkspaceConfigs(workspaceId);

    const results = await Promise.all(
      configs
        .filter((config) => config.isActive)
        .map(async (config) => {
          const models = await this.aiProvidersService.getModelsByConfig(
            config.id,
            'workspace',
            workspaceId,
          );

          return {
            providerId: config.providerId,
            providerKey: config.provider?.key || '',
            providerName:
              config.displayName || config.provider?.label || config.providerId,
            configId: config.id,
            models,
          };
        }),
    );

    return results;
  }

  @Post('generate-prompt')
  @ApiOperation({
    summary:
      'Generate an enhanced system prompt based on detailed user requirements',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string' },
        improvements: {
          type: 'array',
          items: { type: 'string' },
        },
        suggestions: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async generatePrompt(
    @Body()
    dto: {
      description: string;
      template?: string;
      providerConfigId?: string;
      tone?: string;
      style?: string;
      additionalContext?: Record<string, unknown>;
    },
    @Request() req,
  ) {
    return this.aiProvidersService.generateSystemPrompt({
      userId: req.user.id,
      description: dto.description,
      template: dto.template,
      providerConfigId: dto.providerConfigId,
      tone: dto.tone,
      style: dto.style,
      additionalContext: dto.additionalContext,
    });
  }

  @Post('enhance-prompt')
  @ApiOperation({ summary: 'Enhance a user prompt using AI' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        enhancedPrompt: { type: 'string' },
      },
    },
  })
  async enhanceUserPrompt(
    @Body()
    dto: { prompt: string; type?: 'image' | 'text' | 'code' | 'general' },
    @Request() req,
  ) {
    const enhanced = await this.aiProvidersService.enhancePrompt(
      req.user.id,
      dto.prompt,
      dto.type,
    );
    return { enhancedPrompt: enhanced };
  }

  // System AI Settings endpoints
  @Get('system/settings')
  @Permissions('ai:Get')
  @ApiOperation({ summary: 'Get system AI settings' })
  @ApiOkResponse({ type: SystemAiSettings })
  getSystemAiSettings() {
    return this.aiProvidersService.getSystemAiSettings();
  }

  @Patch('system/settings')
  @Permissions('ai:Update')
  @ApiOperation({ summary: 'Update system AI settings' })
  @ApiOkResponse({ type: SystemAiSettings })
  updateSystemAiSettings(@Body() dto: UpdateSystemAiSettingsDto) {
    return this.aiProvidersService.updateSystemAiSettings(dto);
  }

  @Get('workspace/:workspaceId/providers')
  @ApiOperation({ summary: 'Get available providers for workspace' })
  @ApiOkResponse({ type: [AiProvider] })
  @ApiParam({ name: 'workspaceId', type: String })
  getWorkspaceProviders(@Param('workspaceId') workspaceId: string) {
    return this.aiProvidersService.getWorkspaceProviders(workspaceId);
  }

  @Get('user/providers')
  @ApiOperation({ summary: 'Get available providers for user' })
  @ApiOkResponse({ type: [AiProvider] })
  getUserProviders(@Request() req) {
    return this.aiProvidersService.getUserProviders(req.user.id);
  }

  @Get('fetch-models/:configId/user')
  @ApiOperation({
    summary: 'Fetch available models from user AI provider config',
  })
  @ApiOkResponse({
    type: [String],
    description: 'Array of available model names from the provider',
  })
  @ApiParam({ name: 'configId', type: String })
  async fetchModelsForUserConfig(
    @Param('configId') configId: string,
    @Request() req,
  ) {
    const models = await this.aiProvidersService.fetchProviderModels(
      configId,
      'user',
      req.user.id,
    );
    return models.map((m) => m.name);
  }

  @Post('verify-models')
  @ApiOperation({
    summary: 'Verify API key and fetch models without saving config',
  })
  @ApiOkResponse({
    type: [String],
    description: 'Array of available model names from the provider',
  })
  async verifyApiKeyAndGetModels(
    @Body()
    dto: {
      providerId: string;
      config: Record<string, unknown>;
      configId?: string;
    },
    @Request() req,
  ) {
    // Call service method with smart merging for masked keys
    return this.aiProvidersService.fetchModelsWithPotentialMask(
      dto.providerId,
      dto.config,
      req.user.id,
      dto.configId,
    );
  }
}
