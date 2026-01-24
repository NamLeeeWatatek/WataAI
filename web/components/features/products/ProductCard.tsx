import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { ExternalLink, Calendar, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { useState } from 'react';
import { ProductDetailsDialog } from './ProductDetailsDialog';
import { toast } from 'sonner';
import { creationJobsApi } from '@/lib/api/creation-jobs';
import { Progress } from '@/components/ui/Progress';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { Image } from '@/components/shared/Image';

interface ProductCardProps {
    job: CreationJob;
    onDelete?: (id: string) => void;
    isSelected?: boolean;
    onSelect?: (isSelected: boolean) => void;
}

export function ProductCard({ job, onDelete, isSelected, onSelect }: ProductCardProps) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await creationJobsApi.remove(job.id);
            toast.success('Product deleted successfully');
            if (onDelete) onDelete(job.id);
        } catch (error) {
            toast.error('Failed to delete product');
            console.error(error);
        } finally {
            setIsDeleting(false);
            setDeleteAlertOpen(false);
        }
    };

    const renderOutputPreview = () => {
        if (job.status !== CreationJobStatus.COMPLETED || !job.outputData) return null;

        // Get the result string from outputData
        const outputResult = job.outputData.result;
        const outputStr = typeof outputResult === 'string' ? outputResult : null;

        // Check if output is an image URL (simple heuristic)
        const isImage = outputStr && (outputStr.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || outputStr.startsWith('http'));

        if (isImage && outputStr) {
            return (
                <button
                    type="button"
                    className="relative aspect-video w-full overflow-hidden rounded-md bg-muted mt-2 group cursor-pointer block"
                    onClick={() => setDetailsOpen(true)}
                    aria-label="View product result"
                >
                    { }
                    <Image
                        src={outputStr}
                        alt="Product result"
                        width={400}
                        height={225}
                        unoptimized
                        className="object-cover w-full h-full transition-transform group-hover:scale-105"
                    />
                </button>
            );
        }

        // Default text preview
        return (
            <button
                type="button"
                className="mt-2 p-3 bg-muted/50 rounded-md text-xs font-mono text-muted-foreground line-clamp-3 cursor-pointer hover:bg-muted w-full text-left"
                onClick={() => setDetailsOpen(true)}
                aria-label="View product details"
            >
                {outputStr || JSON.stringify(job.outputData, null, 2)}
            </button>
        );
    };

    const getDisplayName = () => {
        const toolName = job.creationTool?.name || 'Product';
        const input = job.inputData as any;
        const subject = input?.prompt || input?.title || input?.name || input?.concept || input?.subject || input?.text;

        if (subject && typeof subject === 'string') {
            const shortened = subject.length > 40 ? subject.substring(0, 37) + '...' : subject;
            return shortened;
        }

        return `${toolName} Result`;
    };

    return (
        <>
            <Card className={cn(
                "flex flex-col h-full relative group transition-all",
                isSelected && "border-primary ring-1 ring-primary/20 bg-primary/5 shadow-primary/10"
            )}>
                <div className={cn(
                    "absolute top-3 left-3 z-10 transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
                )}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect?.(!!checked)}
                    />
                </div>

                {/* Visual Preview at Top for Impact */}
                <div className="px-3 pt-3">
                    {renderOutputPreview()}
                </div>

                <CardHeader className="pb-2 pt-4">
                    <div className="flex justify-between items-start gap-2">
                        <CardTitle className={cn("text-base font-bold truncate transition-all", isSelected && "ml-7")} title={getDisplayName()}>
                            {getDisplayName()}
                        </CardTitle>
                        <StatusBadge status={job.status} showIcon className="font-bold border-none h-6" />
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground/60">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(job.createdAt)}
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                    {job.creationTool?.name && (
                        <Badge variant="secondary" className="font-normal bg-background/50 text-[10px] uppercase tracking-wider">
                            {job.creationTool.name}
                        </Badge>
                    )}

                    {job.status === CreationJobStatus.PROCESSING && (
                        <div className="mt-3 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                                <span className="text-primary animate-pulse">Processing</span>
                                <span className="text-muted-foreground">{job.progress}%</span>
                            </div>
                            <Progress
                                value={job.progress}
                                className="h-1.5 bg-muted"
                            />
                        </div>
                    )}
                </CardContent>
                <CardFooter className="pt-0 pb-4 px-4 flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs h-9 gap-2"
                        onClick={() => setDetailsOpen(true)}
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Result
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                        onClick={() => setDeleteAlertOpen(true)}
                        disabled={isDeleting}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </CardFooter>
            </Card>

            <ProductDetailsDialog
                job={job}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
            />

            <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this product and remove the data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}



