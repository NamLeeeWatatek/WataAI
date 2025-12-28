import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSeedService } from './user-seed.service';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { RoleEntity } from '../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import {
  WorkspaceEntity,
  WorkspaceMemberEntity,
} from '../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      WorkspaceEntity,
      WorkspaceMemberEntity,
    ]),
  ],
  providers: [UserSeedService],
  exports: [UserSeedService],
})
export class UserSeedModule {}
