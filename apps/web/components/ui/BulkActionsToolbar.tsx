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
                        "flex items-center gap-2 p-2",
                        "bg-slate-900 text-white border border-slate-800 shadow-2xl rounded-2xl md:rounded-full",
                        className
                    )}
                >
                    <div className="flex items-center gap-3 border-r border-slate-800 pr-4 pl-2 mr-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
                            onClick={onClearSelection}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center text-sm font-bold whitespace-nowrap">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-[10px] mr-2 shrink-0">
                                {selectedCount}
                            </span>
                            <span>Selected</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-1">
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={index}
                                    variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
                                    size="sm"
                                    onClick={action.onClick}
                                    className={cn(
                                        "flex items-center gap-2 rounded-xl px-4 h-9 text-xs font-bold transition-all active:scale-95",
                                        action.variant !== 'destructive' && "hover:bg-white/10 text-slate-300 hover:text-white",
                                        action.className
                                    )}
                                >
                                    <Icon className="h-3.5 w-3.5 opacity-70 shrink-0" />
                                    <span className="leading-none">{action.label}</span>
                                </Button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
