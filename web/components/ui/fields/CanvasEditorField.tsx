'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric' // Fabric v7 uses named exports
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Download, Layers, Image as ImageIcon, Type, Square, Trash2, Save } from 'lucide-react'
import { FormField } from '@/lib/api/creation-tools'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CanvasEditorFieldProps {
    field: FormField
    value: any
    onChange: (value: any) => void
    previousStepResults?: Record<string, any>
}

interface FrameConfig {
    name: string
    width: number
    height: number
}

interface CanvasFrameData {
    frameIndex: number
    frameName: string
    json: any
    imageUrl?: string // Will be uploaded to file service
}

export function CanvasEditorField({
    field,
    value,
    onChange,
    previousStepResults
}: CanvasEditorFieldProps) {
    const [activeFrame, setActiveFrame] = useState(0)
    const [frames, setFrames] = useState<fabric.Canvas[]>([])
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
    const canvasContainerRefs = useRef<HTMLDivElement[]>([])
    const canvasRefs = useRef<HTMLCanvasElement[]>([])

    // Get frame configurations from field config
    const frameConfigs: FrameConfig[] = field.config?.frames || [
        { name: 'Frame 1', width: 1080, height: 1080 }
    ]

    // Extract image URLs from previous step results
    const extractImageUrls = useCallback((results: any): string[] => {
        if (!results) return []

        const imageUrls: string[] = []

        Object.values(results).forEach((stepResult: any) => {
            // Handle different result structures
            if (typeof stepResult === 'string' && stepResult.startsWith('http')) {
                imageUrls.push(stepResult)
            } else if (stepResult?.imageUrl) {
                imageUrls.push(stepResult.imageUrl)
            } else if (stepResult?.url) {
                imageUrls.push(stepResult.url)
            } else if (stepResult?.result?.imageUrl) {
                imageUrls.push(stepResult.result.imageUrl)
            } else if (stepResult?.result?.url) {
                imageUrls.push(stepResult.result.url)
            } else if (Array.isArray(stepResult?.images)) {
                imageUrls.push(...stepResult.images)
            } else if (Array.isArray(stepResult)) {
                stepResult.forEach(item => {
                    if (typeof item === 'string' && item.startsWith('http')) {
                        imageUrls.push(item)
                    } else if (item?.url) {
                        imageUrls.push(item.url)
                    }
                })
            }
        })

        return imageUrls.filter(url => url && url.startsWith('http'))
    }, [])

    // Load images from previous steps into canvas
    const loadImagesFromPreviousSteps = useCallback((canvas: fabric.Canvas, results: any) => {
        const imageUrls = extractImageUrls(results)

        if (imageUrls.length === 0) return

        imageUrls.forEach(async (imageUrl, idx) => {
            try {
                const img = await fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' })

                // Scale image to fit canvas
                const maxWidth = canvas.width! * 0.4
                const maxHeight = canvas.height! * 0.4
                const scale = Math.min(maxWidth / (img.width || 1), maxHeight / (img.height || 1))

                img.set({
                    left: 50 + (idx * 100),
                    top: 50 + (idx * 100),
                    scaleX: scale,
                    scaleY: scale,
                })

                canvas.add(img)
                canvas.renderAll()
            } catch (error) {
                console.error('Failed to load image:', imageUrl, error)
            }
        })
    }, [extractImageUrls])

    // Auto-save canvas state
    const autoSave = useCallback(() => {
        const canvasData: CanvasFrameData[] = frames.map((canvas, idx) => ({
            frameIndex: idx,
            frameName: frameConfigs[idx].name,
            json: canvas.toJSON(),
        }))

        onChange({
            frames: canvasData,
            timestamp: new Date().toISOString()
        })
    }, [frames, frameConfigs, onChange])

    // Initialize canvases
    useEffect(() => {
        const newFrames: fabric.Canvas[] = []

        frameConfigs.forEach((config, idx) => {
            if (!canvasRefs.current[idx]) return

            const canvas = new fabric.Canvas(canvasRefs.current[idx], {
                width: config.width,
                height: config.height,
                backgroundColor: '#ffffff',
                selection: true,
                preserveObjectStacking: true,
            })

            // Load previous canvas state if exists
            if (value?.frames?.[idx]?.json) {
                canvas.loadFromJSON(value.frames[idx].json, () => {
                    canvas.renderAll()
                })
            } else {
                // Auto-load images from previous step results
                loadImagesFromPreviousSteps(canvas, previousStepResults)
            }

            // Event handlers
            canvas.on('selection:created', (e) => {
                setSelectedObject(e.selected?.[0] || null)
            })

            canvas.on('selection:updated', (e) => {
                setSelectedObject(e.selected?.[0] || null)
            })

            canvas.on('selection:cleared', () => {
                setSelectedObject(null)
            })

            canvas.on('object:modified', () => {
                autoSave()
            })

            newFrames.push(canvas)
        })

        setFrames(newFrames)

        return () => {
            newFrames.forEach(c => c.dispose())
        }
    }, [autoSave, loadImagesFromPreviousSteps, previousStepResults, value?.frames])

    // Manual save with image export
    const handleSave = async () => {
        try {
            const canvasData: CanvasFrameData[] = await Promise.all(
                frames.map(async (canvas, idx) => {
                    // Export canvas as data URL
                    const dataUrl = canvas.toDataURL({
                        format: 'png',
                        quality: 1,
                        multiplier: 1
                    })

                    // TODO: Upload to file service and get URL
                    // For now, store data URL (in production, upload to MinIO/S3)

                    return {
                        frameIndex: idx,
                        frameName: frameConfigs[idx].name,
                        json: canvas.toJSON(),
                        imageUrl: dataUrl // In production: uploadedImageUrl
                    }
                })
            )

            onChange({
                frames: canvasData,
                timestamp: new Date().toISOString()
            })

            toast.success('Canvas saved successfully!')
        } catch (error) {
            toast.error('Failed to save canvas')
            console.error(error)
        }
    }

    // Export all frames as images
    const handleExportAll = () => {
        frames.forEach((canvas, idx) => {
            const dataUrl = canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 })
            const link = document.createElement('a')
            link.download = `${frameConfigs[idx].name.replace(/\s+/g, '_')}.png`
            link.href = dataUrl
            link.click()
        })
        toast.success('Frames exported!')
    }

    // Add image from URL
    const handleAddImage = () => {
        const imageUrl = prompt('Enter image URL:')
        if (!imageUrl) return

        const canvas = frames[activeFrame]

        fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' })
            .then((img) => {
                const scale = Math.min(
                    canvas.width! * 0.5 / (img.width || 1),
                    canvas.height! * 0.5 / (img.height || 1)
                )

                img.set({
                    left: canvas.width! / 2 - ((img.width || 0) * scale) / 2,
                    top: canvas.height! / 2 - ((img.height || 0) * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                })

                canvas.add(img)
                canvas.renderAll()
                autoSave()
            })
            .catch((error) => {
                console.error('Failed to load image:', error)
                toast.error('Failed to load image')
            })
    }

    // Add text
    const handleAddText = () => {
        const canvas = frames[activeFrame]
        const text = new fabric.IText('Double click to edit', {
            left: canvas.width! / 2 - 100,
            top: canvas.height! / 2 - 20,
            fontSize: 32,
            fill: '#000000',
            fontFamily: 'Arial'
        })

        canvas.add(text)
        canvas.setActiveObject(text)
        canvas.renderAll()
        autoSave()
    }

    // Add rectangle
    const handleAddRectangle = () => {
        const canvas = frames[activeFrame]
        const rect = new fabric.Rect({
            left: canvas.width! / 2 - 100,
            top: canvas.height! / 2 - 75,
            width: 200,
            height: 150,
            fill: '#3b82f6',
            stroke: '#1e40af',
            strokeWidth: 2
        })

        canvas.add(rect)
        canvas.setActiveObject(rect)
        canvas.renderAll()
        autoSave()
    }

    // Delete selected object
    const handleDeleteSelected = () => {
        const canvas = frames[activeFrame]
        const activeObject = canvas.getActiveObject()

        if (activeObject) {
            canvas.remove(activeObject)
            canvas.renderAll()
            setSelectedObject(null)
            autoSave()
            toast.success('Object deleted')
        }
    }

    return (
        <div className="space-y-4 border rounded-xl p-6 bg-card">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-lg">{field.label}</h3>
                    <p className="text-sm text-muted-foreground">
                        {field.description || 'Arrange and edit your design frames'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleExportAll}>
                        <Download className="w-4 h-4 mr-2" />
                        Export All
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                    </Button>
                </div>
            </div>

            {/* Frame Tabs */}
            <Tabs value={activeFrame.toString()} onValueChange={(v) => setActiveFrame(parseInt(v))}>
                <TabsList className="w-full justify-start">
                    {frameConfigs.map((frame, idx) => (
                        <TabsTrigger key={idx} value={idx.toString()}>
                            {frame.name}
                            <span className="ml-2 text-xs text-muted-foreground">
                                {frame.width}×{frame.height}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {frameConfigs.map((frame, idx) => (
                    <TabsContent key={idx} value={idx.toString()} className="space-y-4">
                        {/* Canvas Container */}
                        <div
                            ref={(el) => {
                                if (el) canvasContainerRefs.current[idx] = el
                            }}
                            className="border-2 border-dashed rounded-xl p-8 bg-muted/10 overflow-auto"
                        >
                            <div className="flex items-center justify-center">
                                <canvas
                                    ref={(el) => {
                                        if (el) canvasRefs.current[idx] = el
                                    }}
                                    className="border-2 border-border bg-white shadow-2xl"
                                />
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-wrap gap-2 border-t pt-4">
                            <Button size="sm" variant="outline" onClick={handleAddImage}>
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Add Image
                            </Button>

                            <Button size="sm" variant="outline" onClick={handleAddText}>
                                <Type className="w-4 h-4 mr-2" />
                                Add Text
                            </Button>

                            <Button size="sm" variant="outline" onClick={handleAddRectangle}>
                                <Square className="w-4 h-4 mr-2" />
                                Add Shape
                            </Button>

                            {selectedObject && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleDeleteSelected}
                                    className="ml-auto"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Selected
                                </Button>
                            )}
                        </div>

                        {/* Layers Panel */}
                        <div className="border rounded-lg p-4 bg-muted/5">
                            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                                <Layers className="w-4 h-4" />
                                Layers ({frames[idx]?.getObjects().length || 0})
                            </h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                                {frames[idx]?.getObjects().reverse().map((obj, objIdx) => (
                                    <div
                                        key={objIdx}
                                        className={cn(
                                            "flex items-center justify-between p-2 rounded cursor-pointer transition-colors",
                                            selectedObject === obj ? "bg-primary/10 border border-primary" : "hover:bg-muted"
                                        )}
                                        onClick={() => {
                                            frames[idx].setActiveObject(obj)
                                            frames[idx].renderAll()
                                            setSelectedObject(obj)
                                        }}
                                    >
                                        <span className="text-sm font-medium">
                                            {obj.type === 'i-text' ? 'Text' : obj.type === 'image' ? 'Image' : 'Shape'} {objIdx + 1}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                frames[idx].remove(obj)
                                                frames[idx].renderAll()
                                                autoSave()
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ))}
                                {frames[idx]?.getObjects().length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No objects yet. Add images, text, or shapes to get started.
                                    </p>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    )
}
