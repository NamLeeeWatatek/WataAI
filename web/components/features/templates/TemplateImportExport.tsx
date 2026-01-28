'use client'

import { Button } from '@/components/ui/Button'
import { Upload, Download } from 'lucide-react'
import toast from '@/lib/toast'
import { useWorkspace } from '@/lib/hooks/useWorkspace'
import { useTranslation } from 'react-i18next'

interface TemplateImportExportProps {
    onImport: (params: { templates: any[], workspaceId: string }) => Promise<any>;
    onExport: (ids: string[]) => Promise<any[]>;
    onRefresh: () => void;
    templatesToExport: string[]; // IDs
    disabled?: boolean;
}

export function TemplateImportExport({
    onImport,
    onExport,
    onRefresh,
    templatesToExport,
    disabled
}: TemplateImportExportProps) {
    const { t } = useTranslation();
    const { currentWorkspace } = useWorkspace();

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);
                const templatesToImport = Array.isArray(data) ? data : (data.templates || [data]);

                await onImport({
                    templates: templatesToImport,
                    workspaceId: currentWorkspace?.id || ''
                });
                toast.success(t('templates.importedSuccess', { count: templatesToImport.length }));
                onRefresh();
            } catch (err) {
                toast.error(t('templates.importFailed'));
                console.error(err);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // reset
    };

    const handleExport = async () => {
        if (templatesToExport.length === 0) {
            toast.error(t('templates.noTemplatesToExport'));
            return;
        }
        try {
            const data = await onExport(templatesToExport);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `templates_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(t('templates.exportSuccess', { count: data.length }));
        } catch (err) {
            toast.error(t('templates.exportFailed'));
        }
    };

    return (
        <div className="flex gap-2">
            <label>
                <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                    disabled={disabled}
                />
                <Button variant="outline" size="sm" asChild className="cursor-pointer gap-2" disabled={disabled}>
                    <span>
                        <Upload className="w-4 h-4" />
                        {t('common.add')} {/* Reuse 'add' or creating specific key? Using common.add for now but Import implies Add */}
                    </span>
                </Button>
            </label>
            <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExport}
                disabled={disabled || templatesToExport.length === 0}
            >
                <Download className="w-4 h-4" />
                Export {/* No translation key for Export usually, let's use common.export or keep English if not in common */}
            </Button>
        </div>
    );
}
