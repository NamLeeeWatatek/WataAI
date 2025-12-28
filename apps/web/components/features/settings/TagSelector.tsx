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
import { FiTag, FiSearch, FiX } from 'react-icons/fi';
import { Tag, TagSelectorProps } from '@/lib/types';
import { metadataApi } from '@/lib/api/metadata';

export function TagSelector({ selectedTags, onChange, maxTags = 5 }: TagSelectorProps) {
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
        setTags([]);
      } finally {
        setLoading(false);
      }
    };

    loadTags();
  }, []);

  const selectedTagObjects = tags.filter(t => selectedTags.includes(t.id));
  const availableTags = tags.filter(t => !selectedTags.includes(t.id));

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemove = (tagId: number) => {
    onChange(selectedTags.filter(id => id !== tagId));
  };

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
              className="ml-1 hover:bg-black/10 rounded-full p-0.5"
            >
              <FiX className="size-3" />
            </button>
          </Badge>
        ))}

        {selectedTags.length < maxTags && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-6"
                aria-label={`Thêm tag (${maxTags - selectedTags.length} tag còn l?i)`}
              >
                <FiTag className="size-3 mr-1" aria-hidden="true" />
                Add Tag
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground size-3" />
                  <Input
                    placeholder="Search tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => {
                        handleToggle(tag.id);
                        setOpen(false);
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    >
                      <Badge
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color,
                          borderColor: tag.color
                        }}
                        className="border text-xs"
                      >
                        {tag.name}
                      </Badge>
                    </button>
                  ))}

                  {filteredTags.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No tags found
                    </p>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {selectedTags.length >= maxTags && (
        <p className="text-xs text-muted-foreground">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
}
