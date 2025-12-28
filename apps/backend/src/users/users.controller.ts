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
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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
import { QueryUserDto } from './dto/query-user.dto';
import { User } from './domain/user';
import { UsersService } from './users.service';
import { infinityPagination } from '../utils/infinity-pagination';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse({ type: User })
  @ApiOperation({ summary: 'Create new user (Admin only)' })
  @SerializeOptions({ groups: ['admin'] })
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @ApiOkResponse({ type: InfinityPaginationResponse(User) })
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  @SerializeOptions({ groups: ['admin'] })
  @Roles('admin')
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: QueryUserDto,
  ): Promise<InfinityPaginationResponseDto<User>> {
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const [data, total] = await this.usersService.findManyWithPagination({
      filterOptions: query?.filters,
      sortOptions: query?.sort,
      paginationOptions: { page, limit },
    });

    return infinityPagination(data, { page, limit }, total);
  }

  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @SerializeOptions({ groups: ['admin'] })
  @Roles('admin')
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  findOne(@Param('id') id: User['id']): Promise<NullableType<User>> {
    return this.usersService.findById(id);
  }

  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @SerializeOptions({ groups: ['admin'] })
  @Roles('admin')
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  update(
    @Param('id') id: User['id'],
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @Roles('admin')
  @Delete(':id')
  @ApiParam({ name: 'id', type: String, required: true })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: User['id']): Promise<void> {
    return this.usersService.remove(id);
  }

  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Verify user email (Admin only)' })
  @Roles('admin')
  @Post(':id/verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  verifyEmail(@Param('id') id: User['id']): Promise<User | null> {
    return this.usersService.verifyEmail(id);
  }

  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Deactivate user (Admin only)' })
  @Roles('admin')
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  deactivate(@Param('id') id: User['id']): Promise<User | null> {
    return this.usersService.deactivate(id);
  }

  @ApiOkResponse({ type: User })
  @ApiOperation({ summary: 'Activate user (Admin only)' })
  @Roles('admin')
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, required: true })
  activate(@Param('id') id: User['id']): Promise<User | null> {
    return this.usersService.activate(id);
  }
}
