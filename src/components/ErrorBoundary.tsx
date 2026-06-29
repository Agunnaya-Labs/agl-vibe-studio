import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleNavigateHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-red-500/20 rounded-xl p-8 shadow-2xl">
              <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 rounded-lg mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              
              <h2 className="text-xl font-bold text-center text-white mb-2">
                Something went wrong
              </h2>
              
              <p className="text-sm text-gray-400 text-center mb-4">
                An unexpected error occurred. Please try again or return to the home page.
              </p>

              <details className="mb-6 text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-400 mb-2">
                  Error details
                </summary>
                <pre className="bg-slate-900/50 p-3 rounded text-red-400/70 overflow-auto max-h-32">
                  {error.message}
                </pre>
              </details>

              <div className="flex gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
                <button
                  onClick={this.handleNavigateHome}
                  className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}
