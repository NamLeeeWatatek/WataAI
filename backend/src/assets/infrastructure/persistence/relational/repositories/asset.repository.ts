import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { AssetEntity } from '../entities/asset.entity';
import { AssetRepository } from '../../asset.repository';
import { Asset } from '../../../../domain/asset';
import { AssetMapper } from '../mappers/asset.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class AssetsRelationalRepository implements AssetRepository {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly repository: Repository<AssetEntity>,
  ) {}

  async create(data: Asset): Promise<Asset> {
    const persistenceModel = AssetMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return AssetMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
    workspaceId,
    type,
    search,
  }: {
    paginationOptions: IPaginationOptions;
    workspaceId: string;
    type?: string;
    search?: string;
  }): Promise<{ data: Asset[]; count: number }> {
    const where: FindOptionsWhere<AssetEntity> = {
      workspaceId,
    };

    if (type) {
      where.type = type as any;
    }

    if (search) {
      where.name = ILike(`%${search}%`);
    }

    const [entities, count] = await this.repository.findAndCount({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      data: entities.map((entity) => AssetMapper.toDomain(entity)),
      count,
    };
  }

  async findById(id: Asset['id']): Promise<NullableType<Asset>> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? AssetMapper.toDomain(entity) : null;
  }

  async update(
    id: Asset['id'],
    payload: Partial<Asset>,
  ): Promise<Asset | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) return null;

    const updatedEntity = await this.repository.save(
      this.repository.create(
        AssetMapper.toPersistence({
          ...AssetMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return AssetMapper.toDomain(updatedEntity);
  }

  async remove(id: Asset['id']): Promise<void> {
    await this.repository.delete(id);
  }
}
