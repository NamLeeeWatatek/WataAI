import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFolderDto, UpdateFolderDto } from '../dto/kb-folder.dto';
import { KBManagementService } from './kb-management.service';
import { KbFolderEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';

@Injectable()
export class KBFoldersService {
  constructor(
    @InjectRepository(KbFolderEntity)
    private readonly folderRepository: Repository<KbFolderEntity>,
    private readonly kbManagementService: KBManagementService,
  ) {}

  async create(userId: string, createDto: CreateFolderDto) {
    const kb = await this.kbManagementService.findOne(
      createDto.knowledgeBaseId,
      userId,
    );

    const folderData = {
      ...createDto,
      workspaceId: kb.workspaceId,
      parentId: createDto.parentFolderId,
      createdBy: userId,
    };

    const folder = this.folderRepository.create(folderData);
    return this.folderRepository.save(folder);
  }

  async findAll(kbId: string, userId: string) {
    await this.kbManagementService.findOne(kbId, userId);

    return this.folderRepository.find({
      where: { knowledgeBaseId: kbId },
      relations: ['children', 'documents'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(folderId: string, userId: string) {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['knowledgeBase', 'children', 'documents'],
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    await this.kbManagementService.findOne(folder.knowledgeBaseId, userId);

    return folder;
  }

  async update(folderId: string, userId: string, updateDto: UpdateFolderDto) {
    const folder = await this.findOne(folderId, userId);
    Object.assign(folder, updateDto);
    return this.folderRepository.save(folder);
  }

  async remove(folderId: string, userId: string) {
    const folder = await this.findOne(folderId, userId);
    await this.folderRepository.remove(folder);
    return { success: true };
  }

  async getTree(kbId: string, userId: string) {
    await this.kbManagementService.findOne(kbId, userId);

    const folders = await this.folderRepository.find({
      where: { knowledgeBaseId: kbId },
      relations: ['documents'],
      order: { createdAt: 'ASC' },
    });

    const folderMap = new Map<string, any>();
    const rootFolders: any[] = [];

    folders.forEach((folder) => {
      const folderWithChildren = folder as KbFolderEntity & {
        children: any[];
      };
      folderWithChildren.children = [];
      folderMap.set(folder.id, folderWithChildren);
    });

    folders.forEach((folder) => {
      const node = folderMap.get(folder.id);
      if (node) {
        if (folder.parentId) {
          const parent = folderMap.get(folder.parentId);
          if (parent) {
            parent.children.push(node);
          }
        } else {
          rootFolders.push(node);
        }
      }
    });

    return rootFolders;
  }
}
