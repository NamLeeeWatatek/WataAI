import { Module } from '@nestjs/common';
import { StylePresetsController } from './style-presets.controller';
import { StylePresetsService } from './style-presets.service';
import { RelationalStylePresetPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalStylePresetPersistenceModule],
  controllers: [StylePresetsController],
  providers: [StylePresetsService],
  exports: [StylePresetsService, RelationalStylePresetPersistenceModule],
})
export class StylePresetsModule {}
