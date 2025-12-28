'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { FiUpload, FiX } from 'react-icons/fi'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
    value: string[]
    onChange: (urls: string[]) => void
    multiple?: boolean
    accept?: string
    className?: string
}

export function FileUploader({
    value = [],
    onChange,
    multiple = false,
    accept = 'image/*',
    className
}: FileUploaderProps) {
    const { uploadFile, uploadMultipleFiles, uploading } = useFileUpload({
        bucket: 'images',
        onSuccess: () => { } // Handled manually
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        try {
            if (multiple) {
                const results = await uploadMultipleFiles(Array.from(files))
                const newUrls = results.map(r => r.fileUrl).filter(Boolean) as string[]
                onChange([...value, ...newUrls])
            } else {
                const result = await uploadFile(files[0])
                if (result?.fileUrl) {
                    onChange([result.fileUrl])
                }
            }
        } catch (error) {
            console.error('Upload failed:', error)
        }

        // Reset input
        e.target.value = ''
    }

    const handleRemove = (index: number) => {
        const newUrls = [...value]
        newUrls.splice(index, 1)
        onChange(newUrls)
    }

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center gap-4">
                <Input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    id="file-upload-input"
                />
                <label
                    htmlFor="file-upload-input"
                    className={cn(
                        "flex items-center justify-center px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer text-sm font-medium transition-colors",
                        uploading && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {uploading ? (
                        <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <FiUpload className="mr-2 h-4 w-4" />
                            Upload {multiple ? 'Files' : 'File'}
                        </>
                    )}
                </label>
            </div>

            {value.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {value.map((url, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border bg-muted aspect-video">
                            {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img src={url} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground p-2 break-all">
                                    {url.split('/').pop()}
                                </div>
                            )}

                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemove(index)}
                            >
                                <FiX className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
