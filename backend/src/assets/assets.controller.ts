import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AssetsService } from './assets.service';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import { CurrentWorkspace } from '../workspaces/decorators/current-workspace.decorator';
import { infinityPagination } from '../utils/infinity-pagination';
import { Asset } from './domain/asset';

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({
  path: 'assets',
  version: '1',
})
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @CurrentWorkspace() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ?? 1;
    let limitNum = limit ?? 10;
    if (limitNum > 50) {
      limitNum = 50;
    }

    const result = await this.assetsService.findAllWithPagination({
      paginationOptions: {
        page: pageNum,
        limit: limitNum,
      },
      workspaceId,
      type,
      search,
    });

    return infinityPagination(
      result.data,
      { page: pageNum, limit: limitNum },
      result.count,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }
}
