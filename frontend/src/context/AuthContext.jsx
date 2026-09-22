import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = `${import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/auth`;

const DEMO_USERS = {
  student: {
    id: 'demo-student',
    name: 'Demo Student',
    email: 'student@demo.osintx',
    role: 'student',
    credits: 100,
    organization: 'OsintX Academy'
  },
  user: {
    id: 'demo-officer',
    name: 'Demo Investigator',
    email: 'officer@demo.osintx',
    role: 'user',
    credits: 100,
    organization: 'OsintX Academy'
  }
};

const isDemoToken = (token) => token && token.startsWith('demo-');

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('osintx_token');

      if (storedToken) {
        if (isDemoToken(storedToken)) {
          const demoUser = DEMO_USERS[storedToken.replace('demo-', '')] || null;
          if (demoUser) {
            setUser(demoUser);
            setToken(storedToken);
            setIsLoading(false);
            return;
          }
          localStorage.removeItem('osintx_token');
        } else {
          try {
            const res = await fetch(`${API_BASE}/me`, {
              headers: { Authorization: `Bearer ${storedToken}` }
            });
            const data = await res.json();

            if (data.success && data.user) {
              setUser(data.user);
              setToken(storedToken);
              setIsLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem('osintx_token');
          }
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Persist session in local storage
  const persistSession = useCallback((userData, authToken = null) => {
    if (authToken) {
      localStorage.setItem('osintx_token', authToken);
    }
  }, []);

  // Demo login - frontend-only, no API required
  const demoLogin = useCallback(async (role = 'student') => {
    const demoUser = DEMO_USERS[role] || DEMO_USERS.student;
    const demoToken = `demo-${demoUser.role}`;

    localStorage.setItem('osintx_token', demoToken);
    sessionStorage.setItem('osintx_selected_role', demoUser.role);

    setUser(demoUser);
    setToken(demoToken);
    setAuthError(null);
    setIsLoading(false);

    return { success: true, user: demoUser };
  }, []);

  // Regular login - calls real API
  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        persistSession(data.user, data.token);
        setIsLoading(false);
        return { success: true };
      } else {
        setAuthError(data.error || 'Login failed');
        setIsLoading(false);
        return { success: false, error: data.error };
      }
    } catch (err) {
      setAuthError('Failed to connect to server');
      setIsLoading(false);
      return { success: false, error: 'Connection failed' };
    }
  }, [persistSession]);

  // OAuth — initiate Google login
  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const role = sessionStorage.getItem('osintx_selected_role') || 'user';
      const res = await fetch(`${API_BASE}/google?role=${role}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setAuthError('Failed to initiate Google login');
        setIsLoading(false);
      }
    } catch {
      setAuthError('Failed to connect to server for Google login');
      setIsLoading(false);
    }
  }, []);

  // OAuth — initiate GitHub login
  const loginWithGithub = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const role = sessionStorage.getItem('osintx_selected_role') || 'user';
      const res = await fetch(`${API_BASE}/github?role=${role}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setAuthError('Failed to initiate GitHub login');
        setIsLoading(false);
      }
    } catch {
      setAuthError('Failed to connect to server for GitHub login');
      setIsLoading(false);
    }
  }, []);

  // OAuth — handle callback after redirect
  const handleOAuthCallback = useCallback(async (provider, code) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const role = sessionStorage.getItem('osintx_selected_role') || 'user';
      const res = await fetch(`${API_BASE}/${provider}/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, role }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        persistSession(data.user, data.token);
        setIsLoading(false);
        return { success: true };
      } else {
        setAuthError(data.error || 'OAuth authentication failed');
        setIsLoading(false);
        return { success: false, error: data.error };
      }
    } catch {
      setAuthError('OAuth callback failed');
      setIsLoading(false);
      return { success: false, error: 'OAuth callback failed' };
    }
  }, [persistSession]);

  // Signup - calls real API
  const signup = useCallback(async (userData) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role || 'student'
        })
      });

      const data = await res.json();

      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token);
        persistSession(data.user, data.token);
        setIsLoading(false);
        return { success: true };
      } else {
        setAuthError(data.error || 'Signup failed');
        setIsLoading(false);
        return { success: false, error: data.error };
      }
    } catch (err) {
      setAuthError('Failed to connect to server');
      setIsLoading(false);
      return { success: false, error: 'Connection failed' };
    }
  }, [persistSession]);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAuthError(null);
    localStorage.removeItem('osintx_token');
    sessionStorage.removeItem('osintx_session');
    sessionStorage.removeItem('osintx_selected_role');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Update user data (for profile updates)
  const updateUser = useCallback((userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  }, []);

  // Get auth header for API calls
  const getAuthHeader = useCallback(() => {
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, [token]);

  const value = {
    user,
    token,
    isLoading,
    authError,
    isAuthenticated: !!user,
    login,
    demoLogin,
    loginWithGoogle,
    loginWithGithub,
    handleOAuthCallback,
    signup,
    logout,
    clearError,
    getAuthHeader,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
