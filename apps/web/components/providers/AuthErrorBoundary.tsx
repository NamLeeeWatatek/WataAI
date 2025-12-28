'use client'

import React, { Component, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo)

    // Check if it's an auth-related error
    if (error.message.includes('authentication') ||
        error.message.includes('unauthorized') ||
        error.message.includes('token')) {
      console.log('Auth error detected, will redirect to login')
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  handleGoToLogin = () => {
    window.location.href = '/login'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full mx-4">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Authentication Error
                </h1>
                <p className="text-muted-foreground">
                  There was a problem with your authentication. This might be due to an expired session or network issue.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted p-4 rounded-lg text-left">
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoToLogin}>
                  Go to Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapper component to use hooks
export function AuthErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return <AuthErrorBoundary>{children}</AuthErrorBoundary>
}
