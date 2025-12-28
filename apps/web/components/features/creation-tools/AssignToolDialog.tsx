'use client';

import { useState, useEffect } from 'react';
import { creationToolsApi } from '@/lib/api/creation-tools';
import { CreationTool } from '@/lib/api/creation-tools';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select';
import { Loader2 } from 'lucide-react';

interface AssignToolDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAssign: (toolId: string) => Promise<void>;
    count: number;
}

export function AssignToolDialog({
    open,
    onOpenChange,
    onAssign,
    count,
}: AssignToolDialogProps) {
    const [selectedToolId, setSelectedToolId] = useState<string>('');
    const [tools, setTools] = useState<CreationTool[]>([]);
    const [loadingTools, setLoadingTools] = useState(true);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (open) {
            loadTools();
            setSelectedToolId('');
        }
    }, [open]);

    const loadTools = async () => {
        try {
            setLoadingTools(true);
            const data = await creationToolsApi.getActive();
            setTools(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load tools:', error);
        } finally {
            setLoadingTools(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedToolId) return;

        setAssigning(true);
        try {
            await onAssign(selectedToolId);
            onOpenChange(false);
        } finally {
            setAssigning(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md gap-0 p-0 overflow-hidden bg-card border-border/50 shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl">Assign Creation Tool</DialogTitle>
                    <DialogDescription>
                        Assign {count} selected template{count !== 1 ? 's' : ''} to a specific creation tool.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <Select
                            value={selectedToolId}
                            onValueChange={setSelectedToolId}
                            disabled={loadingTools}
                        >
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder={loadingTools ? 'Loading tools...' : 'Select a tool to assign'} />
                            </SelectTrigger>
                            <SelectContent>
                                {tools.map((tool) => (
                                    <SelectItem key={tool.id} value={tool.id}>
                                        <div className="flex items-center gap-2">
                                            {tool.icon ? (
                                                <span className="text-lg">{tool.icon}</span>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-primary">{tool.name.substring(0, 1)}</span>
                                                </div>
                                            )}
                                            <span>{tool.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t border-border/50 bg-secondary/20">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={assigning}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={!selectedToolId || assigning}>
                        {assigning ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Assigning...
                            </>
                        ) : (
                            'Assign Tool'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
