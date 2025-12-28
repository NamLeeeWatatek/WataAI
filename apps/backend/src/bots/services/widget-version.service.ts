import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { WidgetVersionEntity } from '../infrastructure/persistence/relational/entities/widget-version.entity';
import { WidgetDeploymentEntity } from '../infrastructure/persistence/relational/entities/widget-deployment.entity';
import { BotEntity } from '../infrastructure/persistence/relational/entities/bot.entity';
import {
  CreateWidgetVersionDto,
  UpdateWidgetVersionDto,
  RollbackWidgetVersionDto,
  WidgetVersionResponseDto,
  WidgetVersionListItemDto,
  WidgetDeploymentResponseDto,
} from '../dto/widget-version.dto';

@Injectable()
export class WidgetVersionService {
  constructor(
    @InjectRepository(WidgetVersionEntity)
    private readonly versionRepo: Repository<WidgetVersionEntity>,
    @InjectRepository(WidgetDeploymentEntity)
    private readonly deploymentRepo: Repository<WidgetDeploymentEntity>,
    @InjectRepository(BotEntity)
    private readonly botRepo: Repository<BotEntity>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async getActiveVersion(botId: string): Promise<WidgetVersionEntity | null> {
    const cacheKey = `widget:active:${botId}`;
    const cached = await this.cacheManager.get<WidgetVersionEntity>(cacheKey);
    if (cached) {
      return cached;
    }

    const version = await this.versionRepo.findOne({
      where: {
        botId,
        isActive: true,
        status: 'published',
      },
    });

    if (version) {
      await this.cacheManager.set(cacheKey, version, 300);
    }

    return version;
  }

  async listVersions(
    botId: string,
    userId?: string,
  ): Promise<WidgetVersionListItemDto[]> {
    if (userId) {
      await this.validateBotAccess(botId, userId);
    }

    const versions = await this.versionRepo.find({
      where: { botId },
      order: { createdAt: 'DESC' },
    });

    return versions.map((v) => ({
      id: v.id,
      version: v.version,
      status: v.status,
      isActive: v.isActive,
      publishedAt: v.publishedAt ?? null,
      changelog: v.changelog ?? null,
      createdAt: v.createdAt,
    }));
  }

  async getVersion(
    botId: string,
    versionId: string,
    userId: string,
  ): Promise<WidgetVersionResponseDto> {
    await this.validateBotAccess(botId, userId);

    const version = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Widget version not found');
    }

    return this.toResponseDto(version);
  }

  async createVersion(
    botId: string,
    dto: CreateWidgetVersionDto,
    userId: string,
  ): Promise<WidgetVersionResponseDto> {
    await this.validateBotAccess(botId, userId);

    if (!this.isValidVersion(dto.version)) {
      throw new BadRequestException(
        'Invalid version format. Use semantic versioning (e.g., 1.0.0)',
      );
    }

    const existing = await this.versionRepo.findOne({
      where: { botId, version: dto.version },
    });

    if (existing) {
      throw new ConflictException(`Version ${dto.version} already exists`);
    }

    this.validateConfig(dto.config);

    const version = this.versionRepo.create({
      botId,
      version: dto.version,
      config: dto.config,
      changelog: dto.changelog,
      notes: dto.notes,
      status: 'draft',
      isActive: false,
    });

    await this.versionRepo.save(version);

    return this.toResponseDto(version);
  }

  async updateVersion(
    botId: string,
    versionId: string,
    dto: UpdateWidgetVersionDto,
    userId: string,
  ): Promise<WidgetVersionResponseDto> {
    await this.validateBotAccess(botId, userId);

    const version = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Widget version not found');
    }

    if (version.status !== 'draft') {
      throw new BadRequestException(
        'Can only update draft versions. Create a new version instead.',
      );
    }

    if (dto.config) {
      this.validateConfig(dto.config);
      version.config = dto.config;
    }
    if (dto.changelog !== undefined) {
      version.changelog = dto.changelog;
    }
    if (dto.notes !== undefined) {
      version.notes = dto.notes;
    }

    await this.versionRepo.save(version);

    return this.toResponseDto(version);
  }

  async updateActiveVersionConfig(
    botId: string,
    configUpdate: Partial<any>,
    userId: string,
    changelog?: string,
  ): Promise<WidgetVersionResponseDto> {
    await this.validateBotAccess(botId, userId);

    const activeVersion = await this.getActiveVersion(botId);

    if (!activeVersion) {
      throw new NotFoundException('No active widget version found');
    }

    const currentVersion = activeVersion.version;
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2]++;
    let newVersion = versionParts.join('.');

    let existingVersion = await this.versionRepo.findOne({
      where: { botId, version: newVersion },
    });

    while (existingVersion) {
      versionParts[2]++;
      newVersion = versionParts.join('.');
      existingVersion = await this.versionRepo.findOne({
        where: { botId, version: newVersion },
      });
    }

    const newConfig = {
      ...activeVersion.config,
      ...configUpdate,
      theme: {
        ...activeVersion.config.theme,
        ...configUpdate.theme,
      },
      messages: {
        ...activeVersion.config.messages,
        ...configUpdate.messages,
      },
    };

    this.validateConfig(newConfig);

    const version = this.versionRepo.create({
      botId,
      version: newVersion,
      config: newConfig,
      changelog: changelog || 'Updated appearance settings',
      status: 'draft',
      isActive: false,
    });

    await this.versionRepo.save(version);

    return this.publishVersion(botId, version.id, userId);
  }

  async publishVersion(
    botId: string,
    versionId: string,
    userId: string,
  ): Promise<WidgetVersionResponseDto> {
    await this.validateBotAccess(botId, userId);

    const version = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Widget version not found');
    }

    if (version.status === 'published' && version.isActive) {
      throw new BadRequestException('Version is already published and active');
    }

    const currentActive = await this.versionRepo.findOne({
      where: { botId, isActive: true },
    });

    if (currentActive) {
      currentActive.isActive = false;
      await this.versionRepo.save(currentActive);
    }

    version.status = 'published';
    version.isActive = true;
    version.publishedAt = new Date();
    version.publishedBy = userId;

    await this.versionRepo.save(version);

    await this.deploymentRepo.save({
      botId,
      widgetVersionId: versionId,
      deployedBy: userId,
      deploymentType: 'publish',
      previousVersionId: currentActive?.id,
      status: 'deployed',
      trafficPercentage: 100,
    });

    await this.invalidateCache(botId);

    return this.toResponseDto(version);
  }

  async rollbackVersion(
    botId: string,
    versionId: string,
    dto: RollbackWidgetVersionDto,
    userId: string,
  ): Promise<WidgetVersionResponseDto> {
    await this.validateBotAccess(botId, userId);

    const targetVersion = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!targetVersion) {
      throw new NotFoundException('Widget version not found');
    }

    if (targetVersion.status !== 'published') {
      throw new BadRequestException('Can only rollback to published versions');
    }

    if (targetVersion.isActive) {
      throw new BadRequestException('This version is already active');
    }

    const currentActive = await this.versionRepo.findOne({
      where: { botId, isActive: true },
    });

    if (currentActive) {
      currentActive.isActive = false;
      await this.versionRepo.save(currentActive);
    }

    targetVersion.isActive = true;
    await this.versionRepo.save(targetVersion);

    await this.deploymentRepo.save({
      botId,
      widgetVersionId: versionId,
      deployedBy: userId,
      deploymentType: 'rollback',
      previousVersionId: currentActive?.id,
      rollbackReason: dto.reason,
      status: 'deployed',
      trafficPercentage: 100,
    });

    await this.invalidateCache(botId);

    return this.toResponseDto(targetVersion);
  }

  async archiveVersion(
    botId: string,
    versionId: string,
    userId: string,
  ): Promise<void> {
    await this.validateBotAccess(botId, userId);

    const version = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Widget version not found');
    }

    if (version.isActive) {
      throw new BadRequestException('Cannot archive active version');
    }

    version.status = 'archived';
    await this.versionRepo.save(version);
  }

  async deleteVersion(
    botId: string,
    versionId: string,
    userId: string,
  ): Promise<void> {
    await this.validateBotAccess(botId, userId);

    const version = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Widget version not found');
    }

    if (version.status !== 'draft') {
      throw new BadRequestException('Can only delete draft versions');
    }

    await this.versionRepo.remove(version);
  }

  async getDeploymentHistory(
    botId: string,
    userId: string,
  ): Promise<WidgetDeploymentResponseDto[]> {
    await this.validateBotAccess(botId, userId);

    const deployments = await this.deploymentRepo.find({
      where: { botId },
      relations: ['widgetVersion', 'previousVersion'],
      order: { deployedAt: 'DESC' },
      take: 50,
    });

    return deployments.map((d) => ({
      id: d.id,
      botId: d.botId,
      widgetVersionId: d.widgetVersionId,
      version: d.widgetVersion?.version || 'Unknown',
      deploymentType: d.deploymentType,
      previousVersionId: d.previousVersionId ?? null,
      previousVersion: d.previousVersion?.version ?? null,
      rollbackReason: d.rollbackReason ?? null,
      trafficPercentage: d.trafficPercentage,
      status: d.status,
      deployedAt: d.deployedAt,
      deployedBy: d.deployedBy ?? null,
    }));
  }

  private async validateBotAccess(
    botId: string,
    userId: string,
  ): Promise<void> {
    const bot = await this.botRepo.findOne({
      where: { id: botId },
      relations: ['workspace'],
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }
  }

  private isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version);
  }

  private validateConfig(config: any): void {
    if (
      config.theme?.primaryColor &&
      !this.isValidColor(config.theme.primaryColor)
    ) {
      throw new BadRequestException('Invalid primary color format');
    }

    const validPositions = [
      'bottom-right',
      'bottom-left',
      'top-right',
      'top-left',
    ];
    if (
      config.theme?.position &&
      !validPositions.includes(config.theme.position)
    ) {
      throw new BadRequestException('Invalid position');
    }

    const validSizes = ['small', 'medium', 'large'];
    if (
      config.theme?.buttonSize &&
      !validSizes.includes(config.theme.buttonSize)
    ) {
      throw new BadRequestException('Invalid button size');
    }
  }

  private isValidColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
  }

  private async invalidateCache(botId: string): Promise<void> {
    await this.cacheManager.del(`widget:active:${botId}`);
  }

  async getEmbedCode(
    botId: string,
    versionId: string,
    userId: string,
  ): Promise<{
    scriptTag: string;
    iframeTag: string;
    testUrl: string;
  }> {
    await this.validateBotAccess(botId, userId);

    const version = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Widget version not found');
    }

    const baseUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:3000';
    const apiUrl = process.env.BACKEND_DOMAIN || 'http://localhost:8000';

    const scriptTag = `<!-- Wataomi Widget - Version ${version.version} -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['WataomiWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','wataomi','${apiUrl}/widget-core.js'));
  wataomi('init', {
    botId: '${botId}',
    version: '${version.version}',
    versionId: '${versionId}'
  });
</script>`;

    const iframeTag = `<!-- Wataomi Widget iFrame - Version ${version.version} -->
<iframe
  src="${baseUrl}/public/bots/${botId}?version=${version.version}&versionId=${versionId}"
  width="400"
  height="600"
  frameborder="0"
  style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
  allow="microphone; camera"
></iframe>`;

    const testUrl = `${baseUrl}/public/bots/${botId}?version=${version.version}&versionId=${versionId}`;

    return {
      scriptTag,
      iframeTag,
      testUrl,
    };
  }

  async getPreviewUrl(
    botId: string,
    versionId: string,
    userId: string,
  ): Promise<{
    previewUrl: string;
    version: string;
    config: any;
  }> {
    await this.validateBotAccess(botId, userId);

    const version = await this.versionRepo.findOne({
      where: { id: versionId, botId },
    });

    if (!version) {
      throw new NotFoundException('Widget version not found');
    }

    const baseUrl = process.env.FRONTEND_DOMAIN || 'http://localhost:3000';
    const previewUrl = `${baseUrl}/public/bots/${botId}?version=${version.version}&versionId=${versionId}&preview=true`;

    return {
      previewUrl,
      version: version.version,
      config: version.config,
    };
  }

  private toResponseDto(
    version: WidgetVersionEntity,
  ): WidgetVersionResponseDto {
    return {
      id: version.id,
      botId: version.botId,
      version: version.version,
      status: version.status,
      isActive: version.isActive,
      config: version.config,
      publishedAt: version.publishedAt ?? null,
      publishedBy: version.publishedBy ?? null,
      cdnUrl: version.cdnUrl ?? null,
      changelog: version.changelog ?? null,
      notes: version.notes ?? null,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt,
    };
  }
}
