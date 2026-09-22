/**
 * Settings Context
 * User preferences and configuration
 */

import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

const STORAGE_KEY = 'osintx_settings';

const defaultSettings = {
  // Appearance
  theme: 'dark',
  fontSize: 'medium',
  compactMode: false,
  
  // Notifications
  enableNotifications: true,
  enableSounds: false,
  notificationPosition: 'top-right',
  
  // Tool defaults
  autoSaveResults: true,
  defaultExportFormat: 'json',
  maxHistoryItems: 50,
  
  // Privacy
  analyticsEnabled: false,
  saveSensitiveData: false,
  
  // Performance
  enableAnimations: true,
  cacheResults: true,
  batchSize: 10,
  
  // Accessibility
  reducedMotion: false,
  highContrast: false,
  keyboardShortcuts: true,
  
  // Advanced
  apiTimeout: 30000,
  maxRetries: 3,
  debugMode: false,

  // AI & Automation
  localAiEnabled: true,
  ollamaEndpoint: 'http://127.0.0.1:11434',
  preferredLocalModel: 'qwen2.5:3b',
  browserAiEnabled: true,
  cloudAiEnabled: false,
  groqApiKey: '',
  geminiApiKey: '',
  huggingFaceToken: '',
  redactSensitiveBeforeCloud: true,
  allowCloudPerCase: false,
  maxAutomationDepth: 2,
  autoSaveVerifiedEvidence: false,
  requireApprovalBeforeRecursivePivots: true,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      }
    } catch (error) {
      console.error('[Settings] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.error('[Settings] Failed to save:', error);
      }
    }
  }, [settings, loading]);

  // Apply theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Apply reduced motion
  useEffect(() => {
    if (settings.reducedMotion || !settings.enableAnimations) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
    }
  }, [settings.reducedMotion, settings.enableAnimations]);

  /**
   * Update a single setting
   */
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Update multiple settings
   */
  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  /**
   * Reset settings to defaults
   */
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  /**
   * Get setting value
   */
  const getSetting = (key) => {
    return settings[key];
  };

  /**
   * Export settings
   */
  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  /**
   * Import settings
   */
  const importSettings = (jsonString) => {
    try {
      const imported = JSON.parse(jsonString);
      setSettings({ ...defaultSettings, ...imported });
      return true;
    } catch (error) {
      console.error('[Settings] Import failed:', error);
      return false;
    }
  };

  /**
   * Toggle boolean setting
   */
  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const value = {
    settings,
    loading,
    updateSetting,
    updateSettings,
    resetSettings,
    getSetting,
    exportSettings,
    importSettings,
    toggleSetting,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export default SettingsContext;
