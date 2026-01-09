import React from 'react'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { Box, GripVertical, MoreVertical, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'
import { StrictModeDroppable } from '@/components/ui/StrictModeDroppable'
import { FormField, ZoneConfig } from '@/lib/api/creation-tools'
import { DynamicFormField } from '@/components/ui/DynamicFormField'

interface FormBuilderZoneProps {
    zone: ZoneConfig
    configFields: FormField[]
    dragHandleProps?: any
    onRemoveZone: () => void
    onUpdateZone: (updates: Partial<ZoneConfig>) => void
    selectedFieldName: string | null
    onSelectField: (name: string) => void
    onDeleteField: (rowId: string, fieldIdx: number) => void
}

export function FormBuilderZone({
    zone,
    configFields,
    dragHandleProps,
    onRemoveZone,
    onUpdateZone,
    selectedFieldName,
    onSelectField,
    onDeleteField
}: FormBuilderZoneProps) {
    return (
        <div className={cn(
            "flex flex-col gap-4 transition-all group/zone relative h-full",
            "bg-card/30 rounded-3xl p-6 border-2 border-dashed border-transparent hover:border-primary/10 transition-colors",
            zone.fieldRows.length === 0 && "border-muted-foreground/10 min-h-[160px]"
        )}>
            {/* Zone Header */}
            <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex items-center gap-3 flex-1">
                    <div
                        {...dragHandleProps}
                        className="cursor-move hover:bg-muted p-1 rounded"
                    >
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
            <StrictModeDroppable droppableId={zone.id} type="FIELD">
                {(providedZoneDrop, snapshotZoneDrop) => (
                    <div
                        ref={providedZoneDrop.innerRef}
                        {...providedZoneDrop.droppableProps}
                        className={cn(
                            "flex flex-col gap-3 min-h-[50px] flex-1 transition-colors rounded-xl p-2",
                            snapshotZoneDrop.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-transparent"
                        )}
                    >
                        {zone.fieldRows.map((fieldRow, rowIdx) => (
                            <StrictModeDroppable key={fieldRow.id} droppableId={fieldRow.id} type="FIELD" direction="horizontal">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            "grid gap-4 p-3 min-h-[80px] rounded-xl transition-all border-2 border-dashed border-transparent mb-2", // Added mb-2 for spacing
                                            snapshot.isDraggingOver ? "bg-background border-primary shadow-sm" : "hover:border-border/40 bg-card/40",
                                            // Auto-grid columns based on field count
                                            `grid-cols-${Math.max(1, fieldRow.fields.length)}`
                                        )}
                                        style={{
                                            gridTemplateColumns: `repeat(${Math.max(1, fieldRow.fields.length)}, minmax(0, 1fr))`
                                        }}
                                    >
                                        {fieldRow.fields.map((fieldName, fieldIdx) => {
                                            const field = configFields.find(f => f.name === fieldName);
                                            // Handle potential missing fields gracefully
                                            if (!field) return null;

                                            return (
                                                <Draggable key={fieldName} draggableId={fieldName} index={fieldIdx}>
                                                    {(providedField, snapshotField) => (
                                                        <div
                                                            ref={providedField.innerRef}
                                                            {...providedField.draggableProps}
                                                            {...providedField.dragHandleProps}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelectField(fieldName);
                                                            }}
                                                            style={{
                                                                ...providedField.draggableProps.style,
                                                                height: '100%'
                                                            }}
                                                        >
                                                            <FieldPreview
                                                                field={field}
                                                                isSelected={selectedFieldName === fieldName}
                                                                isDragging={snapshotField.isDragging}
                                                                onDelete={() => onDeleteField(fieldRow.id, fieldIdx)}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </StrictModeDroppable>
                        ))}
                        {providedZoneDrop.placeholder}
                    </div>
                )}
            </StrictModeDroppable>
        </div>
    )
}

function FieldPreview({ field, isSelected, isDragging, onDelete }: { field: FormField, isSelected: boolean, isDragging: boolean, onDelete: () => void }) {
    return (
        <div className={cn(
            "w-full h-full p-3 group/card relative rounded-lg border-2 transition-all overflow-hidden bg-background cursor-pointer",
            isSelected ? "ring-2 ring-primary border-primary shadow-md z-10" : "border-dashed border-border/50 hover:border-border",
            isDragging && "shadow-2xl ring-2 ring-primary rotate-2 scale-105 z-50 bg-background opacity-90 cursor-grabbing"
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
