'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FormConfig, FormField, FormStep, LayoutRow, ZoneConfig, FieldRow } from '@/lib/api/creation-tools'
import { Button } from '@/components/ui/Button'
import {
    Plus, Trash2, X, Box, GripVertical, Settings, LayoutGrid
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { StrictModeDroppable } from '@/components/ui/StrictModeDroppable'
import { Badge } from '@/components/ui/Badge'
import { FormBuilderZone } from './FormBuilderZone'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Textarea } from "@/components/ui/Textarea"
import { Checkbox } from "@/components/ui/Checkbox"
import { Switch } from "@/components/ui/Switch"
import { Separator } from "@/components/ui/Separator"
import { Check } from "lucide-react"

// --- Types & Constants ---

interface FormBuilderProps {
    config: FormConfig
    onChange: (config: FormConfig) => void
}

const FIELD_TYPES = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'radio', label: 'Radio Group' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'boolean', label: 'Switch (Boolean)' },
    { value: 'slider', label: 'Slider' },
    { value: 'file', label: 'Single File' },
    { value: 'files', label: 'Multiple Files' },
    { value: 'multi-select', label: 'Multi-Select' },
    { value: 'channel-selector', label: 'Channel Selector (Multi)' },
    { value: 'channel-select', label: 'Channel Picker (Single)' },
    { value: 'color', label: 'Color Picker' },
    { value: 'json', label: 'JSON Editor' },
    { value: 'key-value', label: 'Key-Value Editor' },
    { value: 'template-selector', label: 'Template Selector' },
] as const

type FieldType = typeof FIELD_TYPES[number]['value']

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export function FormBuilder({ config, onChange }: FormBuilderProps) {
    const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null)
    const [activeStepIndex, setActiveStepIndex] = useState(0)
    const [activeTab, setActiveTab] = useState<'properties' | 'fields'>('fields')

    // --- Initialization & Validation ---
    useEffect(() => {
        if (!config) return;

        // Deep clone safely
        let changed = false;
        let newConfig = { ...config };

        // Ensure steps array exists
        if (!newConfig.steps || !Array.isArray(newConfig.steps) || newConfig.steps.length === 0) {
            newConfig.steps = [{
                id: generateId(),
                title: 'Step 1',
                layout: { rows: [] }
            }];
            changed = true;
        }

        // Validate active step index
        if (activeStepIndex >= newConfig.steps.length) {
            setActiveStepIndex(0);
            return; // Let next render handle it
        }

        const activeStep = newConfig.steps[activeStepIndex];

        if (activeStep) {
            // Ensure layout object exists
            if (!activeStep.layout) {
                activeStep.layout = { rows: [] };
                changed = true;
            }

            // Ensure rows array exists
            if (!activeStep.layout.rows) {
                activeStep.layout.rows = [];
                changed = true;
            }

            // Initialize default layout if rows empty
            if (activeStep.layout.rows.length === 0) {
                const defaultZoneId = generateId();
                activeStep.layout.rows = [{
                    id: generateId(),
                    zones: [{
                        id: defaultZoneId,
                        title: 'Main Content',
                        fieldRows: [{ id: generateId(), fields: [] }]
                    }]
                }];
                changed = true;
            } else {
                // Self-healing: Ensure every zone has at least one FieldRow
                activeStep.layout.rows.forEach(row => {
                    if (row && row.zones) {
                        row.zones.forEach(zone => {
                            if (zone && (!zone.fieldRows || zone.fieldRows.length === 0)) {
                                zone.fieldRows = [{ id: generateId(), fields: [] }];
                                changed = true;
                            }
                        });
                    }
                });
            }
        }

        if (changed) {
            onChange(newConfig);
        }
    }, [activeStepIndex, config.steps, config]);

    const generateUniqueFieldName = useCallback((type: string) => {
        const base = `field_${type}_${Date.now()}`
        let name = base
        let counter = 1
        while (config.fields.some(f => f.name === name)) {
            name = `${base}_${counter}`
            counter++
        }
        return name
    }, [config.fields])

    // --- State Accessors ---
    const steps = config.steps || [];
    const currentStep = steps[activeStepIndex];
    // Fail-safe for rendering if useEffect hasn't run yet
    const layoutRows = currentStep ? (currentStep.layout ? currentStep.layout.rows : []) : [];

    // --- Handlers ---

    const updateStepLayout = (newRows: LayoutRow[]) => {
        if (!currentStep) return;
        const newSteps = [...steps];
        newSteps[activeStepIndex] = {
            ...currentStep,
            layout: { ...currentStep.layout, rows: newRows }
        };
        onChange({ ...config, steps: newSteps });
    }

    const handleAddStep = () => {
        const newStep: FormStep = {
            id: generateId(),
            title: `Step ${steps.length + 1}`,
            layout: {
                rows: [{
                    id: generateId(),
                    zones: [{
                        id: generateId(),
                        title: 'Main Content',
                        fieldRows: [{ id: generateId(), fields: [] }]
                    }]
                }]
            }
        };
        onChange({ ...config, steps: [...steps, newStep] });
        setActiveStepIndex(steps.length);
    }

    const handleRemoveStep = (index: number) => {
        if (steps.length <= 1) {
            toast.error("At least one step is required.");
            return;
        }
        const newSteps = steps.filter((_, i) => i !== index);
        onChange({ ...config, steps: newSteps });
        if (activeStepIndex >= newSteps.length) {
            setActiveStepIndex(newSteps.length - 1);
        }
    }

    const handleAddLayoutRow = () => {
        const newRow: LayoutRow = {
            id: generateId(),
            zones: [{
                id: generateId(),
                title: 'New Zone',
                fieldRows: [{ id: generateId(), fields: [] }]
            }]
        };
        updateStepLayout([...layoutRows, newRow]);
        toast.success("Added new layout row");
    }

    const handleAddZoneToRow = (rowId: string) => {
        const newRows = layoutRows.map(row => {
            if (row.id === rowId) {
                return {
                    ...row,
                    zones: [...row.zones, {
                        id: generateId(),
                        title: 'New Zone',
                        fieldRows: [{ id: generateId(), fields: [] }]
                    }]
                };
            }
            return row;
        });
        updateStepLayout(newRows);
    }

    const handleRemoveZone = (rowId: string, zoneId: string) => {
        const newRows = layoutRows.map(row => {
            if (row.id !== rowId) return row;
            return {
                ...row,
                zones: row.zones.filter(z => z.id !== zoneId)
            };
        }).filter(row => row.zones.length > 0); // Remove empty rows

        updateStepLayout(newRows);
    }

    const handleCreateField = (type: FieldType, targetZoneId?: string) => {
        const fieldName = generateUniqueFieldName(type);
        const newField: FormField = {
            name: fieldName,
            label: `New ${type}`,
            type: type,
            validation: { required: false }
        };

        // Add to fields definition
        const newFields = [...config.fields, newField];

        // Add to layout (if targetZoneId provided, else find first available)
        const newRows = [...layoutRows];
        let placed = false;

        // Helper to add field to a zone
        const addFieldToZone = (zone: ZoneConfig) => {
            // Find last row in zone, or create new one
            if (zone.fieldRows.length === 0) {
                zone.fieldRows.push({ id: generateId(), fields: [fieldName] });
            } else {
                const lastRow = zone.fieldRows[zone.fieldRows.length - 1];
                // Simple logic: If last row has space (e.g. < 3 fields), append. Else new row.
                // For now, always append to last row to let user split later?
                // Or let's create a NEW row for every new field added via button to be safe.
                zone.fieldRows.push({ id: generateId(), fields: [fieldName] });
            }
        };

        if (targetZoneId) {
            for (const row of newRows) {
                const zone = row.zones.find(z => z.id === targetZoneId);
                if (zone) {
                    addFieldToZone(zone);
                    placed = true;
                    break;
                }
            }
        } else {
            // Find first zone in first row
            if (newRows.length > 0 && newRows[0].zones.length > 0) {
                addFieldToZone(newRows[0].zones[0]);
                placed = true;
            }
        }

        if (!placed) {
            // Should verify initialization logic handled this, but just in case
            toast.error("No zones available to add field.");
            return;
        }

        if (!currentStep) return;

        const newSteps = [...steps];
        newSteps[activeStepIndex] = {
            ...currentStep,
            layout: { ...currentStep.layout, rows: newRows }
        };

        onChange({ ...config, fields: newFields, steps: newSteps });
        setSelectedFieldName(fieldName);
        setActiveTab('properties');
    }

    // --- Drag & Drop Logic ---
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination, draggableId, type } = result;

        // 1. Reordering Steps
        if (source.droppableId === 'steps-list') {
            const newSteps = [...steps];
            const [moved] = newSteps.splice(source.index, 1);
            newSteps.splice(destination.index, 0, moved);
            onChange({ ...config, steps: newSteps });
            setActiveStepIndex(destination.index);
            return;
        }

        // 2. Dragging Zones (Reorder within/between rows)
        if (type === 'ZONE') {
            // source/dest IDs are Row IDs
            const sourceRowIdx = layoutRows.findIndex(r => r.id === source.droppableId);
            const destRowIdx = layoutRows.findIndex(r => r.id === destination.droppableId);

            if (sourceRowIdx === -1 || destRowIdx === -1) return;

            const newRows = [...layoutRows];
            // Cloning zones array for safety
            const sourceZones = [...newRows[sourceRowIdx].zones];
            const [movedZone] = sourceZones.splice(source.index, 1);

            newRows[sourceRowIdx] = { ...newRows[sourceRowIdx], zones: sourceZones };

            if (sourceRowIdx === destRowIdx) {
                sourceZones.splice(destination.index, 0, movedZone);
                newRows[sourceRowIdx] = { ...newRows[sourceRowIdx], zones: sourceZones };
            } else {
                const destZones = [...newRows[destRowIdx].zones];
                destZones.splice(destination.index, 0, movedZone);
                newRows[destRowIdx] = { ...newRows[destRowIdx], zones: destZones };
            }

            // Clean up empty source row if it wasn't the dest row
            if (sourceRowIdx !== destRowIdx && newRows[sourceRowIdx].zones.length === 0) {
                newRows.splice(sourceRowIdx, 1);
            }

            updateStepLayout(newRows);
            return;
        }

        // 3. Dragging Fields
        if (type === 'FIELD') {
            const fieldType = draggableId.startsWith('comp-') ? draggableId.replace('comp-', '') as FieldType : null;
            const isSidebarDrop = source.droppableId === 'sidebar-fields';

            // Identify Target Type: Zone or FieldRow
            let targetType: 'ZONE' | 'ROW' | null = null;
            let targetZone: ZoneConfig | null = null;
            let targetRow: FieldRow | null = null;

            // Search for target in config
            for (const r of layoutRows) {
                for (const z of r.zones) {
                    if (z.id === destination.droppableId) {
                        targetType = 'ZONE';
                        targetZone = z;
                        break;
                    }
                    const fRow = z.fieldRows.find(fr => fr.id === destination.droppableId);
                    if (fRow) {
                        targetType = 'ROW';
                        targetRow = fRow;
                        break;
                    }
                }
                if (targetType) break;
            }

            if (!targetType) return;


            // CASE A: NEW Field from Sidebar
            if (isSidebarDrop && fieldType) {
                const fieldName = generateUniqueFieldName(fieldType);
                const newFieldBase: FormField = {
                    name: fieldName,
                    label: `New ${fieldType}`,
                    type: fieldType,
                    validation: { required: false }
                };

                const newRows = JSON.parse(JSON.stringify(layoutRows)) as LayoutRow[];
                // Mutate newRows to insert the field
                // Search again to get mutable reference
                let inserted = false;
                for (const r of newRows) {
                    for (const z of r.zones) {
                        if (targetType === 'ZONE' && z.id === targetZone?.id) {
                            // Create new row in zone
                            const newFieldRow: FieldRow = { id: generateId(), fields: [fieldName] };
                            z.fieldRows.splice(destination.index, 0, newFieldRow);
                            inserted = true;
                            break;
                        } else if (targetType === 'ROW' && z.fieldRows.some(fr => fr.id === targetRow?.id)) {
                            // Find row and insert
                            const fRow = z.fieldRows.find(fr => fr.id === targetRow?.id);
                            if (fRow) {
                                fRow.fields.splice(destination.index, 0, fieldName);
                                inserted = true;
                            }
                            break;
                        }
                    }
                    if (inserted) break;
                }

                if (inserted && currentStep) {
                    const newSteps = [...steps];
                    newSteps[activeStepIndex] = { ...currentStep, layout: { ...currentStep.layout, rows: newRows } };
                    onChange({
                        ...config,
                        fields: [...config.fields, newFieldBase],
                        steps: newSteps
                    });
                    setSelectedFieldName(newFieldBase.name);
                    setActiveTab('properties');
                }
                return;
            }

            // CASE B: Reordering Existing Field
            const sourceId = source.droppableId; // FieldRow ID
            const destId = destination.droppableId; // FieldRow ID or Zone ID

            const newRows = JSON.parse(JSON.stringify(layoutRows)) as LayoutRow[]; // Deep clone
            let movedField: string | null = null;

            // 1. Remove from Source
            for (const r of newRows) {
                for (const z of r.zones) {
                    const sRow = z.fieldRows.find((fr: any) => fr.id === sourceId);
                    if (sRow) {
                        const [f] = sRow.fields.splice(source.index, 1);
                        movedField = f;
                        // Cleanup empty rows if it wasn't the last empty one? 
                        // Actually, cleaning up empty rows automatically is good for UX.
                        if (sRow.fields.length === 0) {
                            z.fieldRows = z.fieldRows.filter((fr: any) => fr.id !== sourceId);
                        }
                    }
                }
            }

            if (movedField) {
                // 2. Insert into Destination
                let inserted = false;
                for (const r of newRows) {
                    for (const z of r.zones) {
                        if (targetType === 'ZONE' && z.id === destId) {
                            // Insert as NEW Row
                            const newFieldRow = { id: generateId(), fields: [movedField] };
                            z.fieldRows.splice(destination.index, 0, newFieldRow);
                            inserted = true;
                            break;
                        } else if (targetType === 'ROW') {
                            const dRow = z.fieldRows.find((fr: any) => fr.id === destId);
                            if (dRow) {
                                dRow.fields.splice(destination.index, 0, movedField);
                                inserted = true;
                                break;
                            }
                        }
                    }
                    if (inserted) break;
                }

                updateStepLayout(newRows);
            }
        }
    }

    // --- Render Helpers ---

    if (!currentStep) return <div className="flex h-full items-center justify-center text-muted-foreground">Loading steps...</div>;
    // Strict Layout check
    if (!currentStep.layout || !currentStep.layout.rows) return <div className="flex h-full items-center justify-center text-muted-foreground">Initializing layout...</div>;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background">
            <div className="border-b px-6 py-3 bg-muted/30 flex items-center justify-between gap-4 shrink-0">
                {/* Steps Toolbar */}
                {/* Steps Stepper */}
                <div className="flex items-center w-full max-w-5xl mx-auto px-4 py-6">
                    {steps.map((step, idx) => {
                        const isActive = activeStepIndex === idx;
                        const isCompleted = activeStepIndex > idx;
                        const isLast = idx === steps.length - 1;

                        return (
                            <React.Fragment key={step.id}>
                                <div
                                    className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                                    onClick={() => setActiveStepIndex(idx)}
                                >
                                    {/* Circle Indicator */}
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                                        isActive
                                            ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg ring-4 ring-primary/10"
                                            : isCompleted
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "bg-background border-muted text-muted-foreground hover:border-primary/50"
                                    )}>
                                        {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                                    </div>

                                    {/* Step Label */}
                                    <div className="absolute top-11 whitespace-nowrap text-center">
                                        <p className={cn(
                                            "text-xs font-bold transition-colors",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {step.title}
                                        </p>
                                    </div>

                                    {/* Remove Step Button (Hover only) */}
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

                                {!isLast && (
                                    <div className="flex-1 h-[2px] mx-4 bg-muted relative overflow-hidden rounded-full min-w-[2rem]">
                                        <div
                                            className={cn(
                                                "absolute inset-0 bg-primary transition-transform duration-700 ease-in-out origin-left",
                                                isCompleted ? "scale-x-100" : "scale-x-0"
                                            )}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* Add Step Button */}
                    <div className="flex-none ml-4 relative z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors"
                            onClick={handleAddStep}
                            title="Add New Step"
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddLayoutRow}>
                        <LayoutGrid className="w-4 h-4 mr-2" /> Add Section Row
                    </Button>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 bg-muted/10">
                        <div className="h-full px-8 pb-20">
                            <div className="max-w-[1600px] mx-auto space-y-6">
                                {layoutRows.map((row, rowIdx) => (
                                    <div key={row.id} className="group/row relative">
                                        {/* Layout Row */}
                                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            <div className="flex flex-col gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => handleAddZoneToRow(row.id)} title="Add Column Here">
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <StrictModeDroppable droppableId={row.id} type="ZONE">
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={cn(
                                                        "flex flex-wrap gap-6 min-h-[100px]",
                                                        snapshot.isDraggingOver && "bg-muted/50 rounded-lg p-2 transition-all"
                                                    )}
                                                >
                                                    {row.zones.map((zone, zoneIdx) => (
                                                        <Draggable key={zone.id} draggableId={zone.id} index={zoneIdx}>
                                                            {(providedZone, snapshotZone) => (
                                                                <div
                                                                    ref={providedZone.innerRef}
                                                                    {...providedZone.draggableProps}
                                                                    className={cn(
                                                                        "flex-1 min-w-[320px]", // Minimum width to prevent squishing
                                                                        snapshotZone.isDragging && "z-50"
                                                                    )}
                                                                >
                                                                    <FormBuilderZone
                                                                        zone={zone}
                                                                        configFields={config.fields}
                                                                        dragHandleProps={providedZone.dragHandleProps}
                                                                        onRemoveZone={() => handleRemoveZone(row.id, zone.id)}
                                                                        onUpdateZone={(updates) => {
                                                                            const newRows = JSON.parse(JSON.stringify(layoutRows)) as LayoutRow[];
                                                                            newRows[rowIdx].zones[zoneIdx] = { ...zone, ...updates };
                                                                            updateStepLayout(newRows);
                                                                        }}
                                                                        selectedFieldName={selectedFieldName}
                                                                        onSelectField={setSelectedFieldName}
                                                                        onDeleteField={(fieldRowId, fieldIdx) => {
                                                                            const newRows = JSON.parse(JSON.stringify(layoutRows)) as LayoutRow[];
                                                                            const fRow = newRows[rowIdx].zones[zoneIdx].fieldRows.find(fr => fr.id === fieldRowId);
                                                                            if (fRow) {
                                                                                fRow.fields.splice(fieldIdx, 1);
                                                                                updateStepLayout(newRows);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </StrictModeDroppable>
                                    </div>
                                ))}
                                {layoutRows.length === 0 && (
                                    <div className="text-center py-20 border-2 border-dashed rounded-xl">
                                        <p className="text-muted-foreground mb-4">No layout configured</p>
                                        <Button onClick={handleAddLayoutRow}>Add First Section</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>




                    {/* Sidebar */}
                    <div className="w-80 border-l bg-background flex flex-col h-full">
                        {/* Sidebar Tabs */}
                        <div className="flex items-center border-b">
                            <button
                                className={cn(
                                    "flex-1 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors",
                                    activeTab === 'fields' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"
                                )}
                                onClick={() => setActiveTab('fields')}
                            >
                                Components
                            </button>
                            <button
                                className={cn(
                                    "flex-1 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors",
                                    activeTab === 'properties' ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:bg-muted"
                                )}
                                onClick={() => setActiveTab('properties')}
                            >
                                Properties
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'fields' ? (
                                <>
                                    <h3 className="font-bold mb-4 text-sm uppercase text-muted-foreground">Form Elements</h3>
                                    <StrictModeDroppable droppableId="sidebar-fields" type="FIELD" isDropDisabled={true}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                                                {FIELD_TYPES.map((type, index) => (
                                                    <Draggable key={type.value} draggableId={`comp-${type.value}`} index={index}>
                                                        {(providedDrag, snapshot) => (
                                                            <div
                                                                ref={providedDrag.innerRef}
                                                                {...providedDrag.draggableProps}
                                                                {...providedDrag.dragHandleProps}
                                                                className="p-3 border rounded-lg bg-card hover:border-primary/50 cursor-move text-sm font-medium flex items-center gap-3 transition-colors shadow-sm"
                                                            >
                                                                <div className="p-1.5 bg-muted rounded">
                                                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                                </div>
                                                                {type.label}
                                                                {snapshot.isDragging && (
                                                                    <div className="w-3 h-3 bg-primary rounded-full ml-auto animate-pulse" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </StrictModeDroppable>
                                </>
                            ) : (
                                // PROPERTIES PANEL
                                <div className="space-y-6">
                                    {selectedFieldName ? (
                                        (() => {
                                            const field = config.fields.find(f => f.name === selectedFieldName);
                                            if (!field) return <div className="text-muted-foreground text-sm">Field not found.</div>;

                                            return (
                                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Label</Label>
                                                        <Input
                                                            value={field.label}
                                                            onChange={(e) => {
                                                                const newFields = config.fields.map(f => f.name === selectedFieldName ? { ...f, label: e.target.value } : f);
                                                                onChange({ ...config, fields: newFields });
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <div className="flex justify-between items-baseline">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Field Name (Key)</Label>
                                                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-primary">{'{{' + field.name + '}}'}</code>
                                                        </div>
                                                        <Input
                                                            className="font-mono"
                                                            value={field.name}
                                                            onChange={(e) => {
                                                                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                                                if (!val) return;

                                                                const oldName = field.name;

                                                                // 1. Update list of fields
                                                                const newFields = config.fields.map(f => f.name === oldName ? { ...f, name: val } : f);

                                                                // 2. Update Layouts in all steps
                                                                const newSteps = config.steps.map(step => {
                                                                    if (!step.layout?.rows) return step;
                                                                    const newRows = step.layout.rows.map(row => ({
                                                                        ...row,
                                                                        zones: row.zones.map(zone => ({
                                                                            ...zone,
                                                                            fieldRows: zone.fieldRows.map(fr => ({
                                                                                ...fr,
                                                                                fields: fr.fields.map(n => n === oldName ? val : n)
                                                                            }))
                                                                        }))
                                                                    }));
                                                                    return { ...step, layout: { ...step.layout, rows: newRows } };
                                                                });

                                                                setSelectedFieldName(val);
                                                                onChange({ ...config, fields: newFields, steps: newSteps });
                                                            }}
                                                            title="Unique identifier for this field (alphanumeric and underscores only)"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Placeholder</Label>
                                                            <Input
                                                                value={field.placeholder || ''}
                                                                onChange={(e) => {
                                                                    const newFields = config.fields.map(f => f.name === selectedFieldName ? { ...f, placeholder: e.target.value } : f);
                                                                    onChange({ ...config, fields: newFields });
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Default Value</Label>
                                                            <Input
                                                                value={field.defaultValue || ''}
                                                                onChange={(e) => {
                                                                    const newFields = config.fields.map(f => f.name === selectedFieldName ? { ...f, defaultValue: e.target.value } : f);
                                                                    onChange({ ...config, fields: newFields });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-bold uppercase text-muted-foreground">Description / Help Text</Label>
                                                        <Textarea
                                                            className="min-h-[60px]"
                                                            value={field.description || ''}
                                                            onChange={(e) => {
                                                                const newFields = config.fields.map(f => f.name === selectedFieldName ? { ...f, description: e.target.value } : f);
                                                                onChange({ ...config, fields: newFields });
                                                            }}
                                                        />
                                                    </div>

                                                    {(field.type === 'select' || field.type === 'radio' || field.type === 'multi-select') && (
                                                        <div className="space-y-1.5">
                                                            <Label className="text-xs font-bold uppercase text-muted-foreground">Options</Label>
                                                            <p className="text-[10px] text-muted-foreground">Enter options separated by comma or valid JSON</p>
                                                            <Textarea
                                                                className="min-h-[80px]"
                                                                value={typeof field.options === 'string' ? field.options : JSON.stringify(field.options || [], null, 2)}
                                                                onChange={(e) => {
                                                                    let val: any = e.target.value;
                                                                    try {
                                                                        val = JSON.parse(val);
                                                                    } catch {
                                                                        if (val.includes(',')) {
                                                                            val = val.split(',').map((s: string) => s.trim());
                                                                        }
                                                                    }
                                                                    const newFields = config.fields.map(f => f.name === selectedFieldName ? { ...f, options: val } : f);
                                                                    onChange({ ...config, fields: newFields });
                                                                }}
                                                                placeholder='["Option 1", "Option 2"] or Option 1, Option 2'
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                                                        <h4 className="font-bold text-xs uppercase text-muted-foreground">Validation</h4>

                                                        <div className="flex items-center gap-2">
                                                            <Checkbox
                                                                id="chk-required"
                                                                checked={field.validation?.required || false}
                                                                onCheckedChange={(checked) => {
                                                                    const newFields = config.fields.map(f => f.name === selectedFieldName ? {
                                                                        ...f,
                                                                        validation: { ...f.validation, required: !!checked }
                                                                    } : f);
                                                                    onChange({ ...config, fields: newFields });
                                                                }}
                                                            />
                                                            <Label htmlFor="chk-required" className="cursor-pointer">Required Field</Label>
                                                        </div>
                                                        {['text', 'textarea', 'password'].includes(field.type) && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] uppercase text-muted-foreground">Min Length</Label>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8"
                                                                        value={field.validation?.minLength || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                                                                            const newFields = config.fields.map(f => f.name === selectedFieldName ? {
                                                                                ...f,
                                                                                validation: { ...f.validation, minLength: val }
                                                                            } : f);
                                                                            onChange({ ...config, fields: newFields });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] uppercase text-muted-foreground">Max Length</Label>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8"
                                                                        value={field.validation?.maxLength || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value ? parseInt(e.target.value) : undefined;
                                                                            const newFields = config.fields.map(f => f.name === selectedFieldName ? {
                                                                                ...f,
                                                                                validation: { ...f.validation, maxLength: val }
                                                                            } : f);
                                                                            onChange({ ...config, fields: newFields });
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        {['number', 'slider'].includes(field.type) && (
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] uppercase text-muted-foreground">Min Value</Label>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8"
                                                                        value={field.validation?.min || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                                                            const newFields = config.fields.map(f => f.name === selectedFieldName ? {
                                                                                ...f,
                                                                                validation: { ...f.validation, min: val }
                                                                            } : f);
                                                                            onChange({ ...config, fields: newFields });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-[10px] uppercase text-muted-foreground">Max Value</Label>
                                                                    <Input
                                                                        type="number"
                                                                        className="h-8"
                                                                        value={field.validation?.max || ''}
                                                                        onChange={(e) => {
                                                                            const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                                                            const newFields = config.fields.map(f => f.name === selectedFieldName ? {
                                                                                ...f,
                                                                                validation: { ...f.validation, max: val }
                                                                            } : f);
                                                                            onChange({ ...config, fields: newFields });
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-1.5">
                                                            <Label className="text-[10px] uppercase text-muted-foreground">Custom Invalid Message</Label>
                                                            <Input
                                                                className="h-8"
                                                                value={field.validation?.customMessage || ''}
                                                                placeholder="e.g. Please enter a valid email"
                                                                onChange={(e) => {
                                                                    const newFields = config.fields.map(f => f.name === selectedFieldName ? {
                                                                        ...f,
                                                                        validation: { ...f.validation, customMessage: e.target.value }
                                                                    } : f);
                                                                    onChange({ ...config, fields: newFields });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t">
                                                        <Button
                                                            variant="destructive"
                                                            className="w-full"
                                                            onClick={() => {
                                                                setSelectedFieldName(null);
                                                            }}
                                                        >
                                                            Close Properties
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        <div className="text-center py-10 text-muted-foreground">
                                            <Settings className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                            <p>Select a field to edit its properties.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DragDropContext >
        </div >
    )
}
