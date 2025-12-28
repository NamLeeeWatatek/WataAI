import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CreateTemplateDto } from './dto/create-template.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterTemplateDto, SortTemplateDto } from './dto/query-template.dto';
import { TemplateRepository } from './infrastructure/persistence/template.repository';
import { Template } from './domain/template';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UpdateTemplateDto } from './dto/update-template.dto';

import { AiProvidersService } from '../ai-providers/ai-providers.service';
import { FilesService } from '../files/files.service';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesRepository: TemplateRepository,
    private readonly aiProvidersService: AiProvidersService,
    private readonly filesService: FilesService,
    private readonly i18n: I18nService,
  ) { }

  async create(
    createTemplateDto: CreateTemplateDto,
    userId?: string,
  ): Promise<Template> {
    // Check for duplicate name within workspace (optional)
    if (createTemplateDto.workspaceId) {
      const existingTemplate =
        await this.templatesRepository.findByNameAndWorkspace(
          createTemplateDto.name,
          createTemplateDto.workspaceId,
        );
      if (existingTemplate) {
        throw new UnprocessableEntityException({
          status: 422,
          errors: {
            name: this.i18n.t('template.nameAlreadyExists'),
          },
        });
      }
    }

    const template = await this.templatesRepository.create({
      creationToolId: createTemplateDto.creationToolId,
      name: createTemplateDto.name,
      description: createTemplateDto.description,
      category: createTemplateDto.categoryId
        ? { id: createTemplateDto.categoryId }
        : undefined,
      prefilledData: createTemplateDto.prefilledData,
      thumbnailUrl: createTemplateDto.thumbnailUrl,
      executionOverrides: createTemplateDto.executionOverrides,
      prompt: createTemplateDto.prompt,
      mediaFiles: createTemplateDto.mediaFiles,
      styleConfig: createTemplateDto.styleConfig,
      isActive: createTemplateDto.isActive ?? true,
      createdBy: userId,
      workspaceId: createTemplateDto.workspaceId,
      promptTemplate: createTemplateDto.promptTemplate,
      executionConfig: createTemplateDto.executionConfig,
      formSchema: createTemplateDto.formSchema,
      inputSchema: createTemplateDto.inputSchema,
      sortOrder: createTemplateDto.sortOrder ?? 0,
    });

    await this.filesService.confirmFromUrl(template.thumbnailUrl);

    return template;
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterTemplateDto | null;
    sortOptions?: SortTemplateDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[Template[], number]> {
    return this.templatesRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: Template['id']): Promise<NullableType<Template>> {
    return this.templatesRepository.findById(id);
  }

  findByIds(ids: Template['id'][]): Promise<Template[]> {
    return this.templatesRepository.findByIds(ids);
  }

  findByWorkspace(workspaceId: string): Promise<Template[]> {
    return this.templatesRepository.findByWorkspace(workspaceId);
  }

  findByCreationTool(creationToolId: string): Promise<Template[]> {
    return this.templatesRepository.findByCreationTool(creationToolId);
  }

  async update(
    id: Template['id'],
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template | null> {
    // Check for duplicate name if name is being updated
    if (updateTemplateDto.name) {
      const currentTemplate = await this.templatesRepository.findById(id);
      if (currentTemplate && currentTemplate.workspaceId) {
        const existingTemplate =
          await this.templatesRepository.findByNameAndWorkspace(
            updateTemplateDto.name,
            currentTemplate.workspaceId,
          );
        if (existingTemplate && existingTemplate.id !== id) {
          throw new UnprocessableEntityException({
            status: 422,
            errors: {
              name: this.i18n.t('template.nameAlreadyExists'),
            },
          });
        }
      }
    }

    const oldTemplate = await this.templatesRepository.findById(id);

    const updatedTemplate = await this.templatesRepository.update(id, {
      name: updateTemplateDto.name,
      description: updateTemplateDto.description,
      creationToolId: updateTemplateDto.creationToolId,
      prefilledData: updateTemplateDto.prefilledData,
      thumbnailUrl: updateTemplateDto.thumbnailUrl,
      executionOverrides: updateTemplateDto.executionOverrides,
      prompt: updateTemplateDto.prompt,
      mediaFiles: updateTemplateDto.mediaFiles,
      styleConfig: updateTemplateDto.styleConfig,
      category: updateTemplateDto.categoryId
        ? { id: updateTemplateDto.categoryId }
        : undefined,
      isActive: updateTemplateDto.isActive,
      workspaceId: updateTemplateDto.workspaceId,
      promptTemplate: updateTemplateDto.promptTemplate,
      executionConfig: updateTemplateDto.executionConfig,
      formSchema: updateTemplateDto.formSchema,
      inputSchema: updateTemplateDto.inputSchema,
      sortOrder: updateTemplateDto.sortOrder,
    });

    // 1. Confirm new ones
    await this.filesService.confirmFromUrl(updateTemplateDto.thumbnailUrl);
    await this.filesService.confirmManyFromUrls(updateTemplateDto.mediaFiles);

    // 2. Diff and cleanup old ones
    if (oldTemplate) {
      // Thumbnail cleanup
      if (
        oldTemplate.thumbnailUrl &&
        oldTemplate.thumbnailUrl !== updateTemplateDto.thumbnailUrl
      ) {
        await this.filesService.deleteFromUrl(oldTemplate.thumbnailUrl);
      }

      // MediaFiles cleanup (Diffing the arrays)
      if (oldTemplate.mediaFiles && updateTemplateDto.mediaFiles) {
        const deletedMedia = oldTemplate.mediaFiles.filter(
          (url) => !updateTemplateDto.mediaFiles?.includes(url),
        );
        for (const url of deletedMedia) {
          await this.filesService.deleteFromUrl(url);
        }
      }
    }

    return updatedTemplate;
  }

  async remove(id: Template['id']): Promise<void> {
    await this.templatesRepository.remove(id);
  }

  async bulkUpdate(
    ids: Template['id'][],
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<void> {
    const { category, categoryId, ...rest } = updateTemplateDto;
    return this.templatesRepository.bulkUpdate(ids, {
      ...rest,
      category: categoryId ? { id: categoryId } : undefined,
    } as any);
  }

  async bulkRemove(ids: Template['id'][]): Promise<void> {
    return this.templatesRepository.bulkRemove(ids);
  }

  async deactivate(id: Template['id']): Promise<Template | null> {
    return this.templatesRepository.update(id, {
      isActive: false,
    });
  }

  async activate(id: Template['id']): Promise<Template | null> {
    return this.templatesRepository.update(id, {
      isActive: true,
    });
  }
}
