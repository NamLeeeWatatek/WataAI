'use client'
import { Provider } from 'react-redux'
import { store } from './index'

import { WorkspaceInitializer } from '@/components/providers/WorkspaceInitializer';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}

