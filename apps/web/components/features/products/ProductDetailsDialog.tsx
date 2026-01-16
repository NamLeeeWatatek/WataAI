import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { LoadingLogo } from '@/components/shared/LoadingLogo';


import { cn } from '@/lib/utils';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Media } from '@/components/shared/Media';
import { isImageUrl, isVideoUrl } from '@/lib/utils/media';

import { getKnowledgeBase } from '@/lib/api/knowledge-base';
import { useState, useEffect } from 'react';

interface ProductDetailsDialogProps {
    job: CreationJob | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({ job, open, onOpenChange }: ProductDetailsDialogProps) {
    const [kbName, setKbName] = useState<string | null>(null);

    useEffect(() => {
        if (open && job && job.inputData && typeof job.inputData === 'object') {
            const input = job.inputData as any;
            if (input.knowledgeBaseId && typeof input.knowledgeBaseId === 'string') {
                getKnowledgeBase(input.knowledgeBaseId)
                    .then(res => {
                        // Res might be the KB object directly or wrapped in data property depending on axios interceptor
                        // Based on api file: return axiosClient.get(...)
                        // Usually returns data directly if interceptor is set up, or { data: ... }
                        // For safety, let's assume standard response structure or check properties
                        const name = (res as any).name || (res as any).data?.name;
                        if (name) setKbName(name);
                    })
                    .catch(err => console.error("Failed to fetch KB name", err));
            } else {
                setKbName(null);
            }
        }
    }, [open, job]);

    if (!job) return null;

    const statusConfig = {
        [CreationJobStatus.COMPLETED]: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle, label: 'Completed' },
        [CreationJobStatus.PROCESSING]: { color: 'bg-blue-500/10 text-blue-500', icon: Clock, label: 'Processing' },
        [CreationJobStatus.PENDING]: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock, label: 'Pending' },
        [CreationJobStatus.FAILED]: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle, label: 'Failed' },
        [CreationJobStatus.CANCELED]: { color: 'bg-gray-500/10 text-gray-500', icon: AlertCircle, label: 'Canceled' },
    };

    const status = statusConfig[job.status] || statusConfig[CreationJobStatus.PENDING];
    const StatusIcon = status.icon;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };


    const renderOutput = () => {
        if (!job.outputData) {
            return (
                <div className="py-12 flex items-center justify-center">
                    <LoadingLogo size="md" text="Generating your product..." showGlow />
                </div>
            );
        }

        const data = job.outputData as any;
        const resultText = data.result || (typeof data === 'string' ? data : null);
        const mediaUrl = data.imageUrl || data.videoUrl || data.url;
        const isDirectMedia = typeof data === 'string' && (isImageUrl(data) || isVideoUrl(data));
        const finalMediaUrl = mediaUrl || (isDirectMedia ? data : null);

        return (
            <div className="space-y-6">
                {finalMediaUrl && (
                    <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-background">
                        <div className="relative w-full aspect-video">
                            <Media
                                src={finalMediaUrl}
                                alt="Result"
                                fill
                                ambient
                                objectFit="contain"
                                controls
                                autoPlay
                                loop
                                className="transition-transform hover:scale-[1.01]"
                            />
                        </div>
                        <div className="p-3 flex justify-center bg-secondary/20 border-t border-border">
                            <Button variant="secondary" size="sm" className="rounded-full shadow-sm" onClick={() => window.open(finalMediaUrl, '_blank')}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Download / Open HD
                            </Button>
                        </div>
                    </div>
                )}

                {resultText ? (
                    <div className="relative group">
                        <div className="text-xs font-bold text-primary mb-2 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            FINAL CONTENT
                        </div>
                        <div className="p-6 rounded-2xl bg-secondary/10 text-base leading-relaxed whitespace-pre-wrap border border-secondary/20 shadow-sm">
                            {resultText}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleCopy(resultText)}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                ) : null}
            </div>
        );
    }

    const getDisplayName = () => {
        if (!job) return '';
        const toolName = job.creationTool?.name || 'Product';
        const input = job.inputData as any;
        const subject = input?.prompt || input?.title || input?.name || input?.concept || input?.subject || input?.text;

        if (subject && typeof subject === 'string') {
            return subject;
        }

        return `${toolName} Details`;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b bg-secondary/10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            {job.creationTool?.name && (
                                <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wider h-5 px-1.5">
                                    {job.creationTool.name}
                                </Badge>
                            )}
                            <DialogTitle className="text-lg font-bold leading-tight line-clamp-2">
                                {getDisplayName()}
                            </DialogTitle>
                        </div>
                        <Badge variant="outline" className={cn(status.color, "border-0 flex items-center gap-1.5 shrink-0 px-3 py-1")}>
                            <StatusIcon className="w-4 h-4" />
                            {status.label}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-4 text-[11px] text-muted-foreground/60 font-medium tracking-wide border-t pt-3">
                        <span className="flex items-center gap-1.5 uppercase">
                            <Clock className="w-3 h-3" />
                            {format(new Date(job.createdAt), 'PPpp')}
                        </span>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-8">
                    {/* Output Section First - User wants to see the product */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-4 w-1 bg-primary rounded-full" />
                            <h4 className="text-sm font-bold uppercase tracking-tight">Generated Result</h4>
                        </div>
                        {renderOutput()}
                    </div>


                </div>
            </DialogContent>
        </Dialog>
    );
}
