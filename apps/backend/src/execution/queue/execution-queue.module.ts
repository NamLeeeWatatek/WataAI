import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExecutionQueueService } from './execution-queue.service';
import { JOB_QUEUE } from './execution-queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: JOB_QUEUE,
    }),
  ],
  providers: [ExecutionQueueService],
  exports: [BullModule, ExecutionQueueService],
})
export class ExecutionQueueModule { }
