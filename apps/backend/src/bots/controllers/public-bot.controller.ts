import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { Public } from '../../utils/public.decorator';
import { PublicBotService } from '../services/public-bot.service';
import {
  CreatePublicConversationDto,
  AddPublicMessageDto,
  BotConfigResponseDto,
  CreateConversationResponseDto,
  MessageResponseDto,
  ConversationMessagesResponseDto,
} from '../dto/public-bot.dto';

@ApiTags('Public Bot API')
@Controller({ path: 'public/bots', version: '1' })
@Public()
export class PublicBotController {
  constructor(private readonly publicBotService: PublicBotService) {}

  @Get(':botId/config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get bot widget configuration',
    description:
      'Retrieve bot configuration for embedding widget. No authentication required. Optionally specify version.',
  })
  @ApiParam({
    name: 'botId',
    type: 'string',
    description: 'Bot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'version',
    type: 'string',
    description: 'Widget version (optional, defaults to active version)',
    required: false,
    example: '1.0.0',
  })
  @ApiQuery({
    name: 'versionId',
    type: 'string',
    description: 'Widget version ID (optional, takes precedence over version)',
    required: false,
  })
  @ApiHeader({
    name: 'Origin',
    description: 'Origin of the request for CORS validation',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Bot configuration retrieved successfully',
    type: BotConfigResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Bot not found or widget is disabled',
  })
  @ApiResponse({
    status: 403,
    description: 'Origin not allowed',
  })
  async getBotConfig(
    @Param('botId') botId: string,
    @Headers('origin') origin?: string,
    @Query('version') version?: string,
    @Query('versionId') versionId?: string,
  ): Promise<BotConfigResponseDto> {
    return this.publicBotService.getBotConfig(
      botId,
      origin,
      version,
      versionId,
    );
  }

  @Post(':botId/conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new conversation',
    description:
      'Create a new conversation for the widget. No authentication required.',
  })
  @ApiParam({
    name: 'botId',
    type: 'string',
    description: 'Bot ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiHeader({
    name: 'Origin',
    description: 'Origin of the request for CORS validation',
    required: false,
  })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
    type: CreateConversationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Bot not found or widget is disabled',
  })
  @ApiResponse({
    status: 403,
    description: 'Origin not allowed',
  })
  async createConversation(
    @Param('botId') botId: string,
    @Body() dto: CreatePublicConversationDto,
    @Headers('origin') origin?: string,
  ): Promise<CreateConversationResponseDto> {
    return this.publicBotService.createConversation(botId, dto, origin);
  }

  @Post('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send message to bot',
    description:
      'Send a message to the bot and receive AI response. No authentication required.',
  })
  @ApiParam({
    name: 'conversationId',
    type: 'string',
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Message sent and response received',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Bot is not available',
  })
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() dto: AddPublicMessageDto,
  ): Promise<MessageResponseDto> {
    return this.publicBotService.sendMessage(conversationId, dto);
  }

  @Get('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get conversation messages',
    description:
      'Retrieve messages in a conversation with pagination support. No authentication required.',
  })
  @ApiParam({
    name: 'conversationId',
    type: 'string',
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to retrieve (default: 50)',
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
    description: 'Message ID to get messages before (for pagination)',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: ConversationMessagesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ): Promise<ConversationMessagesResponseDto> {
    return this.publicBotService.getMessages(conversationId, {
      limit: limit ? Number(limit) : 50,
      before,
    });
  }
}
