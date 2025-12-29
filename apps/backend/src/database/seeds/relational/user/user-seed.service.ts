import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { RoleEnum } from '../../../../roles/roles.enum';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from '../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Injectable()
export class UserSeedService {
  constructor(
    @InjectRepository(UserEntity)
    private repository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private roleRepository: Repository<RoleEntity>,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private workspaceMemberRepository: Repository<WorkspaceMemberEntity>,
  ) {}

  async run() {
    // Delete legacy/default admins if they exist
    try {
      const usersToDelete = ['admin@example.com', 'admin2@example.com'];
      for (const email of usersToDelete) {
        const user = await this.repository.findOne({ where: { email } });
        if (user) {
          // Delete workspace memberships first
          await this.workspaceMemberRepository.delete({ userId: user.id });
          // Delete workspaces owned by user
          await this.workspaceRepository.delete({ ownerId: user.id });
          // Delete user
          await this.repository.delete({ id: user.id });
        }
      }
    } catch (error) {
      console.error('Error cleaning up old admins:', error);
    }

    const users = [
      // Admin users
      {
        name: 'Wata Admin',
        email: 'wataai@gmail.com',
        role: 'admin' as const,
        isActive: true,
        password: 'secret2026@wata',
      },
      // Regular users with different roles
      {
        name: 'John Smith',
        email: 'john.smith@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Emily Johnson',
        email: 'emily.johnson@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Sarah Davis',
        email: 'sarah.davis@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'David Wilson',
        email: 'david.wilson@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa.anderson@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'James Taylor',
        email: 'james.taylor@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Robert Martinez',
        email: 'robert.martinez@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Jennifer Lee',
        email: 'jennifer.lee@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'William White',
        email: 'william.white@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Linda Harris',
        email: 'linda.harris@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Richard Clark',
        email: 'richard.clark@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Patricia Lewis',
        email: 'patricia.lewis@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Charles Walker',
        email: 'charles.walker@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Barbara Hall',
        email: 'barbara.hall@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Joseph Allen',
        email: 'joseph.allen@example.com',
        role: 'user' as const,
        isActive: true,
      },
      {
        name: 'Susan Young',
        email: 'susan.young@example.com',
        role: 'user' as const,
        isActive: true,
      },

      // Some inactive users for testing
      {
        name: 'Thomas King',
        email: 'thomas.king@example.com',
        role: 'user' as const,
        isActive: false,
      },
      {
        name: 'Jessica Wright',
        email: 'jessica.wright@example.com',
        role: 'user' as const,
        isActive: false,
      },
    ];

    const salt = await bcrypt.genSalt();
    const defaultPassword = await bcrypt.hash('secret', salt);

    const daysAgo = 365; // Spread user creation over the last year
    const now = new Date();

    for (let i = 0; i < users.length; i++) {
      const userData = users[i];

      const userPassword = (userData as any).password
        ? await bcrypt.hash((userData as any).password, salt)
        : defaultPassword;

      const existingUser = await this.repository.findOne({
        where: { email: userData.email },
      });
      if (existingUser) {
        // If user exists, ensure they have a workspace
        const hasWorkspace = await this.workspaceRepository.findOne({
          where: { ownerId: existingUser.id },
        });
        if (!hasWorkspace) {
          const workspace = this.workspaceRepository.create({
            name: `${userData.name}'s Workspace`,
            slug:
              userData.email
                .split('@')[0]
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '-') +
              '-' +
              existingUser.id.substring(0, 4),
            ownerId: existingUser.id,
          });
          const savedWorkspace = await this.workspaceRepository.save(workspace);
          await this.workspaceMemberRepository.save({
            workspaceId: savedWorkspace.id,
            userId: existingUser.id,
            roleId: RoleEnum.owner,
          });
        }

        // Update password and info
        existingUser.password = userPassword;
        existingUser.provider = 'email';
        // Ensure role is correct
        const roleId =
          userData.role === 'admin' ? RoleEnum.admin : RoleEnum.user;
        const role = await this.roleRepository.findOne({
          where: { id: roleId },
        });
        if (role) {
          existingUser.role = role;
        }
        await this.repository.save(existingUser);

        continue;
      }

      const daysOffset = Math.floor(Math.random() * daysAgo);
      const hoursOffset = Math.floor(Math.random() * 24);

      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysOffset);
      createdAt.setHours(createdAt.getHours() - hoursOffset);

      // Get role entity
      const roleId = userData.role === 'admin' ? RoleEnum.admin : RoleEnum.user;
      const role = await this.roleRepository.findOne({ where: { id: roleId } });

      if (!role) {
        throw new Error(`Role with id ${roleId} not found`);
      }

      const user = this.repository.create({
        name: userData.name,
        email: userData.email,
        isActive: userData.isActive,
        password: userPassword,
        role: role,
        provider: 'email',
        createdAt,
        updatedAt: new Date(),
      });

      const savedUser = await this.repository.save(user);

      // Create a default workspace for each user
      const workspace = this.workspaceRepository.create({
        name: `${userData.name}'s Workspace`,
        slug: userData.email
          .split('@')[0]
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-'),
        ownerId: savedUser.id,
        createdAt: createdAt,
        updatedAt: new Date(),
      });

      const savedWorkspace = await this.workspaceRepository.save(workspace);

      // Add user as admin member of their own workspace
      const membership = this.workspaceMemberRepository.create({
        workspaceId: savedWorkspace.id,
        userId: savedUser.id,
        roleId: RoleEnum.owner, // Owner is owner
        joinedAt: createdAt,
      });

      await this.workspaceMemberRepository.save(membership);
    }

    console.log('✅ Users and Workspaces seeded successfully');
  }
}
