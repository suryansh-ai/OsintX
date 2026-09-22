/**
 * Fetch wrapper with AbortController timeout support.
 * Auto-cleans up the abort timer on completion.
 */
export const fetchWithTimeout = (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
};

/**
 * Creates an AbortController that auto-aborts after a timeout.
 * Useful when you need to keep the controller reference for cleanup.
 */
export const createAbortWithTimeout = (timeoutMs = 30000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { controller, timer };
};

export default fetchWithTimeout;
