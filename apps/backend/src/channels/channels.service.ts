import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelConnectionEntity } from '../integrations/infrastructure/persistence/relational/entities/channel-connection.entity';
import { CreateConnectionDto } from '../integrations/dto/create-connection.dto';
import {
  ChannelConnectionStatus,
  ChannelType,
} from '../integrations/integrations.enum';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(ChannelConnectionEntity)
    private connectionRepository: Repository<ChannelConnectionEntity>,
  ) {}

  async findAll(workspaceId?: string): Promise<ChannelConnectionEntity[]> {
    const where: any = {};
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return this.connectionRepository.find({
      where,
      relations: ['credential'],
      order: { connectedAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: any = { id };
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
    const channels = await this.connectionRepository.find({
      where: { status: ChannelConnectionStatus.ACTIVE },
      relations: ['credential'],
    });

    return (
      channels.find((channel) => channel.metadata?.pageId === externalId) ||
      null
    );
  }

  async findByType(
    type: string,
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity | null> {
    const where: any = { type, status: ChannelConnectionStatus.ACTIVE };
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
      ...(dto as any),
      workspaceId: workspaceId,
      status: ChannelConnectionStatus.ACTIVE,
      connectedAt: new Date(),
    });
    return await this.connectionRepository.save(connection as any);
  }

  async update(
    id: string,
    dto: { botId?: string | null; name?: string; metadata?: any },
    workspaceId?: string,
  ): Promise<ChannelConnectionEntity> {
    const where: any = { id };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    const connection = await this.connectionRepository.findOne({ where });
    if (!connection) {
      throw new Error('Channel connection not found');
    }

    // Update fields
    if (dto.botId !== undefined) {
      // connection.botId = dto.botId;
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
      // âœ… FIX: Update conversations first to prevent orphaned references
      // Use snake_case column names as they appear in database
      const updateResult = await this.connectionRepository.manager.query(
        `UPDATE conversation SET channel_id = NULL, channel_type = 'internal' WHERE channel_id = $1`,
        [id],
      );

      console.log(
        `âœ… Updated ${updateResult[1] || 0} conversations before deleting channel ${id}`,
      );

      // Then delete the channel
      const where: any = { id };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }
      await this.connectionRepository.delete(where);

      console.log(`âœ… Deleted channel ${id}`);
    } catch (error) {
      console.error(`âŒ Error deleting channel ${id}:`, error);
      throw error;
    }
  }
}
