import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
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
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionsService } from './subscriptions.service';
import { Plan, Subscription, UsageQuota, Invoice } from './domain/subscription';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'subscriptions', version: '1' })
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all plans' })
  @ApiOkResponse({ type: [Plan] })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiOkResponse({ type: Plan })
  @ApiParam({ name: 'id', type: String })
  getPlan(@Param('id') id: string) {
    return this.subscriptionsService.getPlan(id);
  }

  @Get('workspace/:workspaceId')
  @ApiOperation({ summary: 'Get workspace subscription' })
  @ApiOkResponse({ type: Subscription })
  @ApiParam({ name: 'workspaceId', type: String })
  getSubscription(@Param('workspaceId') workspaceId: string) {
    return this.subscriptionsService.getSubscription(workspaceId);
  }

  @Post('workspace/:workspaceId')
  @ApiOperation({ summary: 'Create subscription' })
  @ApiCreatedResponse({ type: Subscription })
  @ApiParam({ name: 'workspaceId', type: String })
  @HttpCode(HttpStatus.CREATED)
  createSubscription(
    @Param('workspaceId') workspaceId: string,
    @Body()
    body: {
      planId: string;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    },
  ) {
    return this.subscriptionsService.createSubscription({
      workspaceId,
      ...body,
    });
  }

  @Patch('workspace/:workspaceId/plan')
  @ApiOperation({ summary: 'Change subscription plan' })
  @ApiOkResponse({ type: Subscription })
  @ApiParam({ name: 'workspaceId', type: String })
  changePlan(
    @Param('workspaceId') workspaceId: string,
    @Body() body: { planId: string },
  ) {
    return this.subscriptionsService.changePlan(workspaceId, body.planId);
  }

  @Post('workspace/:workspaceId/cancel')
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiOkResponse({ type: Subscription })
  @ApiParam({ name: 'workspaceId', type: String })
  cancelSubscription(@Param('workspaceId') workspaceId: string) {
    return this.subscriptionsService.cancelSubscription(workspaceId);
  }

  @Get('workspace/:workspaceId/quota')
  @ApiOperation({ summary: 'Get workspace usage quota' })
  @ApiOkResponse({ type: UsageQuota })
  @ApiParam({ name: 'workspaceId', type: String })
  getQuota(@Param('workspaceId') workspaceId: string) {
    return this.subscriptionsService.getQuota(workspaceId);
  }

  @Get('workspace/:workspaceId/quota/check')
  @ApiOperation({ summary: 'Check if workspace is within quota limits' })
  @ApiParam({ name: 'workspaceId', type: String })
  checkQuotaLimit(@Param('workspaceId') workspaceId: string) {
    return this.subscriptionsService.checkQuotaLimit(workspaceId);
  }

  @Get('workspace/:workspaceId/invoices')
  @ApiOperation({ summary: 'Get workspace invoices' })
  @ApiOkResponse({ type: [Invoice] })
  @ApiParam({ name: 'workspaceId', type: String })
  getInvoices(@Param('workspaceId') workspaceId: string) {
    return this.subscriptionsService.getInvoices(workspaceId);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiOkResponse({ type: Invoice })
  @ApiParam({ name: 'id', type: String })
  getInvoice(@Param('id') id: string) {
    return this.subscriptionsService.getInvoice(id);
  }
}
