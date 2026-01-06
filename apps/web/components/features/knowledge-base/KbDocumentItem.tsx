import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FiFileText, FiTrash2, FiCheckCircle, FiClock, FiAlertCircle, FiCircle } from 'react-icons/fi'
import type { KBDocument } from '@/lib/types/knowledge-base'

interface KBDocumentItemProps {
    document: KBDocument
    onDelete: (documentId: string) => void
}

export function KBDocumentItem({ document, onDelete }: KBDocumentItemProps) {
    const formatFileSize = (bytes: string | number) => {
        const size = typeof bytes === 'string' ? parseInt(bytes) : bytes
        if (!size || size === 0) return ''
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(size) / Math.log(k))
        return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getDisplayName = (status: string) => {
        switch (status) {
            case 'completed': return 'Ready';
            default: return undefined;
        }
    }

    return (
        <Card className="p-4 hover:bg-accent/50 transition-colors group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <FiFileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-medium">{document.metadata?.originalName || document.name || document.title}</h4>
                            <StatusBadge
                                status={document.processingStatus || 'pending'}
                                label={getDisplayName(document.processingStatus)}
                                showIcon={document.processingStatus === 'processing'}
                            />
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{document.fileType || document.type || 'document'}</span>
                            {document.sourceUrl && (
                                <>
                                    <FiCircle className="w-1 h-1 fill-current" />
                                    <span className="truncate max-w-xs" title={document.sourceUrl}>
                                        {new URL(document.sourceUrl).hostname}
                                    </span>
                                </>
                            )}
                            {document.fileSize && (
                                <>
                                    <FiCircle className="w-1 h-1 fill-current" />
                                    <span>{formatFileSize(document.fileSize)}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(document.id)}
                    >
                        <FiTrash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </Card>
    )
}
