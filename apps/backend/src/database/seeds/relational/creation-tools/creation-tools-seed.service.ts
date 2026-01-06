import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreationToolEntity } from '../../../../creation-tools/infrastructure/persistence/relational/entities/creation-tool.entity';
import { TemplateEntity } from '../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { DeepPartial } from 'typeorm';

@Injectable()
export class CreationToolsSeederService {
  private readonly logger = new Logger(CreationToolsSeederService.name);

  constructor(
    @InjectRepository(CreationToolEntity)
    private creationToolRepository: Repository<CreationToolEntity>,
    @InjectRepository(TemplateEntity)
    private templateRepository: Repository<TemplateEntity>,
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
  ) {}

  async run() {
    this.logger.log('Seeding Creation Tools...');

    // 1. Create Image Tool
    const createImageTool = await this.createOrUpdateTool({
      name: 'Create Image',
      slug: 'create-image',
      description: 'Generate stunning AI images from text descriptions',
      icon: 'ImageIcon',
      category: 'content-creation',
      sortOrder: 1,
      formConfig: {
        fields: [
          {
            name: 'prompt',
            type: 'textarea',
            label: 'Image Description',
            placeholder: 'Describe the image you want to create...',
            description: 'Be specific and detailed for best results',
            validation: { required: true, minLength: 10, maxLength: 500 },
          },
          {
            name: 'style',
            type: 'select',
            label: 'Art Style',
            options: [
              { label: 'Realistic', value: 'realistic' },
              { label: 'Digital Art', value: 'digital-art' },
              { label: 'Oil Painting', value: 'oil-painting' },
              { label: 'Anime', value: 'anime' },
              { label: '3D Render', value: '3d-render' },
            ],
            defaultValue: 'realistic',
          },
          {
            name: 'aspectRatio',
            type: 'radio',
            label: 'Aspect Ratio',
            options: [
              { label: 'Square (1:1)', value: '1:1' },
              { label: 'Portrait (3:4)', value: '3:4' },
              { label: 'Landscape (16:9)', value: '16:9' },
            ],
            defaultValue: '1:1',
          },
          {
            name: 'quality',
            type: 'slider',
            label: 'Quality',
            validation: { min: 1, max: 10 },
            defaultValue: 7,
          },
        ],
        submitLabel: 'Generate Image',
      },
      executionFlow: {
        type: 'ai-generation',
        provider: 'replicate',
        model: 'stability-ai/sdxl',
        outputType: 'image',
      },
      isActive: true, // TypeORM default is true but explicit here
    });

    // 2. Create Video Tool
    await this.createOrUpdateTool({
      name: 'Create Video',
      slug: 'create-video',
      description: 'Transform images into dynamic videos with AI',
      icon: 'VideoIcon',
      category: 'content-creation',
      sortOrder: 2,
      formConfig: {
        fields: [
          {
            name: 'sourceImage',
            type: 'file',
            label: 'Source Image',
            placeholder: 'Upload an image to animate',
            validation: { required: true },
          },
          {
            name: 'motion',
            type: 'select',
            label: 'Motion Type',
            options: [
              { label: 'Zoom In', value: 'zoom-in' },
              { label: 'Pan Left', value: 'pan-left' },
              { label: 'Pan Right', value: 'pan-right' },
              { label: 'Rotate', value: 'rotate' },
            ],
            defaultValue: 'zoom-in',
          },
          {
            name: 'duration',
            type: 'number',
            label: 'Duration (seconds)',
            validation: { min: 3, max: 30 },
            defaultValue: 5,
          },
        ],
        submitLabel: 'Create Video',
      },
      executionFlow: {
        type: 'ai-generation',
        provider: 'runway',
        model: 'gen-2',
        outputType: 'video',
      },
      isActive: true,
    });

    // 3. Create UGC Video Tool
    const createUgcTool = await this.createOrUpdateTool({
      name: 'Create UGC Video',
      slug: 'create-ugc-video',
      description:
        'Create professional user-generated content videos with AI avatars',
      icon: 'UserIcon',
      category: 'marketing',
      sortOrder: 3,
      formConfig: {
        fields: [
          {
            name: 'script',
            type: 'textarea',
            label: 'Video Script',
            placeholder: 'Enter your video script here...',
            description: 'The text that will be spoken in the video',
            validation: { required: true, maxLength: 1000 },
          },
          {
            name: 'avatar',
            type: 'select',
            label: 'Avatar',
            options: [
              { label: 'Sarah - Professional', value: 'sarah' },
              { label: 'John - Casual', value: 'john' },
              { label: 'Emma - Energetic', value: 'emma' },
            ],
            defaultValue: 'sarah',
          },
          {
            name: 'voice',
            type: 'select',
            label: 'Voice',
            options: [
              { label: 'Female - Professional', value: 'female-pro' },
              { label: 'Male - Friendly', value: 'male-friendly' },
              { label: 'Female - Energetic', value: 'female-energetic' },
            ],
            defaultValue: 'female-pro',
          },
          {
            name: 'background',
            type: 'select',
            label: 'Background',
            options: [
              { label: 'Office', value: 'office' },
              { label: 'Living Room', value: 'living-room' },
              { label: 'Studio', value: 'studio' },
              { label: 'Custom Image', value: 'custom' },
            ],
            defaultValue: 'office',
          },
          {
            name: 'backgroundImage',
            type: 'file',
            label: 'Custom Background',
            showIf: {
              field: 'background',
              operator: 'equals',
              value: 'custom',
            },
          },
          {
            name: 'music',
            type: 'checkbox',
            label: 'Add Background Music',
            defaultValue: false,
          },
        ],
        submitLabel: 'Generate UGC Video',
      },
      executionFlow: {
        type: 'bot-execution',
        provider: 'heygen',
        outputType: 'video',
      },
      isActive: true,
    });

    // 4. Create n8n UGC Video Ads Tool
    const createN8nUgcTool = await this.createOrUpdateTool({
      name: 'UGC Video Ads (n8n)',
      slug: 'n8n-ugc-video-ads',
      description:
        'Generate video ads from product images and prompts via n8n workflow.',
      icon: 'VideoIcon',
      category: 'marketing',
      sortOrder: 4,
      formConfig: {
        fields: [
          {
            name: 'prompt',
            type: 'textarea',
            label: 'Ad Description',
            placeholder: 'Describe the video content, style, and tone...',
            validation: { required: true },
          },
          {
            name: 'images',
            type: 'file',
            label: 'Product Images',
            description: 'Upload product images',
            validation: { required: true },
          },
          {
            name: 'platforms',
            type: 'channel-selector',
            label: 'Target Platform',
            description: 'Select connected channels to publish to',
            validation: { required: true },
            defaultValue: [],
          },
        ],
        submitLabel: 'Generate Ad',
      },
      executionFlow: {
        type: 'n8n-workflow',
        webhookUrl:
          'https://n8n.srv1078465.hstgr.cloud/webhook/wh-generate-video-ugc-ads-autopost-social',
      },
      isActive: true,
    });

    // Create sample templates
    if (createImageTool) {
      await this.createOrUpdateTemplate(createImageTool.id, {
        name: 'Professional Portrait',
        description: 'High-quality professional headshot',
        category: 'portrait',
        thumbnailUrl: 'https://via.placeholder.com/300x300',
        prefilledData: {
          prompt:
            'Professional corporate headshot, studio lighting, business attire, neutral background',
          style: 'realistic',
          aspectRatio: '3:4',
          quality: 9,
        },
        sortOrder: 1,
        isActive: true,
      });

      await this.createOrUpdateTemplate(createImageTool.id, {
        name: 'Fantasy Landscape',
        description: 'Epic fantasy world scenery',
        category: 'landscape',
        thumbnailUrl: 'https://via.placeholder.com/300x300',
        prefilledData: {
          prompt:
            'Epic fantasy landscape with mountains, mystical forests, and magical atmosphere',
          style: 'digital-art',
          aspectRatio: '16:9',
          quality: 8,
        },
        sortOrder: 2,
        isActive: true,
      });
    }

    if (createUgcTool) {
      await this.createOrUpdateTemplate(createUgcTool.id, {
        name: 'Product Review',
        description: 'Template for product review videos',
        category: 'review',
        thumbnailUrl: 'https://via.placeholder.com/300x300',
        prefilledData: {
          script:
            "Hey everyone! Today I'm excited to share my thoughts on this amazing product...",
          avatar: 'sarah',
          voice: 'female-pro',
          background: 'living-room',
          music: true,
        },
        sortOrder: 1,
        isActive: true,
      });

      await this.createOrUpdateTemplate(createUgcTool.id, {
        name: 'Tutorial Intro',
        description: 'Professional tutorial introduction',
        category: 'education',
        thumbnailUrl: 'https://via.placeholder.com/300x300',
        prefilledData: {
          script:
            "Welcome to this tutorial! In this video, I'll show you step-by-step how to...",
          avatar: 'john',
          voice: 'male-friendly',
          background: 'studio',
          music: false,
        },
        sortOrder: 2,
        isActive: true,
      });
    }

    if (createN8nUgcTool) {
      await this.createOrUpdateTemplate(createN8nUgcTool.id, {
        name: 'Standard Facebook Ad',
        description:
          'Create a standard 15s video ad optimized for Facebook Feed.',
        category: 'ads',
        thumbnailUrl: 'https://via.placeholder.com/300x300',
        prefilledData: {
          prompt:
            "Create a 15-second video introducing a luxury women's handbag, daylight, natural style.",
          platforms: 'facebook',
        },
        sortOrder: 1,
        isActive: true,
      });

      await this.createOrUpdateTemplate(createN8nUgcTool.id, {
        name: 'Multi-Platform Campaign',
        description:
          'Generate content suitable for both Facebook and Instagram.',
        category: 'ads',
        thumbnailUrl: 'https://via.placeholder.com/300x300',
        prefilledData: {
          prompt:
            'Viral style video for fashion accessories, fast paced, trendy music.',
          platforms: 'all',
        },
        sortOrder: 2,
        isActive: true,
      });
    }

    this.logger.log('✅ Creation Tools and Templates seeded successfully');
  }

  private async createOrUpdateTool(
    data: Omit<Partial<CreationToolEntity>, 'category'> & { category?: string },
  ): Promise<CreationToolEntity> {
    const existingTool = await this.creationToolRepository.findOne({
      where: { slug: data.slug },
      withDeleted: true,
    });
    if (existingTool) {
      if (existingTool.deletedAt) {
        await this.creationToolRepository.restore(existingTool.id);
      }
      return existingTool;
    }

    let category: CategoryEntity | null = null;
    if (data.category && typeof data.category === 'string') {
      category = await this.categoryRepository.findOne({
        where: { slug: data.category },
      });
    }

    const tool = this.creationToolRepository.create({
      ...data,
      category: category ?? undefined,
    } as DeepPartial<CreationToolEntity>);
    return this.creationToolRepository.save(tool);
  }

  private async createOrUpdateTemplate(
    toolId: string,
    data: Omit<Partial<TemplateEntity>, 'category'> & { category?: string },
  ): Promise<TemplateEntity> {
    const existingTemplate = await this.templateRepository.findOne({
      where: {
        creationToolId: toolId,
        name: data.name,
      },
      withDeleted: true,
    });

    if (existingTemplate) {
      if (existingTemplate.deletedAt) {
        await this.templateRepository.restore(existingTemplate.id);
      }
      return existingTemplate;
    }

    let category: CategoryEntity | null = null;
    if (data.category && typeof data.category === 'string') {
      category = await this.categoryRepository.findOne({
        where: { slug: data.category },
      });
    }

    const template = this.templateRepository.create({
      ...data,
      creationToolId: toolId,
      category: category ?? undefined,
    } as DeepPartial<TemplateEntity>);
    return this.templateRepository.save(template);
  }
}
