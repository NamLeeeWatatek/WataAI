import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/Sheet'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { ExternalLink, Image as ImageIcon, Code, Clock, FileText, RotateCcw, Save, BrainCircuit, ScanEye } from 'lucide-react'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { KBDocument } from '@/lib/types/knowledge-base'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import toast from '@/lib/toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface KbUrlPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    document: KBDocument | null
    onSave?: (id: string, content: string) => Promise<void>
    onReload?: (id: string) => Promise<void>
}

export function KbUrlPreviewDialog({
    open,
    onOpenChange,
    document,
    onSave,
    onReload
}: KbUrlPreviewDialogProps) {
    const [activeTab, setActiveTab] = useState('content')
    const [editedContent, setEditedContent] = useState('')
    const [saving, setSaving] = useState(false)
    const [isPreview, setIsPreview] = useState(false)

    useEffect(() => {
        if (document) {
            setEditedContent(document.content || '')
        }
    }, [document])

    const handleSave = async () => {
        if (!document || !onSave) return;
        setSaving(true);
        try {
            await onSave(document.id, editedContent);
            toast.success('Content updated successfully');
        } catch (e) {
            toast.error('Failed to update content');
        } finally {
            setSaving(false);
        }
    };

    const handleReload = async () => {
        if (!document || !onReload) return;
        try {
            await onReload(document.id);
            toast.success('Triggered re-crawl for this link');
            onOpenChange(false);
        } catch (e) {
            toast.error('Failed to trigger re-crawl');
        }
    };

    if (!document) return null

    const statusColors = {
        completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        processing: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
        failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    }

    const itemStatus = document.processingStatus || 'pending'
    const statusClass = statusColors[itemStatus as keyof typeof statusColors] || statusColors.pending

    // Check if the URL is an image to show preview in list or header if needed, 
    // but here we focus on content preview.

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="sm:max-w-2xl w-full flex flex-col p-0 gap-0 overflow-hidden">
                <SheetHeader className="px-6 py-4 border-b bg-muted/5 z-10">
                    <SheetTitle className="flex items-start justify-between gap-2 w-full">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Link Details</span>
                            <span className="text-base font-bold leading-tight break-words pr-4">
                                {document.title || document.name || 'Untitled Document'}
                            </span>
                        </div>
                        {onReload && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 font-bold text-xs uppercase tracking-wider shrink-0"
                                onClick={handleReload}
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Re-train Page
                            </Button>
                        )}
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 h-full">
                    <div className="p-6 space-y-6 pb-24">
                        {/* Status Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                <Clock className="w-4 h-4" /> Basic Info
                            </div>
                            <div className="grid grid-cols-1 gap-4 p-4 bg-muted/5 rounded-xl border border-border/50">
                                <div>
                                    <Label className="text-xs text-muted-foreground font-semibold mb-1.5 block">Status</Label>
                                    <Badge className={cn("font-bold uppercase tracking-wider border", statusClass)} variant="outline">
                                        {itemStatus}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground font-semibold mb-1.5 block">Title</Label>
                                    <Textarea
                                        value={document.title || document.name}
                                        readOnly
                                        className="bg-background font-medium min-h-[60px] resize-none"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground font-semibold mb-1.5 block">URL</Label>
                                    <div className="flex gap-2">
                                        <Input value={document.sourceUrl || document.fileUrl || ''} readOnly className="bg-background text-blue-500 underline decoration-blue-500/30" />
                                        <Button variant="outline" size="icon" onClick={() => window.open(document.sourceUrl || document.fileUrl || '#', '_blank')}>
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                <FileText className="w-4 h-4" /> Description
                            </div>
                            <Textarea
                                value={document.metadata?.description || "No description available."}
                                readOnly
                                className="min-h-[100px] bg-muted/5 resize-none leading-relaxed"
                            />
                        </div>

                        {/* Tabs for Image and Schema */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full grid grid-cols-3">
                                <TabsTrigger value="content" className="font-bold">
                                    <BrainCircuit className="w-4 h-4 mr-2" /> Learned Data
                                </TabsTrigger>
                                <TabsTrigger value="image" className="font-bold">
                                    <ImageIcon className="w-4 h-4 mr-2" /> Visual Preview
                                </TabsTrigger>
                                <TabsTrigger value="schema" className="font-bold">
                                    <Code className="w-4 h-4 mr-2" /> Metadata
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="content" className="mt-4 space-y-4">
                                <div className="p-4 bg-muted/10 border-border/50 border rounded-xl">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <ScanEye className="w-4 h-4 text-primary" />
                                            Extracted Content
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider ml-2 bg-muted px-2 py-0.5 rounded-full">
                                                {isPreview ? 'Preview' : 'Editable'}
                                            </span>
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={isPreview ? "default" : "outline"}
                                                onClick={() => setIsPreview(!isPreview)}
                                                className="h-8 text-xs font-bold"
                                            >
                                                {isPreview ? 'Edit Mode' : 'Preview Mode'}
                                            </Button>

                                            {onSave && !isPreview && (
                                                <Button
                                                    size="sm"
                                                    onClick={handleSave}
                                                    disabled={saving || editedContent === document.content}
                                                    className={cn("h-8 transition-all font-bold", saving && "opacity-80")}
                                                >
                                                    <Save className="w-3.5 h-3.5 mr-2" />
                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {isPreview ? (
                                        <div className="min-h-[300px] p-4 bg-background border rounded-md prose prose-sm max-w-none dark:prose-invert overflow-auto">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {editedContent || '*No content.*'}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <>
                                            <Textarea
                                                value={editedContent}
                                                onChange={(e) => setEditedContent(e.target.value)}
                                                className="min-h-[300px] font-mono text-xs leading-relaxed bg-background"
                                                placeholder="No content extracted yet..."
                                            />
                                            <p className="text-[10px] text-muted-foreground mt-2">
                                                * This is the raw text content the AI uses for understanding. You can edit this to improve answer quality.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="image" className="mt-4">
                                <Card className="overflow-hidden border-dashed">
                                    {document.metadata?.ogImage ? (
                                        <div className="relative group">
                                            <img
                                                src={document.metadata.ogImage}
                                                alt="Preview"
                                                className="w-full h-auto max-h-[400px] object-contain bg-black/5"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <Button variant="secondary" size="sm" onClick={() => window.open(document.metadata?.ogImage, '_blank')}>
                                                    View Full Size
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[200px] bg-muted/10 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                            <ImageIcon className="w-12 h-12 opacity-20" />
                                            <p className="text-sm font-medium">No preview image captured</p>
                                        </div>
                                    )}
                                </Card>
                            </TabsContent>
                            <TabsContent value="schema" className="mt-4">
                                <Card className="bg-slate-950 text-slate-50 p-4 border-slate-800">
                                    <pre className="text-xs font-mono overflow-auto max-h-[300px]">
                                        {JSON.stringify({
                                            id: document.id,
                                            title: document.title,
                                            url: document.sourceUrl,
                                            metadata: document.metadata,
                                            tags: document.tags,
                                            createdAt: document.createdAt,
                                            chunkCount: document.chunkCount
                                        }, null, 2)}
                                    </pre>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
                <div className="p-4 border-t bg-muted/5 flex justify-end">
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
