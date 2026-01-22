'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, History, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils/date';
import { WidgetAppearanceSettings } from '@/components/features/widget/WidgetAppearanceSettings';

export default function WidgetVersionReviewPage() {
    const params = useParams();
    const router = useRouter();
    const botId = params.id as string;
    const versionId = params.versionId as string;

    // Fetch version details (mocked for now, need API)
    // Ideally useWidgetVersion(botId, versionId)
    const { data: version, isLoading } = useQuery({
        queryKey: ['widget-version', botId, versionId],
        queryFn: async () => {
            // Placeholder: Fetch from actual API
            // For now, redirect or show basic info
            return {
                id: versionId,
                version: 'v1.0.0',
                createdAt: new Date().toISOString(),
                config: {}, // Needs actual config
                status: 'draft'
            };
        }
    });

    if (isLoading) {
        return <div className="p-12 text-center text-muted-foreground">Loading Protocol Matrix...</div>;
    }

    if (!version) {
        return <div className="p-12 text-center text-muted-foreground">Version integrity compromised. Not found.</div>;
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex items-center gap-4 border-b border-border/40 pb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl hover:bg-muted"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                        Protocol Review
                        <Badge variant="outline" className="text-base font-mono px-2 py-0.5 rounded-lg border-primary/20 text-primary bg-primary/5">
                            {version.version}
                        </Badge>
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                        <span className="flex items-center gap-1.5">
                            <History className="w-3 h-3" />
                            ID: {version.id.substring(0, 8)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {formatRelativeTime(version.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <WidgetAppearanceSettings
                    botId={botId}
                    currentSettings={version.config}
                    onSave={() => { }} // Read-only or separate separate save logic for versions
                // readOnly={true} // TODO: Add read-only mode to settings
                />
            </div>
        </div>
    );
}
