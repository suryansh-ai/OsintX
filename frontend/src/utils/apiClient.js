/**
 * Enhanced API Client with Retry Logic
 * Provides automatic retries, request deduplication, and circuit breaker.
 * Returns a raw Fetch Response so callers can decide how to parse the body.
 */

import { ApiError } from '../services/api';

// Request cache for deduplication
const requestCache = new Map();
const pendingRequests = new Map();

// Circuit breaker state
const circuitBreaker = {
  failures: 0,
  lastFailure: null,
  state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
  threshold: 5,
  timeout: 30000, // 30 seconds
};

/**
 * Sleep utility for delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getBackoffDelay = (attempt, baseDelay = 1000) => {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000);
};

/**
 * Check if error is retryable
 */
const isRetryableError = (error) => {
  if (!error.status) return true; // Network errors
  return [408, 429, 500, 502, 503, 504].includes(error.status);
};

/**
 * Check circuit breaker state
 */
export const checkCircuitBreaker = () => {
  if (circuitBreaker.state === 'OPEN') {
    const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailure;
    if (timeSinceLastFailure > circuitBreaker.timeout) {
      circuitBreaker.state = 'HALF_OPEN';
      return true;
    }
    throw new ApiError('Service temporarily unavailable (circuit breaker open)', 503);
  }
  return true;
};

/**
 * Update circuit breaker on success/failure
 */
const updateCircuitBreaker = (success) => {
  if (success) {
    circuitBreaker.failures = 0;
    circuitBreaker.state = 'CLOSED';
  } else {
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();
    if (circuitBreaker.failures >= circuitBreaker.threshold) {
      circuitBreaker.state = 'OPEN';
      console.warn('[API] Circuit breaker opened due to repeated failures');
    }
  }
};

/**
 * Generate cache key for request
 */
const getCacheKey = (url, options) => {
  const method = options?.method || 'GET';
  const body = options?.body || '';
  return `${method}:${url}:${body}`;
};

/**
 * Enhanced fetch with retry logic
 */
export const fetchWithRetry = async (url, options = {}, config = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    timeout = 30000,
    enableCache = true,
    cacheDuration = 60000, // 1 minute
    enableDeduplication = true,
  } = config;

  // Check circuit breaker
  checkCircuitBreaker();

  // Generate cache key
  const cacheKey = getCacheKey(url, options);

  // Check cache
  if (enableCache && options?.method === 'GET') {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.response.clone();
    }
  }

  // Check for pending duplicate request
  if (enableDeduplication) {
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }
  }

  // Fetch with retries
  const executeRequest = async (attempt = 0) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Check if retryable
        if (attempt < maxRetries && isRetryableError({ status: response.status })) {
          const delay = getBackoffDelay(attempt, baseDelay);
          console.warn(`[API] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await sleep(delay);
          return executeRequest(attempt + 1);
        }

        updateCircuitBreaker(false);
        return response;
      }

      // Success - update circuit breaker and cache
      updateCircuitBreaker(true);

      if (enableCache && options?.method === 'GET') {
        requestCache.set(cacheKey, {
          response: response.clone(),
          timestamp: Date.now(),
        });
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }

      // Network error - retry if possible
      if (attempt < maxRetries && !error.status) {
        const delay = getBackoffDelay(attempt, baseDelay);
        console.warn(`[API] Network error, retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
        return executeRequest(attempt + 1);
      }

      updateCircuitBreaker(false);
      throw error instanceof ApiError ? error : new ApiError(error.message, 0);
    }
  };

  // Execute and track pending request
  const requestPromise = executeRequest();

  if (enableDeduplication) {
    pendingRequests.set(cacheKey, requestPromise);
    requestPromise.finally(() => pendingRequests.delete(cacheKey));
  }

  return requestPromise;
};

/**
 * Clear request cache
 */
export const clearCache = (pattern) => {
  if (pattern) {
    for (const key of requestCache.keys()) {
      if (key.includes(pattern)) {
        requestCache.delete(key);
      }
    }
  } else {
    requestCache.clear();
  }
};

/**
 * Get circuit breaker status
 */
export const getCircuitBreakerStatus = () => ({
  state: circuitBreaker.state,
  failures: circuitBreaker.failures,
  lastFailure: circuitBreaker.lastFailure,
});

/**
 * Reset circuit breaker
 */
export const resetCircuitBreaker = () => {
  circuitBreaker.failures = 0;
  circuitBreaker.lastFailure = null;
  circuitBreaker.state = 'CLOSED';
};

/**
 * Batch requests with concurrency limit
 */
export const batchRequests = async (requests, concurrency = 5) => {
  const results = [];
  const errors = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(batch);

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({ index: i + index, data: result.value });
      } else {
        errors.push({ index: i + index, error: result.reason });
      }
    });
  }

  return { results, errors };
};

export default fetchWithRetry;
