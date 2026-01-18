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
import { ArrowLeft } from 'lucide-react';
import { GridFormRenderer } from '@/components/features/creation-tools/GridFormRenderer';
import { useForm } from 'react-hook-form';
import { useCreationJobs } from '@/components/providers/CreationJobsProvider';
import { useToast } from '@/lib/hooks/use-toast';

import { generateZodSchema } from '@/lib/utils/schema-generator';
import { zodResolver } from '@hookform/resolvers/zod';
import { completeProgressOverlay, failProgressOverlay, showProgressOverlay } from '@/components/shared/ProgressOverlay';
import { FormSkeleton } from '@/components/shared/Skeletons';

import { PageShell } from '@/components/layout/PageShell';

export default function CreationToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params);
    const slug = resolvedParams.slug;
    const { data: tool, isLoading: toolLoading } = useQuery({
        queryKey: ['creation-tool', slug],
        queryFn: () => creationToolsApi.getBySlug(slug),
    });

    if (toolLoading) {
        return (
            <div className="flex-1 w-full bg-background overflow-hidden">
                <FormSkeleton />
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

    const getStepTitle = (step: any, index: number) => {
        const firstZoneTitle = step.layout?.rows?.[0]?.zones?.[0]?.title;
        if (firstZoneTitle && firstZoneTitle !== 'Main Zone') return firstZoneTitle;
        if (step.title && !step.title.startsWith('Step ')) return step.title;
        return `Step ${index + 1}`;
    };

    const steps = tool.formConfig?.steps || [];
    const showSteps = steps.length > 1;

    return (
        <PageShell
            title={tool.name}
            description={tool.categories?.[0]?.name || 'AI Creation Tool'}
            className="bg-transparent"
        >
            <div className="w-full max-w-4xl mx-auto py-2 lg:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="bg-card border border-border/60 rounded-[32px] shadow-2xl shadow-black/5 overflow-hidden flex flex-col h-auto">
                    {/* Unified Header with Steps */}
                    {showSteps && (
                        <div className="px-8 lg:px-12 py-5 bg-secondary/10 border-b border-border/40">
                            <nav className="flex items-center justify-between gap-4 max-w-xl mx-auto">
                                {steps.map((step, index) => {
                                    const isActive = activeStep === index;
                                    const isCompleted = activeStep > index;

                                    return (
                                        <div key={index} className="flex-1 flex items-center group">
                                            <button
                                                onClick={() => isCompleted && setActiveStep(index)}
                                                disabled={!isCompleted && !isActive}
                                                className="flex flex-col items-center gap-1.5 group outline-none"
                                            >
                                                <div className={cn(
                                                    "w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold font-mono transition-all duration-300",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                                                        : isCompleted
                                                            ? "bg-primary/10 text-primary border border-primary/20"
                                                            : "bg-muted text-muted-foreground/40 opacity-50"
                                                )}>
                                                    {index + 1}
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-[0.15em] hidden md:block transition-colors",
                                                    isActive ? "text-foreground" : "text-muted-foreground/30"
                                                )}>
                                                    {getStepTitle(step, index)}
                                                </span>
                                            </button>

                                            {index < steps.length - 1 && (
                                                <div className="flex-1 h-[1px] mx-3 bg-border/30 relative top-[-8px] md:top-[-11px]">
                                                    <div
                                                        className="absolute inset-0 bg-primary/40 transition-all duration-500"
                                                        style={{ width: isCompleted ? '100%' : '0%' }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </nav>
                        </div>
                    )}

                    {/* Progress Bar (Very thin line) */}
                    <div className="h-1 w-full bg-border/20">
                        <div
                            className="h-full bg-primary transition-all duration-700 ease-out"
                            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    {/* Form Content Area */}
                    <div className="p-8 lg:p-12 pt-6">
                        {/* Step Description only - Title is clearly indicated in the stepper above */}
                        {steps[activeStep]?.description && (
                            <div className="mb-8 text-center max-w-xl mx-auto animate-in fade-in slide-in-from-top-1 duration-500">
                                <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                                    {steps[activeStep].description}
                                </p>
                            </div>
                        )}

                        <div className="animate-in fade-in duration-700">
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

                {/* Meta Info */}
                <div className="mt-8 flex justify-center items-center gap-4 text-muted-foreground/40 font-bold text-[10px] uppercase tracking-[0.2em]">
                    <span>AI Model Processing</span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <span>Auto-Save active</span>
                    <div className="w-1 h-1 rounded-full bg-border" />
                    <span>Secure Input</span>
                </div>
            </div>
        </PageShell>
    );
}
