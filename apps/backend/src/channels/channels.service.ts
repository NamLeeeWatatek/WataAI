import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { CreateConnectionDto } from '../integrations/dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import {
  ChannelConnectionStatus,
  ChannelType,
} from '../integrations/integrations.enum';

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name);

  constructor(
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
  ) { }

  async findAll(
    workspaceId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: ChannelConnectionEntity[]; total: number }> {
    const builder = this.connectionRepository.createQueryBuilder('channel');

    // Ensure we scope by workspaceId to prevent data leaks
    builder.where('channel.workspaceId = :workspaceId', { workspaceId });

    if (query.search) {
      builder.andWhere(
        '(LOWER(channel.name) LIKE LOWER(:search) OR LOWER(channel.type) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    builder.leftJoinAndSelect('channel.credential', 'credential');
    builder.orderBy('channel.connectedAt', 'DESC');

    const page = query.page || 1;
    const limit = query.limit || 20;

    builder.skip((page - 1) * limit).take(limit);

    const [data, total] = await builder.getManyAndCount();
    return { data, total };
  }

  async findOne(
    id: string,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: FindOptionsWhere<ChannelConnectionEntity> = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.connectionRepository.findOne({
      where,
      relations: ['credential'],
    });
  }

  async findByExternalId(
    externalId: string,
  ): Promise<ChannelConnectionEntity | null> {
    // Optimization: Query directly on the JSONB column instead of fetching all
    // Postgres specific syntax for JSONB
    return this.connectionRepository
      .createQueryBuilder('channel')
      .leftJoinAndSelect('channel.credential', 'credential')
      .where("channel.metadata ->> 'pageId' = :externalId", { externalId })
      .andWhere('channel.status = :status', { status: ChannelConnectionStatus.ACTIVE })
      .getOne();
  }

  async findByType(
    type: string,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: FindOptionsWhere<ChannelConnectionEntity> = {
      type: type as ChannelType,
      status: ChannelConnectionStatus.ACTIVE,
    };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.connectionRepository.findOne({
      where,
      relations: ['credential'],
    });
  }

  async create(
    dto: CreateConnectionDto,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity> {
    const connection = this.connectionRepository.create({
      ...dto,
      type: dto.type as ChannelType,
      workspaceId: workspaceId,
      status: ChannelConnectionStatus.ACTIVE,
      connectedAt: new Date(),
    });
    return await this.connectionRepository.save(connection);
  }

  async update(
    id: string,
    dto: UpdateConnectionDto,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity> {
    const where: FindOptionsWhere<ChannelConnectionEntity> = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const connection = await this.connectionRepository.findOne({ where });
    if (!connection) {
      throw new Error('Channel connection not found');
    }

    // Update fields
    if (dto.botId !== undefined) {
      connection.metadata = { ...connection.metadata, botId: dto.botId };
    }
    if (dto.name !== undefined) {
      connection.name = dto.name;
    }
    if (dto.metadata !== undefined) {
      connection.metadata = { ...connection.metadata, ...dto.metadata };
    }

    return this.connectionRepository.save(connection);
  }

  async delete(id: string, workspaceId?: string): Promise<void> {
    try {
      // ✅ FIX: Safe update using TypeORM repository
      await this.connectionRepository.manager.transaction(async (manager) => {
        // Update conversations to remote channel reference
        await this.conversationRepository.update(
          { channelId: id },
          { channelId: null, channelType: 'internal' }
        );

        // Then delete the channel
        const where: FindOptionsWhere<ChannelConnectionEntity> = { id };
        if (workspaceId) {
          where.workspaceId = workspaceId;
        }
        await manager.delete(ChannelConnectionEntity, where);
      });

      this.logger.log(`✅ Deleted channel ${id} and cleaned up conversations`);
    } catch (error) {
      this.logger.error(`❌ Error deleting channel ${id}:`, error);
      throw error;
    }
  }
}
