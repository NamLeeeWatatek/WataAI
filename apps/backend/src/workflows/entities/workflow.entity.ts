import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserEntity as User } from '../../users/infrastructure/persistence/relational/entities/user.entity';

@Entity('workflows')
export class Workflow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ nullable: true })
    thumbnailUrl: string;

    @Column({ type: 'jsonb', default: {} })
    graph: any; // React Flow JSON

    @Column({ default: false })
    isPublic: boolean;

    @Column({ default: 'Draft' })
    category: string;

    @ManyToOne(() => User, { eager: true, nullable: true })
    owner: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
