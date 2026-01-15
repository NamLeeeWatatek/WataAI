import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Clock, CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { cn } from '@/lib/utils'

interface ProcessingJob {
    jobId?: string
    documentId: string
    documentName?: string
    knowledgeBaseId: string
    status: 'queued' | 'processing' | 'completed' | 'failed'
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

    useEffect(() => {
        // Use environment variable or default to same host
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        const wsUrl = apiUrl.replace('/api/v1', '')

        const socket: Socket = io(wsUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            path: '/socket.io/', // Ensure standard socket.io path
        })

        socket.on('connect', () => {
            console.log('Connected to processing updates')
        })

        socket.on('processing:update', (data: ProcessingJob) => {
            if (data.knowledgeBaseId !== knowledgeBaseId) return

            setJobs((prevJobs) => {
                // If job is completed/failed, remove it after delay
                if (data.status === 'completed' || data.status === 'failed') {
                    // Notify parent to refresh data immediately
                    if (data.status === 'completed' && onProcessingComplete) {
                        onProcessingComplete()
                    }

                    // Specific timeout to remove THIS specific job
                    setTimeout(() => {
                        setJobs(current => current.filter(j => j.documentId !== data.documentId))
                    }, 3000)
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
            socket.disconnect()
        }
    }, [knowledgeBaseId])

    if (jobs.length === 0) return null

    return (
        <Card className="mb-6 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden transition-all duration-300">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center",
                            jobs.some(j => j.status === 'processing') ? "bg-primary/10 text-primary animate-spin-slow" : "bg-muted text-muted-foreground"
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
            <CardContent className="p-0 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="divide-y divide-border/50">
                    {jobs.map((job) => (
                        <div key={job.documentId} className="group p-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                                {/* Icon Status */}
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm",
                                    job.status === 'failed' ? "bg-destructive/10 border-destructive/20 text-destructive" :
                                        job.status === 'completed' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                                            "bg-background border-border text-primary"
                                )}>
                                    {job.status === 'failed' ? <XCircle className="h-4 w-4" /> :
                                        job.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                            <FileText className="h-4 w-4" />}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 grid gap-1.5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="text-sm font-medium truncate leading-none" title={job.documentName}>
                                            {job.documentName || 'Processing document...'}
                                        </p>
                                        <span className={cn(
                                            "text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-sm",
                                            job.status === 'completed' ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                                                job.status === 'failed' ? "bg-destructive/10 text-destructive" :
                                                    "bg-primary/10 text-primary"
                                        )}>
                                            {job.status === 'queued' ? 'Queued' :
                                                job.status === 'failed' ? 'Failed' :
                                                    job.status === 'completed' ? 'Done' :
                                                        `${Math.round(job.progress)}%`
                                            }
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Progress
                                            value={job.status === 'completed' ? 100 : job.progress}
                                            className={cn("h-1.5 flex-1", job.status === 'failed' && "bg-destructive/20")}
                                            indicatorClassName={cn(
                                                job.status === 'completed' && "bg-green-500",
                                                job.status === 'failed' && "bg-destructive"
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
                                    Error: {job.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

