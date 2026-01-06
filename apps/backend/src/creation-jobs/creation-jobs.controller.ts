import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { CreationJobsService } from './creation-jobs.service';
import { CreateCreationJobDto } from './dto/create-creation-jobs.dto';
import { UpdateCreationJobDto } from './dto/update-creation-jobs.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreationJob } from './domain/creation-jobs';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { FindAllCreationJobsDto } from './dto/find-all-creation-jobs.dto';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

@ApiTags('Creation Jobs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({
  path: 'creation-jobs',
  version: '1',
})
export class CreationJobsController {
  constructor(private readonly service: CreationJobsService) {}

  @Post()
  @Permissions('job:Create')
  @ApiCreatedResponse({
    type: CreationJob,
  })
  create(
    @Body() createDto: CreateCreationJobDto,
    @Request() req,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.service.create(createDto, req.user.id, workspaceId);
  }

  @Get()
  @Permissions('job:List')
  @ApiOkResponse({
    type: InfinityPaginationResponse(CreationJob),
  })
  async findAll(
    @Query() query: FindAllCreationJobsDto,
    @CurrentWorkspace() workspaceId: string,
  ): Promise<InfinityPaginationResponseDto<CreationJob>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const result = await this.service.findAllWithPagination({
      paginationOptions: {
        page,
        limit,
      },
      filterOptions: {
        startDate: query.startDate,
        endDate: query.endDate,
        search: query.search,
        status: query.status,
      },
      workspaceId,
    });

    return infinityPagination(result.data, { page, limit }, result.count);
  }

  @Get(':id')
  @Permissions('job:Get')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: CreationJob,
  })
  findById(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.service.findById(id, workspaceId);
  }

  @Patch(':id')
  @Permissions('job:Update')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    type: CreationJob,
  })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCreationJobDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.service.update(id, workspaceId, updateDto);
  }

  @Delete(':id')
  @Permissions('job:Delete')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  remove(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.service.remove(id, workspaceId);
  }

  @Post('bulk-delete')
  @Permissions('job:Delete')
  @ApiOkResponse({
    description: 'Bulk delete creation jobs',
  })
  removeMany(
    @Body('ids') ids: string[],
    @CurrentWorkspace() workspaceId: string,
  ) {
    return this.service.removeMany(ids, workspaceId);
  }
  @Post(':id/cancel')
  @Permissions('job:Update')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @ApiOkResponse({
    description: 'Cancel creation job',
  })
  cancel(@Param('id') id: string, @CurrentWorkspace() workspaceId: string) {
    return this.service.cancel(id, workspaceId);
  }
}
