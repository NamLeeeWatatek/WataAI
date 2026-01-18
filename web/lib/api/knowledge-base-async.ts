import { createAsyncThunk } from '@reduxjs/toolkit'
import { uploadKBDocument } from './knowledge-base'
export const uploadDocumentWithLoading = createAsyncThunk(
    'knowledgeBase/uploadDocument',
    async (
        payload: { file: File; kbId: string; folderId?: string },
        { dispatch }
    ) => {
        const { file, kbId, folderId } = payload

        try {
            // Call API - throws error if failed
            const result = await uploadKBDocument(file, kbId, folderId)
            return result
        } catch (error) {
            // Global loading stops automatically via middleware
            throw error
        }
    }
)