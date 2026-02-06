import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { RelationalAssetPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [RelationalAssetPersistenceModule, WorkspacesModule],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService, RelationalAssetPersistenceModule],
})
export class AssetsModule { }
