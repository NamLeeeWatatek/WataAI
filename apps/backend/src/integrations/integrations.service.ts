import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelCredentialEntity } from './infrastructure/persistence/relational/entities/channel-credential.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { WorkspaceEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(ChannelCredentialEntity)
    private credentialRepository: Repository<ChannelCredentialEntity>,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  async findAll(workspaceId?: string): Promise<ChannelCredentialEntity[]> {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.credentialRepository.find({ where });
  }

  async findOne(
    provider: string,
    workspaceId?: string,
  ): Promise<ChannelCredentialEntity | null> {
    const where: any = { provider: provider.toLowerCase() };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.credentialRepository.findOne({ where });
  }

  async findById(id: string): Promise<ChannelCredentialEntity | null> {
    return this.credentialRepository.findOne({ where: { id } });
  }

  async create(
    dto: CreateCredentialDto,
    workspaceId?: string,
  ): Promise<ChannelCredentialEntity> {
    // Validate that workspace exists if workspaceId is provided
    if (workspaceId) {
      const workspaceExists = await this.workspaceRepository.exists({
        where: { id: workspaceId },
      });

      if (!workspaceExists) {
        throw new Error(`Workspace with ID ${workspaceId} does not exist`);
      }
    }

    const metadata = {
      ...dto.metadata,
      ...(dto.verifyToken ? { verifyToken: dto.verifyToken } : {}),
    };

    const credential = this.credentialRepository.create({
      provider: dto.provider.toLowerCase(),
      name: dto.name,
      clientId: dto.clientId,
      clientSecret: dto.clientSecret,
      scopes: dto.scopes,
      isActive: dto.isActive ?? true,
      metadata,
      workspaceId,
    });
    return this.credentialRepository.save(credential);
  }

  async update(
    id: string,
    dto: Partial<CreateCredentialDto>,
    workspaceId?: string,
  ): Promise<ChannelCredentialEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Config not found');
    }
    if (workspaceId && existing.workspaceId !== workspaceId) {
      throw new Error('Unauthorized access to config');
    }
    if (dto.verifyToken) {
      existing.metadata = {
        ...existing.metadata,
        verifyToken: dto.verifyToken,
      };
    }

    if (dto.provider) existing.provider = dto.provider;
    if (dto.name) existing.name = dto.name;
    if (dto.clientId) existing.clientId = dto.clientId;
    if (dto.clientSecret) existing.clientSecret = dto.clientSecret;
    if (dto.scopes) existing.scopes = dto.scopes;
    if (dto.isActive !== undefined) existing.isActive = dto.isActive;
    if (dto.metadata) {
      existing.metadata = {
        ...existing.metadata,
        ...dto.metadata,
      };
    }

    return this.credentialRepository.save(existing);
  }

  async delete(id: string, workspaceId?: string): Promise<void> {
    const criteria: any = { id };
    if (workspaceId) {
      criteria.workspaceId = workspaceId;
    }
    await this.credentialRepository.delete(criteria);
  }
}
