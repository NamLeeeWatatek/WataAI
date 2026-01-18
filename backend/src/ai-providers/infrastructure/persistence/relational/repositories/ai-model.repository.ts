import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiModelEntity } from '../entities/ai-model.entity';
import { AiModelRepository } from '../../ai-model.repository';
import { AiModel } from '../../../../domain/ai-provider';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { AiProviderOwnerType } from '../../../../ai-providers.enum';
import { AiModelMapper } from '../mappers/ai-model.mapper';

@Injectable()
export class AiModelRelationalRepository implements AiModelRepository {
  constructor(
    @InjectRepository(AiModelEntity)
    private readonly repository: Repository<AiModelEntity>,
  ) {}

  async save(data: AiModel): Promise<AiModel> {
    const persistenceModel = AiModelMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return AiModelMapper.toDomain(newEntity);
  }

  async saveAll(data: AiModel[]): Promise<AiModel[]> {
    const persistenceModels = data.map(AiModelMapper.toPersistence);
    const entities = await this.repository.save(
      this.repository.create(persistenceModels as any),
    );
    return entities.map(AiModelMapper.toDomain);
  }

  async findByConfigId(
    configId: string,
    ownerType: AiProviderOwnerType,
    type?: string,
  ): Promise<AiModel[]> {
    const where: any = { configId, ownerType };
    if (type) {
      where.type = type;
    }

    const entities = await this.repository.find({
      where,
    });
    return entities.map(AiModelMapper.toDomain);
  }

  async findById(id: string): Promise<NullableType<AiModel>> {
    const entity = await this.repository.findOne({
      where: { id },
    });
    return entity ? AiModelMapper.toDomain(entity) : null;
  }

  async deleteByConfigId(
    configId: string,
    ownerType: AiProviderOwnerType,
  ): Promise<void> {
    await this.repository.delete({ configId, ownerType });
  }

  async deactivateAllByConfigId(
    configId: string,
    ownerType: AiProviderOwnerType,
  ): Promise<void> {
    await this.repository.update({ configId, ownerType }, { isActive: false });
  }

  async findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: any;
    sortOptions?: any[] | null;
    paginationOptions: { page: number; limit: number };
  }): Promise<AiModel[]> {
    const where: any = {};
    if (filterOptions?.providerId) {
      where.providerId = filterOptions.providerId;
    }
    if (filterOptions?.configId) {
      where.configId = filterOptions.configId;
    }
    if (filterOptions?.ownerId) {
      where.ownerId = filterOptions.ownerId;
    }
    if (filterOptions?.ownerType) {
      where.ownerType = filterOptions.ownerType;
    }
    if (filterOptions?.type) {
      where.type = filterOptions.type;
    }

    const query = this.repository.createQueryBuilder('model');
    query.where(where);

    if (filterOptions?.search) {
      query.andWhere(
        '(model.name ILIKE :search OR model.displayName ILIKE :search)',
        { search: `%${filterOptions.search}%` },
      );
    }

    if (filterOptions?.onlyStable) {
      query.andWhere(
        "NOT (model.name ~ '.*-[0-9]{8}.*' OR model.name ~ '.*:[0-9]{8}.*')",
      );
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sort) => {
        query.addOrderBy(`model.${sort.orderBy}`, sort.order);
      });
    } else {
      query.addOrderBy('model.createdAt', 'DESC');
    }

    query
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    const entities = await query.getMany();
    return entities.map(AiModelMapper.toDomain);
  }
}
