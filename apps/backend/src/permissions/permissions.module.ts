import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../roles/infrastructure/persistence/relational/entities/role.entity';
import { PermissionEntity } from './infrastructure/persistence/relational/entities/permission.entity';
import { WorkspaceMemberEntity } from '../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      PermissionEntity,
      WorkspaceMemberEntity,
    ]),
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsGuard],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
