"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import { IconPicker } from '@/components/ui/IconPicker'
import { FileText, Folder as FolderIcon, Edit3, Type, AlignLeft, Image as ImageIcon, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KBFolder, KBDocument } from '@/lib/types/knowledge-base'

interface KBItemEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: KBFolder | KBDocument | null
    type: 'folder' | 'document'
    onSubmit: (data: { name: string; description?: string; icon?: string }) => Promise<void>
}

export function KBItemEditDialog({
    open,
    onOpenChange,
    item,
    type,
    onSubmit,
}: KBItemEditDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [icon, setIcon] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (item) {
            setName(item.name)
            setDescription((item as any).description || '')
            setIcon((item as any).icon || (type === 'folder' ? 'Folder' : 'FileText'))
        } else {
            setName('')
            setDescription('')
            setIcon(type === 'folder' ? 'Folder' : 'FileText')
        }
    }, [item])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        try {
            setLoading(true)
            await onSubmit({
                name: name.trim(),
                description: description.trim(),
                icon: icon || undefined,
            })
            onOpenChange(false)
        } catch {

        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden border-white/5 bg-background shadow-2xl rounded-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 border-b border-white/5">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner transform -rotate-3">
                                <Edit3 className="w-8 h-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">
                                    Edit {type === 'folder' ? 'Structural Unit' : 'Data Artifact'}
                                </DialogTitle>
                                <p className="text-sm font-medium opacity-70">Update the metadata for this asset</p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Identity Label</Label>
                            <Input
                                id="name"
                                rounded="xl"
                                className="h-12 glass border-white/5 font-bold pl-4"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={`${type === 'folder' ? 'Folder' : 'Document'} name`}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Contextual Description</Label>
                            <Textarea
                                id="description"
                                rounded="xl"
                                className="glass border-white/5 font-bold"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Symbolic Representation</Label>
                            <IconPicker
                                value={icon}
                                onChange={setIcon}
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-8 flex gap-3">
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
                            {loading ? 'Synchronizing...' : 'Push Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

