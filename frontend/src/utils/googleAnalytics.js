/**
 * Google Analytics 4 (GA4) Integration
 * Track page views, events, conversions, and user behavior
 */

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const GA_ENABLED = import.meta.env.VITE_GA_ENABLED === 'true' && GA_MEASUREMENT_ID;

let isInitialized = false;

// ============== INITIALIZATION ==============

/**
 * Initialize Google Analytics
 */
export const initGoogleAnalytics = () => {
  if (!GA_ENABLED || isInitialized) {
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually
    cookie_flags: 'SameSite=None;Secure',
  });

  isInitialized = true;
  console.log('Google Analytics initialized');
};

/**
 * Check if GA is enabled and initialized
 */
export const isGAReady = () => {
  return GA_ENABLED && isInitialized && typeof window.gtag === 'function';
};

// ============== PAGE TRACKING ==============

/**
 * Track page view
 * @param {string} pagePath - Page path (e.g., '/dashboard')
 * @param {string} pageTitle - Page title
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (!isGAReady()) return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
};

// ============== EVENT TRACKING ==============

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {object} params - Event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (!isGAReady()) return;

  window.gtag('event', eventName, {
    ...params,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track button click
 * @param {string} buttonName - Button identifier
 * @param {string} location - Where the button is located
 */
export const trackButtonClick = (buttonName, location = '') => {
  trackEvent('button_click', {
    button_name: buttonName,
    button_location: location,
  });
};

/**
 * Track form submission
 * @param {string} formName - Form identifier
 * @param {boolean} success - Whether submission was successful
 */
export const trackFormSubmission = (formName, success = true) => {
  trackEvent('form_submission', {
    form_name: formName,
    submission_success: success,
  });
};

/**
 * Track search query
 * @param {string} searchTerm - Search term
 * @param {string} searchType - Type of search
 */
export const trackSearch = (searchTerm, searchType = 'general') => {
  trackEvent('search', {
    search_term: searchTerm,
    search_type: searchType,
  });
};

// ============== TOOL TRACKING ==============

/**
 * Track tool usage
 * @param {string} toolName - Tool name
 * @param {string} action - Action performed
 * @param {number} credits - Credits consumed
 */
export const trackToolUsage = (toolName, action = 'launch', credits = 0) => {
  trackEvent('tool_usage', {
    tool_name: toolName,
    tool_action: action,
    credits_used: credits,
  });
};

/**
 * Track investigation
 * @param {string} investigationType - Type of investigation
 * @param {string} query - Investigation query
 */
export const trackInvestigation = (investigationType, query = '') => {
  trackEvent('investigation', {
    investigation_type: investigationType,
    query_length: query.length,
  });
};

// ============== USER TRACKING ==============

/**
 * Set user ID for tracking
 * @param {string} userId - User ID
 */
export const setUserId = (userId) => {
  if (!isGAReady()) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
  });
};

/**
 * Set user properties
 * @param {object} properties - User properties
 */
export const setUserProperties = (properties) => {
  if (!isGAReady()) return;

  window.gtag('set', 'user_properties', properties);
};

/**
 * Track user login
 * @param {string} method - Login method
 */
export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method,
  });
};

/**
 * Track user signup
 * @param {string} method - Signup method
 */
export const trackSignup = (method = 'email') => {
  trackEvent('sign_up', {
    method: method,
  });
};

// ============== E-COMMERCE / CREDITS ==============

/**
 * Track credit purchase
 * @param {number} amount - Credits purchased
 * @param {number} value - Payment value
 * @param {string} currency - Currency code
 */
export const trackCreditPurchase = (amount, value, currency = 'INR') => {
  trackEvent('purchase', {
    transaction_id: `cr_${Date.now()}`,
    value: value,
    currency: currency,
    items: [{
      item_name: 'Credits',
      quantity: amount,
      price: value / amount,
    }],
  });
};

/**
 * Track credit consumption
 * @param {number} credits - Credits consumed
 * @param {string} toolName - Tool that consumed credits
 */
export const trackCreditConsumption = (credits, toolName) => {
  trackEvent('credit_consumption', {
    credits_consumed: credits,
    consumption_source: toolName,
  });
};

// ============== CASE TRACKING ==============

/**
 * Track case creation
 * @param {string} caseId - Case ID
 * @param {string} caseType - Type of case
 */
export const trackCaseCreation = (caseId, caseType = 'general') => {
  trackEvent('case_created', {
    case_id: caseId,
    case_type: caseType,
  });
};

/**
 * Track case completion
 * @param {string} caseId - Case ID
 * @param {number} duration - Time to complete (in minutes)
 */
export const trackCaseCompletion = (caseId, duration = 0) => {
  trackEvent('case_completed', {
    case_id: caseId,
    completion_time_minutes: duration,
  });
};

// ============== ERROR TRACKING ==============

/**
 * Track error
 * @param {string} errorMessage - Error message
 * @param {string} errorType - Type of error
 * @param {string} location - Where error occurred
 */
export const trackError = (errorMessage, errorType = 'error', location = '') => {
  trackEvent('error', {
    error_message: errorMessage.substring(0, 100), // Limit length
    error_type: errorType,
    error_location: location,
  });
};

/**
 * Track exception
 * @param {Error} error - Error object
 * @param {boolean} fatal - Whether error was fatal
 */
export const trackException = (error, fatal = false) => {
  if (!isGAReady()) return;

  window.gtag('event', 'exception', {
    description: error.message,
    fatal: fatal,
  });
};

// ============== TIMING ==============

/**
 * Track timing
 * @param {string} name - Timing name
 * @param {number} value - Time in milliseconds
 * @param {string} category - Timing category
 */
export const trackTiming = (name, value, category = 'Performance') => {
  trackEvent('timing_complete', {
    name: name,
    value: value,
    event_category: category,
  });
};

// ============== ENGAGEMENT ==============

/**
 * Track scroll depth
 * @param {number} percentage - Scroll percentage
 */
export const trackScrollDepth = (percentage) => {
  trackEvent('scroll', {
    percent_scrolled: percentage,
  });
};

/**
 * Track time on page
 * @param {number} seconds - Time in seconds
 * @param {string} pagePath - Page path
 */
export const trackTimeOnPage = (seconds, pagePath) => {
  trackEvent('time_on_page', {
    time_seconds: seconds,
    page_path: pagePath,
  });
};

// ============== CONSENT MANAGEMENT ==============

/**
 * Update consent status
 * @param {object} consent - Consent settings
 */
export const updateConsent = (consent = {}) => {
  if (!isGAReady()) return;

  window.gtag('consent', 'update', {
    analytics_storage: consent.analytics ? 'granted' : 'denied',
    ad_storage: consent.ads ? 'granted' : 'denied',
    functionality_storage: consent.functionality ? 'granted' : 'denied',
    personalization_storage: consent.personalization ? 'granted' : 'denied',
    security_storage: 'granted', // Always needed for security
  });
};

/**
 * Set default consent (before user choice)
 */
export const setDefaultConsent = () => {
  if (typeof window.gtag !== 'function') return;

  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500, // Wait 500ms for consent update
  });
};

export default {
  initGoogleAnalytics,
  isGAReady,
  trackPageView,
  trackEvent,
  trackButtonClick,
  trackFormSubmission,
  trackSearch,
  trackToolUsage,
  trackInvestigation,
  setUserId,
  setUserProperties,
  trackLogin,
  trackSignup,
  trackCreditPurchase,
  trackCreditConsumption,
  trackCaseCreation,
  trackCaseCompletion,
  trackError,
  trackException,
  trackTiming,
  trackScrollDepth,
  trackTimeOnPage,
  updateConsent,
  setDefaultConsent,
};
