import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';
import { BotAppearanceService } from '../services/bot-appearance.service';

@ApiTags('Widget Appearance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceAccessGuard, PermissionsGuard)
@Controller({ path: 'bots/:botId/widget/appearance', version: '1' })
export class WidgetAppearanceController {
  constructor(private readonly appearanceService: BotAppearanceService) {}

  @Get()
  @Permissions('bot:Get')
  @ApiOperation({ summary: 'Get active widget appearance' })
  async getAppearance(@Param('botId') botId: string) {
    return this.appearanceService.getAppearance(botId);
  }

  @Put()
  @Patch()
  @Permissions('bot:Update')
  @ApiOperation({ summary: 'Update active widget appearance' })
  async updateAppearance(
    @Param('botId') botId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.appearanceService.updateAppearance(botId, body, req.user.id);
  }
}
