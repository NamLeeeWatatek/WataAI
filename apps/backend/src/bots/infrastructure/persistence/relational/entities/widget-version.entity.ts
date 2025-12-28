import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BotEntity } from './bot.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';

@Entity({ name: 'widget_version' })
@Index(['botId', 'version'], { unique: true })
@Index(['botId', 'isActive'], { where: 'is_active = true' })
export class WidgetVersionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bot_id', type: 'uuid' })
  @Index()
  botId: string;

  @Column({ type: 'varchar', length: 20 })
  version: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: 'draft' | 'published' | 'archived';

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'jsonb' })
  config: {
    theme: {
      primaryColor: string;
      backgroundColor?: string;
      botMessageColor?: string;
      botMessageTextColor?: string;
      fontFamily?: string;
      position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
      buttonSize: 'small' | 'medium' | 'large';
      showAvatar: boolean;
      showTimestamp: boolean;
    };
    behavior: {
      autoOpen: boolean;
      autoOpenDelay: number;
      greetingDelay: number;
    };
    messages: {
      welcome: string;
      placeholder: string;
      offline: string;
      errorMessage: string;
    };
    features: {
      fileUpload: boolean;
      voiceInput: boolean;
      markdown: boolean;
      quickReplies: boolean;
    };
    branding: {
      showPoweredBy: boolean;
    };
    security: {
      allowedOrigins: string[];
      rateLimit?: {
        maxRequests: number;
        windowMs: number;
      };
    };
  };

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'published_by', type: 'uuid', nullable: true })
  publishedBy?: string | null;

  @Column({ name: 'cdn_url', type: 'varchar', length: 500, nullable: true })
  cdnUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  changelog?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @ManyToOne(() => BotEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bot_id' })
  bot?: BotEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
