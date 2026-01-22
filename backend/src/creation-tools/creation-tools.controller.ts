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
  SerializeOptions,
  Request,
} from '@nestjs/common';
import { CreateCreationToolDto } from './dto/create-creation-tool.dto';
import { UpdateCreationToolDto } from './dto/update-creation-tool.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import {
  InfinityPaginationResponse,
  InfinityPaginationResponseDto,
} from '../utils/dto/infinity-pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { QueryCreationToolDto } from './dto/query-creation-tool.dto';
import { CreationTool } from './domain/creation-tool';
import { CreationToolsService } from './creation-tools.service';
import { infinityPagination } from '../utils/infinity-pagination';

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { PermissionsGuard } from '../permissions/guards/permissions.guard';
import { Permissions } from '../permissions/decorators/permissions.decorator';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { ExecutionStrategyResolver } from '../execution/execution-strategy.resolver';
import { CreationJobsService } from '../creation-jobs/creation-jobs.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard, PermissionsGuard)
@ApiTags('Creation Tools')
@Controller('creation-tools')
export class CreationToolsController {
  constructor(
    private readonly service: CreationToolsService,
    private readonly executionResolver: ExecutionStrategyResolver,
    private readonly creationJobsService: CreationJobsService,
  ) {}

  @ApiCreatedResponse({ type: CreationTool })
  @ApiOperation({ summary: 'Create new creation tool' })
  @Permissions('tool:Create')
  @SerializeOptions({ groups: ['admin'] })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDto: CreateCreationToolDto): Promise<CreationTool> {
    return this.service.create(createDto);
  }

  @ApiOkResponse({ type: InfinityPaginationResponse(CreationTool) })
  @ApiOperation({ summary: 'Get all creation tools with pagination' })
  @Permissions('tool:List')
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryCreationToolDto,
  ): Promise<InfinityPaginationResponseDto<CreationTool>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const [data, total] = await this.service.findManyWithPagination({
      filterOptions: query?.filters,
      sortOptions: query?.sort,
      paginationOptions: { page, limit },
    });

    return infinityPagination(data, { page, limit }, total);
  }

  @ApiOkResponse({ type: [CreationTool] })
  @ApiOperation({ summary: 'Get all active creation tools (simplified)' })
  @Permissions('tool:List')
  @Get('active')
  @HttpCode(HttpStatus.OK)
  findAllActive(): Promise<CreationTool[]> {
    return this.service.findAll({ isActive: true });
  }

  @ApiOkResponse({ type: CreationTool })
  @ApiOperation({ summary: 'Get creation tool by slug' })
  @Permissions('tool:Get')
  @Get('slug/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'slug', type: String, required: true })
  findBySlug(@Param('slug') slug: string): Promise<NullableType<CreationTool>> {
    return this.service.findBySlug(slug);
  }

  @ApiOkResponse({ type: CreationTool })
  @ApiOperation({ summary: 'Get creation tool by ID' })
  @Permissions('tool:Get')
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  findOne(
    @Param('id') id: CreationTool['id'],
  ): Promise<NullableType<CreationTool>> {
    return this.service.findById(id);
  }

  @ApiOkResponse({ type: [CreationTool] })
  @ApiOperation({ summary: 'Get creation tools by workspace ID' })
  @Permissions('tool:List')
  @Get('workspace/:workspaceId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'workspaceId', type: String, required: true })
  findByWorkspace(
    @Param('workspaceId') workspaceId: string,
  ): Promise<CreationTool[]> {
    return this.service.findByWorkspace(workspaceId);
  }

  @ApiOkResponse({ type: CreationTool })
  @ApiOperation({ summary: 'Update creation tool' })
  @Permissions('tool:Update')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  update(
    @Param('id') id: CreationTool['id'],
    @Body() updateDto: UpdateCreationToolDto,
  ): Promise<CreationTool> {
    if (updateDto.formConfig && (updateDto.formConfig as any).steps) {
      console.log(
        'DEBUG: Updating tool steps execution:',
        JSON.stringify(
          (updateDto.formConfig as any).steps.map((s) => ({
            id: s.id,
            hasExecution: !!s.execution,
            executionType: s.execution?.type,
          })),
          null,
          2,
        ),
      );
    }
    return this.service.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete creation tool' })
  @Permissions('tool:Delete')
  @Delete(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: CreationTool['id']): Promise<void> {
    return this.service.remove(id);
  }

  @ApiOkResponse({ type: CreationTool })
  @ApiOperation({ summary: 'Activate creation tool' })
  @Permissions('tool:Update')
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  activate(@Param('id') id: CreationTool['id']): Promise<CreationTool> {
    return this.service.activate(id);
  }

  @ApiOkResponse({ type: CreationTool })
  @ApiOperation({ summary: 'Deactivate creation tool' })
  @Permissions('tool:Update')
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  deactivate(@Param('id') id: CreationTool['id']): Promise<CreationTool> {
    return this.service.deactivate(id);
  }

  @ApiOperation({ summary: 'Export curation tools' })
  @Permissions('tool:List')
  @Post('export')
  @HttpCode(HttpStatus.OK)
  export(@Body() data: { ids?: string[] }): Promise<CreationTool[]> {
    return this.service.exportTools(data.ids);
  }

  @ApiOperation({ summary: 'Import curation tools' })
  @Permissions('tool:Update')
  @Post('import')
  @HttpCode(HttpStatus.OK)
  import(
    @Body() data: { tools: any[] },
  ): Promise<{ success: number; failed: number }> {
    return this.service.importTools(data.tools);
  }

  @ApiOperation({ summary: 'Execute a specific step (Draft Mode)' })
  @ApiOkResponse({ description: 'Step execution result with Job ID' })
  @Permissions('tool:Execute')
  @Post(':id/steps/:stepId/execute')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Tool ID',
  })
  @ApiParam({
    name: 'stepId',
    type: String,
    required: true,
    description: 'Step ID',
  })
  async executeStep(
    @Param('id') toolId: string,
    @Param('stepId') stepId: string,
    @Body()
    body: {
      stepData: Record<string, any>;
      previousResults?: Record<string, any>;
      jobId?: string;
    },
    @CurrentWorkspace() workspaceId: string,
    @Request() req: any,
  ): Promise<any> {
    // Delegate to CreationJobsService to handle persistence (Draft Job)
    const result = await this.creationJobsService.executeJobStep(
      toolId,
      stepId,
      body.stepData,
      { workspaceId, userId: req.user?.id },
      body.jobId,
    );

    return {
      success: true,
      stepId,
      result: result.result, // The execution result
      jobId: result.jobId, // The persistent Job ID
      executedAt: new Date().toISOString(),
    };
  }
}
