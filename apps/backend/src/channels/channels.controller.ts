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
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { CreateConnectionDto } from '../integrations/dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { FacebookOAuthService } from './facebook-oauth.service';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'channels', version: '1' })
export class ChannelsController {
  private readonly logger = new Logger(ChannelsController.name);

  constructor(
    private readonly channelsService: ChannelsService,
    private readonly facebookOAuthService: FacebookOAuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all channel connections' })
  async findAll(@Request() req, @CurrentWorkspace() workspaceId: string) {
    const connections = await this.channelsService.findAll(workspaceId);

    // Enrich connections with dynamic data (e.g. pages for Facebook)
    const enrichedConnections = await Promise.all(
      connections.map(async (conn) => {
        // Clone metadata to avoid mutating the original entity if it's cached/tracked
        const metadata = { ...conn.metadata };

        if (conn.type === 'facebook' && metadata.userAccessToken) {
          try {
            const pages = await this.facebookOAuthService.getUserPages(
              metadata.userAccessToken,
            );
            metadata.pages = pages.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              tasks: p.tasks,
            }));
          } catch (error) {
            this.logger.warn(
              `Failed to fetch pages for connection ${conn.id}: ${error.message}`,
            );
            // Keep existing metadata, maybe add an error flag if needed
            metadata.pagesError = 'Failed to fetch pages';
          }
        }

        return {
          id: conn.id,
          name: conn.name,
          type: conn.type,
          status: conn.status,
          connected_at: conn.connectedAt,
          metadata: metadata,
        };
      }),
    );

    return enrichedConnections;
  }

  @Post()
  @ApiOperation({ summary: 'Create channel connection' })
  async create(
    @Body() dto: CreateConnectionDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const connection = await this.channelsService.create(dto, workspaceId);

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      connected_at: connection.connectedAt,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update channel connection' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateConnectionDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const connection = await this.channelsService.update(id, dto, workspaceId);

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      // botId: connection.botId,
      connected_at: connection.connectedAt,
      metadata: connection.metadata,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete channel connection' })
  async delete(
    @Param('id') id: string,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    await this.channelsService.delete(id, workspaceId);
    return { success: true };
  }
}
