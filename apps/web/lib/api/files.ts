/**
 * Files API
 * File upload with presigned URLs
 * Migrated from services/file-upload-service.ts
 */
import axiosClient from '../axios-client'
import axios from 'axios'

export interface UploadResponse {
    file: {
        id: string
        path: string
    }
    uploadSignedUrl?: string
    downloadSignedUrl?: string
}

export interface FileUploadOptions {
    onProgress?: (progress: number) => void
    bucket?: 'images' | 'documents' | 'avatars'
}

export const filesApi = {
    async uploadFile(
        file: File,
        options: FileUploadOptions = {}
    ): Promise<UploadResponse> {
        const { onProgress, bucket = 'images' } = options

        const presignedResponse = await axiosClient.post<UploadResponse>(
            '/files/upload',
            {
                fileName: file.name,
                fileSize: file.size,
                bucket,
            }
        ) as unknown as UploadResponse

        const { uploadSignedUrl, file: fileData } = presignedResponse

        if (uploadSignedUrl) {
            await axios.put(uploadSignedUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
                onUploadProgress: (progressEvent: any) => {
                    if (onProgress && progressEvent.total) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        )
                        onProgress(progress)
                    }
                },
            })
        }

        return presignedResponse
    },

    getFileUrl(path: string, bucket: string = 'images'): string {
        const minioEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || 'http://localhost:9000'
        return `${minioEndpoint}/${bucket}/${path}`
    },

    async uploadMultipleFiles(
        files: File[],
        options: FileUploadOptions = {}
    ): Promise<UploadResponse[]> {
        const uploadPromises = files.map((file) => filesApi.uploadFile(file, options))
        return Promise.all(uploadPromises)
    },

    validateFile(
        file: File,
        options: {
            maxSize?: number
            allowedTypes?: string[]
        } = {}
    ): { valid: boolean; error?: string } {
        const { maxSize = 5 * 1024 * 1024, allowedTypes } = options

        if (file.size > maxSize) {
            return {
                valid: false,
                error: `File size exceeds ${maxSize / 1024 / 1024}MB`,
            }
        }

        if (allowedTypes && !allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: `File type ${file.type} is not allowed`,
            }
        }

        return { valid: true }
    }
}

// Legacy export for backward compatibility
export const fileUploadService = {
    uploadFile: filesApi.uploadFile,
    getFileUrl: filesApi.getFileUrl,
    uploadMultipleFiles: filesApi.uploadMultipleFiles,
    validateFile: filesApi.validateFile
}
