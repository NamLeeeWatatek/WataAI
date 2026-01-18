import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * AuditLog domain entity - theo schema má»›i
 * Table: audit_logs
 */
export class AuditLog {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String, example: 'create' })
  action: string;

  @ApiProperty({ type: String, example: 'bot' })
  resourceType: string;

  @ApiProperty({ type: String })
  resourceId: string;

  @ApiPropertyOptional({ type: Object })
  details?: Record<string, any>;

  @ApiPropertyOptional({ type: String })
  ipAddress?: string | null;

  @ApiPropertyOptional({ type: String })
  userAgent?: string | null;

  @ApiProperty()
  createdAt: Date;
}

/**
 * DataAccessLog domain entity - theo schema má»›i
 * Table: data_access_logs
 */
export class DataAccessLog {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  tableName: string;

  @ApiProperty({ type: String })
  recordId: string;

  @ApiProperty({ type: String, enum: ['read', 'write', 'delete'] })
  action: 'read' | 'write' | 'delete';

  @ApiProperty()
  createdAt: Date;
}
