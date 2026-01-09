'use client';

import { useState, useEffect, useMemo, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools';
import { CreationJobStatus } from '@/lib/types/creation-job';
import { templatesApi } from '@/lib/api/templates';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { Template } from '@/lib/types/template';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Stepper } from '@/components/ui/Stepper';
import { GridFormRenderer } from '@/components/features/creation-tools/GridFormRenderer';
import { useForm } from 'react-hook-form';
import { useCreationJobs } from '@/components/providers/CreationJobsProvider';
import { useToast } from '@/lib/hooks/use-toast';
import {
    showProgressOverlay,
    updateProgressOverlay,
    completeProgressOverlay,
    failProgressOverlay
} from '@/components/ui/ProgressOverlay';
import { generateZodSchema } from '@/lib/utils/schema-generator';
import { zodResolver } from '@hookform/resolvers/zod';

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

    return (
        <div className="space-y-8 min-h-screen pb-20 px-4 md:px-8 max-w-[100vw] overflow-x-hidden">
            <div className="pb-8 border-b border-border/40 space-y-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-12 w-12 border border-border/40 rounded-2xl shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">{tool.name}</h1>
                        {tool.description && <p className="text-sm text-muted-foreground">{tool.description}</p>}
                    </div>
                </div>

                {tool.formConfig?.steps && tool.formConfig.steps.length > 1 && (
                    <div className="w-full px-2">
                        <Stepper
                            steps={tool.formConfig.steps.map((s, i) => ({
                                id: s.id || String(i),
                                title: s.title || `Step ${i + 1}`
                            }))}
                            currentStep={activeStep}
                        />
                    </div>
                )}
            </div>

            <div className="w-full text-foreground">
                <GridFormRenderer
                    config={tool.formConfig}
                    onSubmit={onFormSubmit}
                    isSubmitting={submitting}
                    form={form}
                    activeStep={activeStep}
                    onStepChange={setActiveStep}
                />
            </div>
        </div>
    );
}
