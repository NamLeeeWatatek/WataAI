import { Module } from '@nestjs/common';
import { TemplateRepository } from '../template.repository';
import { TemplatesRelationalRepository } from './repositories/template.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateEntity } from './entities/template.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity])],
  providers: [
    {
      provide: TemplateRepository,
      useClass: TemplatesRelationalRepository,
    },
  ],
  exports: [TemplateRepository],
})
export class RelationalTemplatePersistenceModule {}
