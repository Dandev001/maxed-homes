import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import clarity from '@microsoft/clarity'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { isEnvConfigured, getEnvError } from './lib/env'

// Initialize Microsoft Clarity
clarity.init('uethooozv2')

// Lazy load App to prevent env access during module load
const App = lazy(() => import('./App.tsx'))

// Environment configuration check component
function EnvErrorScreen() {
  const error = getEnvError();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Configuration Error
          </h1>
          <p className="text-gray-600 mb-4">
            The application cannot start due to missing or invalid environment variables.
          </p>
          {error && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-sm font-semibold text-gray-900 mb-2">Error Details:</p>
              <p className="text-xs text-red-600 font-mono break-all whitespace-pre-wrap">
                {error.message}
              </p>
            </div>
          )}
          <div className="text-left bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm font-semibold text-gray-900 mb-2">To fix this:</p>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Check your <code className="bg-gray-200 px-1 rounded">.env.local</code> file exists</li>
              <li>Ensure <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_URL</code> is set</li>
              <li>Ensure <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> is set</li>
              <li>Restart the development server</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#1a1a1a]/90 transition-colors font-medium"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

// Check environment before rendering app
function Root() {
  if (!isEnvConfigured()) {
    return <EnvErrorScreen />;
  }

  return (
    <HelmetProvider>
      <AuthProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        }>
          <App />
        </Suspense>
      </AuthProvider>
    </HelmetProvider>
  );
}

// Wrap in try-catch to handle any initialization errors
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  createRoot(rootElement).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
} catch (error) {
  // Fallback error display if React fails to initialize
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: system-ui, sans-serif;">
        <div style="max-width: 600px; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h1 style="color: #dc2626; margin-bottom: 16px;">Application Error</h1>
          <p style="color: #666; margin-bottom: 24px;">The application failed to initialize.</p>
          <pre style="background: #f3f4f6; padding: 16px; border-radius: 4px; overflow: auto; font-size: 12px; color: #dc2626;">
${error instanceof Error ? error.message : String(error)}
${error instanceof Error && error.stack ? '\n' + error.stack : ''}
          </pre>
          <button 
            onclick="window.location.reload()" 
            style="margin-top: 24px; padding: 12px 24px; background: #1a1a1a; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;"
          >
            Reload Page
          </button>
        </div>
      </div>
    `;
  }
  console.error('Failed to initialize React app:', error);
}
