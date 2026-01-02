import { MultiSelect } from "../MultiSelect"
import { DynamicFormFieldProps } from "./types"
import { useDynamicOptions } from "@/lib/hooks/useDynamicOptions"
import { FormField } from "@/lib/api/creation-tools"

interface OptionItem {
    label: string
    value: string | number
    icon?: string
    [key: string]: any
}

export function FieldMultiSelect({ field, value, onChange }: DynamicFormFieldProps) {
    // Cast to FormField to match hook expectation
    const { options: dynamicOptions, isLoading: loadingOptions } = useDynamicOptions(field as unknown as FormField)

    const multiOptions: OptionItem[] = typeof field.options === 'string' && field.options.startsWith('dynamic:')
        ? dynamicOptions
        : (field.options as OptionItem[]) || []

    // Format options for MultiSelect component
    const formattedOptions = multiOptions.map(opt => ({
        value: String(typeof opt === 'string' ? opt : opt.value),
        label: String(typeof opt === 'string' ? opt : opt.label)
    }));

    const selectedValues = Array.isArray(value) ? value.map(String) : []

    return (
        <MultiSelect
            options={formattedOptions}
            value={selectedValues}
            onChange={(newValues) => onChange(field.name, newValues)}
            placeholder={field.placeholder || "Select options"}
            disabled={loadingOptions || field.disabled}
        />
    )
}
