import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TemplatesSeedService } from './templates-seed.service';
import { TemplateEntity } from '../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/relational/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TemplateEntity, CategoryEntity]),
  ],
  providers: [
    TemplatesSeedService,
  ],
  exports: [TemplatesSeedService],
})
export class TemplatesSeedModule { }
