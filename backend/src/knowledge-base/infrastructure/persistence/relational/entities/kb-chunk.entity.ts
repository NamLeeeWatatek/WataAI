import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

import { KbProcessingStatus } from '../../../../knowledge-base.enum';

@Entity({ name: 'kb_chunk' })
export class KBChunkEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'document_id', type: 'uuid' })
  @Index()
  documentId: string;

  @Column({ name: 'knowledge_base_id', type: 'uuid' })
  @Index()
  knowledgeBaseId: string;

  @Column({ name: 'chunk_index', type: 'int' })
  chunkIndex: number;

  @Column({ name: 'start_char', type: 'int', nullable: true })
  startChar?: number;

  @Column({ name: 'end_char', type: 'int', nullable: true })
  endChar?: number;

  @Column({ name: 'token_count', type: 'int', nullable: true })
  tokenCount?: number;
  @Column({
    name: 'embedding_status',
    type: String,
    default: KbProcessingStatus.PENDING,
  })
  embeddingStatus: KbProcessingStatus;

  @Column({ name: 'embedding_error', type: String, nullable: true })
  embeddingError?: string | null;

  @Column({ name: 'vector_id', type: String, nullable: true })
  vectorId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;
}
