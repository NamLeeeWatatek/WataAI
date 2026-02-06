import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { ChannelCredentialEntity } from './infrastructure/persistence/relational/entities/channel-credential.entity';
import { ChannelConnectionEntity } from './infrastructure/persistence/relational/entities/channel-connection.entity';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { WorkspaceEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Injectable()
export class IntegrationsService {
  constructor(
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
    @InjectRepository(ChannelCredentialEntity)
    private credentialRepository: Repository<ChannelCredentialEntity>,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  async findAll(workspaceId?: string): Promise<ChannelCredentialEntity[]> {
    const where: FindOptionsWhere<ChannelCredentialEntity> = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.credentialRepository.find({ where });
  }

  async findOne(
    provider: string,
    workspaceId?: string,
  ): Promise<ChannelCredentialEntity | null> {
    const where: FindOptionsWhere<ChannelCredentialEntity> = {
      provider: provider.toLowerCase(),
    };
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
        throw new NotFoundException(
          `Workspace with ID ${workspaceId} does not exist`,
        );
      }

      // Prevent duplicate configurations for the same provider + clientId
      const existing = await this.credentialRepository.findOne({
        where: {
          workspaceId,
          provider: dto.provider.toLowerCase(),
          clientId: dto.clientId,
        },
      });

      if (existing) {
        // If it exists, just return the existing one or handle as conflict
        // Returning existing one makes it idempotent
        return existing;
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
      throw new NotFoundException('Config not found');
    }
    if (workspaceId && existing.workspaceId !== workspaceId) {
      throw new ForbiddenException('Unauthorized access to config');
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

    // 1. Manually Cascade Delete: Remove connections that use this credential
    // because the DB constraint might be RESTRICT or NO ACTION, causing the error.
    const connectionCriteria: any = { credentialId: id };
    if (workspaceId) {
      connectionCriteria.workspaceId = workspaceId;
    }
    await this.connectionRepository.delete(connectionCriteria);

    // 2. Now safe to delete the credential
    await this.credentialRepository.delete(criteria);
  }
}
