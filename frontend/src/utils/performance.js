/**
 * Performance Monitoring Utilities
 * Track Web Vitals and custom performance metrics
 */

import { trackPerformance } from './analytics';

// Performance observer for metrics
let performanceObserver = null;

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return;
  }

  // Observe Long Tasks (tasks > 50ms)
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        trackPerformance('LongTask', entry.duration, entry.name);
        
        if (entry.duration > 100) {
          console.warn(`[Performance] Long task detected: ${entry.duration}ms`);
        }
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    // Long tasks not supported in all browsers
  }

  // Observe Resource Timing
  try {
    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 1000) {
          trackPerformance('SlowResource', entry.duration, entry.name);
          console.warn(`[Performance] Slow resource: ${entry.name} (${entry.duration}ms)`);
        }
      }
    });
    resourceObserver.observe({ entryTypes: ['resource'] });
  } catch (e) {
    // Resource timing not supported
  }

  console.log('[Performance] Monitoring initialized');
};

/**
 * Measure Web Vitals
 */
export const measureWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcp = lastEntry.renderTime || lastEntry.loadTime;
      
      trackPerformance('LCP', lcp, window.location.pathname);
      
      if (lcp > 2500) {
        console.warn(`[Performance] Poor LCP: ${lcp}ms (target: <2500ms)`);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {}

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        trackPerformance('FID', fid, window.location.pathname);
        
        if (fid > 100) {
          console.warn(`[Performance] Poor FID: ${fid}ms (target: <100ms)`);
        }
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {}

  // Cumulative Layout Shift (CLS)
  let clsScore = 0;
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
      
      trackPerformance('CLS', clsScore, window.location.pathname);
      
      if (clsScore > 0.1) {
        console.warn(`[Performance] Poor CLS: ${clsScore} (target: <0.1)`);
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {}
};

/**
 * Measure page load time
 */
export const measurePageLoad = () => {
  if (typeof window === 'undefined' || !window.performance) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      
      if (perfData) {
        const metrics = {
          dns: perfData.domainLookupEnd - perfData.domainLookupStart,
          tcp: perfData.connectEnd - perfData.connectStart,
          request: perfData.responseStart - perfData.requestStart,
          response: perfData.responseEnd - perfData.responseStart,
          dom: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          load: perfData.loadEventEnd - perfData.loadEventStart,
          total: perfData.loadEventEnd - perfData.fetchStart,
        };

        Object.entries(metrics).forEach(([metric, value]) => {
          trackPerformance(`PageLoad.${metric}`, value, window.location.pathname);
        });

        console.log('[Performance] Page load metrics:', metrics);
      }
    }, 0);
  });
};

/**
 * Measure component render time
 */
export const measureRender = (componentName, startTime) => {
  const duration = performance.now() - startTime;
  
  if (duration > 16.67) { // Slower than 60fps
    trackPerformance('ComponentRender', duration, componentName);
    console.warn(`[Performance] Slow render: ${componentName} (${duration.toFixed(2)}ms)`);
  }
  
  return duration;
};

/**
 * Measure API call performance
 */
export const measureAPICall = async (apiCall, endpoint) => {
  const startTime = performance.now();
  
  try {
    const result = await apiCall();
    const duration = performance.now() - startTime;
    
    trackPerformance('APICall.Success', duration, endpoint);
    
    if (duration > 3000) {
      console.warn(`[Performance] Slow API call: ${endpoint} (${duration}ms)`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackPerformance('APICall.Error', duration, endpoint);
    throw error;
  }
};

/**
 * Measure function execution time
 */
export const measureExecution = (fn, label) => {
  return (...args) => {
    const startTime = performance.now();
    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime;
        trackPerformance('Execution', duration, label);
      });
    }
    
    const duration = performance.now() - startTime;
    trackPerformance('Execution', duration, label);
    return result;
  };
};

/**
 * Get performance summary
 */
export const getPerformanceSummary = () => {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  return {
    navigation: navigation ? {
      type: navigation.type,
      redirectCount: navigation.redirectCount,
      totalTime: navigation.loadEventEnd - navigation.fetchStart,
    } : null,
    paint: paint.reduce((acc, entry) => {
      acc[entry.name] = entry.startTime;
      return acc;
    }, {}),
    memory: performance.memory ? {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
    } : null,
  };
};

/**
 * Monitor bundle size
 */
export const logBundleSize = () => {
  if (typeof window === 'undefined') return;

  const resources = performance.getEntriesByType('resource');
  const scripts = resources.filter(r => r.initiatorType === 'script');
  
  const totalSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);
  const totalSizeKB = (totalSize / 1024).toFixed(2);
  
  console.log(`[Performance] Total JS bundle size: ${totalSizeKB}KB`);
  trackPerformance('BundleSize', totalSize, 'total');
  
  if (totalSize > 1024 * 500) { // > 500KB
    console.warn('[Performance] Large bundle size detected');
  }
};

/**
 * Performance mark (for custom measurements)
 */
export const mark = (name) => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name);
  }
};

/**
 * Measure between two marks
 */
export const measure = (name, startMark, endMark) => {
  if (typeof window === 'undefined' || !window.performance) return null;

  try {
    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];
    trackPerformance('CustomMeasure', measure.duration, name);
    return measure.duration;
  } catch (e) {
    console.error('[Performance] Measure failed:', e);
    return null;
  }
};

/**
 * Clear performance marks/measures
 */
export const clearPerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    performance.clearMarks();
    performance.clearMeasures();
  }
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initPerformanceMonitoring();
  measureWebVitals();
  measurePageLoad();
  
  // Log bundle size after load
  window.addEventListener('load', () => {
    setTimeout(logBundleSize, 1000);
  });
}

export default {
  initPerformanceMonitoring,
  measureWebVitals,
  measurePageLoad,
  measureRender,
  measureAPICall,
  measureExecution,
  getPerformanceSummary,
  logBundleSize,
  mark,
  measure,
  clearPerformance,
};
