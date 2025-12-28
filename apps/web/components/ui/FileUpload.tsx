'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { fileUploadService, type FileUploadOptions } from '@/lib/api/files';
import { Button } from './Button';
import { Progress } from './Progress';

interface FileUploadProps {
  onUploadComplete?: (fileUrl: string, fileData: any) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSize?: number;
  bucket?: 'images' | 'documents' | 'avatars';
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  bucket = 'images',
  multiple = false,
  className = '',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);

    const validation = fileUploadService.validateFile(file, {
      maxSize,
      allowedTypes: accept.split(',').map((type) => type.trim()),
    });

    if (!validation.valid) {
      onUploadError?.(new Error(validation.error));
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    setUploading(true);
    setProgress(0);

    try {
      const options: FileUploadOptions = {
        bucket,
        onProgress: (prog) => setProgress(prog),
      };

      const result = await fileUploadService.uploadFile(file, options);
      const fileUrl = fileUploadService.getFileUrl(result.file.path, bucket);

      onUploadComplete?.(fileUrl, result.file);
    } catch (error) {

      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleClearPreview = () => {
    setPreview(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? 'Uploading...' : 'Choose File'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        {fileName && !uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="h-4 w-4" />
            <span>{fileName}</span>
            <button
              type="button"
              onClick={handleClearPreview}
              className="text-destructive hover:text-destructive/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground">{progress}% uploaded</p>
        </div>
      )}

      {preview && !uploading && (
        <div className="relative w-full max-w-xs">
          <img
            src={preview}
            alt="Preview"
            className="rounded-lg border object-cover w-full h-48"
          />
          <button
            type="button"
            onClick={handleClearPreview}
            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

interface FileDropzoneProps extends FileUploadProps {
  height?: string;
}

export function FileDropzone({
  onUploadComplete,
  onUploadError,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  bucket = 'images',
  height = 'h-64',
  className = '',
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    await uploadFile(files[0]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await uploadFile(files[0]);
  };

  const uploadFile = async (file: File) => {
    const validation = fileUploadService.validateFile(file, { maxSize });

    if (!validation.valid) {
      onUploadError?.(new Error(validation.error));
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const options: FileUploadOptions = {
        bucket,
        onProgress: (prog) => setProgress(prog),
      };

      const result = await fileUploadService.uploadFile(file, options);
      const fileUrl = fileUploadService.getFileUrl(result.file.path, bucket);

      onUploadComplete?.(fileUrl, result.file);
    } catch (error) {

      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          ${height} border-2 border-dashed rounded-lg
          flex flex-col items-center justify-center
          cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="text-center space-y-4 w-full max-w-xs px-4">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">{progress}% uploaded</p>
          </div>
        ) : (
          <>
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Max size: {maxSize / 1024 / 1024}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
}

