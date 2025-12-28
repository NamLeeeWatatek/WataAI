import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Post,
  Body,
  Request,
} from '@nestjs/common';
import { CreateGenerationJobDto } from './dto/create-generation-job.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { GenerationJobsService } from './generation-jobs.service';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { Workspace } from '../workspaces/domain/workspace';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { infinityPagination } from '../utils/infinity-pagination';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@ApiBearerAuth()
@ApiTags('Generation Jobs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({
  path: 'generation-jobs',
  version: '1',
})
export class GenerationJobsController {
  constructor(private readonly generationJobsService: GenerationJobsService) { }

  @Post()
  @Permissions('job:Create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createGenerationJobDto: CreateGenerationJobDto,
    @CurrentWorkspace() workspace: Workspace,
    @Request() req,
  ) {
    const { params, ...rest } = createGenerationJobDto;

    return this.generationJobsService.create({
      ...rest,
      inputData: params,
      workspaceId: workspace.id,
      userId: req.user.id,
      status: 'pending',
    });
  }

  @Get()
  @Permissions('job:List')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return infinityPagination(
      await this.generationJobsService.findManyWithPagination({
        workspaceId: workspace.id,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Get(':id')
  @Permissions('job:Get')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    return this.generationJobsService.findById(id);
  }
}
