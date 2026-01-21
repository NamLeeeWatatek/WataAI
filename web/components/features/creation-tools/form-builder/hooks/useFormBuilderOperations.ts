'use client'

import { useCallback } from 'react';
import { FormConfig, FormField, FormStep, LayoutRow, ZoneConfig } from '@/lib/api/creation-tools';
import { generateId, cleanLayout } from '../utils/formBuilderUtils';
import { generateUniqueFieldName, createField, FieldType } from '../utils/fieldFactory';
import { toast } from 'sonner';
import { FormBuilderState } from './useFormBuilderState';

export interface FormBuilderOperations {
    handleCreateField: (type: FieldType, targetZoneId?: string) => void;
    handleAddStep: () => void;
    handleRemoveStep: (index: number) => void;
    handleAddLayoutRow: () => void;
    handleAddZoneToRow: (rowId: string) => void;
    handleRemoveZone: (rowId: string, zoneId: string) => void;
    updateField: (updates: Partial<FormField>) => void;
    removeSelectedField: () => void;
    updateStepLayout: (newRows: LayoutRow[]) => void;
}

/**
 * All CRUD operations for FormBuilder
 * Handles field creation, step management, layout operations
 */
export function useFormBuilderOperations(
    config: FormConfig,
    onChange: (config: FormConfig) => void,
    state: FormBuilderState
): FormBuilderOperations {
    const { selectedFieldName, setSelectedFieldName, activeStepIndex, setActiveStepIndex, setActiveTab } = state;
    const steps = config.steps || [];
    const currentStep = steps[activeStepIndex];
    const layoutRows = currentStep ? (currentStep.layout ? currentStep.layout.rows : []) : [];

    const updateStepLayout = useCallback((newRows: LayoutRow[]) => {
        if (!currentStep) return;
        const newSteps = [...steps];
        newSteps[activeStepIndex] = {
            ...currentStep,
            layout: { ...currentStep.layout, rows: newRows }
        };
        onChange({ ...config, steps: newSteps });
    }, [currentStep, steps, activeStepIndex, config, onChange]);

    const handleAddStep = useCallback(() => {
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
    }, [steps, config, onChange, setActiveStepIndex]);

    const handleRemoveStep = useCallback((index: number) => {
        if (steps.length <= 1) {
            toast.error("At least one step is required.");
            return;
        }

        // Find fields to remove
        const stepToRemove = steps[index];
        const fieldsToRemove = new Set<string>();
        stepToRemove?.layout?.rows?.forEach(row => {
            row.zones?.forEach(zone => {
                zone.fieldRows?.forEach(fr => {
                    fr.fields?.forEach(f => fieldsToRemove.add(f));
                });
            });
        });

        const newSteps = steps.filter((_, i) => i !== index);
        const newFields = config.fields.filter(f => !fieldsToRemove.has(f.name));

        onChange({ ...config, steps: newSteps, fields: newFields });

        if (activeStepIndex >= newSteps.length) {
            setActiveStepIndex(newSteps.length - 1);
        }

        if (selectedFieldName && fieldsToRemove.has(selectedFieldName)) {
            setSelectedFieldName(null);
        }
    }, [steps, config, onChange, activeStepIndex, setActiveStepIndex, selectedFieldName, setSelectedFieldName]);

    const handleAddLayoutRow = useCallback(() => {
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
    }, [layoutRows, updateStepLayout]);

    const handleAddZoneToRow = useCallback((rowId: string) => {
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
    }, [layoutRows, updateStepLayout]);

    const handleRemoveZone = useCallback((rowId: string, zoneId: string) => {
        // Collect removed fields
        const fieldsToRemove = new Set<string>();
        const row = layoutRows.find(r => r.id === rowId);
        const zone = row?.zones.find(z => z.id === zoneId);

        zone?.fieldRows.forEach(fr => {
            fr.fields.forEach(f => fieldsToRemove.add(f));
        });

        const newRows = layoutRows.map(row => {
            if (row.id !== rowId) return row;
            return {
                ...row,
                zones: row.zones.filter(z => z.id !== zoneId)
            };
        }).filter(row => row.zones.length > 0);

        const newFields = config.fields.filter(f => !fieldsToRemove.has(f.name));

        const newSteps = [...steps];
        newSteps[activeStepIndex] = {
            ...currentStep,
            layout: { ...currentStep.layout, rows: newRows }
        };

        onChange({ ...config, steps: newSteps, fields: newFields });

        if (selectedFieldName && fieldsToRemove.has(selectedFieldName)) {
            setSelectedFieldName(null);
        }
    }, [layoutRows, config, steps, activeStepIndex, currentStep, onChange, selectedFieldName, setSelectedFieldName]);

    const handleCreateField = useCallback((type: FieldType, targetZoneId?: string) => {
        const fieldName = generateUniqueFieldName(type, config.fields);
        const newField = createField(type, fieldName);

        // Add to fields definition
        const newFields = [...config.fields, newField];

        // Add to layout
        const newRows = [...layoutRows];
        let placed = false;

        // Helper to add field to a zone
        const addFieldToZone = (zone: ZoneConfig) => {
            if (zone.fieldRows.length === 0) {
                zone.fieldRows.push({ id: generateId(), fields: [fieldName] });
            } else {
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
    }, [config, layoutRows, currentStep, steps, activeStepIndex, onChange, setSelectedFieldName, setActiveTab]);

    const updateField = useCallback((updates: Partial<FormField>) => {
        if (!selectedFieldName) return;
        const newFields = config.fields.map(f => f.name === selectedFieldName ? { ...f, ...updates } : f);
        onChange({ ...config, fields: newFields });
    }, [selectedFieldName, config, onChange]);

    const removeSelectedField = useCallback(() => {
        if (!selectedFieldName) return;

        // 1. Remove from all steps' layouts
        const newSteps = steps.map(step => {
            if (!step.layout?.rows) return step;
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
            return {
                ...step,
                layout: {
                    ...step.layout,
                    rows: cleanLayout(uncleanRows)
                }
            };
        });

        // 2. Remove from field definitions
        const newFields = config.fields.filter(f => f.name !== selectedFieldName);

        onChange({ ...config, fields: newFields, steps: newSteps });
        setSelectedFieldName(null);
        toast.success("Field removed");
    }, [selectedFieldName, steps, config, onChange, setSelectedFieldName]);

    return {
        handleCreateField,
        handleAddStep,
        handleRemoveStep,
        handleAddLayoutRow,
        handleAddZoneToRow,
        handleRemoveZone,
        updateField,
        removeSelectedField,
        updateStepLayout
    };
}
