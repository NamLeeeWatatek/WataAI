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
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BotsService } from '../bots.service';

import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';

@ApiTags('Bot Channels')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'bots/:id/channels', version: '1' })
export class BotChannelsController {
  constructor(private readonly botsService: BotsService) {}

  @Get()
  @ApiOperation({ summary: 'Get bot channels' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiQuery({ name: 'validated', required: false, type: Boolean })
  getBotChannels(
    @Param('id') id: string,
    @Query('validated') validated?: boolean,
  ) {
    return this.botsService.getBotChannels(id, { validated });
  }

  @Post()
  @ApiOperation({ summary: 'Create bot channel' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @HttpCode(HttpStatus.CREATED)
  createBotChannel(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.botsService.createBotChannel(id, dto, req.user.id);
  }

  @Patch(':channelId')
  @ApiOperation({ summary: 'Update bot channel' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'channelId', type: String, description: 'Channel ID' })
  updateBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
    @Body() dto: any,
    @Request() req,
  ) {
    return this.botsService.updateBotChannel(id, channelId, dto, req.user.id);
  }

  @Delete(':channelId')
  @ApiOperation({ summary: 'Delete bot channel' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'channelId', type: String, description: 'Channel ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBotChannel(
    @Param('id') id: string,
    @Param('channelId') channelId: string,
  ) {
    return this.botsService.deleteBotChannel(id, channelId);
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
  ) {
    return this.botsService.toggleBotChannel(
      id,
      channelId,
      body.isActive,
      req.user.id,
    );
  }
}
