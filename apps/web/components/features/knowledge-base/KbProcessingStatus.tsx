import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { FiClock, FiLoader } from 'react-icons/fi'
import { io, Socket } from 'socket.io-client'

interface ProcessingJob {
    jobId?: string
    documentId: string
    documentName?: string
    knowledgeBaseId: string
    status: 'queued' | 'processing' | 'completed' | 'failed'
    progress: number
    totalChunks: number
    processedChunks: number
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

            setJobs(prevJobs => {
                if (data.status === 'completed' || data.status === 'failed') {
                    setTimeout(() => {
                        setJobs(prev => prev.filter(j => j.documentId !== data.documentId))
                    }, 2000)
                }

                const existingIndex = prevJobs.findIndex(j => j.documentId === data.documentId)

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
        <Card className="p-4 mb-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <FiLoader className="w-4 h-4 animate-spin text-blue-600" />
                    <h4 className="font-medium text-sm">
                        Processing {jobs.length} document{jobs.length > 1 ? 's' : ''}
                    </h4>
                </div>

                {jobs.map(job => (
                    <div key={job.documentId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                {job.status === 'queued' && (
                                    <Badge variant="secondary" className="gap-1 shrink-0">
                                        <FiClock className="w-3 h-3" />
                                        Queued
                                    </Badge>
                                )}
                                {job.status === 'processing' && (
                                    <Badge variant="default" className="gap-1 shrink-0">
                                        <FiLoader className="w-3 h-3 animate-spin" />
                                        Processing
                                    </Badge>
                                )}
                                <span className="text-muted-foreground truncate">
                                    {job.documentName || 'Document'}
                                </span>
                                {job.totalChunks > 0 && (
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {job.processedChunks}/{job.totalChunks}
                                    </span>
                                )}
                            </div>
                            <span className="font-medium shrink-0 ml-2">{job.progress}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                    </div>
                ))}
            </div>
        </Card>
    )
}

