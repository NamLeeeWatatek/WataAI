import * as z from 'zod'

export const kbFormSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    isPublic: z.boolean(),
    aiConfigId: z.string().optional(),
    ragModel: z.string().optional(),
    embeddingConfigId: z.string().optional(),
    embeddingModel: z.string().optional(),
    useSystemAI: z.boolean().optional(),
    chunkSize: z.number().min(100, 'Chunk size must be at least 100').max(10000),
    chunkOverlap: z.number().min(0, 'Overlap cannot be negative').max(1000),
    aiParameters: z.object({
        temperature: z.number().min(0).max(2),
        maxTokens: z.number().min(1).max(128000),
    }),
})

export type KbFormValues = z.infer<typeof kbFormSchema>
