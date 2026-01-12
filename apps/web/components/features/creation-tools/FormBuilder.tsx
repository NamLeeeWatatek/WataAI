'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FormConfig, FormField, FormStep, LayoutRow, ZoneConfig, FieldRow } from '@/lib/api/creation-tools'
import { Button } from '@/components/ui/Button'
import {
    Plus, Trash2, X, Box, GripVertical, Settings, LayoutGrid
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    DndContext,
    closestCenter,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent,
    defaultDropAnimationSideEffects,
    DropAnimation,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { SidebarDraggableItem } from './SidebarDraggableItem';
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
    onFieldRename?: (oldName: string, newName: string) => void
}

const FIELD_CATEGORIES = [
    {
        label: 'Basic Elements',
        items: [
            { value: 'text', label: 'Short Text' },
            { value: 'textarea', label: 'Long Text Area' },
            { value: 'number', label: 'Number' },
            { value: 'select', label: 'Dropdown' },
            { value: 'radio', label: 'Radio Selection' },
            { value: 'checkbox', label: 'Checkbox' },
            { value: 'boolean', label: 'Switch' },
            { value: 'color', label: 'Color' },
        ]
    },
    {
        label: 'Special Selectors',
        items: [
            { value: 'template-selector', label: 'Template Gallery' },
            { value: 'channel-selector', label: 'Multiple Channels' },
            { value: 'channel-select', label: 'Single Channel' },
            { value: 'page-selector', label: 'Facebook Page Picker' },
            { value: 'file', label: 'Media Upload' },
        ]
    },
    {
        label: 'Workflow & Preview',
        items: [
            { value: 'result-preview', label: 'Step Result Preview' },
            { value: 'json', label: 'JSON Data Editor' },
            { value: 'key-value', label: 'Key-Value Configuration' },
        ]
    }
]

const FIELD_TYPES = FIELD_CATEGORIES.flatMap(c => c.items);

type FieldType = string;

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

export function FormBuilder({ config, onChange, onFieldRename }: FormBuilderProps) {
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
            type: type as any,
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
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const [activeId, setActiveId] = useState<string | null>(null);

    // --- Helper: Clean Layout (Remove Empty Rows) ---
    const cleanLayout = useCallback((rows: LayoutRow[]): LayoutRow[] => {
        return rows.map(row => ({
            ...row,
            zones: row.zones.map(zone => {
                // Remove rows that have no fields
                const cleanRows = zone.fieldRows.filter(fr => fr.fields.length > 0);
                return { ...zone, fieldRows: cleanRows };
            })
        }));
    }, []);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const lastStepSwitchRef = React.useRef(0);

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // 1. Auto-switch Steps
        if (overData?.type === 'STEP') {
            const targetIndex = overData.index;
            if (activeStepIndex !== targetIndex) {
                const now = Date.now();
                if (now - lastStepSwitchRef.current > 600) {
                    setActiveStepIndex(targetIndex);
                    lastStepSwitchRef.current = now;
                }
            }
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;
        const activeData = active.data.current;
        const overData = over.data.current;

        // --- 1. Reordering Steps ---
        if (activeData?.type === 'STEP') {
            if (activeId === overId) return;
            const oldIndex = steps.findIndex(s => s.id === activeId);
            const newIndex = steps.findIndex(s => s.id === overId);
            if (oldIndex !== -1 && newIndex !== -1) {
                const newSteps = arrayMove(steps, oldIndex, newIndex);
                onChange({ ...config, steps: newSteps });
                setActiveStepIndex(newIndex);
            }
            return;
        }

        // --- 2. Dragging Sidebar Component ---
        if (activeData?.type === 'SIDEBAR_COMPONENT') {
            const fieldType = activeData.componentType as FieldType;
            let targetStepIndex = activeStepIndex;
            let targetZoneId: string | undefined = undefined;

            if (overData?.type === 'STEP') {
                targetStepIndex = overData.index;
            } else if (overData?.type === 'FIELD') {
                targetZoneId = overData.zoneId;
            } else if (overData?.type === 'ZONE') {
                targetZoneId = overId;
            }

            // Create field in the target step
            const fieldName = generateUniqueFieldName(fieldType);
            const newField: FormField = {
                name: fieldName,
                label: `New ${fieldType}`,
                type: fieldType as any,
                validation: { required: false }
            };

            const newSteps = [...steps];
            const targetStep = { ...newSteps[targetStepIndex] };
            let newLayoutRows = JSON.parse(JSON.stringify(targetStep.layout.rows)) as LayoutRow[];

            let placed = false;
            const addFieldToZone = (zone: ZoneConfig) => {
                // If the last row is empty, use it. Otherwise create new row for vertical stacking.
                if (zone.fieldRows.length > 0) {
                    const lastRow = zone.fieldRows[zone.fieldRows.length - 1];
                    // Logic: If explicitly dropping on Zone via Sidebar, we usually want to append to bottom.
                    // If the last row has space, we could append. But "Drop on Zone" usually implies "New Row"
                    // UNLESS the last row is already empty (don't create duplicates).
                    if (lastRow.fields.length === 0) {
                        lastRow.fields.push(fieldName);
                    } else {
                        // Create new row
                        zone.fieldRows.push({ id: generateId(), fields: [fieldName] });
                    }
                } else {
                    zone.fieldRows.push({ id: generateId(), fields: [fieldName] });
                }
                placed = true;
            };

            if (targetZoneId) {
                for (const row of newLayoutRows) {
                    const zone = row.zones.find(z => z.id === targetZoneId);
                    if (zone) { addFieldToZone(zone); break; }
                }
            } else if (newLayoutRows.length > 0 && newLayoutRows[0].zones.length > 0) {
                addFieldToZone(newLayoutRows[0].zones[0]);
            }

            if (placed) {
                // Clean layout before saving to remove any accidental empty rows
                newLayoutRows = cleanLayout(newLayoutRows);

                targetStep.layout = { ...targetStep.layout, rows: newLayoutRows };
                newSteps[targetStepIndex] = targetStep;
                onChange({ ...config, fields: [...config.fields, newField], steps: newSteps });
                setSelectedFieldName(fieldName);
                setActiveTab('properties');
                if (targetStepIndex !== activeStepIndex) {
                    setActiveStepIndex(targetStepIndex);
                    toast.success(`Field added to ${targetStep.title}`);
                }
            }
            return;
        }

        // --- 3. Move Zone or Field ---
        const newSteps = JSON.parse(JSON.stringify(steps)) as FormStep[];
        let changed = false;

        if (activeData?.type === 'ZONE') {
            if (activeId === overId) return;
            const currentRows = newSteps[activeStepIndex].layout.rows;

            // Find source
            let sourceRowIdx = -1;
            let sourceZoneIdx = -1;
            for (let i = 0; i < currentRows.length; i++) {
                sourceZoneIdx = currentRows[i].zones.findIndex(z => z.id === activeId);
                if (sourceZoneIdx !== -1) { sourceRowIdx = i; break; }
            }

            // Find destination
            let destRowIdx = -1;
            let destZoneIdx = -1;
            for (let i = 0; i < currentRows.length; i++) {
                if (currentRows[i].id === overId) {
                    destRowIdx = i;
                    destZoneIdx = currentRows[i].zones.length;
                    break;
                }
                const zIdx = currentRows[i].zones.findIndex(z => z.id === overId);
                if (zIdx !== -1) {
                    destRowIdx = i;
                    destZoneIdx = zIdx;
                    break;
                }
            }

            if (sourceRowIdx !== -1 && destRowIdx !== -1) {
                const [movedZone] = currentRows[sourceRowIdx].zones.splice(sourceZoneIdx, 1);
                if (sourceRowIdx === destRowIdx && sourceZoneIdx < destZoneIdx) {
                    destZoneIdx--;
                }
                currentRows[destRowIdx].zones.splice(destZoneIdx, 0, movedZone);
                changed = true;
            }
        } else if (activeData?.type === 'FIELD') {
            if (activeId === overId) return;

            let movedFieldName: string | null = null;
            let sourceStepIdx = -1;

            // 1. Find and Remove from source step (search all steps)
            for (let s = 0; s < newSteps.length; s++) {
                const step = newSteps[s];
                if (!step.layout?.rows) continue;

                for (const row of step.layout.rows) {
                    for (const zone of row.zones) {
                        for (const fieldRow of zone.fieldRows) {
                            const idx = fieldRow.fields.indexOf(activeId);
                            if (idx !== -1) {
                                fieldRow.fields.splice(idx, 1);
                                movedFieldName = activeId;
                                sourceStepIdx = s;
                                // We found and removed it.
                                // We don't break immediately out of the outer loops using labels to keep it simple,
                                // but we set flags. ensuring we stop searching.
                                break;
                            }
                        }
                        if (movedFieldName) break;
                    }
                    if (movedFieldName) break;
                }
                if (movedFieldName) break;
            }

            if (movedFieldName) {
                // 2. Insert into destination
                if (overData?.type === 'STEP') {
                    // Move to a completely different step
                    const targetStepIdx = overData.index;
                    const targetStep = newSteps[targetStepIdx];

                    if (!targetStep.layout) targetStep.layout = { rows: [] };
                    if (!targetStep.layout.rows) targetStep.layout.rows = [];

                    // Ensure target has at least one row/zone
                    if (targetStep.layout.rows.length === 0) {
                        targetStep.layout.rows.push({
                            id: generateId(),
                            zones: [{
                                id: generateId(),
                                title: 'Main Content',
                                fieldRows: [{ id: generateId(), fields: [] }]
                            }]
                        });
                    }

                    // Append to first zone of first row of target step
                    // TODO: Make this smarter? (e.g. append to last zone?)
                    const targetZone = targetStep.layout.rows[0].zones[0];
                    if (targetZone.fieldRows.length === 0) targetZone.fieldRows.push({ id: generateId(), fields: [] });

                    targetZone.fieldRows[targetZone.fieldRows.length - 1].fields.push(movedFieldName);

                    changed = true;
                    if (targetStepIdx !== activeStepIndex) {
                        setActiveStepIndex(targetStepIdx);
                        toast.success(`Moved to ${targetStep.title}`);
                    }
                } else {
                    // Reorder within currently visible step (which might have changed during drag)
                    // The 'over' target is in 'newSteps[activeStepIndex]' because that's what's rendered.
                    const currentStepLayoutRows = newSteps[activeStepIndex].layout.rows;
                    let inserted = false;

                    for (const r of currentStepLayoutRows) {
                        for (const z of r.zones) {
                            // Option A: Dropped over a zone directly (Vertical Stacking)
                            if (z.id === overId) {
                                // Check if last row is empty to avoid duplicates
                                if (z.fieldRows.length > 0 && z.fieldRows[z.fieldRows.length - 1].fields.length === 0) {
                                    z.fieldRows[z.fieldRows.length - 1].fields.push(movedFieldName);
                                } else {
                                    z.fieldRows.push({ id: generateId(), fields: [movedFieldName] });
                                }
                                inserted = true;
                                break;
                            }
                            // Option B: Dropped over another field
                            for (const fr of z.fieldRows) {
                                const idx = fr.fields.indexOf(overId);
                                if (idx !== -1) {
                                    // Insert BEFORE or AFTER? default sortable is usually before if moving up.
                                    // But here we rely on array index.
                                    // Dnd-kit sortable strategy usually handles the visualization, 
                                    // but we need to commit the data change logic.
                                    // Ideally we should use `index` from DragEndEvent but for simpler logic finding ID works.
                                    fr.fields.splice(idx, 0, movedFieldName);
                                    inserted = true;
                                    break;
                                }
                            }
                            if (inserted) break;
                        }
                        if (inserted) break;
                    }
                    if (inserted) changed = true;
                }
            }
        }

        if (changed) {
            // Apply cleanup to remove any empty rows created or left behind
            newSteps[activeStepIndex].layout.rows = cleanLayout(newSteps[activeStepIndex].layout.rows);
            // Also clean target step if we moved across steps (case 2 only cleaned target step locally but we are in case 3 now?
            // Case 3 handles "Move Zone or Field". If 'FIELD' moved to 'STEP', we accessed `newSteps[targetStepIdx]`.
            // We should clean that one too if we modified it.
            if (activeData?.type === 'FIELD' && overData?.type === 'STEP') {
                const tStep = newSteps[overData.index];
                if (tStep && tStep.layout) {
                    tStep.layout.rows = cleanLayout(tStep.layout.rows);
                }
            }

            onChange({ ...config, steps: newSteps });
        }
    };

    if (!currentStep) return <div className="flex h-full items-center justify-center text-muted-foreground">Initializing layout...</div>;

    const currentField = config.fields.find(f => f.name === selectedFieldName);

    const updateField = (updates: Partial<FormField>) => {
        if (!selectedFieldName) return;
        const newFields = config.fields.map(f => f.name === selectedFieldName ? { ...f, ...updates } : f);
        onChange({ ...config, fields: newFields });
    };

    const removeSelectedField = () => {
        if (!selectedFieldName) return;

        // 1. Remove from all steps' layouts
        const newSteps = steps.map(step => {
            if (!step.layout?.rows) return step;
            // First remove field from all rows
            const uncleanRows = step.layout.rows.map(row => ({
                ...row,
                zones: row.zones.map(zone => ({
                    ...zone,
                    fieldRows: zone.fieldRows.map(fr => ({
                        ...fr,
                        fields: fr.fields.filter(f => f !== selectedFieldName)
                    }))
                }))
            }));
            // Then clean the structure
            return {
                ...step,
                layout: {
                    ...step.layout,
                    // Use cleaner helper
                    rows: cleanLayout(uncleanRows)
                }
            };
        });

        // 2. Remove from field definitions
        const newFields = config.fields.filter(f => f.name !== selectedFieldName);

        onChange({ ...config, fields: newFields, steps: newSteps });
        setSelectedFieldName(null);
        toast.success("Field removed");
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-col h-full overflow-hidden bg-background">
                <div className="border-b px-6 py-3 bg-muted/30 flex items-center justify-between gap-4 shrink-0">
                    {/* Steps Stepper */}
                    <div className="flex items-center w-full max-w-5xl mx-auto px-4 py-6">
                        <SortableContext items={steps.map(s => s.id)} strategy={horizontalListSortingStrategy}>
                            {steps.map((step, idx) => {
                                const isActive = activeStepIndex === idx;
                                const isCompleted = activeStepIndex > idx;
                                const isLast = idx === steps.length - 1;

                                return (
                                    <React.Fragment key={step.id}>
                                        <SortableItem id={step.id} data={{ type: 'STEP', index: idx }}>
                                            {({ ref, style, attributes, listeners }) => (
                                                <div
                                                    ref={ref}
                                                    style={style}
                                                    className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer"
                                                    onClick={() => setActiveStepIndex(idx)}
                                                >
                                                    <div
                                                        {...attributes}
                                                        {...listeners}
                                                        className={cn(
                                                            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300",
                                                            isActive
                                                                ? "bg-primary border-primary text-primary-foreground scale-110 shadow-lg ring-4 ring-primary/10"
                                                                : isCompleted
                                                                    ? "bg-primary border-primary text-primary-foreground"
                                                                    : "bg-background border-muted text-muted-foreground hover:border-primary/50"
                                                        )}
                                                    >
                                                        {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                                                    </div>

                                                    <div className="absolute top-11 whitespace-nowrap text-center">
                                                        <p className={cn(
                                                            "text-xs font-bold transition-colors",
                                                            isActive ? "text-primary" : "text-muted-foreground"
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
                        </SortableContext>

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

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleAddLayoutRow}>
                            <LayoutGrid className="w-4 h-4 mr-2" /> Add Section Row
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-8 bg-muted/10">
                        <div className="h-full px-8 pb-20">
                            <div className="max-w-[1600px] mx-auto space-y-6">
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
                            </div>
                        </div>
                    </div>

                    <div className="w-80 border-l bg-background flex flex-col h-full">
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
                                <div className="space-y-6">
                                    {FIELD_CATEGORIES.map((cat, catIdx) => (
                                        <div key={catIdx} className="space-y-3">
                                            <h3 className="font-bold text-[10px] uppercase text-primary/60 tracking-widest flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-primary" />
                                                {cat.label}
                                            </h3>
                                            <div className="space-y-2">
                                                {cat.items.map((type) => (
                                                    <SidebarDraggableItem
                                                        key={type.value}
                                                        id={type.value}
                                                        type={type.value}
                                                        label={type.label}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
                                                                const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '');
                                                                if (!val) return;
                                                                const oldName = currentField.name;
                                                                const newFields = config.fields.map(f => f.name === oldName ? { ...f, name: val } : f);
                                                                const newSteps = config.steps.map(step => {
                                                                    if (!step.layout?.rows) return step;
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
                                                                    };
                                                                });
                                                                setSelectedFieldName(val);
                                                                onChange({ ...config, fields: newFields, steps: newSteps });
                                                                if (onFieldRename) onFieldRename(oldName, val);
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

                                                    {['select', 'radio', 'multi-select'].includes(currentField.type) && (
                                                        <div className="space-y-3 pt-4 border-t">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-xs font-bold uppercase text-muted-foreground/60">Options</Label>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 px-2 text-[10px] gap-1"
                                                                    onClick={() => {
                                                                        const opts = Array.isArray(currentField.options) ? currentField.options : [];
                                                                        updateField({ options: [...opts, { label: 'New Option', value: 'option_' + (opts.length + 1) }] });
                                                                    }}
                                                                >
                                                                    <Plus className="w-3 h-3" /> Add
                                                                </Button>
                                                            </div>
                                                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                                                {Array.isArray(currentField.options) ? (
                                                                    currentField.options.map((opt, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border group/opt">
                                                                            <Input
                                                                                value={opt.label}
                                                                                onChange={(e) => {
                                                                                    const next = [...(currentField.options as any[])];
                                                                                    next[idx] = { ...opt, label: e.target.value };
                                                                                    updateField({ options: next });
                                                                                }}
                                                                                className="h-7 text-xs flex-1"
                                                                                placeholder="Label"
                                                                            />
                                                                            <Input
                                                                                value={opt.value}
                                                                                onChange={(e) => {
                                                                                    const next = [...(currentField.options as any[])];
                                                                                    next[idx] = { ...opt, value: e.target.value };
                                                                                    updateField({ options: next });
                                                                                }}
                                                                                className="h-7 text-xs flex-1 font-mono"
                                                                                placeholder="Value"
                                                                            />
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7 text-destructive opacity-0 group-hover/opt:opacity-100"
                                                                                onClick={() => {
                                                                                    const next = [...(currentField.options as any[])];
                                                                                    next.splice(idx, 1);
                                                                                    updateField({ options: next });
                                                                                }}
                                                                            >
                                                                                <Trash2 className="w-3 h-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="w-full text-[11px]"
                                                                        onClick={() => {
                                                                            const s = typeof currentField.options === 'string' ? currentField.options : '';
                                                                            const next = s.split(',').filter(x => x).map(x => ({ label: x.trim(), value: x.trim().toLowerCase().replace(/\s+/g, '_') }));
                                                                            updateField({ options: next });
                                                                        }}
                                                                    >
                                                                        Migrate Legacy Options
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="pt-4 border-t space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-sm font-bold">Required</Label>
                                                            <Switch
                                                                checked={!!currentField.validation?.required}
                                                                onCheckedChange={(v) => updateField({ validation: { ...currentField.validation, required: v } })}
                                                            />
                                                        </div>
                                                    </div>

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
    );
}
