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
import { TagDialogProps } from '@/lib/types';

const PRESET_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1'
];

export function TagDialog({ open, onOpenChange, tag, onSave }: TagDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
      setDescription(tag.description || '');
    } else {
      setName('');
      setColor('#6366f1');
      setDescription('');
    }
  }, [tag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = { name, color, description: description || undefined };

      if (tag) {
        await axiosClient.patch(`/metadata/tags/${tag.id}`, data);
      } else {
        await axiosClient.post('/metadata/tags', data);
      }

      onSave();
    } catch {

      alert('Failed to save tag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Popular"
              required
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === presetColor ? 'border-white scale-110' : 'border-transparent'
                    }`}
                  style={{ backgroundColor: presetColor }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this tag"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

