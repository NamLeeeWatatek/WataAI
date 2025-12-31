import { useState } from 'react';
import { FormConfig, FormField } from '@/lib/api/creation-tools';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Trash2, Settings, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';
import { toast } from 'sonner';

interface FormBuilderProps {
    config: FormConfig;
    onChange: (config: FormConfig) => void;
}

const FIELD_TYPES = [
    { value: 'text', label: 'Text Input' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'number', label: 'Number' },
    { value: 'select', label: 'Select Dropdown' },
    { value: 'radio', label: 'Radio Group' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'slider', label: 'Slider' },
    { value: 'file', label: 'Single File' },
    { value: 'files', label: 'Multiple Files' },
    { value: 'multi-select', label: 'Multi-Select' },
    { value: 'channel-selector', label: 'Channel Selector (Multi)' },
    { value: 'channel-select', label: 'Channel Picker (Single)' },
    { value: 'color', label: 'Color Picker' },
    { value: 'json', label: 'JSON Editor' },
    { value: 'key-value', label: 'Key-Value Editor' },
];

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)+/g, '');
};

export function FormBuilder({ config, onChange }: FormBuilderProps) {
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number>(-1);

    const handleAddField = () => {
        const newField: FormField = {
            name: '',
            label: '',
            type: 'text',
        };
        setEditingField(newField);
        setEditIndex(-1);
        setIsDialogOpen(true);
    };

    const handleEditField = (index: number) => {
        setEditingField({ ...config.fields[index] });
        setEditIndex(index);
        setIsDialogOpen(true);
    };

    const handleDeleteField = (index: number) => {
        const newFields = [...config.fields];
        newFields.splice(index, 1);
        onChange({ ...config, fields: newFields });
    };

    const handleSaveField = () => {
        if (!editingField) return;

        // Basic validation
        if (!editingField.name || !editingField.label) return;

        const newFields = [...config.fields];
        if (editIndex >= 0) {
            newFields[editIndex] = editingField;
        } else {
            newFields.push(editingField);
        }

        onChange({ ...config, fields: newFields });
        setIsDialogOpen(false);
        setEditingField(null);
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === config.fields.length - 1) return;

        const newFields = [...config.fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
        onChange({ ...config, fields: newFields });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Form Fields</h3>
                <Button onClick={handleAddField} size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" /> Add Field
                </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                {config.fields.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/20">
                        <p className="text-sm text-muted-foreground">No fields configured yet.</p>
                        <Button variant="link" onClick={handleAddField}>Add your first field</Button>
                    </div>
                ) : (
                    config.fields.map((field, index) => (
                        <Card key={index} className="relative group hover:border-primary/50 transition-colors">
                            <CardContent className="p-3 flex items-center gap-3">
                                <div className="flex flex-col gap-1 text-muted-foreground/50">
                                    <Button variant="ghost" size="icon" className="h-4 w-4" disabled={index === 0} onClick={() => moveField(index, 'up')}>
                                        <ChevronUp className="w-3 h-3" />
                                    </Button>
                                    <GripVertical className="w-4 h-4 mx-auto" />
                                    <Button variant="ghost" size="icon" className="h-4 w-4" disabled={index === config.fields.length - 1} onClick={() => moveField(index, 'down')}>
                                        <ChevronDown className="w-3 h-3" />
                                    </Button>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate">{field.label}</span>
                                        {field.validation?.required && <span className="text-destructive text-xs">*</span>}
                                        <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border">
                                            {field.type}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <code className="text-[10px] text-primary font-mono bg-primary/5 px-1 rounded">
                                            {`{{${field.name}}}`}
                                        </code>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(`{{${field.name}}}`);
                                                toast.success(`Copied {{${field.name}}} to clipboard`);
                                            }}
                                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" onClick={() => handleEditField(index)}>
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteField(index)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="space-y-2">
                <Label>Submit Button Label</Label>
                <Input
                    value={config.submitLabel || ''}
                    onChange={e => onChange({ ...config, submitLabel: e.target.value })}
                    placeholder="e.g. Generate Now"
                />
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editIndex >= 0 ? 'Edit Field' : 'Add New Field'}</DialogTitle>
                    </DialogHeader>
                    {editingField && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Field Label *</Label>
                                    <Input
                                        value={editingField.label}
                                        onChange={(e) => {
                                            const label = e.target.value;
                                            const update: any = { label };
                                            // Auto-slugify name if name is empty or matches previous slugified label
                                            if (!editingField.name || editingField.name === slugify(editingField.label)) {
                                                update.name = slugify(label);
                                            }
                                            setEditingField({ ...editingField, ...update });
                                        }}
                                        placeholder="Display Label"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Field Name (Key) *</Label>
                                    <Input
                                        value={editingField.name}
                                        onChange={(e) => setEditingField({ ...editingField, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                                        placeholder="variable_name"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Field Type</Label>
                                <Select
                                    value={editingField.type}
                                    onValueChange={(val: any) => setEditingField({ ...editingField, type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FIELD_TYPES.map(t => (
                                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Description / Help Text</Label>
                                <Input
                                    value={editingField.description || ''}
                                    onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                                    placeholder="Helper text for the user"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="req"
                                    checked={editingField.validation?.required || false}
                                    onCheckedChange={(checked) => setEditingField({
                                        ...editingField,
                                        validation: { ...editingField.validation, required: !!checked }
                                    })}
                                />
                                <Label htmlFor="req">Required Field</Label>
                            </div>

                            {(editingField.type === 'select' || editingField.type === 'radio' || editingField.type === 'multi-select') && (
                                <div className="space-y-3 pt-2">
                                    <Label>Options</Label>
                                    <div className="space-y-2">
                                        {(editingField.options || []).map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Input
                                                    value={option.label}
                                                    onChange={(e) => {
                                                        const newOptions = [...(editingField.options || [])];
                                                        newOptions[index] = { label: e.target.value, value: e.target.value };
                                                        setEditingField({ ...editingField, options: newOptions });
                                                    }}
                                                    placeholder={`Option ${index + 1}`}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        const newOptions = [...(editingField.options || [])];
                                                        newOptions.splice(index, 1);
                                                        setEditingField({ ...editingField, options: newOptions });
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full border-dashed"
                                            onClick={() => {
                                                const newOptions = [...(editingField.options || [])];
                                                newOptions.push({ label: '', value: '' });
                                                setEditingField({ ...editingField, options: newOptions });
                                            }}
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add Option
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveField}>Save Field</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
