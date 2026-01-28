import { create } from 'zustand'
import { Channel, ChannelPage, Bot } from '@/lib/types'

interface ChannelsState {
    // Facebook specific state
    facebookPages: ChannelPage[]
    facebookTempToken: string
    connectingPage: string | null

    // Bot selection for Facebook
    bots: Bot[]
    selectedBotId: string
    loadingBots: boolean

    // UI state
    activeTab: 'connected' | 'configurations'
    disconnectId: string | null
    deleteConfigId: string | null
    assignBotDialogOpen: boolean
    selectedChannel: Channel | null
    error: string | null

    // Actions
    setFacebookPages: (pages: any[]) => void
    setFacebookTempToken: (token: string) => void
    setConnectingPage: (id: string | null) => void
    removeFacebookPage: (id: string) => void
    setBots: (bots: any[]) => void
    setSelectedBotId: (id: string) => void
    setLoadingBots: (isLoading: boolean) => void
    setActiveTab: (tab: 'connected' | 'configurations') => void
    setDisconnectId: (id: string | null) => void
    setDeleteConfigId: (id: string | null) => void
    setAssignBotDialogOpen: (open: boolean) => void
    setSelectedChannel: (channel: any) => void
    setError: (error: string | null) => void
    clearFacebookState: () => void
    resetState: () => void
}

const initialState = {
    facebookPages: [],
    facebookTempToken: '',
    connectingPage: null,
    bots: [],
    selectedBotId: '',
    loadingBots: false,
    activeTab: 'connected' as const,
    disconnectId: null,
    deleteConfigId: null,
    assignBotDialogOpen: false,
    selectedChannel: null,
    error: null,
}

export const useChannelsStore = create<ChannelsState>((set) => ({
    ...initialState,

    setFacebookPages: (pages) => set({ facebookPages: pages }),
    setFacebookTempToken: (token) => set({ facebookTempToken: token }),
    setConnectingPage: (id) => set({ connectingPage: id }),
    removeFacebookPage: (id) =>
        set((state) => ({
            facebookPages: state.facebookPages.filter((p) => p.id !== id),
        })),
    setBots: (bots) => set((state) => ({
        bots,
        selectedBotId: bots.length > 0 && !state.selectedBotId ? bots[0].id : state.selectedBotId
    })),
    setSelectedBotId: (id) => set({ selectedBotId: id }),
    setLoadingBots: (isLoading) => set({ loadingBots: isLoading }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setDisconnectId: (id) => set({ disconnectId: id }),
    setDeleteConfigId: (id) => set({ deleteConfigId: id }),
    setAssignBotDialogOpen: (open) => set({ assignBotDialogOpen: open }),
    setSelectedChannel: (channel) => set({ selectedChannel: channel }),
    setError: (error) => set({ error }),
    clearFacebookState: () =>
        set({
            facebookPages: [],
            facebookTempToken: '',
            bots: [],
            selectedBotId: '',
        }),
    resetState: () => set(initialState),
}))
