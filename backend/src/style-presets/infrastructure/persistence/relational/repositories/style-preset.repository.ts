import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StylePresetEntity } from '../entities/style-preset.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { StylePreset } from '../../../../domain/style-preset';
import { StylePresetRepository } from '../../style-preset.repository';
import { StylePresetMapper } from '../mappers/style-preset.mapper';

@Injectable()
export class StylePresetRelationalRepository implements StylePresetRepository {
  constructor(
    @InjectRepository(StylePresetEntity)
    private readonly repository: Repository<StylePresetEntity>,
  ) {}

  async create(data: StylePreset): Promise<StylePreset> {
    const persistenceModel = StylePresetMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return StylePresetMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<StylePreset[]> {
    const entities = await this.repository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: {
        workspaceId,
      },
    });

    return entities.map((entity) => StylePresetMapper.toDomain(entity));
  }

  async findById(id: StylePreset['id']): Promise<NullableType<StylePreset>> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? StylePresetMapper.toDomain(entity) : null;
  }

  async update(
    id: StylePreset['id'],
    payload: Partial<StylePreset>,
  ): Promise<StylePreset | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) return null;

    const updatedEntity = await this.repository.save(
      this.repository.create(
        StylePresetMapper.toPersistence({
          ...StylePresetMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return StylePresetMapper.toDomain(updatedEntity);
  }

  async remove(id: StylePreset['id']): Promise<void> {
    await this.repository.softDelete(id);
  }
}
