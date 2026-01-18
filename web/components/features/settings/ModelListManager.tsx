'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Search, X, Filter, ChevronDown, ListFilter } from 'lucide-react';
import { AiModel, AiModelType } from '@/lib/types/ai-provider';
import { cn } from '@/lib/utils';

interface ModelListManagerProps {
    modelNames: string[];
    onRemoveModel: (name: string) => void;
    persistedModels: AiModel[];
    className?: string;
}

export function ModelListManager({
    modelNames,
    onRemoveModel,
    persistedModels,
    className
}: ModelListManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [displayCount, setDisplayCount] = useState(40);

    const getModelLabel = (name: string) => {
        const pModel = persistedModels.find(m => m.name === name);
        return pModel?.displayName || name;
    }

    const getModelType = (name: string): AiModelType => {
        const pModel = persistedModels.find(m => m.name === name);
        if (pModel?.type) return pModel.type;

        // Heuristic if metadata not available
        const lowerName = name.toLowerCase();
        if (lowerName.includes('embed')) return AiModelType.EMBEDDING;
        if (lowerName.includes('vision')) return AiModelType.VISION;
        return AiModelType.CHAT;
    }

    const filteredModels = useMemo(() => {
        return modelNames.filter(name => {
            const label = getModelLabel(name).toLowerCase();
            const matchesSearch = label.includes(searchTerm.toLowerCase()) || name.toLowerCase().includes(searchTerm.toLowerCase());

            if (typeFilter === 'all') return matchesSearch;

            const type = getModelType(name);
            return matchesSearch && type === typeFilter;
        });
    }, [modelNames, searchTerm, typeFilter, persistedModels]);

    const visibleModels = filteredModels.slice(0, displayCount);
    const hasMore = filteredModels.length > displayCount;

    return (
        <div className={cn("space-y-5", className)}>
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform duration-300 group-focus-within:scale-110">
                        <Search className="size-4 text-muted-foreground group-focus-within:text-primary" />
                    </div>
                    <Input
                        placeholder="Search neural models..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-10 bg-muted/20 border-muted-foreground/10 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all rounded-xl"
                    />
                </div>
                <Tabs value={typeFilter} onValueChange={setTypeFilter} className="w-auto">
                    <TabsList className="h-10 p-1 bg-muted/30 backdrop-blur-sm border border-muted-foreground/10 rounded-xl">
                        <TabsTrigger value="all" className="text-xs px-4 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <ListFilter className="size-3 mr-2 opacity-50" />
                            All
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="text-xs px-4 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Chat
                        </TabsTrigger>
                        <TabsTrigger value="embedding" className="text-xs px-4 h-8 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Embed
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="relative group/list">
                <ScrollArea className="h-[250px] w-full rounded-2xl border border-muted-foreground/10 bg-muted/5 backdrop-blur-subtle p-5 transition-all group-hover/list:bg-muted/10 group-hover/list:border-primary/20">
                    <div className="flex flex-wrap gap-2.5">
                        {visibleModels.length > 0 ? (
                            visibleModels.map((model) => {
                                const type = getModelType(model);
                                return (
                                    <Badge
                                        key={model}
                                        variant="secondary"
                                        className={cn(
                                            "group/badge h-7 pl-3 pr-1 transition-all duration-300 rounded-full border border-transparent hover:scale-[1.03] active:scale-95",
                                            type === AiModelType.EMBEDDING
                                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                : "bg-primary/10 text-primary border-primary/10",
                                            "hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] cursor-default"
                                        )}
                                    >
                                        <span className="max-w-[160px] truncate text-[11px] font-medium tracking-tight">
                                            {getModelLabel(model)}
                                        </span>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveModel(model);
                                            }}
                                            className="ml-1.5 size-5 rounded-full bg-foreground/5 flex items-center justify-center opacity-70 hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground transition-all cursor-pointer"
                                        >
                                            <X className="size-3" />
                                        </div>
                                    </Badge>
                                );
                            })
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center py-12 text-muted-foreground gap-3 animate-in fade-in zoom-in-95 duration-500">
                                <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center border border-dashed text-muted-foreground/30">
                                    <Search className="size-6" />
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest opacity-40">Zero Models Detected</p>
                                    <p className="text-[10px] italic opacity-50">Try adjusting your filters or search term</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {hasMore && (
                        <div className="mt-8 mb-4 flex justify-center sticky bottom-0">
                            <Button
                                type="button"
                                variant="glass"
                                size="sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDisplayCount(prev => prev + 60);
                                }}
                                className="text-[9px] font-black uppercase tracking-[0.2em] h-9 px-6 rounded-full border-primary/20 text-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                <ChevronDown className="mr-2 size-3 animate-bounce" />
                                Expand Neural Catalog ({filteredModels.length - displayCount} more)
                            </Button>
                        </div>
                    )}
                </ScrollArea>
                <div className="absolute -bottom-2.5 -right-2.5 px-3 py-1 bg-background/80 backdrop-blur-md border border-primary/20 rounded-full text-[9px] font-black text-primary shadow-lg z-10">
                    <span className="opacity-50 tracking-tighter mr-1">ACTIVE:</span>
                    {filteredModels.length}
                    <span className="mx-1 opacity-20">/</span>
                    <span className="opacity-40">{modelNames.length}</span>
                </div>
            </div>
        </div>
    );
}
