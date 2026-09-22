import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import telegramService from '../services/telegramService';
import { useAuth } from './AuthContext';

const TelegramContext = createContext(null);

export const TelegramProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();

  // Session status
  const [status, setStatus] = useState({
    configured: false,
    phone: null,
    daysRemaining: null,
    expiringSoon: false,
    expiresAt: null,
    lastUsed: null,
    loading: true,
  });

  // Login flow state
  const [loginState, setLoginState] = useState({
    step: 'idle', // idle | codeSent | verifying | needs2FA | success | error
    phone: '',
    error: null,
  });

  /** Fetch session status from backend */
  const refreshStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await telegramService.getStatus();
      setStatus({
        configured: data.configured || false,
        phone: data.phone || null,
        daysRemaining: data.daysRemaining ?? null,
        expiringSoon: data.expiringSoon || false,
        expiresAt: data.expiresAt || null,
        lastUsed: data.lastUsed || null,
        loading: false,
        expired: data.expired || false,
      });
    } catch {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  }, [isAuthenticated]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Periodic check every 30 minutes for expiry alerts
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refreshStatus, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshStatus]);

  /** Step 1: Request OTP */
  const sendCode = async (phone) => {
    try {
      setLoginState({ step: 'codeSent', phone, error: null });
      await telegramService.sendCode(phone);
      return true;
    } catch (err) {
      setLoginState({ step: 'error', phone, error: err.data?.error || err.message });
      return false;
    }
  };

  /** Step 2: Verify OTP */
  const verifyCode = async (code) => {
    try {
      setLoginState((prev) => ({ ...prev, step: 'verifying', error: null }));
      const result = await telegramService.verifyCode(loginState.phone, code);

      if (result.requires2FA) {
        setLoginState((prev) => ({ ...prev, step: 'needs2FA' }));
        return { requires2FA: true };
      }

      setLoginState({ step: 'success', phone: loginState.phone, error: null });
      await refreshStatus();
      return { success: true };
    } catch (err) {
      setLoginState((prev) => ({
        ...prev,
        step: 'codeSent',
        error: err.data?.error || err.message,
      }));
      return { success: false };
    }
  };

  /** Step 2b: Submit 2FA password */
  const verify2FA = async (password) => {
    try {
      setLoginState((prev) => ({ ...prev, step: 'verifying', error: null }));
      await telegramService.verify2FA(loginState.phone, password);
      setLoginState({ step: 'success', phone: loginState.phone, error: null });
      await refreshStatus();
      return { success: true };
    } catch (err) {
      setLoginState((prev) => ({
        ...prev,
        step: 'needs2FA',
        error: err.data?.error || err.message,
      }));
      return { success: false };
    }
  };

  /** Revoke session */
  const revokeSession = async () => {
    try {
      await telegramService.revokeSession();
      setStatus({
        configured: false,
        phone: null,
        daysRemaining: null,
        expiringSoon: false,
        expiresAt: null,
        lastUsed: null,
        loading: false,
      });
      setLoginState({ step: 'idle', phone: '', error: null });
      return true;
    } catch {
      return false;
    }
  };

  /** Reset login form */
  const resetLogin = () => {
    setLoginState({ step: 'idle', phone: '', error: null });
  };

  return (
    <TelegramContext.Provider
      value={{
        status,
        loginState,
        sendCode,
        verifyCode,
        verify2FA,
        revokeSession,
        resetLogin,
        refreshStatus,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const ctx = useContext(TelegramContext);
  if (!ctx) throw new Error('useTelegram must be used within TelegramProvider');
  return ctx;
};

export default TelegramContext;
