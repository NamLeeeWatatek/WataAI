import React from 'react'
import { Home, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/Breadcrumb'

interface BreadcrumbData {
    id: string | null
    name: string
}

interface KBBreadcrumbsProps {
    rootName: string
    breadcrumbs: BreadcrumbData[]
    onNavigate: (index: number) => void
    onDrop?: (folderId: string | null) => void
    dragOverId?: string | null
}

export function KBBreadcrumbs({
    rootName,
    breadcrumbs,
    onNavigate,
    onDrop,
    dragOverId,
}: KBBreadcrumbsProps) {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    return (
        <Breadcrumb className="mb-6">
            <BreadcrumbList className="sm:gap-2">
                <BreadcrumbItem>
                    <BreadcrumbLink
                        onClick={(e) => {
                            e.preventDefault();
                            onNavigate(-1);
                        }}
                        onDragOver={handleDragOver}
                        onDrop={(e: React.DragEvent) => {
                            e.preventDefault()
                            onDrop?.(null)
                        }}
                        className={cn(
                            "flex items-center gap-1.5 cursor-pointer transition-all px-2 py-1 rounded-md",
                            "hover:bg-muted hover:text-foreground",
                            dragOverId === null && "bg-primary/20 ring-1 ring-primary text-primary font-bold shadow-sm"
                        )}
                        href="#"
                    >
                        <Home className="w-4 h-4" />
                        <span className="font-semibold">{rootName}</span>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id || index}>
                        <BreadcrumbSeparator>
                            <ChevronRight className="w-4 h-4 opacity-50" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            {index === breadcrumbs.length - 1 ? (
                                <BreadcrumbPage
                                    className={cn(
                                        "font-bold text-foreground px-2 py-1 rounded-md transition-all",
                                        dragOverId === crumb.id && "bg-primary/20 ring-1 ring-primary text-primary shadow-sm"
                                    )}
                                    onDragOver={handleDragOver}
                                    onDrop={(e: React.DragEvent) => {
                                        e.preventDefault()
                                        onDrop?.(crumb.id)
                                    }}
                                >
                                    {crumb.name}
                                </BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onNavigate(index);
                                    }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e: React.DragEvent) => {
                                        e.preventDefault()
                                        onDrop?.(crumb.id)
                                    }}
                                    className={cn(
                                        "cursor-pointer transition-all px-2 py-1 rounded-md",
                                        "hover:bg-muted hover:text-foreground",
                                        dragOverId === crumb.id && "bg-primary/20 ring-1 ring-primary text-primary font-bold shadow-sm"
                                    )}
                                    href="#"
                                >
                                    {crumb.name}
                                </BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

