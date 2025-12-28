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
import { StylePresetsService } from './style-presets.service';
import { CreateStylePresetDto } from './dto/create-style-preset.dto';
import { UpdateStylePresetDto } from './dto/update-style-preset.dto';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { Workspace } from '../workspaces/domain/workspace';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('StylePresets')
@Controller({
  path: 'style-presets',
  version: '1',
})
export class StylePresetsController {
  constructor(private readonly stylePresetsService: StylePresetsService) {}

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createStylePresetDto: CreateStylePresetDto,
    @CurrentWorkspace() workspace: Workspace,
  ) {
    return this.stylePresetsService.create({
      ...createStylePresetDto,
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
      await this.stylePresetsService.findManyWithPagination({
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
    return this.stylePresetsService.findById(id);
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @Body() updateStylePresetDto: UpdateStylePresetDto,
  ) {
    return this.stylePresetsService.update(id, updateStylePresetDto);
  }

  @Roles(RoleEnum.user, RoleEnum.admin)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.stylePresetsService.remove(id);
  }
}
