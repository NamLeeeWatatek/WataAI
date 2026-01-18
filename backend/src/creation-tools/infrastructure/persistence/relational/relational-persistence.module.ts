import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreationToolEntity } from './entities/creation-tool.entity';
import { CreationToolsRelationalRepository } from './repositories/creation-tool.repository';
import { CreationToolRepository } from '../creation-tool.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CreationToolEntity])],
  providers: [
    {
      provide: CreationToolRepository,
      useClass: CreationToolsRelationalRepository,
    },
  ],
  exports: [CreationToolRepository, TypeOrmModule],
})
export class RelationalCreationToolPersistenceModule {}
