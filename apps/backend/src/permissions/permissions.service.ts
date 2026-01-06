import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { User } from '../users/domain/user';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { PermissionEntity } from './infrastructure/persistence/relational/entities/permission.entity';
import { PermissionConstants } from './permissions.constants';
import { UserCapabilitiesDto } from './dto/user-capabilities.dto';
import { PermissionCheckResponseDto } from './dto/permission-check.dto';
import { CreatePermissionDto } from './dto/create-permission.dto';
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
  ) {}

  async findAll(search?: string) {
    let where:
      | FindOptionsWhere<PermissionEntity>
      | FindOptionsWhere<PermissionEntity>[] = {};
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

  async create(dto: CreatePermissionDto) {
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
      throw new NotFoundException('User not found');
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

    const mapPermissions = (resourceActions: Record<string, string>) => {
      return Object.entries(resourceActions).reduce(
        (acc, [key, action]) => {
          acc[key] = check(action);
          return acc;
        },
        {} as Record<string, boolean>,
      );
    };

    const can_create = mapPermissions({
      user: PermissionConstants.IAM.CREATE,
      role: PermissionConstants.IAM.CREATE_ROLE,
      flow: PermissionConstants.FLOW.CREATE,
      template: PermissionConstants.TEMPLATE.CREATE,
      bot: PermissionConstants.BOT.CREATE,
      channel: PermissionConstants.CHANNEL.CREATE,
      integration: PermissionConstants.INTEGRATION.CREATE,
      workspace: PermissionConstants.WORKSPACE.CREATE,
      file: PermissionConstants.FILE.UPLOAD,
      job: PermissionConstants.JOB.CREATE,
    });

    const can_read = {
      ...mapPermissions({
        channel: PermissionConstants.CHANNEL.LIST,
        integration: PermissionConstants.INTEGRATION.LIST,
        workspace: PermissionConstants.WORKSPACE.LIST,
        file: PermissionConstants.FILE.LIST,
        settings: PermissionConstants.SYSTEM.READ_SETTINGS,
        audit: PermissionConstants.SYSTEM.READ_AUDIT_LOGS,
      }),
      user:
        check(PermissionConstants.IAM.LIST_USERS) ||
        check(PermissionConstants.IAM.GET),
      role:
        check(PermissionConstants.IAM.LIST_ROLES) ||
        check(PermissionConstants.IAM.GET_ROLE),
      flow:
        check(PermissionConstants.FLOW.LIST) ||
        check(PermissionConstants.FLOW.GET),
      template:
        check(PermissionConstants.TEMPLATE.LIST) ||
        check(PermissionConstants.TEMPLATE.GET),
      bot:
        check(PermissionConstants.BOT.LIST) ||
        check(PermissionConstants.BOT.GET),
      job:
        check(PermissionConstants.JOB.LIST) ||
        check(PermissionConstants.JOB.GET),
    };

    const can_update = mapPermissions({
      user: PermissionConstants.IAM.UPDATE,
      role: PermissionConstants.IAM.UPDATE_ROLE,
      flow: PermissionConstants.FLOW.UPDATE,
      template: PermissionConstants.TEMPLATE.UPDATE,
      bot: PermissionConstants.BOT.UPDATE,
      channel: PermissionConstants.CHANNEL.UPDATE,
      integration: PermissionConstants.INTEGRATION.UPDATE,
      workspace: PermissionConstants.WORKSPACE.UPDATE,
      settings: PermissionConstants.SYSTEM.UPDATE_SETTINGS,
      job: PermissionConstants.JOB.UPDATE,
    });

    const can_delete = mapPermissions({
      user: PermissionConstants.IAM.DELETE,
      role: PermissionConstants.IAM.DELETE_ROLE,
      flow: PermissionConstants.FLOW.DELETE,
      template: PermissionConstants.TEMPLATE.DELETE,
      bot: PermissionConstants.BOT.DELETE,
      channel: PermissionConstants.CHANNEL.DELETE,
      integration: PermissionConstants.INTEGRATION.DELETE,
      workspace: PermissionConstants.WORKSPACE.DELETE,
      file: PermissionConstants.FILE.DELETE,
      job: PermissionConstants.JOB.DELETE,
    });

    return {
      role: appliedRole?.name?.toLowerCase() || 'user', // Display name only
      permissions: allPermissions,
      can_create,
      can_read,
      can_update,
      can_delete,
      can_execute: {
        flow: check(PermissionConstants.FLOW.EXECUTE),
      },
      widgets: {
        user_management: check(PermissionConstants.IAM.LIST_USERS),
        flow_builder:
          check(PermissionConstants.FLOW.CREATE) ||
          check(PermissionConstants.FLOW.UPDATE),
        template_editor:
          check(PermissionConstants.TEMPLATE.CREATE) ||
          check(PermissionConstants.TEMPLATE.UPDATE),
        bot_manager: check(PermissionConstants.BOT.LIST),
        channel_manager: check(PermissionConstants.CHANNEL.LIST),
        integration_manager: check(PermissionConstants.INTEGRATION.LIST),
        analytics_dashboard: check(PermissionConstants.ANALYTICS.READ),
        settings_panel: check(PermissionConstants.SYSTEM.READ_SETTINGS),
        metadata_editor: isAdmin,
        flow_viewer: check(PermissionConstants.FLOW.LIST),
        template_viewer: check(PermissionConstants.TEMPLATE.LIST),
        bot_viewer: check(PermissionConstants.BOT.LIST),
        channel_viewer: check(PermissionConstants.CHANNEL.LIST),
        analytics_viewer: check(PermissionConstants.ANALYTICS.READ),
      },
      features: {
        can_export_analytics: check(PermissionConstants.ANALYTICS.EXPORT),
        can_manage_users: check(PermissionConstants.IAM.LIST_USERS),
        can_delete_flows: check(PermissionConstants.FLOW.DELETE),
        can_delete_templates: check(PermissionConstants.TEMPLATE.DELETE),
        can_delete_bots: check(PermissionConstants.BOT.DELETE),
        can_manage_integrations: check(PermissionConstants.INTEGRATION.LIST),
        can_update_settings: check(PermissionConstants.SYSTEM.UPDATE_SETTINGS),
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
