import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FilesService } from '../files/files.service';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Category } from './domain/category';
import { NullableType } from '../utils/types/nullable.type';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly filesService: FilesService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.create({
      ...createCategoryDto,
      type: createCategoryDto.type ?? 'system',
    });

    await this.filesService.confirmFromUrl(category.icon);

    return category;
  }

  findAllWithPagination(
    paginationOptions: IPaginationOptions & { type?: string; search?: string },
  ): Promise<[Category[], number]> {
    return this.categoryRepository.findAllWithPagination(paginationOptions);
  }

  findById(id: string): Promise<NullableType<Category>> {
    return this.categoryRepository.findById(id);
  }

  findBySlug(slug: string): Promise<NullableType<Category>> {
    return this.categoryRepository.findBySlug(slug);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category | null> {
    const category = await this.categoryRepository.update(
      id,
      updateCategoryDto,
    );
    if (category) {
      await this.filesService.confirmFromUrl(category.icon);
    }
    return category;
  }

  remove(id: string): Promise<void> {
    return this.categoryRepository.remove(id);
  }
}
