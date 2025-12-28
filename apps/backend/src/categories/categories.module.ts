import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { RelationalCategoryPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { FilesModule } from '../files/files.module';

@Module({
  imports: [RelationalCategoryPersistenceModule, FilesModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService, RelationalCategoryPersistenceModule],
})
export class CategoriesModule {}
