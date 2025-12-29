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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AiConversationsService } from './ai-conversations.service';
import {
  CreateAiConversationDto,
  UpdateAiConversationDto,
} from './dto/ai-conversation.dto';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';

@ApiTags('AI Conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'ai-conversations', version: '1' })
export class AiConversationsController {
  constructor(private readonly conversationsService: AiConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all AI conversations' })
  async getConversations(@Request() req) {
    const userId = req.user.id;
    return this.conversationsService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new AI conversation' })
  async createConversation(
    @Request() req,
    @Body() createDto: CreateAiConversationDto,
  ) {
    const userId = req.user.id;
    return this.conversationsService.create(userId, createDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AI conversation by ID' })
  async getConversation(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.conversationsService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update AI conversation' })
  async updateConversation(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateAiConversationDto,
  ) {
    const userId = req.user.id;
    return this.conversationsService.update(id, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete AI conversation' })
  async deleteConversation(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.conversationsService.remove(id, userId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to conversation' })
  async addMessage(
    @Param('id') id: string,
    @Request() req,
    @Body()
    message: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
      metadata?: any;
    },
  ) {
    const userId = req.user.id;
    return this.conversationsService.addMessage(id, userId, message);
  }
}
