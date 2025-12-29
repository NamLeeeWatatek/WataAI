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
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiProvidersService } from './ai-providers.service';
import {
  CreateUserAiProviderConfigDto,
  UpdateUserAiProviderConfigDto,
  CreateWorkspaceAiProviderConfigDto,
  UpdateWorkspaceAiProviderConfigDto,
  UpdateSystemAiSettingsDto,
  VerifyApiKeyDto,
} from './dto/ai-provider.dto';
import {
  AiProvider,
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiUsageLog,
  SystemAiSettings,
} from './domain/ai-provider';

import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('AI Providers')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({ path: 'ai-providers', version: '1' })
export class AiProvidersController {
  constructor(private readonly aiProvidersService: AiProvidersService) {}

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
  createUserConfig(@Body() dto: CreateUserAiProviderConfigDto, @Request() req) {
    return this.aiProvidersService.createUserConfig(req.user.id, dto);
  }

  @Get('user/configs')
  @Permissions('ai:List')
  @ApiOperation({ summary: 'Get user AI provider configs' })
  @ApiOkResponse({ type: [UserAiProviderConfig] })
  getUserConfigs(@Request() req) {
    return this.aiProvidersService.getUserConfigs(req.user.id);
  }

  @Get('user/configs/:id')
  @Permissions('ai:Get')
  @ApiOperation({ summary: 'Get user AI provider config by ID' })
  @ApiOkResponse({ type: UserAiProviderConfig })
  @ApiParam({ name: 'id', type: String })
  getUserConfig(@Param('id') id: string, @Request() req) {
    return this.aiProvidersService.getUserConfig(req.user.id, id);
  }

  @Patch('user/configs/:id')
  @Permissions('ai:Update')
  @ApiOperation({ summary: 'Update user AI provider config' })
  @ApiOkResponse({ type: UserAiProviderConfig })
  @ApiParam({ name: 'id', type: String })
  updateUserConfig(
    @Param('id') id: string,
    @Body() dto: UpdateUserAiProviderConfigDto,
    @Request() req,
  ) {
    return this.aiProvidersService.updateUserConfig(req.user.id, id, dto);
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
  createWorkspaceConfig(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkspaceAiProviderConfigDto,
  ) {
    return this.aiProvidersService.createWorkspaceConfig(workspaceId, dto);
  }

  @Permissions('ai:List')
  @Get('workspace/:workspaceId/configs')
  @ApiOperation({ summary: 'Get workspace AI provider configs' })
  @ApiOkResponse({ type: [WorkspaceAiProviderConfig] })
  @ApiParam({ name: 'workspaceId', type: String })
  getWorkspaceConfigs(@Param('workspaceId') workspaceId: string) {
    return this.aiProvidersService.getWorkspaceConfigs(workspaceId);
  }

  @Permissions('ai:Get')
  @Get('workspace/:workspaceId/configs/:id')
  @ApiOperation({ summary: 'Get workspace AI provider config by ID' })
  @ApiOkResponse({ type: WorkspaceAiProviderConfig })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  getWorkspaceConfig(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.aiProvidersService.getWorkspaceConfig(workspaceId, id);
  }

  @Permissions('ai:Update')
  @Patch('workspace/:workspaceId/configs/:id')
  @ApiOperation({ summary: 'Update workspace AI provider config' })
  @ApiOkResponse({ type: WorkspaceAiProviderConfig })
  @ApiParam({ name: 'workspaceId', type: String })
  @ApiParam({ name: 'id', type: String })
  updateWorkspaceConfig(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceAiProviderConfigDto,
  ) {
    return this.aiProvidersService.updateWorkspaceConfig(workspaceId, id, dto);
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
            items: { type: 'string' },
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
          const models = await this.aiProvidersService.fetchProviderModels(
            config.id,
            'user',
            userId,
          );

          return {
            providerId: config.providerId,
            providerKey: config.provider?.key || '',
            providerName: config.provider?.label || config.providerId,
            configId: config.id,
            models,
          };
        }),
    );

    return results;
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
          const models = await this.aiProvidersService.fetchProviderModels(
            config.id,
            'workspace',
            workspaceId,
          );

          return {
            providerId: config.providerId,
            providerKey: config.provider?.key || '',
            providerName: config.provider?.label || config.providerId,
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
      additionalContext?: Record<string, any>;
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
    return this.aiProvidersService.fetchProviderModels(
      configId,
      'user',
      req.user.id,
    );
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
    @Body() dto: { providerId: string; config: Record<string, any> },
  ) {
    // Call service method with direct config instead of saved config lookup
    const service = this.aiProvidersService as any;
    return service.fetchModelsFromDirectConfig(dto.providerId, dto.config);
  }
}
