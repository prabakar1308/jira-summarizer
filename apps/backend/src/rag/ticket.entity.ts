import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class TicketRecord {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    key: string;

    @Column()
    summary: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column()
    status: string;

    @Column({ nullable: true })
    priority: string;

    @Column({ nullable: true })
    assignee: string;

    @Column({ type: 'simple-array', nullable: true })
    embedding: number[];

    @Column({ type: 'text', nullable: true })
    metadata: any;

    @CreateDateColumn()
    createdAt: Date;
}
