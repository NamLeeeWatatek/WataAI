'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry?: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo)
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real app, you would send this to your error tracking service
    // For now, we'll just log it with additional context
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    // Send to error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    console.error('Error Report:', errorReport)

    // You could also store in localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]')
      existingErrors.push(errorReport)
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift()
      }
      localStorage.setItem('errorLogs', JSON.stringify(existingErrors))
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.handleRetry} />
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: { error?: Error; retry?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-6 text-center">
        <div className="flex justify-center mb-4">
          <FiAlertTriangle className="w-12 h-12 text-destructive" />
        </div>

        <h2 className="text-xl font-semibold mb-2 text-foreground">
          Đã xảy ra lỗi
        </h2>

        <p className="text-muted-foreground mb-6">
          Xin lỗi, đã có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
        </p>

        {process.env.NODE_ENV === 'development' && error && (
          <details className="mb-4 text-left bg-muted p-3 rounded text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              Chi tiết lỗi (Development)
            </summary>
            <pre className="whitespace-pre-wrap text-xs">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={retry} className="flex items-center gap-2">
            <FiRefreshCw className="w-4 h-4" />
            Thử lại
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Về trang chủ
          </Button>
        </div>
      </Card>
    </div>
  )
}

export { ErrorBoundary, DefaultErrorFallback }
