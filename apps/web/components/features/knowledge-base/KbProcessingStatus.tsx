import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { Clock, Loader2 } from 'lucide-react'
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
}

export function KBProcessingStatus({ knowledgeBaseId }: KBProcessingStatusProps) {
    const [jobs, setJobs] = useState<ProcessingJob[]>([])

    useEffect(() => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
        const wsUrl = apiUrl.replace('/api/v1', '')

        const socket: Socket = io(wsUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        })

        socket.on('connect', () => {

        })

        socket.on('disconnect', () => {

        })

        socket.on('processing:update', (data: ProcessingJob) => {

            if (data.knowledgeBaseId !== knowledgeBaseId) return

            setJobs((prevJobs: ProcessingJob[]) => {
                if (data.status === 'completed' || data.status === 'failed') {
                    setTimeout(() => {
                        setJobs((prev: ProcessingJob[]) => prev.filter((j: ProcessingJob) => j.documentId !== data.documentId))
                    }, 2000)
                }

                const existingIndex = prevJobs.findIndex((j: ProcessingJob) => j.documentId === data.documentId)

                if (existingIndex >= 0) {
                    const updated = [...prevJobs]
                    updated[existingIndex] = data
                    return updated
                } else if (data.status === 'processing' || data.status === 'queued') {
                    return [...prevJobs, data]
                }

                return prevJobs
            })
        })

        socket.on('connect_error', (_error) => {

        })

        return () => {

            socket.disconnect()
        }
    }, [knowledgeBaseId])

    if (jobs.length === 0) return null

    return (
        <Card className="p-5 mb-6 bg-card/40 backdrop-blur-md border border-border/50 shadow-premium overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="relative space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm tracking-tight text-foreground">
                                Active Processing Queue
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                                {jobs.length} Object{jobs.length > 1 ? 's' : ''} in progress
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4">
                    {jobs.map((job: ProcessingJob) => (
                        <div key={job.documentId} className="space-y-2.5 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {job.status === 'queued' ? (
                                        <Badge variant="secondary" className="gap-1.5 h-6 bg-amber-500/10 text-amber-500 border-amber-500/20 font-black text-[9px] uppercase tracking-widest">
                                            <Clock className="w-3 h-3" />
                                            Queued
                                        </Badge>
                                    ) : (
                                        <Badge variant="default" className="gap-1.5 h-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-black text-[9px] uppercase tracking-widest">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            {job.type === 'crawl' ? 'Crawling' : 'Embedding'}
                                        </Badge>
                                    )}
                                    <span className="font-bold truncate text-foreground/80">
                                        {job.documentName || 'Processing object...'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {job.totalChunks > 0 && (
                                        <span className="text-[10px] font-mono font-bold text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
                                            {job.processedChunks}/{job.totalChunks}
                                        </span>
                                    )}
                                    <span className="font-black text-primary font-mono">{job.progress}%</span>
                                </div>
                            </div>
                            <Progress
                                value={job.progress}
                                className="h-2 bg-primary/5 rounded-full overflow-hidden"
                                indicatorClassName="bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}

