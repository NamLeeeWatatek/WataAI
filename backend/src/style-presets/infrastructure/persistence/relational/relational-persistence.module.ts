import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StylePresetEntity } from './entities/style-preset.entity';
import { StylePresetRepository } from '../style-preset.repository';
import { StylePresetRelationalRepository } from './repositories/style-preset.repository';

@Module({
  imports: [TypeOrmModule.forFeature([StylePresetEntity])],
  providers: [
    {
      provide: StylePresetRepository,
      useClass: StylePresetRelationalRepository,
    },
  ],
  exports: [StylePresetRepository],
})
export class RelationalStylePresetPersistenceModule {}
