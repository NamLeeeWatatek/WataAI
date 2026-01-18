import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PlanEntity,
  SubscriptionEntity,
  UsageQuotaEntity,
  InvoiceEntity,
} from './infrastructure/persistence/relational/entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanEntity,
      SubscriptionEntity,
      UsageQuotaEntity,
      InvoiceEntity,
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
