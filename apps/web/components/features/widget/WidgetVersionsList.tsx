'use client';

import { useState } from 'react';
import {
    CheckCircle2,
    Clock,
    Archive,
    Edit,
    Trash2,
    Rocket,
    RotateCcw,
    Eye,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

import { Textarea } from '@/components/ui/Textarea';
import { useWidgetVersionActions } from '@/lib/hooks/use-widget-versions';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/AlertDialog';
import { Badge } from '@/components/ui/Badge';

interface Version {
    id: string;
    version: string;
    status: 'draft' | 'published' | 'archived';
    isActive: boolean;
    publishedAt?: string;
    changelog?: string;
    createdAt: string;
}

interface Props {
    botId: string;
    versions?: Version[];
    isLoading: boolean;
    onRefresh: () => void;
}

export function WidgetVersionsList({ botId, versions, isLoading, onRefresh }: Props) {
    const [rollbackVersion, setRollbackVersion] = useState<Version | null>(null);
    const [rollbackReason, setRollbackReason] = useState('');
    const [deleteVersion, setDeleteVersion] = useState<Version | null>(null);

    const {
        publishVersion,
        rollbackVersion: doRollback,
        archiveVersion,
        deleteVersion: doDelete,
        isSubmitting,
    } = useWidgetVersionActions(botId);

    const handlePublish = async (versionId: string) => {
        try {
            await publishVersion(versionId);
            onRefresh();
        } catch {
        }
    };

    const handleRollback = async () => {
        if (!rollbackVersion || !rollbackReason.trim()) {
            toast.error('Please provide a rollback reason');
            return;
        }

        try {
            await doRollback(rollbackVersion.id, rollbackReason);
            setRollbackVersion(null);
            setRollbackReason('');
            onRefresh();
        } catch {
        }
    };

    const handleArchive = async (versionId: string) => {
        try {
            await archiveVersion(versionId);
            onRefresh();
        } catch {
        }
    };

    const handleDelete = async () => {
        if (!deleteVersion) return;

        try {
            await doDelete(deleteVersion.id);
            setDeleteVersion(null);
            onRefresh();
        } catch {
        }
    };

    const getStatusBadge = (version: Version) => {
        const badgeBase = "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5 border transition-all duration-300";

        if (version.isActive) {
            return (
                <div className={cn(badgeBase, "bg-green-500/10 text-green-600 border-green-500/20")}>
                    <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live Protocol
                </div>
            );
        }
        if (version.status === 'draft') {
            return (
                <div className={cn(badgeBase, "bg-blue-500/10 text-blue-600 border-blue-500/20")}>
                    <Clock className="w-3 h-3" />
                    Draft State
                </div>
            );
        }
        if (version.status === 'archived') {
            return (
                <div className={cn(badgeBase, "bg-muted text-muted-foreground border-border/40")}>
                    <Archive className="w-3 h-3" />
                    Archived
                </div>
            );
        }
        return (
            <div className={cn(badgeBase, "bg-primary/10 text-primary border-primary/20")}>
                <Rocket className="w-3 h-3" />
                Published
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse border border-border/40 shadow-xl bg-card/40 rounded-3xl overflow-hidden">
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                <div className="h-8 w-1/4 bg-muted rounded-xl" />
                                <div className="h-4 w-1/2 bg-muted/50 rounded-lg" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!versions || versions.length === 0) {
        return (
            <Card className="border border-dashed border-border/60 bg-muted/5 rounded-[2.5rem]">
                <CardContent className="p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <Archive className="w-8 h-8 text-primary/60" />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight mb-2">Matrix Empty</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium max-w-xs mx-auto">
                        No historical versions found in the archives. Publish your current configuration to initialize tracking.
                    </CardDescription>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {versions.map((version) => (
                    <Card
                        key={version.id}
                        className={cn(
                            "relative overflow-hidden border transition-all duration-500 group rounded-[2rem] shadow-xl",
                            version.isActive
                                ? "border-primary/40 bg-primary/[0.03] shadow-primary/10 scale-[1.02]"
                                : "border-border/40 bg-card/40 backdrop-blur-md hover:border-primary/20 hover:shadow-2xl"
                        )}
                    >
                        {version.isActive && (
                            <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                        )}
                        <CardHeader className="p-8 pb-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <CardTitle className="text-2xl font-black tracking-tighter">
                                            Version <span className="text-primary font-mono">{version.version}</span>
                                        </CardTitle>
                                        {getStatusBadge(version)}
                                    </div>
                                    {version.changelog ? (
                                        <p className="text-sm font-medium text-muted-foreground/80 leading-relaxed max-w-2xl px-1">
                                            {version.changelog}
                                        </p>
                                    ) : (
                                        <p className="text-xs font-bold text-muted-foreground/30 uppercase tracking-widest pl-1 italic">
                                            No manifest provided
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-10 rounded-xl bg-background/50 hover:bg-background border-border/40 font-bold active:scale-95 transition-all"
                                        onClick={() => {
                                            window.location.href = `/bots/${botId}/widget/${version.id}`;
                                        }}
                                    >
                                        {version.status === 'draft' ? (
                                            <>
                                                <Edit className="w-4 h-4 mr-2 text-primary/60" />
                                                Edit Script
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-2 text-primary/60" />
                                                Review
                                            </>
                                        )}
                                    </Button>

                                    {version.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            className="h-10 rounded-xl font-black bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-all text-xs uppercase tracking-widest px-4"
                                            onClick={() => handlePublish(version.id)}
                                            disabled={isSubmitting}
                                        >
                                            <Rocket className="w-4 h-4 mr-2" />
                                            Activate
                                        </Button>
                                    )}

                                    {version.status === 'published' && !version.isActive && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-10 rounded-xl border-orange-500/20 bg-orange-500/5 text-orange-600 hover:bg-orange-500/10 font-black active:scale-95 transition-all text-xs"
                                            onClick={() => setRollbackVersion(version)}
                                            disabled={isSubmitting}
                                        >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Revert To
                                        </Button>
                                    )}

                                    {version.status === 'published' && !version.isActive && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-muted"
                                            onClick={() => handleArchive(version.id)}
                                            disabled={isSubmitting}
                                        >
                                            <Archive className="w-4 h-4" />
                                        </Button>
                                    )}

                                    {version.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setDeleteVersion(version)}
                                            disabled={isSubmitting}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 pt-2">
                            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/10">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                                    <Clock className="size-3" />
                                    Initialized {formatRelativeTime(version.createdAt)}
                                </div>
                                {version.publishedAt && (
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                                        <Rocket className="size-3" />
                                        Deployed {formatRelativeTime(version.publishedAt)}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <AlertDialog
                open={!!rollbackVersion}
                onOpenChange={(open) => {
                    if (!open) {
                        setRollbackVersion(null);
                        setRollbackReason('');
                    }
                }}
            >
                <AlertDialogContent className="rounded-[2.5rem] border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                <RotateCcw className="size-6 text-orange-500" />
                            </div>
                            Protocol Reversion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-medium text-muted-foreground py-2">
                            You are about to deactivate the current live protocol and revert to <span className="text-foreground font-black">v{rollbackVersion?.version}</span>. This change will be immediate.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="space-y-3 py-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Reversion Justification</label>
                        <Textarea
                            placeholder="Describe the reason for this reversion..."
                            value={rollbackReason}
                            onChange={(e) => setRollbackReason(e.target.value)}
                            rows={3}
                            className="rounded-2xl border-border/40 bg-muted/20 focus:bg-background transition-all font-medium p-4 resize-none"
                        />
                    </div>

                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="rounded-2xl h-12 font-bold px-8 active:scale-95 transition-all">Abort</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRollback}
                            disabled={!rollbackReason.trim() || isSubmitting}
                            className="rounded-2xl h-12 font-black bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/20 active:scale-95 transition-all px-8 border-none"
                        >
                            {isSubmitting ? 'Processing...' : 'Execute Reversion'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={!!deleteVersion}
                onOpenChange={(open) => {
                    if (!open) setDeleteVersion(null);
                }}
            >
                <AlertDialogContent className="rounded-[2.5rem] border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-8">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-destructive/10 rounded-xl border border-destructive/20">
                                <Trash2 className="size-6 text-destructive" />
                            </div>
                            Erase Version Matrix
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base font-medium text-muted-foreground py-2">
                            This action will permanently delete <span className="text-foreground font-black text-sm">v{deleteVersion?.version}</span> from the sequence. This protocol cannot be recovered.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-6">
                        <AlertDialogCancel className="rounded-2xl h-12 font-bold px-8 active:scale-95 transition-all">Keep Draft</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isSubmitting}
                            className="rounded-2xl h-12 font-black bg-destructive hover:bg-destructive shadow-xl shadow-destructive/20 active:scale-95 transition-all px-8 border-none"
                        >
                            {isSubmitting ? 'Purging...' : 'Confirm Destruction'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

