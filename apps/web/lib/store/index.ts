/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit'
import uiReducer from './slices/uiSlice'
import knowledgeBaseReducer from './slices/knowledgeBaseSlice'
import ugcFactoryReducer from './slices/ugcFactorySlice'
import messagesReducer from './slices/messagesSlice'
import { listenerMiddleware } from './middleware/listenerMiddleware'

import workspaceReducer from './slices/workspaceSlice'
import notificationsReducer from './slices/notificationsSlice'
import channelsReducer from './slices/channelsSlice'

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    knowledgeBase: knowledgeBaseReducer,
    ugcFactory: ugcFactoryReducer,
    messages: messagesReducer,
    workspace: workspaceReducer,
    notifications: notificationsReducer,
    channels: channelsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'knowledgeBase/toggleSelection',
          'knowledgeBase/toggleSelectAll',
        ],
        ignoredActionPaths: ['payload.selectedIds'],
        ignoredPaths: [
          'knowledgeBase.selectedIds',
        ],
      },
    }).prepend(listenerMiddleware.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
