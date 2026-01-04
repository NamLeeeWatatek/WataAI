import React from 'react'
import { Home } from 'lucide-react'
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
            <BreadcrumbList>
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
                            "flex items-center gap-1",
                            dragOverId === null && "text-primary font-bold"
                        )}
                        href="#"
                    >
                        <Home className="w-4 h-4" />
                        <span>{rootName}</span>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.id || index}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            {index === breadcrumbs.length - 1 ? (
                                <BreadcrumbPage
                                    className={cn(
                                        dragOverId === crumb.id && "text-primary font-bold"
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
                                        dragOverId === crumb.id && "text-primary font-bold"
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

