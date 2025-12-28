"use client";

import React, { useState, useEffect } from 'react';
import axiosClient from '@/lib/axios-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { IconPicker } from '@/components/ui/IconPicker';
import { CategoryDialogProps } from '@/lib/types';
import { Layout, Palette, Type, Hash, AlignLeft, Layers, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'
];

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  entityType,
  onSave
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState<string>('FiFolder');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSlug(category.slug);
      setIcon(category.icon || 'Folder');
      setColor(category.color);
      setDescription(category.description || '');
      setOrder(category.order);
    } else {
      setName('');
      setSlug('');
      setIcon('Folder');
      setColor('#6366f1');
      setDescription('');
      setOrder(0);
    }
  }, [category, open]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!category) {
      setSlug(value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name,
        slug,
        icon,
        color,
        description: description || undefined,
        entity_type: entityType,
        order
      };

      if (category) {
        await axiosClient.patch(`/metadata/categories/${category.id}`, data);
      } else {
        await axiosClient.post('/metadata/categories', data);
      }

      onSave();
    } catch {

      alert('Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-white/5 bg-background shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 border-b border-white/5">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner transform -rotate-3">
                <Layout className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">{category ? 'Modify Category' : 'Create Category'}</DialogTitle>
                <p className="text-sm font-medium opacity-70">Define organizational metadata for your workspace</p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Identity Label</Label>
              <Input
                id="name"
                rounded="xl"
                className="h-12 glass border-white/5 font-bold pl-4"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Core Protocols"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Cryptic Slug</Label>
              <Input
                id="slug"
                rounded="xl"
                className="h-12 glass border-white/5 font-mono font-bold text-sm pl-4"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. core-protocols"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Aesthetic Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Visual Signature</Label>
              <div className="flex flex-wrap gap-2.5 p-3 glass rounded-xl border border-white/5">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={cn(
                      "w-6 h-6 rounded-lg transition-all duration-300 ring-offset-2 ring-offset-background",
                      color === presetColor ? "ring-2 ring-primary scale-110 shadow-lg" : "hover:scale-110 opacity-80"
                    )}
                    style={{ backgroundColor: presetColor }}
                  />
                ))}
                <div className="w-px h-6 bg-white/5 mx-1" />
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-6 h-6 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Contextual Description</Label>
            <Textarea
              id="description"
              rounded="xl"
              className="glass border-white/5 font-bold"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide architectural context for this group..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Sequence Priority</Label>
            <Input
              id="order"
              type="number"
              rounded="xl"
              className="h-12 glass border-white/5 font-bold pl-4"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value))}
              min={0}
            />
          </div>

          <DialogFooter className="pt-6 flex gap-3">
            <Button
              type="button"
              variant="outline"
              rounded="xl"
              className="h-12 flex-1 font-black uppercase tracking-widest text-xs glass border-white/10"
              onClick={() => onOpenChange(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              rounded="xl"
              className="h-12 flex-[2] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Secure Settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

