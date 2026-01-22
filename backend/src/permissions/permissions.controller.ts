import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsService } from './permissions.service';
import {
  PermissionCheckRequestDto,
  PermissionCheckResponseDto,
} from './dto/permission-check.dto';
import { UserCapabilitiesDto } from './dto/user-capabilities.dto';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';

import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('me/capabilities')
  @ApiOperation({ summary: 'Get current user capabilities and permissions' })
  async getMyCapabilities(@Request() req): Promise<UserCapabilitiesDto> {
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;
    return this.permissionsService.getUserCapabilities(req.user, workspaceId);
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if user has specific permissions' })
  async checkPermissions(
    @Request() req,
    @Body() dto: PermissionCheckRequestDto,
  ): Promise<PermissionCheckResponseDto> {
    const workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;
    return this.permissionsService.checkPermissions(
      req.user,
      dto.permissions,
      workspaceId,
    );
  }

  @Post()
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new permission' })
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all system permissions' })
  async findAll(@Query('search') search?: string) {
    return this.permissionsService.findAll(search);
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete permission' })
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}
