import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleEntity } from '../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { PermissionEntity } from '../../../../permissions/infrastructure/persistence/relational/entities/permission.entity';
import { RoleEnum } from '../../../../roles/roles.enum';

@Injectable()
export class RoleSeedService {
  constructor(
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(PermissionEntity)
    private permissionRepository: Repository<PermissionEntity>,
  ) {}

  async run() {
    const allPermissions = await this.permissionRepository.find();

    const adminPermissions = allPermissions;

    const systemResources = ['system', 'iam', 'workspace'];
    const ownerPermissions = allPermissions.filter((p) => {
      // Owner has full access to workspace resources but restricted system/iam access
      if (
        systemResources.includes(p.resource) &&
        !['Get', 'List', 'Update', 'Invite'].includes(p.action)
      ) {
        return false;
      }
      if (p.name === '*') return false;
      return true;
    });

    const userActions = ['List', 'Get', 'Execute', 'Chat', 'Usage'];
    const memberPermissions = allPermissions.filter((p) => {
      const systemResources = ['system', 'iam', 'workspace'];
      if (systemResources.includes(p.resource)) return false;

      // Members can use tools and chat, and manage THEIR OWN jobs (standard CREATE for jobs)
      if (userActions.includes(p.action)) return true;
      if (p.resource === 'job' && p.action === 'Create') return true;
      if (p.resource === 'conversation' && p.action === 'Create') return true;
      if (p.resource === 'file' && p.action === 'Upload') return true;
      return false;
    });

    const managerPermissions = allPermissions.filter((p) => {
      const systemResources = ['system', 'iam', 'workspace'];
      if (systemResources.includes(p.resource)) {
        // Managers can manage users/invitations in their workspace
        return [
          'Get',
          'List',
          'Invite',
          'AddMember',
          'RemoveMember',
          'UpdateMember',
          'ListMembers',
        ].includes(p.action);
      }
      return true; // Full access to workspace resources
    });

    const viewerPermissions = allPermissions.filter((p) => {
      return ['List', 'Get', 'Chat'].includes(p.action);
    });

    const roles = [
      {
        id: RoleEnum.admin,
        name: 'Admin',
        description: 'System Administrator with full access to everything',
        permissions: adminPermissions,
      },
      {
        id: RoleEnum.user,
        name: 'User',
        description: 'Global system user',
        permissions: memberPermissions,
      },
      {
        id: RoleEnum.member,
        name: 'Member',
        description: 'Workspace member who can use tools and chat',
        permissions: memberPermissions,
      },
      {
        id: RoleEnum.owner,
        name: 'Owner',
        description: 'Workspace owner with full control',
        permissions: ownerPermissions,
      },
      {
        id: RoleEnum.viewer,
        name: 'Viewer',
        description: 'Read-only workspace member',
        permissions: viewerPermissions,
      },
      {
        id: RoleEnum.manager,
        name: 'Manager',
        description: 'Workspace administrator with management capabilities',
        permissions: managerPermissions,
      },
    ];

    for (const roleData of roles) {
      let role = await this.roleRepository.findOne({
        where: { id: roleData.id },
        relations: ['permissions'],
      });

      if (!role) {
        role = this.roleRepository.create(roleData);
      } else {
        role.name = roleData.name;
        role.description = roleData.description;
        role.permissions = roleData.permissions;
      }
      await this.roleRepository.save(role);
    }
  }
}
