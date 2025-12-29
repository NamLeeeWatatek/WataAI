import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KBRagService } from './services/kb-rag.service';
import {
  QueryKnowledgeBaseDto,
  GenerateAnswerDto,
} from './dto/kb-document.dto';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';

@ApiTags('Knowledge Base - Query & RAG')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseQueryController {
  constructor(private readonly ragService: KBRagService) {}

  @Post('query')
  @ApiOperation({ summary: 'Query knowledge base (vector search)' })
  async query(@Body() queryDto: QueryKnowledgeBaseDto) {
    if (!queryDto.knowledgeBaseId) {
      throw new Error('knowledgeBaseId is required');
    }
    const results = await this.ragService.query(
      queryDto.query,
      queryDto.knowledgeBaseId,
      String(queryDto.limit || 5),
      queryDto.similarityThreshold || 0.5,
    );

    return {
      success: true,
      query: queryDto.query,
      resultsCount: results.length,
      results,
    };
  }

  @Post('answer')
  @ApiOperation({
    summary: 'Generate answer using RAG (with sources and relevance)',
  })
  async generateAnswer(@Body() answerDto: GenerateAnswerDto) {
    const result = await this.ragService.generateAnswer(
      answerDto.question,
      answerDto.knowledgeBaseId,
      answerDto.model,
      {
        limit: answerDto.limit || 5,
        similarityThreshold: answerDto.similarityThreshold || 0.5,
      },
    );

    return {
      success: true,
      question: answerDto.question,
      ...result,
    };
  }

  @Post('chat')
  @ApiOperation({ summary: 'Chat with bot (with optional RAG)' })
  async chat(
    @Body()
    body: {
      message: string;
      botId?: string;
      knowledgeBaseIds?: string[];
      conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
      }>;
      model?: string;
    },
  ) {
    const result = await this.ragService.chatWithBotAndRAG(
      body.message,
      body.botId,
      body.knowledgeBaseIds,
      body.conversationHistory,
      body.model,
    );

    return {
      success: true,
      answer: result.answer,
      sources: result.sources,
    };
  }

  @Post('chat-with-bot-rag')
  @ApiOperation({
    summary: 'Chat with Bot using RAG (professional - bot-first architecture)',
    description:
      "Uses bot's configured AI provider first, then fallbacks to KB/workspace/user providers",
  })
  async chatWithBotAndRAG(
    @Body()
    body: {
      message: string;
      botId: string; // Required - bot-first approach
      knowledgeBaseIds?: string[]; // Optional KB sources
      conversationHistory?: Array<{
        role: 'user' | 'assistant';
        content: string;
      }>;
      model?: string; // Override model (optional)
    },
  ) {
    const result = await this.ragService.chatWithBotAndRAG(
      body.message,
      body.botId,
      body.knowledgeBaseIds,
      body.conversationHistory,
      body.model,
    );

    return {
      success: true,
      answer: result.answer,
      sources: result.sources,
    };
  }
}
