import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotsModule } from '../bots/bots.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { FilesModule } from '../files/files.module';
import { AuditModule } from '../audit/audit.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { ConfigModule } from '@nestjs/config';
import kbConfig from './config/kb.config';

import { BullModule } from '@nestjs/bullmq';

import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseDocumentsController } from './knowledge-base-documents.controller';
import { KnowledgeBaseFoldersController } from './knowledge-base-folders.controller';
import { KnowledgeBaseQueryController } from './knowledge-base-query.controller';
import { KnowledgeBaseProcessingController } from './knowledge-base-processing.controller';
import { KnowledgeBaseSyncController } from './knowledge-base-sync.controller';
import { KnowledgeBaseGateway } from './knowledge-base.gateway';

import { KBManagementService } from './services/kb-management.service';
import { KBDocumentsService } from './services/kb-documents.service';
import { KBFoldersService } from './services/kb-folders.service';
import { KBEmbeddingsService } from './services/kb-embeddings.service';
import { KBVectorService } from './services/kb-vector.service';
import { KBRagService } from './services/kb-rag.service';
import { KBProcessingQueueService } from './services/kb-processing-queue.service';
import { KBSyncService } from './services/kb-sync.service';
import { KBCrawlerService } from './services/kb-crawler.service';
import { KBProcessor } from './services/kb-processor.service';
import { KBTextExtractorService } from './services/kb-text-extractor.service';

import {
  BotEntity,
  BotKnowledgeBaseEntity,
} from '../bots/infrastructure/persistence/relational/entities/bot.entity';
import {
  KbDocumentEntity,
  KbDocumentVersionEntity,
  KbFolderEntity,
  KnowledgeBaseEntity,
  RagFeedbackEntity,
} from './infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KBChunkEntity } from './infrastructure/persistence/relational/entities/kb-chunk.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KnowledgeBaseEntity,
      KbFolderEntity,
      KbDocumentEntity,
      KbDocumentVersionEntity,
      RagFeedbackEntity,
      KBChunkEntity,
      BotEntity,
      BotKnowledgeBaseEntity,
    ]),
    BullModule.registerQueue({
      name: 'kb-processing',
    }),
    forwardRef(() => BotsModule),
    AiProvidersModule,
    FilesModule,
    AuditModule,
    forwardRef(() => WorkspacesModule),
    PermissionsModule,
    ConfigModule.forFeature(kbConfig),
  ],
  controllers: [
    KnowledgeBaseController,
    KnowledgeBaseDocumentsController,
    KnowledgeBaseFoldersController,
    KnowledgeBaseQueryController,
    KnowledgeBaseProcessingController,
    KnowledgeBaseSyncController,
  ],
  providers: [
    // Services
    KBManagementService,
    KBDocumentsService,
    KBFoldersService,
    KBEmbeddingsService,
    KBVectorService,
    KBRagService,
    KBProcessingQueueService,
    KBSyncService,
    KBCrawlerService,
    KBProcessor,
    KBTextExtractorService,
    KnowledgeBaseGateway,
  ],
  exports: [
    KBManagementService,
    KBDocumentsService,
    KBRagService,
    KBProcessingQueueService,
  ],
})
export class KnowledgeBaseModule {}
