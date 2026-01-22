import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BotsService } from '../bots.service';
import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';
import {
  CreateBotChannelDto,
  UpdateBotChannelDto,
} from '../dto/bot-channel.dto';
import { CurrentWorkspace } from '../../workspaces/decorators/current-workspace.decorator';

@ApiTags('Bot Channels')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller('bots/:id/channels')
export class BotChannelsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get bot channels' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiQuery({ name: 'validated', required: false, type: Boolean })
  getBotChannels(
    @Param('id') id: string,
    @Query('validated') validated?: boolean,
    @CurrentWorkspace() workspaceId: string = 'default', // Workaround if decorator fails or mock
  ) {
    if (typeof workspaceId !== 'string')
      throw new Error('Workspace Context Missing');
    return this.botsService.getBotChannels(id, workspaceId, { validated });
  }

  @Post()
  @ApiOperation({ summary: 'Create bot channel' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @HttpCode(HttpStatus.CREATED)
  createBotChannel(
    @Param('id') id: string,
    @Body() dto: CreateBotChannelDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.createBotChannel(id, workspaceId, dto, req.user.id);
  }

  @Patch(':channelId')
  @ApiOperation({ summary: 'Update bot channel' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'channelId', type: String, description: 'Channel ID' })
  updateBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @Body() dto: UpdateBotChannelDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.updateBotChannel(
      id,
      workspaceId,
      channelId,
      dto,
      req.user.id,
    );
  }

  @Delete(':channelId')
  @ApiOperation({ summary: 'Delete bot channel' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'channelId', type: String, description: 'Channel ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.deleteBotChannel(id, workspaceId, channelId);
  }

  @Patch(':channelId/toggle')
  @ApiOperation({ summary: 'Toggle channel active status' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'channelId', type: String, description: 'Channel ID' })
  toggleBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @Body() body: { isActive: boolean },
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.toggleBotChannel(
      id,
      workspaceId,
      channelId,
      body.isActive,
      req.user.id,
    );
  }
}
