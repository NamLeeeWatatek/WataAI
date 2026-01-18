// API Error Types
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public raw?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Error Handler Utility
export function handleApiError(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (typeof error === 'object' && error !== null) {
        const err = error as any;

        // 1. Check for transformed ApiError structure in raw response
        if (err.response?.data?.message) {
            const message = err.response.data.message;
            if (Array.isArray(message)) {
                return message.join('. ');
            }
            return message;
        }

        // 2. Raw Axios error
        if (err.isAxiosError && err.response?.data?.message) {
            return err.response.data.message;
        }

        // 3. Standard error
        if (err.message) {
            return err.message;
        }
    }

    if (typeof error === 'string') {
        return error;
    }

    return 'An unexpected error occurred';
}


// Usage example:
// try {
//   await api.create(data);
// } catch (error) {
//   const message = handleApiError(error);
//   toast.error(message);
// }
