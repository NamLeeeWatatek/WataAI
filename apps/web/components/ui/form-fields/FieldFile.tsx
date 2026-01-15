import { DynamicFormFieldProps } from "./types"
import { Button } from "../Button"
import { X } from "lucide-react"
import { isImageUrl, isVideoUrl } from "@/lib/utils/media"
import axiosClient from "@/lib/axios-client"
import { useState } from "react"
import { FileDropzone } from "@/components/shared/FileDropzone"
import { ImagePreview } from "@/components/shared/FilePreview"
import { Media } from "@/components/shared/Media"

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
            <FileDropzone
                onUploadComplete={handleUploadComplete}
                accept={field.accept}
                maxSize={field.max ? field.max * 1024 * 1024 : undefined}
                height="h-40"
                className={filesToShow.length > 0 && !field.multiple ? "hidden" : ""}
            />

            {filesToShow.length > 0 && (
                <div className="space-y-6">
                    {filesToShow.map((item: any, idx: number) => {
                        const fileObj = typeof item === 'object' && item.url ? item : { url: item, fileId: null, fileKey: null }
                        const isImage = isImageUrl(fileObj.url)
                        const isVideo = isVideoUrl(fileObj.url)
                        const isMedia = isImage || isVideo

                        // Professional Aspect-Ratio Controlled Card
                        if (!field.multiple && isMedia) {
                            return (
                                <div key={idx} className="relative group rounded-md overflow-hidden border border-border bg-card shadow-sm mx-auto">
                                    <ImagePreview src={fileObj.url}>
                                        <div className="relative w-full max-w-md h-80 bg-black cursor-zoom-in overflow-hidden mx-auto">
                                            {/* Center-Fit Professional Media Display */}
                                            <Media
                                                src={fileObj.url}
                                                alt={fileObj.name || `File ${idx}`}
                                                fill
                                                objectFit="contain"
                                                muted
                                                playsInline
                                                autoPlayOnHover
                                                showPlayIcon={isVideo}
                                            />

                                            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full shadow-md"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileDelete(fileObj.fileId, idx);
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </ImagePreview>

                                    <div className="p-2 flex items-center bg-card">
                                        <p className="text-xs font-medium truncate w-full" title={fileObj.name}>
                                            {fileObj.name || 'File'}
                                        </p>
                                    </div>
                                </div>
                            )
                        }

                        // Compact Item Style for List
                        return (
                            <div
                                key={idx}
                                className="group relative flex items-center gap-3 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <ImagePreview src={fileObj.url}>
                                    <div className="relative w-10 h-10 rounded overflow-hidden bg-muted shrink-0 cursor-pointer">
                                        <Media
                                            src={fileObj.url}
                                            fill
                                            className="object-cover"
                                            containerClassName="h-full w-full"
                                            muted
                                            playsInline
                                            autoPlayOnHover={false}
                                            showPlayIcon={false}
                                        />
                                    </div>
                                </ImagePreview>

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" title={fileObj.name}>
                                        {fileObj.name || 'File'}
                                    </p>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                    onClick={() => handleFileDelete(fileObj.fileId, idx)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
