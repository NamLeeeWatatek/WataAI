/**
 * UGC Factory Redux Slice
 */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { ugcApi } from '@/lib/api/ugc'
import { setGlobalLoading } from './uiSlice'
import type { Execution } from '@/lib/types'

interface UGCArtifact {
    id: string
    execution_id: string
    file_id: string
    artifact_type: 'image' | 'video' | 'audio' | 'document' | 'text' | 'other'
    name: string
    description?: string
    metadata?: Record<string, any>
    size?: number
    mime_type?: string
    download_url: string
    created_at: string
    updated_at: string
}

interface UGCFactoryState {
    artifacts: UGCArtifact[]
    executions: Execution[]
    loading: boolean
    error: string | null
}

const initialState: UGCFactoryState = {
    artifacts: [],
    executions: [],
    loading: false,
    error: null,
}

export const deleteArtifact = createAsyncThunk<string, string>(
    'ugcFactory/deleteArtifact',
    async (artifactId: string, { dispatch }) => {
        dispatch(setGlobalLoading({ actionId: 'delete-artifact', isLoading: true, message: 'Deleting artifact' }))
        try {
            // Note: This assumes the UGCFactoryService has a deleteArtifact method
            // If not, we'll need to add it or use direct axios call temporarily
            await ugcApi.deleteArtifact(artifactId)
            return artifactId
        } finally {
            dispatch(setGlobalLoading({ actionId: 'delete-artifact', isLoading: false }))
        }
    }
)

export const fetchExecutionArtifacts = createAsyncThunk<UGCArtifact[], string>(
    'ugcFactory/fetchExecutionArtifacts',
    async (executionId: string) => {
        return await ugcApi.getExecutionArtifacts(executionId)
    }
)

export const fetchExecutions = createAsyncThunk<Execution[], { flowId: string; limit?: number }>(
    'ugcFactory/fetchExecutions',
    async ({ flowId, limit = 50 }) => {
        return await ugcApi.getExecutions(flowId, limit)
    }
)

export const fetchExecutionsByFlowId = createAsyncThunk<Execution[], { flowId: string; limit?: number }>(
    'ugcFactory/fetchExecutionsByFlowId',
    async ({ flowId, limit = 100 }) => {
        return await ugcApi.getExecutions(flowId, limit)
    }
)

const ugcFactorySlice = createSlice({
    name: 'ugcFactory',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        },
        setArtifacts: (state, action: PayloadAction<UGCArtifact[]>) => {
            state.artifacts = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchExecutionArtifacts.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchExecutionArtifacts.fulfilled, (state, action) => {
                state.loading = false
                state.artifacts = action.payload
            })
            .addCase(fetchExecutionArtifacts.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to fetch artifacts'
            })

        builder
            .addCase(fetchExecutions.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchExecutions.fulfilled, (state, action) => {
                state.loading = false
                state.executions = action.payload
            })
            .addCase(fetchExecutions.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to fetch executions'
            })

        builder
            .addCase(deleteArtifact.fulfilled, (state, action) => {
                // Remove the deleted artifact from state
                state.artifacts = state.artifacts.filter(artifact => artifact.id !== action.payload)
            })
            .addCase(deleteArtifact.rejected, (state, action) => {
                state.error = action.error.message || 'Failed to delete artifact'
            })
    },
})

export const { clearError, setArtifacts } = ugcFactorySlice.actions
export default ugcFactorySlice.reducer
