"use client"

import React, { useState, useEffect } from 'react'
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
import toast from '@/lib/toast'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface KbItemDetailsViewProps {
    document: KBDocument
    onSave?: (id: string, content: string) => Promise<void>
    onReload?: (id: string) => Promise<void>
    onClose?: () => void
}

export function KbItemDetailsView({
    document,
    onSave,
    onReload,
    onClose
}: KbItemDetailsViewProps) {
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
            if (onClose) onClose();
        } catch (e) {
            toast.error('Failed to trigger re-crawl');
        }
    };

    const statusColors = {
        completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        processing: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
        failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    }

    const itemStatus = document.processingStatus || 'pending'
    const statusClass = statusColors[itemStatus as keyof typeof statusColors] || statusColors.pending

    return (
        <Card className="flex flex-col h-full border-none shadow-none bg-transparent">
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="space-y-6">
                        {/* Header actions */}
                        <div className="flex items-center justify-between pb-4 border-b">
                            <div className="flex flex-col gap-1">
                                <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-primary" />
                                    Link Details
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium truncate max-w-2xl px-1">
                                    {document.sourceUrl}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {onReload && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 gap-2 font-bold text-xs uppercase tracking-wider"
                                        onClick={handleReload}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Re-train Page
                                    </Button>
                                )}
                                <Button variant="secondary" size="sm" className="h-9 font-bold px-6" onClick={onClose}>
                                    Close
                                </Button>
                            </div>
                        </div>

                        {/* Status Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4 md:col-span-1">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    <Clock className="w-3.5 h-3.5" /> Basic Info
                                </div>
                                <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 space-y-4">
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 block">Status</Label>
                                        <Badge className={cn("font-bold uppercase tracking-wider border px-3 py-1", statusClass)} variant="outline">
                                            {itemStatus}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 block">Page Title</Label>
                                        <p className="font-bold leading-tight">{document.title || document.name || 'Untitled Document'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 md:col-span-2">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                                    <FileText className="w-3.5 h-3.5" /> Description
                                </div>
                                <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 h-[calc(100%-2.5rem)]">
                                    <p className="text-sm font-medium leading-relaxed opacity-80">
                                        {document.metadata?.description || "No description available for this source."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tabs for Image and Schema */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="bg-muted/30 p-1 w-full sm:w-auto grid grid-cols-3 sm:flex rounded-xl mb-6">
                                <TabsTrigger value="content" className="font-bold rounded-lg px-6">
                                    <BrainCircuit className="w-4 h-4 mr-2" /> Learned Data
                                </TabsTrigger>
                                <TabsTrigger value="image" className="font-bold rounded-lg px-6">
                                    <ImageIcon className="w-4 h-4 mr-2" /> Visual Preview
                                </TabsTrigger>
                                <TabsTrigger value="schema" className="font-bold rounded-lg px-6">
                                    <Code className="w-4 h-4 mr-2" /> Metadata
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="content" className="mt-0 ring-offset-background focus-visible:outline-none">
                                <Card className="p-6 bg-muted/10 border-border/50 rounded-2xl overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                            <ScanEye className="w-4 h-4 text-primary" />
                                            Extracted Content
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={isPreview ? "default" : "outline"}
                                                onClick={() => setIsPreview(!isPreview)}
                                                className="h-8 text-[10px] font-black uppercase tracking-widest"
                                            >
                                                {isPreview ? 'Switch to Editor' : 'Switch to Preview'}
                                            </Button>

                                            {onSave && !isPreview && (
                                                <Button
                                                    size="sm"
                                                    onClick={handleSave}
                                                    disabled={saving || editedContent === document.content}
                                                    className={cn("h-8 transition-all font-black text-[10px] uppercase tracking-widest px-4", saving && "opacity-80")}
                                                >
                                                    <Save className="w-3.5 h-3.5 mr-2" />
                                                    {saving ? 'Saving...' : 'Commit Changes'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {isPreview ? (
                                        <div className="min-h-[500px] p-6 bg-background rounded-xl prose prose-sm max-w-none dark:prose-invert overflow-auto border shadow-inner">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {editedContent ? editedContent.replace(/!\s*\((https?:\/\/[^)]+)\)/g, '![]($1)') : '*No content.*'}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <Textarea
                                                value={editedContent}
                                                onChange={(e) => setEditedContent(e.target.value)}
                                                className="min-h-[500px] font-mono text-xs leading-relaxed bg-background rounded-xl border-border/50 shadow-inner p-4 focus:ring-primary/20"
                                                placeholder="No content extracted yet..."
                                            />
                                            <p className="text-[10px] text-muted-foreground font-medium px-2">
                                                * This data is used as the foundational brain for AI agents. Correcting typos or structure here directly improves response accuracy.
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="image" className="mt-0">
                                <Card className="overflow-hidden border-border/50 rounded-2xl bg-muted/5">
                                    {document.metadata?.ogImage ? (
                                        <div className="relative group flex items-center justify-center p-4 bg-black/5">
                                            <img
                                                src={document.metadata.ogImage}
                                                alt="Preview"
                                                className="max-w-full h-auto max-h-[600px] object-contain rounded-lg shadow-2xl"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <Button variant="secondary" className="font-black uppercase text-[10px] tracking-widest" onClick={() => window.open(document.metadata?.ogImage, '_blank')}>
                                                    Open Original Image
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-4">
                                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center opacity-20">
                                                <ImageIcon className="w-10 h-10" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest opacity-40">No preview image captured</p>
                                        </div>
                                    )}
                                </Card>
                            </TabsContent>

                            <TabsContent value="schema" className="mt-0">
                                <Card className="bg-slate-950 text-slate-400 p-8 border-none rounded-2xl shadow-2xl overflow-hidden relative">
                                    <div className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">JSON Metadata</div>
                                    <ScrollArea className="h-[500px] w-full">
                                        <pre className="text-xs font-mono leading-relaxed">
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
                                    </ScrollArea>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </div>
            {onClose && (
                <div className="pt-6 mt-6 border-t flex justify-end">
                    <Button onClick={onClose} variant="outline" className="px-8 font-bold">Back to Files</Button>
                </div>
            )}
        </Card>
    )
}
