import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  ConversationEntity,
  MessageEntity,
} from '../../../../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import { BotEntity } from '../../../../bots/infrastructure/persistence/relational/entities/bot.entity';
import {
  ConversationStatus,
  MessageRole,
  ConversationSource,
} from '../../../../conversations/conversations.enum';

@Injectable()
export class ConversationSeedService {
  constructor(
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
  ) {}

  async run() {
    const count = await this.conversationRepository.count();

    if (count > 0) {
      console.log('ℹ️ Conversations already exist, skipping seed');
      return;
    }

    const bots = await this.botRepository.find({ take: 5 });

    if (bots.length === 0) {
      console.log('ℹ️ No bots found, skipping conversation seeds');
      return;
    }

    const contactNames = [
      'John Smith',
      'Emily Johnson',
      'Michael Brown',
      'Sarah Davis',
      'David Wilson',
      'Lisa Anderson',
      'James Taylor',
      'Maria Garcia',
      'Robert Martinez',
      'Jennifer Lee',
      'William White',
      'Linda Harris',
      'Richard Clark',
      'Patricia Lewis',
      'Charles Walker',
      'Barbara Hall',
      'Joseph Allen',
      'Susan Young',
      'Thomas King',
      'Jessica Wright',
      'Christopher Scott',
      'Nancy Green',
      'Daniel Baker',
      'Karen Adams',
      'Matthew Nelson',
      'Betty Hill',
      'Anthony Campbell',
      'Helen Mitchell',
      'Mark Roberts',
      'Dorothy Carter',
    ];

    const sampleQuestions = [
      'Hello, I need help with my order',
      'What are your business hours?',
      'Can you help me track my package?',
      "I'd like to return an item",
      'Do you have this in stock?',
      "What's your refund policy?",
      'How long does shipping take?',
      'Can I speak to a human agent?',
      'I have a technical issue',
      'What payment methods do you accept?',
      'Is there a discount available?',
      'Can you help me reset my password?',
      'I need to update my account information',
      "What's the status of my order?",
      'Do you offer international shipping?',
      'How can I contact customer support?',
      'I have a question about your products',
      'Can you help me with billing?',
      "What's your warranty policy?",
      'I need to cancel my subscription',
    ];

    const botResponses = [
      "I'd be happy to help you with that! Let me check your order details.",
      'Our business hours are Monday-Friday 9AM-6PM EST. How can I assist you today?',
      'I can definitely help you track your package. Could you provide your order number?',
      "I understand you'd like to return an item. Let me guide you through the process.",
      'Let me check our inventory system for you. What item are you looking for?',
      'Our refund policy allows returns within 30 days of purchase. Would you like more details?',
      'Standard shipping takes 3-5 business days. We also offer express shipping options.',
      'I can connect you with a human agent right away. Let me transfer you.',
      "I'm sorry you're experiencing a technical issue. Let me help you resolve this.",
      'We accept all major credit cards, PayPal, and Apple Pay. What works best for you?',
      'I can check for available discounts. Are you a first-time customer?',
      'I can help you reset your password. Let me send you a secure link.',
      'I can help you update your account information. What would you like to change?',
      'Let me check the status of your order. Could you provide your order number?',
      'Yes, we ship to over 50 countries worldwide. Where would you like it shipped?',
      "You can reach our support team via phone, email, or live chat. What's your preference?",
      "I'd be happy to answer any questions about our products. What would you like to know?",
      'I can help you with any billing questions or concerns. What seems to be the issue?',
      'We offer a comprehensive warranty on all products. What specific coverage are you asking about?',
      'I can help you cancel your subscription. Let me verify your account information first.',
    ];

    // Create conversations over the last 90 days
    const daysAgo = 90;
    const now = new Date();

    for (let i = 0; i < 150; i++) {
      const daysOffset = Math.floor(Math.random() * daysAgo);
      const hoursOffset = Math.floor(Math.random() * 24);
      const minutesOffset = Math.floor(Math.random() * 60);

      const createdAt = new Date(now);
      createdAt.setDate(createdAt.getDate() - daysOffset);
      createdAt.setHours(createdAt.getHours() - hoursOffset);
      createdAt.setMinutes(createdAt.getMinutes() - minutesOffset);

      const bot = bots[Math.floor(Math.random() * bots.length)];
      const contactName =
        contactNames[Math.floor(Math.random() * contactNames.length)];
      const status =
        Math.random() > 0.3
          ? ConversationStatus.CLOSED
          : ConversationStatus.ACTIVE;

      const lastMessageAt =
        status === 'closed'
          ? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) // within 24 hours
          : new Date(
              createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000,
            ); // within 7 days

      const conversation = this.conversationRepository.create({
        botId: bot.id,
        workspaceId: bot.workspaceId,
        channelType: ConversationSource.WEB,
        status,
        metadata: {
          source: ConversationSource.WEB,
          contactName,
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`,
        },
        lastMessageAt,
        createdAt,
        updatedAt: lastMessageAt,
      });

      const savedConversation =
        await this.conversationRepository.save(conversation);
      const conversationId = Array.isArray(savedConversation)
        ? savedConversation[0]?.id
        : savedConversation.id;
      const conversationCreatedAt = Array.isArray(savedConversation)
        ? savedConversation[0]?.createdAt
        : savedConversation.createdAt;

      // Create messages for this conversation
      const messageCount = Math.floor(Math.random() * 8) + 2; // 2-10 messages per conversation
      const messages: MessageEntity[] = [];

      let currentTime = new Date(conversationCreatedAt || new Date());

      for (let j = 0; j < messageCount; j++) {
        const isUserMessage = j % 2 === 0;
        const timeGap = Math.random() * 30 * 60 * 1000; // 0-30 minutes between messages

        currentTime = new Date(currentTime.getTime() + timeGap);

        const content = isUserMessage
          ? sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)]
          : botResponses[Math.floor(Math.random() * botResponses.length)];

        const message = this.messageRepository.create({
          conversationId: conversationId,
          workspaceId: bot.workspaceId,
          role: isUserMessage ? MessageRole.USER : MessageRole.ASSISTANT,
          content,
          metadata: {
            timestamp: currentTime.toISOString(),
            confidence: isUserMessage ? 1.0 : 0.85 + Math.random() * 0.15,
          },
          sentAt: currentTime,
        });

        messages.push(message);
      }

      await this.messageRepository.save(messages);
    }

    console.log('✅ Conversations seeded successfully');
  }
}
