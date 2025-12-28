import { Module } from '@nestjs/common';
import { CreationToolsService } from './creation-tools.service';
import { CreationToolsController } from './creation-tools.controller';
import { RelationalCreationToolPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { TemplatesModule } from '../templates/templates.module';
import { FilesModule } from '../files/files.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    RelationalCreationToolPersistenceModule,
    TemplatesModule,
    FilesModule,
    forwardRef(() => WorkspacesModule),
    PermissionsModule,
  ],
  controllers: [CreationToolsController],
  providers: [CreationToolsService],
  exports: [CreationToolsService, RelationalCreationToolPersistenceModule],
})
export class CreationToolsModule { }
