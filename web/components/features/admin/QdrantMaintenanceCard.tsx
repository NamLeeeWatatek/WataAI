'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Database, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { clearAllVectors } from '@/lib/api/knowledge-base';
import { toast } from 'sonner';

export function QdrantMaintenanceCard() {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClearAll = async () => {
        setIsLoading(true);
        try {
            const result = await clearAllVectors();
            if (result.success) {
                toast.success(`Success: Deleted ${result.deleted.length} vector collections`);
            } else {
                toast.error(`Error: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Failed to clear vectors');
        } finally {
            setIsLoading(false);
            setIsConfirmOpen(false);
        }
    };

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">System Maintenance</h2>
            </div>

            <Card className="border-destructive/20 bg-destructive/5 overflow-hidden">
                <CardHeader className="border-b border-destructive/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                            <Database className="w-5 h-5" />
                        </div>
                        <div>
                            <CardTitle className="text-destructive">Qdrant Vector Database</CardTitle>
                            <CardDescription>Emergency maintenance and data cleanup tools</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-bold">
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                <span>Destructive Action</span>
                            </div>
                            <p className="text-xs text-muted-foreground max-w-md">
                                Clearing all collections will permanently delete all indexed vectors across all knowledge bases.
                                Documents will need to be re-processed to generate new embeddings.
                            </p>
                        </div>

                        <Button
                            variant="destructive"
                            className="gap-2 shrink-0 transition-transform active:scale-95 shadow-lg shadow-destructive/20"
                            onClick={() => setIsConfirmOpen(true)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            Clear All Collections
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AlertDialogConfirm
                open={isConfirmOpen}
                onOpenChange={setIsConfirmOpen}
                title="Are you absolutely sure?"
                description={
                    <div className="space-y-3 pt-2 text-left">
                        <p>This action will <span className="font-bold text-destructive underline">DELETE ALL</span> indexed vectors and collections in Qdrant.</p>
                        <p className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
                            Warning: This cannot be undone. All knowledge base documents will require re-embedding to search again.
                        </p>
                    </div>
                }
                confirmText="Yes, delete everything"
                cancelText="Keep my data"
                variant="destructive"
                onConfirm={handleClearAll}
            />
        </section>
    );
}
