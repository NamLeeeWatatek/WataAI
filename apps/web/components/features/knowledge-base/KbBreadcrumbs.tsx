"use client"

import React from 'react'
import { ChevronRight, Home, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KbBreadcrumbItem {
    id: string | null
    name: string
}

interface KbBreadcrumbsProps {
    breadcrumbs: KbBreadcrumbItem[]
    onNavigate: (id: string | null) => void
    className?: string
}

export function KbBreadcrumbs({ breadcrumbs, onNavigate, className }: KbBreadcrumbsProps) {
    return (
        <nav className={cn("flex items-center gap-1 text-sm text-muted-foreground mb-4", className)}>
            <button
                onClick={() => onNavigate(null)}
                className="flex items-center gap-1.5 hover:text-primary transition-colors font-semibold"
            >
                <Home className="w-3.5 h-3.5" />
                <span>Root</span>
            </button>

            {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.id || index}>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                    <button
                        onClick={() => onNavigate(crumb.id)}
                        className={cn(
                            "flex items-center gap-1.5 transition-colors font-semibold truncate max-w-[150px]",
                            index === breadcrumbs.length - 1
                                ? "text-foreground cursor-default"
                                : "hover:text-primary"
                        )}
                        disabled={index === breadcrumbs.length - 1}
                    >
                        {index !== breadcrumbs.length - 1 && <Folder className="w-3.5 h-3.5 opacity-60" />}
                        <span>{crumb.name}</span>
                    </button>
                </React.Fragment>
            ))}
        </nav>
    )
}
