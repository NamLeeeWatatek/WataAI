"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface BulkAction {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'ghost';
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
    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className={cn(
                        "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
                        "flex items-center gap-4 px-6 py-3",
                        "bg-background/80 backdrop-blur-md border border-border shadow-2xl rounded-full",
                        className
                    )}
                >
                    <div className="flex items-center gap-3 border-r border-border pr-4 mr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={onClearSelection}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                            <span className="tabular-nums font-bold text-primary">{selectedCount}</span>
                            <span className="ml-1 text-muted-foreground">selected</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={index}
                                    variant={action.variant || 'ghost'}
                                    size="sm"
                                    onClick={action.onClick}
                                    className={cn("gap-2 rounded-full px-4", action.className)}
                                >
                                    <Icon className="h-4 w-4" />
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
