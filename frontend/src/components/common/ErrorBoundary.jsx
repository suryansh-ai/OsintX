/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 * 
 * IMPORTANT: This component must NOT use any React hooks (useNavigate, useTheme, etc.)
 * because it needs to work even when context providers have crashed.
 * All styling is inline to avoid dependency on CSS modules or Tailwind at crash time.
 */

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1
    }));
    
    // Log to error tracking service
    if (window.logError) {
      window.logError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    // Use window.location instead of useNavigate to avoid hook dependency
    window.location.href = '/';
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      
      // If error keeps repeating (retry loop), suggest full refresh
      if (this.state.errorCount > 2) {
        return (
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a, #000, #0f172a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            <div style={{
              maxWidth: '28rem',
              width: '100%',
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '1rem',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '4rem', height: '4rem',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <span style={{ fontSize: '2rem' }}>⚠️</span>
              </div>
              <h1 style={{ color: '#f87171', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Persistent Error
              </h1>
              <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                The application encountered a repeated error. Please refresh the page to start fresh.
              </p>
              <button
                onClick={this.handleRefresh}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        );
      }

      // Normal error recovery UI — self-contained, no hooks used
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a, #000, #0f172a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            background: '#0f172a',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '4rem', height: '4rem',
              background: 'rgba(239, 68, 68, 0.2)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <span style={{ fontSize: '2rem' }}>❌</span>
            </div>
            
            <h1 style={{ color: '#f87171', fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Application Error
            </h1>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              {isDev && this.state.error 
                ? this.state.error.toString()
                : 'Something went wrong. Please try again or refresh the page.'}
            </p>

            {isDev && this.state.errorInfo && (
              <details style={{
                textAlign: 'left',
                marginBottom: '1.5rem',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <summary style={{ color: '#9ca3af', cursor: 'pointer', fontSize: '0.75rem' }}>
                  Stack trace
                </summary>
                <pre style={{
                  color: '#ef4444',
                  fontSize: '0.625rem',
                  marginTop: '0.5rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                🔄 Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#22d3ee',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                🏠 Go Home
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
