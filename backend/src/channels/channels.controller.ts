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
  NotFoundException, // Add NotFoundException if not already used
  Query, // Add Query decorator
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ChannelsService } from './channels.service';
import { CreateConnectionDto } from '../integrations/dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ChannelResponseDto } from './dto/channel-response.dto';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';

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
  @ApiResponse({ type: [ChannelResponseDto] })
  // TODO: Update ApiResponse to show PaginatedResponse
  async findAll(
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
    @Query() query: PaginationQueryDto,
  ) {
    this.logger.log(
      `findAll: workspaceId=${workspaceId}, query=${JSON.stringify(query)}`,
    );
    const { data: connections, total } = await this.channelsService.findAll(
      workspaceId,
      query,
    );
    this.logger.log(`findAll: Found ${total} connections`);

    // Enrich connections with dynamic data (e.g. pages for Facebook)
    const enrichedConnections = await Promise.all(
      connections.map(async (conn) => {
        // Clone metadata to avoid mutating the original entity
        const metadata: any = { ...conn.metadata };

        // 1. Fetch live pages if applicable (Facebook)
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

        // 2. Remove sensitive fields explicitly
        delete metadata.userAccessToken;

        // 3. Construct strictly typed response
        return {
          id: conn.id,
          name: conn.name,
          type: conn.type,
          status: conn.status,
          connected_at: conn.connectedAt,
          metadata: {
            botId: metadata.botId,
            pageId: metadata.pageId,
            pageName: metadata.pageName,
            accountId: metadata.accountId,
            accountName: metadata.accountName,
            connectedBy: metadata.connectedBy,
            category: metadata.category,
            tasks: metadata.tasks,
            pages: metadata.pages,
          },
        };
      }),
    );

    return {
      data: enrichedConnections as ChannelResponseDto[],
      meta: {
        page: Number(query.page || 1),
        limit: Number(query.limit || 20),
        total,
        totalPages: Math.ceil(total / Number(query.limit || 20)),
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create channel connection' })
  @ApiResponse({ type: ChannelResponseDto })
  async create(
    @Body() dto: CreateConnectionDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<ChannelResponseDto> {
    const connection = await this.channelsService.create(dto, workspaceId);

    // Create connection usually doesn't have sensitive metadata yet, but let's be safe
    const metadata = { ...connection.metadata };
    delete metadata.userAccessToken;

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      connected_at: connection.connectedAt,
      metadata: {
        botId: metadata.botId,
        pageId: metadata.pageId,
        pageName: metadata.pageName,
        accountId: metadata.accountId,
        accountName: metadata.accountName,
        connectedBy: metadata.connectedBy,
        category: metadata.category,
        tasks: metadata.tasks,
        pages: metadata.pages,
      },
    } as ChannelResponseDto;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update channel connection' })
  @ApiResponse({ type: ChannelResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateConnectionDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<ChannelResponseDto> {
    const connection = await this.channelsService.update(id, dto, workspaceId);

    const metadata = { ...connection.metadata };
    // No need to delete explicitly if we construct the object strictly below

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type,
      status: connection.status,
      connected_at: connection.connectedAt,
      metadata: {
        botId: metadata.botId,
        pageId: metadata.pageId,
        pageName: metadata.pageName,
        accountId: metadata.accountId,
        accountName: metadata.accountName,
        connectedBy: metadata.connectedBy,
        category: metadata.category,
        tasks: metadata.tasks,
        pages: metadata.pages,
      },
    } as ChannelResponseDto;
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

  @Get(':id/access-token')
  @ApiOperation({
    summary: 'Get channel access token for external integrations',
  })
  async getAccessToken(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const connection = await this.channelsService.findOne(id, workspaceId);
    if (!connection) {
      throw new NotFoundException('Channel connection not found');
    }

    return {
      success: true,
      id: connection.id,
      name: connection.name,
      type: connection.type,
      accessToken: connection.accessToken,
      metadata: connection.metadata,
    };
  }
}
