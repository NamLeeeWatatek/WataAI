import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface SortableItemProps {
    id: string;
    data?: any;
    children: (props: {
        ref: (element: HTMLElement | null) => void;
        style: React.CSSProperties;
        attributes: any;
        listeners: any;
        isDragging: boolean;
    }) => React.ReactNode;
    className?: string;
    disabled?: boolean;
}

export function SortableItem({ id, children, disabled, data }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled, data });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return <>{children({ ref: setNodeRef, style, attributes, listeners, isDragging })}</>;
}
