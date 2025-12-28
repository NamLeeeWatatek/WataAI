import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenerationJobEntity } from '../entities/generation-job.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { GenerationJob } from '../../../../domain/generation-job';
import { GenerationJobRepository } from '../../generation-job.repository';
import { GenerationJobMapper } from '../mappers/generation-job.mapper';

@Injectable()
export class GenerationJobRelationalRepository
  implements GenerationJobRepository
{
  constructor(
    @InjectRepository(GenerationJobEntity)
    private readonly repository: Repository<GenerationJobEntity>,
  ) {}

  async create(data: GenerationJob): Promise<GenerationJob> {
    const persistenceModel = GenerationJobMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return GenerationJobMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<GenerationJob[]> {
    const entities = await this.repository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: {
        workspaceId,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: ['template'],
    });

    return entities.map((entity) => GenerationJobMapper.toDomain(entity));
  }

  async findById(
    id: GenerationJob['id'],
  ): Promise<NullableType<GenerationJob>> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['template'],
    });

    return entity ? GenerationJobMapper.toDomain(entity) : null;
  }

  async update(
    id: GenerationJob['id'],
    payload: Partial<GenerationJob>,
  ): Promise<GenerationJob | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) return null;

    const updatedEntity = await this.repository.save(
      this.repository.create(
        GenerationJobMapper.toPersistence({
          ...GenerationJobMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return GenerationJobMapper.toDomain(updatedEntity);
  }

  async remove(id: GenerationJob['id']): Promise<void> {
    await this.repository.softDelete(id);
  }
}
