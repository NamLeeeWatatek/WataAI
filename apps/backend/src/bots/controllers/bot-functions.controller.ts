import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BotFunctionsService } from '../bot-functions.service';
import { CreateBotFunctionDto } from '../dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from '../dto/update-bot-function.dto';
import { ExecuteBotFunctionDto } from '../dto/execute-bot-function.dto';

import { WorkspaceAccessGuard } from '../../workspaces/guards/workspace-access.guard';

@ApiTags('Bot Functions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'bots/:id/functions', version: '1' })
export class BotFunctionsController {
  constructor(private readonly botFunctionsService: BotFunctionsService) { }

  @Post()
  @ApiOperation({ summary: 'Create bot function' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  createFunction(
    @Param('id') botId: string,
    @Body() createDto: CreateBotFunctionDto,
  ) {
    return this.botFunctionsService.create({ ...createDto, botId });
  }

  @Get()
  @ApiOperation({ summary: 'Get all bot functions' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  findAllFunctions(@Param('id') botId: string) {
    return this.botFunctionsService.findAll(botId);
  }

  @Get(':functionId')
  @ApiOperation({ summary: 'Get bot function by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'functionId', type: String, description: 'Function ID' })
  findOneFunction(@Param('functionId') functionId: string) {
    return this.botFunctionsService.findOne(functionId);
  }

  @Patch(':functionId')
  @ApiOperation({ summary: 'Update bot function' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'functionId', type: String, description: 'Function ID' })
  updateFunction(
    @Param('functionId') functionId: string,
    @Body() updateDto: UpdateBotFunctionDto,
  ) {
    return this.botFunctionsService.update(functionId, updateDto);
  }

  @Delete(':functionId')
  @ApiOperation({ summary: 'Delete bot function' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  @ApiParam({ name: 'functionId', type: String, description: 'Function ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFunction(@Param('functionId') functionId: string) {
    return this.botFunctionsService.remove(functionId);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Execute bot function' })
  @ApiParam({ name: 'id', type: String, description: 'Bot ID' })
  executeFunction(
    @Param('id') botId: string,
    @Body() executeDto: ExecuteBotFunctionDto,
  ) {
    return this.botFunctionsService.execute(executeDto);
  }
}
