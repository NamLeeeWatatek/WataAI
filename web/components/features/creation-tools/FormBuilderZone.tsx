import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, rectSortingStrategy } from '@dnd-kit/sortable'
import { SortableItem } from './SortableItem'
import { Box, ChevronRight, GripVertical, MoreHorizontal, MoreVertical, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { FormField, FormStep, ZoneConfig } from '@/lib/api/creation-tools'
import { DynamicFormField } from '@/components/ui/DynamicFormField'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"

interface FormBuilderZoneProps {
    zone: ZoneConfig
    configFields: FormField[]
    dragHandleProps?: any
    onRemoveZone: () => void
    onUpdateZone: (updates: Partial<ZoneConfig>) => void
    selectedFieldName: string | null
    onSelectField: (name: string) => void
    onDeleteField: (rowId: string, fieldIdx: number) => void
    steps: FormStep[]
    onMoveFieldToStep: (fieldName: string, stepIdx: number) => void
}

export function FormBuilderZone({
    zone,
    configFields,
    dragHandleProps,
    onRemoveZone,
    onUpdateZone,
    selectedFieldName,
    onSelectField,
    onDeleteField,
    steps,
    onMoveFieldToStep
}: FormBuilderZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: zone.id,
        data: {
            type: 'ZONE',
            zoneId: zone.id
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col gap-4 transition-all group/zone relative h-full",
                "bg-card/30 rounded-3xl p-6 border-2 border-dashed border-transparent hover:border-primary/10 transition-colors",
                zone.fieldRows.length === 0 && "border-muted-foreground/10 min-h-[160px]",
                isOver && "bg-primary/5 border-primary/20 ring-4 ring-primary/20 ring-inset"
            )}
        >
            {/* Zone Header */}
            <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="cursor-move hover:bg-muted p-1 rounded" {...dragHandleProps}>
                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
                            <Box className="w-4 h-4 text-primary/40" />
                        </div>
                    </div>
                    <Input
                        value={zone.title}
                        placeholder="Untitled Zone"
                        onChange={(e) => onUpdateZone({ title: e.target.value })}
                        className="h-8 text-sm font-bold tracking-wide bg-transparent border-transparent hover:border-border focus:border-primary w-fit min-w-[150px]"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover/zone:opacity-100" onClick={onRemoveZone}>
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            {/* Zone Content (Field Rows) */}
            <div className="flex flex-col gap-3 min-h-[120px] pb-12 flex-1 transition-colors rounded-xl p-2">
                <SortableContext items={zone.fieldRows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                    {zone.fieldRows.map((fieldRow, rowIdx) => (
                        <SortableItem key={fieldRow.id} id={fieldRow.id}>
                            {({ ref, style, attributes, listeners, isDragging: isRowDragging }) => (
                                <div
                                    ref={ref}
                                    style={style}
                                    className={cn(
                                        "grid gap-6 p-6 transition-all border-2 border-dashed mb-4 relative group/row-container",
                                        "hover:border-primary/30 bg-card/40 border-muted-foreground/10",
                                        fieldRow.fields.length === 0 ? "hidden" : "rounded-[2rem] min-h-[100px]",
                                        fieldRow.fields.length === 0 ? "grid-cols-1" : `grid-cols-${Math.min(4, fieldRow.fields.length)}`
                                    )}
                                >
                                    {/* Drag handle for row reordering */}
                                    <div
                                        {...attributes}
                                        {...listeners}
                                        className="absolute top-2 left-2 opacity-0 group-hover/row-container:opacity-100 cursor-grab active:cursor-grabbing z-10 p-1 hover:bg-muted rounded transition-opacity"
                                    >
                                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                                    </div>

                                    <SortableContext items={fieldRow.fields} strategy={rectSortingStrategy}>
                                        {fieldRow.fields.map((fieldName, fieldIdx) => {
                                            const field = configFields.find(f => f.name === fieldName);
                                            if (!field) return null;

                                            return (
                                                <SortableItem key={fieldName} id={fieldName} data={{ type: 'FIELD', fieldName, zoneId: zone.id, rowId: fieldRow.id }}>
                                                    {({ ref: fieldRef, style: fieldStyle, attributes: fieldAttrs, listeners: fieldListeners, isDragging }) => (
                                                        <div
                                                            ref={fieldRef}
                                                            style={fieldStyle}
                                                            {...fieldAttrs}
                                                            {...fieldListeners}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelectField(fieldName);
                                                            }}
                                                            className="h-full"
                                                        >
                                                            <FieldPreview
                                                                field={field}
                                                                isSelected={selectedFieldName === fieldName}
                                                                isDragging={isDragging}
                                                                onDelete={() => onDeleteField(fieldRow.id, fieldIdx)}
                                                                steps={steps}
                                                                onMoveToStep={(idx) => onMoveFieldToStep(fieldName, idx)}
                                                            />
                                                        </div>
                                                    )}
                                                </SortableItem>
                                            );
                                        })}
                                    </SortableContext>
                                </div>
                            )}
                        </SortableItem>
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}

function FieldPreview({
    field,
    isSelected,
    isDragging,
    onDelete,
    steps,
    onMoveToStep
}: {
    field: FormField,
    isSelected: boolean,
    isDragging: boolean,
    onDelete: () => void,
    steps: FormStep[],
    onMoveToStep: (idx: number) => void
}) {
    return (
        <div className={cn(
            "w-full h-full p-6 group/card relative rounded-2xl border-2 transition-all overflow-hidden bg-background cursor-pointer",
            isSelected ? "ring-4 ring-primary/10 border-primary shadow-[0_10px_40px_rgba(var(--primary-rgb),0.15)] z-10 scale-[1.02]" : "border-dashed border-border/40 hover:border-primary/20 hover:bg-muted/5",
            isDragging && "shadow-2xl ring-4 ring-primary/20 rotate-1 scale-105 z-50 bg-background opacity-90 cursor-grabbing border-primary"
        )}>
            <div className={cn("pointer-events-none opacity-80", isSelected && "opacity-100")}>
                <DynamicFormField
                    field={field}
                    value={field.defaultValue || ''}
                    onChange={() => { }}
                    allValues={{}}
                />
            </div>

            <div className={cn(
                "absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-20",
                isSelected && "opacity-100"
            )}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/80 hover:bg-background shadow-sm border">
                            <MoreHorizontal className="w-3 h-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">Quick Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 mt-2">
                            <ChevronRight className="w-2 h-2" /> Move to Step
                        </DropdownMenuLabel>
                        {steps.map((step, idx) => (
                            <DropdownMenuItem
                                key={step.id}
                                onClick={(e) => { e.stopPropagation(); onMoveToStep(idx); }}
                                className="text-xs py-2"
                            >
                                <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold mr-2">
                                    {idx + 1}
                                </div>
                                {step.title}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="text-xs py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Delete Field
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button
                    variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-sm"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        </div>
    )
}
