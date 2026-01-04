import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../users/domain/user';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { PermissionEntity } from './infrastructure/persistence/relational/entities/permission.entity';
import { UserCapabilitiesDto } from './dto/user-capabilities.dto';
import { PermissionCheckResponseDto } from './dto/permission-check.dto';
import { WorkspaceMemberEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { RoleEnum } from '../roles/roles.enum';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepository: Repository<PermissionEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
  ) { }

  async findAll(search?: string) {
    let where: any = {};
    if (search) {
      where = [
        { resource: Like(`%${search}%`) },
        { action: Like(`%${search}%`) },
        { description: Like(`%${search}%`) },
      ];
    }

    return this.permissionRepository.find({
      where,
      order: {
        resource: 'ASC',
        action: 'ASC',
      },
    });
  }

  async create(dto: any) {
    const permission = this.permissionRepository.create(dto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: string) {
    await this.permissionRepository.delete(id);
  }

  async getUserCapabilities(
    user: User,
    workspaceId?: string,
  ): Promise<UserCapabilitiesDto> {
    const userWithPermissions = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['role', 'role.permissions'],
    });

    if (!userWithPermissions) {
      throw new Error('User not found');
    }

    // Level 1: System Admin Check
    // If the user has a System Global Role of 'Admin' (ID 1), they have full access everywhere.
    const systemRole = userWithPermissions.role;
    const systemPermissions =
      systemRole?.permissions?.map((p) => `${p.resource}:${p.action}`) || [];

    // Strict ID check for System Admin using RoleEnum
    const isSystemAdmin =
      systemRole?.id === RoleEnum.admin || systemPermissions.includes('*');

    let appliedRole = systemRole;
    let appliedRoleId = systemRole?.id;

    // Level 2: Workspace Role Check (Per-Tenant)
    // If not System Admin, and we have a workspace context, we fetch the per-tenant role.
    if (!isSystemAdmin && workspaceId) {
      const member = await this.workspaceMemberRepository.findOne({
        where: { userId: user.id, workspaceId },
        relations: ['role', 'role.permissions'],
      });

      if (member && member.role) {
        appliedRole = member.role;
        appliedRoleId = member.role.id;
      } else {
        // If user is not a member of the workspace, or has no role??
        // Fallback to basic user, effectively no access.
      }
    }

    const rolePermissions =
      appliedRole?.permissions?.map((p) => `${p.resource}:${p.action}`) || [];

    // Merge System Permissions (Global) + Workspace Role Permissions (Local)
    const allPermissions = Array.from(
      new Set([...systemPermissions, ...rolePermissions]),
    );

    // isAdmin flag usually implies "Bypass all checks".
    // We only want System Admin (Super Admin) to bypass everything.
    const isAdmin = isSystemAdmin;

    // For UI widgets, we might want to know if they are AT LEAST a workspace admin
    // Workspace Owner (4) or Workspace Admin/Manager (6) or System Admin (1)
    const isWorkspaceAdmin =
      appliedRoleId === RoleEnum.admin ||
      appliedRoleId === RoleEnum.owner ||
      appliedRoleId === RoleEnum.manager;

    const check = (action: string) => {
      if (isAdmin) return true;
      if (allPermissions.includes('*')) return true;
      if (allPermissions.includes(action)) return true;

      const [service] = action.split(':');
      if (allPermissions.includes(`${service}:*`)) return true;

      return false;
    };

    const can_create: Record<string, boolean> = {
      user: check('iam:Create'),
      role: check('iam:CreateRole'),
      flow: check('flow:Create'),
      template: check('template:Create'),
      bot: check('bot:Create'),
      channel: check('channel:Create'),
      integration: check('integration:Create'),
      workspace: check('workspace:Create'),
      file: check('file:Upload'),
      job: check('job:Create'),
    };

    const can_read: Record<string, boolean> = {
      user: check('iam:ListUsers') || check('iam:Get'),
      role: check('iam:ListRoles') || check('iam:GetRole'),
      flow: check('flow:List') || check('flow:Get'),
      template: check('template:List') || check('template:Get'),
      bot: check('bot:List') || check('bot:Get'),
      channel: check('channel:List'),
      integration: check('integration:List'),
      workspace: check('workspace:List'),
      file: check('file:List'),
      settings: check('system:ReadSettings'),
      audit: check('system:ReadAuditLogs'),
      job: check('job:List') || check('job:Get'),
    };

    const can_update: Record<string, boolean> = {
      user: check('iam:Update'),
      role: check('iam:UpdateRole'),
      flow: check('flow:Update'),
      template: check('template:Update'),
      bot: check('bot:Update'),
      channel: check('channel:Update'),
      integration: check('integration:Update'),
      workspace: check('workspace:Update'),
      settings: check('system:UpdateSettings'),
      job: check('job:Update'),
    };

    const can_delete: Record<string, boolean> = {
      user: check('iam:Delete'),
      role: check('iam:DeleteRole'),
      flow: check('flow:Delete'),
      template: check('template:Delete'),
      bot: check('bot:Delete'),
      channel: check('channel:Delete'),
      integration: check('integration:Delete'),
      workspace: check('workspace:Delete'),
      file: check('file:Delete'),
      job: check('job:Delete'),
    };

    return {
      role: appliedRole?.name?.toLowerCase() || 'user', // Display name only
      permissions: allPermissions,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_execute: {
        flow: check('flow:Execute'),
      },
      widgets: {
        user_management: check('iam:ListUsers'),
        flow_builder: check('flow:Create') || check('flow:Update'),
        template_editor: check('template:Create') || check('template:Update'),
        bot_manager: check('bot:List'),
        channel_manager: check('channel:List'),
        integration_manager: check('integration:List'),
        analytics_dashboard: true, // Placeholder
        settings_panel: check('system:ReadSettings'),
        metadata_editor: isAdmin,
        flow_viewer: check('flow:List'),
        template_viewer: check('template:List'),
        bot_viewer: check('bot:List'),
        channel_viewer: check('channel:List'),
        analytics_viewer: true,
      },
      features: {
        can_export_analytics: isAdmin,
        can_manage_users: check('iam:ListUsers'),
        can_delete_flows: check('flow:Delete'),
        can_delete_templates: check('template:Delete'),
        can_delete_bots: check('bot:Delete'),
        can_manage_integrations: check('integration:List'),
        can_update_settings: check('system:UpdateSettings'),
        is_admin: isWorkspaceAdmin || isSystemAdmin,
        is_super_admin: isSystemAdmin,
      },
    };
  }

  async checkPermissions(
    user: User,
    requiredPermissions: string[],
    workspaceId?: string,
  ): Promise<PermissionCheckResponseDto> {
    const capabilities = await this.getUserCapabilities(user, workspaceId);
    const userPermissions = new Set(capabilities.permissions);

    if (capabilities.features.is_admin) {
      return {
        hasPermission: true,
        missingPermissions: [],
      };
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !userPermissions.has(perm),
    );

    return {
      hasPermission: missingPermissions.length === 0,
      missingPermissions,
    };
  }
}
