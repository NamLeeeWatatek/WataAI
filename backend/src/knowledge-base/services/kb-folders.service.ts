import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CreateFolderDto, UpdateFolderDto } from '../dto/kb-folder.dto';
import { KBManagementService } from './kb-management.service';
import {
  KbFolderEntity,
  KbDocumentEntity,
} from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KBDocumentsService } from './kb-documents.service';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class KBFoldersService {
  constructor(
    @InjectRepository(KbFolderEntity)
    private readonly folderRepository: Repository<KbFolderEntity>,
    @InjectRepository(KbDocumentEntity)
    private readonly documentRepository: Repository<KbDocumentEntity>,
    private readonly kbManagementService: KBManagementService,
    @Inject(forwardRef(() => KBDocumentsService))
    private readonly kbDocumentsService: KBDocumentsService,
  ) {}

  async create(_userId: string, createDto: CreateFolderDto) {
    const kb = await this.kbManagementService.findOne(
      createDto.knowledgeBaseId,
      _userId,
    );

    // Check for duplicate names at the same level
    const existing = await this.folderRepository.findOne({
      where: {
        knowledgeBaseId: createDto.knowledgeBaseId,
        parentId:
          createDto.parentFolderId === null
            ? IsNull()
            : createDto.parentFolderId,
        name: createDto.name,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Folder with name "${createDto.name}" already exists at this level`,
      );
    }

    const folderData = {
      ...createDto,
      workspaceId: kb.workspaceId,
      parentId: createDto.parentFolderId,
      createdBy: _userId,
    };

    const folder = this.folderRepository.create(folderData);
    return this.folderRepository.save(folder);
  }

  async findAll(kbId: string, _userId: string) {
    await this.kbManagementService.findOne(kbId, _userId);

    return this.folderRepository.find({
      where: { knowledgeBaseId: kbId },
      relations: ['children', 'documents'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(folderId: string, _userId: string) {
    const folder = await this.folderRepository.findOne({
      where: { id: folderId },
      relations: ['knowledgeBase', 'children', 'documents'],
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    await this.kbManagementService.findOne(folder.knowledgeBaseId, _userId);

    return folder;
  }

  async update(folderId: string, _userId: string, updateDto: UpdateFolderDto) {
    const folder = await this.findOne(folderId, _userId);

    if (updateDto.name && updateDto.name !== folder.name) {
      const parentId =
        updateDto.parentFolderId !== undefined
          ? updateDto.parentFolderId
          : folder.parentId;
      const existing = await this.folderRepository.findOne({
        where: {
          knowledgeBaseId: folder.knowledgeBaseId,
          parentId: parentId === null ? IsNull() : parentId,
          name: updateDto.name,
        },
      });

      if (existing && existing.id !== folderId) {
        throw new ConflictException(
          `Folder with name "${updateDto.name}" already exists at this level`,
        );
      }
    }

    if (updateDto.parentFolderId !== undefined) {
      folder.parentId = updateDto.parentFolderId;
    }

    Object.assign(folder, updateDto);
    return this.folderRepository.save(folder);
  }

  async remove(folderId: string, _userId: string) {
    const folder = await this.findOne(folderId, _userId);

    // 1. Delete subfolders recursively
    const subfolders = await this.folderRepository.find({
      where: { parentId: folderId },
    });
    for (const subfolder of subfolders) {
      await this.remove(subfolder.id, _userId);
    }

    // 2. Delete documents in this folder (handles chunks and vectors)
    const documents = await this.documentRepository.find({
      where: { folderId: folderId },
    });
    for (const doc of documents) {
      await this.kbDocumentsService.remove(doc.id, _userId);
    }

    // 3. Remove the folder itself
    await this.folderRepository.remove(folder);
    return { success: true };
  }

  async getTree(kbId: string, _userId: string) {
    await this.kbManagementService.findOne(kbId, _userId);

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

  async findAllByParent(
    kbId: string,
    parentId: string | null,
    _userId: string,
    search?: string,
  ) {
    await this.kbManagementService.findOne(kbId, _userId);

    const query = this.folderRepository
      .createQueryBuilder('folder')
      .where('folder.knowledgeBaseId = :kbId', { kbId });

    if (parentId === null) {
      query.andWhere('folder.parentId IS NULL');
    } else {
      query.andWhere('folder.parentId = :parentId', { parentId });
    }

    if (search) {
      query.andWhere('folder.name ILIKE :search', { search: `%${search}%` });
    }

    query.orderBy('folder.name', 'ASC');

    return query.getMany();
  }

  async getBreadcrumbs(folderId: string, _userId: string): Promise<any[]> {
    const breadcrumbs: any[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const folder = await this.folderRepository.findOne({
        where: { id: currentId },
      });

      if (!folder) break;

      breadcrumbs.unshift({
        id: folder.id,
        name: folder.name,
      });

      currentId = folder.parentId ?? null;
    }

    return breadcrumbs;
  }
}
