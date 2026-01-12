import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface SidebarDraggableItemProps {
    id: string;
    type: string;
    label: string;
}

export function SidebarDraggableItem({ id, type, label }: SidebarDraggableItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        data: {
            type: 'SIDEBAR_COMPONENT',
            componentType: type,
        },
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={cn(
                "p-3 border rounded-xl bg-card hover:border-primary/50 cursor-move text-[13px] font-medium flex items-center gap-3 transition-all shadow-sm group/item hover:shadow-md",
                isDragging && "opacity-90 ring-2 ring-primary border-primary scale-105 rotate-2 shadow-2xl z-50 bg-background"
            )}
        >
            <div className="p-1.5 bg-muted rounded-lg group-hover/item:bg-primary/10 transition-colors">
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground group-hover/item:text-primary" />
            </div>
            {label}
        </div>
    );
}
