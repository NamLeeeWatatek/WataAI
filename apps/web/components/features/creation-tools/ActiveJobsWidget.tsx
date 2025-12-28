import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Loader2, CheckCircle2, XCircle, Minimize2, Maximize2, X, List, History, ExternalLink } from 'lucide-react';
import { CreationJob, CreationJobStatus } from '@/lib/types/creation-job';
import { cn } from '@/lib/utils';
import { useCreationJobs } from '@/components/providers/CreationJobsProvider';
import { AnimatePresence, motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { ProductDetailsDialog } from '../products/ProductDetailsDialog';

export function ActiveJobsWidget() {
    const { activeJobs, removeJob } = useCreationJobs();
    const [isMinimized, setIsMinimized] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [selectedJob, setSelectedJob] = useState<CreationJob | null>(null);

    if (activeJobs.length === 0 || !isOpen) return null;

    // Filter to show active logic if needed, but for now show everything in state
    const pendingCount = activeJobs.filter(j => j.status === CreationJobStatus.PENDING || j.status === CreationJobStatus.PROCESSING).length;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={cn(
                            "fixed z-50 transition-all duration-300 shadow-2xl backdrop-blur-xl",
                            isMinimized
                                ? "bottom-4 right-4 w-12 h-12 rounded-full overflow-hidden"
                                : "bottom-6 right-6 w-96 rounded-2xl border border-white/10 ring-1 ring-black/5"
                        )}
                    >
                        {isMinimized ? (
                            <div
                                onClick={() => setIsMinimized(false)}
                                className="w-full h-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors relative"
                            >
                                {pendingCount > 0 ? (
                                    <Loader2 className="w-5 h-5 text-primary-foreground animate-spin" />
                                ) : (
                                    <List className="w-5 h-5 text-primary-foreground" />
                                )}
                                {pendingCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                        {pendingCount}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <Card variant="premium" className="w-full bg-background/80 overflow-hidden flex flex-col shadow-none border-none">
                                {/* Header */}
                                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30 cursor-pointer" onClick={() => setIsMinimized(true)}>
                                    <div className="flex items-center gap-2">
                                        <div className="bg-primary/10 p-1.5 rounded-lg">
                                            <History className="w-4 h-4 text-primary" />
                                        </div>
                                        <h4 className="text-sm font-bold tracking-tight">Activity</h4>
                                        <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[10px]">
                                            {activeJobs.length}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}>
                                            <Minimize2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Content */}
                                <ScrollArea className="max-h-[60vh] min-h-[100px] overflow-hidden">
                                    <div className="divide-y divide-border/30">
                                        {activeJobs.map(job => {
                                            const getDisplayName = () => {
                                                const toolName = job.creationTool?.name || 'Product';
                                                const input = job.inputData as any;
                                                const subject = input?.prompt || input?.title || input?.name || input?.concept || input?.subject || input?.text;

                                                if (subject && typeof subject === 'string') {
                                                    return subject.length > 40 ? subject.substring(0, 37) + '...' : subject;
                                                }

                                                return toolName;
                                            };

                                            const displayName = getDisplayName();

                                            return (
                                                <div
                                                    key={job.id}
                                                    className={cn(
                                                        "p-4 transition-colors group relative cursor-pointer",
                                                        job.status === CreationJobStatus.COMPLETED ? "hover:bg-green-500/5 cursor-pointer" : "hover:bg-muted/30"
                                                    )}
                                                    onClick={() => {
                                                        if (job.status === CreationJobStatus.COMPLETED) {
                                                            setSelectedJob(job);
                                                        }
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="min-w-0 pr-2">
                                                            <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-0.5 truncate">
                                                                {displayName}
                                                            </p>
                                                            <p className="text-[10px] font-mono text-muted-foreground/60">
                                                                ID: {job.id.substring(0, 8)}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <Badge variant={
                                                                job.status === CreationJobStatus.COMPLETED ? 'default' :
                                                                    job.status === CreationJobStatus.FAILED ? 'destructive' : 'outline'
                                                            } className={cn("text-[10px] px-2 h-5 capitalize shadow-none font-bold tracking-wide",
                                                                job.status === CreationJobStatus.COMPLETED && "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
                                                                job.status === CreationJobStatus.FAILED && "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
                                                                (job.status === CreationJobStatus.PENDING || job.status === CreationJobStatus.PROCESSING) && "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 animate-pulse"
                                                            )}>
                                                                {job.status.toLowerCase()}
                                                            </Badge>

                                                            {/* Allow removing completed/failed jobs */}
                                                            {(job.status === CreationJobStatus.COMPLETED || job.status === CreationJobStatus.FAILED) && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity -mr-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        removeJob(job.id);
                                                                    }}
                                                                >
                                                                    <X className="w-3 h-3 text-muted-foreground" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {job.status === CreationJobStatus.PROCESSING || job.status === CreationJobStatus.PENDING ? (
                                                        <div className="space-y-1.5 mt-2">
                                                            <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                                                                <span className="animate-pulse text-primary">Creating...</span>
                                                                <span>{job.progress}%</span>
                                                            </div>
                                                            <Progress
                                                                value={job.progress}
                                                                className="h-1.5 w-full bg-secondary border border-primary/5 shadow-inner"
                                                                indicatorClassName="bg-gradient-to-r from-primary via-indigo-500 to-purple-500 shadow-[0_0_8px_rgba(var(--primary),0.3)]"
                                                            />
                                                        </div>
                                                    ) : job.status === CreationJobStatus.COMPLETED ? (
                                                        <div className="flex items-center justify-between mt-2">
                                                            <div className="flex items-center gap-2 text-green-600 dark:text-green-500 text-xs font-bold animate-in fade-in slide-in-from-bottom-1">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                <span>Ready to view</span>
                                                            </div>
                                                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-500 text-xs font-bold animate-in fade-in slide-in-from-bottom-1">
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span>Failed</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>

                                {/* Footer */}
                                <div className="p-2 border-t border-border/50 bg-muted/20">
                                    <Link
                                        href="/my-products"
                                        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full text-xs h-8")}
                                    >
                                        View All in Gallery
                                    </Link>
                                </div>
                            </Card>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <ProductDetailsDialog
                job={selectedJob}
                open={!!selectedJob}
                onOpenChange={(open) => !open && setSelectedJob(null)}
            />
        </>
    );
}
