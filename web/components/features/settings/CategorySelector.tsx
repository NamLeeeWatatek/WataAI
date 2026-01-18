"use client";

import React, { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import {
  Folder,
  LayoutGrid,
  Settings,
  ShoppingCart,
  Briefcase,
  Book,
  Cpu,
  Database,
  Globe,
  Heart,
  Image as ImageIcon,
  Music,
  Video,
  Zap
} from 'lucide-react';
import { Category, CategorySelectorProps } from '@/lib/types';
import { metadataApi } from '@/lib/api/metadata';
import { Skeleton } from '@/components/ui/Skeleton';

// Map of allowed icons to ensure tree-shaking
const ICON_MAP: Record<string, any> = {
  Folder,
  LayoutGrid,
  Settings,
  ShoppingCart,
  Briefcase,
  Book,
  Cpu,
  Database,
  Globe,
  Heart,
  Image: ImageIcon,
  Music,
  Video,
  Zap
};

export function CategorySelector({
  entityType,
  value,
  onChange,
  placeholder = "Ch?n danh m?c"
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await metadataApi.getCategories(entityType);
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [entityType]);

  const selectedCategory = categories.find(c => c.id === value);

  if (loading) {
    return <div className="h-10 bg-muted animate-pulse rounded-md" />;
  }

  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(val ? parseInt(val) : undefined)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} aria-label={`Ch?n danh m?c${selectedCategory ? `: ${selectedCategory.name}` : ''}`}>
          {selectedCategory && (
            <div className="flex items-center gap-2">
              {(() => {
                const IconComponent = (selectedCategory.icon && ICON_MAP[selectedCategory.icon])
                  ? ICON_MAP[selectedCategory.icon]
                  : Folder;
                return (
                  <IconComponent
                    className="size-4"
                    style={{ color: selectedCategory.color }}
                  />
                );
              })()}
              <span>{selectedCategory.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => {
          const IconComponent = (category.icon && ICON_MAP[category.icon])
            ? ICON_MAP[category.icon]
            : Folder;

          return (
            <SelectItem key={category.id} value={category.id.toString()}>
              <div className="flex items-center gap-2">
                <IconComponent
                  className="size-4"
                  style={{ color: category.color }}
                />
                <span>{category.name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
