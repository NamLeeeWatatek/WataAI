/**
 * Channels Redux Slice
 * Manages channels and integrations state
 * Uses Redux Toolkit 2.0 patterns with async actions in slice
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Channel, IntegrationConfig } from '@/lib/types';
import {
  getChannels,
  getIntegrations,
  createIntegration,
  updateIntegration,
  deleteIntegration,
  disconnectChannel,
} from '@/lib/api/channels';
import { axiosClient } from '@/lib/axios-client';
import { setGlobalLoading } from './uiSlice';

// Async actions defined in slice (Redux Toolkit 2.0 style)
export const loadChannelsData = createAsyncThunk(
  'channels/loadData',
  async (_, { rejectWithValue }) => {
    try {
      const [channelsData, configsData] = await Promise.all([
        getChannels(),
        getIntegrations()
      ]);

      return {
        channels: channelsData,
        configs: configsData
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load channels data');
    }
  }
);

export const disconnectChannelAsync = createAsyncThunk(
  'channels/disconnect',
  async (channelId: string, { dispatch, rejectWithValue }) => {
    dispatch(setGlobalLoading({ actionId: 'disconnect-channel', isLoading: true, message: 'Disconnecting channel' }))
    try {
      await disconnectChannel(channelId);
      return channelId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to disconnect channel');
    } finally {
      dispatch(setGlobalLoading({ actionId: 'disconnect-channel', isLoading: false }))
    }
  }
);

export const deleteConfigAsync = createAsyncThunk(
  'channels/deleteConfig',
  async (configId: number, { dispatch, rejectWithValue }) => {
    dispatch(setGlobalLoading({ actionId: 'delete-config', isLoading: true, message: 'Deleting configuration' }))
    try {
      await deleteIntegration(configId);
      return configId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete configuration');
    } finally {
      dispatch(setGlobalLoading({ actionId: 'delete-config', isLoading: false }))
    }
  }
);

export const createConfigAsync = createAsyncThunk(
  'channels/createConfig',
  async (data: any, { dispatch, rejectWithValue }) => {
    dispatch(setGlobalLoading({ actionId: 'create-config', isLoading: true, message: 'Creating configuration' }))
    try {
      const config = await createIntegration(data);
      return config;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create configuration');
    } finally {
      dispatch(setGlobalLoading({ actionId: 'create-config', isLoading: false }))
    }
  }
);

export const updateConfigAsync = createAsyncThunk(
  'channels/updateConfig',
  async ({ id, data }: { id: number; data: any }, { dispatch, rejectWithValue }) => {
    dispatch(setGlobalLoading({ actionId: 'update-config', isLoading: true, message: 'Updating configuration' }))
    try {
      const config = await updateIntegration(id, data);
      return config;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update configuration');
    } finally {
      dispatch(setGlobalLoading({ actionId: 'update-config', isLoading: false }))
    }
  }
);

export const loadBotsForFacebook = createAsyncThunk(
  'channels/loadBotsForFacebook',
  async (workspaceId: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.get<any>(`/bots?workspaceId=${workspaceId}`) as unknown as any;

      let botsList = [];
      if (Array.isArray(response)) {
        botsList = response;
      } else if (response?.items && Array.isArray(response.items)) {
        botsList = response.items;
      }

      return botsList;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load bots');
    }
  }
);

export const connectFacebookPage = createAsyncThunk(
  'channels/connectFacebookPage',
  async ({ page, botId, tempToken }: { page: any; botId: string; tempToken: string }, { dispatch, rejectWithValue }) => {
    dispatch(setGlobalLoading({ actionId: 'connect-fb', isLoading: true, message: 'Connecting Facebook page' }))
    try {
      const response = await axiosClient.post('/channels/facebook/connect', {
        pageId: page.id,
        pageName: page.name,
        userAccessToken: tempToken,
        category: page.category,
        botId: botId
      });

      return {
        pageId: page.id,
        response: response
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to connect page');
    } finally {
      dispatch(setGlobalLoading({ actionId: 'connect-fb', isLoading: false }))
    }
  }
);

interface ChannelsState {
  channels: Channel[];
  configs: IntegrationConfig[];
  isLoading: boolean;
  isConnecting: string | null;
  error: string | null;
  // Facebook specific state
  facebookPages: any[];
  facebookTempToken: string;
  connectingPage: boolean;
  // Bot selection for Facebook
  bots: any[];
  selectedBotId: string;
  loadingBots: boolean;
  // UI state
  activeTab: 'connected' | 'configurations';
  disconnectId: string | null;
  deleteConfigId: number | null;
  assignBotDialogOpen: boolean;
  selectedChannel: any;
}

const initialState: ChannelsState = {
  channels: [],
  configs: [],
  isLoading: false,
  isConnecting: null,
  error: null,
  facebookPages: [],
  facebookTempToken: '',
  connectingPage: false,
  bots: [],
  selectedBotId: '',
  loadingBots: false,
  activeTab: 'connected',
  disconnectId: null,
  deleteConfigId: null,
  assignBotDialogOpen: false,
  selectedChannel: null,
};

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    // Loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setConnecting: (state, action: PayloadAction<string | null>) => {
      state.isConnecting = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Data management
    setChannels: (state, action: PayloadAction<Channel[]>) => {
      state.channels = action.payload;
    },
    setConfigs: (state, action: PayloadAction<IntegrationConfig[]>) => {
      state.configs = action.payload;
    },
    addChannel: (state, action: PayloadAction<Channel>) => {
      state.channels.push(action.payload);
    },
    removeChannel: (state, action: PayloadAction<string>) => {
      state.channels = state.channels.filter(c => c.id !== action.payload);
    },
    updateChannel: (state, action: PayloadAction<Channel>) => {
      const index = state.channels.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.channels[index] = action.payload;
      }
    },
    addConfig: (state, action: PayloadAction<IntegrationConfig>) => {
      state.configs.push(action.payload);
    },
    updateConfig: (state, action: PayloadAction<IntegrationConfig>) => {
      const index = state.configs.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.configs[index] = action.payload;
      }
    },
    removeConfig: (state, action: PayloadAction<number>) => {
      state.configs = state.configs.filter(c => c.id !== action.payload);
    },

    // Facebook specific
    setFacebookPages: (state, action: PayloadAction<any[]>) => {
      state.facebookPages = action.payload;
    },
    setFacebookTempToken: (state, action: PayloadAction<string>) => {
      state.facebookTempToken = action.payload;
    },
    setConnectingPage: (state, action: PayloadAction<boolean>) => {
      state.connectingPage = action.payload;
    },
    removeFacebookPage: (state, action: PayloadAction<string>) => {
      state.facebookPages = state.facebookPages.filter(p => p.id !== action.payload);
    },
    clearFacebookState: (state) => {
      state.facebookPages = [];
      state.facebookTempToken = '';
      state.bots = [];
      state.selectedBotId = '';
    },

    // Bot management
    setBots: (state, action: PayloadAction<any[]>) => {
      state.bots = action.payload;
      if (action.payload.length > 0 && !state.selectedBotId) {
        state.selectedBotId = action.payload[0].id;
      }
    },
    setSelectedBotId: (state, action: PayloadAction<string>) => {
      state.selectedBotId = action.payload;
    },
    setLoadingBots: (state, action: PayloadAction<boolean>) => {
      state.loadingBots = action.payload;
    },

    // UI state
    setActiveTab: (state, action: PayloadAction<'connected' | 'configurations'>) => {
      state.activeTab = action.payload;
    },
    setDisconnectId: (state, action: PayloadAction<string | null>) => {
      state.disconnectId = action.payload;
    },
    setDeleteConfigId: (state, action: PayloadAction<number | null>) => {
      state.deleteConfigId = action.payload;
    },
    setAssignBotDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.assignBotDialogOpen = action.payload;
    },
    setSelectedChannel: (state, action: PayloadAction<any>) => {
      state.selectedChannel = action.payload;
    },

    // Reset state
    resetState: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    // Load channels data
    builder
      .addCase(loadChannelsData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadChannelsData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.channels = action.payload.channels;
        state.configs = action.payload.configs;
      })
      .addCase(loadChannelsData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Disconnect channel
      .addCase(disconnectChannelAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(disconnectChannelAsync.fulfilled, (state, action) => {
        state.channels = state.channels.filter(c => c.id !== action.payload);
      })
      .addCase(disconnectChannelAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Delete config
      .addCase(deleteConfigAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteConfigAsync.fulfilled, (state, action) => {
        state.configs = state.configs.filter(c => c.id !== action.payload);
      })
      .addCase(deleteConfigAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Create config
      .addCase(createConfigAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(createConfigAsync.fulfilled, (state, action) => {
        state.configs.push(action.payload);
      })
      .addCase(createConfigAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Update config
      .addCase(updateConfigAsync.pending, (state) => {
        state.error = null;
      })
      .addCase(updateConfigAsync.fulfilled, (state, action) => {
        const index = state.configs.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.configs[index] = action.payload;
        }
      })
      .addCase(updateConfigAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Load bots for Facebook
      .addCase(loadBotsForFacebook.pending, (state) => {
        state.loadingBots = true;
        state.error = null;
      })
      .addCase(loadBotsForFacebook.fulfilled, (state, action) => {
        state.loadingBots = false;
        state.bots = action.payload;
        if (action.payload.length > 0 && !state.selectedBotId) {
          state.selectedBotId = action.payload[0].id;
        }
      })
      .addCase(loadBotsForFacebook.rejected, (state, action) => {
        state.loadingBots = false;
        state.error = action.payload as string;
      })

      // Connect Facebook page
      .addCase(connectFacebookPage.pending, (state) => {
        state.connectingPage = true;
        state.error = null;
      })
      .addCase(connectFacebookPage.fulfilled, (state, action) => {
        state.connectingPage = false;
        state.facebookPages = state.facebookPages.filter(p => p.id !== action.payload.pageId);
        // Reload channels data will be handled by component
      })
      .addCase(connectFacebookPage.rejected, (state, action) => {
        state.connectingPage = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setLoading,
  setConnecting,
  setError,
  setChannels,
  setConfigs,
  addChannel,
  removeChannel,
  updateChannel,
  addConfig,
  updateConfig,
  removeConfig,
  setFacebookPages,
  setFacebookTempToken,
  setConnectingPage,
  removeFacebookPage,
  clearFacebookState,
  setBots,
  setSelectedBotId,
  setLoadingBots,
  setActiveTab,
  setDisconnectId,
  setDeleteConfigId,
  setAssignBotDialogOpen,
  setSelectedChannel,
  resetState,
} = channelsSlice.actions;

export default channelsSlice.reducer;
