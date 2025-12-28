import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WebhooksService } from './webhooks.service';
import { WebhookEvent } from './domain/webhook';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'webhooks', version: '1' })
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('events')
  @ApiOperation({ summary: 'Get webhook events' })
  @ApiQuery({ name: 'channelId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'processing', 'completed', 'failed'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getEvents(
    @Query('channelId') channelId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.webhooksService.getEvents({
      channelId,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('events/:id')
  @ApiOperation({ summary: 'Get webhook event by ID' })
  @ApiOkResponse({ type: WebhookEvent })
  @ApiParam({ name: 'id', type: String })
  getEvent(@Param('id') id: string) {
    return this.webhooksService.getEvent(id);
  }

  @Post('events/:id/retry')
  @ApiOperation({ summary: 'Retry failed webhook event' })
  @ApiOkResponse({ type: WebhookEvent })
  @ApiParam({ name: 'id', type: String })
  retryEvent(@Param('id') id: string) {
    return this.webhooksService.retryFailed(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get webhook statistics' })
  @ApiQuery({ name: 'channelId', required: false })
  getStats(@Query('channelId') channelId?: string) {
    return this.webhooksService.getStats(channelId);
  }

  @Post('cleanup')
  @ApiOperation({ summary: 'Cleanup old completed events' })
  @ApiQuery({ name: 'daysOld', required: false, type: Number })
  @HttpCode(HttpStatus.OK)
  cleanup(@Query('daysOld') daysOld?: number) {
    return this.webhooksService.cleanupOldEvents(
      daysOld ? Number(daysOld) : 30,
    );
  }
}
