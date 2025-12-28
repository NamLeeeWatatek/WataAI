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
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { WorkspaceOwnedEntity } from '../../../../../utils/workspace-owned.entity';
import { BotEntity } from '../../../../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { WorkspaceEntity } from '../../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';
import { ContactEntity } from './contact.entity';
import {
  ConversationStatus,
  ConversationSource,
  ConversationType,
  MessageRole,
  MessageFeedback,
} from '../../../../conversations.enum';

@Entity({ name: 'conversation' })
export class ConversationEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

  @Column({ name: 'channel_type', type: String, default: 'web' })
  channelType: string;

  @Column({ name: 'channel_id', type: 'uuid', nullable: true })
  @Index()
  channelId?: string | null;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  @Index()
  contactId?: string | null;

  @ManyToOne(() => ContactEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'contact_id' })
  contact?: ContactEntity;

  @Index()
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: String, default: ConversationStatus.ACTIVE })
  @Index()
  status: ConversationStatus;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  @Index()
  lastMessageAt?: Date | null;

  @Column({ name: 'handover_ticket_id', type: 'uuid', nullable: true })
  handoverTicketId?: string | null;

  @Column({ name: 'external_id', type: String, nullable: true })
  @Index()
  externalId?: string | null;

  @Column({ name: 'source', type: String, default: ConversationSource.WEB })
  @Index()
  source: ConversationSource;

  @Column({ name: 'type', type: String, default: ConversationType.SUPPORT })
  @Index()
  type: ConversationType;

  @ManyToOne(() => BotEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages?: MessageEntity[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity({ name: 'message' })
export class MessageEntity extends WorkspaceOwnedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  @Index()
  conversationId: string;

  @Column({ type: String, default: MessageRole.USER })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    type: string;
    url: string;
    name?: string;
    size?: number;
  }> | null;

  @Index()
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  sources?: Array<{
    documentId: string;
    title: string;
    content: string;
    score: number;
  }> | null;

  @Column({ name: 'tool_calls', type: 'jsonb', nullable: true })
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, any>;
    result?: any;
  }> | null;

  @Column({ type: String, nullable: true })
  feedback?: MessageFeedback | null;

  @Column({ name: 'feedback_comment', type: 'text', nullable: true })
  feedbackComment?: string | null;

  @Column({ type: String, nullable: true })
  sender?: string | null;

  @ManyToOne(
    () => ConversationEntity,
    (conversation) => conversation.messages,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation?: ConversationEntity;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;
}

@Entity({ name: 'message_feedback' })
export class MessageFeedbackEntity extends EntityRelationalHelper {
  @Column({ name: 'message_id', type: 'uuid', primary: true })
  messageId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string | null;

  @ManyToOne(() => MessageEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message?: MessageEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
