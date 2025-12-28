import { UseFormReturn, FieldValues, Path } from "react-hook-form"

/**
 * Handles backend errors and maps them to React Hook Form fields.
 * 
 * @param error The error object from the catch block
 * @param form The react-hook-form instance
 * @param mapping Optional mapping of backend field names to frontend form paths
 * 
 * @example
 * ```tsx
 * try {
 *   await createItem(data)
 * } catch (error) {
 *   handleFormError(error, form)
 * }
 * ```
 */
export function handleFormError<T extends FieldValues>(
    error: any,
    form: UseFormReturn<T>,
    mapping?: Partial<Record<string, Path<T>>>
) {
    // 1. Handle validation array errors (e.g. NestJS class-validator or manual arrays)
    // Structure: { response: { data: { message: ["name must be a string", ...] } } }
    if (error?.response?.data?.message && Array.isArray(error.response.data.message)) {
        const messages = error.response.data.message
        let hasMappedField = false

        messages.forEach((msg: string) => {
            const lowerMsg = msg.toLowerCase()

            // Try to find a matching field in the form values
            // This is a heuristic: if the error message contains the field name, map it.
            let mapped = false
            const formFields = Object.keys(form.getValues()) as Path<T>[]

            for (const field of formFields) {
                // Priority 1: Use explicit mapping if provided
                if (mapping && mapping[field as string] && lowerMsg.includes(field.toLowerCase())) {
                    form.setError(mapping[field as string]!, { message: msg })
                    mapped = true
                    hasMappedField = true
                    break
                }

                // Priority 2: Auto-detect based on field name presence in error message
                if (lowerMsg.includes(field.toLowerCase())) {
                    form.setError(field, { message: msg })
                    mapped = true
                    hasMappedField = true
                    break
                }
            }

            // If no field matched, set it as a root error
            if (!mapped) {
                form.setError("root", { message: msg })
            }
        })

        // If we mapped at least one field, we don't need a generic fallback root error
        if (hasMappedField) return
    }

    // 2. Handle specific "error" field (often used for single custom errors)
    // Structure: { response: { data: { error: "Something went wrong" } } }
    if (error?.response?.data?.error) {
        // Sometimes 'error' is just the HTTP status text (e.g. "Bad Request"), check 'message' first
        const msg = typeof error.response.data.message === 'string'
            ? error.response.data.message
            : error.response.data.error

        form.setError("root", { message: msg })
        return
    }

    // 3. Handle structure: { response: { data: { errors: { email: "Invalid" } } } } (Laravel/Rails style)
    if (error?.response?.data?.errors && typeof error.response.data.errors === 'object') {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
            // Check if key exists in form
            const fieldKey = key as Path<T>
            const message = Array.isArray(value) ? value[0] : String(value)

            if (key in form.getValues()) {
                form.setError(fieldKey, { message })
            } else {
                form.setError("root", { message: `${key}: ${message}` })
            }
        })
        return
    }

    // 4. Fallback: Generic Error Name or Message
    const fallbackMessage = error?.message || "An unexpected error occurred. Please try again."
    form.setError("root", { message: fallbackMessage })
}
