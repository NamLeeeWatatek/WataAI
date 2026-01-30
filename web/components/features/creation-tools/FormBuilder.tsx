'use client'

import React from 'react'
import { FormConfig, FormField, FormStep, LayoutRow } from '@/lib/api/creation-tools'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2, X, Box, Settings, LayoutGrid } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { SortableItem } from './SortableItem'
import { Badge } from '@/components/ui/Badge'
import { FormBuilderZone } from './FormBuilderZone'
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Switch } from "@/components/ui/Switch"
import { Check } from "lucide-react"

// Import extracted hooks and components
import { useFormBuilderState } from './form-builder/hooks/useFormBuilderState'
import { useFormBuilderOperations } from './form-builder/hooks/useFormBuilderOperations'
import { useFormBuilderDragDrop } from './form-builder/hooks/useFormBuilderDragDrop'
import { ComponentLibrary, FIELD_CATEGORIES } from './form-builder/components/ComponentLibrary'
import { cleanLayout } from './form-builder/utils/formBuilderUtils'
import { ExecutionConfigEditor } from './ExecutionConfigEditor'

interface FormBuilderProps {
    config: FormConfig
    onChange: (config: FormConfig) => void
    onFieldRename?: (oldName: string, newName: string) => void
}

export function FormBuilder({ config, onChange, onFieldRename }: FormBuilderProps) {
    // Use extracted hooks
    const state = useFormBuilderState(config, onChange)
    const operations = useFormBuilderOperations(config, onChange, state)
    const dragDrop = useFormBuilderDragDrop(config, onChange, state)

    const { selectedFieldName, setSelectedFieldName, activeStepIndex, setActiveStepIndex, activeTab, setActiveTab, activeId } = state
    const { handleCreateField, handleAddStep, handleRemoveStep, handleAddLayoutRow, handleAddZoneToRow, handleRemoveZone, updateField, removeSelectedField, updateStepLayout } = operations
    const { sensors, handleDragStart, handleDragOver, handleDragEnd, handleMoveFieldToStep } = dragDrop

    // Derived state
    const steps = config.steps || []
    const currentStep = steps[activeStepIndex]
    const layoutRows = currentStep ? (currentStep.layout ? currentStep.layout.rows : []) : []
    const currentField = config.fields.find(f => f.name === selectedFieldName)

    if (!currentStep) return <div className="flex h-full items-center justify-center text-muted-foreground">Initializing layout...</div>

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full overflow-hidden bg-background">
                {/* Top Bar - Steps */}
                <div className="border-b px-8 py-4 bg-background sticky top-0 z-20 shadow-sm">
                    <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                        <SortableContext items={steps.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                            {steps.map((step, idx) => {
                                const isActive = activeStepIndex === idx
                                const isCompleted = activeStepIndex > idx
                                const isLast = idx === steps.length - 1

                                return (
                                    <React.Fragment key={step.id}>
                                        <div className="flex-1 flex flex-col items-center relative z-10">
                                            <SortableItem id={step.id} data={{ type: 'STEP', index: idx }}>
                                                {({ ref, style, attributes, listeners }) => (
                                                    <div
                                                        ref={ref}
                                                        style={style}
                                                        className="flex flex-col items-center gap-3 group"
                                                        onClick={() => setActiveStepIndex(idx)}
                                                    >
                                                        <div
                                                            {...attributes}
                                                            {...listeners}
                                                            className={cn(
                                                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 cursor-pointer relative",
                                                                isActive
                                                                    ? "bg-primary border-primary text-primary-foreground scale-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] ring-4 ring-primary/20"
                                                                    : isCompleted
                                                                        ? "bg-primary border-primary text-primary-foreground"
                                                                        : "bg-background border-muted-foreground/30 text-muted-foreground hover:border-primary/50"
                                                            )}
                                                        >
                                                            {isActive && (
                                                                <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 -z-10" />
                                                            )}
                                                            {isCompleted ? <Check className="w-5 h-5" /> : idx + 1}
                                                        </div>

                                                        <div className="flex flex-col items-center">
                                                            <p className={cn(
                                                                "text-[11px] font-bold tracking-wider uppercase transition-colors",
                                                                isActive ? "text-primary" : "text-muted-foreground/60"
                                                            )}>
                                                                {step.title}
                                                            </p>
                                                        </div>

                                                        {steps.length > 1 && (
                                                            <div
                                                                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center cursor-pointer shadow-sm z-20"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveStep(idx); }}
                                                                title="Remove Step"
                                                            >
                                                                <X className="w-2.5 h-2.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </SortableItem>

                                            {!isLast && (
                                                <div className="absolute top-[1.25rem] left-[50%] w-full h-[2px] z-[-1]">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-500 origin-left",
                                                            isCompleted ? "bg-primary scale-x-100" : "bg-transparent scale-x-0"
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </React.Fragment>
                                )
                            })}
                        </SortableContext>

                        <div className="flex-none ml-4 relative z-10 self-start mt-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-all hover:scale-110"
                                onClick={handleAddStep}
                                title="Add New Step"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleAddLayoutRow}>
                            <LayoutGrid className="w-4 h-4 mr-2" /> Add Section Row
                        </Button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Canvas - Zone Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                        <div className="h-full px-4 pb-32">
                            <div className="max-w-full mx-auto space-y-6">
                                <SortableContext items={layoutRows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                    {layoutRows.map((row, rowIdx) => (
                                        <div key={row.id} className="group/row relative">
                                            <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleAddZoneToRow(row.id)} title="Add Column Here">
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <SortableContext items={row.zones.map(z => z.id)} strategy={horizontalListSortingStrategy}>
                                                <div className="flex flex-wrap gap-6 min-h-[120px] p-4 transition-all duration-300 rounded-3xl border-4 border-transparent">
                                                    {row.zones.map((zone, zoneIdx) => (
                                                        <SortableItem key={zone.id} id={zone.id} data={{ type: 'ZONE', rowId: row.id, zoneId: zone.id }}>
                                                            {({ ref, style, attributes, listeners, isDragging }) => (
                                                                <div
                                                                    ref={ref}
                                                                    style={style}
                                                                    className={cn(
                                                                        "flex-1 min-w-[320px]",
                                                                        isDragging && "z-50"
                                                                    )}
                                                                >
                                                                    <FormBuilderZone
                                                                        zone={zone}
                                                                        configFields={config.fields}
                                                                        dragHandleProps={{ ...attributes, ...listeners }}
                                                                        onRemoveZone={() => handleRemoveZone(row.id, zone.id)}
                                                                        onUpdateZone={(updates) => {
                                                                            const newRows = JSON.parse(JSON.stringify(layoutRows)) as LayoutRow[]
                                                                            newRows[rowIdx].zones[zoneIdx] = { ...zone, ...updates }
                                                                            updateStepLayout(newRows)
                                                                        }}
                                                                        selectedFieldName={selectedFieldName}
                                                                        onSelectField={setSelectedFieldName}
                                                                        onDeleteField={(fieldRowId, fieldIdx) => {
                                                                            const newRows = JSON.parse(JSON.stringify(layoutRows)) as LayoutRow[]
                                                                            const fRow = newRows[rowIdx].zones[zoneIdx].fieldRows.find(fr => fr.id === fieldRowId)
                                                                            if (fRow) {
                                                                                const [removedField] = fRow.fields.splice(fieldIdx, 1)
                                                                                const newFields = config.fields.filter(f => f.name !== removedField)
                                                                                const newSteps = [...steps]
                                                                                const cleanedRows = cleanLayout(newRows)
                                                                                newSteps[activeStepIndex] = {
                                                                                    ...newSteps[activeStepIndex],
                                                                                    layout: { ...newSteps[activeStepIndex].layout, rows: cleanedRows }
                                                                                }
                                                                                onChange({ ...config, fields: newFields, steps: newSteps })
                                                                                if (selectedFieldName === removedField) {
                                                                                    setSelectedFieldName(null)
                                                                                }
                                                                                toast.success("Field removed")
                                                                            }
                                                                        }}
                                                                        steps={steps}
                                                                        onMoveFieldToStep={handleMoveFieldToStep}
                                                                    />
                                                                </div>
                                                            )}
                                                        </SortableItem>
                                                    ))}
                                                </div>
                                            </SortableContext>
                                        </div>
                                    ))}
                                </SortableContext>

                                {layoutRows.length === 0 && (
                                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                                        <p className="text-muted-foreground mb-4">No layout configured</p>
                                        <Button onClick={handleAddLayoutRow}>Add First Section</Button>
                                    </div>
                                )}

                                {/* Step Execution Config */}
                                <div className="mt-8">
                                    <ExecutionConfigEditor
                                        stepId={currentStep.id}
                                        execution={currentStep.execution}
                                        onChange={(execution) => {
                                            const newSteps = [...steps]
                                            newSteps[activeStepIndex] = {
                                                ...newSteps[activeStepIndex],
                                                execution
                                            }
                                            onChange({ ...config, steps: newSteps })
                                        }}
                                        availableSteps={steps.slice(0, activeStepIndex).map(s => ({
                                            id: s.id,
                                            title: s.title,
                                            fields: s.layout?.rows?.flatMap(r =>
                                                r.zones.flatMap(z =>
                                                    z.fieldRows.flatMap(fr => fr.fields.map(fieldName => {
                                                        const f = config.fields.find(field => field.name === fieldName);
                                                        return { name: fieldName, type: f?.type || 'text' };
                                                    }))
                                                )
                                            ) || []
                                        }))}
                                        currentFields={currentStep.layout?.rows?.flatMap(r =>
                                            r.zones.flatMap(z =>
                                                z.fieldRows.flatMap(fr => fr.fields.map(fieldName => {
                                                    const f = config.fields.find(field => field.name === fieldName);
                                                    return { name: fieldName, type: f?.type || 'text' };
                                                }))
                                            )
                                        ) || []}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Components & Properties */}
                    <div className="w-80 border-l bg-background flex flex-col h-full">
                        <div className="flex items-center border-b bg-muted/20">
                            <button
                                className={cn(
                                    "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
                                    activeTab === 'fields' ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
                                )}
                                onClick={() => setActiveTab('fields')}
                            >
                                Components
                            </button>
                            <button
                                className={cn(
                                    "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
                                    activeTab === 'properties' ? "border-primary text-primary bg-background" : "border-transparent text-muted-foreground/60 hover:text-foreground hover:bg-muted/30"
                                )}
                                onClick={() => setActiveTab('properties')}
                            >
                                Properties
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'fields' ? (
                                <ComponentLibrary />
                            ) : (
                                <div className="p-2">
                                    {currentField ? (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-lg tracking-tight">Field Properties</h3>
                                                    <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                                        {currentField.type}
                                                    </Badge>
                                                </div>

                                                <div className="space-y-5">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase text-muted-foreground/60">Field ID (Key)</Label>
                                                        <Input
                                                            value={currentField.name}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '')
                                                                if (!val) return
                                                                const oldName = currentField.name
                                                                const newFields = config.fields.map(f => f.name === oldName ? { ...f, name: val } : f)
                                                                const newSteps = config.steps.map(step => {
                                                                    if (!step.layout?.rows) return step
                                                                    return {
                                                                        ...step,
                                                                        layout: {
                                                                            ...step.layout,
                                                                            rows: step.layout.rows.map(row => ({
                                                                                ...row,
                                                                                zones: row.zones.map(zone => ({
                                                                                    ...zone,
                                                                                    fieldRows: zone.fieldRows.map(fr => ({
                                                                                        ...fr,
                                                                                        fields: fr.fields.map(n => n === oldName ? val : n)
                                                                                    }))
                                                                                }))
                                                                            }))
                                                                        }
                                                                    }
                                                                })
                                                                setSelectedFieldName(val)
                                                                onChange({ ...config, fields: newFields, steps: newSteps })
                                                                if (onFieldRename) onFieldRename(oldName, val)
                                                            }}
                                                            className="font-mono text-xs bg-muted/20"
                                                        />
                                                        <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-primary">{'{{' + currentField.name + '}}'}</code>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase text-muted-foreground/60">Label Name</Label>
                                                        <Input
                                                            value={currentField.label}
                                                            onChange={(e) => updateField({ label: e.target.value })}
                                                            className="font-medium"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-xs font-bold uppercase text-muted-foreground/60">Description</Label>
                                                        <Textarea
                                                            value={currentField.description || ''}
                                                            onChange={(e) => updateField({ description: e.target.value })}
                                                            className="text-xs resize-none"
                                                            rows={3}
                                                        />
                                                    </div>

                                                    <div className="pt-4 border-t space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <Label className="text-sm font-bold">Required</Label>
                                                                <p className="text-[10px] text-muted-foreground">Force user to fill this field</p>
                                                            </div>
                                                            <Switch
                                                                checked={!!currentField.validation?.required}
                                                                onCheckedChange={(v) => updateField({ validation: { ...currentField.validation, required: v } })}
                                                            />
                                                        </div>

                                                        {['file', 'files'].includes(currentField.type) && (
                                                            <div className="flex items-center justify-between pt-2">
                                                                <div className="space-y-0.5">
                                                                    <Label className="text-sm font-bold">Multiple Files</Label>
                                                                    <p className="text-[10px] text-muted-foreground">Allow uploading more than one file</p>
                                                                </div>
                                                                <Switch
                                                                    checked={!!currentField.multiple || currentField.type === 'files'}
                                                                    onCheckedChange={(v) => updateField({ multiple: v })}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {['select', 'radio', 'checkbox', 'multi-select'].includes(currentField.type) && (
                                                        <div className="pt-4 border-t space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-sm font-bold">Options</Label>
                                                                <div className="flex items-center gap-2">
                                                                    {/* NEW: Use for Post Gen Switch */}
                                                                    <div className="flex items-center gap-1.5 bg-secondary/30 pl-2 pr-1 py-0.5 rounded-full border border-secondary/50" title="Use this field's options for Social Post Style selection">
                                                                        <Label htmlFor="use-post-gen" className="text-[9px] font-bold uppercase text-muted-foreground whitespace-nowrap cursor-pointer">Post Logic</Label>
                                                                        <Switch
                                                                            id="use-post-gen"
                                                                            className="scale-75 origin-right"
                                                                            checked={!!currentField.useForPostGen}
                                                                            onCheckedChange={(v) => updateField({ useForPostGen: v })}
                                                                        />
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 text-xs hover:bg-primary/10 hover:text-primary"
                                                                        onClick={() => {
                                                                            const opts = Array.isArray(currentField.options) ? [...currentField.options] : []
                                                                            opts.push({ label: 'New Option', value: 'new_option' })
                                                                            updateField({ options: opts })
                                                                        }}
                                                                    >
                                                                        <Plus className="w-3 h-3 mr-1" /> Add
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                                                {(Array.isArray(currentField.options) ? currentField.options : []).map((opt: any, idx: number) => (
                                                                    <div key={idx} className="flex gap-2 items-center group/opt">
                                                                        <Input
                                                                            value={opt.label}
                                                                            className="h-7 text-xs bg-background"
                                                                            placeholder="Label"
                                                                            onChange={(e) => {
                                                                                const opts = [...(currentField.options as any[])]
                                                                                const val = e.target.value
                                                                                // Auto-generate value from label if value was simple slug of old label
                                                                                const oldSlug = opt.label.toLowerCase().replace(/[^a-z0-9]+/g, '_')
                                                                                const currentVal = opt.value
                                                                                const newVal = val.toLowerCase().replace(/[^a-z0-9]+/g, '_')

                                                                                opts[idx] = {
                                                                                    ...opts[idx],
                                                                                    label: val,
                                                                                    // Update value only if it looks like it was auto-generated
                                                                                    value: currentVal === oldSlug ? newVal : currentVal
                                                                                }
                                                                                updateField({ options: opts })
                                                                            }}
                                                                        />
                                                                        <Input
                                                                            value={opt.value}
                                                                            className="h-7 text-xs font-mono text-muted-foreground w-20 bg-muted/20"
                                                                            placeholder="Value"
                                                                            onChange={(e) => {
                                                                                const opts = [...(currentField.options as any[])]
                                                                                opts[idx] = { ...opts[idx], value: e.target.value }
                                                                                updateField({ options: opts })
                                                                            }}
                                                                        />
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover/opt:opacity-100 hover:text-destructive hover:bg-destructive/10"
                                                                            onClick={() => {
                                                                                const opts = [...(currentField.options as any[])]
                                                                                opts.splice(idx, 1)
                                                                                updateField({ options: opts })
                                                                            }}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                                {(!currentField.options || (currentField.options as any[]).length === 0) && (
                                                                    <div className="text-center py-4 border border-dashed rounded bg-muted/20">
                                                                        <p className="text-[10px] text-muted-foreground italic">No options defined.</p>
                                                                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" onClick={() => updateField({ options: [{ label: 'Option 1', value: 'opt_1' }] })}>Add Default</Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        className="w-full text-destructive hover:bg-destructive/10 mt-4"
                                                        onClick={removeSelectedField}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" /> Delete Field
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                            <Settings className="w-12 h-12 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Select a field to edit</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DragOverlay>
                {activeId ? (
                    <div className="bg-primary/10 border-2 border-primary rounded-xl p-4 shadow-2xl backdrop-blur-sm scale-105 rotate-2">
                        <div className="text-sm font-bold flex items-center gap-2">
                            <Box className="w-4 h-4" />
                            {activeId}
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
