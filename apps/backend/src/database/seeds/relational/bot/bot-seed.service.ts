import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from '../../../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { WorkspaceEntity } from '../../../../workspaces/infrastructure/persistence/relational/entities/workspace.entity';

@Injectable()
export class BotSeedService {
  constructor(
    @InjectRepository(BotEntity)
    private repository: Repository<BotEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(WorkspaceEntity)
    private workspaceRepository: Repository<WorkspaceEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();

    if (count > 0) {
      console.log('ℹ️ Bots already exist, skipping seed');
      return;
    }

    const bots = [
      {
        name: 'Customer Support Assistant',
        description:
          'AI-powered customer service bot for handling common inquiries and support tickets',
        isActive: true,
        configuration: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt:
            'You are a helpful customer service assistant. Always be polite and professional.',
          welcomeMessage: 'Hello! How can I help you today?',
          fallbackMessage:
            "I apologize, but I'm having trouble understanding. Could you please rephrase?",
          handoffThreshold: 0.3,
        },
        metadata: {
          category: 'customer-service',
          tags: ['support', 'customer-service', 'helpdesk'],
          version: '1.0.0',
        },
      },
      {
        name: 'Sales Assistant',
        description:
          'Intelligent sales bot that helps customers find products and complete purchases',
        isActive: true,
        configuration: {
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 1500,
          systemPrompt:
            'You are a friendly sales assistant. Help customers find the right products and guide them through the purchase process.',
          welcomeMessage:
            "Welcome! I'm here to help you find the perfect product. What are you looking for?",
          fallbackMessage:
            'Let me connect you with a human sales expert who can better assist you.',
          handoffThreshold: 0.4,
        },
        metadata: {
          category: 'sales',
          tags: ['sales', 'ecommerce', 'products'],
          version: '1.1.0',
        },
      },
      {
        name: 'Technical Support Bot',
        description:
          'Specialized bot for technical troubleshooting and product support',
        isActive: true,
        configuration: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 2500,
          systemPrompt:
            'You are a technical support specialist. Provide accurate technical information and step-by-step troubleshooting guides.',
          welcomeMessage:
            'Technical Support here! What technical issue can I help you resolve today?',
          fallbackMessage:
            'This requires specialized technical knowledge. Let me transfer you to our technical team.',
          handoffThreshold: 0.2,
        },
        metadata: {
          category: 'technical-support',
          tags: ['technical', 'troubleshooting', 'it-support'],
          version: '2.0.0',
        },
      },
      {
        name: 'Lead Generation Bot',
        description:
          'Marketing bot designed to capture leads and qualify potential customers',
        isActive: true,
        configuration: {
          model: 'gpt-4',
          temperature: 0.6,
          maxTokens: 1000,
          systemPrompt:
            'You are a lead generation specialist. Qualify leads and collect relevant information while building rapport.',
          welcomeMessage:
            "Hi there! I'd love to learn more about your needs and see how we can help.",
          fallbackMessage:
            'Let me get one of our sales specialists to better understand your requirements.',
          handoffThreshold: 0.5,
        },
        metadata: {
          category: 'marketing',
          tags: ['lead-generation', 'marketing', 'sales-qualification'],
          version: '1.2.0',
        },
      },
      {
        name: 'FAQ Bot',
        description:
          'Knowledge base bot that answers frequently asked questions instantly',
        isActive: true,
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.1,
          maxTokens: 800,
          systemPrompt:
            'You are an FAQ bot. Provide concise, accurate answers based on our knowledge base.',
          welcomeMessage:
            'Hello! I can answer your frequently asked questions. What would you like to know?',
          fallbackMessage:
            "I don't have information about that. Let me find someone who can help.",
          handoffThreshold: 0.6,
        },
        metadata: {
          category: 'knowledge-base',
          tags: ['faq', 'knowledge', 'self-service'],
          version: '1.0.0',
        },
      },
      {
        name: 'Order Tracking Bot',
        description:
          'Specialized bot for tracking orders, returns, and delivery status',
        isActive: true,
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.2,
          maxTokens: 600,
          systemPrompt:
            'You are an order tracking specialist. Help customers track orders, process returns, and provide delivery updates.',
          welcomeMessage:
            "I can help you track your order and process returns. What's your order number?",
          fallbackMessage:
            'Let me connect you with our order specialist for detailed assistance.',
          handoffThreshold: 0.3,
        },
        metadata: {
          category: 'logistics',
          tags: ['orders', 'tracking', 'returns', 'delivery'],
          version: '1.5.0',
        },
      },
      {
        name: 'Appointment Scheduling Bot',
        description:
          'Calendar integration bot for scheduling appointments and managing bookings',
        isActive: false, // Under maintenance
        configuration: {
          model: 'gpt-4',
          temperature: 0.4,
          maxTokens: 1200,
          systemPrompt:
            'You are an appointment scheduling assistant. Help customers book, reschedule, or cancel appointments.',
          welcomeMessage:
            'I can help you schedule an appointment. What type of service do you need?',
          fallbackMessage:
            'Let me transfer you to our scheduling team for complex requests.',
          handoffThreshold: 0.4,
        },
        metadata: {
          category: 'scheduling',
          tags: ['appointments', 'booking', 'calendar'],
          version: '2.1.0',
        },
      },
      {
        name: 'Feedback Collection Bot',
        description:
          'Survey bot for collecting customer feedback and satisfaction ratings',
        isActive: true,
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          maxTokens: 1000,
          systemPrompt:
            'You are a feedback collection specialist. Gather customer feedback in a friendly and professional manner.',
          welcomeMessage:
            "We'd love to hear your feedback! Can you share your experience with us?",
          fallbackMessage:
            'Thank you for your time. Your feedback is valuable to us.',
          handoffThreshold: 0.7,
        },
        metadata: {
          category: 'feedback',
          tags: ['feedback', 'surveys', 'satisfaction'],
          version: '1.3.0',
        },
      },
    ];

    const daysAgo = 60;
    const now = new Date();

    // Fetch first 5 active users to seed data for (prevent excessive data creation)
    const users = await this.userRepository.find({
      where: { isActive: true },
      take: 5,
    });

    if (users.length === 0) {
      console.log('skipping bot seed (no users)');
      return;
    }

    for (const user of users) {
      const workspace = await this.workspaceRepository.findOne({
        where: { ownerId: user.id },
      });

      if (!workspace) {
        console.log(
          `skipping bot seed for user ${user.email || user.id} (no workspace)`,
        );
        continue;
      }

      // Create a subset of bots for each user to add variety
      // Admin gets all bots, others get random 3-5 bots
      const userBots =
        user.email && user.email.includes('admin')
          ? bots
          : bots.sort(() => 0.5 - Math.random()).slice(0, 4);

      for (const botData of userBots) {
        const daysOffset = Math.floor(Math.random() * daysAgo);
        const hoursOffset = Math.floor(Math.random() * 24);

        const createdAt = new Date(now);
        createdAt.setDate(createdAt.getDate() - daysOffset);
        createdAt.setHours(createdAt.getHours() - hoursOffset);

        const bot = this.repository.create({
          ...botData,
          workspaceId: workspace.id,
          createdBy: user.id,
          updatedBy: user.id,
          createdAt,
          updatedAt: new Date(),
        });

        await this.repository.save(bot);
      }
      console.log(
        `✅ Seeded ${userBots.length} bots for ${user.email} in workspace ${workspace.name}`,
      );
    }

    console.log('✅ Bots seeded successfully for all test users');
  }
}
