import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ProductDetailsDialogProps {
    job: CreationJob | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({ job, open, onOpenChange }: ProductDetailsDialogProps) {
    if (!job) return null;

    const statusConfig = {
        [CreationJobStatus.COMPLETED]: { color: 'bg-green-500/10 text-green-500', icon: CheckCircle, label: 'Completed' },
        [CreationJobStatus.PROCESSING]: { color: 'bg-blue-500/10 text-blue-500', icon: Clock, label: 'Processing' },
        [CreationJobStatus.PENDING]: { color: 'bg-yellow-500/10 text-yellow-500', icon: Clock, label: 'Pending' },
        [CreationJobStatus.FAILED]: { color: 'bg-red-500/10 text-red-500', icon: AlertCircle, label: 'Failed' },
    };

    const status = statusConfig[job.status] || statusConfig[CreationJobStatus.PENDING];
    const StatusIcon = status.icon;

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const renderFormattedAttributes = (data: any) => {
        if (!data || typeof data !== 'object') return null;

        const entries = Object.entries(data).filter(([key, value]) => {
            // Filter out common metadata or complex objects that aren't user-friendly
            const internalKeys = ['id', 'jobId', 'createdAt', 'updatedAt', 'workspaceId', 'createdBy'];
            return !internalKeys.includes(key) && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean');
        });

        if (entries.length === 0) return null;

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                {entries.map(([key, value]) => (
                    <div key={key} className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-sm font-medium leading-tight">{String(value)}</div>
                    </div>
                ))}
            </div>
        );
    };

    const renderOutput = () => {
        if (!job.outputData) return <div className="text-muted-foreground italic text-sm py-4">Generating your product, please wait...</div>;

        const data = job.outputData as any;
        const resultText = data.result || (typeof data === 'string' ? data : null);
        const imageUrl = data.imageUrl;
        const isDirectImage = typeof data === 'string' && (data.match(/\.(jpeg|jpg|gif|png|webp)/) != null || data.startsWith('http'));
        const finalImageUrl = imageUrl || (isDirectImage ? data : null);

        return (
            <div className="space-y-6">
                {finalImageUrl && (
                    <div className="rounded-2xl border border-border shadow-inner overflow-hidden bg-background">
                        <img
                            src={finalImageUrl}
                            alt="Result"
                            className="w-full h-auto object-contain max-h-[500px] mx-auto transition-transform hover:scale-[1.02]"
                        />
                        <div className="p-3 flex justify-center bg-secondary/20 border-t border-border">
                            <Button variant="secondary" size="sm" className="rounded-full shadow-sm" onClick={() => window.open(finalImageUrl, '_blank')}>
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
                ) : (
                    // If it's a complex object but no explicit 'result' field, format its attributes
                    !finalImageUrl && renderFormattedAttributes(data)
                )}
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
                            <DialogTitle className="text-xl font-bold leading-tight">
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
                        <span>•</span>
                        <span className="uppercase">ID: {job.id}</span>
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

                    {/* Inputs Section - Collapsed or Secondary */}
                    <div className="space-y-3 pt-4 border-t border-dashed">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-1 bg-muted-foreground/30 rounded-full" />
                                <h4 className="text-sm font-bold text-muted-foreground/70 uppercase tracking-tight">Technical details</h4>
                            </div>
                        </div>

                        {renderFormattedAttributes(job.inputData)}

                        <details className="group">
                            <summary className="text-[10px] text-muted-foreground cursor-pointer uppercase font-bold tracking-widest hover:text-primary transition-colors list-none flex items-center gap-1">
                                <span className="group-open:rotate-90 transition-transform">▶</span>
                                View Raw Source Data (Advanced)
                            </summary>
                            <div className="relative mt-2">
                                <pre className="p-4 rounded-xl bg-muted/30 overflow-auto text-[10px] font-mono border border-border/50 max-h-[150px]">
                                    {JSON.stringify(job.inputData, null, 2)}
                                </pre>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6"
                                    onClick={() => handleCopy(JSON.stringify(job.inputData, null, 2))}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </details>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
