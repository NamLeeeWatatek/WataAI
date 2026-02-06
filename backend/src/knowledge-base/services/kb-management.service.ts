import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import {
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  AssignAgentDto,
} from '../dto/kb-management.dto';
import {
  FilterKnowledgeBaseDto,
  SortKnowledgeBaseDto,
} from '../dto/query-knowledge-base.dto';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { BotKnowledgeBaseEntity } from '../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { KBDocumentsService } from './kb-documents.service';
import {
  KnowledgeBaseDocumentEntity,
  KbDocumentEntity,
} from '../infrastructure/persistence/relational/entities/knowledge-base.entity';

@Injectable()
export class KBManagementService {
  private readonly logger = new Logger(KBManagementService.name);

  constructor(
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private readonly agentKbRepository: Repository<BotKnowledgeBaseEntity>,
    @InjectRepository(KnowledgeBaseDocumentEntity)
    private readonly documentRepository: Repository<KbDocumentEntity>,
    private readonly kbDocumentsService: KBDocumentsService,
  ) {}

  async create(_userId: string, createDto: CreateKnowledgeBaseDto) {
    const kb = this.kbRepository.create({
      ...createDto,
      workspaceId: createDto.workspaceId,
    });
    kb.createdBy = _userId;
    const savedKb = await this.kbRepository.save(kb);
    return this.kbRepository.findOne({
      where: { id: savedKb.id },
      relations: [
        'aiConfig',
        'aiConfig.provider',
        'embeddingConfig',
        'embeddingConfig.provider',
      ],
    });
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    _userId,
  }: {
    filterOptions?: FilterKnowledgeBaseDto | null;
    sortOptions?: SortKnowledgeBaseDto[] | null;
    paginationOptions: IPaginationOptions;
    _userId: string;
  }): Promise<{ data: any[]; total: number }> {
    const query = this.kbRepository.createQueryBuilder('kb');

    query
      .leftJoinAndSelect('kb.aiConfig', 'aiConfig')
      .leftJoinAndSelect('aiConfig.provider', 'aiProvider')
      .leftJoinAndSelect('kb.embeddingConfig', 'embeddingConfig')
      .leftJoinAndSelect('embeddingConfig.provider', 'embeddingProvider');

    // Default filters
    const workspaceId = filterOptions?.workspaceId;
    if (workspaceId) {
      query.where(
        '(kb.workspaceId = :workspaceId OR (kb.workspaceId IS NULL AND kb.createdBy = :_userId))',
        { workspaceId, _userId },
      );
    } else {
      query.where('kb.createdBy = :_userId', { _userId });
    }

    if (filterOptions?.search) {
      query.andWhere(
        '(kb.name ILIKE :search OR kb.description ILIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sort) => {
        if (sort.orderBy) {
          query.addOrderBy(`kb.${sort.orderBy}`, sort.order as 'ASC' | 'DESC');
        }
      });
    } else {
      query.orderBy('kb.updatedAt', 'DESC');
    }

    query
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit)
      .loadRelationCountAndMap(
        'kb.totalDocuments',
        'kb.documents',
        'documents',
        (qb) => qb.where('documents.deletedAt IS NULL'),
      );

    const [results, total] = await query.getManyAndCount();

    return { data: results, total };
  }

  async findAll(_userId: string, workspaceId?: string) {
    const { data } = await this.findManyWithPagination({
      filterOptions: { workspaceId },
      paginationOptions: { page: 1, limit: 100 }, // Large limit for original findAll
      _userId,
    });
    return data;
  }

  async findOne(id: string, _userId: string) {
    const kb = await this.kbRepository.findOne({
      where: { id },
      relations: [
        'folders',
        'documents',
        'aiConfig',
        'aiConfig.provider',
        'embeddingConfig',
        'embeddingConfig.provider',
      ],
    });

    if (!kb) {
      throw new NotFoundException('Knowledge Base not found');
    }

    return kb;
  }

  async update(id: string, _userId: string, updateDto: UpdateKnowledgeBaseDto) {
    const kb = await this.findOne(id, _userId);
    Object.assign(kb, updateDto);
    const savedKb = await this.kbRepository.save(kb);
    return this.kbRepository.findOne({
      where: { id: savedKb.id },
      relations: [
        'aiConfig',
        'aiConfig.provider',
        'embeddingConfig',
        'embeddingConfig.provider',
      ],
    });
  }

  async remove(id: string, _userId: string) {
    const kb = await this.findOne(id, _userId);

    // 1. Delete all documents in this knowledge base (handles chunks and vectors)
    const documents = await this.documentRepository.find({
      where: { knowledgeBaseId: id },
    });

    for (const doc of documents) {
      try {
        await this.kbDocumentsService.remove(doc.id, _userId);
      } catch (error) {
        this.logger.error(
          `Failed to delete document ${doc.id} during KB removal:`,
          error,
        );
      }
    }

    // 2. Remove the knowledge base itself (DB cascade will handle folders and agent assignments)
    await this.kbRepository.remove(kb);
    return { success: true };
  }

  async assignAgent(kbId: string, _userId: string, assignDto: AssignAgentDto) {
    await this.findOne(kbId, _userId);

    const existing = await this.agentKbRepository.findOne({
      where: {
        botId: assignDto.agentId,
        knowledgeBaseId: kbId,
      },
    });

    if (existing) {
      Object.assign(existing, {
        priority: assignDto.priority,
        ragSettings: assignDto.ragSettings,
      });
      return this.agentKbRepository.save(existing);
    }

    const mapping = this.agentKbRepository.create({
      knowledgeBaseId: kbId,
      botId: assignDto.agentId,
      priority: assignDto.priority ?? 1,
      ragSettings: assignDto.ragSettings,
      isActive: true,
    });

    return this.agentKbRepository.save(mapping);
  }

  async unassignAgent(kbId: string, _userId: string, agentId: string) {
    await this.findOne(kbId, _userId);

    const mapping = await this.agentKbRepository.findOne({
      where: {
        botId: agentId,
        knowledgeBaseId: kbId,
      },
    });

    if (!mapping) {
      throw new NotFoundException('Agent assignment not found');
    }

    await this.agentKbRepository.remove(mapping);
    return { success: true };
  }

  async getAgentAssignments(kbId: string, _userId: string) {
    await this.findOne(kbId, _userId);

    return this.agentKbRepository.find({
      where: { knowledgeBaseId: kbId },
      order: { priority: 'ASC' },
    });
  }

  async getStats(kbId: string, _userId: string) {
    const kb = await this.findOne(kbId, _userId);

    // Calculate actual document count
    const docCount = await this.kbRepository
      .createQueryBuilder('kb')
      .leftJoin('kb.documents', 'doc')
      .where('kb.id = :kbId', { kbId })
      .andWhere('doc.deletedAt IS NULL')
      .select('COUNT(doc.id)', 'count')
      .getRawOne();

    const actualDocCount = parseInt(docCount?.count || '0');

    // For now, calculate total size by summing parsed values
    let actualTotalSize = 0;
    if (kb.documents) {
      actualTotalSize = kb.documents
        .filter((doc) => doc.deletedAt === null && doc.fileSize)
        .reduce((sum, doc) => {
          const size = parseInt(doc.fileSize || '0');
          return sum + (isNaN(size) ? 0 : size);
        }, 0);
    }

    return {
      id: kb.id,
      name: kb.name,
      totalDocuments: actualDocCount,
      totalSize: actualTotalSize,
      chunkSize: kb.chunkSize,
      chunkOverlap: kb.chunkOverlap,
      embeddingModel: kb.embeddingModel,
      createdAt: kb.createdAt,
      updatedAt: kb.updatedAt,
    };
  }
}
