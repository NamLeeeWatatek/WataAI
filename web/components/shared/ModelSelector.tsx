'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/Popover';
import axiosClient from '@/lib/axios-client';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface ModelSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    configId?: string;
    disabled?: boolean;
    placeholder?: string;
}

export function ModelSelector({
    value,
    onValueChange,
    configId,
    disabled = false,
    placeholder = "Select model...",
}: ModelSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [models, setModels] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(false);
    const debouncedSearch = useDebounce(search, 300);

    const loadModels = React.useCallback(async (searchTerm: string) => {
        if (!configId) return;
        setLoading(true);
        try {
            const response = await axiosClient.get('/ai-providers/models', {
                params: {
                    limit: 50,
                    filters: JSON.stringify({
                        configId,
                        search: searchTerm,
                    }),
                },
            });

            const result = (response as any).data || response;
            const data = Array.isArray(result) ? result : (result.data || []);
            setModels(data.map((m: any) => m.name));
        } catch (error) {
            console.error('Failed to load models:', error);
        } finally {
            setLoading(false);
        }
    }, [configId]);

    React.useEffect(() => {
        if (open && configId) {
            loadModels(debouncedSearch);
        }
    }, [open, configId, debouncedSearch, loadModels]);

    React.useEffect(() => {
        if (value && models.length === 0 && !loading) {
            setModels([value]);
        }
    }, [value, models.length, loading]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between font-mono text-xs h-10 bg-background/50"
                >
                    {value || placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <div className="flex items-center border-b px-3 bg-muted/20">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search models..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                </div>
                <ScrollArea className="h-[300px]">
                    <div className="p-1">
                        {models.length === 0 && !loading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No models found.
                            </div>
                        )}
                        {models.map((model) => (
                            <button
                                key={model}
                                onClick={() => {
                                    onValueChange(model);
                                    setOpen(false);
                                }}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 font-mono text-xs",
                                    value === model && "bg-accent text-accent-foreground"
                                )}
                            >
                                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                    {value === model && <Check className="h-4 w-4" />}
                                </span>
                                {model}
                            </button>
                        ))}
                    </div>
                </ScrollArea>
                {configId && (
                    <div className="p-2 border-t bg-muted/10">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full text-[10px] h-7 font-bold uppercase tracking-wider"
                            onClick={() => loadModels(search)}
                        >
                            <Loader2 className={cn("w-3 h-3 mr-2", loading && "animate-spin")} />
                            Refresh Model List
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
