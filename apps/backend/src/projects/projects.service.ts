import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './infrastructure/persistence/project.repository';
import { Project } from './domain/project';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { NullableType } from '../utils/types/nullable.type';
import { DeepPartial } from '../utils/types/deep-partial.type';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectRepository.create(createProjectDto);
  }

  async findManyWithPagination({
    workspaceId,
    paginationOptions,
  }: {
    workspaceId: string;
    paginationOptions: IPaginationOptions;
  }): Promise<Project[]> {
    return this.projectRepository.findManyWithPagination({
      workspaceId,
      paginationOptions,
    });
  }

  async findById(id: Project['id']): Promise<NullableType<Project>> {
    return this.projectRepository.findById(id);
  }

  async update(
    id: Project['id'],
    payload: UpdateProjectDto,
  ): Promise<Project | null> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return this.projectRepository.update(id, payload);
  }

  async remove(id: Project['id']): Promise<void> {
    await this.projectRepository.remove(id);
  }
}
