/**
 * CAPTCHA Component
 * Unified CAPTCHA component supporting reCAPTCHA and Cloudflare Turnstile
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { renderCaptcha, resetCaptcha, getCaptchaResponse, getCaptchaProvider } from '../../utils/captcha';
import { Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const CaptchaWidget = ({ 
  onVerify, 
  onError, 
  onExpired,
  theme = 'dark',
  size = 'normal',
  className = '',
  showStatus = true,
}) => {
  const containerRef = useRef(null);
  const [widgetId, setWidgetId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, verified, error, expired
  const [provider] = useState(getCaptchaProvider());

  const handleSuccess = useCallback((token) => {
    setStatus('verified');
    onVerify?.(token);
  }, [onVerify]);

  const handleError = useCallback((error) => {
    setStatus('error');
    onError?.(error);
  }, [onError]);

  const handleExpired = useCallback(() => {
    setStatus('expired');
    onExpired?.();
  }, [onExpired]);

  useEffect(() => {
    let mounted = true;

    const initWidget = async () => {
      if (!containerRef.current) return;

      setStatus('loading');
      
      try {
        const id = await renderCaptcha(containerRef.current.id, {
          theme,
          size,
          onSuccess: handleSuccess,
          onError: handleError,
          onExpired: handleExpired,
        });

        if (mounted && id !== null) {
          setWidgetId(id);
          setStatus('idle');
        }
      } catch (error) {
        console.error('Failed to initialize CAPTCHA:', error);
        if (mounted) {
          setStatus('error');
        }
      }
    };

    initWidget();

    return () => {
      mounted = false;
    };
  }, [theme, size, handleSuccess, handleError, handleExpired]);

  const handleReset = async () => {
    if (widgetId !== null) {
      await resetCaptcha(widgetId);
      setStatus('idle');
    }
  };

  const getToken = async () => {
    if (widgetId !== null) {
      return await getCaptchaResponse(widgetId);
    }
    return null;
  };

  const statusConfig = {
    idle: { icon: Shield, color: 'text-gray-400', text: 'Verify you\'re human' },
    loading: { icon: RefreshCw, color: 'text-cyan-400', text: 'Loading...', animate: true },
    verified: { icon: CheckCircle, color: 'text-green-400', text: 'Verified' },
    error: { icon: AlertCircle, color: 'text-red-400', text: 'Verification failed' },
    expired: { icon: RefreshCw, color: 'text-amber-400', text: 'Expired - Please retry' },
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* CAPTCHA Container */}
      <div 
        id="captcha-container"
        ref={containerRef}
        className="min-h-[65px] flex items-center justify-center"
      />

      {/* Status Display */}
      {showStatus && (
        <div className={`flex items-center gap-2 text-sm ${currentStatus.color}`}>
          <StatusIcon className={`w-4 h-4 ${currentStatus.animate ? 'animate-spin' : ''}`} />
          <span>{currentStatus.text}</span>
        </div>
      )}

      {/* Provider Badge */}
      <div className="text-xs text-gray-500">
        Protected by {provider === 'turnstile' ? 'Cloudflare Turnstile' : 'Google reCAPTCHA'}
      </div>

      {/* Reset Button (shown on error/expired) */}
      {(status === 'error' || status === 'expired') && (
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-xs rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default CaptchaWidget;

// Export helper for getting token from parent component
export { getCaptchaResponse as getCaptchaToken };
