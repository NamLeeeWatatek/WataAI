import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Clock, CheckCircle2, XCircle, Loader2, FileText, Square } from 'lucide-react'
import { useSocketConnection } from '@/lib/hooks/use-socket-connection'
import { cn } from '@/lib/utils'
import { cancelKBJob } from '@/lib/api/knowledge-base'
import toast from '@/lib/toast'

interface ProcessingJob {
    jobId?: string
    documentId: string
    documentName?: string
    knowledgeBaseId: string
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
    progress: number
    totalChunks: number
    processedChunks: number
    type?: 'embedding' | 'crawl'
    error?: string
}

interface KBProcessingStatusProps {
    knowledgeBaseId: string
    onProcessingComplete?: () => void
}

export function KBProcessingStatus({ knowledgeBaseId, onProcessingComplete }: KBProcessingStatusProps) {
    const [jobs, setJobs] = useState<ProcessingJob[]>([])

    const { isConnected, on } = useSocketConnection({
        namespace: '', // Default namespace
    })

    useEffect(() => {
        if (!isConnected) return

        const unsubscribe = on('processing:update', (data: ProcessingJob) => {
            if (data.knowledgeBaseId !== knowledgeBaseId) return

            setJobs((prevJobs) => {
                // If job is completed/failed/cancelled, remove it after delay
                if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
                    // Notify parent to refresh data immediately
                    if (data.status === 'completed' && onProcessingComplete) {
                        onProcessingComplete()
                    }

                    // Specific timeout to remove THIS specific job
                    setTimeout(() => {
                        setJobs(current => current.filter(j => j.documentId !== data.documentId))
                    }, 5000)
                }

                const existingIndex = prevJobs.findIndex(j => j.documentId === data.documentId)
                if (existingIndex >= 0) {
                    const updated = [...prevJobs]
                    updated[existingIndex] = data
                    return updated
                }

                // Add new job
                return [...prevJobs, data]
            })
        })

        return () => {
            unsubscribe()
        }
    }, [knowledgeBaseId, onProcessingComplete, isConnected, on])

    const handleCancelJob = async (jobId: string) => {
        try {
            const res = await cancelKBJob(jobId)
            if (res.success) {
                toast.success('Cancellation request sent')
            } else {
                toast.error('Failed to cancel job')
            }
        } catch (error) {
            toast.error('Error cancelling job')
        }
    }

    if (jobs.length === 0) return null

    return (
        <Card className="mb-6 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-black/20 shadow-xl rounded-2xl overflow-hidden transition-all duration-300">
            <CardHeader className="py-4 px-6 border-b border-white/10 bg-white/5 dark:bg-black/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center shadow-inner",
                            jobs.some(j => j.status === 'processing')
                                ? "bg-primary/20 text-primary animate-spin"
                                : "bg-muted/30 text-muted-foreground"
                        )}>
                            <Loader2 className="h-3.5 w-3.5" />
                        </div>
                        <CardTitle className="text-sm font-semibold">
                            Processing Documents
                            <span className="ml-2 font-normal text-muted-foreground text-xs">
                                ({jobs.filter(j => j.status === 'processing' || j.status === 'queued').length} active)
                            </span>
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="divide-y divide-white/10">
                    {jobs.map((job) => (
                        <div key={job.documentId} className="group p-4 hover:bg-white/5 dark:hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                {/* Icon Status */}
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-inner transition-all duration-300",
                                    job.status === 'failed' || job.status === 'cancelled'
                                        ? "bg-destructive/20 border-destructive/30 text-destructive-foreground shadow-destructive/20" :
                                        job.status === 'completed'
                                            ? "bg-green-500/20 border-green-500/30 text-green-500 shadow-green-500/20" :
                                            "bg-primary/10 border-white/20 text-primary"
                                )}>
                                    {job.status === 'failed' || job.status === 'cancelled' ? <XCircle className="h-4 w-4" /> :
                                        job.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                            <FileText className="h-4 w-4" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 grid gap-1.5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-sm font-medium truncate leading-none" title={job.documentName}>
                                            {job.documentName || 'Processing document...'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-sm",
                                                job.status === 'completed' ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                                                    job.status === 'failed' || job.status === 'cancelled' ? "bg-destructive/10 text-destructive" :
                                                        "bg-primary/10 text-primary"
                                            )}>
                                                {job.status === 'queued' ? 'Queued' :
                                                    job.status === 'failed' ? 'Failed' :
                                                        job.status === 'cancelled' ? 'Cancelled' :
                                                            job.status === 'completed' ? 'Done' :
                                                                `${Math.round(job.progress)}%`
                                                }
                                            </span>
                                            {(job.status === 'processing' || job.status === 'queued') && job.jobId && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleCancelJob(job.jobId!)}
                                                    title="Cancel Job"
                                                >
                                                    <Square className="h-3 w-3 fill-current" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Progress
                                            value={job.status === 'completed' ? 100 : job.progress}
                                            className={cn("h-1.5 flex-1", (job.status === 'failed' || job.status === 'cancelled') && "bg-destructive/20")}
                                            indicatorClassName={cn(
                                                job.status === 'completed' && "bg-green-500",
                                                (job.status === 'failed' || job.status === 'cancelled') && "bg-destructive"
                                            )}
                                        />
                                        {job.totalChunks > 0 && (
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap hidden sm:inline-block">
                                                {job.processedChunks}/{job.totalChunks} chunks
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {job.error && (
                                <div className="mt-2 text-xs text-destructive bg-destructive/5 p-2 rounded-md border border-destructive/10">
                                    {job.status === 'cancelled' ? 'Stopped by user' : `Error: ${job.error}`}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
