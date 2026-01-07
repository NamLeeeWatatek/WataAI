import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConversationHistoryItem {
    @ApiProperty({ enum: ['user', 'assistant'] })
    @IsIn(['user', 'assistant'])
    role: 'user' | 'assistant';

    @ApiProperty()
    @IsString()
    content: string;
}

export class ChatWithKnowledgeBaseDto {
    @ApiProperty()
    @IsString()
    message: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    botId?: string;

    @ApiPropertyOptional({ type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    knowledgeBaseIds?: string[];

    @ApiPropertyOptional({ type: [ConversationHistoryItem] })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ConversationHistoryItem)
    conversationHistory?: ConversationHistoryItem[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    model?: string;
}
