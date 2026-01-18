import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { RelationalProjectPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalProjectPersistenceModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, RelationalProjectPersistenceModule],
})
export class ProjectsModule {}
