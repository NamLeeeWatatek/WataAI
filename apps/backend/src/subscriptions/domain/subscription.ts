import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Plan domain entity - theo schema má»›i
 * Table: plans
 */
export class Plan {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number })
  priceMonthly: number;

  @ApiProperty({ type: Number })
  priceYearly: number;

  @ApiProperty({ type: Number })
  maxBots: number;

  @ApiProperty({ type: Number })
  maxMessages: number;

  @ApiProperty({ type: Number })
  maxStorageGb: number;

  @ApiPropertyOptional({ type: Object })
  features?: Record<string, any>;
}

/**
 * Subscription domain entity - theo schema má»›i
 * Table: subscriptions
 */
export class Subscription {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  planId: string;

  @ApiProperty({
    type: String,
    enum: ['active', 'canceled', 'past_due', 'trialing'],
  })
  status: 'active' | 'canceled' | 'past_due' | 'trialing';

  @ApiProperty({ type: Date })
  currentPeriodEnd: Date;

  @ApiPropertyOptional({ type: String })
  stripeCustomerId?: string | null;

  @ApiPropertyOptional({ type: String })
  stripeSubscriptionId?: string | null;

  @ApiProperty()
  createdAt: Date;
}

/**
 * UsageQuota domain entity - theo schema má»›i
 * Table: usage_quotas
 */
export class UsageQuota {
  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: Date })
  periodStart: Date;

  @ApiProperty({ type: Number })
  messagesUsed: number;

  @ApiProperty({ type: Number })
  storageUsedGb: number;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Invoice domain entity - theo schema má»›i
 * Table: invoices
 */
export class Invoice {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  workspaceId: string;

  @ApiProperty({ type: String })
  subscriptionId: string;

  @ApiProperty({ type: Number })
  amount: number;

  @ApiProperty({
    type: String,
    enum: ['draft', 'open', 'paid', 'void', 'uncollectible'],
  })
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

  @ApiPropertyOptional({ type: String })
  pdfUrl?: string | null;

  @ApiProperty({ type: Date })
  periodStart: Date;

  @ApiProperty({ type: Date })
  periodEnd: Date;

  @ApiProperty()
  createdAt: Date;
}
