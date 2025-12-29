import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KnowledgeBaseEntity } from './infrastructure/persistence/relational/entities/knowledge-base.entity';
import { QueryKnowledgeBaseDto } from './dto/query-knowledge-base.dto';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

import { KBManagementService } from './services/kb-management.service';
import { KBVectorService } from './services/kb-vector.service';
import { KBRagService } from './services/kb-rag.service';
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  AssignAgentDto,
  BatchDeleteDto,
  BatchMoveDto,
} from './dto/kb-management.dto';
import { KBFoldersService } from './services/kb-folders.service';
import { KBDocumentsService } from './services/kb-documents.service';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseController {
  constructor(
    private readonly kbService: KBManagementService,
    private readonly vectorService: KBVectorService,
    private readonly kbRagService: KBRagService,
    private readonly foldersService: KBFoldersService,
    private readonly documentsService: KBDocumentsService,
  ) {}

  @Permissions('kb:List')
  @Get()
  @ApiOperation({ summary: 'Get all knowledge bases' })
  @ApiOkResponse({
    type: InfinityPaginationResponse(KnowledgeBaseEntity),
  })
  async getAll(
    @Request() req,
    @Query() query: QueryKnowledgeBaseDto,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<InfinityPaginationResponseDto<KnowledgeBaseEntity>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    // Extract filters
    const filters = query?.filters;

    const { data, total } = await this.kbService.findManyWithPagination({
      filterOptions: { ...filters, workspaceId },
      sortOptions: query?.sort || undefined,
      paginationOptions: { page, limit },
      userId: req.user.id,
    });

    return infinityPagination(data, { page, limit }, total);
  }

  @Permissions('kb:Create')
  @Post()
  @ApiOperation({ summary: 'Create knowledge base' })
  async create(
    @Request() req,
    @Body() createDto: CreateKnowledgeBaseDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    const userId = req.user.id;

    return this.kbService.create(userId, {
      ...createDto,
      workspaceId,
    });
  }

  @Permissions('kb:Get')
  @Get(':id')
  @ApiOperation({ summary: 'Get knowledge base by ID' })
  async getOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.findOne(id, userId);
  }

  @Permissions('kb:Update')
  @Patch(':id')
  @ApiOperation({ summary: 'Update knowledge base' })
  async update(
    @Param('id') id: string,
    @Request() req,
    @Body() updateDto: UpdateKnowledgeBaseDto,
  ) {
    const userId = req.user.id;
    return this.kbService.update(id, userId, updateDto);
  }

  @Permissions('kb:Delete')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete knowledge base' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.remove(id, userId);
  }

  @Permissions('kb:Delete')
  @Post('batch/delete')
  @ApiOperation({ summary: 'Batch delete folders and documents' })
  async batchDelete(@Request() req, @Body() body: BatchDeleteDto) {
    const userId = req.user.id;
    const { folderIds = [], documentIds = [] } = body;

    const results = {
      foldersDeleted: 0,
      documentsDeleted: 0,
      errors: [] as string[],
    };

    if (folderIds?.length) {
      await Promise.all(
        folderIds.map(async (id) => {
          try {
            await this.foldersService.remove(id, userId);
            results.foldersDeleted++;
          } catch (e) {
            results.errors.push(`Failed to delete folder ${id}: ${e.message}`);
          }
        }),
      );
    }

    if (documentIds?.length) {
      await Promise.all(
        documentIds.map(async (id) => {
          try {
            await this.documentsService.remove(id, userId);
            results.documentsDeleted++;
          } catch (e) {
            results.errors.push(
              `Failed to delete document ${id}: ${e.message}`,
            );
          }
        }),
      );
    }

    return results;
  }

  @Permissions('kb:Update')
  @Post('batch/move')
  @ApiOperation({ summary: 'Batch move folders and documents' })
  async batchMove(@Request() req, @Body() body: BatchMoveDto) {
    const userId = req.user.id;
    const { folderIds = [], documentIds = [], targetFolderId } = body;

    const results = {
      foldersMoved: 0,
      documentsMoved: 0,
      errors: [] as string[],
    };

    if (folderIds?.length) {
      await Promise.all(
        folderIds.map(async (id) => {
          try {
            // Folders service update needs UpdateFolderDto
            await this.foldersService.update(id, userId, {
              parentFolderId: targetFolderId,
            });
            results.foldersMoved++;
          } catch (e) {
            results.errors.push(`Failed to move folder ${id}: ${e.message}`);
          }
        }),
      );
    }

    if (documentIds?.length) {
      await Promise.all(
        documentIds.map(async (id) => {
          try {
            await this.documentsService.moveToFolder(
              id,
              userId,
              targetFolderId || null,
            );
            results.documentsMoved++;
          } catch (e) {
            results.errors.push(`Failed to move document ${id}: ${e.message}`);
          }
        }),
      );
    }

    return results;
  }

  @Permissions('kb:Get')
  @Get(':id/stats')
  @ApiOperation({ summary: 'Get knowledge base statistics' })
  async getStats(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.getStats(id, userId);
  }

  @Permissions('kb:Update')
  @Post(':id/agents')
  @ApiOperation({ summary: 'Assign agent to knowledge base' })
  async assignAgent(
    @Param('id') id: string,
    @Request() req,
    @Body() assignDto: AssignAgentDto,
  ) {
    const userId = req.user.id;
    return this.kbService.assignAgent(id, userId, assignDto);
  }

  @Permissions('kb:Update')
  @Delete(':id/agents/:agentId')
  @ApiOperation({ summary: 'Unassign agent from knowledge base' })
  async unassignAgent(
    @Param('id') id: string,
    @Param('agentId') agentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.kbService.unassignAgent(id, userId, agentId);
  }

  @Permissions('kb:Get')
  @Get(':id/agents')
  @ApiOperation({ summary: 'Get agent assignments' })
  async getAgentAssignments(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.kbService.getAgentAssignments(id, userId);
  }

  @Get('vector/diagnostics')
  @ApiOperation({ summary: 'Get vector service diagnostics' })
  async getVectorDiagnostics() {
    return {
      isAvailable: this.vectorService.isServiceAvailable(),
      url: process.env.QDRANT_URL,
      hasApiKey: !!process.env.QDRANT_API_KEY,
      collectionName: 'knowledge-base',
    };
  }

  @Post('vector/test-connection')
  @ApiOperation({ summary: 'Test vector service connection' })
  async testVectorConnection() {
    try {
      const connected = await this.vectorService.testConnection();
      return {
        success: connected,
        message: connected
          ? 'Successfully connected to Qdrant'
          : 'Failed to connect to Qdrant',
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  @Post('vector/ensure-collection')
  @ApiOperation({ summary: 'Ensure vector collection exists' })
  async ensureVectorCollection() {
    try {
      const success = await this.vectorService.ensureCollection();
      return {
        success,
        message: success
          ? 'Collection exists or was created successfully'
          : 'Failed to create or verify collection',
      };
    } catch (error) {
      return {
        success: false,
        message: `Collection creation failed: ${error.message}`,
      };
    }
  }

  @Permissions('kb:Chat')
  @Post('chat')
  @ApiOperation({ summary: 'Chat with knowledge base using RAG' })
  async chatWithKnowledgeBase(
    @Request() req,
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
    const userId = req.user.id;

    try {
      const result = await this.kbRagService.chatWithBotAndRAG(
        body.message,
        body.botId,
        body.knowledgeBaseIds,
        body.conversationHistory,
        body.model,
      );

      return {
        answer: result.answer,
        sources: result.sources,
      };
    } catch (error) {
      console.error('Chat with knowledge base failed:', error);
      throw error;
    }
  }
}
