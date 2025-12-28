// API Error Types
export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public errors?: Record<string, any>
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

        // Axios error
        if (err.response?.data?.message) {
            return err.response.data.message;
        }

        // Standard error
        if (err.message) {
            return err.message;
        }
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
