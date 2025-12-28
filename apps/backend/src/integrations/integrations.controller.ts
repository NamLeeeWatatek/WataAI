import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'integrations', version: '1' })
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all integration credentials' })
  async findAll(@CurrentWorkspace() workspaceId: string) {
    if (!workspaceId) {
      throw new Error('Workspace ID is required to fetch integrations');
    }

    const credentials = await this.integrationsService.findAll(workspaceId);

    return credentials.map((cred) => ({
      id: cred.id,
      name: cred.name,
      provider: cred.provider,
      client_id: cred.clientId,
      client_secret: cred.clientSecret ? '***' : undefined,
      scopes: cred.scopes,
      is_active: cred.isActive,
    }));
  }

  @Post()
  @ApiOperation({ summary: 'Create integration credential' })
  async create(
    @Body() dto: CreateCredentialDto,
    @CurrentWorkspace() workspaceId: string,
  ) {
    if (!workspaceId) {
      throw new Error(
        'Workspace ID is required to create integration credential',
      );
    }

    const credential = await this.integrationsService.create(dto, workspaceId);

    return {
      id: credential.id,
      name: credential.name,
      provider: credential.provider,
      client_id: credential.clientId,
      client_secret: '***',
      scopes: credential.scopes,
      is_active: credential.isActive,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update integration credential' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCredentialDto>,
    @CurrentWorkspace() workspaceId: string,
  ) {
    // Ensure the user has access to this credential (optional but recommended)
    // We could pass workspaceId to update to verify ownership
    const credential = await this.integrationsService.update(
      id,
      dto,
      workspaceId,
    );

    return {
      id: credential.id,
      name: credential.name,
      provider: credential.provider,
      client_id: credential.clientId,
      client_secret: '***',
      scopes: credential.scopes,
      is_active: credential.isActive,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete integration credential' })
  async delete(
    @Param('id') id: string,
    @CurrentWorkspace() workspaceId: string,
  ) {
    await this.integrationsService.delete(id, workspaceId);
    return { success: true };
  }
}
