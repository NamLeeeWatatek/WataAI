import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { RoleSeedService } from './role/role-seed.service';
// import { StatusSeedService } from './status/status-seed.service';
import { UserSeedService } from './user/user-seed.service';
import { PermissionSeedService } from './permission/permission-seed.service';
// import { NodeTypeSeedService } from './node-type/node-type-seed.service';
// import { FlowSeedService } from './flow/flow-seed.service';
import { AiProviderSeedService } from './ai-provider/ai-provider-seed.service';
import { BotSeedService } from './bot/bot-seed.service';
import { ConversationSeedService } from './conversation/conversation-seed.service';
import { TemplatesSeedService } from './templates/templates-seed.service';
import { CreationToolsSeederService } from './creation-tools/creation-tools-seed.service';
import { CategoriesSeedService } from './categories/categories-seed.service';
import { PlanSeedService } from './plan/plan-seed.service';
import { SeedModule } from './seed.module';

const runSeed = async () => {
  const app = await NestFactory.create(SeedModule);

  // Seed AI providers first
  await app.get(AiProviderSeedService).run();

  await app.get(PermissionSeedService).run();

  await app.get(RoleSeedService).run();

  // await app.get(StatusSeedService).run();

  // await app.get(NodeTypeSeedService).run();

  await app.get(UserSeedService).run();

  await app.get(BotSeedService).run();

  await app.get(ConversationSeedService).run();

  // await app.get(FlowSeedService).run();

  // Seed Creation Tools before Templates (templates reference creation tools)
  await app.get(CategoriesSeedService).run();
  await app.get(CreationToolsSeederService).run();

  await app.get(TemplatesSeedService).run();

  await app.get(PlanSeedService).run();

  await app.close();
};

void runSeed();
