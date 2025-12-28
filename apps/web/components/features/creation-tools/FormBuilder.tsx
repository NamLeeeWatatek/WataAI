import { useState } from 'react';
import { FormConfig, FormField } from '@/lib/api/creation-tools';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Plus, Trash2, Settings, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/Dialog';
import { Checkbox } from '@/components/ui/Checkbox';

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
    { value: 'file', label: 'File Upload' },
    { value: 'channel-selector', label: 'Channel Selector' },
];

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
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                                        {field.name}
                                    </p>
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
                                        onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
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

                            <div className="flex items-center space-x-2 border p-3 rounded">
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

                            {(editingField.type === 'select' || editingField.type === 'radio') && (
                                <div className="space-y-2 border p-3 rounded bg-muted/20">
                                    <Label>Options (Comma separated for now)</Label>
                                    <Input
                                        placeholder="Option 1, Option 2, Option 3"
                                        // Simple string parsing for MVP
                                        value={editingField.options?.map(o => o.label).join(', ') || ''}
                                        onChange={(e) => {
                                            const opts = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                            setEditingField({
                                                ...editingField,
                                                options: opts.map(o => ({ label: o, value: o }))
                                            })
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Enter options separated by comma.</p>
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
