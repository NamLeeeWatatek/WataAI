import * as z from 'zod';

// Schema Definition
export const templateFormSchema = z.object({
    name: z.string().min(1, 'Template name is required'),
    description: z.string().optional(),
    creationToolId: z.string().min(1, 'Creation tool is required'),
    thumbnailUrl: z.string().optional(),
    icon: z.string().optional(),
    // file or blob for preview is handled by CoverUpload returning url, but we might keep file for some logic
    // but strictly speaking form values usually track what we send to backend.
    // The original had previewFile.
    previewFile: (typeof File !== 'undefined' ? z.instanceof(File) : z.any()).optional().nullable(),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;
