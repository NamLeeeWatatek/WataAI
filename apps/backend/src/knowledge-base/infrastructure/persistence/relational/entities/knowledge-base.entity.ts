import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import {
  KbProcessingStatus,
  KbSourceType,
} from '../../../../knowledge-base.enum';

@Entity({ name: 'knowledge_base' })
export class KnowledgeBaseEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  description?: string | null;

  @Column({ name: 'ai_provider_id', type: 'uuid', nullable: true })
  @Index()
  aiProviderId?: string | null;

  @Column({ name: 'rag_model', type: String, nullable: true })
  ragModel?: string | null;

  @Column({
    name: 'embedding_model',
    type: String,
    default: 'text-embedding-3-small',
  })
  embeddingModel: string;

  @Column({ name: 'chunk_size', type: 'int', default: 1000 })
  chunkSize: number;

  @Column({ name: 'chunk_overlap', type: 'int', default: 200 })
  chunkOverlap: number;

  @Column({ name: 'total_documents', type: 'int', default: 0 })
  totalDocuments: number;

  @Column({ name: 'total_size', type: 'bigint', default: 0 })
  totalSize: number;

  @Column({ name: 'is_active', type: Boolean, default: true })
  isActive: boolean;

  @OneToMany('KbFolderEntity', (folder: any) => folder.knowledgeBase)
  folders?: KbFolderEntity[];

  @OneToMany('KbDocumentEntity', (document: any) => document.knowledgeBase)
  documents?: KbDocumentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}

@Entity({ name: 'kb_folder' })
export class KbFolderEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  @Index()
  knowledgeBaseId: string;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index()
  parentId?: string | null;

  @ManyToOne(() => KnowledgeBaseEntity, (kb) => kb.folders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledge_base_id' })
  knowledgeBase?: KnowledgeBaseEntity;

  @ManyToOne(() => KbFolderEntity, (folder) => folder.children, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: KbFolderEntity | null;

  @OneToMany(() => KbFolderEntity, (folder) => folder.parent)
  children?: KbFolderEntity[];

  @OneToMany(() => KbDocumentEntity, (document) => document.folder)
  documents?: KbDocumentEntity[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}

@Entity({ name: 'kb_document' })
export class KbDocumentEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ type: String, nullable: true })
  title?: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'file_type', type: String, nullable: true })
  fileType?: string | null;

  @Column({ name: 'file_url', type: String, nullable: true })
  fileUrl?: string | null;

  @Column({ name: 'mime_type', type: String, nullable: true })
  mimeType?: string | null;

  @Index()
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ name: 'source_url', type: String, nullable: true })
  sourceUrl?: string | null;

  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  @Index()
  knowledgeBaseId: string;

  @Column({ name: 'folder_id', type: 'uuid', nullable: true })
  @Index()
  folderId?: string | null;

  @Column({
    name: 'processing_status',
    type: String,
    default: KbProcessingStatus.PENDING,
  })
  processingStatus: KbProcessingStatus;

  @Column({ name: 'chunk_count', type: 'int', default: 0 })
  chunkCount: number;

  @Column({ name: 'processing_error', type: String, nullable: true })
  processingError?: string | null;

  @Column({ name: 'file_size', type: String, nullable: true })
  fileSize?: string | null;

  @Column({ type: String, nullable: true })
  type?: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[] | null;

  @Column({
    name: 'source_type',
    type: String,
    default: KbSourceType.MANUAL,
  })
  sourceType: KbSourceType;

  @ManyToOne(() => KnowledgeBaseEntity, (kb) => kb.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledge_base_id' })
  knowledgeBase?: KnowledgeBaseEntity;

  @ManyToOne(() => KbFolderEntity, (folder) => folder.documents, {
    nullable: true,
  })
  @JoinColumn({ name: 'folder_id' })
  folder?: KbFolderEntity | null;

  @OneToMany(() => KbDocumentVersionEntity, (version) => version.document)
  versions?: KbDocumentVersionEntity[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}

// Alias for backward compatibility
export const KnowledgeBaseDocumentEntity = KbDocumentEntity;

@Entity({ name: 'kb_document_version' })
export class KbDocumentVersionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Index()
  documentId: string;

  @Column({ type: 'int' })
  version: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => KbDocumentEntity, (document) => document.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'document_id' })
  document?: KbDocumentEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}

@Entity({ name: 'rag_feedback' })
export class RagFeedbackEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  @Index()
  knowledgeBaseId: string;

  @Column({ name: 'document_id', type: 'uuid', nullable: true })
  @Index()
  documentId?: string | null;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'jsonb' })
  sources: any[];

  @Column({ type: 'int', nullable: true })
  rating?: number | null;

  @Column({ type: String, nullable: true })
  feedback?: string | null;

  @Column({ name: 'is_helpful', type: Boolean, nullable: true })
  isHelpful?: boolean | null;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}
