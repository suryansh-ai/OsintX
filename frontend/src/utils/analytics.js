/**
 * Analytics & Telemetry System
 * Track user actions, errors, and performance metrics
 */

const ANALYTICS_ENABLED = import.meta.env.VITE_ENABLE_TELEMETRY === 'true';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Event queue
const eventQueue = [];
const BATCH_SIZE = 10;
const BATCH_INTERVAL = 5000; // 5 seconds

/**
 * Track custom event
 */
export const trackEvent = (category, action, label = null, value = null) => {
  if (!ANALYTICS_ENABLED) return;

  const event = {
    category,
    action,
    label,
    value,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId: getUserId(),
    url: window.location.pathname,
    userAgent: navigator.userAgent,
  };

  eventQueue.push(event);

  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }
};

/**
 * Track page view
 */
export const trackPageView = (page) => {
  trackEvent('Navigation', 'PageView', page);
};

/**
 * Track tool usage
 */
export const trackToolUsage = (toolName, action, metadata = {}) => {
  trackEvent('Tool', action, toolName, null);
  
  // Additional metadata
  if (Object.keys(metadata).length > 0) {
    trackEvent('Tool', 'Metadata', toolName, JSON.stringify(metadata));
  }
};

/**
 * Track API call
 */
export const trackAPICall = (endpoint, method, duration, success, error = null) => {
  trackEvent('API', success ? 'Success' : 'Error', `${method} ${endpoint}`, duration);
  
  if (error) {
    trackError(error, { endpoint, method });
  }
};

/**
 * Track error
 */
export const trackError = (error, context = {}) => {
  if (!ANALYTICS_ENABLED) return;

  const errorEvent = {
    category: 'Error',
    action: error.name || 'Error',
    label: error.message,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId: getUserId(),
    stack: error.stack,
    context,
    url: window.location.pathname,
  };

  // Send immediately for errors
  sendEvents([errorEvent]);
};

/**
 * Track performance metric
 */
export const trackPerformance = (metric, value, label = null) => {
  trackEvent('Performance', metric, label, value);
};

/**
 * Track user action
 */
export const trackAction = (action, label = null, value = null) => {
  trackEvent('User', action, label, value);
};

/**
 * Track search
 */
export const trackSearch = (query, resultCount) => {
  trackEvent('Search', 'Query', query, resultCount);
};

/**
 * Track feature usage
 */
export const trackFeature = (featureName, action = 'Used') => {
  trackEvent('Feature', action, featureName);
};

/**
 * Get or create session ID
 */
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Get user ID (from auth or anonymous)
 */
const getUserId = () => {
  return localStorage.getItem('userId') || 'anonymous';
};

/**
 * Flush events to server
 */
const flushEvents = async () => {
  if (eventQueue.length === 0) return;

  const events = eventQueue.splice(0, BATCH_SIZE);
  await sendEvents(events);
};

/**
 * Send events to analytics endpoint
 */
const sendEvents = async (events) => {
  try {
    await fetch(`${API_URL}/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events }),
      keepalive: true, // Ensure sent even if page closes
    });
  } catch (error) {
    console.error('[Analytics] Failed to send events:', error);
  }
};

/**
 * Initialize analytics
 */
export const initAnalytics = () => {
  if (!ANALYTICS_ENABLED) return;

  // Flush events periodically
  setInterval(flushEvents, BATCH_INTERVAL);

  // Flush on page unload
  window.addEventListener('beforeunload', flushEvents);

  // Track initial page view
  trackPageView(window.location.pathname);

  // Track route changes (for SPAs)
  let lastPath = window.location.pathname;
  setInterval(() => {
    const currentPath = window.location.pathname;
    if (currentPath !== lastPath) {
      trackPageView(currentPath);
      lastPath = currentPath;
    }
  }, 1000);

  // Track Web Vitals
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Track page load time
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        trackPerformance('PageLoad', perfData.loadEventEnd - perfData.fetchStart, window.location.pathname);
      }
    });
  }

  console.log('[Analytics] Initialized');
};

/**
 * Disable analytics
 */
export const disableAnalytics = () => {
  eventQueue.length = 0;
  localStorage.setItem('analytics_disabled', 'true');
};

/**
 * Enable analytics
 */
export const enableAnalytics = () => {
  localStorage.removeItem('analytics_disabled');
  initAnalytics();
};

// Global error handler
if (ANALYTICS_ENABLED && typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
      source: event.filename,
      line: event.lineno,
      col: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason || new Error('Unhandled Promise Rejection'));
  });
}

export default {
  trackEvent,
  trackPageView,
  trackToolUsage,
  trackAPICall,
  trackError,
  trackPerformance,
  trackAction,
  trackSearch,
  trackFeature,
  initAnalytics,
  disableAnalytics,
  enableAnalytics,
};
