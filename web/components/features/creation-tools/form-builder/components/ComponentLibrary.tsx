'use client'

import React from 'react';
import { SidebarDraggableItem } from '../../SidebarDraggableItem';

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
            { value: 'file', label: 'Single File' },
            { value: 'files', label: 'Multiple Files' },
        ]
    },
    {
        label: 'Workflow & Preview',
        items: [
            { value: 'canvas-editor', label: 'Canvas Editor (Multi-Frame)' },
            { value: 'result-preview', label: 'Step Result Preview' },
            { value: 'json', label: 'JSON Data Editor' },
            { value: 'key-value', label: 'Key-Value Configuration' },
        ]
    }
];

interface ComponentLibraryProps {
    // No props needed currently - catalog is static
}

/**
 * Draggable catalog of field types that can be added to the form
 */
export function ComponentLibrary({ }: ComponentLibraryProps) {
    return (
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
    );
}

export { FIELD_CATEGORIES };
