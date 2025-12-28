import { useState } from 'react';
import { fileUploadService, type FileUploadOptions } from '@/lib/api/files';

interface UseFileUploadOptions extends FileUploadOptions {
  onSuccess?: (fileUrl: string, fileData: any) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await fileUploadService.uploadFile(file, {
        ...options,
        onProgress: (prog) => {
          setProgress(prog);
          options.onProgress?.(prog);
        },
      });

      const fileUrl = result.downloadSignedUrl || fileUploadService.getFileUrl(
        result.file.path,
        options.bucket || 'images'
      );

      console.log('?? useFileUpload returning:', { fileUrl, fileData: result.file });

      options.onSuccess?.(fileUrl, result.file);
      return { fileUrl, fileData: result.file };
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const uploadMultipleFiles = async (files: File[]) => {
    setUploading(true);
    setError(null);

    try {
      const results = await fileUploadService.uploadMultipleFiles(files, options);
      const filesData = results.map((result) => ({
        fileUrl: result.downloadSignedUrl || fileUploadService.getFileUrl(
          result.file.path,
          options.bucket || 'images'
        ),
        fileData: result.file,
      }));

      return filesData;
    } catch {

      throw error;
    } finally {
      setUploading(false);
    }
  };

  const validateFile = (file: File, validationOptions?: {
    maxSize?: number;
    allowedTypes?: string[];
  }) => {
    return fileUploadService.validateFile(file, validationOptions);
  };

  return {
    uploadFile,
    uploadMultipleFiles,
    validateFile,
    uploading,
    progress,
    error,
  };
}
