import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfigService } from '../../typeorm-config.service';
import { RoleSeedModule } from './role/role-seed.module';

import { UserSeedModule } from './user/user-seed.module';
import { PermissionSeedModule } from './permission/permission-seed.module';
// import { NodeTypeSeedModule } from './node-type/node-type-seed.module';
// import { FlowSeedModule } from './flow/flow-seed.module';
import { AiProviderSeedModule } from './ai-provider/ai-provider-seed.module';
import { BotSeedModule } from './bot/bot-seed.module';
import { ConversationSeedModule } from './conversation/conversation-seed.module';
import { TemplatesSeedModule } from './templates/templates-seed.module';
import { CreationToolsSeedModule } from './creation-tools/creation-tools-seed.module';
import { CategoriesSeedModule } from './categories/categories-seed.module';
import { PlanSeedModule } from './plan/plan-seed.module';
import databaseConfig from '../../config/database.config';
import appConfig from '../../../config/app.config';

@Module({
  imports: [
    PermissionSeedModule,
    RoleSeedModule,

    UserSeedModule,
    BotSeedModule,
    ConversationSeedModule,
    AiProviderSeedModule,
    TemplatesSeedModule,
    CreationToolsSeedModule,
    CategoriesSeedModule,
    PlanSeedModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options: DataSourceOptions) => {
        return new DataSource(options).initialize();
      },
    }),
  ],
})
export class SeedModule {}
