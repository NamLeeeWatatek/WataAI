"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/Popover';
import { Input } from '@/components/ui/Input';
import { Tag as TagIcon, Search, X, Plus } from 'lucide-react';
import { Tag, TagSelectorProps } from '@/lib/types';
import { metadataApi } from '@/lib/api/metadata';

export function TagSelector({ selectedTags = [], onChange, maxTags = 5 }: TagSelectorProps) {
    const [tags, setTags] = useState<Tag[]>([]);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadTags = async () => {
            setLoading(true);
            try {
                const data = await metadataApi.getTags();
                setTags(data);
            } catch (err) {
                console.error('Failed to load tags:', err);
            } finally {
                setLoading(false);
            }
        };

        loadTags();
    }, []);

    const handleSelect = (tagId: number) => {
        if (selectedTags.includes(tagId)) return;
        if (selectedTags.length >= maxTags) return;
        onChange([...selectedTags, tagId]);
        setOpen(false);
        setSearch('');
    };

    const handleRemove = (tagId: number) => {
        onChange(selectedTags.filter(id => id !== tagId));
    };

    const availableTags = tags.filter(t => !selectedTags.includes(t.id));
    const filteredTags = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedTagObjects = selectedTags
        .map(id => tags.find(t => t.id === id))
        .filter((t): t is Tag => !!t);

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {selectedTagObjects.map(tag => (
                    <Badge
                        key={tag.id}
                        style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                            borderColor: tag.color
                        }}
                        className="border pr-1"
                    >
                        {tag.name}
                        <button
                            onClick={() => handleRemove(tag.id)}
                            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}

                {selectedTags.length < maxTags && (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-6 text-xs border-dashed">
                                <Plus className="w-3 h-3 mr-1" />
                                Add Tag
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[200px]" align="start">
                            <div className="p-2 border-b">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search tags..."
                                        className="h-7 text-xs pl-7 border-none shadow-none focus-visible:ring-0 bg-muted/50"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto p-1">
                                {loading ? (
                                    <p className="text-xs text-muted-foreground p-2 text-center">Loading...</p>
                                ) : filteredTags.length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-2 text-center">No tags found</p>
                                ) : (
                                    filteredTags.map(tag => (
                                        <button
                                            key={tag.id}
                                            onClick={() => handleSelect(tag.id)}
                                            className="w-full text-left px-2 py-1.5 hover:bg-muted rounded-sm text-xs flex items-center gap-2"
                                        >
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                                            {tag.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>
            {selectedTags.length >= maxTags && (
                <p className="text-[10px] text-muted-foreground">
                    Maximum {maxTags} tags reached
                </p>
            )}
        </div>
    );
}
