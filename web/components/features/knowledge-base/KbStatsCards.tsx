import { Card } from '@/components/ui/Card'
import { FileText, Database, Cpu, Settings } from 'lucide-react'
import type { KnowledgeBaseStats } from '@/lib/types/knowledge-base'
import { cn } from '@/lib/utils'

interface KBStatsCardsProps {
    stats: KnowledgeBaseStats
}

export function KBStatsCards({ stats }: KBStatsCardsProps) {
    const cards = [
        {
            label: 'Documents',
            value: stats.totalDocuments,
            icon: FileText,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
        },
        {
            label: 'Total Size',
            value: stats.totalSize,
            icon: Database,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            border: 'border-purple-500/20'
        },
        {
            label: 'Embedding Model',
            value: stats.embeddingModel,
            icon: Cpu,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            isSmall: true
        },
        {
            label: 'Chunk Size',
            value: stats.chunkSize,
            icon: Settings,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20'
        }
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, i) => (
                <Card
                    key={i}
                    className={cn(
                        "p-4 group relative overflow-hidden transition-all duration-300",
                        "bg-card/40 backdrop-blur-md border border-border/50",
                        "hover:bg-card/60"
                    )}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                            "group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                            card.bg, card.color
                        )}>
                            <card.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/70 mb-0.5">{card.label}</p>
                            <p className={cn(
                                "font-black tracking-tight transition-colors group-hover:text-foreground",
                                card.isSmall ? "text-sm truncate" : "text-2xl"
                            )} title={typeof card.value === 'string' ? card.value : undefined}>
                                {card.value}
                            </p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}

