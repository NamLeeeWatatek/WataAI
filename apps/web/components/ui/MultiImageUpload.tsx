'use client';

import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { type FileUploadOptions } from '@/lib/api/files';

interface MultiImageUploadProps {
    files?: string[]; // Array of URLs
    onUpload?: (urls: string[]) => void; // Returns updated array
    onRemove?: (url: string) => void;
    maxFiles?: number;
    className?: string;
    bucket?: FileUploadOptions['bucket'];
    loading?: boolean;
}

export function MultiImageUpload({
    files = [],
    onUpload,
    onRemove,
    maxFiles = 5,
    className,
    bucket = 'images',
    loading
}: MultiImageUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploading, uploadFile } = useFileUpload({
        bucket,
    });

    const isLoading = loading || uploading;

    const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawFiles = e.target.files;
        if (!rawFiles?.length) return;

        if (files.length + rawFiles.length > maxFiles) {
            console.error("Max files exceeded");
            return;
        }

        const newUrls: string[] = [];

        for (const file of Array.from(rawFiles)) {
            try {
                const result = await uploadFile(file);
                if (result?.fileUrl) {
                    newUrls.push(result.fileUrl);
                }
            } catch (err) {
                console.error("Single file upload failed in MultiImageUpload", err);
            }
        }

        if (onUpload && newUrls.length > 0) {
            onUpload([...files, ...newUrls]);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className={cn("space-y-4", className)}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {files.map((url, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-md overflow-hidden border bg-background">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => onRemove ? onRemove(url) : onUpload?.(files.filter(f => f !== url))}
                            className="absolute top-1 right-1 p-1.5 bg-background/80 hover:bg-destructive hover:text-white rounded-full text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shadow-sm backdrop-blur-sm"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ))}

                {files.length < maxFiles && (
                    <div
                        onClick={() => !isLoading && fileInputRef.current?.click()}
                        className={cn(
                            "aspect-square rounded-md border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5 flex flex-col items-center justify-center cursor-pointer transition-all gap-2",
                            isLoading ? "opacity-50 pointer-events-none" : ""
                        )}
                    >
                        {isLoading ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                            <>
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Upload</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFiles}
            />
            <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{files.length} / {maxFiles} images</span>
                <span>Max 10MB per file</span>
            </div>
        </div>
    );
}
