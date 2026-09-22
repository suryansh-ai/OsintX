/**
 * Request Queue Manager
 * Queue and retry failed/rate-limited requests
 */

import { useEffect, useState } from 'react';
import { trackEvent } from './analytics';

class RequestQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff
    this.maxRetries = 5;
    
    // Load persisted queue from localStorage
    this.loadQueue();
  }

  /**
   * Add request to queue
   */
  enqueue(request) {
    const queueItem = {
      id: crypto.randomUUID(),
      request,
      retries: 0,
      addedAt: Date.now(),
      status: 'pending',
    };

    this.queue.push(queueItem);
    this.persistQueue();
    
    trackEvent('RequestQueue', 'enqueue', request.endpoint);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  /**
   * Process queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue[0];

      try {
        item.status = 'processing';
        this.persistQueue();

        // Execute request
        const response = await this.executeRequest(item.request);

        // Success - remove from queue
        this.queue.shift();
        this.persistQueue();

        // Notify success
        if (item.request.onSuccess) {
          item.request.onSuccess(response);
        }

        trackEvent('RequestQueue', 'success', item.request.endpoint);

      } catch (error) {
        // Check if rate limited
        if (error.status === 429) {
          const retryAfter = error.headers?.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.retryDelays[item.retries] || 30000;

          console.log(`[RequestQueue] Rate limited, retrying after ${delay}ms`);
          
          item.status = 'rate-limited';
          this.persistQueue();

          // Wait and retry
          await this.sleep(delay);
          continue;
        }

        // Check if should retry
        if (item.retries < this.maxRetries && this.isRetryableError(error)) {
          item.retries++;
          item.status = 'retrying';
          item.lastError = error.message;
          this.persistQueue();

          const delay = this.retryDelays[item.retries - 1] || 30000;
          console.log(`[RequestQueue] Retry ${item.retries}/${this.maxRetries} after ${delay}ms`);

          await this.sleep(delay);
          continue;
        }

        // Max retries exceeded - remove from queue
        console.error(`[RequestQueue] Failed after ${item.retries} retries:`, error);
        
        this.queue.shift();
        this.persistQueue();

        // Notify failure
        if (item.request.onError) {
          item.request.onError(error);
        }

        trackEvent('RequestQueue', 'failed', item.request.endpoint);
      }
    }

    this.processing = false;
    console.log('[RequestQueue] Queue processing complete');
  }

  /**
   * Execute queued request
   */
  async executeRequest(request) {
    const { endpoint, method = 'GET', body, headers = {} } = request;

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`);
      error.status = response.status;
      error.headers = response.headers;
      throw error;
    }

    return response.json();
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(item => item.status === 'pending').length,
      processing: this.queue.filter(item => item.status === 'processing').length,
      retrying: this.queue.filter(item => item.status === 'retrying').length,
      rateLimited: this.queue.filter(item => item.status === 'rate-limited').length,
    };
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    this.persistQueue();
    console.log('[RequestQueue] Queue cleared');
  }

  /**
   * Remove specific item from queue
   */
  remove(id) {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.persistQueue();
      return true;
    }
    return false;
  }

  /**
   * Persist queue to localStorage
   */
  persistQueue() {
    try {
      localStorage.setItem('requestQueue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('[RequestQueue] Failed to persist queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  loadQueue() {
    try {
      const stored = localStorage.getItem('requestQueue');
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[RequestQueue] Loaded ${this.queue.length} items from storage`);
        
        // Resume processing if queue not empty
        if (this.queue.length > 0) {
          this.processQueue();
        }
      }
    } catch (error) {
      console.error('[RequestQueue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const requestQueue = new RequestQueue();

/**
 * Enqueue a request
 */
export const enqueueRequest = (request) => {
  return requestQueue.enqueue(request);
};

/**
 * Get queue status
 */
export const getQueueStatus = () => {
  return requestQueue.getStatus();
};

/**
 * Clear queue
 */
export const clearQueue = () => {
  requestQueue.clear();
};

/**
 * React hook for queue status
 */
export const useQueueStatus = () => {
  const [status, setStatus] = useState(requestQueue.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(requestQueue.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
};

export default requestQueue;
