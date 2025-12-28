import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { Notification } from './domain/notification';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getNotifications(
    @Request() req,
    @CurrentWorkspace() workspaceId: string | undefined,
    @Query('isRead') isRead?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.getNotifications(req.user.id, {
      workspaceId,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiQuery({ name: 'workspaceId', required: false })
  async getUnreadCount(
    @Request() req,
    @CurrentWorkspace() workspaceId: string | undefined,
  ) {
    const count = await this.notificationsService.getUnreadCount(
      req.user.id,
      workspaceId,
    );
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiOkResponse({ type: Notification })
  @ApiParam({ name: 'id', type: String })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiQuery({ name: 'workspaceId', required: false })
  markAllAsRead(
    @Request() req,
    @CurrentWorkspace() workspaceId: string | undefined,
  ) {
    return this.notificationsService.markAllAsRead(req.user.id, workspaceId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @Request() req) {
    return this.notificationsService.delete(id, req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiQuery({ name: 'workspaceId', required: false })
  @HttpCode(HttpStatus.OK)
  deleteAll(
    @Request() req,
    @CurrentWorkspace() workspaceId: string | undefined,
  ) {
    return this.notificationsService.deleteAll(req.user.id, workspaceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiBody({ type: CreateNotificationDto })
  @ApiOkResponse({ type: Notification })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Test notification endpoint (for development)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Test Notification' },
        message: { type: 'string', example: 'This is a test notification' },
        type: {
          type: 'string',
          enum: ['info', 'success', 'warning', 'error'],
          example: 'info',
        },
      },
    },
  })
  async testNotification(
    @Request() req,
    @Body() body: { title: string; message: string; type?: string },
  ) {
    return this.notificationsService.create({
      userId: req.user.id,
      workspaceId: req.user.workspaceId || 'default-workspace',
      title: body.title,
      message: body.message,
      type: body.type as any,
    });
  }
}
