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
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CreationJobEntity } from './creation-jobs.entity';
import { PublicationStatus } from '../../../../domain/creation-job-publication';

@Entity({
  name: 'creation_job_publications',
})
export class CreationJobPublicationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CreationJobEntity, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: CreationJobEntity;

  @Column({ name: 'job_id', type: 'uuid' })
  @Index()
  jobId: string;

  @Column({ name: 'channel_id', type: 'uuid' })
  @Index()
  channelId: string;

  @Column({ type: 'varchar', length: 50 })
  platform: string;

  @Column({
    type: 'enum',
    enum: PublicationStatus,
    default: PublicationStatus.PENDING,
  })
  @Index()
  status: PublicationStatus;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string;

  @Column({ type: 'text', nullable: true })
  url?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
