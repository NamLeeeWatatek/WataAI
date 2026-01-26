import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { ExternalLink, Image as ImageIcon, Code, Clock, FileText } from 'lucide-react'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Card } from '@/components/ui/Card'
import { KBDocument } from '@/lib/types/knowledge-base'
import { cn } from '@/lib/utils'

interface KbUrlPreviewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    document: KBDocument | null
}

export function KbUrlPreviewDialog({
    open,
    onOpenChange,
    document
}: KbUrlPreviewDialogProps) {
    if (!document) return null

    const statusColors = {
        completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        processing: "bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse",
        failed: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20"
    }

    const itemStatus = document.processingStatus || 'pending'
    const statusClass = statusColors[itemStatus as keyof typeof statusColors] || statusColors.pending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b bg-muted/5">
                    <DialogTitle className="flex items-center gap-2">
                        <span className="truncate max-w-[400px]">Link Details</span>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
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
                                    <Input value={document.title || document.name} readOnly className="bg-background font-medium" />
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
                        <Tabs defaultValue="image" className="w-full">
                            <TabsList className="w-full grid grid-cols-2">
                                <TabsTrigger value="image" className="font-bold">
                                    <ImageIcon className="w-4 h-4 mr-2" /> Visual Preview
                                </TabsTrigger>
                                <TabsTrigger value="schema" className="font-bold">
                                    <Code className="w-4 h-4 mr-2" /> Schema / Metadata
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="image" className="mt-4">
                                <Card className="overflow-hidden border-dashed">
                                    {document.metadata?.ogImage ? (
                                        <img
                                            src={document.metadata.ogImage}
                                            alt="Preview"
                                            className="w-full h-auto max-h-[300px] object-cover"
                                        />
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
                                            createdAt: document.createdAt
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
            </DialogContent>
        </Dialog>
    )
}
