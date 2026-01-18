import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class Category {
  @ApiProperty({ type: String })
  @Expose()
  id: string;

  @ApiProperty({ type: String })
  @Expose()
  name: string;

  @ApiProperty({ type: String })
  @Expose()
  slug: string;

  @ApiPropertyOptional({ type: String })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ type: String })
  @Expose()
  icon?: string;

  @ApiProperty({ type: String })
  @Expose()
  type: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional()
  @Expose()
  deletedAt?: Date;
}
