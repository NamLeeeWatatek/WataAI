import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BillingController } from './billing.controller';
import { StripeService } from './stripe.service';
import { PayOSService } from './payos.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule, SubscriptionsModule],
  controllers: [BillingController],
  providers: [StripeService, PayOSService],
  exports: [StripeService, PayOSService],
})
export class BillingModule {}
