import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlanEntity,
  SubscriptionEntity,
  UsageQuotaEntity,
  InvoiceEntity,
} from './infrastructure/persistence/relational/entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(PlanEntity)
    private planRepo: Repository<PlanEntity>,
    @InjectRepository(SubscriptionEntity)
    private subscriptionRepo: Repository<SubscriptionEntity>,
    @InjectRepository(UsageQuotaEntity)
    private quotaRepo: Repository<UsageQuotaEntity>,
    @InjectRepository(InvoiceEntity)
    private invoiceRepo: Repository<InvoiceEntity>,
  ) {}

  async getPlans() {
    return this.planRepo.find({ order: { priceMonthly: 'ASC' } });
  }

  async getPlan(id: string) {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }

  async createPlan(data: Partial<PlanEntity>) {
    const plan = this.planRepo.create(data);
    return this.planRepo.save(plan);
  }

  async getSubscription(workspaceId: string) {
    return this.subscriptionRepo.findOne({
      where: { workspaceId },
      relations: ['plan'],
    });
  }

  async createSubscription(data: {
    workspaceId: string;
    planId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }) {
    const plan = await this.getPlan(data.planId);

    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subscription = this.subscriptionRepo.create({
      workspaceId: data.workspaceId,
      planId: data.planId,
      status: 'active',
      currentPeriodEnd,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
    });

    return this.subscriptionRepo.save(subscription);
  }

  async updateSubscription(
    workspaceId: string,
    data: Partial<SubscriptionEntity>,
  ) {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    Object.assign(subscription, data);
    return this.subscriptionRepo.save(subscription);
  }

  async cancelSubscription(workspaceId: string) {
    return this.updateSubscription(workspaceId, { status: 'canceled' });
  }

  async changePlan(workspaceId: string, newPlanId: string) {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription) throw new NotFoundException('Subscription not found');

    await this.getPlan(newPlanId);
    subscription.planId = newPlanId;

    return this.subscriptionRepo.save(subscription);
  }

  async getQuota(workspaceId: string) {
    const subscription = await this.getSubscription(workspaceId);
    let periodStart: Date;

    if (subscription) {
      // Derive current period start from end date (e.g., end date minus 1 month)
      periodStart = new Date(subscription.currentPeriodEnd);
      periodStart.setMonth(periodStart.getMonth() - 1);
      // Normalize to date-only to match DB column type "date"
      periodStart.setHours(0, 0, 0, 0);
    } else {
      periodStart = this.getCurrentPeriodStart();
    }

    let quota = await this.quotaRepo.findOne({
      where: { workspaceId, periodStart },
    });

    if (!quota) {
      try {
        quota = this.quotaRepo.create({
          workspaceId,
          periodStart,
          messagesUsed: 0,
          storageUsedGb: 0,
        });
        await this.quotaRepo.save(quota);
      } catch (e) {
        // Handle race condition if two requests try to create the same quota entry
        quota = (await this.quotaRepo.findOne({
          where: { workspaceId, periodStart },
        })) as UsageQuotaEntity;
      }
    }

    return quota;
  }

  async incrementMessageUsage(workspaceId: string, count: number = 1) {
    const quota = await this.getQuota(workspaceId);

    // Atomic increment to prevent race conditions
    await this.quotaRepo.increment(
      { workspaceId: quota.workspaceId, periodStart: quota.periodStart },
      'messagesUsed',
      count,
    );

    // No need to save manually, increment() handles it directly in SQL
    return this.getQuota(workspaceId);
  }

  async checkQuotaLimit(workspaceId: string): Promise<{
    withinLimit: boolean;
    messagesUsed: number;
    messagesLimit: number;
    storageUsedGb: number;
    storageLimit: number;
  }> {
    const subscription = await this.getSubscription(workspaceId);
    if (!subscription) {
      // Allow minimal usage for workspaces without subscriptions or fall back to a "Free" plan defaults
      const freePlan = await this.planRepo.findOne({ where: { name: 'Free' } });
      if (!freePlan)
        throw new BadRequestException(
          'No active subscription or default plan found',
        );

      const quota = await this.getQuota(workspaceId);
      return {
        withinLimit: quota.messagesUsed < freePlan.maxMessages,
        messagesUsed: quota.messagesUsed,
        messagesLimit: freePlan.maxMessages,
        storageUsedGb: Number(quota.storageUsedGb),
        storageLimit: freePlan.maxStorageGb,
      };
    }

    const plan = subscription.plan || (await this.getPlan(subscription.planId));
    const quota = await this.getQuota(workspaceId);

    return {
      withinLimit:
        quota.messagesUsed < plan.maxMessages &&
        Number(quota.storageUsedGb) < plan.maxStorageGb,
      messagesUsed: quota.messagesUsed,
      messagesLimit: plan.maxMessages,
      storageUsedGb: Number(quota.storageUsedGb),
      storageLimit: plan.maxStorageGb,
    };
  }

  async getInvoices(workspaceId: string) {
    return this.invoiceRepo.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
  }

  async getInvoice(id: string) {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async createInvoice(data: {
    workspaceId: string;
    subscriptionId: string;
    amount: number;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const invoice = this.invoiceRepo.create({
      ...data,
      status: 'draft',
    });
    return this.invoiceRepo.save(invoice);
  }

  async updateInvoiceStatus(
    id: string,
    status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible',
    pdfUrl?: string,
  ) {
    const invoice = await this.getInvoice(id);
    invoice.status = status;
    if (pdfUrl) invoice.pdfUrl = pdfUrl;
    return this.invoiceRepo.save(invoice);
  }

  private getCurrentPeriodStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
