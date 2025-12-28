import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, Like } from 'typeorm';
import { CategoryEntity } from '../entities/category.entity';
import { CategoryRepository } from '../../category.repository';
import { Category } from '../../../../domain/category';
import { CategoryMapper } from '../mappers/category.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class CategoryRelationalRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async create(data: Category): Promise<Category> {
    const persistenceModel = CategoryMapper.toPersistence(data);
    const newEntity = await this.categoryRepository.save(
      this.categoryRepository.create(persistenceModel),
    );
    return CategoryMapper.toDomain(newEntity);
  }

  async findAllWithPagination(
    paginationOptions: IPaginationOptions & { type?: string; search?: string },
  ): Promise<[Category[], number]> {
    const where: FindOptionsWhere<CategoryEntity> = {};

    if (paginationOptions.type) {
      where.type = paginationOptions.type;
    }

    if (paginationOptions.search) {
      where.name = Like(`%${paginationOptions.search}%`);
    }

    const [entities, count] = await this.categoryRepository.findAndCount({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
    });

    return [entities.map((entity) => CategoryMapper.toDomain(entity)), count];
  }

  async findById(id: string): Promise<Category | null> {
    const entity = await this.categoryRepository.findOne({
      where: { id },
    });

    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const entity = await this.categoryRepository.findOne({
      where: { slug },
    });

    return entity ? CategoryMapper.toDomain(entity) : null;
  }

  async update(
    id: string,
    payload: Partial<Category>,
  ): Promise<Category | null> {
    const entity = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!entity) {
      return null;
    }

    console.log('[CategoryRepo] Updating ID:', id, 'with payload:', payload);
    Object.assign(entity, payload);

    await this.categoryRepository.save(entity);

    const updatedEntity = await this.categoryRepository.findOne({
      where: { id },
    });

    return updatedEntity ? CategoryMapper.toDomain(updatedEntity) : null;
  }

  async remove(id: string): Promise<void> {
    await this.categoryRepository.softDelete(id);
  }
}
