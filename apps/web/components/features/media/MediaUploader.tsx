'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import toast from '@/lib/toast'
import { FiUpload, FiX, FiImage, FiFile, FiCheck } from 'react-icons/fi'
import { mediaApi } from '@/lib/api/media'

interface MediaUploaderProps {
    onUploadComplete: (url: string, publicId: string) => void
    onClose: () => void
    type?: 'image' | 'file'
}

interface UploadResponse {
    secure_url: string
    public_id: string
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_FILE_SIZE = 10 * 1024 * 1024

export function MediaUploader({ onUploadComplete, onClose, type = 'image' }: MediaUploaderProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_FILE_SIZE
    const acceptedTypes = type === 'image' ? 'image/*' : '*/*'

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = (selectedFile: File) => {
        if (selectedFile.size > maxSize) {
            toast.error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
            return
        }

        if (type === 'image' && !selectedFile.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }

        setFile(selectedFile)

        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPreview(reader.result as string)
            }
            reader.readAsDataURL(selectedFile)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        try {
            setUploading(true)
            setProgress(0)

            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            const result = await (type === 'image'
                ? mediaApi.uploadImage(file)
                : mediaApi.uploadFile(file)
            ) as unknown as UploadResponse

            clearInterval(progressInterval)
            setProgress(100)

            toast.success('Upload successful!')
            onUploadComplete(result.secure_url, result.public_id)
            onClose()

        } catch (e: any) {
            toast.error('Upload failed: ' + (e.message || 'Unknown error'))
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-lg">
                { }
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold">Upload {type === 'image' ? 'Image' : 'File'}</h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Max size: {maxSize / 1024 / 1024}MB
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                { }
                <div className="p-6">
                    {!file ? (
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    fileInputRef.current?.click()
                                }
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Upload ${type === 'image' ? 'image' : 'file'}. Drop here or click to browse`}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${dragActive
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-slate-600/30 hover:border-zinc-600'
                                }`}
                        >
                            <div className="flex flex-col items-center gap-4">
                                {type === 'image' ? (
                                    <FiImage className="w-12 h-12 text-slate-400" />
                                ) : (
                                    <FiFile className="w-12 h-12 text-slate-400" />
                                )}
                                <div>
                                    <p className="text-lg font-medium">
                                        Drop {type === 'image' ? 'image' : 'file'} here or click to browse
                                    </p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {type === 'image' ? 'PNG, JPG, GIF up to 5MB' : 'Any file up to 10MB'}
                                    </p>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={acceptedTypes}
                                onChange={handleChange}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            { }
                            {preview ? (
                                <div className="relative rounded-lg overflow-hidden bg-slate-700">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="w-full h-64 object-contain"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                                    <FiFile className="w-8 h-8 text-slate-400" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{file.name}</p>
                                        <p className="text-sm text-slate-400">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            )}

                            { }
                            {uploading && (
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Uploading...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-600 transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            { }
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => {
                                        setFile(null)
                                        setPreview(null)
                                    }}
                                    disabled={uploading}
                                    className="flex-1 bg-slate-700 hover:bg-slate-700"
                                >
                                    Change File
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600"
                                >
                                    {uploading ? (
                                        <>Uploading...</>
                                    ) : (
                                        <>
                                            <FiUpload className="w-4 h-4 mr-2" />
                                            Upload
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
