import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { ROUTES } from '../constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you would log to an error tracking service here
    // Example: logErrorToService(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try again or return to the home page.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <p className="text-sm font-semibold text-gray-900 mb-2">Error Details (Development Only):</p>
                <p className="text-xs text-red-600 font-mono break-all">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-900">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={() => {
                  window.location.href = ROUTES.HOME;
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

