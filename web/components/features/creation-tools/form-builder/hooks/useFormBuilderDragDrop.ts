'use client'

import { useCallback, useRef, useMemo } from 'react';
import {
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import { FormConfig, FormStep, FormField, LayoutRow, ZoneConfig } from '@/lib/api/creation-tools';
import { generateId, cleanLayout } from '../utils/formBuilderUtils';
import { generateUniqueFieldName, createField, FieldType } from '../utils/fieldFactory';
import { toast } from 'sonner';
import { FormBuilderState } from './useFormBuilderState';

export interface DragDropHandlers {
    sensors: ReturnType<typeof useSensors>;
    handleDragStart: (event: DragStartEvent) => void;
    handleDragOver: (event: DragOverEvent) => void;
    handleDragEnd: (event: DragEndEvent) => void;
    handleMoveFieldToStep: (fieldName: string, targetStepIndex: number) => void;
}

/**
 * Manages all drag & drop logic for FormBuilder
 * Handles step reordering, field movement, zone dragging
 */
export function useFormBuilderDragDrop(
    config: FormConfig,
    onChange: (config: FormConfig) => void,
    state: FormBuilderState
): DragDropHandlers {
    const { activeStepIndex, setActiveStepIndex, setSelectedFieldName, setActiveTab, setActiveId } = state;
    const steps = config.steps || [];
    const lastStepSwitchRef = useRef(0);

    // Configure dnd-kit sensors
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

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    }, [setActiveId]);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // --- Handle Field Moving Between Containers (Zones/Rows) for Smooth Sorting ---
        if (activeData?.type === 'FIELD') {
            const isOverField = overData?.type === 'FIELD';
            const isOverZone = overData?.type === 'ZONE';

            // Only allow dragging over fields or zones (stay within current step layout context)
            if (!isOverField && !isOverZone) return;

            const newSteps = JSON.parse(JSON.stringify(steps)) as FormStep[];
            const currentStepLayout = newSteps[activeStepIndex]?.layout;
            if (!currentStepLayout) return;

            // 1. Find Source
            let sourceVal: { fr: any; idx: number; zId: string } | null = null;

            for (const row of currentStepLayout.rows) {
                for (const zone of row.zones) {
                    for (const fr of zone.fieldRows) {
                        const idx = fr.fields.indexOf(activeId);
                        if (idx !== -1) {
                            sourceVal = { fr, idx, zId: zone.id };
                            break;
                        }
                    }
                    if (sourceVal) break;
                }
                if (sourceVal) break;
            }

            if (!sourceVal) return;

            // 2. Find Target
            let targetVal: { fr: any; idx: number | null; zId: string } | null = null;

            if (isOverField) {
                for (const row of currentStepLayout.rows) {
                    for (const zone of row.zones) {
                        for (const fr of zone.fieldRows) {
                            const idx = fr.fields.indexOf(overId);
                            if (idx !== -1) {
                                targetVal = { fr, idx, zId: zone.id };
                                break;
                            }
                        }
                        if (targetVal) break;
                    }
                    if (targetVal) break;
                }
            } else if (isOverZone) {
                for (const row of currentStepLayout.rows) {
                    const zone = row.zones.find(z => z.id === overId);
                    if (zone) {
                        if (zone.fieldRows.length > 0) {
                            // Target last row
                            targetVal = { fr: zone.fieldRows[zone.fieldRows.length - 1], idx: null, zId: zone.id };
                        } else {
                            // Should theoretically create a row if none, but zones usually initialized with one.
                            // If strictly empty, we can't push to a fieldRow. 
                            // Assuming data integrity ensures at least 1 empty fieldRow for drop targets.
                        }
                        break;
                    }
                }
            }

            if (!targetVal) return;

            // 3. Move if container changed
            if (sourceVal.fr.id !== targetVal.fr.id) {
                sourceVal.fr.fields.splice(sourceVal.idx, 1);

                if (targetVal.idx !== null) {
                    targetVal.fr.fields.splice(targetVal.idx, 0, activeId);
                } else {
                    targetVal.fr.fields.push(activeId);
                }

                // Immediate update for smooth transition
                onChange({ ...config, steps: newSteps });
            }
        }
    }, [activeStepIndex, steps, onChange, config]);

    const handleMoveFieldToStep = useCallback((fieldName: string, targetStepIndex: number) => {
        if (targetStepIndex === activeStepIndex) return;

        const newSteps = JSON.parse(JSON.stringify(steps)) as FormStep[];
        let movedField: string | null = null;

        // 1. Remove from current step
        const currentStep = newSteps[activeStepIndex];
        for (const row of currentStep.layout.rows) {
            for (const zone of row.zones) {
                for (const fieldRow of zone.fieldRows) {
                    const idx = fieldRow.fields.indexOf(fieldName);
                    if (idx !== -1) {
                        fieldRow.fields.splice(idx, 1);
                        movedField = fieldName;
                        break;
                    }
                }
                if (movedField) break;
            }
            if (movedField) break;
        }

        if (!movedField) return;

        // 2. Add to target step
        const targetStep = newSteps[targetStepIndex];
        if (!targetStep.layout) targetStep.layout = { rows: [] };
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

        const targetZone = targetStep.layout.rows[0].zones[0];
        if (targetZone.fieldRows.length === 0) {
            targetZone.fieldRows.push({ id: generateId(), fields: [] });
        }
        targetZone.fieldRows[targetZone.fieldRows.length - 1].fields.push(movedField);

        // 3. Clean both steps
        newSteps[activeStepIndex].layout.rows = cleanLayout(newSteps[activeStepIndex].layout.rows);
        newSteps[targetStepIndex].layout.rows = cleanLayout(newSteps[targetStepIndex].layout.rows);

        onChange({ ...config, steps: newSteps });
        setActiveStepIndex(targetStepIndex);
        toast.success(`Moved to ${targetStep.title}`);
    }, [config, steps, activeStepIndex, setActiveStepIndex, onChange]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
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
                // DROPPING INTO STEPS DISABLED - Force current step
                targetStepIndex = activeStepIndex;
            } else if (overData?.type === 'FIELD') {
                targetZoneId = overData.zoneId;
            } else if (overData?.type === 'ZONE') {
                targetZoneId = overId;
            }

            // Create field in the target step
            const fieldName = generateUniqueFieldName(fieldType, config.fields);
            const newField = createField(fieldType, fieldName);

            const newSteps = [...steps];
            const targetStep = { ...newSteps[targetStepIndex] };
            let newLayoutRows = JSON.parse(JSON.stringify(targetStep.layout.rows)) as LayoutRow[];

            let placed = false;
            const addFieldToZone = (zone: ZoneConfig) => {
                if (zone.fieldRows.length > 0) {
                    const lastRow = zone.fieldRows[zone.fieldRows.length - 1];
                    if (lastRow.fields.length === 0) {
                        lastRow.fields.push(fieldName);
                    } else {
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

        // --- 3. Dragging from Sidebar to STEP directly (Legacy support) ---
        if (activeData?.type === 'FIELD_TEMPLATE' && overData?.type === 'STEP') {
            const fieldTemplate = activeData.item;
            const targetStepId = overId as string;
            const targetStepIndex = steps.findIndex(s => s.id === targetStepId);
            if (targetStepIndex === -1) return;

            const fieldName = `${fieldTemplate.value}_${generateId().slice(0, 4)}`;
            const newField: FormField = {
                name: fieldName,
                type: fieldTemplate.value as any,
                label: `New ${fieldTemplate.label}`,
                placeholder: `Enter ${fieldTemplate.label}...`,
            };

            const newSteps = JSON.parse(JSON.stringify(steps)) as FormStep[];
            const targetStep = newSteps[targetStepIndex];

            if (targetStep.layout.rows.length === 0) {
                targetStep.layout.rows.push({ id: generateId(), zones: [{ id: generateId(), title: 'Zone 1', fieldRows: [] }] });
            }
            if (targetStep.layout.rows[0].zones.length === 0) {
                targetStep.layout.rows[0].zones.push({ id: generateId(), title: 'Zone 1', fieldRows: [] });
            }

            targetStep.layout.rows[0].zones[0].fieldRows.push({ id: generateId(), fields: [fieldName] });

            onChange({ ...config, fields: [...config.fields, newField], steps: newSteps });
            setSelectedFieldName(fieldName);
            setActiveTab('properties');
            if (targetStepIndex !== activeStepIndex) {
                setActiveStepIndex(targetStepIndex);
                toast.success(`Added to ${targetStep.title}`);
            }
            return;
        }

        // --- 4. Move Zone or Field ---
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

            // 1. Find and Remove from source step
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
                // DROPPING INTO STEPS IS DISABLED BY USER REQUEST
                if (overData?.type === 'STEP') {
                    // Do nothing - revert move if needed, effectively cancelling drag to step
                    console.log('Drag to step disabled');
                    return;
                } else {
                    // Reorder within currently visible step
                    const currentStepLayoutRows = newSteps[activeStepIndex].layout.rows;
                    let inserted = false;

                    for (const r of currentStepLayoutRows) {
                        for (const z of r.zones) {
                            // Dropped over a zone directly
                            if (z.id === overId) {
                                if (z.fieldRows.length > 0 && z.fieldRows[z.fieldRows.length - 1].fields.length === 0) {
                                    z.fieldRows[z.fieldRows.length - 1].fields.push(movedFieldName);
                                } else {
                                    z.fieldRows.push({ id: generateId(), fields: [movedFieldName] });
                                }
                                inserted = true;
                                break;
                            }
                            // Dropped over another field
                            for (const fr of z.fieldRows) {
                                const idx = fr.fields.indexOf(overId);
                                if (idx !== -1) {
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
            // Clean layout to remove empty rows
            newSteps[activeStepIndex].layout.rows = cleanLayout(newSteps[activeStepIndex].layout.rows);

            // Clean target step if moved across steps
            if (activeData?.type === 'FIELD' && overData?.type === 'STEP') {
                const tStep = newSteps[overData.index];
                if (tStep && tStep.layout) {
                    tStep.layout.rows = cleanLayout(tStep.layout.rows);
                }
            }

            onChange({ ...config, steps: newSteps });
        }
    }, [config, steps, activeStepIndex, setActiveId, setActiveStepIndex, setSelectedFieldName, setActiveTab, onChange]);

    return {
        sensors,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleMoveFieldToStep
    };
}
