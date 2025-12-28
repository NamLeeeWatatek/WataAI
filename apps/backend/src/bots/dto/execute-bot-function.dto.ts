import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

export class ExecuteBotFunctionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsString()
  functionId: string;

  @ApiProperty({
    example: {
      field: 'email',
      context: 'User registration form',
      currentValue: 'john@',
    },
  })
  @IsNotEmpty()
  @IsObject()
  input: Record<string, any>;

  @ApiPropertyOptional({
    example: {
      conversationId: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174000',
    },
  })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
