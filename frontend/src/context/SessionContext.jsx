/**
 * Session Context
 * Manages session timeout warnings and login activity tracking
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const SessionContext = createContext(null);

const STORAGE_KEY = 'osintx_loginActivity';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE = 5 * 60 * 1000; // 5 minutes warning

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(SESSION_TIMEOUT);
  const [loginActivity, setLoginActivity] = useState([]);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const timeoutRef = useRef(null);
  const warningRef = useRef(null);
  const countdownRef = useRef(null);

  // Load login activity from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setLoginActivity(JSON.parse(saved));
      }
    } catch (error) {
      console.error('[Session] Failed to load login activity:', error);
    }
  }, []);

  // Save login activity to storage
  const persistLoginActivity = useCallback((activity) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activity));
    } catch (error) {
      console.error('[Session] Failed to save login activity:', error);
    }
  }, []);

  // Record login activity
  const recordLogin = useCallback((userData, type = 'login') => {
    const entry = {
      id: `login-${Date.now()}`,
      type, // 'login', 'logout', 'session_expired', 'failed_attempt'
      timestamp: new Date().toISOString(),
      user: userData ? {
        email: userData.email,
        role: userData.role,
        name: userData.name,
      } : null,
      device: getDeviceInfo(),
      location: 'Unknown', // Would need geolocation API in production
      ip: 'Local', // Would need backend in production
      userAgent: navigator.userAgent,
      success: type === 'login' || type === 'logout',
    };

    setLoginActivity(prev => {
      const updated = [entry, ...prev].slice(0, 100); // Keep last 100 entries
      persistLoginActivity(updated);
      return updated;
    });

    return entry;
  }, [persistLoginActivity]);

  // Record logout
  const recordLogout = useCallback((reason = 'manual') => {
    const entry = {
      id: `logout-${Date.now()}`,
      type: reason === 'timeout' ? 'session_expired' : 'logout',
      timestamp: new Date().toISOString(),
      user: user ? {
        email: user.email,
        role: user.role,
        name: user.name,
      } : null,
      device: getDeviceInfo(),
      reason,
      success: true,
    };

    setLoginActivity(prev => {
      const updated = [entry, ...prev].slice(0, 100);
      persistLoginActivity(updated);
      return updated;
    });
  }, [user, persistLoginActivity]);

  // Keep fresh references for timeout callbacks
  const recordLogoutRef = useRef(recordLogout);
  const logoutRef = useRef(logout);
  useEffect(() => { recordLogoutRef.current = recordLogout; }, [recordLogout]);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  // Reset activity timers
  const resetTimers = useCallback(() => {
    setLastActivity(Date.now());
    setShowTimeoutWarning(false);
    setTimeRemaining(SESSION_TIMEOUT);

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (isAuthenticated) {
      // Set warning timer
      warningRef.current = setTimeout(() => {
        setShowTimeoutWarning(true);
        setTimeRemaining(WARNING_BEFORE);
        
        // Start countdown
        countdownRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            const newTime = prev - 1000;
            if (newTime <= 0) {
              clearInterval(countdownRef.current);
              return 0;
            }
            return newTime;
          });
        }, 1000);
      }, SESSION_TIMEOUT - WARNING_BEFORE);

      // Set logout timer — wrapped in try/catch to prevent crash
      timeoutRef.current = setTimeout(() => {
        try {
          recordLogoutRef.current('timeout');
          logoutRef.current();
        } catch (err) {
          console.error('[Session] Timeout logout failed:', err);
          // Fallback: force navigate to login
          sessionStorage.removeItem('osintx_session');
          window.location.href = '/login';
        }
      }, SESSION_TIMEOUT);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Track user activity — stable reference via refs to avoid re-registration
  const showTimeoutWarningRef = useRef(showTimeoutWarning);
  useEffect(() => { showTimeoutWarningRef.current = showTimeoutWarning; }, [showTimeoutWarning]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      if (!showTimeoutWarningRef.current) {
        resetTimers();
      }
    };

    // Throttle activity handler to prevent excessive timer resets
    let throttleTimer = null;
    const throttledActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        handleActivity();
      }, 1000);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, throttledActivity, { passive: true }));

    // Initial timer setup
    resetTimers();

    return () => {
      events.forEach(event => window.removeEventListener(event, throttledActivity));
      if (throttleTimer) clearTimeout(throttleTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Extend session (when user clicks "Stay logged in")
  const extendSession = useCallback(() => {
    setShowTimeoutWarning(false);
    resetTimers();
  }, [resetTimers]);

  // Get login activity for current user
  const getUserActivity = useCallback(() => {
    if (!user?.email) return [];
    return loginActivity.filter(
      entry => entry.user?.email === user.email
    );
  }, [loginActivity, user]);

  // Get all login activity (for admin view)
  const getAllActivity = useCallback(() => {
    return loginActivity;
  }, [loginActivity]);

  // Clear login activity
  const clearActivity = useCallback(() => {
    setLoginActivity([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get activity statistics
  const getActivityStats = useCallback(() => {
    const userActivity = getUserActivity();
    const now = new Date();
    const last24h = userActivity.filter(
      a => (now - new Date(a.timestamp)) < 24 * 60 * 60 * 1000
    );
    const last7d = userActivity.filter(
      a => (now - new Date(a.timestamp)) < 7 * 24 * 60 * 60 * 1000
    );

    return {
      totalLogins: userActivity.filter(a => a.type === 'login').length,
      last24Hours: last24h.length,
      last7Days: last7d.length,
      failedAttempts: userActivity.filter(a => a.type === 'failed_attempt').length,
      sessionExpiries: userActivity.filter(a => a.type === 'session_expired').length,
      lastLogin: userActivity.find(a => a.type === 'login')?.timestamp,
    };
  }, [getUserActivity]);

  const value = {
    showTimeoutWarning,
    timeRemaining,
    extendSession,
    recordLogin,
    recordLogout,
    loginActivity,
    getUserActivity,
    getAllActivity,
    clearActivity,
    getActivityStats,
    lastActivity,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

// Helper to get device info
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let device = 'Unknown';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect Browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  // Detect Device Type
  if (ua.includes('Mobile')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';
  else device = 'Desktop';

  return { device, os, browser };
};

export default SessionContext;
