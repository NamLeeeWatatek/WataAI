import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CreationJobEntity } from '../entities/creation-jobs.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { CreationJob } from '../../../../domain/creation-jobs';
import { CreationJobsRepository } from '../../creation-jobs.repository';
import { CreationJobsMapper } from '../mappers/creation-jobs.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { FilterBuilder } from 'src/utils/filter-builder';
import { CreationJobPublicationEntity } from '../entities/creation-job-publication.entity';
import { CreationJobPublication } from '../../../../domain/creation-job-publication';
import { CreationJobPublicationMapper } from '../mappers/creation-job-publication.mapper';

@Injectable()
export class CreationJobsRelationalRepository
  implements CreationJobsRepository {
  constructor(
    @InjectRepository(CreationJobEntity)
    private readonly creationJobsRepository: Repository<CreationJobEntity>,
    @InjectRepository(CreationJobPublicationEntity)
    private readonly publicationRepository: Repository<CreationJobPublicationEntity>,
  ) { }

  async create(data: CreationJob): Promise<CreationJob> {
    const persistenceModel = CreationJobsMapper.toPersistence(data);
    const newEntity = await this.creationJobsRepository.save(
      this.creationJobsRepository.create(persistenceModel),
    );
    return this.findById(
      newEntity.id,
      data.workspaceId!,
    ) as Promise<CreationJob>;
  }

  async findAllWithPagination({
    paginationOptions,
    filterOptions,
  }: {
    paginationOptions: IPaginationOptions;
    filterOptions: {
      workspaceId: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      status?: string[];
    };
  }): Promise<{ data: CreationJob[]; count: number }> {
    const qb = this.creationJobsRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.creationTool', 'creationTool')
      .where('job.workspaceId = :workspaceId', {
        workspaceId: filterOptions.workspaceId,
      });

    const filterBuilder = new FilterBuilder(qb);

    filterBuilder
      .search(filterOptions.search, ['job.id', 'creationTool.name'])
      .filterByDateRange(
        'job.createdAt',
        filterOptions.startDate,
        filterOptions.endDate,
      )
      .filterExact({ 'job.status': filterOptions.status });

    qb.orderBy('job.createdAt', 'DESC')
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    const [entities, count] = await qb.getManyAndCount();

    return {
      data: entities.map((entity) => CreationJobsMapper.toDomain(entity)),
      count,
    };
  }

  async findById(
    id: CreationJob['id'],
    workspaceId: string,
  ): Promise<NullableType<CreationJob>> {
    const entity = await this.creationJobsRepository.findOne({
      where: { id, workspaceId },
      relations: ['creationTool'],
    });

    return entity ? CreationJobsMapper.toDomain(entity) : null;
  }

  async findByIds(ids: CreationJob['id'][]): Promise<CreationJob[]> {
    const entities = await this.creationJobsRepository.find({
      where: { id: In(ids) },
      relations: ['creationTool'],
    });

    return entities.map((entity) => CreationJobsMapper.toDomain(entity));
  }

  async update(
    id: CreationJob['id'],
    workspaceId: string,
    payload: Partial<CreationJob>,
  ): Promise<CreationJob | null> {
    const entity = await this.creationJobsRepository.findOne({
      where: { id, workspaceId },
    });

    if (!entity) {
      return null;
    }

    const updatedEntity = await this.creationJobsRepository.save(
      this.creationJobsRepository.create(
        CreationJobsMapper.toPersistence({
          ...CreationJobsMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CreationJobsMapper.toDomain(updatedEntity);
  }

  async remove(id: CreationJob['id'], workspaceId: string): Promise<void> {
    await this.creationJobsRepository.delete({ id, workspaceId });
  }

  async removeMany(
    ids: CreationJob['id'][],
    workspaceId: string,
  ): Promise<void> {
    await this.creationJobsRepository.delete({ id: In(ids), workspaceId });
  }

  async createPublication(
    data: Omit<CreationJobPublication, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<CreationJobPublication> {
    const persistenceModel = CreationJobPublicationMapper.toPersistence(
      data as CreationJobPublication,
    );
    const newEntity = await this.publicationRepository.save(
      this.publicationRepository.create(persistenceModel),
    );
    return CreationJobPublicationMapper.toDomain(newEntity);
  }

  async findPublicationsByJobId(
    jobId: string,
  ): Promise<CreationJobPublication[]> {
    const entities = await this.publicationRepository.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) =>
      CreationJobPublicationMapper.toDomain(entity),
    );
  }
}
