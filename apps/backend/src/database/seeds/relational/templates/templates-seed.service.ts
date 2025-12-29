import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEntity } from '../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { CategoryEntity } from '../../../../categories/infrastructure/persistence/relational/entities/category.entity';

@Injectable()
export class TemplatesSeedService {
  constructor(
    @InjectRepository(TemplateEntity)
    private readonly templateRepository: Repository<TemplateEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async run() {
    const templates = [
      {
        name: 'Social Media Post Template',
        description:
          'A template for creating engaging social media posts with optimized prompts',
        prompt:
          'Create an engaging social media post about [topic] that includes a compelling headline, engaging copy, relevant hashtags, and a call-to-action. Make it suitable for [platform] with a [tone] tone.',
        category: 'social-media',
        isActive: true,
        inputSchema: [
          {
            name: 'topic',
            label: 'Post Topic',
            type: 'textarea',
            placeholder: 'e.g., New product launch, Industry news...',
            required: true,
          },
          {
            name: 'platform',
            label: 'Platform',
            type: 'select',
            options: [
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'twitter', label: 'Twitter / X' },
              { value: 'instagram', label: 'Instagram' },
              { value: 'facebook', label: 'Facebook' },
            ],
            required: true,
          },
          {
            name: 'tone',
            label: 'Tone',
            type: 'text',
            placeholder: 'e.g., Professional, Casual, Witty...',
            default: 'Professional',
          },
        ],
      },
      {
        name: 'Image Generation Template',
        description:
          'Template for generating creative images with detailed AI prompts',
        prompt:
          'Generate a high-quality image of [subject] in [style] style, with [lighting] lighting, [colors] color scheme, and [additional details]. The image should be [resolution] resolution and suitable for [use case].',
        category: 'image-generation',
        isActive: true,
        promptTemplate:
          'Generate an image of {{subject}} in {{style}} style. Lighting: {{lighting}}. Aspect Ratio: {{aspectRatio}}.',
        inputSchema: [
          {
            name: 'subject',
            label: 'Image Subject',
            type: 'textarea',
            placeholder: 'e.g., A futuristic city with flying cars...',
            required: true,
          },
          {
            name: 'style',
            label: 'Art Style',
            type: 'select',
            options: [
              { value: 'photorealistic', label: 'Photorealistic' },
              { value: 'anime', label: 'Anime/Manga' },
              { value: 'oil-painting', label: 'Oil Painting' },
              { value: 'cyberpunk', label: 'Cyberpunk' },
              { value: 'minimalist', label: 'Minimalist' },
            ],
            required: true,
          },
          {
            name: 'aspectRatio',
            label: 'Aspect Ratio',
            type: 'select',
            options: [
              { value: '1:1', label: 'Square (1:1)' },
              { value: '16:9', label: 'Landscape (16:9)' },
              { value: '9:16', label: 'Portrait (9:16)' },
            ],
            default: '1:1',
          },
          {
            name: 'lighting',
            label: 'Lighting Style',
            type: 'text',
            placeholder: 'e.g., Cinematic, Natural, Neon...',
          },
        ],
      },
      {
        name: 'Video Script Template',
        description: 'Template for creating video scripts and storyboards',
        category: 'video-editing',
        promptTemplate:
          'Write a script for a {{duration}} minute video about {{topic}}. Target Audience: {{audience}}. Structure: {{structure}}.',
        isActive: true,
        inputSchema: [
          {
            name: 'topic',
            label: 'Video Topic',
            type: 'text',
            required: true,
          },
          {
            name: 'duration',
            label: 'Target Duration (minutes)',
            type: 'number',
            default: 5,
            min: 1,
            max: 60,
          },
          {
            name: 'audience',
            label: 'Target Audience',
            type: 'text',
            placeholder: 'e.g., Students, Professionals, Gamers...',
          },
          {
            name: 'structure',
            label: 'Script Structure',
            type: 'select',
            options: [
              { value: 'educational', label: 'Educational / How-to' },
              { value: 'storytelling', label: 'Storytelling' },
              { value: 'promotional', label: 'Promotional / Ad' },
            ],
            default: 'educational',
          },
        ],
      },
      {
        name: 'Marketing Email Template',
        description: 'Template for crafting effective marketing emails',
        category: 'marketing',
        promptTemplate:
          'Write a marketing email for {{product}}. Goal: {{goal}}. Call to Action: {{cta}}.',
        isActive: true,
        inputSchema: [
          {
            name: 'product',
            label: 'Product / Service Name',
            type: 'text',
            required: true,
          },
          {
            name: 'goal',
            label: 'Campaign Goal',
            type: 'select',
            options: [
              { value: 'awareness', label: 'Brand Awareness' },
              { value: 'sales', label: 'Drive Sales' },
              { value: 'newsletter', label: 'Newsletter Engagement' },
            ],
          },
          {
            name: 'cta',
            label: 'Call to Action (CTA)',
            type: 'text',
            placeholder: 'e.g., Sign up now, Learn more...',
            required: true,
          },
        ],
      },
      {
        name: 'Blog Post Template',
        description: 'Template for writing SEO-optimized blog posts',
        category: 'marketing',
        promptTemplate:
          'Write a comprehensive blog post about {{topic}}. Target keyword: {{keyword}}. Include {{sections}} main sections.',
        isActive: true,
        inputSchema: [
          {
            name: 'topic',
            label: 'Blog Post Topic',
            type: 'text',
            required: true,
          },
          {
            name: 'keyword',
            label: 'Target SEO Keyword',
            type: 'text',
            placeholder: 'e.g., AI in healthcare, sustainable living...',
          },
          {
            name: 'sections',
            label: 'Number of Main Sections',
            type: 'number',
            default: 3,
            min: 1,
            max: 10,
          },
        ],
      },
      {
        name: 'Product Description Template',
        description: 'Template for writing compelling product descriptions',
        category: 'marketing',
        promptTemplate:
          'Create a product description for {{productName}}. Tone: {{tone}}. Length: {{length}} words.',
        isActive: true,
        inputSchema: [
          {
            name: 'productName',
            label: 'Product Name',
            type: 'text',
            required: true,
          },
          {
            name: 'tone',
            label: 'Tone of Voice',
            type: 'select',
            options: [
              { value: 'persuasive', label: 'Persuasive' },
              { value: 'informative', label: 'Informative' },
              { value: 'luxury', label: 'Luxury' },
            ],
            default: 'persuasive',
          },
          {
            name: 'length',
            label: 'Desired Length (words)',
            type: 'number',
            default: 100,
            min: 50,
            max: 500,
          },
        ],
      },
      {
        name: 'Text-to-Speech Script Template',
        description:
          'Template for creating scripts optimized for text-to-speech conversion',
        category: 'text-to-speech',
        isActive: true,
        promptTemplate:
          'Write a script for text-to-speech conversion about {{topic}}. Script length: {{duration}} minutes.',
        inputSchema: [
          {
            name: 'topic',
            label: 'Script Topic',
            type: 'text',
            required: true,
          },
          {
            name: 'duration',
            label: 'Target Duration (minutes)',
            type: 'number',
            default: 1,
            min: 0.5,
            max: 10,
          },
        ],
      },
    ];

    for (const template of templates) {
      const existing = await this.templateRepository.findOne({
        where: { name: template.name },
      });

      if (!existing) {
        let category: CategoryEntity | null = null;
        if (template.category) {
          category = await this.categoryRepository.findOne({
            where: { slug: template.category },
          });
        }

        await this.templateRepository.save(
          this.templateRepository.create({
            name: template.name,
            description: template.description,
            category: category ? category : undefined,
            isActive: template.isActive,
            prompt: template.prompt,
            promptTemplate: template.promptTemplate,
            inputSchema: template.inputSchema,
          }),
        );
      }
    }
  }
}
