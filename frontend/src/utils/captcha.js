/**
 * CAPTCHA Integration
 * Supports Google reCAPTCHA v2, v3, and Cloudflare Turnstile
 */

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
const RECAPTCHA_V3_SITE_KEY = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || '';
const TURNSTILE_SITE_KEY = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '';

// Determine which CAPTCHA provider to use
const CAPTCHA_PROVIDER = import.meta.env.VITE_CAPTCHA_PROVIDER || 'turnstile'; // 'recaptcha-v2', 'recaptcha-v3', 'turnstile'

// ============== GOOGLE reCAPTCHA v2 ==============

/**
 * Load Google reCAPTCHA v2 script
 */
export const loadRecaptchaV2 = () => {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha && window.grecaptcha.render) {
      resolve(window.grecaptcha);
      return;
    }

    // Set up callback
    window.onRecaptchaLoad = () => {
      resolve(window.grecaptcha);
    };

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    script.async = true;
    script.defer = true;
    
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA v2'));
    
    document.head.appendChild(script);
  });
};

/**
 * Render reCAPTCHA v2 widget
 * @param {string} containerId - Container element ID
 * @param {object} options - Widget options
 * @returns {Promise<number>} - Widget ID
 */
export const renderRecaptchaV2 = async (containerId, options = {}) => {
  if (!RECAPTCHA_SITE_KEY) {
    console.warn('reCAPTCHA v2 site key not configured');
    return null;
  }

  try {
    const grecaptcha = await loadRecaptchaV2();
    
    const widgetId = grecaptcha.render(containerId, {
      sitekey: RECAPTCHA_SITE_KEY,
      theme: options.theme || 'dark',
      size: options.size || 'normal',
      callback: options.onSuccess || (() => {}),
      'error-callback': options.onError || (() => {}),
      'expired-callback': options.onExpired || (() => {}),
      ...options,
    });

    return widgetId;
  } catch (error) {
    console.error('Failed to render reCAPTCHA v2:', error);
    return null;
  }
};

/**
 * Reset reCAPTCHA v2 widget
 */
export const resetRecaptchaV2 = async (widgetId) => {
  try {
    const grecaptcha = await loadRecaptchaV2();
    grecaptcha.reset(widgetId);
  } catch (error) {
    console.error('Failed to reset reCAPTCHA:', error);
  }
};

/**
 * Get reCAPTCHA v2 response
 */
export const getRecaptchaV2Response = async (widgetId) => {
  try {
    const grecaptcha = await loadRecaptchaV2();
    return grecaptcha.getResponse(widgetId);
  } catch (error) {
    console.error('Failed to get reCAPTCHA response:', error);
    return null;
  }
};

// ============== GOOGLE reCAPTCHA v3 ==============

/**
 * Load Google reCAPTCHA v3 script
 */
export const loadRecaptchaV3 = () => {
  return new Promise((resolve, reject) => {
    if (window.grecaptcha && window.grecaptcha.execute) {
      resolve(window.grecaptcha);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_V3_SITE_KEY}`;
    script.async = true;
    
    script.onload = () => {
      window.grecaptcha.ready(() => {
        resolve(window.grecaptcha);
      });
    };
    
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA v3'));
    
    document.head.appendChild(script);
  });
};

/**
 * Execute reCAPTCHA v3 and get token
 * @param {string} action - Action name for scoring
 * @returns {Promise<string>} - Token
 */
export const executeRecaptchaV3 = async (action = 'submit') => {
  if (!RECAPTCHA_V3_SITE_KEY) {
    console.warn('reCAPTCHA v3 site key not configured');
    return null;
  }

  try {
    const grecaptcha = await loadRecaptchaV3();
    const token = await grecaptcha.execute(RECAPTCHA_V3_SITE_KEY, { action });
    return token;
  } catch (error) {
    console.error('Failed to execute reCAPTCHA v3:', error);
    return null;
  }
};

// ============== CLOUDFLARE TURNSTILE ==============

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
    
    script.onerror = () => reject(new Error('Failed to load Turnstile'));
    
    document.head.appendChild(script);
  });
};

/**
 * Render Turnstile widget
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
    });

    return widgetId;
  } catch (error) {
    console.error('Failed to render Turnstile:', error);
    return null;
  }
};

/**
 * Reset Turnstile widget
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
 * Get Turnstile response
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

// ============== UNIFIED CAPTCHA API ==============

/**
 * Initialize CAPTCHA based on configured provider
 */
export const initCaptcha = async () => {
  switch (CAPTCHA_PROVIDER) {
    case 'recaptcha-v2':
      return loadRecaptchaV2();
    case 'recaptcha-v3':
      return loadRecaptchaV3();
    case 'turnstile':
    default:
      return loadTurnstile();
  }
};

/**
 * Render CAPTCHA widget (for v2-style CAPTCHAs)
 */
export const renderCaptcha = async (containerId, options = {}) => {
  switch (CAPTCHA_PROVIDER) {
    case 'recaptcha-v2':
      return renderRecaptchaV2(containerId, options);
    case 'turnstile':
    default:
      return renderTurnstile(containerId, options);
  }
};

/**
 * Execute invisible CAPTCHA (for v3-style)
 */
export const executeCaptcha = async (action = 'submit') => {
  if (CAPTCHA_PROVIDER === 'recaptcha-v3') {
    return executeRecaptchaV3(action);
  }
  return null;
};

/**
 * Reset CAPTCHA widget
 */
export const resetCaptcha = async (widgetId) => {
  switch (CAPTCHA_PROVIDER) {
    case 'recaptcha-v2':
      return resetRecaptchaV2(widgetId);
    case 'turnstile':
    default:
      return resetTurnstile(widgetId);
  }
};

/**
 * Get CAPTCHA response token
 */
export const getCaptchaResponse = async (widgetId) => {
  switch (CAPTCHA_PROVIDER) {
    case 'recaptcha-v2':
      return getRecaptchaV2Response(widgetId);
    case 'turnstile':
    default:
      return getTurnstileResponse(widgetId);
  }
};

/**
 * Verify CAPTCHA token on server
 */
export const verifyCaptchaToken = async (token) => {
  try {
    const response = await fetch('/api/verify-captcha', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token, 
        provider: CAPTCHA_PROVIDER 
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('CAPTCHA verification failed:', error);
    return false;
  }
};

/**
 * Get current CAPTCHA provider
 */
export const getCaptchaProvider = () => CAPTCHA_PROVIDER;

export default {
  initCaptcha,
  renderCaptcha,
  executeCaptcha,
  resetCaptcha,
  getCaptchaResponse,
  verifyCaptchaToken,
  getCaptchaProvider,
  // Provider-specific exports
  loadRecaptchaV2,
  renderRecaptchaV2,
  resetRecaptchaV2,
  getRecaptchaV2Response,
  loadRecaptchaV3,
  executeRecaptchaV3,
  loadTurnstile,
  renderTurnstile,
  resetTurnstile,
  getTurnstileResponse,
};
