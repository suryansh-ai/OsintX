import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize utilities
import './utils/pwa';
import './utils/performance';
import './utils/keyboardShortcuts';
import { initAnalytics } from './utils/analytics';
import { initGoogleAnalytics, setDefaultConsent } from './utils/googleAnalytics';
import { initCloudflareAnalytics } from './utils/cloudflare';

// Set default consent before GA initialization
setDefaultConsent();

// Initialize analytics services
initAnalytics();
initGoogleAnalytics();
initCloudflareAnalytics();

/**
 * Global Error Boundary — last-resort fallback for catastrophic errors
 * This catches errors that happen even outside BrowserRouter / context providers.
 * Uses zero hooks, zero context, zero external components — pure class + inline styles.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[GlobalErrorBoundary] Fatal error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: '24rem',
            textAlign: 'center',
            background: '#0f172a',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '1rem',
            padding: '2.5rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💥</div>
            <h1 style={{ color: '#f87171', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', fontFamily: "'Papyrus', 'Copperplate', fantasy" }}>
              OsintX Crashed
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              A critical error occurred. Click below to reload the application.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 2rem',
                background: 'linear-gradient(to right, #06b6d4, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Reload OsintX
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);
