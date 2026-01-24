import axiosClient from "@/lib/axios-client"
import { DynamicFormFieldProps } from "./types"
import { UnifiedFileUpload } from "@/components/shared/UnifiedFileUpload"
import { useState } from "react"

export function FieldFile({ field, value, onChange }: DynamicFormFieldProps) {
    // value can be a single file url/object, array of file urls/objects, or null
    // Standardize to array of strings for consistent rendering
    const normalizeValue = (val: any): string[] => {
        if (!val) return [];
        const arr = Array.isArray(val) ? val : [val];
        return arr.map(item => (typeof item === 'object' ? item.url : item)).filter(Boolean);
    };

    const filesToShow = normalizeValue(value);

    return (
        <div className="space-y-4">
            <UnifiedFileUpload
                value={filesToShow}
                onChange={(newFiles: string | string[] | null) => {
                    // UnifiedFileUpload returns string, string[], or null.
                    // We directly pass this to the form state to avoid object wrapping issues.

                    if (field.multiple || field.type === 'files') {
                        // Ensure we always return an array for multiple mode
                        const filesArray = Array.isArray(newFiles) ? newFiles : (newFiles ? [newFiles] : []);
                        onChange(field.name, filesArray);
                    } else {
                        // Ensure single string (or null) for single mode
                        const singleFile = Array.isArray(newFiles) ? newFiles[0] : newFiles;
                        onChange(field.name, singleFile || null);
                    }
                }}
                accept={field.accept}
                maxFiles={field.multiple || field.type === 'files' ? 10 : 1}
                maxSize={field.max ? field.max * 1024 * 1024 : undefined}
                bucket="documents"
            />
        </div>
    )
}
