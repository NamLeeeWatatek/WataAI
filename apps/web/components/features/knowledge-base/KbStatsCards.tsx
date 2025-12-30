import { Card } from '@/components/ui/Card'
import { FileText, Database, Cpu, Settings } from 'lucide-react'
import type { KnowledgeBaseStats } from '@/lib/types/knowledge-base'

interface KBStatsCardsProps {
    stats: KnowledgeBaseStats
}

export function KBStatsCards({ stats }: KBStatsCardsProps) {
    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <Card variant="premium" className="p-4 group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Documents</p>
                        <p className="text-xl font-black">{stats.totalDocuments}</p>
                    </div>
                </div>
            </Card>
            <Card variant="premium" className="p-4 group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Database className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Size</p>
                        <p className="text-xl font-black">{stats.totalSize}</p>
                    </div>
                </div>
            </Card>
            <Card variant="premium" className="p-4 group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Embedding Model</p>
                        <p className="text-sm font-bold truncate max-w-[120px]">{stats.embeddingModel}</p>
                    </div>
                </div>
            </Card>
            <Card variant="premium" className="p-4 group">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Chunk Size</p>
                        <p className="text-xl font-black">{stats.chunkSize}</p>
                    </div>
                </div>
            </Card>
        </div>
    )
}

