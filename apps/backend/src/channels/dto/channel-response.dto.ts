import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class ChannelPageDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  category: string;

  @ApiPropertyOptional({ type: [String] })
  @Expose()
  tasks?: string[];
}

export class ChannelMetadataDto {
  @ApiPropertyOptional()
  @Expose()
  botId?: string;

  @ApiPropertyOptional()
  @Expose()
  pageId?: string;

  @ApiPropertyOptional()
  @Expose()
  pageName?: string;

  @ApiPropertyOptional()
  @Expose()
  accountId?: string;

  @ApiPropertyOptional()
  @Expose()
  accountName?: string;

  @ApiPropertyOptional()
  @Expose()
  connectedBy?: string;

  @ApiPropertyOptional({ type: [String] })
  @Expose()
  tasks?: string[];

  @ApiPropertyOptional()
  @Expose()
  category?: string;

  @ApiPropertyOptional({ type: [ChannelPageDto] })
  @Expose()
  @Type(() => ChannelPageDto)
  pages?: ChannelPageDto[];

  // Explicitly exclude sensitive or redundant fields that might exist in the raw JSON
  @Exclude()
  userAccessToken?: string;
}

export class ChannelResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  type: string;

  @ApiProperty()
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  connected_at: Date;

  @ApiProperty({ type: ChannelMetadataDto })
  @Expose()
  @Type(() => ChannelMetadataDto)
  metadata: ChannelMetadataDto;
}
