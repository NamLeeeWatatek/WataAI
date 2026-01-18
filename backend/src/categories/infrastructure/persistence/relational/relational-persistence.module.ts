import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryEntity } from './entities/category.entity';
import { CategoryRelationalRepository } from './repositories/category.repository';
import { CategoryRepository } from '../category.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  providers: [
    {
      provide: CategoryRepository,
      useClass: CategoryRelationalRepository,
    },
  ],
  exports: [CategoryRepository],
})
export class RelationalCategoryPersistenceModule {}
