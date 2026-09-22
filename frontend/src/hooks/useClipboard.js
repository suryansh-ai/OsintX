/**
 * Clipboard Hook
 * Copy text to clipboard with feedback
 */

import { useState, useCallback } from 'react';
import { useToast } from '../components/common/Toast';

export const useClipboard = (options = {}) => {
  const {
    successMessage = 'Copied to clipboard!',
    errorMessage = 'Failed to copy',
    timeout = 2000,
  } = options;

  const toast = useToast?.() || null;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const copy = useCallback(async (text) => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (!success) {
          throw new Error('Copy command failed');
        }
      }

      setCopied(true);
      setError(null);
      
      if (toast) {
        toast.success(successMessage);
      }

      // Reset copied state after timeout
      setTimeout(() => setCopied(false), timeout);

      return true;
    } catch (err) {
      console.error('[Clipboard] Copy failed:', err);
      setError(err.message);
      setCopied(false);
      
      if (toast) {
        toast.error(errorMessage);
      }

      return false;
    }
  }, [successMessage, errorMessage, timeout, toast]);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copy, copied, error, reset };
};

/**
 * Copy button component helper
 */
export default useClipboard;
