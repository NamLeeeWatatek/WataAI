import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  SerializeOptions,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BotsService } from './bots.service';
import { BotInteractionService } from './bot-interaction.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { UpdateBotDto } from './dto/update-bot.dto';
import { QueryBotDto } from './dto/query-bot.dto';
import { Bot } from './domain/bot';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';

import { Permissions } from '../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';

@ApiTags('Bots')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({ path: 'bots', version: '1' })
export class BotsController {
  constructor(
    private readonly botsService: BotsService,
    private readonly botInteractionService: BotInteractionService,
  ) {}

  @Post()
  @Permissions('bot:Create')
  @ApiOperation({ summary: 'Create bot' })
  @ApiCreatedResponse({ type: Bot })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateBotDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.create({ ...createDto, workspaceId }, req.user.id);
  }

  @Get()
  @Permissions('bot:List')
  @ApiOperation({ summary: 'Get all bots with pagination' })
  @ApiOkResponse({ type: InfinityPaginationResponse(Bot) })
  @SerializeOptions({ groups: ['admin'] })
  async findAll(
    @Query() query: QueryBotDto,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<InfinityPaginationResponseDto<Bot>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Extract filters
    const filters = query?.filters;

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    // Ensure it's in filters for the service
    const filterOptions = {
      ...filters,
      workspaceId,
    };

    const { data, total } = await this.botsService.findManyWithPagination({
      filterOptions,
      sortOptions: query?.sort || undefined,
      paginationOptions: { page, limit },
    });

    return infinityPagination(data, { page, limit }, total);
  }

  @Get(':id')
  @Permissions('bot:Get')
  @ApiOperation({ summary: 'Get bot by ID' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.botsService.findOne(id, workspaceId);
  }

  @Patch(':id')
  @Permissions('bot:Update')
  @ApiOperation({ summary: 'Update bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBotDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.update(id, workspaceId, updateDto);
  }

  @Delete(':id')
  @Permissions('bot:Delete')
  @ApiOperation({ summary: 'Delete bot (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.botsService.remove(id, workspaceId);
  }

  @Post(':id/activate')
  @Permissions('bot:Update')
  @ApiOperation({ summary: 'Activate bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  activate(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.botsService.activate(id, workspaceId);
  }

  @Post(':id/pause')
  @Permissions('bot:Update')
  @ApiOperation({ summary: 'Pause bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  pause(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.botsService.pause(id, workspaceId);
  }

  @Post(':id/archive')
  @Permissions('bot:Update')
  @ApiOperation({ summary: 'Archive bot' })
  @ApiOkResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  archive(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.botsService.archive(id, workspaceId);
  }

  @Post(':id/duplicate')
  @Permissions('bot:Create')
  @ApiOperation({ summary: 'Duplicate bot' })
  @ApiCreatedResponse({ type: Bot })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.CREATED)
  duplicate(
    @Param('id') id: string,
    @Body() body: { name?: string },
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.duplicate(id, workspaceId, req.user.id, body.name);
  }

  @Get(':id/stats')
  @Permissions('bot:Get')
  @ApiOperation({ summary: 'Get bot statistics' })
  @ApiParam({ name: 'botId', type: String })
  getBotStats(@Param('botId') id: string) {
    return this.botInteractionService.getBotStats(id);
  }

  @Get(':id/interaction-context')
  @Permissions('conversation:Get')
  @ApiOperation({ summary: 'Get bot interaction context' })
  @ApiParam({ name: 'id', type: String })
  getBotInteractionContext(@Param('id') id: string) {
    return this.botInteractionService.getBotForInteraction(id);
  }

  @Post(':id/takeover')
  @Permissions('conversation:Update')
  @ApiOperation({ summary: 'Agent takes over conversation from bot' })
  @ApiParam({ name: 'id', type: String })
  validateBot(@Param('id') id: string) {
    return this.botInteractionService.validateBotInteraction(id);
  }
}
