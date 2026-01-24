import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { LoadingLogo } from '@/components/shared/LoadingLogo';
import { cn } from '@/lib/utils';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CheckCircle, Clock, AlertCircle, Copy, ExternalLink, Activity, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Media } from '@/components/shared/Media';
import { isImageUrl, isVideoUrl } from '@/lib/utils/media';
import { getKnowledgeBase } from '@/lib/api/knowledge-base';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

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

    const renderProcess = () => {
        if (!job) return null;

        const steps = (job.outputData as any)?.steps || [];
        const toolSteps = (job.creationTool as any)?.executionFlow?.steps || [];

        return (
            <div className="space-y-6 pt-2">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-1 bg-blue-500 rounded-full" />
                    <h4 className="text-sm font-bold uppercase tracking-tight">Execution Process</h4>
                </div>

                <div className="relative pl-6 border-l-2 border-muted space-y-8">
                    {/* Inputs Section */}
                    {(job.inputData && Object.keys(job.inputData).length > 0) && (
                        <div className="relative">
                            <div className="absolute -left-[29px] top-0 w-4 h-4 rounded-full bg-purple-500 border-4 border-background" />
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <h5 className="text-xs font-bold uppercase text-purple-500">Input Data</h5>
                                    <p className="text-[10px] text-muted-foreground">User provided parameters</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(job.inputData).map(([key, value]) => {
                                        if (key === 'knowledgeBaseId' || !value) return null;

                                        // Handle Image Inputs
                                        // Handle Image Inputs
                                        const isImageKey = key.toLowerCase().includes('image');
                                        const hasUrl = typeof value === 'object' && value && (value as any).url && isImageUrl((value as any).url);
                                        const isStringImage = typeof value === 'string' && isImageUrl(value);

                                        if (isImageKey || hasUrl || isStringImage) {
                                            let images: string[] = [];

                                            if (Array.isArray(value)) {
                                                images = value
                                                    .map((v: any) => typeof v === 'string' ? v : v?.url)
                                                    .filter((url) => typeof url === 'string' && (isImageUrl(url) || isImageKey));
                                            } else if (typeof value === 'string') {
                                                images = [value];
                                            } else if (typeof value === 'object' && value && (value as any).url) {
                                                images = [(value as any).url];
                                            }

                                            if (images.length > 0) {
                                                return (
                                                    <div key={key} className="bg-secondary/10 p-2 rounded-lg border border-border/50">
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">{key.replace(/_/g, ' ')}</p>
                                                        <div className={cn("grid gap-2", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                                                            {images.map((imgUrl, idx) => (
                                                                <div key={idx} className="relative w-full aspect-video rounded overflow-hidden bg-background">
                                                                    <Media src={imgUrl} alt={`${key} ${idx + 1}`} fill objectFit="contain" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }

                                        // Handle Channel/Platform IDs
                                        if (['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube'].some(k => key.toLowerCase().includes(k))) {
                                            return (
                                                <div key={key} className="bg-secondary/10 p-3 rounded-lg border border-border/50">
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{key.replace(/_/g, ' ')}</p>
                                                    <code className="text-[10px] bg-background px-1.5 py-0.5 rounded border block truncate">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</code>
                                                </div>
                                            )
                                        }

                                        // Handle Text Inputs (Prompts)
                                        return (
                                            <div key={key} className="bg-secondary/10 p-3 rounded-lg border border-border/50">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{key.replace(/_/g, ' ')}</p>
                                                <p className="text-xs text-foreground/90 whitespace-pre-wrap font-medium">
                                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute -left-[29px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                        <div className="space-y-1">
                            <h5 className="text-xs font-bold uppercase text-primary">Job Started</h5>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(job.createdAt), 'PPpp')}</p>
                        </div>
                    </div>

                    {toolSteps.length > 0 ? toolSteps.map((step: any, idx: number) => {
                        const outputStep = steps.find((s: any) => s.id === step.id);
                        const isDone = !!outputStep;

                        return (
                            <div key={idx} className="relative">
                                <div className={cn(
                                    "absolute -left-[29px] top-1 w-4 h-4 rounded-full border-4 border-background transition-colors",
                                    isDone ? "bg-green-500" : "bg-muted-foreground/30"
                                )} />
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h5 className={cn("text-xs font-bold uppercase", isDone ? "text-foreground" : "text-muted-foreground")}>{step.title || `Step ${idx + 1}`}</h5>
                                        {isDone && <Badge variant="secondary" className="text-[10px] h-4 bg-green-500/10 text-green-500">Completed</Badge>}
                                    </div>
                                    {outputStep && (
                                        <div className="bg-muted/30 p-2 rounded text-[10px] font-mono border break-all max-h-20 overflow-hidden text-muted-foreground">
                                            {JSON.stringify(outputStep.result || outputStep)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }) : (
                        <div className="relative">
                            <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-green-500 border-4 border-background" />
                            <div className="space-y-1">
                                <h5 className="text-xs font-bold uppercase text-foreground">Processing</h5>
                                <p className="text-[10px] text-muted-foreground">Single step execution</p>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <div className={cn(
                            "absolute -left-[29px] top-0 w-4 h-4 rounded-full border-4 border-background",
                            job.status === 'COMPLETED' ? "bg-primary" : "bg-muted-foreground/30"
                        )} />
                        <div className="space-y-1">
                            <h5 className="text-xs font-bold uppercase">Completion</h5>
                            <p className="text-[10px] text-muted-foreground">
                                {job.status === 'COMPLETED' ? 'Finished successfully' : (job.status === 'FAILED' ? 'Failed' : 'Pending...')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 gap-0 border-0 shadow-2xl flex flex-col bg-background">
                <DialogHeader className="p-6 pb-4 border-b bg-secondary/10 shrink-0">
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
                        <StatusBadge status={job.status} showIcon className="px-3 py-1 text-sm border-0" />
                    </div>
                </DialogHeader>

                <Tabs defaultValue="result" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 pt-2 border-b bg-background/50 backdrop-blur-sm z-10">
                        <TabsList className="bg-transparent p-0 h-auto gap-6">
                            <TabsTrigger
                                value="result"
                                className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all uppercase text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground"
                            >
                                <FileText className="w-3.5 h-3.5 mr-2" /> Result
                            </TabsTrigger>
                            <TabsTrigger
                                value="process"
                                className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all uppercase text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground"
                            >
                                <Activity className="w-3.5 h-3.5 mr-2" /> Process & History
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
                        <TabsContent value="result" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {renderOutput()}
                        </TabsContent>

                        <TabsContent value="process" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {renderProcess()}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
