import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Search, MessageSquare } from 'lucide-react'
import type { QueryResult } from '@/lib/types/knowledge-base'

interface KBQueryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onQuery: (query: string) => Promise<QueryResult[]>
}

export function KBQueryDialog({ open, onOpenChange, onQuery }: KBQueryDialogProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<QueryResult[]>([])
    const [searching, setSearching] = useState(false)

    const handleQuery = async () => {
        if (!query.trim()) return

        setSearching(true)
        try {
            const data = await onQuery(query)
            setResults(data)
        } finally {
            setSearching(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Query Knowledge Base</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 flex-1 overflow-auto">
                    <div className="flex gap-2">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ask a question..."
                            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                        />
                        <Button onClick={handleQuery} loading={searching}>
                            <Search className="w-4 h-4" />
                        </Button>
                    </div>

                    {results.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">
                                Found {results.length} relevant chunks
                            </h4>
                            {results.map((result, index) => (
                                <Card key={index} className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <Badge variant="secondary">Score: {(result.score * 100).toFixed(1)}%</Badge>
                                        {result.metadata?.documentName && (
                                            <span className="text-xs text-muted-foreground">
                                                {result.metadata.documentName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{result.content}</p>
                                </Card>
                            ))}
                        </div>
                    )}

                    {query && !searching && results.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No results found. Try a different query.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
