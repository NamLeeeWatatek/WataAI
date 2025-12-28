import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface ProcessingJob {
  id: string;
  documentId: string;
  knowledgeBaseId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalChunks: number;
  processedChunks: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

@Injectable()
export class KBProcessingQueueService {
  private readonly logger = new Logger(KBProcessingQueueService.name);
  private jobs = new Map<string, ProcessingJob>();
  private queue: string[] = [];
  private processing = false;
  private readonly maxConcurrent = 3;
  private activeJobs = new Set<string>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  addJob(documentId: string, knowledgeBaseId: string): string {
    const jobId = `job-${documentId}-${Date.now()}`;

    const job: ProcessingJob = {
      id: jobId,
      documentId,
      knowledgeBaseId,
      status: 'queued',
      progress: 0,
      totalChunks: 0,
      processedChunks: 0,
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);

    this.logger.log(`ðŸ“‹ Job ${jobId} added to queue`);
    this.emitJobUpdate(job);

    if (!this.processing) {
      this.processQueue();
    }

    return jobId;
  }

  updateJobProgress(
    jobId: string,
    processedChunks: number,
    totalChunks: number,
  ) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.processedChunks = processedChunks;
    job.totalChunks = totalChunks;
    job.progress = Math.round((processedChunks / totalChunks) * 100);

    this.emitJobUpdate(job);
  }

  startJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'processing';
    job.startedAt = new Date();
    this.activeJobs.add(jobId);

    this.logger.log(`â–¶ï¸ Job ${jobId} started processing`);
    this.emitJobUpdate(job);
  }

  completeJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();
    this.activeJobs.delete(jobId);

    this.logger.log(`âœ… Job ${jobId} completed`);
    this.emitJobUpdate(job);

    this.processQueue();
  }

  failJob(jobId: string, error: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();
    this.activeJobs.delete(jobId);

    this.logger.error(`âŒ Job ${jobId} failed: ${error}`);
    this.emitJobUpdate(job);

    this.processQueue();
  }

  getJob(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
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

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs.size < this.maxConcurrent) {
      const jobId = this.queue.shift();
      if (!jobId) continue;

      const job = this.jobs.get(jobId);
      if (!job) continue;
    }

    this.processing = false;
  }

  getNextJob(): ProcessingJob | undefined {
    if (this.activeJobs.size >= this.maxConcurrent) return undefined;

    const jobId = this.queue.shift();
    if (!jobId) return undefined;

    return this.jobs.get(jobId);
  }

  setJobDocumentName(jobId: string, documentName: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      (job as any).documentName = documentName;
    }
  }

  private emitJobUpdate(job: ProcessingJob) {
    const payload = {
      jobId: job.id,
      documentId: job.documentId,
      documentName: (job as any).documentName,
      knowledgeBaseId: job.knowledgeBaseId,
      status: job.status,
      progress: job.progress,
      totalChunks: job.totalChunks,
      processedChunks: job.processedChunks,
      error: job.error,
    };

    this.logger.log(
      `ðŸ”” Emitting job update: ${job.status} ${job.progress}% (${payload.documentName})`,
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
