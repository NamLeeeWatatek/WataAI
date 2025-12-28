import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FiRefreshCw, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import { toast } from 'sonner'
import axiosClient from '@/lib/axios-client'

interface SyncPanelProps {
    knowledgeBaseId: string
}

interface VerifyResult {
    totalChunks: number
    missingVectors: number
    failedEmbeddings: number
}

export function KBSyncPanel({ knowledgeBaseId }: SyncPanelProps) {
    const [verifying, setVerifying] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const [rebuilding, setRebuilding] = useState(false)
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)

    const handleVerify = async () => {
        setVerifying(true)
        try {
            const result = await axiosClient.get<VerifyResult>(`/knowledge-bases/${knowledgeBaseId}/verify-collection`) as unknown as VerifyResult
            setVerifyResult(result)

            if (result.missingVectors === 0 && result.failedEmbeddings === 0) {
                toast.success('Collection is healthy!')
            } else {
                toast.warning(`Found ${result.missingVectors} missing vectors and ${result.failedEmbeddings} failed embeddings`)
            }
        } catch {
            toast.error('Failed to verify collection')

        } finally {
            setVerifying(false)
        }
    }

    const handleSyncMissing = async () => {
        setSyncing(true)
        try {
            const result = await axiosClient.post<{ synced: number; errors: number }>(`/knowledge-bases/${knowledgeBaseId}/sync-missing`) as unknown as { synced: number; errors: number }

            toast.success(`Synced ${result.synced} vectors (${result.errors} errors)`)

            handleVerify()
        } catch {
            toast.error('Failed to sync missing vectors')

        } finally {
            setSyncing(false)
        }
    }

    const handleRebuild = async () => {
        if (!confirm('This will regenerate ALL embeddings. Continue?')) {
            return
        }

        setRebuilding(true)
        try {
            const result = await axiosClient.post<{ chunksProcessed: number; errors: number }>(`/knowledge-bases/${knowledgeBaseId}/rebuild-collection`) as unknown as { chunksProcessed: number; errors: number }

            toast.success(`Rebuilt ${result.chunksProcessed} chunks (${result.errors} errors)`)

            handleVerify()
        } catch {
            toast.error('Failed to rebuild collection')

        } finally {
            setRebuilding(false)
        }
    }

    const isHealthy = verifyResult && verifyResult.missingVectors === 0 && verifyResult.failedEmbeddings === 0

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Collection Sync</h3>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleVerify}
                        disabled={verifying}
                    >
                        {verifying ? (
                            <>
                                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            <>
                                <FiRefreshCw className="w-4 h-4 mr-2" />
                                Verify
                            </>
                        )}
                    </Button>
                </div>

                {verifyResult && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            {isHealthy ? (
                                <Badge variant="default" className="gap-1">
                                    <FiCheckCircle className="w-3 h-3" />
                                    Healthy
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="gap-1">
                                    <FiAlertTriangle className="w-3 h-3" />
                                    Issues Found
                                </Badge>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="p-2 bg-muted rounded">
                                <div className="text-muted-foreground text-xs">Total Chunks</div>
                                <div className="font-semibold">{verifyResult.totalChunks}</div>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <div className="text-muted-foreground text-xs">Missing</div>
                                <div className="font-semibold text-orange-600">
                                    {verifyResult.missingVectors}
                                </div>
                            </div>
                            <div className="p-2 bg-muted rounded">
                                <div className="text-muted-foreground text-xs">Failed</div>
                                <div className="font-semibold text-red-600">
                                    {verifyResult.failedEmbeddings}
                                </div>
                            </div>
                        </div>

                        {!isHealthy && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSyncMissing}
                                    disabled={syncing || rebuilding}
                                    className="flex-1"
                                >
                                    {syncing ? (
                                        <>
                                            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        'Sync Missing'
                                    )}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleRebuild}
                                    disabled={syncing || rebuilding}
                                    className="flex-1"
                                >
                                    {rebuilding ? (
                                        <>
                                            <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Rebuilding...
                                        </>
                                    ) : (
                                        'Rebuild All'
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="text-xs text-muted-foreground">
                    <p className="mb-1">Use this panel to:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Verify: Check collection health</li>
                        <li>Sync Missing: Fix missing/failed vectors</li>
                        <li>Rebuild All: Regenerate entire collection</li>
                    </ul>
                </div>
            </div>
        </Card>
    )
}
