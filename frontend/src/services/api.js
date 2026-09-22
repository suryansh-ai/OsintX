import { fetchWithRetry, checkCircuitBreaker } from '../utils/apiClient';
import { trackAPICall } from '../utils/analytics';
import { enqueueRequest } from '../utils/requestQueue';
import { getCached, setCache, invalidateCache } from '../utils/apiCache';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API error class
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management
let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('osintx_token', token);
  } else {
    localStorage.removeItem('osintx_token');
  }
};

export const getAuthToken = () => {
  if (!authToken) {
    authToken = localStorage.getItem('osintx_token');
  }
  return authToken;
};

// Base fetch wrapper with authentication
const fetchWithAuth = async (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const cacheKey = `${method}:${endpoint}`;

  if (method === 'GET') {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  
  // Check circuit breaker (throws if circuit is open)
  checkCircuitBreaker();
  
  const config = {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  };

  const startTime = performance.now();
  
  try {
    const response = await fetchWithRetry(url, config);
    
    // Handle different response types
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const duration = performance.now() - startTime;
      trackAPICall(endpoint, options.method || 'GET', response.status, duration);
      
      // Handle rate limiting - auto-queue request
      if (response.status === 429) {
        console.warn('[API] Rate limited, queueing request:', endpoint);
        enqueueRequest({
          endpoint: url,
          method: options.method || 'GET',
          body: options.body ? JSON.parse(options.body) : undefined,
          headers: config.headers,
        });
      }
      
      throw new ApiError(
        data.message || data.error || 'An error occurred',
        response.status,
        data
      );
    }

    // Track successful call
    const duration = performance.now() - startTime;
    trackAPICall(endpoint, options.method || 'GET', response.status, duration);

    if (method === 'GET') setCache(cacheKey, data, 15000);

    return data;
  } catch (error) {
    const duration = performance.now() - startTime;
    trackAPICall(endpoint, options.method || 'GET', error.status || 0, duration);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      null
    );
  }
};

// HTTP method helpers
export const api = {
  get: (endpoint, options = {}) => fetchWithAuth(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, data, options = {}) => fetchWithAuth(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  }),

  upload: (endpoint, formData, options = {}) => fetchWithAuth(endpoint, {
    ...options,
    method: 'POST',
    body: formData
  }),
  
  put: (endpoint, data, options = {}) => fetchWithAuth(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  patch: (endpoint, data, options = {}) => fetchWithAuth(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  
  delete: (endpoint, options = {}) => fetchWithAuth(endpoint, { ...options, method: 'DELETE' }),

  download: async (endpoint, options = {}) => {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let data = null;
      try { data = await response.json(); } catch {}
      throw new ApiError(data?.message || data?.error || 'Download failed', response.status, data);
    }

    return response;
  }
};

export default api;
