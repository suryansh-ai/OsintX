/**
 * Tool Error Boundary
 * Catches errors within individual tool components so they don't crash the entire app.
 * Shows a styled error modal with retry/close options matching the tool modal aesthetic.
 *
 * Usage: <ToolErrorBoundary onClose={handleClose}> <SomeTool /> </ToolErrorBoundary>
 * 
 * IMPORTANT: No React hooks used — class component with inline styles as fallback.
 */

import React from 'react';

class ToolErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ToolErrorBoundary] Tool crashed:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  // Reset error state if the tool changes (new key prop)
  componentDidUpdate(prevProps) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleClose = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '1rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace'
          }}
        >
          <div
            style={{
              maxWidth: '32rem',
              width: '100%',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(to right, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
                borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
            >
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}
              >
                ⚠️
              </div>
              <div>
                <h2 style={{ color: '#f87171', fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>
                  Tool Error
                </h2>
                <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '0.25rem 0 0' }}>
                  This tool encountered an error
                </p>
              </div>
              <button
                onClick={this.handleClose}
                style={{
                  marginLeft: 'auto',
                  width: '2rem',
                  height: '2rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem'
                }}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: '1.6' }}>
                The tool crashed unexpectedly. You can try again or close and reopen the tool.
                Your other tools and dashboard remain unaffected.
              </p>

              {this.state.error && (
                <div
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    marginBottom: '1rem'
                  }}
                >
                  <p style={{ color: '#ef4444', fontSize: '0.75rem', fontFamily: 'monospace', margin: 0 }}>
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ color: '#6b7280', fontSize: '0.7rem', cursor: 'pointer' }}>
                        Component stack
                      </summary>
                      <pre
                        style={{
                          color: '#9ca3af',
                          fontSize: '0.625rem',
                          marginTop: '0.5rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          maxHeight: '150px',
                          overflow: 'auto'
                        }}
                      >
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={this.handleRetry}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  🔄 Retry Tool
                </button>
                <button
                  onClick={this.handleClose}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#9ca3af',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  ✕ Close Tool
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ToolErrorBoundary;
