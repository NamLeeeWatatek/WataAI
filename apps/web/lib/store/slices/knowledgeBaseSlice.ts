/**
 * Knowledge Base Redux Slice
 * Manages KB state, folders, documents, and operations
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type {
  KnowledgeBase,
  KBFolder,
  KBDocument,
  KnowledgeBaseStats,
} from '@/lib/types/knowledge-base'
import {
  getKnowledgeBase,
  getKBFolders,
  getKBDocuments,
  getKnowledgeBaseStats,
  createKBFolder,
  createKBDocument,
  updateKBFolder,
  updateKBDocument,
  deleteKBFolder,
  deleteKBDocument,
  moveKBFolder,
  moveKBDocument,
  uploadKBDocument,
  deleteKBBatch,
  moveKBBatch,
} from '@/lib/api/knowledge-base'
import { setGlobalLoading } from './uiSlice'

interface KnowledgeBaseState {
  currentKB: KnowledgeBase | null
  stats: KnowledgeBaseStats | null

  currentFolderId: string | null
  breadcrumbs: Array<{ id: string | null; name: string }>

  folders: KBFolder[]
  allFolders: KBFolder[]
  documents: KBDocument[]

  loading: boolean
  autoRefreshing: boolean
  uploading: boolean
  viewMode: 'grid' | 'table'
  searchQuery: string
  selectedIds: string[]

  // Pagination
  totalCount: number
  currentPage: number
  pageSize: number

  draggedItem: { type: 'folder' | 'document'; id: string } | null
  dragOverFolder: string | null

  error: string | null
}

const initialState: KnowledgeBaseState = {
  currentKB: null,
  stats: null,
  currentFolderId: null,
  breadcrumbs: [],
  folders: [],
  allFolders: [],
  documents: [],
  loading: false,
  autoRefreshing: false,
  uploading: false,
  viewMode: 'table',
  searchQuery: '',
  selectedIds: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  draggedItem: null,
  dragOverFolder: null,
  error: null,
}

export const loadKnowledgeBase = createAsyncThunk(
  'knowledgeBase/load',
  async ({ kbId, folderId, params }: { kbId: string; folderId?: string | null; params?: any }) => {
    const [kbRes, statsRes, foldersRes, documentsRes] = await Promise.all([
      getKnowledgeBase(kbId),
      getKnowledgeBaseStats(kbId),
      getKBFolders(kbId),
      getKBDocuments(kbId, {
        ...params,
        filters: JSON.stringify({
          ...(typeof params?.filters === 'string' ? JSON.parse(params.filters) : params?.filters),
          folderId: folderId ?? 'null'
        })
      }),
    ])

    const kb = (kbRes as any)?.data || kbRes
    const stats = (statsRes as any)?.data || statsRes
    const folders = Array.isArray(foldersRes) ? foldersRes : ((foldersRes as any)?.data || [])

    // docs can be paginated or array
    const docData = (documentsRes as any)?.data || (Array.isArray(documentsRes) ? documentsRes : [])
    const docTotal = (documentsRes as any)?.total ?? (Array.isArray(documentsRes) ? documentsRes.length : 0)

    return { kb, stats, folders, documents: docData, total: docTotal, folderId: folderId || null }
  }
)

export const refreshData = createAsyncThunk(
  'knowledgeBase/refresh',
  async ({ kbId, folderId, params }: { kbId: string; folderId?: string | null; params?: any }) => {
    const [statsRes, foldersRes, documentsRes] = await Promise.all([
      getKnowledgeBaseStats(kbId),
      getKBFolders(kbId),
      getKBDocuments(kbId, {
        ...params,
        filters: JSON.stringify({
          ...(typeof params?.filters === 'string' ? JSON.parse(params.filters) : params?.filters),
          folderId: folderId ?? 'null'
        })
      }),
    ])

    const stats = (statsRes as any)?.data || statsRes
    const folders = Array.isArray(foldersRes) ? foldersRes : ((foldersRes as any)?.data || [])
    const docData = (documentsRes as any)?.data || (Array.isArray(documentsRes) ? documentsRes : [])
    const docTotal = (documentsRes as any)?.total ?? (Array.isArray(documentsRes) ? documentsRes.length : 0)

    return { stats, folders, documents: docData, total: docTotal }
  }
)

export const createFolder = createAsyncThunk(
  'knowledgeBase/createFolder',
  async (data: {
    knowledgeBaseId: string
    name: string
    description?: string
    parentFolderId?: string | null
  }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'create-folder', isLoading: true, message: 'Creating folder' }))
    try {
      const folder = await createKBFolder(data)
      return folder
    } finally {
      dispatch(setGlobalLoading({ actionId: 'create-folder', isLoading: false }))
    }
  }
)

export const createDocument = createAsyncThunk(
  'knowledgeBase/createDocument',
  async (data: {
    knowledgeBaseId: string
    name: string
    content: string
    folderId?: string | null
  }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'create-document', isLoading: true, message: 'Creating document' }))
    try {
      const document = await createKBDocument(data)
      return document
    } finally {
      dispatch(setGlobalLoading({ actionId: 'create-document', isLoading: false }))
    }
  }
)

export const uploadDocument = createAsyncThunk(
  'knowledgeBase/uploadDocument',
  async (data: { file: File; kbId: string; folderId?: string | null }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: `upload-${data.file.name}`, isLoading: true, message: `Uploading ${data.file.name}` }))
    try {
      const result = await uploadKBDocument(data.file, data.kbId, data.folderId);
      return result;
    } finally {
      dispatch(setGlobalLoading({ actionId: `upload-${data.file.name}`, isLoading: false }))
    }
  }
)

export const updateFolder = createAsyncThunk(
  'knowledgeBase/updateFolder',
  async (data: { id: string; updates: { name?: string; description?: string; icon?: string } }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'update-folder', isLoading: true, message: 'Updating folder' }))
    try {
      const folder = await updateKBFolder(data.id, data.updates)
      return folder
    } finally {
      dispatch(setGlobalLoading({ actionId: 'update-folder', isLoading: false }))
    }
  }
)

export const updateDocument = createAsyncThunk(
  'knowledgeBase/updateDocument',
  async (data: { id: string; updates: { name?: string; description?: string; icon?: string } }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'update-document', isLoading: true, message: 'Updating document' }))
    try {
      const document = await updateKBDocument(data.id, data.updates)
      return document
    } finally {
      dispatch(setGlobalLoading({ actionId: 'update-document', isLoading: false }))
    }
  }
)

export const removeFolder = createAsyncThunk(
  'knowledgeBase/removeFolder',
  async (id: string, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'remove-folder', isLoading: true, message: 'Removing folder' }))
    try {
      await deleteKBFolder(id)
      return id
    } finally {
      dispatch(setGlobalLoading({ actionId: 'remove-folder', isLoading: false }))
    }
  }
)

export const removeDocument = createAsyncThunk(
  'knowledgeBase/removeDocument',
  async (id: string, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'remove-document', isLoading: true, message: 'Removing document' }))
    try {
      await deleteKBDocument(id)
      return id
    } finally {
      dispatch(setGlobalLoading({ actionId: 'remove-document', isLoading: false }))
    }
  }
)

export const moveFolderToFolder = createAsyncThunk(
  'knowledgeBase/moveFolder',
  async (data: { folderId: string; targetFolderId: string | null }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'move-folder', isLoading: true, message: 'Moving folder' }))
    try {
      await moveKBFolder(data.folderId, data.targetFolderId)
      return data
    } finally {
      dispatch(setGlobalLoading({ actionId: 'move-folder', isLoading: false }))
    }
  }
)

export const moveDocumentToFolder = createAsyncThunk(
  'knowledgeBase/moveDocument',
  async (data: { documentId: string; targetFolderId: string | null }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'move-document', isLoading: true, message: 'Moving document' }))
    try {
      await moveKBDocument(data.documentId, data.targetFolderId)
      return data
    } finally {
      dispatch(setGlobalLoading({ actionId: 'move-document', isLoading: false }))
    }
  }
)

export const removeBatchItems = createAsyncThunk(
  'knowledgeBase/removeBatchItems',
  async (data: { folderIds: string[]; documentIds: string[] }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'remove-batch', isLoading: true, message: 'Deleting items' }))
    try {
      await deleteKBBatch(data)
      return data
    } finally {
      dispatch(setGlobalLoading({ actionId: 'remove-batch', isLoading: false }))
    }
  }
)

export const moveBatchItems = createAsyncThunk(
  'knowledgeBase/moveBatchItems',
  async (data: { folderIds: string[]; documentIds: string[]; targetFolderId: string | null }, { dispatch }) => {
    dispatch(setGlobalLoading({ actionId: 'move-batch', isLoading: true, message: 'Moving items' }))
    try {
      await moveKBBatch(data)
      return data
    } finally {
      dispatch(setGlobalLoading({ actionId: 'move-batch', isLoading: false }))
    }
  }
)

const knowledgeBaseSlice = createSlice({
  name: 'knowledgeBase',
  initialState,
  reducers: {
    setCurrentFolder: (state, action: PayloadAction<string | null>) => {
      state.currentFolderId = action.payload
    },

    navigateToFolder: (state, action: PayloadAction<{ id: string; name: string }>) => {
      state.breadcrumbs.push(action.payload)
      state.currentFolderId = action.payload.id
    },

    navigateToBreadcrumb: (state, action: PayloadAction<number>) => {
      const index = action.payload
      if (index === -1) {
        state.breadcrumbs = []
        state.currentFolderId = null
      } else {
        state.breadcrumbs = state.breadcrumbs.slice(0, index + 1)
        state.currentFolderId = state.breadcrumbs[index].id
      }
    },

    setViewMode: (state, action: PayloadAction<'grid' | 'table'>) => {
      state.viewMode = action.payload
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    toggleSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const index = state.selectedIds.indexOf(id)
      if (index > -1) {
        state.selectedIds.splice(index, 1)
      } else {
        state.selectedIds.push(id)
      }
    },

    toggleSelectAll: (state, action: PayloadAction<boolean | undefined>) => {
      const allIds = [...state.folders.map(f => f.id), ...state.documents.map(d => d.id)]
      if (action.payload === true) {
        state.selectedIds = allIds
      } else if (action.payload === false) {
        state.selectedIds = []
      } else {
        // Toggle behavior if no payload
        if (state.selectedIds.length === allIds.length) {
          state.selectedIds = []
        } else {
          state.selectedIds = allIds
        }
      }
    },

    clearSelection: (state) => {
      state.selectedIds = []
    },

    setDraggedItem: (state, action: PayloadAction<{ type: 'folder' | 'document'; id: string } | null>) => {
      state.draggedItem = action.payload
    },

    setDragOverFolder: (state, action: PayloadAction<string | null>) => {
      state.dragOverFolder = action.payload
    },

    setAutoRefreshing: (state, action: PayloadAction<boolean>) => {
      state.autoRefreshing = action.payload
    },

    setPagination: (state, action: PayloadAction<{ page: number; pageSize: number }>) => {
      state.currentPage = action.payload.page
      state.pageSize = action.payload.pageSize
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },

    resetState: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      .addCase(loadKnowledgeBase.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadKnowledgeBase.fulfilled, (state, action) => {
        state.loading = false
        state.currentKB = action.payload.kb
        state.stats = action.payload.stats
        state.currentFolderId = action.payload.folderId

        const folders = Array.isArray(action.payload.folders) ? action.payload.folders : []
        state.allFolders = folders

        if (action.payload.folderId === null) {
          state.folders = folders.filter(f => !f.parentId && !f.parentFolderId)
        } else {
          state.folders = folders.filter(
            f => f.parentId === action.payload.folderId || f.parentFolderId === action.payload.folderId
          )
        }

        state.documents = action.payload.documents
        state.totalCount = action.payload.total
      })
      .addCase(loadKnowledgeBase.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load knowledge base'
      })

    builder
      .addCase(refreshData.fulfilled, (state, action) => {
        state.stats = action.payload.stats

        const folders = Array.isArray(action.payload.folders) ? action.payload.folders : []
        state.allFolders = folders

        if (state.currentFolderId === null) {
          state.folders = folders.filter(f => !f.parentId && !f.parentFolderId)
        } else {
          state.folders = folders.filter(
            f => f.parentId === state.currentFolderId || f.parentFolderId === state.currentFolderId
          )
        }

        state.documents = action.payload.documents
        state.totalCount = action.payload.total
      })

    builder
      .addCase(createFolder.fulfilled, (state, action) => {
        state.folders.push(action.payload)
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create folder'
      })

    builder
      .addCase(createDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload)
      })
      .addCase(createDocument.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to create document'
      })

    builder
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload)
      })
      .addCase(uploadDocument.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to upload document'
      })

    builder
      .addCase(updateFolder.fulfilled, (state, action) => {
        const index = state.folders.findIndex(f => f.id === action.payload.id)
        if (index !== -1) {
          state.folders[index] = action.payload
        }
      })

    builder
      .addCase(updateDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(d => d.id === action.payload.id)
        if (index !== -1) {
          state.documents[index] = action.payload
        }
      })

    builder
      .addCase(removeFolder.fulfilled, (state, action) => {
        state.folders = state.folders.filter(f => f.id !== action.payload)
        state.selectedIds = state.selectedIds.filter(id => id !== action.payload)
      })
      .addCase(removeFolder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete folder'
      })

    builder
      .addCase(removeDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(d => d.id !== action.payload)
        state.selectedIds = state.selectedIds.filter(id => id !== action.payload)
      })
      .addCase(removeDocument.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete document'
      })

    builder
      .addCase(removeBatchItems.fulfilled, (state, action) => {
        const { folderIds, documentIds } = action.payload
        if (folderIds?.length) {
          state.folders = state.folders.filter(f => !folderIds.includes(f.id))
          state.selectedIds = state.selectedIds.filter(id => !folderIds.includes(id))
        }
        if (documentIds?.length) {
          state.documents = state.documents.filter(d => !documentIds.includes(d.id))
          state.selectedIds = state.selectedIds.filter(id => !documentIds.includes(id))
        }
      })
      .addCase(removeBatchItems.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to batch delete items'
      })

    builder
      .addCase(moveBatchItems.fulfilled, (state, action) => {
        const { folderIds, documentIds, targetFolderId } = action.payload
        if (targetFolderId !== state.currentFolderId) {
          if (folderIds?.length) {
            state.folders = state.folders.filter(f => !folderIds.includes(f.id))
          }
          if (documentIds?.length) {
            state.documents = state.documents.filter(d => !documentIds.includes(d.id))
          }
          state.selectedIds = []
        }
      })
      .addCase(moveBatchItems.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to batch move items'
      })
  },
})

export const {
  setCurrentFolder,
  navigateToFolder,
  navigateToBreadcrumb,
  setViewMode,
  setSearchQuery,
  toggleSelection,
  toggleSelectAll,
  clearSelection,
  setDraggedItem,
  setDragOverFolder,
  setAutoRefreshing,
  setPagination,
  setCurrentPage,
  resetState,
} = knowledgeBaseSlice.actions

export const selectCurrentKB = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.currentKB
export const selectStats = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.stats
export const selectFolders = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.folders
export const selectAllFolders = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.allFolders
export const selectDocuments = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.documents
export const selectLoading = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.loading
export const selectAutoRefreshing = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.autoRefreshing
export const selectViewMode = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.viewMode
export const selectSearchQuery = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.searchQuery
export const selectSelectedIds = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.selectedIds
export const selectBreadcrumbs = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.breadcrumbs
export const selectCurrentFolderId = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.currentFolderId
export const selectDraggedItem = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.draggedItem
export const selectDragOverFolder = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.dragOverFolder
export const selectPagination = (state: { knowledgeBase: KnowledgeBaseState }) => ({
  currentPage: state.knowledgeBase.currentPage,
  pageSize: state.knowledgeBase.pageSize,
  totalCount: state.knowledgeBase.totalCount,
})
export const selectTotalCount = (state: { knowledgeBase: KnowledgeBaseState }) => state.knowledgeBase.totalCount

export const selectFilteredFolders = (state: { knowledgeBase: KnowledgeBaseState }) => {
  const { folders, searchQuery } = state.knowledgeBase
  if (!searchQuery) return folders
  return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
}

export const selectFilteredDocuments = (state: { knowledgeBase: KnowledgeBaseState }) => {
  return state.knowledgeBase.documents
}

export const selectHasProcessingDocuments = (state: { knowledgeBase: KnowledgeBaseState }) => {
  return state.knowledgeBase.documents.some(doc => doc.processingStatus === 'processing')
}

export default knowledgeBaseSlice.reducer
