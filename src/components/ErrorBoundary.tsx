import React, { ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { errorHandler } from '../lib/errorHandler';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches errors in child components and displays a user-friendly error UI
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error handler
    errorHandler.handle(error, 'COMPONENT_ERROR', 'error', {
      componentStack: errorInfo.componentStack,
    });

    console.error('Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-surface border border-white/10 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-foreground mb-2">
                Something went wrong
              </h2>

              <p className="text-sm text-foreground/70 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>

              <details className="mb-6 text-left">
                <summary className="text-xs text-foreground/60 cursor-pointer hover:text-foreground/80">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-black/50 p-2 rounded overflow-auto max-h-40 text-red-400/80">
                  {this.state.error?.stack}
                </pre>
              </details>

              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
