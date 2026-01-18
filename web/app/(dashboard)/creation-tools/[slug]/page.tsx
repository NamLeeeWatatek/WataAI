'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools';
import { CreationJobStatus } from '@/lib/types/creation-job';
import { templatesApi } from '@/lib/api/templates';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { Template } from '@/lib/types/template';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { GridFormRenderer } from '@/components/features/creation-tools/GridFormRenderer';
import { useForm } from 'react-hook-form';
import { useCreationJobs } from '@/components/providers/CreationJobsProvider';
import { useToast } from '@/lib/hooks/use-toast';

import { generateZodSchema } from '@/lib/utils/schema-generator';
import { zodResolver } from '@hookform/resolvers/zod';
import { completeProgressOverlay, failProgressOverlay, showProgressOverlay } from '@/components/shared/ProgressOverlay';

export default function CreationToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;
    const { data: tool, isLoading: toolLoading } = useQuery({
        queryKey: ['creation-tool', slug],
        queryFn: () => creationToolsApi.getBySlug(slug),
    });

    if (toolLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background text-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!tool) return null;

    return <CreationToolForm key={tool.id} tool={tool} />;
}

function CreationToolForm({ tool }: { tool: CreationTool }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { addJob } = useCreationJobs();

    // State
    const [activeStep, setActiveStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    // Fetch Templates (still needed for URL pre-fill)
    const { data: templates = [] } = useQuery({
        queryKey: ['templates-raw', tool.id],
        queryFn: () => templatesApi.findAll({ filters: JSON.stringify({ creationToolId: tool.id }) }),
        enabled: !!tool.id,
    });

    const templateList = useMemo<Template[]>(() => {
        return Array.isArray(templates) ? templates : ((templates as any)?.data || []);
    }, [templates]);

    // SCHEMA & RESOLVER - Memoized
    const resolver = useMemo(() => {
        const schema = generateZodSchema(tool.formConfig?.fields || []);
        return zodResolver(schema);
    }, [tool.formConfig?.fields, tool.id]);

    const form = useForm({
        resolver,
        mode: 'all',
        reValidateMode: 'onChange',
        shouldUnregister: false,
    });

    // Reset defaults when tool changes
    useEffect(() => {
        if (tool.formConfig?.fields) {
            const defaults: Record<string, any> = {};
            tool.formConfig.fields.forEach(field => {
                defaults[field.name] = field.defaultValue !== undefined ? field.defaultValue :
                    (['boolean', 'checkbox'].includes(field.type) ? false : '');
            });
            form.reset(defaults);
        }
    }, [tool.id, form]);

    // Auto-select from URL
    useEffect(() => {
        const templateId = searchParams.get('templateId');
        if (templateId && templateList.length > 0) {
            const template = templateList.find((t: Template) => t.id === templateId);
            if (template && template.prefilledData) {
                Object.entries(template.prefilledData).forEach(([key, val]) => {
                    form.setValue(key, val, { shouldValidate: true, shouldDirty: true });
                });
            }
        }
    }, [searchParams, templateList, form]);

    const onFormSubmit = async (data: any) => {
        // Double check for required prompt (Safety measure)
        const isPromptEmpty = data.prompt === '' || (typeof data.prompt === 'string' && data.prompt.trim() === '');
        if (isPromptEmpty && tool.formConfig.fields.find(f => f.name === 'prompt')?.validation?.required) {
            toast({ title: 'Validation Error', description: 'Please enter the required prompt.', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        showProgressOverlay({
            title: 'Initializing process',
            description: 'Preparing data and sending request...',
            steps: ['Preparing data', 'Sending request', 'Initializing Job']
        });

        try {
            const inputData = { ...data };
            if (data.template) {
                inputData.templateId = data.template;
            }

            const job = await creationJobsApi.create({
                creationToolId: tool.id,
                inputData,
            });

            addJob({
                id: job.id,
                status: CreationJobStatus.PENDING,
                progress: 0,
                creationToolId: tool.id,
                inputData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            setTimeout(() => {
                completeProgressOverlay(job);
                toast({ title: 'Success', description: 'Request received successfully.' });
            }, 500);

        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error.message || 'Unknown error';
            failProgressOverlay(errorMessage);
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    // Helper to determine the best title for a step
    const getStepTitle = (step: any, index: number) => {
        // Priority 1: Zone Title (User request: "lấy từ tên các zone trong 1 step")
        const firstZoneTitle = step.layout?.rows?.[0]?.zones?.[0]?.title;
        if (firstZoneTitle && firstZoneTitle !== 'Main Zone') return firstZoneTitle;

        // Priority 2: Step Title (if not generic "Step X")
        if (step.title && !step.title.startsWith('Step ')) return step.title;

        // Priority 3: Default "Step X"
        return `Step ${index + 1}`;
    };

    return (
        <div className="h-full w-full overflow-hidden bg-background">
            {/* Sidebar & Content Layout - Full Height of Parent */}
            <div className="flex h-full">
                {/* Left Sidebar Navigation */}
                {tool.formConfig?.steps && tool.formConfig.steps.length > 1 ? (
                    <div className="w-[280px] shrink-0 border-r border-border/40 bg-card backdrop-blur-xl flex flex-col h-full overflow-hidden transition-colors duration-300">
                        <div className="p-5 flex items-center gap-3 border-b border-border/40 shrink-0">
                            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 -ml-2 rounded-full hover:bg-muted/50">
                                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <span className="font-bold text-sm tracking-tight text-foreground/80">Configuration</span>
                        </div>
                        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                            {tool.formConfig.steps.map((step, index) => {
                                const isActive = activeStep === index;
                                const isCompleted = activeStep > index;
                                const stepTitle = getStepTitle(step, index);

                                return (
                                    <button
                                        key={step.id || index}
                                        onClick={() => setActiveStep(index)}
                                        disabled={!isCompleted && !isActive}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-3.5 rounded-xl text-left transition-all duration-300 group relative",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                            (!isCompleted && !isActive) && "opacity-50 cursor-not-allowed grayscale"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors shrink-0 font-mono text-[10px] font-bold",
                                            isActive
                                                ? "border-primary-foreground text-primary-foreground bg-transparent"
                                                : isCompleted
                                                    ? "bg-muted text-foreground border-transparent"
                                                    : "border-muted-foreground/30 text-muted-foreground/50",
                                        )}>
                                            {index + 1}
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold truncate leading-tight">{stepTitle}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {/* Main Content Area */}
                <div className="flex-1 h-full overflow-hidden flex flex-col relative bg-background">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `radial-gradient(#888 1px, transparent 1px)`,
                            backgroundSize: '24px 24px'
                        }}
                    />

                    <div className="flex-1 overflow-y-auto p-6 lg:p-12 relative z-10">
                        {/* Constrain width to 7xl to prevent 'ugly wide' look on large screens, while keeping it responsive */}
                        <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in-10 slide-in-from-bottom-2 duration-500">
                            <GridFormRenderer
                                config={tool.formConfig}
                                onSubmit={onFormSubmit}
                                isSubmitting={submitting}
                                form={form}
                                activeStep={activeStep}
                                onStepChange={setActiveStep}
                                toolId={tool.id}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
