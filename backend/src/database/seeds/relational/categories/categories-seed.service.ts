import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/relational/entities/category.entity';

@Injectable()
export class CategoriesSeedService {
  private readonly logger = new Logger(CategoriesSeedService.name);

  constructor(
    @InjectRepository(CategoryEntity)
    private repository: Repository<CategoryEntity>,
  ) {}

  async run() {
    this.logger.log('Seeding Categories...');

    const categories = [
      {
        name: 'Content Creation',
        slug: 'content-creation',
        description: 'Tools for creating various types of content',
        icon: 'PenTool',
        type: 'creation-tool',
      },
      {
        name: 'Marketing',
        slug: 'marketing',
        description: 'Tools for marketing and advertising',
        icon: 'Megaphone',
        type: 'creation-tool',
      },
      {
        name: 'Social Media',
        slug: 'social-media',
        description: 'Tools for social media management and content',
        icon: 'Share2',
        type: 'creation-tool',
      },
      {
        name: 'Productivity',
        slug: 'productivity',
        description: 'Tools to enhance productivity and workflow',
        icon: 'Zap',
        type: 'creation-tool',
      },
      {
        name: 'SEO',
        slug: 'seo',
        description: 'Search Engine Optimization tools',
        icon: 'Search',
        type: 'creation-tool',
      },
      {
        name: 'Video',
        slug: 'video',
        description: 'Video generation and editing tools',
        icon: 'Video',
        type: 'creation-tool',
      },
      {
        name: 'Audio',
        slug: 'audio',
        description: 'Audio generation and processing tools',
        icon: 'Mic',
        type: 'creation-tool',
      },
      {
        name: 'Image',
        slug: 'image',
        description: 'Image generation and editing tools',
        icon: 'Image',
        type: 'creation-tool',
      },
      {
        name: 'Education',
        slug: 'education',
        description: 'Educational and storage tools',
        icon: 'BookOpen',
        type: 'creation-tool',
      },
      {
        name: 'Ads',
        slug: 'ads',
        description: 'Advertising content generation',
        icon: 'Target',
        type: 'creation-tool',
      },
      {
        name: 'Chat',
        slug: 'chat',
        description: 'Chat bots and conversational AI',
        icon: 'MessageSquare',
        type: 'creation-tool',
      },
      {
        name: 'Portrait',
        slug: 'portrait',
        description: 'Portrait generation templates',
        icon: 'User',
        type: 'template',
      },
      {
        name: 'Landscape',
        slug: 'landscape',
        description: 'Landscape generation templates',
        icon: 'Mountain',
        type: 'template',
      },
      {
        name: 'Review',
        slug: 'review',
        description: 'Review and testimonial templates',
        icon: 'Star',
        type: 'template',
      },
      {
        name: 'Others',
        slug: 'others',
        description: 'Other miscellaneous tools',
        icon: 'MoreHorizontal',
        type: 'creation-tool',
      },
    ];

    for (const category of categories) {
      await this.createOrUpdateCategory(category);
    }

    this.logger.log('✅ Categories seeded successfully');
  }

  private async createOrUpdateCategory(data: Partial<CategoryEntity>) {
    const existing = await this.repository.findOne({
      where: {
        slug: data.slug,
        type: data.type,
      },
    });

    if (existing) {
      return existing;
    }

    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }
}
