'use client'

import { DynamicFormField } from '@/components/ui/DynamicFormField'
import { FormConfig, FormField, LayoutRow, ZoneConfig, FieldRow, creationToolsApi } from '@/lib/api/creation-tools'
import { useForm } from 'react-hook-form'
import { Form, FormField as ShadcnFormField } from '@/components/ui/Form'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from 'sonner'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'
import { creationJobsApi } from '@/lib/api/creation-jobs'


interface GridFormRendererProps {
    config: FormConfig
    onSubmit: (data: Record<string, unknown>) => void
    isSubmitting?: boolean
    form?: any
    activeStep?: number
    onStepChange?: (step: number) => void
    toolId?: string
}

export function GridFormRenderer({
    config,
    onSubmit,
    isSubmitting = false,
    form: externalForm,
    activeStep,
    onStepChange,
    toolId
}: GridFormRendererProps) {
    const [localStep, setLocalStep] = useState(0)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [previewResults, setPreviewResults] = useState<any>(null)
    const [stepResults, setStepResults] = useState<Record<string, any>>({})
    const [isExecutingStep, setIsExecutingStep] = useState(false) // Restored missing state

    // Approval State
    const [approvalData, setApprovalData] = useState<any>(null)
    const [showApprovalDialog, setShowApprovalDialog] = useState(false)
    const [approvalStepId, setApprovalStepId] = useState<string | null>(null)

    // Job State (Drafts)
    const [currentJobId, setCurrentJobId] = useState<string | null>(null)

    // Timer for execution
    const [elapsedTime, setElapsedTime] = useState(0)

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (isExecutingStep) {
            setElapsedTime(0)
            timer = setInterval(() => {
                setElapsedTime(prev => +(prev + 0.1).toFixed(1))
            }, 100)
        }
        return () => clearInterval(timer)
    }, [isExecutingStep])

    // --- POLL FOR JOB UPDATES ---
    useEffect(() => {
        let pollingTimer: NodeJS.Timeout;

        if (currentJobId && !isExecutingStep) {
            // Poll every 3s
            pollingTimer = setInterval(async () => {
                try {
                    const job = await creationJobsApi.findOne(currentJobId);

                    // If polling finds a COMPLETED job, update the preview data
                    if (job && job.status === 'COMPLETED' && job.outputData) {
                        const output = job.outputData as any;

                        // Update previewResults for the preview component
                        setPreviewResults(output);

                        // Also try to update stepResults - heuristic to find which step this output belongs to
                        // If output has 'steps', map them back
                        if (output.steps && Array.isArray(output.steps)) {
                            setStepResults(prev => {
                                const next = { ...prev };
                                output.steps.forEach((s: any) => {
                                    if (s.id && s.result) next[s.id] = s.result;
                                });
                                return next;
                            });
                        } else {
                            // Fallback: If we can't map to a step, treat it as a generic preview result
                            // This ensures it shows up in FieldResultPreview via 'allValues.preview'
                        }
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 3000);
        }

        return () => clearInterval(pollingTimer);
    }, [currentJobId, isExecutingStep]);

    const renderResultPreview = (data: any) => {
        if (!data) return null;

        // 1. Image Detection
        const imageUrl = data.url || data.imageUrl || data.image || (Array.isArray(data.images) && data.images[0]?.url);

        // 2. Text Detection
        const textContent = data.text || data.message || data.content || data.response || (typeof data === 'string' ? data : null);

        // 3. Structured Data (e.g. Generated Fields)
        const hasStructuredData = typeof data === 'object' && data !== null && !imageUrl;

        return (
            <div className="space-y-4">
                {imageUrl && (
                    <div className="rounded-xl overflow-hidden border bg-muted/20 relative group">
                        { }
                        <img
                            src={imageUrl}
                            alt="Generated Result"
                            className="w-full h-auto max-h-[400px] object-contain bg-black/5 dark:bg-black/40"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                            Generated Image
                        </div>
                    </div>
                )}

                {textContent && typeof textContent === 'string' && (
                    <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium text-foreground/90">
                            {textContent}
                        </p>
                    </div>
                )}

                {/* Always show Raw Data for debugging but collapsed if we have preview */}
                <details className="group">
                    <summary className="flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-2">
                        <span className="bg-muted px-1.5 py-0.5 rounded group-open:bg-primary/10">
                            {imageUrl || textContent ? 'View Raw Data' : 'View Output Data'}
                        </span>
                    </summary>
                    <div className="mt-2 rounded-lg bg-muted/50 p-4 overflow-auto max-h-[200px] border border-border/50">
                        <pre className="text-[10px] font-mono whitespace-pre-wrap word-break-all text-muted-foreground">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                </details>
            </div>
        )
    }

    const currentStepIndex = activeStep !== undefined ? activeStep : localStep
    const steps = config.steps || [];
    const totalSteps = steps.length || 1
    const isLastStep = currentStepIndex === totalSteps - 1
    const currentStepConfig = steps[currentStepIndex];

    const internalForm = useForm<Record<string, unknown>>({
        defaultValues: config.fields.reduce((acc, field) => {
            acc[field.name] = field.defaultValue !== undefined ? field.defaultValue :
                (['boolean', 'checkbox'].includes(field.type) ? false : '');
            return acc
        }, {} as Record<string, unknown>),
    })

    const form = externalForm || internalForm

    // --- DYNAMIC VARIABLE RESOLUTION ---
    // Helper to resolve variables in a string
    const resolveValue = (value: any) => {
        if (typeof value !== 'string') return value;
        return value.replace(/\{\{prev\.([^\}]+)\}\}/g, (match, path) => {
            const parts = path.split('.');
            const stepId = parts[0];
            const rest = parts.slice(1);
            let current = stepResults[stepId];
            if (!current) return match;
            for (const part of rest) {
                if (current && typeof current === 'object' && part in current) current = current[part];
                else return match;
            }
            return current !== undefined && current !== null ? String(current) : match;
        });
    };

    // Auto-resolve variables when entering a step or when results change
    useEffect(() => {
        if (!config.fields || !steps[currentStepIndex]) return;
        const currentFields: string[] = [];
        const stepConf = steps[currentStepIndex];
        if (stepConf.layout?.rows) {
            stepConf.layout.rows.forEach(r => r.zones.forEach(z => z.fieldRows.forEach(fr => currentFields.push(...fr.fields))));
        }
        currentFields.forEach(fieldName => {
            const currentVal = form.getValues(fieldName);
            if (typeof currentVal === 'string' && currentVal.includes('{{prev.')) {
                const resolved = resolveValue(currentVal);
                if (resolved !== currentVal) {
                    // console.log(`[GRID-RENDERER] Auto-resolving variable for ${fieldName}: ${currentVal} -> ${resolved}`);
                    form.setValue(fieldName, resolved, { shouldValidate: true, shouldDirty: true });
                }
            }
        });
    }, [currentStepIndex, stepResults, form]);
    // --- END DYNAMIC VARIABLE RESOLUTION ---

    const proceedToNextStep = async () => {
        // --- PREVIEW LOGIC ---
        const nextStepIndex = currentStepIndex + 1;
        if (nextStepIndex < totalSteps && toolId) {
            const nextStep = steps[nextStepIndex];
            let hasResultPreview = false;
            if (nextStep.layout?.rows) {
                nextStep.layout.rows.forEach(row => {
                    row.zones.forEach(zone => {
                        zone.fieldRows.forEach(fr => {
                            fr.fields.forEach(fName => {
                                const f = config.fields.find(field => field.name === fName);
                                if (f?.type === 'result-preview') hasResultPreview = true;
                            });
                        });
                    });
                });
            }

            if (hasResultPreview) {
                try {
                    setIsPreviewing(true);
                    const currentData = form.getValues();
                    console.log('%c[GRID-RENDERER] Triggering Preview Execution...', 'color: #8b5cf6;');
                    const result = await creationJobsApi.preview({
                        creationToolId: toolId,
                        inputData: currentData
                    });
                    setPreviewResults(result);
                } catch (err) {
                    console.error('[GRID-RENDERER] Preview execution failed', err);
                } finally {
                    setIsPreviewing(false);
                }
            }
        }
        // --- END PREVIEW LOGIC ---

        if (activeStep !== undefined && onStepChange) {
            onStepChange(currentStepIndex + 1)
        } else {
            setLocalStep(prev => prev + 1)
        }
    }

    const handleNext = async (e?: React.MouseEvent | React.FormEvent) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }

        const fieldsInCurrentStep: string[] = [];
        if (currentStepConfig && currentStepConfig.layout) {
            currentStepConfig.layout.rows.forEach(row => {
                row.zones.forEach(zone => {
                    zone.fieldRows.forEach(fRow => {
                        fieldsInCurrentStep.push(...fRow.fields);
                    });
                });
            });
        }

        const isValid = await form.trigger(fieldsInCurrentStep as any);

        if (!isValid) {
            console.warn('%c[GRID-RENDERER] Validation Failed!', 'color: red;', form.formState.errors);
            return;
        }

        // NEW: Check if current step has execution config
        if (currentStepConfig?.execution && toolId) {
            try {
                setIsExecutingStep(true);
                const currentData = form.getValues();

                console.log('%c[GRID-RENDERER] Executing step:', 'color: #10b981; font-weight: bold;', currentStepConfig.id);

                // Execute step
                const result = await creationToolsApi.executeStep(
                    toolId,
                    currentStepConfig.id,
                    currentData,
                    stepResults,
                    currentJobId || undefined // Pass the current Draft Job ID
                );

                // Update Job ID if returned (Draft created/updated)
                if (result.jobId) {
                    console.log('[GRID-RENDERER] Job ID Updated:', result.jobId);
                    setCurrentJobId(result.jobId);
                }

                // Store result (Immediate Sync Result)
                if (result.result) {
                    setStepResults(prev => ({
                        ...prev,
                        [currentStepConfig.id]: result.result
                    }));
                    // Also set as generic preview if this was the last step action
                    setPreviewResults(result.result);
                } else if (result.jobId) {
                    // Async Result - we have a job ID but no immediate result. 
                    // The Polling Effect will pick this up.
                    // We can optimistically set a "Processing" state in results if needed, 
                    // but FieldResultPreview handles nulls.
                    console.log('Async job started, waiting for polling...');
                }

                toast.success(`Step executed successfully!`);

                // Check if requires approval
                if (currentStepConfig.execution.trigger === 'onApproval' || currentStepConfig.requiresApproval) {
                    setApprovalData(result.result)
                    setApprovalStepId(currentStepConfig.id)
                    setShowApprovalDialog(true)
                    return; // PAUSE HERE
                }

            } catch (error: any) {
                console.error('[GRID-RENDERER] Step execution failed:', error);
                toast.error(error?.message || 'Step execution failed');
                return; // Don't proceed to next step on error
            } finally {
                setIsExecutingStep(false);
            }
        }

        // Proceed to next step if no blocking execution
        await proceedToNextStep();
    }

    const onFormSubmit = async (data: any) => {
        if (!isLastStep) {
            handleNext();
            return;
        }

        const isActuallyValid = await form.trigger();
        if (!isActuallyValid) {
            console.error('[GRID-RENDERER] Blocking submission: invalid form state', form.formState.errors);
            return;
        }

        onSubmit(data);
    }

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        if (activeStep !== undefined && onStepChange) {
            onStepChange(currentStepIndex - 1)
        } else {
            setLocalStep(prev => prev - 1)
        }
    }

    const renderFormField = (field: FormField) => {
        return (
            <ShadcnFormField
                key={field.name}
                control={form.control}
                name={field.name}
                render={({ field: formField, fieldState }) => (
                    <DynamicFormField
                        field={field}
                        value={formField.value}
                        onChange={(_, val) => {
                            formField.onChange(val);
                            if (field.validation) {
                                form.trigger(field.name as any);
                            }
                        }}
                        allValues={{ ...form.watch(), prev: stepResults, preview: previewResults }}
                        error={fieldState.error?.message}
                    />
                )}
            />
        )
    }

    const renderFieldRow = (fieldRow: FieldRow) => (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, fieldRow.fields.length)}, minmax(0, 1fr))` }}>
            {fieldRow.fields.map(fieldName => {
                const field = config.fields.find(f => f.name === fieldName);
                return field ? <div key={fieldName} className="min-w-0">{renderFormField(field)}</div> : null;
            })}
        </div>
    )

    const renderZone = (zone: ZoneConfig) => (
        <div className="flex flex-col gap-4">
            {zone.title && !['Main Content', 'New Zone', 'Untitled Zone'].includes(zone.title) && (
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{zone.title}</h3>
            )}
            {zone.fieldRows.map(fRow => <div key={fRow.id}>{renderFieldRow(fRow)}</div>)}
        </div>
    )

    const handleApprovalConfirm = async () => {
        setShowApprovalDialog(false);
        setApprovalData(null);
        setApprovalStepId(null);
        // User approved, so we proceed
        await proceedToNextStep();
    }

    const renderStepContent = () => {
        // Fallback to simple grid if no layout, OR if layout rows are empty (preventing blank pages)
        if (!currentStepConfig || !currentStepConfig.layout || !currentStepConfig.layout.rows || currentStepConfig.layout.rows.length === 0) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.fields.map(f => (
                        <ShadcnFormField
                            key={f.name}
                            control={form.control}
                            name={f.name}
                            render={({ field: formField, fieldState }) => (
                                <DynamicFormField
                                    field={f}
                                    value={formField.value}
                                    onChange={(_, val) => {
                                        formField.onChange(val);
                                        if (f.validation) {
                                            form.trigger(f.name as any);
                                        }
                                    }}
                                    allValues={{ ...form.watch(), prev: stepResults, preview: previewResults }}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />
                    ))}
                </div>
            )
        }
        return (
            <div className="space-y-8">
                {currentStepConfig.description && <p className="text-sm text-muted-foreground/60">{currentStepConfig.description}</p>}
                {currentStepConfig.layout.rows.map(row => (
                    <div key={row.id} className="flex flex-col md:flex-row gap-6 w-full">
                        {row.zones.map(zone => <div key={zone.id} className="flex-1 min-w-0">{renderZone(zone)}</div>)}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="w-full">
                <div className="w-full">
                    {renderStepContent()}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-16">
                    {currentStepIndex > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleBack}
                            className="h-14 px-8 rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                        >
                            Back
                        </Button>
                    )}
                    {!isLastStep ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={isPreviewing || isExecutingStep}
                            className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] bg-primary text-primary-foreground shadow-[0_8px_32px_-8px_rgba(var(--primary),0.5)] hover:shadow-[0_12px_40px_-8px_rgba(var(--primary),0.6)] transition-all active:scale-[0.98]"
                        >
                            {isExecutingStep
                                ? `Executing Step... (${elapsedTime}s)`
                                : isPreviewing
                                    ? 'Processing Preview...'
                                    : (currentStepConfig.execution ? 'Run & Continue' : 'Continue')}
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-14 rounded-2xl font-bold uppercase tracking-[0.15em] text-[10px] bg-primary text-primary-foreground shadow-[0_8px_32px_-8px_rgba(var(--primary),0.5)] hover:shadow-[0_12px_40px_-8px_rgba(var(--primary),0.6)] transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? 'Processing...' : (config.submitLabel || 'Launch Generation')}
                        </Button>
                    )}
                </div>
            </form>

            <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-xl border-white/10 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                <span className="text-green-500 text-lg">✓</span>
                            </div>
                            Step Completed
                        </DialogTitle>
                        <DialogDescription>
                            Review the generated content below. You can proceed if it looks correct.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {renderResultPreview(approvalData)}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setShowApprovalDialog(false)} className="text-muted-foreground hover:text-foreground">
                            Close & Modify Inputs
                        </Button>
                        <Button onClick={handleApprovalConfirm} className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20">
                            Approve Result & Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Form>
    )
}