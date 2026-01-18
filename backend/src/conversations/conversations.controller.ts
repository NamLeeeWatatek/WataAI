import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  CreateMessageDto,
  UpdateConversationStatusDto,
  MessageFeedbackDto,
  CreateMessageFeedbackDto,
} from './dto/create-conversation.dto';
import { Conversation, Message, MessageFeedback } from './domain/conversation';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({ path: 'conversations', version: '1' })
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Permissions('conversation:Create')
  @Post()
  @ApiOperation({ summary: 'Create conversation' })
  @ApiCreatedResponse({ type: Conversation })
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateConversationDto) {
    return this.conversationsService.create(createDto);
  }

  @Permissions('conversation:List')
  @Get()
  @ApiOperation({ summary: 'Get all conversations with pagination' })
  @ApiHeader({
    name: 'X-Workspace-Id',
    description:
      "Workspace ID to filter conversations (optional, defaults to user's default workspace)",
    required: false,
  })
  @ApiQuery({ name: 'botId', required: false })
  @ApiQuery({ name: 'channelType', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'closed', 'handover', 'archived'],
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['all', 'channel', 'widget'],
    description:
      'Filter by conversation source: all, channel (Facebook, WhatsApp, etc.), or widget (AI chat)',
  })
  findAll(
    @CurrentWorkspace() workspaceId: string | undefined,
    @Query('botId') botId?: string,
    @Query('channelType') channelType?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('source') source?: 'all' | 'channel' | 'widget',
    @Query('search') search?: string,
  ) {
    let onlyChannelConversations: boolean | undefined;
    if (source === 'channel') {
      onlyChannelConversations = true;
    } else if (source === 'widget') {
      onlyChannelConversations = false;
    }

    return this.conversationsService.findAll({
      botId,
      channelType,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      workspaceId,
      onlyChannelConversations,
      search,
    });
  }

  @Permissions('conversation:Get')
  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiOkResponse({ type: Conversation })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Permissions('conversation:Update')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update conversation status' })
  @ApiOkResponse({ type: Conversation })
  @ApiParam({ name: 'id', type: String })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateConversationStatusDto,
  ) {
    return this.conversationsService.updateStatus(id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close conversation' })
  @ApiOkResponse({ type: Conversation })
  @ApiParam({ name: 'id', type: String })
  close(@Param('id') id: string) {
    return this.conversationsService.close(id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive conversation' })
  @ApiOkResponse({ type: Conversation })
  @ApiParam({ name: 'id', type: String })
  archive(@Param('id') id: string) {
    return this.conversationsService.archive(id);
  }

  @Permissions('conversation:Update')
  @Post(':id/takeover')
  @ApiOperation({ summary: 'Agent takes over conversation from bot' })
  @ApiOkResponse({ type: Conversation })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.OK)
  async takeover(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id || 'unknown';
    return this.conversationsService.takeover(id, userId);
  }

  @Post(':id/handback')
  @ApiOperation({ summary: 'Agent hands conversation back to bot' })
  @ApiOkResponse({ type: Conversation })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.OK)
  async handback(@Param('id') id: string) {
    return this.conversationsService.handback(id);
  }

  @Permissions('conversation:Delete')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete conversation (soft delete)' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.conversationsService.delete(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to conversation' })
  @ApiCreatedResponse({ type: Message })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.CREATED)
  addMessage(@Param('id') id: string, @Body() createDto: CreateMessageDto) {
    return this.conversationsService.addMessage(id, createDto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiOkResponse({ type: [Message] })
  @ApiParam({ name: 'id', type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
    description: 'Message ID to get messages before',
  })
  getMessages(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
    @Query('after') after?: string,
  ) {
    return this.conversationsService.getMessages(id, {
      limit: limit ? Number(limit) : undefined,
      before,
      after,
    });
  }

  @Get(':id/messages/:messageId')
  @ApiOperation({ summary: 'Get message by ID' })
  @ApiOkResponse({ type: Message })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'messageId', type: String })
  getMessage(@Param('id') id: string, @Param('messageId') messageId: string) {
    return this.conversationsService.getMessage(id, messageId);
  }

  @Patch(':id/messages/:messageId/feedback')
  @ApiOperation({ summary: 'Update message feedback (quick)' })
  @ApiOkResponse({ type: Message })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'messageId', type: String })
  updateMessageFeedback(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() dto: MessageFeedbackDto,
  ) {
    return this.conversationsService.updateMessageFeedback(id, messageId, dto);
  }

  @Post(':id/messages/:messageId/feedback')
  @ApiOperation({ summary: 'Create detailed message feedback' })
  @ApiCreatedResponse({ type: MessageFeedback })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'messageId', type: String })
  @HttpCode(HttpStatus.CREATED)
  createMessageFeedback(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Body() dto: CreateMessageFeedbackDto,
  ) {
    return this.conversationsService.createMessageFeedback(messageId, dto);
  }

  @Get(':id/messages/:messageId/feedback')
  @ApiOperation({ summary: 'Get message feedback' })
  @ApiOkResponse({ type: MessageFeedback })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'messageId', type: String })
  getMessageFeedback(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
  ) {
    return this.conversationsService.getMessageFeedback(messageId);
  }

  @Permissions('conversation:Get')
  @Get('stats/:botId')
  @ApiOperation({ summary: 'Get conversation statistics' })
  @ApiParam({ name: 'botId', type: String })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month'], required: false })
  getStats(
    @Param('botId') botId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.conversationsService.getConversationStats(botId, period);
  }
}
