import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';
import {
  getWorkspaceRoleId,
  getWorkspaceRoleFromEntity,
} from './utils/workspace-role.helper';
import { WorkspaceRole } from './enums/workspace-role.enum';

@Injectable()
export class WorkspaceHelperService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private memberRepository: Repository<WorkspaceMemberEntity>,
  ) {}

  async getUserDefaultWorkspace(userId: string) {
    const membership = await this.memberRepository.findOne({
      where: { userId },
      relations: ['workspace'],
      order: { joinedAt: 'ASC' },
    });

    return membership?.workspace || null;
  }

  async getUserWorkspaces(userId: string) {
    const memberships = await this.memberRepository.find({
      where: { userId },
      relations: ['workspace'],
      order: { joinedAt: 'ASC' },
    });

    return memberships
      .map((m) => m.workspace)
      .filter((w): w is WorkspaceEntity => !!w && !w.deletedAt);
  }

  async ensureUserHasWorkspace(userId: string, userName?: string) {
    let workspace = await this.getUserDefaultWorkspace(userId);

    if (!workspace) {
      workspace = await this.createDefaultWorkspace(userId, userName);
    }

    return workspace;
  }

  async createDefaultWorkspace(userId: string, userName?: string) {
    const workspaceName = userName ? `${userName}'s Workspace` : 'My Workspace';
    const slug = `workspace-${userId.substring(0, 8)}-${Date.now()}`;

    const workspace = this.workspaceRepository.create({
      name: workspaceName,
      slug,
      ownerId: userId,
    });

    const saved = await this.workspaceRepository.save(workspace);

    await this.memberRepository.save({
      workspaceId: saved.id,
      userId,
      roleId: getWorkspaceRoleId(WorkspaceRole.OWNER),
    });

    return saved;
  }

  async isUserMemberOfWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { userId, workspaceId },
    });
    return !!member;
  }

  async getUserRoleInWorkspace(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceRole | null> {
    const member = await this.memberRepository.findOne({
      where: { userId, workspaceId },
      relations: ['role'],
    });
    return getWorkspaceRoleFromEntity(member?.role) || null;
  }

  async validateUserWorkspaceAccess(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const isMember = await this.isUserMemberOfWorkspace(userId, workspaceId);
    if (!isMember) {
      throw new BadRequestException('You do not have access to this workspace');
    }
  }
}
