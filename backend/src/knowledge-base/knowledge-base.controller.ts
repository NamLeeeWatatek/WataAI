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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  KnowledgeBaseEntity,
  KbDocumentEntity,
} from './infrastructure/persistence/relational/entities/knowledge-base.entity';
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
import { ChatWithKnowledgeBaseDto } from './dto/chat-with-kb.dto';
import { KBFoldersService } from './services/kb-folders.service';
import { KBDocumentsService } from './services/kb-documents.service';
import { KBEmbeddingsService } from './services/kb-embeddings.service';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseController {
  private readonly logger = new Logger(KnowledgeBaseController.name);

  constructor(
    private readonly kbService: KBManagementService,
    private readonly vectorService: KBVectorService,
    private readonly kbRagService: KBRagService,
    private readonly foldersService: KBFoldersService,
    private readonly documentsService: KBDocumentsService,
    private readonly embeddingsService: KBEmbeddingsService,
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
      _userId: req.user.id,
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

  @Permissions('kb:Get')
  @Get(':id/content')
  @ApiOperation({
    summary: 'Get folders and documents in a specific level',
  })
  async getContent(
    @Param('id') kbId: string,
    @Query('folderId') folderId: string,
    @Query('page') page: number = 1,
    @Query('limit') rawLimit: number = 10,
    @Query('search') search: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    const limit = rawLimit > 100 ? 100 : rawLimit; // Enforce max limit
    const effectiveFolderId =
      folderId === 'null' || !folderId ? null : folderId;

    // 1. Get ALL folders matching search
    const allFolders = await this.foldersService.findAllByParent(
      kbId,
      effectiveFolderId,
      userId,
      search,
    );

    // 2. Calculate Folder Slice
    const foldersStartIndex = (page - 1) * limit;
    const foldersEndIndex = foldersStartIndex + limit;
    const pagedFolders = allFolders.slice(foldersStartIndex, foldersEndIndex);

    // 3. Calculate Document Params
    // Number of slots used by folders on this page
    const slotsUsedByFolders = pagedFolders.length;
    // Remaining slots for documents
    const docLimit = limit - slotsUsedByFolders;

    // Document offset: How many documents should we skip?
    // If we are deep in pages (past the folder count), we skip (GlobalStartIndex - TotalFolders)
    // If we are still in folder pages (GlobalStartIndex < TotalFolders), we skip 0 (documents start after folders)
    const totalFoldersCount = allFolders.length;
    const docOffset = Math.max(0, foldersStartIndex - totalFoldersCount);

    let documents: KbDocumentEntity[] = [];
    let totalDocs = 0;

    // Only fetch documents if we have space left or if we are past the folder region
    if (docLimit > 0 || docOffset > 0) {
      const { data, total } =
        await this.documentsService.findManyWithPagination({
          kbId,
          filterOptions: { folderId: effectiveFolderId, search },
          paginationOptions: {
            page: 1,
            limit: docLimit > 0 ? docLimit : 0,
            offset: docOffset,
          }, // page:1 is dummy, relying on offset/limit
          userId,
        });
      documents = data;
      totalDocs = total;
    } else {
      // We are purely in folder territory and filled the page with folders
      // But we still need total Docs count for pagination to work
      const { total } = await this.documentsService.findManyWithPagination({
        kbId,
        filterOptions: { folderId: effectiveFolderId, search },
        paginationOptions: { page: 1, limit: 1 }, // minimized fetch
        userId,
      });
      totalDocs = total;
    }

    const breadcrumbs = effectiveFolderId
      ? await this.foldersService.getBreadcrumbs(effectiveFolderId, userId)
      : [];

    return {
      folders: pagedFolders,
      documents: { data: documents, total: totalFoldersCount + totalDocs }, // Unified total for frontend
      breadcrumbs,
    };
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
    const probeText = 'diagnostics_probe';
    const embedding =
      await this.embeddingsService.generateQueryEmbedding(probeText);
    const dim = embedding.length;

    return {
      isAvailable: this.vectorService.isServiceAvailable(),
      url: process.env.QDRANT_URL,
      hasApiKey: !!process.env.QDRANT_API_KEY,
      detectedDimension: dim,
      targetCollection: this.vectorService.getCollectionName(dim),
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
  async ensureVectorCollection(@Body('dimension') dimension: number = 768) {
    try {
      await this.vectorService.ensureCollection(dimension);
      return {
        success: true,
        message: `Collection '${dimension}' verified or created`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Collection verification failed: ${error.message}`,
      };
    }
  }

  @Post('vector/recreate')
  @ApiOperation({
    summary: 'Recreate vector collection with auto-detected dimension',
  })
  async recreateVectorCollection() {
    try {
      // 1. Auto-detect dimension using a test probe
      const probeText = 'dimension_probe_test';

      // We use generateQueryEmbedding which now uses the system default model
      const embedding =
        await this.embeddingsService.generateQueryEmbedding(probeText);
      const dimension = embedding.length;

      // 2. Recreate collection
      await this.vectorService.recreateCollection(dimension);

      return {
        success: true,
        message: `Collection recreated with auto-detected dimension: ${dimension}`,
        dimension,
      };
    } catch (error) {
      this.logger.error('Failed to recreate collection:' + error.message);
      return {
        success: false,
        message: `Failed to recreate collection: ${error.message}`,
      };
    }
  }

  @Permissions('kb:Chat')
  @Post('chat')
  @ApiOperation({ summary: 'Chat with knowledge base using RAG' })
  async chatWithKnowledgeBase(
    @Request() req,
    @Body() body: ChatWithKnowledgeBaseDto,
  ) {
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
      this.logger.error('Chat with knowledge base failed:' + error.message);
      throw error;
    }
  }
  @Post('vector/clear-all')
  @ApiOperation({
    summary: 'Clear ALL vector collections (USE WITH CAUTION)',
  })
  async clearAllVectors() {
    try {
      const deleted = await this.vectorService.clearAllCollections();
      return {
        success: true,
        message: `Successfully deleted ${deleted.length} collections`,
        deleted,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to clear collections: ${error.message}`,
      };
    }
  }
}
