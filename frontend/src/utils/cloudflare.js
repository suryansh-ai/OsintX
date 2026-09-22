/**
 * Cloudflare Integration
 * - Turnstile CAPTCHA
 * - Web Analytics
 * - Security Headers
 */

const TURNSTILE_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '';
const CF_ANALYTICS_TOKEN = import.meta.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN || '';

// ============== CLOUDFLARE TURNSTILE (CAPTCHA) ==============

/**
 * Load Cloudflare Turnstile script
 */
export const loadTurnstile = () => {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile);
      } else {
        reject(new Error('Turnstile failed to load'));
      }
    };
    
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    
    document.head.appendChild(script);
  });
};

/**
 * Render Turnstile widget
 * @param {string} containerId - ID of the container element
 * @param {object} options - Turnstile options
 * @returns {Promise<string>} - Widget ID
 */
export const renderTurnstile = async (containerId, options = {}) => {
  if (!TURNSTILE_SITE_KEY) {
    console.warn('Cloudflare Turnstile site key not configured');
    return null;
  }

  try {
    const turnstile = await loadTurnstile();
    
    const widgetId = turnstile.render(`#${containerId}`, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: options.theme || 'dark',
      size: options.size || 'normal',
      callback: options.onSuccess || (() => {}),
      'error-callback': options.onError || (() => {}),
      'expired-callback': options.onExpired || (() => {}),
      ...options,
    });

    return widgetId;
  } catch (error) {
    console.error('Failed to render Turnstile:', error);
    return null;
  }
};

/**
 * Reset Turnstile widget
 * @param {string} widgetId - Widget ID to reset
 */
export const resetTurnstile = async (widgetId) => {
  try {
    const turnstile = await loadTurnstile();
    turnstile.reset(widgetId);
  } catch (error) {
    console.error('Failed to reset Turnstile:', error);
  }
};

/**
 * Remove Turnstile widget
 * @param {string} widgetId - Widget ID to remove
 */
export const removeTurnstile = async (widgetId) => {
  try {
    const turnstile = await loadTurnstile();
    turnstile.remove(widgetId);
  } catch (error) {
    console.error('Failed to remove Turnstile:', error);
  }
};

/**
 * Get Turnstile response token
 * @param {string} widgetId - Widget ID
 * @returns {string|null} - Response token
 */
export const getTurnstileResponse = async (widgetId) => {
  try {
    const turnstile = await loadTurnstile();
    return turnstile.getResponse(widgetId);
  } catch (error) {
    console.error('Failed to get Turnstile response:', error);
    return null;
  }
};

// ============== CLOUDFLARE WEB ANALYTICS ==============

/**
 * Initialize Cloudflare Web Analytics
 */
export const initCloudflareAnalytics = () => {
  if (!CF_ANALYTICS_TOKEN) {
    console.warn('Cloudflare Analytics token not configured');
    return;
  }

  // Check if already loaded
  if (document.querySelector('script[data-cf-beacon]')) {
    return;
  }

  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_ANALYTICS_TOKEN }));
  
  document.body.appendChild(script);
};

// ============== CLOUDFLARE SECURITY HELPERS ==============

/**
 * Check if request is from Cloudflare
 * @returns {boolean}
 */
export const isCloudflareRequest = () => {
  // Check for Cloudflare-specific headers (client-side limited)
  return document.cookie.includes('__cf_bm') || 
         document.cookie.includes('cf_clearance');
};

/**
 * Get Cloudflare Ray ID from response headers
 * @param {Response} response - Fetch response
 * @returns {string|null}
 */
export const getCloudflareRayId = (response) => {
  return response.headers.get('cf-ray');
};

/**
 * Verify Turnstile token on server
 * @param {string} token - Turnstile response token
 * @returns {Promise<boolean>}
 */
export const verifyTurnstileToken = async (token) => {
  try {
    const response = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
};

export default {
  loadTurnstile,
  renderTurnstile,
  resetTurnstile,
  removeTurnstile,
  getTurnstileResponse,
  initCloudflareAnalytics,
  isCloudflareRequest,
  getCloudflareRayId,
  verifyTurnstileToken,
};
