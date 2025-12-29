import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceRole } from './enums/workspace-role.enum';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from './infrastructure/persistence/relational/entities/workspace.entity';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import {
  getWorkspaceRoleId,
  getWorkspaceRoleFromEntity,
} from './utils/workspace-role.helper';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private memberRepository: Repository<WorkspaceMemberEntity>,
  ) {}

  async create(createDto: CreateWorkspaceDto, ownerId: string) {
    const existing = await this.workspaceRepository.findOne({
      where: { slug: createDto.slug },
    });
    if (existing) {
      throw new ConflictException('Workspace slug already exists');
    }

    const workspace = this.workspaceRepository.create({
      name: createDto.name,
      slug: createDto.slug,
      ownerId,
    });

    const saved = await this.workspaceRepository.save(workspace);

    await this.memberRepository.save({
      workspaceId: saved.id,
      userId: ownerId,
      roleId: getWorkspaceRoleId(WorkspaceRole.OWNER),
    });

    return saved;
  }

  async findAll(userId: string) {
    return this.workspaceRepository
      .createQueryBuilder('workspace')
      .leftJoin('workspace.members', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('workspace.deletedAt IS NULL')
      .orderBy('member.joinedAt', 'ASC')
      .getMany();
  }

  async getUserDefaultWorkspace(userId: string) {
    const membership = await this.memberRepository.findOne({
      where: { userId },
      relations: ['workspace'],
      order: { joinedAt: 'ASC' },
    });

    if (!membership?.workspace) {
      return this.createDefaultWorkspace(userId);
    }

    return membership.workspace;
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

  async findOne(id: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async findBySlug(slug: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { slug },
      relations: ['owner', 'members', 'members.user'],
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace;
  }

  async update(id: string, updateDto: UpdateWorkspaceDto, userId?: string) {
    const workspace = await this.findOne(id);

    if (userId) {
      const member = await this.memberRepository.findOne({
        where: { workspaceId: id, userId },
        relations: ['role'],
      });
      const role = getWorkspaceRoleFromEntity(member?.role);
      if (
        !member ||
        (role !== WorkspaceRole.OWNER && role !== WorkspaceRole.ADMIN)
      ) {
        throw new ForbiddenException('Not authorized to update workspace');
      }
    }

    if (updateDto.slug && updateDto.slug !== workspace.slug) {
      const existing = await this.workspaceRepository.findOne({
        where: { slug: updateDto.slug },
      });
      if (existing) {
        throw new ConflictException('Workspace slug already exists');
      }
    }

    Object.assign(workspace, updateDto);
    return this.workspaceRepository.save(workspace);
  }

  async remove(id: string, userId?: string) {
    const workspace = await this.findOne(id);

    if (userId && workspace.ownerId !== userId) {
      throw new ForbiddenException('Only owner can delete workspace');
    }

    await this.workspaceRepository.softDelete(id);
  }

  async addMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole = WorkspaceRole.MEMBER,
    actorId?: string,
  ) {
    if (actorId) {
      const actorRole = await this.getMemberRole(workspaceId, actorId);
      if (
        actorRole !== WorkspaceRole.OWNER &&
        actorRole !== WorkspaceRole.ADMIN
      ) {
        throw new ForbiddenException('Only admins and owners can add members');
      }
    }

    const existing = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    const member = this.memberRepository.create({
      workspaceId,
      userId,
      roleId: getWorkspaceRoleId(role),
    });
    return this.memberRepository.save(member);
  }

  // Internal method for Invitation Service
  async addDirectMember(workspaceId: string, userId: string, roleId: number) {
    const existing = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    if (existing) {
      // Already member, update role? or just ignore
      return existing;
    }
    const member = this.memberRepository.create({
      workspaceId,
      userId,
      roleId,
    });
    return this.memberRepository.save(member);
  }

  async updateMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    actorId: string,
  ) {
    // 1. Check actor permissions
    const actorRole = await this.getMemberRole(workspaceId, actorId);
    if (
      actorRole !== WorkspaceRole.OWNER &&
      actorRole !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Only admins and owners can update roles');
    }
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['role'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const currentRole = getWorkspaceRoleFromEntity(member.role);
    if (currentRole === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    // New Logic: Admin cannot demote/promote another Admin?
    // Usually Admin CAN change Member <-> Admin.
    // But Admin CANNOT touch Owner (handled above).
    // If target is Admin, and actor is Admin -> strictly speaking often allowed, but user asked for hierarchy.
    // Let's allow Admin to manage other Admins for now, OR restrict:
    if (
      actorRole === WorkspaceRole.ADMIN &&
      currentRole === WorkspaceRole.ADMIN &&
      role !== WorkspaceRole.ADMIN
    ) {
      // Hierarchy: Owner > Admin. Admin = Admin?
      // Let's enforce Owner > Admin. Admin cannot change other Admin's role.
      throw new ForbiddenException('Only owner can modify admin roles');
    }

    member.roleId = getWorkspaceRoleId(role);
    return this.memberRepository.save(member);
  }

  async removeMember(workspaceId: string, userId: string, actorId: string) {
    const actorRole = await this.getMemberRole(workspaceId, actorId);

    if (
      actorRole !== WorkspaceRole.OWNER &&
      actorRole !== WorkspaceRole.ADMIN
    ) {
      throw new ForbiddenException('Only admins and owners can remove members');
    }

    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['role'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const role = getWorkspaceRoleFromEntity(member.role);
    if (role === WorkspaceRole.OWNER) {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    // Role Hierarchy: Admin cannot remove Admin
    if (actorRole === WorkspaceRole.ADMIN && role === WorkspaceRole.ADMIN) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.memberRepository.delete({ workspaceId, userId });
  }

  async getMembers(workspaceId: string) {
    return this.memberRepository.find({
      where: { workspaceId },
      relations: ['user', 'role'],
    });
  }

  async getMemberRole(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceRole | null> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
      relations: ['role'],
    });
    return getWorkspaceRoleFromEntity(member?.role) ?? null;
  }

  async isWorkspaceMember(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { workspaceId, userId },
    });
    return !!member;
  }

  async transferOwnership(
    workspaceId: string,
    newOwnerId: string,
    currentOwnerId: string,
  ) {
    const workspace = await this.findOne(workspaceId);

    if (workspace.ownerId !== currentOwnerId) {
      throw new ForbiddenException('Only owner can transfer ownership');
    }

    workspace.ownerId = newOwnerId;
    await this.workspaceRepository.save(workspace);

    await this.memberRepository.update(
      { workspaceId, userId: currentOwnerId },
      { roleId: getWorkspaceRoleId(WorkspaceRole.ADMIN) },
    );
    await this.memberRepository.update(
      { workspaceId, userId: newOwnerId },
      { roleId: getWorkspaceRoleId(WorkspaceRole.OWNER) },
    );

    return workspace;
  }
}
