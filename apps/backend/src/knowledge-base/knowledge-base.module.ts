import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotsModule } from '../bots/bots.module';
import { AiProvidersModule } from '../ai-providers/ai-providers.module';
import { FilesModule } from '../files/files.module';
import { AuditModule } from '../audit/audit.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PermissionsModule } from '../permissions/permissions.module';

import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseDocumentsController } from './knowledge-base-documents.controller';
import { KnowledgeBaseFoldersController } from './knowledge-base-folders.controller';
import { KnowledgeBaseQueryController } from './knowledge-base-query.controller';
import { KnowledgeBaseProcessingController } from './knowledge-base-processing.controller';
import { KnowledgeBaseSyncController } from './knowledge-base-sync.controller';

import { KBManagementService } from './services/kb-management.service';
import { KBDocumentsService } from './services/kb-documents.service';
import { KBFoldersService } from './services/kb-folders.service';
import { KBEmbeddingsService } from './services/kb-embeddings.service';
import { KBVectorService } from './services/kb-vector.service';
import { KBRagService } from './services/kb-rag.service';
import { KBProcessingQueueService } from './services/kb-processing-queue.service';
import { KBSyncService } from './services/kb-sync.service';
import { KBCrawlerService } from './services/kb-crawler.service';

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
    forwardRef(() => BotsModule),
    AiProvidersModule,
    FilesModule,
    AuditModule,
    forwardRef(() => WorkspacesModule),
    PermissionsModule,
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
  ],
  exports: [
    KBManagementService,
    KBDocumentsService,
    KBRagService,
    KBProcessingQueueService,
  ],
})
export class KnowledgeBaseModule {}
