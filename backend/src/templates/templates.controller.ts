import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { QueryTemplateDto } from './dto/query-template.dto';

import { NullableType } from '../utils/types/nullable.type';
import { Template } from './domain/template';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@Controller({
  path: 'templates',
  version: '1',
})
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('template:Create')
  create(@Body() createTemplateDto: CreateTemplateDto): Promise<Template> {
    return this.templatesService.create(createTemplateDto);
  }

  @Get()
  @Permissions('template:List')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryTemplateDto,
  ): Promise<InfinityPaginationResponseDto<Template>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const [data, total] = await this.templatesService.findManyWithPagination({
      paginationOptions: {
        page,
        limit,
      },
      filterOptions: query.filters,
      sortOptions: query.sort,
    });

    return infinityPagination(data, { page, limit }, total);
  }

  @Get(':id')
  @Permissions('template:Get')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string): Promise<NullableType<Template>> {
    return this.templatesService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('template:Update')
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template | null> {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('template:Delete')
  remove(@Param('id') id: string): Promise<void> {
    return this.templatesService.remove(id);
  }

  @Patch('bulk/update')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('template:Update')
  async bulkUpdate(
    @Body()
    bulkUpdateDto: import('./dto/bulk-operation-template.dto').BulkUpdateTemplateDto,
  ): Promise<void> {
    return this.templatesService.bulkUpdate(
      bulkUpdateDto.ids,
      bulkUpdateDto.data,
    );
  }

  @Post('bulk/delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('template:Delete')
  async bulkRemove(
    @Body()
    bulkDeleteDto: import('./dto/bulk-operation-template.dto').BulkDeleteTemplateDto,
  ): Promise<void> {
    return this.templatesService.bulkRemove(bulkDeleteDto.ids);
  }
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @Permissions('template:Create')
  async importTemplates(
    @Body() body: { templates: any[]; workspaceId: string },
    @Param('id') _id: string, // unused but keeps signature consistent if needed
    @Req() req,
  ): Promise<any[]> {
    // If no workspaceId in body, try to get from user or context?
    // Ideally the frontend sends it.
    return this.templatesService.importTemplates(
      body.templates,
      body.workspaceId,
      req.user.id,
    );
  }

  @Get('export')
  @Permissions('template:List')
  async exportTemplates(@Query('ids') ids: string): Promise<Template[]> {
    const idArray = ids ? ids.split(',').filter(Boolean) : [];
    // If no IDs provided, export ALL? Or return empty?
    // Better to require IDs for specific export, or handle "all" logic if needed.
    // For now assuming explicit selection.
    if (idArray.length === 0) return [];
    return this.templatesService.getTemplatesForExport(idArray);
  }
}
