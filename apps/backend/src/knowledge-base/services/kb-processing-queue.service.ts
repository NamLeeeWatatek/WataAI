import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface ProcessingJob {
  id: string;
  documentId: string;
  knowledgeBaseId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalChunks: number;
  processedChunks: number;
  type: 'embedding' | 'crawl';
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  documentName?: string;
}

@Injectable()
export class KBProcessingQueueService {
  private readonly logger = new Logger(KBProcessingQueueService.name);
  private jobs = new Map<string, ProcessingJob>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('kb-processing') private readonly kbQueue: Queue,
  ) { }

  async addJob(
    documentId: string,
    knowledgeBaseId: string,
    type: 'embedding' | 'crawl' = 'embedding',
    userId?: string,
  ): Promise<string> {
    const internalJobId = `${type}-${documentId}-${Date.now()}`;

    const jobStatus: ProcessingJob = {
      id: internalJobId,
      documentId,
      knowledgeBaseId,
      status: 'queued',
      progress: 0,
      totalChunks: 0,
      processedChunks: 0,
      type,
    };

    this.jobs.set(internalJobId, jobStatus);
    this.logger.log(`📥 Job ${internalJobId} added to memory status and BullMQ`);

    // Add to BullMQ
    await this.kbQueue.add(
      type === 'embedding' ? 'process-document' : 'crawl-website',
      {
        documentId,
        knowledgeBaseId,
        userId,
        internalJobId,
      },
      {
        jobId: internalJobId,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.emitJobUpdate(jobStatus);
    return internalJobId;
  }

  updateJobProgress(
    internalJobId: string,
    processedChunks: number,
    totalChunks: number,
  ) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    job.processedChunks = processedChunks;
    job.totalChunks = totalChunks;
    job.progress = Math.round((processedChunks / totalChunks) * 100);

    this.emitJobUpdate(job);
  }

  startJob(internalJobId: string) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = new Date();

    this.logger.log(`▶️ Job ${internalJobId} started processing`);
    this.emitJobUpdate(job);
  }

  completeJob(internalJobId: string) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();

    this.logger.log(`✅ Job ${internalJobId} completed`);
    this.emitJobUpdate(job);
  }

  failJob(internalJobId: string, error: string) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();

    this.logger.error(`❌ Job ${internalJobId} failed: ${error}`);
    this.emitJobUpdate(job);
  }

  getJob(internalJobId: string): ProcessingJob | undefined {
    return this.jobs.get(internalJobId);
  }

  getJobsByKnowledgeBase(knowledgeBaseId: string): ProcessingJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.knowledgeBaseId === knowledgeBaseId,
    );
  }

  getActiveJobs(): ProcessingJob[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === 'processing' || job.status === 'queued',
    );
  }

  setJobDocumentName(internalJobId: string, documentName: string) {
    const job = this.jobs.get(internalJobId);
    if (job) {
      job.documentName = documentName;
    }
  }

  private emitJobUpdate(job: ProcessingJob) {
    const payload = {
      jobId: job.id,
      documentId: job.documentId,
      documentName: job.documentName,
      knowledgeBaseId: job.knowledgeBaseId,
      status: job.status,
      progress: job.progress,
      totalChunks: job.totalChunks,
      processedChunks: job.processedChunks,
      type: job.type,
      error: job.error,
    };

    this.logger.log(
      `🔔 Emitting job update: ${job.status} ${job.progress}% (${payload.documentName || job.id})`,
    );

    this.eventEmitter.emit('kb.processing.update', payload);
  }

  cleanup() {
    const completed = Array.from(this.jobs.values())
      .filter((job) => job.status === 'completed' || job.status === 'failed')
      .sort((a, b) => {
        const aTime = a.completedAt?.getTime() || 0;
        const bTime = b.completedAt?.getTime() || 0;
        return bTime - aTime;
      });

    if (completed.length > 100) {
      const toRemove = completed.slice(100);
      toRemove.forEach((job) => this.jobs.delete(job.id));
    }
  }
}
