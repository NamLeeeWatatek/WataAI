import { FormField as ApiFormField } from '@/lib/api/creation-tools'

// NodeProperty type from backend - sync with ApiFormField but more flexible
export type NodeProperty = Omit<ApiFormField, 'type' | 'options' | 'defaultValue'> & {
    type: string | 'string' | 'text' | 'textarea' | 'number' | 'boolean' | 'checkbox' | 'radio' | 'select' | 'multi-select' | 'slider' | 'color' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select' | 'channel-selector'
    displayName?: string
    helpText?: string
    hint?: string
    rows?: number
    accept?: string
    multiple?: boolean
    default?: unknown
    defaultValue?: unknown
    options?: string | Array<{ label: string; value: string | number | boolean; icon?: string }>
    showWhen?: Record<string, unknown>
    showIf?: {
        field: string
        operator: 'equals' | 'not-equals' | 'contains'
        value: unknown
    }
    required?: boolean
    min?: number
    max?: number
    step?: number
    maxLength?: number
    pattern?: string
    disabled?: boolean
    properties?: NodeProperty[]
}

export interface DynamicFormFieldProps {
    field: NodeProperty
    value: unknown
    onChange: (key: string, value: unknown) => void
    allValues?: Record<string, unknown>
    className?: string
    error?: string // Validation error message
}
