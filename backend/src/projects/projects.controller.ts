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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { Workspace } from '../workspaces/domain/workspace';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Projects')
@Controller({
  path: 'projects',
  version: '1',
})
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.projectsService.create({
      ...createProjectDto,
      workspaceId: workspace.id,
    });
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Get()
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
      await this.projectsService.findManyWithPagination({
        workspaceId: workspace.id,
        paginationOptions: {
          page,
          limit,
        },
      }),
      { page, limit },
    );
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.projectsService.findById(id);
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
