import { Module } from '@nestjs/common';
import { AssetRepository } from '../asset.repository';
import { AssetsRelationalRepository } from './repositories/asset.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './entities/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity])],
  providers: [
    {
      provide: AssetRepository,
      useClass: AssetsRelationalRepository,
    },
  ],
  exports: [AssetRepository],
})
export class RelationalAssetPersistenceModule {}
