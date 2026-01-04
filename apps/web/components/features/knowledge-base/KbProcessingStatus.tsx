import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
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
        <Card className="mb-6 border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="py-3 px-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                        </div>
                        <CardTitle className="text-sm font-semibold">Processing Documents</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs font-normal bg-background/50">
                        {jobs.length} active
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                    {jobs.map((job) => (
                        <div key={job.documentId} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                        job.status === 'failed' ? "bg-destructive/10 text-destructive" :
                                            job.status === 'completed' ? "bg-green-500/10 text-green-500" :
                                                "bg-primary/10 text-primary"
                                    )}>
                                        {job.status === 'failed' ? <XCircle className="h-4 w-4" /> :
                                            job.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                                                <FileText className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {job.documentName || 'Processing document...'}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                            <span className="capitalize">{job.type || 'Embedding'}</span>
                                            <span>•</span>
                                            <span className={cn(
                                                "font-medium",
                                                job.status === 'processing' && "text-primary",
                                                job.status === 'failed' && "text-destructive",
                                                job.status === 'completed' && "text-green-500"
                                            )}>
                                                {job.status === 'queued' ? 'Queued' :
                                                    job.status === 'processing' ? `${job.progress}%` :
                                                        job.status}
                                            </span>
                                            {job.totalChunks > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span>{job.processedChunks}/{job.totalChunks} chunks</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {job.status === 'queued' && (
                                    <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
                                )}
                            </div>

                            {(job.status === 'processing' || job.status === 'queued') && (
                                <Progress
                                    value={job.progress}
                                    className="h-1.5"
                                />
                            )}

                            {job.error && (
                                <p className="text-xs text-destructive mt-2 bg-destructive/5 p-2 rounded-md">
                                    {job.error}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

