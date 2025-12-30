"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';

interface BulkAction {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'secondary';
    className?: string;
}

interface BulkActionsToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    actions: BulkAction[];
    className?: string;
}

export function BulkActionsToolbar({
    selectedCount,
    onClearSelection,
    actions,
    className
}: BulkActionsToolbarProps) {
    if (selectedCount === 0) return null;

    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
                        "flex items-center gap-1 p-1.5 pr-2",
                        "bg-foreground text-background shadow-2xl rounded-full",
                        "border border-border/50",
                        className
                    )}
                >
                    <div className="flex items-center gap-2 pl-2">
                        <Badge
                            variant="secondary"
                            className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[10px] bg-background text-foreground hover:bg-background/90"
                        >
                            {selectedCount}
                        </Badge>
                        <span className="text-xs font-medium mr-2 hidden sm:inline-block">Selected</span>
                        <Separator orientation="vertical" className="h-4 bg-background/20" />
                    </div>

                    <div className="flex items-center gap-0.5">
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={index}
                                    variant={action.variant || "ghost"}
                                    size="sm"
                                    onClick={action.onClick}
                                    className={cn(
                                        "h-8 px-3 rounded-full text-xs gap-2",
                                        action.variant === 'destructive'
                                            ? "text-destructive-foreground hover:bg-destructive/90"
                                            : "hover:bg-background/20 hover:text-background",
                                        action.className
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">{action.label}</span>
                                </Button>
                            );
                        })}

                        <Separator orientation="vertical" className="h-4 bg-background/20 mx-1" />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-background/20 hover:text-background"
                            onClick={onClearSelection}
                        >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Clear selection</span>
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
