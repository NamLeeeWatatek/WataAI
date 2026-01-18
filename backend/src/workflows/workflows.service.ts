import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Workflow } from './entities/workflow.entity';
import { UserEntity as User } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { IPaginationOptions } from '../utils/types/pagination-options';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
  ) {}

  create(createWorkflowDto: CreateWorkflowDto, user?: User) {
    const workflow = this.workflowsRepository.create({
      ...createWorkflowDto,
      owner: user,
    });
    return this.workflowsRepository.save(workflow);
  }

  findAll(paginationOptions: IPaginationOptions) {
    return this.workflowsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(fields: FindOptionsWhere<Workflow>) {
    const workflow = await this.workflowsRepository.findOne({
      where: fields,
    });
    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }
    return workflow;
  }

  async update(id: string, updateWorkflowDto: UpdateWorkflowDto) {
    const workflow = await this.findOne({ id });
    const updated = this.workflowsRepository.merge(workflow, updateWorkflowDto);
    return this.workflowsRepository.save(updated);
  }

  async remove(id: string) {
    await this.workflowsRepository.delete(id);
  }
}
