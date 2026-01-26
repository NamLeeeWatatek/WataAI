import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { LoadingLogo } from '@/components/shared/LoadingLogo';
import { cn } from '@/lib/utils';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CheckCircle, Clock, AlertCircle, Copy, ExternalLink, Activity, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { Media } from '@/components/shared/Media';
import { isImageUrl, isVideoUrl } from '@/lib/utils/media';
import { getKnowledgeBase } from '@/lib/api/knowledge-base';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useQuery } from '@tanstack/react-query';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { useChannels } from '@/lib/hooks/features/useChannels';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { creationJobsApi } from '@/lib/api/creation-jobs';

interface ProductDetailsDialogProps {
    job: CreationJob | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({ job, open, onOpenChange }: ProductDetailsDialogProps) {
    const { t } = useTranslation();
    const [kbName, setKbName] = useState<string | null>(null);
    const { currentWorkspace } = useWorkspace();
    const { channels } = useChannels(currentWorkspace?.id);

    const { data: fullTool } = useQuery({
        queryKey: ['creation-tool', job?.creationToolId],
        queryFn: () => job?.creationToolId ? creationToolsApi.getById(job.creationToolId) : null,
        enabled: open && !!job?.creationToolId
    });

    const { data: publications, isLoading: isLoadingPubs } = useQuery({
        queryKey: ['creation-job-publications', job?.id],
        queryFn: () => job?.id ? creationJobsApi.getPublications(job.id) : [],
        enabled: open && !!job?.id
    });

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
                    <LoadingLogo size="md" text="Generating your product..." />
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
                                        if (key === 'knowledgeBaseId' || key === 'creationToolId' || !value) return null;

                                        const lowerKey = key.toLowerCase();
                                        // Deduplicate Template fields (case insensitive)
                                        if ((lowerKey === 'templateid' || lowerKey === 'template_id') && (job.inputData['template'] || job.inputData['TEMPLATE'])) return null;

                                        // Find field definition for labels/options - Use fullTool if available
                                        const toolConfig = fullTool || job.creationTool;
                                        const field = (toolConfig as any)?.formConfig?.fields?.find((f: any) => f.name === key || f.name.toLowerCase() === lowerKey);
                                        const displayLabel = field?.displayName || field?.label || key.replace(/_/g, ' ');

                                        // Handle Image Inputs
                                        const isImageKey = lowerKey.includes('image') || lowerKey.includes('file') || field?.type === 'file' || field?.type === 'files';
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
                                                        <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">{displayLabel}</p>
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

                                        // Handle Channel/Platform IDs mapping to names
                                        const isChannelField = field?.type === 'channel-selector' || field?.type === 'channel-select' ||
                                            ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube'].some(k => key.toLowerCase().includes(k));

                                        if (isChannelField) {
                                            let displayValue = '';
                                            if (Array.isArray(value)) {
                                                displayValue = value.map(id => {
                                                    const channel = channels.find((c: any) => String(c.id) === String(id));
                                                    return channel ? channel.name : id;
                                                }).join(', ');
                                            } else {
                                                const channel = channels.find((c: any) => String(c.id) === String(value));
                                                displayValue = channel ? channel.name : String(value);
                                            }

                                            return (
                                                <div key={key} className="bg-secondary/10 p-3 rounded-lg border border-border/50">
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{displayLabel}</p>
                                                    <p className="text-xs font-medium text-foreground">{displayValue}</p>
                                                </div>
                                            )
                                        }

                                        // Lookup labels for select/radio fields - Support multi-select
                                        if (field?.options && Array.isArray(field.options)) {
                                            const getOptionLabel = (val: any) => {
                                                const option = (field.options as any[]).find((opt: any) =>
                                                    (typeof opt === 'string' ? opt : opt.value) === val
                                                );
                                                return typeof option === 'string' ? option : (option?.label || val);
                                            };

                                            const displayValue = Array.isArray(value)
                                                ? value.map(getOptionLabel).join(', ')
                                                : getOptionLabel(value);

                                            return (
                                                <div key={key} className="bg-secondary/10 p-3 rounded-lg border border-border/50">
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{displayLabel}</p>
                                                    <p className="text-xs font-medium text-foreground">{displayValue}</p>
                                                </div>
                                            );
                                        }

                                        // Handle Knowledge Base Name override
                                        if (key === 'knowledgeBaseId' && kbName) {
                                            return (
                                                <div key={key} className="bg-secondary/10 p-3 rounded-lg border border-border/50">
                                                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Knowledge Base</p>
                                                    <p className="text-xs font-medium text-foreground">{kbName}</p>
                                                </div>
                                            );
                                        }

                                        // Default Text Inputs (Prompts)
                                        return (
                                            <div key={key} className="bg-secondary/10 p-3 rounded-lg border border-border/50">
                                                <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">{displayLabel}</p>
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

    const renderPublications = () => {
        if (isLoadingPubs) {
            return (
                <div className="py-12 flex items-center justify-center">
                    <LoadingLogo size="sm" text={t('common.loading')} />
                </div>
            );
        }

        if (!publications || publications.length === 0) {
            return (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Share2 className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">{t('product_details.publications.title')}</p>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                            {t('product_details.publications.no_history')}
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-1 bg-green-500 rounded-full" />
                    <h4 className="text-sm font-bold uppercase tracking-tight">{t('product_details.publications.title')}</h4>
                </div>

                <div className="rounded-xl border border-border overflow-hidden bg-background divide-y">
                    {publications.map((item: any, idx: number) => {
                        const channel = channels.find((c: any) => String(c.id) === String(item.channelId));
                        return (
                            <div key={idx} className="flex flex-col hover:bg-muted/30 transition-colors">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center overflow-hidden border">
                                            <Share2 className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold">{channel?.name || item.platform || t('common.notAvailable')}</p>
                                            <p className="text-[10px] text-muted-foreground">{format(new Date(item.createdAt), 'PPpp')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <StatusBadge status={item.status as any} className="h-6 text-[10px] font-bold uppercase px-2" />
                                        {item.url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[10px] font-bold uppercase tracking-wider"
                                                onClick={() => window.open(item.url, '_blank')}
                                            >
                                                <ExternalLink className="w-3 h-3 mr-2" />
                                                {t('product_details.publications.view_post')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {item.content && (
                                    <div className="px-16 pb-4">
                                        <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground italic border border-border/50">
                                            "{item.content}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
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
                                <FileText className="w-3.5 h-3.5 mr-2" /> {t('product_details.tabs.result')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="process"
                                className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all uppercase text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground"
                            >
                                <Activity className="w-3.5 h-3.5 mr-2" /> {t('product_details.tabs.process')}
                            </TabsTrigger>
                            <TabsTrigger
                                value="publications"
                                className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all uppercase text-[10px] font-bold tracking-widest text-muted-foreground hover:text-foreground"
                            >
                                <Share2 className="w-3.5 h-3.5 mr-2" /> {t('product_details.tabs.publications')}
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

                        <TabsContent value="publications" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {renderPublications()}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
