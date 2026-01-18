/*
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
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { BotsService } from '../bots.service';
import { CreateFlowVersionDto } from '../dto/create-flow-version.dto';
import { UpdateFlowVersionDto } from '../dto/update-flow-version.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../roles/roles.guard';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';

@ApiTags('Bot Flows')
@Controller({
  path: 'bots',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@Roles(RoleEnum.admin, RoleEnum.user)
export class BotFlowsController {
  constructor(private readonly botsService: BotsService) {}

  @Post(':id/flow/versions')
  @ApiOperation({ summary: 'Create a new flow version' })
  @ApiParam({ name: 'id', type: String })
  create(
    @Param('id') id: string,
    @Body() dto: CreateFlowVersionDto,
    @Param('request') req: any,
  ) {
    return this.botsService.createFlowVersion(id, dto, req.user.id);
  }

  @Get(':id/flow/versions')
  @ApiOperation({ summary: 'Get all flow versions' })
  @ApiParam({ name: 'id', type: String })
  findAll(@Param('id') id: string) {
    return this.botsService.getFlowVersions(id);
  }

  @Get(':id/published-flow')
  @ApiOperation({ summary: 'Get published flow version' })
  @ApiParam({ name: 'id', type: String })
  getPublished(@Param('id') id: string) {
    return this.botsService.getPublishedVersion(id);
  }

  @Get(':id/flow/versions/:versionId')
  @ApiOperation({ summary: 'Get specific flow version' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'versionId', type: String })
  findOne(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.botsService.getFlowVersion(id, versionId);
  }

  @Patch(':id/flow/versions/:versionId')
  @ApiOperation({ summary: 'Update flow version' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'versionId', type: String })
  update(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateFlowVersionDto,
  ) {
    return this.botsService.updateFlowVersion(id, versionId, dto);
  }

  @Post(':id/flow/versions/:versionId/publish')
  @ApiOperation({ summary: 'Publish flow version' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'versionId', type: String })
  publish(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.botsService.publishFlowVersion(id, versionId);
  }
}
*/
