import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WidgetVersionService } from '../services/widget-version.service';
import {
  CreateWidgetVersionDto,
  UpdateWidgetVersionDto,
  RollbackWidgetVersionDto,
  WidgetVersionResponseDto,
  WidgetVersionListItemDto,
  WidgetDeploymentResponseDto,
} from '../dto/widget-version.dto';

import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';

@ApiTags('Widget Versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
@Controller({ path: 'bots/:botId/widget/versions', version: '1' })
export class WidgetVersionController {
  constructor(private readonly widgetVersionService: WidgetVersionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List widget versions',
    description: 'Get all widget versions for a bot',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Widget versions retrieved successfully',
    type: [WidgetVersionListItemDto],
  })
  async listVersions(
    @Param('botId') botId: string,
    @Request() req,
  ): Promise<WidgetVersionListItemDto[]> {
    return this.widgetVersionService.listVersions(botId, req.user.id);
  }

  @Get(':versionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get widget version detail',
    description: 'Get detailed information about a widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Widget version retrieved successfully',
    type: WidgetVersionResponseDto,
  })
  async getVersion(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ): Promise<WidgetVersionResponseDto> {
    return this.widgetVersionService.getVersion(botId, versionId, req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create widget version',
    description: 'Create a new widget version (draft)',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiResponse({
    status: 201,
    description: 'Widget version created successfully',
    type: WidgetVersionResponseDto,
  })
  async createVersion(
    @Param('botId') botId: string,
    @Body() dto: CreateWidgetVersionDto,
    @Request() req,
  ): Promise<WidgetVersionResponseDto> {
    return this.widgetVersionService.createVersion(botId, dto, req.user.id);
  }

  @Patch(':versionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update widget version',
    description: 'Update a draft widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Widget version updated successfully',
    type: WidgetVersionResponseDto,
  })
  async updateVersion(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateWidgetVersionDto,
    @Request() req,
  ): Promise<WidgetVersionResponseDto> {
    return this.widgetVersionService.updateVersion(
      botId,
      versionId,
      dto,
      req.user.id,
    );
  }

  @Post(':versionId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish widget version',
    description: 'Publish a widget version and make it active',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Widget version published successfully',
    type: WidgetVersionResponseDto,
  })
  async publishVersion(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ): Promise<WidgetVersionResponseDto> {
    return this.widgetVersionService.publishVersion(
      botId,
      versionId,
      req.user.id,
    );
  }

  @Post(':versionId/rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rollback to widget version',
    description: 'Rollback to a previous widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Rollback successful',
    type: WidgetVersionResponseDto,
  })
  async rollbackVersion(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Body() dto: RollbackWidgetVersionDto,
    @Request() req,
  ): Promise<WidgetVersionResponseDto> {
    return this.widgetVersionService.rollbackVersion(
      botId,
      versionId,
      dto,
      req.user.id,
    );
  }

  @Post(':versionId/archive')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Archive widget version',
    description: 'Archive a widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Widget version archived successfully',
  })
  async archiveVersion(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ): Promise<void> {
    await this.widgetVersionService.archiveVersion(
      botId,
      versionId,
      req.user.id,
    );
  }

  @Delete(':versionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete widget version',
    description: 'Delete a draft widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'Widget version deleted successfully',
  })
  async deleteVersion(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ): Promise<void> {
    await this.widgetVersionService.deleteVersion(
      botId,
      versionId,
      req.user.id,
    );
  }

  @Get(':versionId/embed-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get embed code for version',
    description: 'Get script tag and iframe code for a specific widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Embed code retrieved successfully',
  })
  async getEmbedCode(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ) {
    return this.widgetVersionService.getEmbedCode(
      botId,
      versionId,
      req.user.id,
    );
  }

  @Get(':versionId/preview-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get preview URL for version',
    description: 'Get test URL to preview a specific widget version',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiParam({ name: 'versionId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Preview URL retrieved successfully',
  })
  async getPreviewUrl(
    @Param('botId') botId: string,
    @Param('versionId') versionId: string,
    @Request() req,
  ) {
    return this.widgetVersionService.getPreviewUrl(
      botId,
      versionId,
      req.user.id,
    );
  }
}
