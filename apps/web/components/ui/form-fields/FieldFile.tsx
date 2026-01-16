import axiosClient from "@/lib/axios-client"
import { DynamicFormFieldProps } from "./types"
import { UnifiedFileUpload } from "@/components/shared/UnifiedFileUpload"
import { useState } from "react"

export function FieldFile({ field, value, onChange }: DynamicFormFieldProps) {
    // value can be a single file object, array of file objects, or null
    // Standardize to array for consistent rendering
    const filesToShow = Array.isArray(value) ? value : (value ? [value] : [])
    const [previewFiles, setPreviewFiles] = useState<any[]>([])

    const handleUploadComplete = (fileUrl: string, fileData: any) => {
        const newFile = {
            url: fileUrl,
            fileId: fileData.id,
            fileKey: fileData.path,
            name: fileData.name || fileData.path.split('/').pop()
        }

        if (field.multiple || field.type === 'files') {
            const currentFiles = Array.isArray(value) ? value : (value ? [value] : [])
            onChange(field.name, [...currentFiles, newFile])
        } else {
            onChange(field.name, newFile)
        }
    }

    const handleFileDelete = async (fileId: string, idx: number) => {
        if (fileId) {
            try {
                await axiosClient.delete(`/files/${fileId}`)
            } catch (error) {
                console.error('Delete error:', error)
            }
        }

        if (field.multiple || field.type === 'files') {
            const currentFiles = Array.isArray(value) ? value : (value ? [value] : [])
            const newFiles = currentFiles.filter((_: any, i: number) => i !== idx)
            onChange(field.name, newFiles.length > 0 ? newFiles : null)
        } else {
            onChange(field.name, null)
        }
    }

    return (
        <div className="space-y-4">
            <UnifiedFileUpload
                value={filesToShow.map(f => typeof f === 'object' ? f.url : f)}
                onChange={(newFiles: string | string[] | null) => {
                    const filesArray = Array.isArray(newFiles) ? newFiles : (newFiles ? [newFiles] : []);
                    const mappedFiles = filesArray.map(url => ({
                        url,
                        fileId: null, // UnifiedFileUpload returns URLs, we'd need a backend change to get IDs back easily or refactor UnifiedFileUpload. 
                        // For now, consistent with how basic file upload works, we just store URL.
                        // If the backend requires IDs, the UnifiedFileUpload 'onChange' might need to pass full objects or we fetch them.
                        // Given current flow: we just pass the URL back to form.
                        name: url.split('/').pop()
                    }));

                    if (field.multiple || field.type === 'files') {
                        onChange(field.name, mappedFiles);
                    } else {
                        onChange(field.name, mappedFiles[0] || null);
                    }
                }}
                accept={field.accept}
                maxFiles={field.multiple || field.type === 'files' ? 10 : 1}
                maxSize={field.max ? field.max * 1024 * 1024 : undefined}
                bucket="documents" // Default to documents/files for generic field
            />
        </div>
    )
}
