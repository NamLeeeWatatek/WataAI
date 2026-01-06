import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WidgetVersionService } from '../services/widget-version.service';
import { WidgetDeploymentResponseDto } from '../dto/widget-version.dto';

import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';

@ApiTags('Widget Deployment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard)
@Controller({ path: 'bots/:botId/widget/deployments', version: '1' })
export class WidgetDeploymentController {
  constructor(private readonly widgetVersionService: WidgetVersionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get deployment history',
    description: 'Get widget deployment history for a bot',
  })
  @ApiParam({ name: 'botId', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Deployment history retrieved successfully',
    type: [WidgetDeploymentResponseDto],
  })
  async getDeploymentHistory(
    @Param('botId') botId: string,
    @Request() req,
  ): Promise<WidgetDeploymentResponseDto[]> {
    return this.widgetVersionService.getDeploymentHistory(botId, req.user.id);
  }
}
