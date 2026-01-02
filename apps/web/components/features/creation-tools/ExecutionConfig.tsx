import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    ExecutionFlow,
    ExecutionType,
    AiExecutionConfig,
    HttpExecutionConfig,
    FormField
} from '@/lib/api/creation-tools';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Info, AlertTriangle, FileText, Loader2, BookOpen, Sparkles, Globe, Copy, Check } from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/Dialog';
import { templatesApi } from '@/lib/api/templates';
import { Template } from '@/lib/types/template';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { aiProvidersApi } from '@/lib/api/ai-providers';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/Checkbox';

interface ExecutionConfigProps {
    config: ExecutionFlow;
    onChange: (config: ExecutionFlow) => void;
    availableFields?: FormField[];
}

interface AiModelProvider {
    providerId: string;
    providerKey: string;
    providerName: string;
    displayName: string;
    configId?: string;
    models: string[];
}

export function ExecutionConfig({ config, onChange, availableFields = [] }: ExecutionConfigProps) {
    const handleTypeChange = (type: ExecutionType) => {
        // Reset config to defaults based on type
        if (type === 'ai-generation') {
            onChange({
                type: 'ai-generation',
                provider: 'openai',
                model: 'gpt-4o',
                promptTemplate: '',
                parameters: { temperature: 0.7 }
            });
        } else if (type === 'http-webhook') {
            // Create a smart default body based on available fields
            const lines: string[] = [];
            availableFields.forEach(f => {
                const isComplex = ['file', 'files', 'multi-select', 'channel-select', 'channel-selector', 'json', 'key-value', 'multi-select'].includes(f.type);
                const variable = isComplex ? `{{${f.name} | json}}` : `{{${f.name}}}`;
                if (isComplex) {
                    lines.push(`  "${f.name}": ${variable}`);
                } else {
                    lines.push(`  "${f.name}": "${variable}"`);
                }
            });

            const defaultBody = `{\n${lines.join(',\n')}\n}`;

            onChange({
                type: 'http-webhook',
                urlTemplate: 'https://',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                bodyTemplate: defaultBody,
                timeoutMs: 60000,
                retryCount: 3
            });
        }
    };

    return (
        <div className="space-y-6 h-full overflow-y-auto px-1">
            <Card className="border-border/60 bg-card/40 shadow-sm">
                <CardContent className="p-5 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-base font-semibold tracking-tight">Execution Strategy</Label>
                        <p className="text-sm text-muted-foreground">
                            Define how this tool processes inputs to generate results.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                            onClick={() => handleTypeChange('ai-generation')}
                            className={`
                                cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50
                                ${config.type === 'ai-generation' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted bg-card'}
                            `}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${config.type === 'ai-generation' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="font-semibold">AI Generation</div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Use Large Language Models (LLMs) like GPT-4 or Claude to generate text content using prompt templates.
                            </p>
                        </div>

                        <div
                            onClick={() => handleTypeChange('http-webhook')}
                            className={`
                                cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-accent/50
                                ${config.type === 'http-webhook' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-muted bg-card'}
                            `}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${config.type === 'http-webhook' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div className="font-semibold">webhook / API</div>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Trigger external workflows (e.g., n8n, Zapier) or call custom APIs via HTTP requests.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                {availableFields.length > 0 && (
                    <div className="mb-4">
                        <VariablesHelper fields={availableFields} />
                    </div>
                )}

                {config.type === 'ai-generation' && (
                    <AiConfigEditor
                        config={config as AiExecutionConfig}
                        onChange={(c) => onChange(c)}
                    />
                )}

                {config.type === 'http-webhook' && (
                    <HttpConfigEditor
                        config={config as HttpExecutionConfig}
                        onChange={(c) => onChange(c)}
                    />
                )}
            </div>
        </div>
    );
}

function VariablesHelper({ fields }: { fields: FormField[] }) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, label?: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label || text);
        setTimeout(() => setCopied(null), 2000);
        toast.success(label ? `Copied ${label}` : `Copied {{${text}}} to clipboard`);
    };

    const copyAllAsJson = () => {
        const lines: string[] = [];
        fields.forEach(f => {
            const isComplex = ['file', 'files', 'multi-select', 'channel-selector', 'json', 'key-value'].includes(f.type);
            const variable = isComplex ? `{{${f.name} | json}}` : `{{${f.name}}}`;
            if (isComplex) {
                // For complex types, don't wrap in quotes so it injects raw JSON
                lines.push(`  "${f.name}": ${variable}`);
            } else {
                lines.push(`  "${f.name}": "${variable}"`);
            }
        });
        const jsonStr = `{\n${lines.join(',\n')}\n}`;
        copyToClipboard(jsonStr, 'JSON Structure');
    };

    return (
        <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden underline-none">
            <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Available Form Variables</span>
                    </div>
                    {fields.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] gap-1.5 px-2 bg-background"
                            onClick={copyAllAsJson}
                        >
                            {copied === 'JSON Structure' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            Copy All as JSON
                        </Button>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {fields.map(f => (
                        <button
                            key={f.name}
                            onClick={() => copyToClipboard(f.name)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-background border border-border hover:border-primary hover:text-primary transition-all group"
                            title={`Click to copy {{${f.name}}}`}
                        >
                            <span className="text-xs font-mono">{f.name}</span>
                            {copied === f.name ? (
                                <Check className="w-3 h-3 text-green-500" />
                            ) : (
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">No fields defined yet. Add fields in the Form Builder tab first.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AiConfigEditor({ config, onChange }: { config: AiExecutionConfig, onChange: (c: AiExecutionConfig) => void }) {
    const { workspaceId } = useWorkspace();

    const fetchProviders = async () => {
        const data = workspaceId
            ? await aiProvidersApi.getWorkspaceModels(workspaceId)
            : await aiProvidersApi.getAvailableModels();
        return data as AiModelProvider[];
    };

    const { data: providers = [], isLoading: loading } = useQuery({
        queryKey: ['ai-providers', 'models', workspaceId],
        queryFn: fetchProviders,
        staleTime: 5 * 60 * 1000,
    });

    const selectedProviderData = providers.find(p => p.providerKey === config.provider || p.providerId === config.provider);
    const availableModels = selectedProviderData?.models || [];

    return (
        <Card className="border-border/60 bg-card/40">
            <CardContent className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select
                            value={config.provider}
                            onValueChange={(val) => onChange({ ...config, provider: val as any, model: '' })}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder={loading ? "Loading..." : "Select provider"} />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map((p) => (
                                    <SelectItem key={p.providerId + (p.configId || '')} value={p.providerKey}>
                                        {p.providerName} {p.displayName ? `(${p.displayName})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Model</Label>
                        <Select
                            value={config.model}
                            onValueChange={(val) => onChange({ ...config, model: val })}
                            disabled={!config.provider}
                        >
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder={!config.provider ? "Select provider first" : "Select model"} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModels.map((model: string) => (
                                    <SelectItem key={model} value={model}>
                                        {model}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="flex gap-2 items-center">
                            Prompt Template
                            <Badge variant="outline" className="text-[10px] font-normal font-mono">LiquidJS Supported</Badge>
                        </Label>
                        <TemplateSelector onSelect={(template) => {
                            if (template) {
                                onChange({ ...config, promptTemplate: template });
                            }
                        }} />
                    </div>
                    <div className="relative">
                        <Textarea
                            value={config.promptTemplate}
                            onChange={(e) => onChange({ ...config, promptTemplate: e.target.value })}
                            className="font-mono text-sm min-h-[200px] resize-y"
                            placeholder="Write a blog post about {{topic}}..."
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Use <code>{`{{ variable_name }}`}</code> to allow users to inject data from the form.
                    </p>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl border bg-primary/5 border-primary/10">
                    <Checkbox
                        id="include-template"
                        checked={config.includeTemplate}
                        onCheckedChange={(checked) => onChange({ ...config, includeTemplate: !!checked })}
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label
                            htmlFor="include-template"
                            className="text-sm font-bold leading-none cursor-pointer flex items-center gap-2"
                        >
                            Include Template Content
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">Context</Badge>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Automatically include the selected template's prompt and configuration in the execution payload.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function HttpConfigEditor({ config, onChange }: { config: HttpExecutionConfig, onChange: (c: HttpExecutionConfig) => void }) {
    return (
        <Card className="border-border/60 bg-card/40">
            <CardContent className="space-y-5 p-5">
                <div className="grid grid-cols-[120px_1fr] gap-4">
                    <div className="space-y-2">
                        <Label>Method</Label>
                        <Select
                            value={config.method}
                            onValueChange={(val) => onChange({ ...config, method: val as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' })}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Target URL Template</Label>
                        <Input
                            value={config.urlTemplate}
                            onChange={(e) => onChange({ ...config, urlTemplate: e.target.value })}
                            className="font-mono text-sm"
                            placeholder="https://api.example.com/v1/resource/{{id}}"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        Headers
                        <span className="text-xs text-muted-foreground font-normal">(JSON)</span>
                    </Label>
                    <Textarea
                        value={JSON.stringify(config.headers, null, 2)}
                        onChange={(e) => {
                            try { onChange({ ...config, headers: JSON.parse(e.target.value) }) }
                            catch { /* Allow typing */ }
                        }}
                        className="font-mono text-xs h-24"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                            Body Template
                            <span className="text-xs text-muted-foreground font-normal">(LiquidJS + JSON)</span>
                        </span>
                    </Label>
                    <Textarea
                        value={config.bodyTemplate}
                        onChange={(e) => onChange({ ...config, bodyTemplate: e.target.value })}
                        className="font-mono text-xs min-h-[200px]"
                        placeholder={'{\n  "data": "{{ user_input }}",\n  "mode": "production"\n}'}
                    />
                    <div className="flex gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded">
                        <AlertTriangle className="w-4 h-4" />
                        Ensure the rendered output is valid JSON if the Content-Type is application/json.
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <div className="space-y-2">
                        <Label>Timeout (ms)</Label>
                        <Input
                            type="number"
                            value={config.timeoutMs}
                            onChange={(e) => onChange({ ...config, timeoutMs: parseInt(e.target.value) || 5000 })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Retry Count</Label>
                        <Input
                            type="number"
                            value={config.retryCount}
                            onChange={(e) => onChange({ ...config, retryCount: parseInt(e.target.value) || 3 })}
                        />
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}

function TemplateSelector({ onSelect }: { onSelect: (templateContent: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const { workspaceId } = useWorkspace();

    const { data: templates = [], isLoading: loading } = useQuery({
        queryKey: ['templates', workspaceId, debouncedSearch],
        queryFn: async () => {
            const result = await templatesApi.findAll({
                page: 1,
                limit: 20,
                workspaceId,
                search: debouncedSearch
            });
            return result.data || [];
        },
        enabled: open && !!workspaceId,
        staleTime: 60000,
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Load from Library
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden">
                <DialogHeader className="p-4 border-b bg-muted/20">
                    <DialogTitle className="text-base font-semibold">Select Prompt Template</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-4">
                    <Search
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e: any) => setSearch(e.target.value)}
                        onClear={() => setSearch('')}
                    />
                    <div className="h-[300px] overflow-y-auto border rounded-md divide-y">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No templates found
                            </div>
                        ) : (
                            templates.map((t) => (
                                <button
                                    key={t.id}
                                    className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-3 group"
                                    onClick={() => {
                                        onSelect(t.promptTemplate || '');
                                        setOpen(false);
                                    }}
                                >
                                    <div className="mt-0.5 w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-medium text-sm truncate">{t.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1 truncate">
                                            {t.description || 'No description'}
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        Select
                                    </Badge>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

