import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { KbDocumentEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { Repository } from 'typeorm';
import { KbProcessingStatus } from '../knowledge-base.enum';

export interface ProcessingJob {
  id: string;
  documentId: string;
  knowledgeBaseId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
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
export class KBProcessingQueueService implements OnModuleInit {
  private readonly logger = new Logger(KBProcessingQueueService.name);
  private jobs = new Map<string, ProcessingJob>();

  constructor(
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue('kb-processing') private readonly kbQueue: Queue,
    @InjectRepository(KbDocumentEntity)
    private readonly documentRepository: Repository<KbDocumentEntity>,
  ) { }

  async onModuleInit() {
    this.logger.log('🔄 Checking for stuck jobs on startup...');
    await this.cleanupStuckJobs();
  }

  /**
   * Called by the queued worker when it picks up a job.
   * Ensures the job is known to this memory-based service so progress updates work.
   */
  ensureJobTracking(job: ProcessingJob) {
    if (!this.jobs.has(job.id)) {
      this.logger.log(
        `🔄 Restoring job tracking for ${job.id} (resumed from queue)`,
      );
      this.jobs.set(job.id, job);
      this.emitJobUpdate(job);
    }
  }

  /**
   * Find documents that are stuck in 'PROCESSING' state but have no active queue job.
   * This happens if the server crashes/redeploys and the in-memory queue is lost.
   */
  private async cleanupStuckJobs() {
    // 1. Get all documents that say they are processing
    const processingDocs = await this.documentRepository.find({
      where: { processingStatus: KbProcessingStatus.PROCESSING },
    });

    if (processingDocs.length === 0) return;

    this.logger.log(
      `Found ${processingDocs.length} documents in PROCESSING state. Verifying queue...`,
    );

    for (const doc of processingDocs) {
      // We don't easily know the exact internal Job ID unless we stored it in the DB (which we don't yet for all types).
      // However, we can try to find if *any* job exists for this document ID in the queue.
      // Or simply, since we just restarted, if it was in the queue, the worker will pick it up and call ensureJobTracking.
      // If after a short grace period we haven't heard from it, it's likely dead.
      // BUT, for safety in this iteration, we will assume if it's not in the Delayed/Active/Waiting queue, it's dead.

      // Limitation: We can't efficiently search BullMQ for a specific custom ID without scanning.
      // So we'll use a safer heuristic:
      // If we just restarted, we have NO in-memory jobs.
      // Any job that is truly active in Redis will be picked up by KBProcessor soon.
      // So we can leave them for now?
      // NO, the user says they "stay in process forever".
      // A safe bet is to mark them FAILED so the user can click 'Retry'.

      // Let's check if the Job Queue is empty or if we can find it.
      // Actually, we can just mark them as FAILED with a specific error "Interrupted by Restart".
      // The user can then click Retry.

      // EXCEPTION: If the deployment is zero-downtime, another pod might be processing it.
      // But typically this is a single instance.

      // BETTER APPROACH:
      // We don't touch them immediately. We rely on the Worker to "pick up" valid jobs.
      // But if the job was *processing* when the server died, the worker lock might have expired or stayed.
      // BullMQ should retry 'stalled' jobs automatically.
      // So if it's taking forever, either BullMQ dropped it or it's genuinely stuck.

      // Let's implemented a "Zombie Killer" that marks them failed if they are old?
      // Or simply mark all PROCESSING as FAILED on startup?
      // Marking as FAILED on startup is the most robust way to ensure UI consistency for a single-instance deployment.
      // If a worker IS actually processing it (e.g. another replica), valid status updates might eventually overwrite this,
      // but "Interrupted" is the most likely truth.

      doc.processingStatus = KbProcessingStatus.FAILED;
      doc.processingError =
        'System restart detected. Job marked as failed to allow retry.';
      await this.documentRepository.save(doc);
      this.logger.warn(
        `⚠️ Marked stuck document ${doc.id} as FAILED due to restart.`,
      );
    }
  }

  async addJob(
    documentId: string,
    knowledgeBaseId: string,
    type: 'embedding' | 'crawl' = 'embedding',
    userId?: string,
    addToQueue = true,
    documentName?: string,
  ): Promise<string> {
    const internalJobId = documentId.startsWith('crawl-')
      ? documentId
      : `${type}-${documentId}-${Date.now()}`;

    const jobStatus: ProcessingJob = {
      id: internalJobId,
      documentId,
      knowledgeBaseId,
      status: 'queued',
      progress: 0,
      processedChunks: 0,
      totalChunks: 0,
      type,
      documentName,
    };

    this.jobs.set(internalJobId, jobStatus);

    // Fair Queueing: Calculate priority based on how many jobs this KB already has in queue
    // BullMQ: Lower number = Higher priority. Priority 1 (High) -> Priority 100+ (Low)
    const activeJobsForKB = this.getJobsByKnowledgeBase(knowledgeBaseId).filter(
      (j) => j.status === 'queued' || j.status === 'processing',
    );
    const priority = Math.min(255, 1 + activeJobsForKB.length);

    this.logger.log(
      `📥 Job ${internalJobId} added (Priority: ${priority}, Local: ${!addToQueue})`,
    );

    if (addToQueue) {
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
          priority, // Apply fair-queueing priority
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }

    this.emitJobUpdate(jobStatus);
    return internalJobId;
  }

  async cancelJob(internalJobId: string): Promise<boolean> {
    const job = this.jobs.get(internalJobId);
    if (!job) return false;

    // 1. Update internal state
    job.status = 'cancelled';
    job.error = 'Cancelled by user';
    job.completedAt = new Date();

    // 2. Try to remove from BullMQ
    try {
      const bullJob = await this.kbQueue.getJob(internalJobId);
      if (bullJob) {
        // If it's active, we can't easily "stop" the thread immediately without checking status in worker
        // but removing it prevents it from being retried or identifies it as removed
        await bullJob.remove();
        this.logger.log(`🛑 Job ${internalJobId} removed from BullMQ`);
      }
    } catch (err) {
      this.logger.error(`Error removing job from BullMQ: ${err.message}`);
    }

    this.logger.log(`🛑 Job ${internalJobId} cancelled`);
    this.emitJobUpdate(job);
    return true;
  }

  updateJobProgress(
    internalJobId: string,
    processedChunks: number,
    totalChunks: number,
  ) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    // Don't update if already completed, failed or cancelled
    if (job.status !== 'processing' && job.status !== 'queued') return;

    job.processedChunks = processedChunks;
    job.totalChunks = totalChunks;
    job.progress = Math.round((processedChunks / totalChunks) * 100);

    this.emitJobUpdate(job);
  }

  startJob(internalJobId: string) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    // Don't start if already cancelled
    if (job.status === 'cancelled') {
      this.logger.warn(
        `Attempted to start already cancelled job ${internalJobId}`,
      );
      return;
    }

    job.status = 'processing';
    job.startedAt = new Date();

    this.logger.log(`▶️ Job ${internalJobId} started processing`);
    this.emitJobUpdate(job);
  }

  completeJob(internalJobId: string) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    // Don't complete if cancelled
    if (job.status === 'cancelled') return;

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = new Date();

    this.logger.log(`✅ Job ${internalJobId} completed`);
    this.emitJobUpdate(job);
  }

  failJob(internalJobId: string, error: string) {
    const job = this.jobs.get(internalJobId);
    if (!job) return;

    // Don't fail if already cancelled
    if (job.status === 'cancelled') return;

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
