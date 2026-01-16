import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KBProcessingQueueService } from './services/kb-processing-queue.service';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';

@ApiTags('Knowledge Base - Processing')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseProcessingController {
  constructor(private readonly processingQueue: KBProcessingQueueService) {}

  @Get(':id/processing-status')
  @ApiOperation({ summary: 'Get processing status for knowledge base' })
  async getProcessingStatus(@Param('id') id: string, @Request() req) {
    const jobs = this.processingQueue.getJobsByKnowledgeBase(id);
    return {
      jobs: jobs.map((job) => ({
        jobId: job.id,
        documentId: job.documentId,
        documentName: job.documentName,
        knowledgeBaseId: job.knowledgeBaseId,
        status: job.status,
        progress: job.progress,
        totalChunks: job.totalChunks,
        processedChunks: job.processedChunks,
        error: job.error,
      })),
    };
  }

  @Get('processing/active')
  @ApiOperation({ summary: 'Get all active processing jobs' })
  async getActiveJobs(@Request() req) {
    const jobs = this.processingQueue.getActiveJobs();
    return {
      jobs: jobs.map((job) => ({
        jobId: job.id,
        documentId: job.documentId,
        documentName: job.documentName,
        knowledgeBaseId: job.knowledgeBaseId,
        status: job.status,
        progress: job.progress,
        totalChunks: job.totalChunks,
        processedChunks: job.processedChunks,
        error: job.error,
      })),
    };
  }

  @Post('processing/:jobId/cancel')
  @ApiOperation({ summary: 'Cancel a processing job' })
  async cancelJob(@Param('jobId') jobId: string, @Request() req) {
    const success = await this.processingQueue.cancelJob(jobId);
    return { success };
  }
}
