'use client';

import React, { useRef } from 'react';
import { ImageIcon, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { Progress } from './Progress';
import { cn } from '@/lib/utils';
import { useFileUpload } from '@/lib/hooks/use-file-upload';
import { type FileUploadOptions } from '@/lib/api/files';

export interface CoverUploadProps {
    value?: string;
    onUpload?: (url: string, file: File) => void;
    onDelete?: () => void;
    isLoading?: boolean;
    className?: string;
    maxSize?: number;
    bucket?: FileUploadOptions['bucket'];
    accept?: string;
    aspectRatio?: number;
    description?: string;
}

export function CoverUpload({
    value,
    onUpload,
    onDelete,
    isLoading,
    className,
    maxSize = 10 * 1024 * 1024,
    bucket = 'images',
    accept = 'image/*',
    aspectRatio = 21 / 9,
    description = "Recommended size: 1200x514px • Max size: 10MB"
}: CoverUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { uploading, progress, uploadFile } = useFileUpload({
        bucket,
        onSuccess: (url, file) => onUpload?.(url, file),
    });

    const loading = isLoading || uploading;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            await uploadFile(file);
        } catch (error) {
            console.error("Cover upload failed", error);
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className={cn("w-full group relative overflow-hidden rounded-md border-2 border-dashed border-muted transition-all hover:bg-muted/5", className)}>
            <div style={{ aspectRatio }} className="w-full relative bg-muted/20">
                {value ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={value}
                            alt="Cover"
                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-60"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                className="shadow-lg font-semibold"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <ImageIcon className="mr-2 h-4 w-4" /> Change Cover
                            </Button>
                            {onDelete && (
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="shadow-lg h-9 w-9"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div
                        className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer p-6 text-center hover:bg-muted/10 transition-colors"
                        onClick={() => !loading && fileInputRef.current?.click()}
                    >
                        {loading ? (
                            <div className="space-y-4 w-full max-w-xs">
                                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                    Uploading... {progress}%
                                </div>
                                <Progress value={progress} className="h-2" />
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 rounded-full bg-muted p-4 ring-1 ring-border shadow-sm group-hover:scale-110 transition-transform">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h4 className="text-sm font-semibold">Click to upload cover</h4>
                                <p className="text-xs text-muted-foreground mt-2 max-w-sm">{description}</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
