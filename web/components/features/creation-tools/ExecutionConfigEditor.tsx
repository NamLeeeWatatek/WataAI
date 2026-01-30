'use client'

import React from 'react'
import { StepExecutionConfig, AiExecutionConfig, HttpExecutionConfig } from '@/lib/api/creation-tools'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Checkbox } from '@/components/ui/Checkbox'
import { Zap, Webhook, ChevronDown, ChevronUp, Copy, Braces } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/ScrollArea'

interface ExecutionConfigEditorProps {
    stepId: string
    execution?: StepExecutionConfig
    onChange: (execution?: StepExecutionConfig) => void
    availableSteps: Array<{ id: string; title: string, fields?: Array<{ name: string, type: string }> }>
    currentFields?: Array<{ name: string, type: string }>
}

export function ExecutionConfigEditor({
    stepId,
    execution,
    onChange,
    availableSteps,
    currentFields = []
}: ExecutionConfigEditorProps) {
    const [isExpanded, setIsExpanded] = React.useState(!!execution)
    const hasExecution = !!execution

    // Sync expansion state when execution is enabled externally (e.g. data loaded)
    React.useEffect(() => {
        if (hasExecution && !isExpanded) {
            setIsExpanded(true)
        }
    }, [hasExecution])

    const handleToggleExecution = (enabled: boolean) => {
        if (!enabled) {
            onChange(undefined)
            setIsExpanded(false)
        } else {
            // Updated: Default strictly to HTTP_WEBHOOK as requested
            onChange({
                type: 'http-webhook',
                trigger: 'immediate',
                config: {
                    type: 'http-webhook',
                    urlTemplate: '',
                    method: 'POST',
                    bodyTemplate: {}, // Default empty JSON object
                    asyncPattern: true // Default to true as per user request
                } as HttpExecutionConfig
            })
            setIsExpanded(true)
        }
    }

    const updateExecution = (updates: Partial<StepExecutionConfig>) => {
        if (!execution) return
        onChange({ ...execution, ...updates })
    }

    const updateConfig = (updates: any) => {
        if (!execution) return
        onChange({
            ...execution,
            config: { ...execution.config, ...updates }
        })
    }

    const copyVariable = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success(`Copied ${text} to clipboard`)
    }

    const copyAllVariables = () => {
        const payload: Record<string, any> = {
            globals: {
                timestamp: '{{timestamp}}',
                user_id: '{{user.id}}',
                tool_id: '{{tool.id}}'
            }
        };

        // Helper to add field variables
        const addFieldToPayload = (f: { name: string, type: string }) => {
            if (f.type === 'template-selector' || f.name === 'template') {
                payload[`${f.name}Image`] = `{{${f.name}Image}}`;
                payload[`${f.name}Description`] = `{{${f.name}Description}}`;
                payload[`${f.name}Id`] = `{{${f.name}Id}}`;
            } else {
                payload[f.name] = `{{${f.name}}}`;
            }
        };

        // Current Step fields
        if (currentFields.length > 0) {
            currentFields.forEach(addFieldToPayload);
        }

        // Previous steps fields (flattened as per backend strategy)
        availableSteps.forEach(step => {
            if (step.fields && step.fields.length > 0) {
                step.fields.forEach(f => {
                    // Only add if not already present (current step fields might overlap or previous steps might overlap)
                    if (!payload[f.name] && !payload[`${f.name}Image`]) {
                        addFieldToPayload(f);
                    }
                });
            } else {
                // Fallback for steps without field info
                payload[`step_${step.id}`] = `{{prev.${step.id}.result}}`;
            }
        });

        navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
        toast.success('Copied recommended JSON payload to clipboard')
    }

    return (
        <Card className={cn(
            "border transition-all duration-200",
            hasExecution
                ? "border-primary/20 bg-primary/5 shadow-md"
                : "border-muted-foreground/10 bg-muted/5 hover:border-primary/10"
        )}>
            <div className="p-1">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <Switch
                            checked={hasExecution}
                            onCheckedChange={handleToggleExecution}
                            className="data-[state=checked]:bg-primary"
                        />
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Label className="text-sm font-bold cursor-pointer" onClick={() => handleToggleExecution(!hasExecution)}>
                                    Webhook & External Execution
                                </Label>
                                {hasExecution && <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-primary/10 text-primary">Active</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                                Trigger an external API (Webhook) when this step is submitted.
                            </p>
                        </div>
                    </div>
                    {hasExecution && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                    )}
                </div>

                {hasExecution && isExpanded && execution && (
                    <div className="px-6 pb-6 pt-2 space-y-6 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="h-px bg-primary/10 w-full mb-6" />

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Configuration */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Execution Settings */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            HTTP Method
                                        </Label>
                                        <Select
                                            value={(execution.config as HttpExecutionConfig).method}
                                            onValueChange={(value: any) => updateConfig({ method: value })}
                                        >
                                            <SelectTrigger className="h-10 bg-background border-muted-foreground/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="POST">POST (Submit Data)</SelectItem>
                                                <SelectItem value="GET">GET (Fetch Data)</SelectItem>
                                                <SelectItem value="PUT">PUT (Update)</SelectItem>
                                                <SelectItem value="PATCH">PATCH (Modify)</SelectItem>
                                                <SelectItem value="DELETE">DELETE</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            When to Trigger
                                        </Label>
                                        <Select
                                            value={execution.trigger}
                                            onValueChange={(value: any) => updateExecution({ trigger: value })}
                                        >
                                            <SelectTrigger className="h-10 bg-background border-muted-foreground/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="immediate">Immediately after Step</SelectItem>
                                                <SelectItem value="onApproval">Wait for Approval</SelectItem>
                                                <SelectItem value="manual">Manual Trigger Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        Destination URL
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            value={(execution.config as HttpExecutionConfig).urlTemplate}
                                            onChange={(e) => updateConfig({ urlTemplate: e.target.value })}
                                            placeholder="https://api.your-service.com/webhook/..."
                                            className="h-10 pl-9 font-mono text-xs bg-background border-muted-foreground/20"
                                        />
                                        <Webhook className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            JSON Payload Template
                                        </Label>
                                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            Supports {'{{variables}}'}
                                        </span>
                                    </div>
                                    <Textarea
                                        value={
                                            (() => {
                                                const cfg = execution.config as HttpExecutionConfig;
                                                if (typeof cfg.bodyTemplate === 'string') {
                                                    return cfg.bodyTemplate;
                                                }
                                                return JSON.stringify(cfg.bodyTemplate || {}, null, 2);
                                            })()
                                        }
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value)
                                                updateConfig({ bodyTemplate: parsed })
                                            } catch {
                                                updateConfig({ bodyTemplate: e.target.value })
                                            }
                                        }}
                                        placeholder='{
  "user_id": "{{user.id}}",
  "data": "{{step_1.field_name}}"
}'
                                        className="font-mono text-xs bg-muted/30 border-muted-foreground/20 min-h-[200px] resize-y"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Variable Helper */}
                            <div className="lg:col-span-1 border-l pl-0 lg:pl-8 border-dashed border-muted-foreground/20 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Braces className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Available Variables</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-primary/10"
                                        onClick={copyAllVariables}
                                        title="Copy recommended payload"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                    Click any variable below to copy it, or use the copy button to get the full JSON structure.
                                </p>

                                <ScrollArea className="h-[350px] pr-4">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase opacity-70 tracking-widest">Global Context</p>
                                            <div className="flex flex-wrap gap-2">
                                                {['{{timestamp}}', '{{user.id}}', '{{tool.id}}'].map(v => (
                                                    <Badge
                                                        key={v}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono text-[10px] py-1 px-2 border-primary/20 bg-primary/5"
                                                        onClick={() => copyVariable(v)}
                                                    >
                                                        {v}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Current Step (Explicitly listed as requested by user) */}
                                        <div className="space-y-2 p-3 rounded-lg border border-primary/10 bg-primary/5">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                                                <Zap className="w-3 h-3" /> Current Step Fields
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {currentFields.map(f => (
                                                    <React.Fragment key={f.name}>
                                                        {f.type === 'template-selector' || f.name === 'template' ? (
                                                            <>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono text-[10px] py-1 px-2 border-primary/20 bg-primary/20"
                                                                    onClick={() => copyVariable(`{{${f.name}Image}}`)}
                                                                    title="Template Image URL"
                                                                >
                                                                    {`{{${f.name}Image}}`}
                                                                </Badge>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono text-[10px] py-1 px-2 border-primary/20 bg-primary/20"
                                                                    onClick={() => copyVariable(`{{${f.name}Description}}`)}
                                                                    title="Template Description"
                                                                >
                                                                    {`{{${f.name}Description}}`}
                                                                </Badge>
                                                            </>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono text-[10px] py-1 px-2"
                                                                onClick={() => copyVariable(`{{${f.name}}}`)}
                                                            >
                                                                {`{{${f.name}}}`}
                                                            </Badge>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                                {currentFields.length === 0 && (
                                                    <p className="text-[10px] text-muted-foreground italic">No fields in this step</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Previous Steps */}
                                        {availableSteps.map(step => (
                                            <div key={step.id} className="space-y-2">
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest truncate max-w-[200px]">
                                                    Step: {step.title}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(step.fields || []).map(f => (
                                                        <React.Fragment key={f.name}>
                                                            {f.type === 'template-selector' || f.name === 'template' ? (
                                                                <>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono text-[10px] py-1 px-2 border-primary/20 bg-primary/20"
                                                                        onClick={() => copyVariable(`{{${f.name}Image}}`)}
                                                                        title={`Previous step template image: ${f.name}`}
                                                                    >
                                                                        {`{{${f.name}Image}}`}
                                                                    </Badge>
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono text-[10px] py-1 px-2 border-primary/20 bg-primary/20"
                                                                        onClick={() => copyVariable(`{{${f.name}Description}}`)}
                                                                        title={`Previous step template description: ${f.name}`}
                                                                    >
                                                                        {`{{${f.name}Description}}`}
                                                                    </Badge>
                                                                </>
                                                            ) : (
                                                                <Badge
                                                                    key={f.name}
                                                                    variant="outline"
                                                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-mono text-[10px] py-1 px-2"
                                                                    onClick={() => copyVariable(`{{${f.name}}}`)}
                                                                    title={`Previous step field: ${f.name}`}
                                                                >
                                                                    {`{{${f.name}}}`}
                                                                </Badge>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                    <Badge
                                                        variant="outline"
                                                        className="cursor-pointer border-dashed text-muted-foreground/60 hover:bg-muted font-mono text-[10px] py-1 px-2 opacity-50 hover:opacity-100"
                                                        onClick={() => copyVariable(`{{prev.${step.id}.result}}`)}
                                                        title="Full step result object"
                                                    >
                                                        {`{{prev.${step.id}.result}}`}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}

                                        {availableSteps.length === 0 && (
                                            <p className="text-xs text-muted-foreground italic text-center py-4 bg-muted/20 rounded-lg">
                                                No previous steps available
                                            </p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

