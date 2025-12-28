import { FiChevronRight, FiHome } from 'react-icons/fi'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface Breadcrumb {
    id: string | null
    name: string
}

interface KBBreadcrumbsProps {
    rootName: string
    breadcrumbs: Breadcrumb[]
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
        <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
            <Button
                variant="ghost"
                onClick={() => onNavigate(-1)}
                onDragOver={handleDragOver}
                onDrop={(e: React.DragEvent) => {
                    e.preventDefault()
                    onDrop?.(null)
                }}
                className={cn(
                    "flex items-center gap-2 px-3 py-1.5 h-auto font-normal rounded-md transition-all",
                    "text-muted-foreground hover:text-foreground hover:bg-muted",
                    dragOverId === null && "bg-primary/10 ring-2 ring-primary"
                )}
            >
                <FiHome className="w-4 h-4 mr-2" />
                {rootName}
            </Button>
            {breadcrumbs.map((crumb, index) => (
                <div key={crumb.id || index} className="flex items-center gap-2">
                    <FiChevronRight className="w-4 h-4 text-muted-foreground" />
                    <Button
                        variant="ghost"
                        onClick={() => onNavigate(index)}
                        onDragOver={handleDragOver}
                        onDrop={(e: React.DragEvent) => {
                            e.preventDefault()
                            onDrop?.(crumb.id)
                        }}
                        className={cn(
                            "px-3 py-1.5 h-auto font-normal rounded-md transition-all",
                            "text-muted-foreground hover:text-foreground hover:bg-muted",
                            dragOverId === crumb.id && "bg-primary/10 ring-2 ring-primary"
                        )}
                    >
                        {crumb.name}
                    </Button>
                </div>
            ))}
        </div>
    )
}

