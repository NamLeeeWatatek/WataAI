'use client'

import React from 'react'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { MoreVertical, Edit, Trash2, Zap } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import type { Template } from '@/lib/types/template'
import { useRouter } from 'next/navigation'

interface TemplatesGridProps {
    templates: Template[]
    onEdit: (template: Template) => void
    onDelete: (templateId: string) => void
    loading?: boolean
    selectionMode?: boolean
    onTemplateSelect?: (template: Template) => void
}

const TemplatesGrid = React.memo<TemplatesGridProps>(({
    templates,
    onEdit,
    onDelete,
    loading = false,
    selectionMode = false,
    onTemplateSelect
}) => {
    const router = useRouter();

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (templates.length === 0) {
        return (
            <Card className="p-8 text-center bg-muted/20 border-dashed">
                <CardTitle className="mb-2">No Templates Found</CardTitle>
                <CardDescription>
                    Create your first template to get started with standardized UGC content creation.
                </CardDescription>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
                <Card
                    key={template.id}
                    className={`
                        group relative overflow-hidden transition-all duration-300 hover:shadow-lg
                        ${selectionMode ? 'cursor-pointer ring-2 ring-transparent hover:ring-primary' : ''}
                    `}
                    onClick={() => selectionMode && onTemplateSelect ? onTemplateSelect(template) : undefined}
                >
                    <div className="relative p-5 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                    {template.category && (
                                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                                            {template.category}
                                        </Badge>
                                    )}
                                    {template.mediaFiles && template.mediaFiles.length > 0 && (
                                        <Badge variant="secondary" className="text-[10px]">
                                            Media
                                        </Badge>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {template.name}
                                </h3>
                            </div>

                            {!selectionMode && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                        <DropdownMenuItem onClick={() => onEdit(template)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <div className="h-px bg-muted my-1" />
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/ugc-factory/create?templateId=${template.id}` as any)
                                            }}
                                            className="text-primary focus:text-primary font-medium"
                                        >
                                            <Zap className="w-4 h-4 mr-2 fill-current" />
                                            Use Template
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onDelete(template.id)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-6 flex-grow">
                                {template.description}
                            </p>
                        )}

                        <div className="mt-auto">
                            <div className="flex items-center justify-between gap-4">
                                <Button
                                    size="sm"
                                    className="flex-1 gap-2"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        router.push(`/ugc-factory/create?templateId=${template.id}` as any)
                                    }}
                                >
                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                    Create Content
                                </Button>

                                <div className="flex items-center text-xs text-muted-foreground" title={`Status: ${template.isActive ? 'Active' : 'Inactive'}`}>
                                    {template.isActive ? (
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-slate-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            ))
            }
        </div >
    )
})

TemplatesGrid.displayName = 'TemplatesGrid'

export { TemplatesGrid }
