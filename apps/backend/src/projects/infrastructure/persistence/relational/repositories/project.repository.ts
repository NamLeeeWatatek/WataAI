import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../entities/project.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { Project } from '../../../../domain/project';
import { ProjectRepository } from '../../project.repository';
import { ProjectMapper } from '../mappers/project.mapper';

@Injectable()
export class ProjectRelationalRepository implements ProjectRepository {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>,
  ) {}

  async create(data: Project): Promise<Project> {
    const persistenceModel = ProjectMapper.toPersistence(data);
    const newEntity = await this.repository.save(
      this.repository.create(persistenceModel),
    );
    return ProjectMapper.toDomain(newEntity);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Project[]> {
    const entities = await this.repository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: {
        workspaceId,
      },
    });

    return entities.map((entity) => ProjectMapper.toDomain(entity));
  }

  async findById(id: Project['id']): Promise<NullableType<Project>> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    return entity ? ProjectMapper.toDomain(entity) : null;
  }

  async update(
    id: Project['id'],
    payload: Partial<Project>,
  ): Promise<Project | null> {
    const entity = await this.repository.findOne({
      where: { id },
    });

    if (!entity) return null;

    const updatedEntity = await this.repository.save(
      this.repository.create(
        ProjectMapper.toPersistence({
          ...ProjectMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return ProjectMapper.toDomain(updatedEntity);
  }

  async remove(id: Project['id']): Promise<void> {
    await this.repository.softDelete(id);
  }
}
