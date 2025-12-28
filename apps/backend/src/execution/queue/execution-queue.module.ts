import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

export const JOB_QUEUE = 'generation-jobs';

@Module({
  imports: [
    BullModule.registerQueue({
      name: JOB_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class ExecutionQueueModule {}
