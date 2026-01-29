import { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api/templates';
import { Template } from '@/lib/types/template';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Search as SearchInput } from '@/components/shared/Search';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Search, Check, Sparkles } from 'lucide-react';
import { TemplateCardMedia } from '@/components/features/templates/TemplateCardMedia';
import { cn } from '@/lib/utils';
import { useFormContext } from 'react-hook-form';

interface TemplateSelectorProps {
    creationToolId: string;
    value?: string | { url: string; description: string }; // Selected Template
    onChange?: (value: string | { url: string; description: string }) => void;
    className?: string;
}

export function TemplateSelector({ creationToolId, value, onChange, className }: TemplateSelectorProps) {
    const { currentWorkspace } = useWorkspace();
    const { setValue } = useFormContext(); // To prefill other fields

    // State
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearch = useDebounce(searchQuery, 500);

    // Fetch Templates
    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['templates', creationToolId, debouncedSearch, selectedCategory],
        queryFn: async () => {
            if (!creationToolId) return [];

            const filters: Record<string, string | number | boolean> = {
                creationToolId: creationToolId
            };

            if (debouncedSearch && debouncedSearch.trim() !== '') {
                filters.name = debouncedSearch.trim();
            }

            if (selectedCategory && selectedCategory !== 'all') {
                filters.category = selectedCategory;
            }

            const result = await templatesApi.findAll({
                filters: JSON.stringify(filters),
                limit: 100
            });

            return Array.isArray(result) ? result : (result?.data || []);
        },
        enabled: !!creationToolId && !!currentWorkspace?.id,
        placeholderData: keepPreviousData,
    });

    // Robust selection check
    const getIsSelected = (template: Template) => {
        if (!value) return false;
        if (typeof value === 'string') return value === template.thumbnailUrl;
        if (typeof value === 'object' && value !== null) {
            return (value as any).url === template.thumbnailUrl;
        }
        return false;
    }

    // Extract Categories
    const categories = useMemo(() => {
        if (templates.length === 0) return ['all'];
        const distinctCategories = ['all', ...Array.from(new Set(templates.map((t) => {
            if (t.category && typeof t.category === 'object') {
                return t.category.slug || t.category.name || 'other';
            }
            return t.category || 'other';
        })))];
        return distinctCategories as string[];
    }, [templates]);

    // Handle Selection
    const handleSelect = (template: Template) => {
        // Update own value: Pass object with both URL and description
        onChange?.({
            url: template.thumbnailUrl || '',
            description: template.description || ''
        } as any);

        // Prefill other fields
        if (template.description) {
            setValue('description', template.description, { shouldValidate: true, shouldDirty: true });
            setValue('prompt', template.description, { shouldValidate: true, shouldDirty: true });
        }

        if (template.prefilledData) {
            Object.entries(template.prefilledData).forEach(([key, val]) => {
                setValue(key, val, { shouldValidate: true, shouldDirty: true });
            });
        }
    };

    return (
        <Card className={cn("flex flex-col h-[600px] overflow-hidden border-none shadow-none bg-transparent", className)}>
            <div className="px-1 py-4 flex-none flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="relative w-full sm:max-w-xs">
                        <SearchInput
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClear={() => setSearchQuery("")}
                            className="h-9"
                        />
                    </div>

                    {/* Compact Category Filters */}
                    <div className="flex flex-wrap gap-1.5 flex-1 justify-end">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className={cn(
                                "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border",
                                selectedCategory === 'all'
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-muted/10 hover:bg-muted/30 border-border/40 text-muted-foreground"
                            )}
                        >
                            ALL
                        </button>
                        {categories.filter(c => c !== 'all').slice(0, 3).map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold transition-all border",
                                    selectedCategory === cat
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-muted/10 hover:bg-muted/30 border-border/40 text-muted-foreground"
                                )}
                            >
                                {cat.replace('-', ' ')}
                            </button>
                        ))}
                        {categories.length > 4 && (
                            <Badge variant="outline" className="text-[10px] px-2">+{categories.length - 4}</Badge>
                        )}
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 -mx-2 px-2">
                {isLoading ? (
                    <div className="py-20 flex justify-center">
                        {/* Loading State - could add spinner */}
                        <div className="text-muted-foreground text-sm">Loading templates...</div>
                    </div>
                ) : templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">No templates found</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-20">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => handleSelect(template)}
                                className={cn(
                                    "group relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300",
                                    getIsSelected(template)
                                        ? "border-primary"
                                        : "border-transparent bg-muted/20 hover:border-primary/30"
                                )}
                            >
                                <TemplateCardMedia
                                    thumbnailUrl={template.thumbnailUrl}
                                    name={template.name}
                                    className="w-full h-full absolute inset-0"
                                    autoPlayOnHover={true}
                                    icon={template.icon}
                                />

                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pt-20 pb-5 px-5 flex flex-col justify-end opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <h3 className="text-white font-bold text-lg leading-tight tracking-tight drop-shadow-sm group-hover:text-primary-foreground transition-colors line-clamp-1">
                                        {template.name}
                                    </h3>
                                    {template.description && (
                                        <p className="text-white/60 text-xs line-clamp-1 mt-0.5 group-hover:text-white/90 transition-colors">
                                            {template.description}
                                        </p>
                                    )}
                                    {template.category && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Badge variant="secondary" className="bg-white/20 text-white">
                                                {typeof template.category === 'object' ? (template.category as unknown as { name: string, slug: string }).name || (template.category as unknown as { name: string, slug: string }).slug : template.category}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {getIsSelected(template) && (
                                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-in zoom-in spin-in-90 duration-300 z-10">
                                        <Check className="w-5 h-5 text-primary-foreground stroke-[3]" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </Card>
    );
}
