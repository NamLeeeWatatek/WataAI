'use client'

import { DynamicFormField } from '@/components/ui/DynamicFormField'
import { FormConfig, FormField, LayoutRow, ZoneConfig, FieldRow } from '@/lib/api/creation-tools'
import { useForm } from 'react-hook-form'
import { Form, FormField as ShadcnFormField } from '@/components/ui/Form'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

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

    useEffect(() => {
        console.log(`%c[GRID-RENDERER] Active Step: ${currentStepIndex}`, 'color: #3b82f6; font-weight: bold;');
    }, [currentStepIndex]);

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

        // --- PREVIEW LOGIC ---
        // Check if NEXT step has a result-preview field
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
                        allValues={{ ...form.watch(), prev: previewResults?.steps || {} }}
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
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">{zone.title}</h3>
            )}
            {zone.fieldRows.map(fRow => <div key={fRow.id}>{renderFieldRow(fRow)}</div>)}
        </div>
    )

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
                                    allValues={{ ...form.watch(), prev: previewResults?.steps || {} }}
                                    error={fieldState.error?.message}
                                />
                            )}
                        />
                    ))}
                </div>
            )
        }
        return (
            <div className="space-y-10">
                {currentStepConfig.description && <p className="text-sm text-muted-foreground/60">{currentStepConfig.description}</p>}
                {currentStepConfig.layout.rows.map(row => (
                    <div key={row.id} className="flex flex-col md:flex-row gap-8 w-full">
                        {row.zones.map(zone => <div key={zone.id} className="flex-1 min-w-0">{renderZone(zone)}</div>)}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="w-full">
                <div className="min-h-[450px] bg-card/30 backdrop-blur-sm border border-border/40 p-10 rounded-[2.5rem] shadow-2xl shadow-primary/5">
                    {renderStepContent()}
                </div>

                <div className="flex gap-4 mt-8">
                    {currentStepIndex > 0 && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleBack}
                            className="flex-1 h-16 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all hover:bg-muted/50"
                        >
                            Back
                        </Button>
                    )}
                    {!isLastStep ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={isPreviewing}
                            className="flex-[2] h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/10 hover:shadow-primary/20 bg-primary text-primary-foreground"
                        >
                            {isPreviewing ? 'Processing Preview...' : 'Continue'}
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] h-16 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:shadow-primary/30 bg-primary text-primary-foreground transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? 'Processing...' : (config.submitLabel || 'Generate Now')}
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    )
}