import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ActivityContext = createContext(null);

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within ActivityProvider');
  }
  return context;
};

// Storage key for persistence
const STORAGE_KEY = 'osintx_activity';

export const ActivityProvider = ({ children }) => {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load activities from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setActivities(parsed.activities || []);
        setNotifications(parsed.notifications || []);
        setUnreadCount(parsed.notifications?.filter(n => !n.read).length || 0);
      } catch {
        setActivities([]);
        setNotifications([]);
      }
    }
  }, []);

  // Persist to storage
  const persist = useCallback((acts, notifs) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      activities: acts,
      notifications: notifs
    }));
  }, []);

  // Log activity
  const logActivity = useCallback((action, details = {}) => {
    const activity = {
      id: `act-${Date.now()}`,
      action,
      details,
      user: user?.name || 'Anonymous',
      timestamp: new Date().toISOString(),
      type: details.type || 'action'
    };

    const updatedActivities = [activity, ...activities].slice(0, 100);
    setActivities(updatedActivities);
    persist(updatedActivities, notifications);

    return activity;
  }, [activities, notifications, persist, user]);

  // Add notification
  const addNotification = useCallback((message, type = 'info', link = null) => {
    const notification = {
      id: `notif-${Date.now()}`,
      message,
      type,
      link,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedNotifications = [notification, ...notifications].slice(0, 50);
    setNotifications(updatedNotifications);
    setUnreadCount(prev => prev + 1);
    persist(activities, updatedNotifications);

    return notification;
  }, [activities, notifications, persist]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    const updated = notifications.map(n => {
      if (n.id === notificationId && !n.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        return { ...n, read: true };
      }
      return n;
    });
    setNotifications(updated);
    persist(activities, updated);
  }, [activities, notifications, persist]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    persist(activities, updated);
  }, [activities, notifications, persist]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    persist(activities, []);
  }, [activities, persist]);

  // Get recent activities
  const getRecentActivities = useCallback((count = 10) => {
    return activities.slice(0, count);
  }, [activities]);

  // Get activities by type
  const getActivitiesByType = useCallback((type) => {
    return activities.filter(a => a.type === type);
  }, [activities]);

  // Format time ago
  const formatTimeAgo = useCallback((timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  }, []);

  const value = {
    activities,
    notifications,
    unreadCount,
    logActivity,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getRecentActivities,
    getActivitiesByType,
    formatTimeAgo
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};

export default ActivityContext;
