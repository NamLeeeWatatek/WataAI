'use client';

import { useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, Upload, Wrench, FileJson } from 'lucide-react';
import { useCreationTools } from '@/lib/hooks/features/useCreationTools';
import { toast } from 'sonner';

export function AdminSystemTools() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { exportTools, importTools, isMutating } = useCreationTools();

    const handleExport = async () => {
        try {
            const data = await exportTools(undefined);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `creation-tools-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('All tools exported successfully');
        } catch (error) {
            toast.error('Failed to export tools');
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const content = e.target?.result as string;
                const tools = JSON.parse(content);
                if (!Array.isArray(tools)) {
                    toast.error('Invalid file format. Expected an array of tools.');
                    return;
                }
                const result = await importTools(tools);
                if (fileInputRef.current) fileInputRef.current.value = '';
                toast.success(`Imported ${result.success} tools. Failed: ${result.failed}`);
            } catch (error) {
                toast.error('Failed to import tools. Check file format.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Wrench className="w-6 h-6" />
                        </div>
                        <div>
                            <CardTitle>Creation Tools Backup</CardTitle>
                            <CardDescription>Export or import all AI tool configurations (Creation Tools). Useful for backups or moving configurations between environments.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-border/50 bg-card/50 flex flex-col gap-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Download className="w-5 h-5 text-primary" />
                                <span>Export Configuration</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Download all creation tool configurations as a single JSON file.</p>
                            <Button
                                onClick={handleExport}
                                disabled={isMutating}
                                className="mt-2 w-full sm:w-auto"
                            >
                                <FileJson className="w-4 h-4 mr-2" />
                                Download Backup
                            </Button>
                        </div>

                        <div className="p-4 rounded-lg border border-border/50 bg-card/50 flex flex-col gap-3">
                            <div className="flex items-center gap-2 font-semibold">
                                <Upload className="w-5 h-5 text-emerald-500" />
                                <span>Import Configuration</span>
                            </div>
                            <p className="text-sm text-muted-foreground">Upload a previously exported JSON file to restore or add tool configurations.</p>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImport}
                                accept=".json"
                                className="hidden"
                            />
                            <Button
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isMutating}
                                className="mt-2 w-full sm:w-auto border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload & Restore
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* In the future, other system tools can be added here */}
            <Card className="opacity-60 border-dashed">
                <CardHeader>
                    <CardTitle className="text-sm">Advanced Tools</CardTitle>
                    <CardDescription>More system tools and utilities will be available here soon.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
