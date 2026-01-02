import { FormField as ApiFormField } from '@/lib/api/creation-tools'

// NodeProperty type from backend - sync with ApiFormField but more flexible
export type NodeProperty = Omit<ApiFormField, 'type' | 'options'> & {
    type: string | 'string' | 'text' | 'textarea' | 'number' | 'boolean' | 'checkbox' | 'radio' | 'select' | 'multi-select' | 'slider' | 'color' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select' | 'channel-selector'
    displayName?: string
    helpText?: string
    hint?: string
    rows?: number
    accept?: string
    multiple?: boolean
    default?: any
    options?: any
    showWhen?: Record<string, any>
    showIf?: {
        field: string
        operator: 'equals' | 'not-equals' | 'contains'
        value: any
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
    value: any
    onChange: (key: string, value: any) => void
    allValues?: Record<string, any>
    className?: string
}
