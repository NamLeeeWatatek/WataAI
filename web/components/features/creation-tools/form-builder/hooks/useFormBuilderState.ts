'use client'

import { useState, useEffect, useRef } from 'react';
import { FormConfig, FormStep } from '@/lib/api/creation-tools';
import { generateId } from '../utils/formBuilderUtils';

export interface FormBuilderState {
    selectedFieldName: string | null;
    setSelectedFieldName: (name: string | null) => void;
    activeStepIndex: number;
    setActiveStepIndex: (index: number) => void;
    activeTab: 'properties' | 'fields';
    setActiveTab: (tab: 'properties' | 'fields') => void;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
}

/**
 * Manages all state for the FormBuilder component
 * Includes initialization and validation logic
 */
export function useFormBuilderState(
    config: FormConfig,
    onChange: (config: FormConfig) => void
): FormBuilderState {
    const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'properties' | 'fields'>('fields');
    const [activeId, setActiveId] = useState<string | null>(null);

    // --- Initialization & Validation ---
    const initializedRef = useRef(false);
    const configString = JSON.stringify(config);

    useEffect(() => {
        if (!config) return;

        // Prevent running if nothing materially changed
        if (initializedRef.current && configString === JSON.stringify(config)) {
            return;
        }

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
            // Only trigger update if we actually modified the structure
            onChange(newConfig);
        }

        initializedRef.current = true;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeStepIndex, configString]); // Depend on stringified config to avoid ref-cycle loops

    return {
        selectedFieldName,
        setSelectedFieldName,
        activeStepIndex,
        setActiveStepIndex,
        activeTab,
        setActiveTab,
        activeId,
        setActiveId
    };
}
