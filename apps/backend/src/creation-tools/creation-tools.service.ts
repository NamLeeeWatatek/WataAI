import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CreateCreationToolDto } from './dto/create-creation-tool.dto';
import { UpdateCreationToolDto } from './dto/update-creation-tool.dto';
import { FilesService } from '../files/files.service';
import { NullableType } from '../utils/types/nullable.type';
import {
  FilterCreationToolDto,
  SortCreationToolDto,
} from './dto/query-creation-tool.dto';
import { CreationToolRepository } from './infrastructure/persistence/creation-tool.repository';
import { CreationTool } from './domain/creation-tool';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class CreationToolsService {
  private readonly logger = new Logger(CreationToolsService.name);

  constructor(
    private readonly repository: CreationToolRepository,
    private readonly filesService: FilesService,
    private readonly i18n: I18nService,
  ) { }

  async exportTools(ids?: string[]): Promise<CreationTool[]> {
    if (ids && ids.length > 0) {
      const tools = await Promise.all(
        ids.map((id) => this.repository.findById(id)),
      );
      return tools.filter((t): t is CreationTool => !!t);
    }
    return this.repository.findAll();
  }

  async importTools(
    tools: CreationTool[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const tool of tools) {
      try {
        // Strip metadata to avoid collisions and ensure clean import
        const {
          id: _id,
          createdAt: _createdAt,
          updatedAt: _updatedAt,
          deletedAt: _deletedAt,
          categories: _categories,
          ...toolData
        } = tool;

        const existing = await this.repository.findBySlug(toolData.slug);

        if (existing) {
          await this.update(existing.id, {
            ...toolData,
            categoryIds: undefined,
          } as any);
        } else {
          await this.create({
            ...toolData,
            categoryIds: undefined,
          } as any);
        }
        success++;
      } catch (error) {
        this.logger.error(
          `Failed to import tool ${tool.slug}: ${error.message}`,
        );
        failed++;
      }
    }

    return { success, failed };
  }

  async create(createDto: CreateCreationToolDto): Promise<CreationTool> {
    const existing = await this.repository.findBySlug(createDto.slug);

    if (existing) {
      throw new ConflictException(
        this.i18n.t('common.alreadyExists', {
          args: { resource: 'Creation tool slug', value: createDto.slug },
        }),
      );
    }

    const tool = await this.repository.create({
      name: createDto.name,
      slug: createDto.slug,
      description: createDto.description,
      icon: createDto.icon,
      coverImage: createDto.coverImage,
      categories: createDto.categoryIds
        ? createDto.categoryIds.map((id) => ({ id }))
        : undefined,
      formConfig: createDto.formConfig,
      executionFlow: createDto.executionFlow as any,
      isActive: createDto.isActive ?? true,
      workspaceId: createDto.workspaceId,
      knowledgeBaseId: createDto.knowledgeBaseId,
      sortOrder: createDto.sortOrder ?? 0,
    });

    await this.filesService.confirmFromUrl(tool.icon);
    await this.filesService.confirmFromUrl(tool.coverImage);

    return tool;
  }

  async findAll(filters?: {
    isActive?: boolean;
    workspaceId?: string;
  }): Promise<CreationTool[]> {
    return this.repository.findAll(filters);
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterCreationToolDto | null;
    sortOptions?: SortCreationToolDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[CreationTool[], number]> {
    return this.repository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  async findById(id: CreationTool['id']): Promise<NullableType<CreationTool>> {
    return this.repository.findById(id);
  }

  async findBySlug(slug: string): Promise<NullableType<CreationTool>> {
    return this.repository.findBySlug(slug);
  }

  async findByWorkspace(workspaceId: string): Promise<CreationTool[]> {
    return this.repository.findByWorkspace(workspaceId);
  }

  async update(
    id: CreationTool['id'],
    updateDto: UpdateCreationToolDto,
  ): Promise<CreationTool> {
    const { categoryIds, ...updatePayload } = updateDto;

    const persistencePayload: any = { ...updatePayload };
    if (categoryIds) {
      persistencePayload.categories = categoryIds.map((id) => ({ id }));
    }

    if (persistencePayload.knowledgeBaseId === '') {
      persistencePayload.knowledgeBaseId = null;
    }

    const tool = await this.repository.update(id, persistencePayload);

    if (!tool) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', {
          args: { resource: 'Creation tool' },
        }),
      );
    }

    await this.filesService.confirmFromUrl(tool.icon);
    await this.filesService.confirmFromUrl(tool.coverImage);

    return tool;
  }

  async remove(id: CreationTool['id']): Promise<void> {
    await this.repository.remove(id);
  }

  async activate(id: CreationTool['id']): Promise<CreationTool> {
    const tool = await this.repository.update(id, { isActive: true });

    if (!tool) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', {
          args: { resource: 'Creation tool' },
        }),
      );
    }

    return tool;
  }

  async deactivate(id: CreationTool['id']): Promise<CreationTool> {
    const tool = await this.repository.update(id, { isActive: false });

    if (!tool) {
      throw new NotFoundException(
        this.i18n.t('common.notFound', {
          args: { resource: 'Creation tool' },
        }),
      );
    }

    return tool;
  }
}
