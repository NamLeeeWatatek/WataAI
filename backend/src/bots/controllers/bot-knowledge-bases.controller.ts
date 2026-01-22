import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { BotsService } from '../bots.service';
import { LinkKnowledgeBaseDto } from '../dto/update-bot.dto';
import { BotKnowledgeBase } from '../domain/bot';

import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';
import { CurrentWorkspace } from '../../workspaces/decorators/current-workspace.decorator';

@ApiTags('Bot Knowledge Bases')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller('bots/:id/knowledge-bases')
export class BotKnowledgeBasesController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  @ApiOperation({ summary: 'Link knowledge base to bot' })
  @ApiCreatedResponse({ type: BotKnowledgeBase })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @HttpCode(HttpStatus.CREATED)
  linkKnowledgeBase(
    @Param('id') id: string,
    @Body() dto: LinkKnowledgeBaseDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.linkKnowledgeBase(id, workspaceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get linked knowledge bases' })
  @ApiOkResponse({ type: [BotKnowledgeBase] })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  getKnowledgeBases(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.getLinkedKnowledgeBases(id, workspaceId);
  }

  @Delete(':kbId')
  @ApiOperation({ summary: 'Unlink knowledge base from bot' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'kbId', type: String, description: 'Knowledge Base ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkKnowledgeBase(
    @Param('id') id: string,
    @Param('kbId') kbId: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.unlinkKnowledgeBase(id, workspaceId, kbId);
  }

  @Patch(':kbId/toggle')
  @ApiOperation({ summary: 'Toggle knowledge base active status' })
  @ApiOkResponse({ type: BotKnowledgeBase })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'kbId', type: String, description: 'Knowledge Base ID' })
  toggleKnowledgeBase(
    @Param('id') id: string,
    @Param('kbId') kbId: string,
    @Body() body: { isActive: boolean },
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.botsService.toggleKnowledgeBase(
      id,
      workspaceId,
      kbId,
      body.isActive,
    );
  }
}
