import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class KBManagementService {
  constructor(
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private readonly agentKbRepository: Repository<BotKnowledgeBaseEntity>,
  ) {}

  async create(userId: string, createDto: CreateKnowledgeBaseDto) {
    const kb = this.kbRepository.create({
      ...createDto,
      workspaceId: createDto.workspaceId,
    });
    kb.createdBy = userId;
    return this.kbRepository.save(kb);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
    userId,
  }: {
    filterOptions?: FilterKnowledgeBaseDto | null;
    sortOptions?: SortKnowledgeBaseDto[] | null;
    paginationOptions: IPaginationOptions;
    userId: string;
  }): Promise<{ data: any[]; total: number }> {
    const query = this.kbRepository.createQueryBuilder('kb');

    // Default filters
    const workspaceId = filterOptions?.workspaceId;
    if (workspaceId) {
      query.where(
        '(kb.workspaceId = :workspaceId OR (kb.workspaceId IS NULL AND kb.createdBy = :userId))',
        { workspaceId, userId },
      );
    } else {
      query.where('kb.createdBy = :userId', { userId });
    }

    if (filterOptions?.search) {
      query.andWhere(
        '(kb.name ILIKE :search OR kb.description ILIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sort) => {
        if (sort.orderBy && (sort.orderBy as any) !== 'undefined') {
          query.addOrderBy(`kb.${sort.orderBy}`, sort.order as any);
        }
      });
    } else {
      query.orderBy('kb.updatedAt', 'DESC');
    }

    query
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    const [results, total] = await query.getManyAndCount();

    // Calculate actual document counts for each KB (maintaining original logic)
    const resultsWithCounts = await Promise.all(
      results.map(async (kb) => {
        const docCount = await this.kbRepository
          .createQueryBuilder('kb')
          .leftJoin('kb.documents', 'doc')
          .where('kb.id = :kbId', { kbId: kb.id })
          .andWhere('doc.deletedAt IS NULL')
          .select('COUNT(doc.id)', 'count')
          .getRawOne();

        return {
          ...kb,
          totalDocuments: parseInt(docCount?.count || '0'),
        };
      }),
    );

    return { data: resultsWithCounts, total };
  }

  async findAll(userId: string, workspaceId?: string) {
    const { data } = await this.findManyWithPagination({
      filterOptions: { workspaceId },
      paginationOptions: { page: 1, limit: 100 }, // Large limit for original findAll
      userId,
    });
    return data;
  }

  async findOne(id: string, userId: string) {
    const kb = await this.kbRepository.findOne({
      where: { id },
      relations: ['folders', 'documents'],
    });

    if (!kb) {
      throw new NotFoundException('Knowledge Base not found');
    }

    return kb;
  }

  async update(id: string, userId: string, updateDto: UpdateKnowledgeBaseDto) {
    const kb = await this.findOne(id, userId);
    Object.assign(kb, updateDto);
    return this.kbRepository.save(kb);
  }

  async remove(id: string, userId: string) {
    const kb = await this.findOne(id, userId);
    await this.kbRepository.remove(kb);
    return { success: true };
  }

  async assignAgent(kbId: string, userId: string, assignDto: AssignAgentDto) {
    await this.findOne(kbId, userId);

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

  async unassignAgent(kbId: string, userId: string, agentId: string) {
    await this.findOne(kbId, userId);

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

  async getAgentAssignments(kbId: string, userId: string) {
    await this.findOne(kbId, userId);

    return this.agentKbRepository.find({
      where: { knowledgeBaseId: kbId },
      order: { priority: 'ASC' },
    });
  }

  async getStats(kbId: string, userId: string) {
    const kb = await this.findOne(kbId, userId);

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
