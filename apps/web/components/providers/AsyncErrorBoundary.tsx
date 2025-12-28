'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi'

interface AsyncErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface AsyncErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void; errorId?: string }>
  onError?: (error: Error, errorId: string) => void
  context?: string // e.g., 'dashboard', 'flows', 'api-call'
}

// Generate unique error ID for tracking
const generateErrorId = () => `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

class AsyncErrorBoundary extends React.Component<AsyncErrorBoundaryProps, AsyncErrorBoundaryState> {
  private retryTimeoutId?: NodeJS.Timeout

  constructor(props: AsyncErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<AsyncErrorBoundaryState> {
    const errorId = generateErrorId()
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId()

    console.error(`AsyncErrorBoundary (${this.props.context || 'unknown'}) caught an error:`, {
      error,
      errorInfo,
      errorId,
      context: this.props.context,
      timestamp: new Date().toISOString()
    })

    // Enhanced error reporting
    this.reportError(error, errorInfo, errorId)

    // Call optional error handler
    this.props.onError?.(error, errorId)
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo, errorId: string) => {
    const errorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    }

    // Send to error tracking service
    console.error('Async Error Report:', errorReport)

    // Store in sessionStorage for debugging (less persistent than localStorage)
    try {
      const existingErrors = JSON.parse(sessionStorage.getItem('asyncErrorLogs') || '[]')
      existingErrors.push(errorReport)
      // Keep only last 5 async errors per session
      if (existingErrors.length > 5) {
        existingErrors.shift()
      }
      sessionStorage.setItem('asyncErrorLogs', JSON.stringify(existingErrors))
    } catch (e) {
      // Ignore storage errors
    }
  }

  handleRetry = () => {
    // Clear any pending retry timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }

    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  handleRetryWithDelay = (delay: number = 1000) => {
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry()
    }, delay)
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.handleRetry}
            errorId={this.state.errorId}
          />
        )
      }

      return (
        <AsyncErrorFallback
          error={this.state.error}
          retry={this.handleRetry}
          errorId={this.state.errorId}
          context={this.props.context}
        />
      )
    }

    return this.props.children
  }
}

// Specialized fallback for async operations
function AsyncErrorFallback({
  error,
  retry,
  errorId,
  context
}: {
  error?: Error
  retry?: () => void
  errorId?: string
  context?: string
}) {
  const isNetworkError = error?.message?.includes('fetch') || error?.message?.includes('network')
  const isTimeoutError = error?.message?.includes('timeout') || error?.message?.includes('TimeoutError')

  return (
    <div className="flex items-center justify-center p-6 bg-muted/20 border border-destructive/20 rounded-lg">
      <Card className="max-w-md w-full p-6 text-center border-destructive/30">
        <div className="flex justify-center mb-4">
          <FiAlertTriangle className="w-10 h-10 text-destructive" />
        </div>

        <h3 className="text-lg font-semibold mb-2 text-foreground">
          {isNetworkError ? 'Lỗi kết nối' : isTimeoutError ? 'Quá thời gian chờ' : 'Lỗi xử lý'}
        </h3>

        <p className="text-muted-foreground mb-4 text-sm">
          {context && `Lỗi trong: ${context}`}
          {isNetworkError && ' - Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.'}
          {isTimeoutError && ' - Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.'}
          {!isNetworkError && !isTimeoutError && ' - Đã xảy ra lỗi không mong muốn.'}
        </p>

        {process.env.NODE_ENV === 'development' && errorId && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Error ID: {errorId}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={retry} size="sm" className="flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" />
            Thử lại
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <FiHome className="w-4 h-4" />
            Tải lại trang
          </Button>
        </div>
      </Card>
    </div>
  )
}

export { AsyncErrorBoundary, AsyncErrorFallback }
