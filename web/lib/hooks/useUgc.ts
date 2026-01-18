import { useState } from 'react';
import { ugcApi, RunUgcDto, UgcGenerationResult } from '@/lib/api/ugc';

export function useUgc() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generate = async (data: RunUgcDto): Promise<UgcGenerationResult> => {
        setLoading(true);
        setError(null);
        try {
            const result = await ugcApi.generate(data);
            return result;
        } catch (err: any) {
            setError(err.message || 'Generation failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        generate,
        loading,
        error
    };
}
