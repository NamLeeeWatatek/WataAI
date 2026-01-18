/**
 * Workspace Redux Slice
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Workspace } from '@/lib/types/workspace';

interface WorkspaceState {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkspaceState = {
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action: PayloadAction<Workspace | null>) => {
      state.currentWorkspace = action.payload;
    },
    setWorkspaces: (state, action: PayloadAction<Workspace[]>) => {
      state.workspaces = action.payload;
      if (!state.currentWorkspace && action.payload.length > 0) {
        state.currentWorkspace = action.payload[0];
      }
    },
    addWorkspace: (state, action: PayloadAction<Workspace>) => {
      state.workspaces.push(action.payload);
    },
    updateWorkspace: (state, action: PayloadAction<Workspace>) => {
      const index = state.workspaces.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.workspaces[index] = action.payload;
      }
      if (state.currentWorkspace?.id === action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    },
    removeWorkspace: (state, action: PayloadAction<string>) => {
      state.workspaces = state.workspaces.filter(w => w.id !== action.payload);
      if (state.currentWorkspace?.id === action.payload) {
        state.currentWorkspace = state.workspaces[0] || null;
      }
    },
    switchWorkspace: (state, action: PayloadAction<string>) => {
      const workspace = state.workspaces.find(w => w.id === action.payload);
      if (workspace) {
        state.currentWorkspace = workspace;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearWorkspaces: (state) => {
      state.currentWorkspace = null;
      state.workspaces = [];
      state.error = null;
    },
  },
});

export const {
  setCurrentWorkspace,
  setWorkspaces,
  addWorkspace,
  updateWorkspace,
  removeWorkspace,
  switchWorkspace,
  setLoading,
  setError,
  clearWorkspaces,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
