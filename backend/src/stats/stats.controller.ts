import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';
import { SystemStatsDto } from './dto/system-stats.dto';
import { StatsQueryDto } from './dto/stats-query.dto';

@ApiTags('Stats')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('system')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get system-wide statistics',
    description:
      'Retrieve comprehensive statistics for the system-wide admin dashboard',
  })
  @ApiOkResponse({
    type: SystemStatsDto,
    description: 'System statistics retrieved successfully',
  })
  async getSystemStats(@Query() query: StatsQueryDto): Promise<SystemStatsDto> {
    return this.statsService.getSystemStats(query);
  }

  @Get('admin/control-plane')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get system health statistics',
    description: 'Retrieve CPU, RAM, and Service status',
  })
  getControlPlaneStats() {
    return this.statsService.getControlPlaneStats();
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get dashboard statistics',
    description:
      'Retrieve comprehensive statistics for the dashboard including users, bots, conversations, flows, and workspaces filtered by workspace',
  })
  @ApiOkResponse({
    type: DashboardStatsDto,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats(
    @Query() query: StatsQueryDto,
    @Request() req,
  ): Promise<DashboardStatsDto> {
    const workspaceId = query.workspaceId || req.user?.workspaceId;
    return this.statsService.getDashboardStats(query, workspaceId);
  }
}
