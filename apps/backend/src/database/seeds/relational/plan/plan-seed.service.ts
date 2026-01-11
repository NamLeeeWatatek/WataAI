import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from '../../../../subscriptions/infrastructure/persistence/relational/entities/subscription.entity';

@Injectable()
export class PlanSeedService {
    constructor(
        @InjectRepository(PlanEntity)
        private repository: Repository<PlanEntity>,
    ) { }

    async run() {
        const plans = [
            {
                name: 'Free',
                priceMonthly: 0,
                priceYearly: 0,
                maxBots: 1,
                maxMessages: 100,
                maxStorageGb: 1,
                stripePriceId: undefined,
                features: {
                    list: ['1 Bot', '100 Messages/mo', '1GB Storage', 'Community Support'],
                },
            },
            {
                name: 'Pro',
                priceMonthly: 29,
                priceYearly: 290,
                maxBots: 5,
                maxMessages: 10000,
                maxStorageGb: 10,
                stripePriceId: 'price_fake_pro_id',
                features: {
                    list: ['5 Bots', '10,000 Messages/mo', '10GB Storage', 'Priority Support'],
                },
            },
            {
                name: 'Enterprise',
                priceMonthly: 99,
                priceYearly: 990,
                maxBots: 20,
                maxMessages: 100000,
                maxStorageGb: 100,
                stripePriceId: 'price_fake_enterprise_id',
                features: {
                    list: [
                        '20 Bots',
                        '100,000 Messages/mo',
                        '100GB Storage',
                        'Dedicated Support',
                        'Custom Integrations',
                    ],
                },
            },
        ];

        for (const planData of plans) {
            const existing = await this.repository.findOne({ where: { name: planData.name } });
            if (existing) {
                await this.repository.save({
                    ...existing,
                    ...planData,
                });
            } else {
                await this.repository.save(this.repository.create(planData));
            }
        }
    }
}
