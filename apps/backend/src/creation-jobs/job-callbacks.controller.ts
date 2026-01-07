import {
  Controller,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreationJobsService } from './creation-jobs.service';
import { CreationJobStatus } from './domain/creation-jobs';
import { Public } from '../utils/public.decorator';

import { CompleteJobDto } from './dto/complete-job.dto';

@ApiTags('Creation Job Callbacks')
@Public()
@Controller({
  path: 'callbacks/jobs',
  version: '1',
})
export class JobCallbacksController {
  constructor(private readonly service: CreationJobsService) { }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Callback endpoint for external tools to complete a job',
    description:
      'Updates a creation job status and output data. This endpoint is public to allow external tools (n8n, make, etc.) to call back.',
  })
  @ApiParam({ name: 'id', description: 'The Creation Job ID' })
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id') id: string,
    @Body() body: CompleteJobDto,
  ) {
    const status = body.status || CreationJobStatus.COMPLETED;

    await this.service.completeJob(id, body.outputData, status, body.error);

    return { success: true };
  }
}
