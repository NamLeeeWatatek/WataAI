'use client'

import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Edit2, Trash2, FileText, Edit, Zap, Code } from 'lucide-react'
import type { BotFunction, BotFunctionCardProps } from '@/lib/types'
import { Card } from '@/components/ui/Card'

const FUNCTION_ICONS: Record<string, any> = {
    document_access: FileText,
    auto_fill: Edit,
    ai_suggest: Zap,
    custom: Code,
}

const FUNCTION_COLORS: Record<string, string> = {
    document_access: 'bg-blue-500',
    auto_fill: 'bg-green-500',
    ai_suggest: 'bg-purple-500',
    custom: 'bg-orange-500',
}

export function BotFunctionCard({ botFunction, onEdit, onDelete }: BotFunctionCardProps) {
    const Icon = FUNCTION_ICONS[botFunction.functionType] || Code
    const colorClass = FUNCTION_COLORS[botFunction.functionType] || 'bg-gray-500'

    return (
        <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h4 className="font-semibold">{botFunction.name}</h4>
                        <Badge variant={botFunction.isEnabled ? 'default' : 'secondary'} className="mt-1">
                            {botFunction.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                    </div>
                </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                {botFunction.description || 'No description'}
            </p>

            <div className="flex items-center gap-2 pt-3 border-t border-border/40">
                <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        </Card>
    )
}

