import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateCreationJobDto } from './dto/create-creation-jobs.dto';
import { UpdateCreationJobDto } from './dto/update-creation-jobs.dto';
import { CreationJobsRepository } from './infrastructure/persistence/creation-jobs.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { CreationJob, CreationJobStatus } from './domain/creation-jobs';
import { PublicationStatus } from './domain/creation-job-publication';
import { NullableType } from '../utils/types/nullable.type';
import { ExecutionQueueService } from '../execution/queue/execution-queue.service';
import { CreationToolsService } from '../creation-tools/creation-tools.service';

import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AuditService } from '../audit/audit.service';

import { ExecutionStrategyResolver } from '../execution/execution-strategy.resolver';
import { ExecutionValidationService } from '../execution/validation/execution-validation.service';
import { ExecutionFlow, FormConfig } from '../creation-tools/domain/creation-tool';
import { ChannelsService } from '../channels/channels.service';
import { OAuthService } from '../integrations/oauth.service';
import { BotExecutionService } from '../bots/bot-execution.service';

const SOCIAL_MEDIA_EXPERT_PROMPT = `Bạn là một AI chuyên viết nội dung Social Media bán hàng và truyền thông chiến dịch.
Bạn KHÔNG viết theo cảm tính.
Bạn viết dựa trên dữ liệu người dùng truyền vào.

--------------------------------------------------
DỮ LIỆU ĐẦU VÀO (INPUT VARIABLES)
--------------------------------------------------

1. <prompt yêu cầu>
- Là nội dung yêu cầu chính của người dùng
- Có thể bao gồm: sản phẩm, thương hiệu, chương trình sale, thời gian, ưu đãi, nền tảng bán, đối tượng khách hàng

2. <Phong cách viết>
- Là GIÁ TRỊ ĐƯỢC CHỌN TỪ DROPDOWNLIST
- Bạn PHẢI viết bài đúng với phong cách này (giọng văn, từ ngữ, nhịp câu)

3. <kiến thức đã học>
- Là THƯ MỤC KIẾN THỨC mà người dùng đã huấn luyện cho AI
- Bạn PHẢI vận dụng kiến thức này làm nền tảng khi viết bài
- KHÔNG được mâu thuẫn hoặc bỏ qua kiến thức đã học

--------------------------------------------------
MỤC TIÊU
--------------------------------------------------
Viết MỘT bài đăng Social Media:
- Dễ đọc trên mobile
- Giàu cảm xúc, đúng insight
- Nhấn mạnh lợi ích & ưu đãi
- Tối ưu chuyển đổi (CTA rõ ràng)
- Phù hợp để chia sẻ trên Social & sàn TMĐT

--------------------------------------------------
KIẾN THỨC VIẾT BÀI BẮT BUỘC ÁP DỤNG
--------------------------------------------------
- Copywriting: Hook → Benefit → Offer → CTA
- AIDA / PAS (chỉ áp dụng, không giải thích)
- FOMO: giới hạn thời gian, số lượng, tính khẩn cấp
- Emoji dùng vừa phải, đúng ngữ cảnh
- Định dạng ngắn gọn, dễ lướt

--------------------------------------------------
CẤU TRÚC BẮT BUỘC (PHẢI TUÂN THEO)
--------------------------------------------------

1) HOOK / TIÊU ĐỀ
- Dòng mở đầu gây chú ý
- Có thể IN HOA + emoji
- Gắn với sự kiện / thời điểm / ưu đãi

2) ĐOẠN DẪN CẢM XÚC
- 1–3 dòng ngắn
- Gắn với bối cảnh người đọc
- Giới thiệu sản phẩm/thương hiệu một cách tự nhiên

3) THÔNG TIN ƯU ĐÃI
- Trình bày dạng bullet + emoji
- BẮT BUỘC nêu rõ nếu có: Thời gian, Giảm giá/Voucher, Điều kiện

4) CTA – KÊU GỌI HÀNH ĐỘNG
- Nhấn mạnh: DUY NHẤT / HÔM NAY / GIỚI HẠN
- Hướng dẫn hành động rõ ràng: săn sale, chốt đơn, click link

5) LINK MUA HÀNG
- Đặt cuối bài
- Liệt kê rõ từng kênh (Shopee Mall, Lazada Mall, Website…)

--------------------------------------------------
QUY TẮC BẮT BUỘC
--------------------------------------------------
- CHỈ trả về NỘI DUNG BÀI VIẾT
- KHÔNG giải thích, KHÔNG phân tích, KHÔNG JSON
- KHÔNG tự bịa ưu đãi, quà tặng, điều kiện
- Nếu thiếu dữ liệu, dùng placeholder: [GIẢM %], [VOUCHER], [QUÀ TẶNG], [ĐIỀU KIỆN], [NGÀY/THỜI GIAN]

--------------------------------------------------
CÚ PHÁP GỌI (BẮT BUỘC HIỂU ĐÚNG)
--------------------------------------------------
Khi người dùng truyền vào 3 DỮ LIỆU qua cú pháp:
"<prompt yêu cầu>" ; "<Phong cách viết>" ; "<kiến thức từ tài khoản>"
Bạn phải hiểu và áp dụng chúng để tạo ra kết quả tốt nhất.`;

@Injectable()
export class CreationJobsService {
  private readonly logger = new Logger(CreationJobsService.name);
  constructor(
    private readonly executionQueueService: ExecutionQueueService,
    private readonly creationJobsRepository: CreationJobsRepository,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly auditService: AuditService,
    private readonly i18n: I18nService,
    private readonly eventEmitter: EventEmitter2,
    private readonly creationToolsService: CreationToolsService,
    @Inject(forwardRef(() => ExecutionStrategyResolver))
    private readonly strategyResolver: ExecutionStrategyResolver,
    @Inject(forwardRef(() => ExecutionValidationService))
    private readonly validationService: ExecutionValidationService,
    private readonly channelsService: ChannelsService,
    private readonly oauthService: OAuthService,
    @Inject(forwardRef(() => BotExecutionService))
    private readonly botExecutionService: BotExecutionService,
  ) { }

  async executePreview(
    toolId: string,
    inputData: Record<string, any>,
    context?: { workspaceId?: string; userId?: string },
  ): Promise<any> {
    const tool = await this.creationToolsService.findById(toolId);
    if (!tool) {
      throw new NotFoundException(`Creation Tool with ID ${toolId} not found`);
    }

    // 1. Validate and Prepare Inputs
    let validatedInputs = inputData;
    try {
      validatedInputs = this.validationService.validateInputs(
        tool.formConfig,
        inputData,
      );
    } catch (validationError) {
      throw new BadRequestException(
        `Input Validation Failed: ${validationError.message}`,
      );
    }

    const executionInputs = this.validationService.prepareInputs(
      tool.formConfig,
      this.normalizeInputData(validatedInputs, tool.formConfig),
    );

    const config = tool.executionFlow as ExecutionFlow;

    // 2. Resolve and Execute Strategy
    const strategy = this.strategyResolver.resolve(config.type);

    // Inject system variables for consistency
    let apiUrl = process.env.BACKEND_DOMAIN || process.env.API_URL || '';
    // Normalize URL: Remove trailing slash and /api if present to avoid duplication
    apiUrl = apiUrl.replace(/\/$/, '').replace(/\/api$/, '');

    const finalInputs = {
      ...executionInputs,
      _jobId: 'preview',
      _callbackUrl: `${apiUrl}/api/v1/callbacks/jobs/preview/complete`,
      _workspaceId: context?.workspaceId,
    };

    const result = await strategy.execute(config, finalInputs, context);

    return result;
  }

  async executeJobStep(
    toolId: string,
    stepId: string,
    inputData: Record<string, any>,
    context: { workspaceId: string; userId: string },
    existingJobId?: string,
  ): Promise<any> {
    const tool = await this.creationToolsService.findById(toolId);
    if (!tool) {
      throw new NotFoundException(`Creation Tool with ID ${toolId} not found`);
    }

    const step = tool.formConfig.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new NotFoundException(`Step with ID ${stepId} not found`);
    }

    // 1. Find or Create Job (Draft Mode)
    let job: CreationJob;
    if (existingJobId) {
      const foundJob = await this.creationJobsRepository.findById(
        existingJobId,
        context.workspaceId,
      );
      if (!foundJob) {
        throw new NotFoundException(`Job with ID ${existingJobId} not found`);
      }
      job = foundJob;
    } else {
      // Create new Draft Job
      const newJob = new CreationJob();
      newJob.status = CreationJobStatus.DRAFT; // You might need to add DRAFT to allowed statuses if strict
      newJob.creationToolId = toolId;
      newJob.inputData = inputData;
      newJob.workspaceId = context.workspaceId;
      newJob.createdBy = context.userId;
      newJob.progress = 0;
      job = await this.creationJobsRepository.create(newJob);
    }

    // 2. Prepare Inputs (Merge current step inputs with job history)
    // We update the job's global input data with the new step data

    // Normalize new inputs first
    const normalizedStepInput = this.normalizeInputData(inputData, tool.formConfig);

    const updatedInputData = {
      ...(job.inputData || {}),
      ...normalizedStepInput,
    };

    // 3. Execute Step (if it has execution config)
    let executionResult = null;
    if (step.execution) {
      let apiUrl = process.env.BACKEND_DOMAIN || process.env.API_URL || '';
      apiUrl = apiUrl.replace(/\/$/, '').replace(/\/api$/, '');

      // CRITICAL FIX: Sanitize inputs (e.g. convert file objects to URLs) using FormConfig
      // This solves the issue where {{images}} renders as [object Object] because it wasn't processed.
      const sanitizedData = this.validationService.prepareInputs(
        tool.formConfig,
        updatedInputData,
      );

      // Prepare inputs: Form Data + Previous Step Results
      const previousResults = job.outputData || {};
      const executionInputs = {
        ...sanitizedData, // Use sanitized data instead of raw updatedInputData
        ...previousResults, // Flatten for easy access {{field}}
        prev: previousResults, // Access via {{prev.stepId.field}}
        _jobId: job.id,
        _callbackUrl: `${apiUrl}/api/v1/callbacks/jobs/${job.id}/complete`,
        _workspaceId: context.workspaceId,
      };

      const strategy = this.strategyResolver.resolve(step.execution.type);

      executionResult = await strategy.execute(
        step.execution.config as any,
        executionInputs,
        { ...context, toolId, stepId, jobId: job.id } as any,
      );
    }

    const updatedOutputData = {
      ...(job.outputData || {}),
      [stepId]: executionResult,
      ...(executionResult || {}),
      latest: executionResult,
    };

    // Update the job persistent record
    await this.creationJobsRepository.update(job.id, context.workspaceId, {
      inputData: updatedInputData,
      outputData: updatedOutputData,
      updatedAt: new Date(),
    });

    return {
      jobId: job.id,
      stepId,
      result: executionResult,
      status: job.status,
    };
  }

  private normalizeInputData(
    inputs: Record<string, any>,
    config?: FormConfig,
  ): Record<string, any> {
    const normalized = { ...inputs };

    // 1. Dynamic discovery based on field types in FormConfig
    if (config?.fields) {
      for (const field of config.fields) {
        if (field.type === 'template-selector') {
          const val = normalized[field.name];
          if (val && typeof val === 'object' && val !== null) {
            // Extract Image and Description if not already set
            if (!normalized[`${field.name}Image` || 'templateImage']) {
              normalized[`${field.name}Image` || 'templateImage'] =
                val.thumbnailUrl || val.url || val.image;
            }
            if (
              !normalized[`${field.name}Description` || 'templateDescription']
            ) {
              normalized[`${field.name}Description` || 'templateDescription'] =
                val.description || val.desc || val.name;
            }
            if (!normalized[`${field.name}Id` || 'templateId']) {
              normalized[`${field.name}Id` || 'templateId'] =
                val.id || val._id;
            }

            // REMOVE the original object to avoid "gộp vô" (duplicates) in webhooks
            delete normalized[field.name];
          }
        }
      }
    }

    // 2. Legacy/Hardcoded fallback for 'template' key (Global Safety)
    if (normalized.template && typeof normalized.template === 'object') {
      const tpl = normalized.template;
      if (!normalized.templateImage) {
        normalized.templateImage = tpl.thumbnailUrl || tpl.url || tpl.image;
      }
      if (!normalized.templateDescription) {
        normalized.templateDescription =
          tpl.description || tpl.desc || tpl.name;
      }
      if (!normalized.templateId && (tpl.id || tpl._id)) {
        normalized.templateId = tpl.id || tpl._id;
      }

      // REMOVE the original object
      delete normalized.template;
    }

    return normalized;
  }

  async create(
    createDto: CreateCreationJobDto,
    userId?: string,
    workspaceId?: string,
  ): Promise<CreationJob> {

    // Validate Input against Tool Config
    const tool = await this.creationToolsService.findById(
      createDto.creationToolId,
    );
    if (!tool) {
      throw new NotFoundException(
        `Creation Tool with ID ${createDto.creationToolId} not found`,
      );
    }

    // 1. Normalize Inputs (Flatten Template Object -> fields)
    createDto.inputData = this.normalizeInputData(
      createDto.inputData,
      tool.formConfig,
    );

    if (tool.formConfig && Array.isArray(tool.formConfig.fields)) {
      for (const field of tool.formConfig.fields) {
        // Handle case where field might be polymorphically typed as any
        const fieldName = (field as any).name || (field as any).key;
        // Defensively check for required flags in all possible locations
        const isRequired = !!(
          (field as any).required === true ||
          (field as any).required === 'true' ||
          (field as any).isRequired === true ||
          (field as any).isRequired === 'true' ||
          (field as any).validation?.required === true ||
          (field as any).validation?.required === 'true' ||
          (field as any).is_required === true ||
          (field as any).mandatory === true
        );

        if (isRequired) {
          const val = createDto.inputData[fieldName];
          if (
            val === undefined ||
            val === null ||
            (typeof val === 'string' && val.trim() === '')
          ) {
            throw new BadRequestException(
              `Field '${(field as any).displayName || (field as any).label || fieldName}' is required`,
            );
          }
        }
      }
    }

    const job = new CreationJob();
    job.status = CreationJobStatus.PENDING;
    job.creationToolId = createDto.creationToolId;
    job.inputData = createDto.inputData;
    job.outputData = undefined;
    job.progress = 0;
    job.createdBy = userId;
    job.workspaceId = workspaceId;

    const createdJob = await this.creationJobsRepository.create(job);

    // Activity Log - User started a job
    if (userId && workspaceId) {
      await this.auditService.log({
        userId,
        workspaceId,
        action: 'JOB_STARTED',
        resourceType: 'creation-job',
        resourceId: createdJob.id,
        details: { toolId: createDto.creationToolId },
      });
    }

    // Notify user about job creation
    if (userId) {
      this.notificationsGateway.emitNewNotification({
        userId,
        workspaceId,
        type: 'job_created',
        title: this.i18n.t('job.startedTitle'),
        message: this.i18n.t('job.startedMessage'),
        data: { jobId: createdJob.id },
      });
    }

    // Trigger async processing (Real Execution Engine)
    await this.executionQueueService.addCreationJob(createdJob);

    return createdJob;
  }

  // processJob method removed

  findAllWithPagination({
    paginationOptions,
    filterOptions,
    workspaceId,
  }: {
    paginationOptions: IPaginationOptions;
    filterOptions?: {
      startDate?: string;
      endDate?: string;
      search?: string;
      status?: string[];
    };
    workspaceId: string;
  }) {
    return this.creationJobsRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
      filterOptions: {
        workspaceId,
        startDate: filterOptions?.startDate,
        endDate: filterOptions?.endDate,
        search: filterOptions?.search,
        status: filterOptions?.status,
      },
    });
  }

  findById(
    id: CreationJob['id'],
    workspaceId: string,
  ): Promise<NullableType<CreationJob>> {
    return this.creationJobsRepository.findById(id, workspaceId);
  }

  findByIds(ids: CreationJob['id'][]): Promise<CreationJob[]> {
    return this.creationJobsRepository.findByIds(ids);
  }

  async update(
    id: CreationJob['id'],
    workspaceId: string,
    updateDto: UpdateCreationJobDto,
  ): Promise<CreationJob | null> {
    const updatedJob = await this.creationJobsRepository.update(
      id,
      workspaceId,
      updateDto,
    );

    if (updatedJob && updatedJob.createdBy) {
      // Emit socket event for real-time progress
      // Only emit if NOT completed/failed, because those are handled by the 'success/error' persistence listener
      // This prevents "Double Notification" spam for completion.
      const isFinalStatus = [
        CreationJobStatus.COMPLETED,
        CreationJobStatus.FAILED,
      ].includes(updatedJob.status);

      if (!isFinalStatus) {
        this.notificationsGateway.emitNewNotification({
          userId: updatedJob.createdBy,
          workspaceId: updatedJob.workspaceId,
          type: 'job_progress',
          title: this.i18n.t('job.updateTitle'),
          message: this.i18n.t('job.progressUpdate', {
            args: { progress: updatedJob.progress },
          }),
          data: {
            jobId: updatedJob.id,
            status: updatedJob.status,
            progress: updatedJob.progress,
            outputData: updatedJob.outputData,
            error: updatedJob.error,
          },
        });
      }
    }

    return updatedJob;
  }

  async cancel(id: CreationJob['id'], workspaceId: string): Promise<void> {
    const job = await this.creationJobsRepository.findById(id, workspaceId);

    if (!job) {
      throw new Error(`Job with ID ${id} not found or invalid`);
    }

    if (
      job.status === CreationJobStatus.COMPLETED ||
      job.status === CreationJobStatus.FAILED ||
      job.status === CreationJobStatus.CANCELED
    ) {
      // Already finished, do nothing
      return;
    }

    // Attempt to remove from queue
    if (job.status === CreationJobStatus.PENDING) {
      await this.executionQueueService.removeCreationJob(id);
    }

    // Update status to CANCELED
    await this.update(id, workspaceId, {
      status: CreationJobStatus.CANCELED,
      error: 'Job canceled by user',
    });

    await this.auditService.log({
      userId: job.createdBy || 'unknown',
      workspaceId,
      action: 'JOB_CANCELED',
      resourceType: 'creation-job',
      resourceId: id,
      details: { toolId: job.creationToolId },
    });
  }

  remove(id: CreationJob['id'], workspaceId: string): Promise<void> {
    return this.creationJobsRepository.remove(id, workspaceId);
  }

  removeMany(ids: CreationJob['id'][], workspaceId: string): Promise<void> {
    return this.creationJobsRepository.removeMany(ids, workspaceId);
  }

  async completeJob(
    id: string,
    resultData?: Record<string, any>,
    status: CreationJobStatus = CreationJobStatus.COMPLETED,
    error?: string,
  ): Promise<void> {
    const jobs = await this.findByIds([id]);
    const job = jobs[0];

    if (!job || !job.workspaceId) {
      throw new Error(`Job with ID ${id} not found or invalid`);
    }

    await this.update(job.id, job.workspaceId, {
      status,
      outputData: resultData,
      error,
      progress: status === CreationJobStatus.COMPLETED ? 100 : job.progress,
    });

    if (status === CreationJobStatus.COMPLETED) {
      this.eventEmitter.emit('creation-job.completed', {
        id: job.id,
        userId: job.createdBy,
        workspaceId: job.workspaceId,
        inputData: job.inputData,
      });
    } else if (status === CreationJobStatus.FAILED) {
      this.eventEmitter.emit('creation-job.failed', {
        id: job.id,
        userId: job.createdBy,
        workspaceId: job.workspaceId,
        error: error,
      });
    }
  }

  /**
   * Helper to extract a comprehensive summary of the product/job result
   */
  private extractProductSummary(job: CreationJob): string {
    const parts: string[] = [];

    // 1. Tool Information
    if (job.creationTool?.name) {
      parts.push(`Sản phẩm/Dịch vụ: ${job.creationTool.name}`);
    }

    // 2. User Inputs (filter out technical/internal IDs)
    if (job.inputData) {
      const inputs = job.inputData as Record<string, any>;
      const relevantInputs = Object.entries(inputs)
        .filter(([key]) => !key.startsWith('_') && key !== 'id')
        .map(([key, val]) => {
          if (typeof val === 'string' && val.length > 500)
            return `${key}: [Nội dung dài]`;
          return `${key}: ${val}`;
        });
      if (relevantInputs.length > 0) {
        parts.push(`\n[Thông tin đầu vào]:\n${relevantInputs.join('\n')}`);
      }
    }

    // 3. Execution Results (Output Data)
    if (job.outputData) {
      const output = job.outputData as Record<string, any>;
      // Look for main content fields
      const contentFields = [
        'content',
        'text',
        'result',
        'description',
        'caption',
        'article',
      ];
      const foundContent = contentFields
        .map((f) => output[f])
        .find((val) => typeof val === 'string' && val.trim().length > 0);

      if (foundContent) {
        parts.push(`\n[Kết quả tạo ra]:\n${foundContent}`);
      } else {
        // Fallback: take all string fields that aren't URLs
        const otherStrings = Object.entries(output)
          .filter(
            ([_, val]) =>
              typeof val === 'string' &&
              val.length > 10 &&
              !val.startsWith('http'),
          )
          .map(([key, val]) => `${key}: ${val}`);
        if (otherStrings.length > 0) {
          parts.push(
            `\n[Dữ liệu kết quả bổ sung]:\n${otherStrings.join('\n')}`,
          );
        }
      }
    }

    return parts.join('\n');
  }

  /**
   * Generates a professional social media post draft without posting it
   */
  async generatePostDraft(
    jobId: string,
    workspaceId: string,
    botId?: string,
    writingStyle?: string,
    customUserInstructions?: string,
  ): Promise<{ draft: string }> {
    const job = await this.creationJobsRepository.findById(jobId, workspaceId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const productSummary = this.extractProductSummary(job);

    // If no bot, just return a basic summary or previous message
    if (!botId) {
      return { draft: customUserInstructions || productSummary };
    }

    const prompt = `<prompt yêu cầu>: ${customUserInstructions || 'Viết một bài đăng Social Media chuyên nghiệp cho sản phẩm này.'}

<Phong cách viết>: ${writingStyle || 'Chuyên gia'}

<kiến thức đã học (Dữ liệu sản phẩm từ hệ thống)>:
${productSummary}

-------------------
Vui lòng sử dụng toàn bộ thông tin trên để tạo bài viết tốt nhất.`;

    try {
      const botResult = await this.botExecutionService.generateBotResponse(
        botId,
        prompt,
        [],
        {
          workspaceId,
          systemPromptOverride: SOCIAL_MEDIA_EXPERT_PROMPT,
        },
      );

      return { draft: botResult.answer };
    } catch (error) {
      this.logger.error(`Social Draft generation failed: ${error.message}`);
      throw new BadRequestException(`Không thể tạo bản nháp: ${error.message}`);
    }
  }

  async postToChannels(
    jobId: string,
    channels: string[],
    workspaceId: string,
    scheduledTime?: string,
    customMessage?: string,
    botId?: string,
    writingStyle?: string,
  ): Promise<any> {
    const job = await this.creationJobsRepository.findById(jobId, workspaceId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    // Assume outputData contains the result content
    // We expect outputData to have 'content' and optional 'imageUrl'
    // This depends on the tool output structure.
    // For now, we'll look for common fields or joined text.

    let message = customMessage || '';
    let imageUrl = '';

    if (job.outputData) {
      const output = job.outputData as Record<string, any>;

      // 1. Detect Image URL
      if (typeof output.imageUrl === 'string') {
        imageUrl = output.imageUrl;
      } else if (typeof output.image === 'string') {
        imageUrl = output.image;
      } else if (
        typeof output.url === 'string' &&
        output.url.startsWith('http')
      ) {
        imageUrl = output.url;
      } else {
        // Look for any field that looks like a URL pointing to an image or temp file
        const possibleUrl = Object.values(output).find(
          (v) =>
            typeof v === 'string' &&
            v.startsWith('http') &&
            (v.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
              v.includes('tempfile') ||
              v.includes('storage')),
        );
        if (possibleUrl) imageUrl = possibleUrl as string;
      }

      // 2. Extract Message if customMessage is not provided
      if (!message) {
        if (typeof output.content === 'string') {
          message = output.content;
        } else if (typeof output.text === 'string') {
          message = output.text;
        } else if (typeof output.result === 'string') {
          message = output.result;
        } else if (typeof job.outputData === 'string') {
          message = job.outputData;
        } else {
          // Fallback: join strings but skip system info and already detected image URL
          const skipKeywords = [
            'id',
            'status',
            'success',
            'error',
            'execution',
          ];
          message = Object.entries(output)
            .filter(([key, val]) => {
              if (typeof val !== 'string' || !val.trim()) return false;
              if (val === imageUrl) return false;
              if (skipKeywords.some((k) => key.toLowerCase().includes(k)))
                return false;
              if (val.toLowerCase() === 'success') return false;
              return true;
            })
            .map(([_, val]) => val)
            .join('\n');
        }
      }
    }

    // NEW: Use Bot to refine/rewrite the message IF requested AND not already refined
    // Note: If the user already used 'generate-post-draft' in the UI, message will be rich.
    // If they click 'Post' directly, we refine it here.
    if (botId && message && (message.length < 50 || !message.includes('\n'))) {
      try {
        const { draft } = await this.generatePostDraft(
          jobId,
          workspaceId,
          botId,
          writingStyle,
          message,
        );
        message = draft;
      } catch (botError) {
        console.error('Bot refinement during posting failed:', botError);
      }
    }

    if (!message && !imageUrl) {
      throw new BadRequestException('Job has no content to post');
    }

    const results: any[] = [];

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    for (const rawChannelId of channels) {
      let channelId = rawChannelId;
      let targetPageId: string | undefined;

      // Handle composite IDs (e.g. "uuid:pageId")
      // We use substring to be robust against multiple colons or other formats
      const colonIndex = rawChannelId.indexOf(':');
      if (colonIndex !== -1) {
        channelId = rawChannelId.substring(0, colonIndex);
        targetPageId = rawChannelId.substring(colonIndex + 1);
      }

      const isUuid = uuidRegex.test(channelId);

      try {
        if (!isUuid) {
          throw new Error(`Invalid channel ID format: ${channelId}`);
        }

        const channel = await this.channelsService.findOne(
          channelId,
          workspaceId,
        );
        if (!channel) {
          results.push({
            channelId: rawChannelId,
            status: 'error',
            error: 'Channel not found',
          });
          continue;
        }

        if (channel.type === 'facebook') {
          // If targetPageId was provided in the composite ID, use it.
          // Otherwise fall back to metadata.
          const pageId =
            targetPageId || channel.metadata?.pageId || channel.metadata?.id;

          // Prefer userAccessToken from metadata if available (typical for User connections managing multiple pages)
          // otherwise fallback to the main accessToken column
          const rawToken = channel.metadata?.userAccessToken || channel.accessToken;

          if (!pageId || !rawToken) {
            results.push({
              channelId: rawChannelId,
              status: 'error',
              error:
                'Invalid channel configuration: missing Page ID or Access Token',
            });
            continue;
          }

          // Fetch Page Access Token to post AS the page
          let finalAccessToken = channel.accessToken || rawToken; // Default to main token if exchange fails
          try {
            const targetPage = await this.oauthService.getFacebookPage(rawToken, pageId);
            if (targetPage && targetPage.access_token) {
              finalAccessToken = targetPage.access_token;
              this.logger.log(`Successfully exchanged token for Page ID ${pageId}`);
            } else {
              this.logger.warn(
                `Could not find Page Access Token for page ${pageId}, falling back to default Token`,
              );
            }
          } catch (tokenErr) {
            const errorData = tokenErr.response?.data?.error;
            this.logger.error(
              `Failed to fetch pages for token exchange: ${tokenErr.message} - ${JSON.stringify(errorData)}`,
            );
          }

          this.logger.log(`Attempting to post to Facebook Page ${pageId} with token ending in ...${finalAccessToken?.slice(-10)}`);

          const result = await this.oauthService.postToFacebookPage(
            finalAccessToken,
            pageId,
            message,
            imageUrl,
            scheduledTime
              ? Math.floor(new Date(scheduledTime).getTime() / 1000)
              : undefined,
          );

          this.logger.log(`Facebook Post Success: ${JSON.stringify(result)}`);

          results.push({
            channelId: rawChannelId,
            status: 'success',
            data: result,
          });

          // Persistent publication record
          if (isUuid) {
            await this.creationJobsRepository.createPublication({
              jobId,
              channelId,
              platform: channel.type,
              status: PublicationStatus.SUCCESS,
              externalId: String(result?.id || result?.postId || ''),
              url: result?.permalink_url || result?.url,
              metadata: result,
              content: message,
            });
          }

          // Optional: Still keep audit log for high-level security tracking
          await this.auditService.log({
            userId: job.createdBy || 'unknown',
            workspaceId,
            action: 'JOB_PUBLISHED',
            resourceType: 'creation-job',
            resourceId: jobId,
            details: {
              channelId: rawChannelId,
              status: 'success',
              platform: channel.type,
            },
          });
        } else {
          const errorMsg = `Channel type ${channel.type} not supported for posting yet`;
          results.push({
            channelId: rawChannelId,
            status: 'error',
            error: errorMsg,
          });

          // Persistent publication record (Failed)
          if (isUuid) {
            await this.creationJobsRepository.createPublication({
              jobId,
              channelId,
              platform: channel.type,
              status: PublicationStatus.FAILED,
              error: errorMsg,
              content: message,
            });
          }

          // Log failed publication
          await this.auditService.log({
            userId: job.createdBy || 'unknown',
            workspaceId,
            action: 'JOB_PUBLISHED',
            resourceType: 'creation-job',
            resourceId: jobId,
            details: {
              channelId: rawChannelId,
              status: 'error',
              platform: channel.type,
              error: errorMsg,
            },
          });
        }
      } catch (err) {
        results.push({
          channelId: rawChannelId,
          status: 'error',
          error: err.message,
        });

        // Persistent publication record (Failed due to exception)
        // Only try to save if we have a valid UUID, otherwise DB will throw 500
        if (isUuid) {
          try {
            await this.creationJobsRepository.createPublication({
              jobId,
              channelId,
              platform: 'unknown',
              status: PublicationStatus.FAILED,
              error: err.message,
              content: message,
            });
          } catch (saveErr) {
            console.error("Failed to save publication error record:", saveErr);
          }
        }

        // Log failed publication due to exception
        await this.auditService.log({
          userId: job.createdBy || 'unknown',
          workspaceId,
          action: 'JOB_PUBLISHED',
          resourceType: 'creation-job',
          resourceId: jobId,
          details: {
            channelId: rawChannelId,
            status: 'error',
            error: err.message,
          },
        });
      }
    }

    return results;
  }

  async getPublications(jobId: string, workspaceId: string): Promise<any[]> {
    return this.creationJobsRepository.findPublicationsByJobId(jobId);
  }

  async triggerAction(
    jobId: string,
    actionId: string,
    workspaceId: string,
    actionInputs: Record<string, any>,
    context?: { userId?: string },
  ): Promise<any> {
    const job = await this.creationJobsRepository.findById(jobId, workspaceId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    const tool = await this.creationToolsService.findById(job.creationToolId);
    if (!tool) {
      throw new NotFoundException(
        `Tool with ID ${job.creationToolId} not found`,
      );
    }

    // 1. Find the Action
    const action = tool.actions?.find((a) => a.id === actionId);
    if (!action) {
      throw new NotFoundException(
        `Action with ID ${actionId} not found in tool ${tool.name}`,
      );
    }

    // 2. Prepare Inputs: Merge Original Inputs + Outputs + Action Inputs
    const baseInputs = {
      ...(job.inputData || {}),
      ...(job.outputData || {}),
      ...actionInputs,
      _jobId: job.id,
      _workspaceId: workspaceId,
      _userId: context?.userId,
      _actionId: actionId,
    };

    // 3. Resolve and Execute Strategy (The "Workflow Engine")
    const strategy = this.strategyResolver.resolve(action.execution.type);

    const result = await strategy.execute(
      action.execution.config as any,
      baseInputs,
      {
        ...context,
        workspaceId,
        toolId: tool.id,
        jobId: job.id,
        actionId,
      } as any,
    );

    // 4. Audit Log
    if (context?.userId) {
      await this.auditService.log({
        userId: context.userId,
        workspaceId,
        action: `ACTION_TRIGGERED:${actionId}`,
        resourceType: 'creation-job',
        resourceId: jobId,
        details: { actionId, toolId: tool.id },
      });
    }

    return result;
  }
}
