import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ChevronLeft, X, Check, CheckCheck, Trash2, Settings,
  Filter, Search, Clock, AlertTriangle, Award, FileText, Zap,
  Shield, TrendingUp, MessageCircle, Gift, Target, Volume2, VolumeX,
  ChevronDown, Archive, MoreHorizontal, RefreshCw, Circle
} from 'lucide-react';

const Notifications = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'case',
      title: 'New Case Available',
      message: 'A new phishing investigation case "Operation Bait" has been added to your difficulty level.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
      priority: 'normal',
      action: { label: 'View Case', path: '/dashboard/student/cases' }
    },
    {
      id: 2,
      type: 'threat',
      title: 'Critical Threat Alert',
      message: 'New ransomware variant detected targeting educational institutions. Review threat intelligence.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      read: false,
      priority: 'high',
      action: { label: 'View Details', path: '/dashboard/student' }
    },
    {
      id: 3,
      type: 'achievement',
      title: 'Badge Unlocked!',
      message: 'Congratulations! You earned the "First Blood" badge for completing your first investigation.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
      priority: 'normal',
      action: { label: 'View Badge', path: '/dashboard/student/profile' }
    },
    {
      id: 4,
      type: 'system',
      title: 'Platform Update v2.5',
      message: 'New features: Enhanced terminal, improved globe visualization, and 5 new investigation tools.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      priority: 'low',
      action: { label: 'Learn More', path: '/dashboard/student/help' }
    },
    {
      id: 5,
      type: 'xp',
      title: 'XP Earned',
      message: 'You earned 250 XP for completing "SQL Injection Analysis" case with 95% accuracy.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: true,
      priority: 'normal',
    },
    {
      id: 6,
      type: 'streak',
      title: 'Streak Milestone!',
      message: 'You maintained a 7-day login streak! Bonus 100 credits added to your account.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      read: true,
      priority: 'normal',
    },
    {
      id: 7,
      type: 'case',
      title: 'Case Deadline Approaching',
      message: 'Your active case "Network Intrusion Detection" expires in 24 hours. Complete it to earn rewards.',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      read: true,
      priority: 'high',
      action: { label: 'Continue Case', path: '/dashboard/student/cases' }
    },
    {
      id: 8,
      type: 'achievement',
      title: 'Level Up!',
      message: 'You reached Level 5! New cases and tools are now unlocked for your investigation.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
      priority: 'normal',
      action: { label: 'View Progress', path: '/dashboard/student/profile' }
    },
    {
      id: 9,
      type: 'mention',
      title: 'Team Mention',
      message: '@AgentShadow mentioned you in the "APT Hunting" team discussion.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'normal',
    },
    {
      id: 10,
      type: 'system',
      title: 'Scheduled Maintenance',
      message: 'The platform will undergo maintenance on Jan 5th, 2:00 AM - 4:00 AM IST.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'low',
    },
  ]);

  const tabs = [
    { id: 'all', name: 'All', count: notifications.length },
    { id: 'unread', name: 'Unread', count: notifications.filter(n => !n.read).length },
    { id: 'cases', name: 'Cases', count: notifications.filter(n => n.type === 'case').length },
    { id: 'achievements', name: 'Achievements', count: notifications.filter(n => n.type === 'achievement' || n.type === 'xp' || n.type === 'streak').length },
    { id: 'threats', name: 'Threats', count: notifications.filter(n => n.type === 'threat').length },
    { id: 'system', name: 'System', count: notifications.filter(n => n.type === 'system').length },
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'case': return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'threat': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'achievement': return <Award className="w-5 h-5 text-amber-400" />;
      case 'system': return <Shield className="w-5 h-5 text-blue-400" />;
      case 'xp': return <Zap className="w-5 h-5 text-purple-400" />;
      case 'streak': return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'mention': return <MessageCircle className="w-5 h-5 text-pink-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationBg = (type) => {
    switch (type) {
      case 'case': return 'bg-cyan-500/10 border-cyan-500/30';
      case 'threat': return 'bg-red-500/10 border-red-500/30';
      case 'achievement': return 'bg-amber-500/10 border-amber-500/30';
      case 'system': return 'bg-blue-500/10 border-blue-500/30';
      case 'xp': return 'bg-purple-500/10 border-purple-500/30';
      case 'streak': return 'bg-green-500/10 border-green-500/30';
      case 'mention': return 'bg-pink-500/10 border-pink-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = !searchQuery || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = 
      activeTab === 'all' ||
      (activeTab === 'unread' && !n.read) ||
      (activeTab === 'cases' && n.type === 'case') ||
      (activeTab === 'achievements' && ['achievement', 'xp', 'streak'].includes(n.type)) ||
      (activeTab === 'threats' && n.type === 'threat') ||
      (activeTab === 'system' && n.type === 'system');

    return matchesSearch && matchesTab;
  });

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
  };

  const toggleSelect = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#010408] text-gray-100">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/student')}
              className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Bell className="w-6 h-6 text-cyan-400" />
                Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500">Stay updated with your activities</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${
                soundEnabled
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800/50 border-gray-700 text-gray-500'
              }`}
              title={soundEnabled ? 'Mute notifications' : 'Unmute notifications'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => navigate('/dashboard/student/settings')}
              className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-gray-300 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Search & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0a1520]/80 border border-cyan-500/20 text-white placeholder-gray-500 outline-none focus:border-cyan-500 transition-all text-sm"
            />
          </div>
          <div className="flex gap-2">
            {selectedNotifications.length > 0 ? (
              <>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedNotifications.length})
                </button>
                <button
                  onClick={() => setSelectedNotifications([])}
                  className="px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-gray-300 transition-all text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="px-3 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 mb-4 overflow-x-auto pb-2"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800/30 border-gray-700 text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-sm">{tab.name}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-cyan-500/30' : 'bg-gray-700/50'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Select All */}
        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-400">Select all</span>
            </label>
            <span className="text-xs text-gray-600">{filteredNotifications.length} notifications</span>
          </div>
        )}

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No notifications</h3>
              <p className="text-sm text-gray-600">
                {searchQuery ? 'No notifications match your search' : 'You\'re all caught up!'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredNotifications.map((notification, idx) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`relative p-4 rounded-xl border transition-all group ${
                    notification.read
                      ? 'bg-[#0a1520]/60 border-gray-800'
                      : `${getNotificationBg(notification.type)}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                    />

                    {/* Icon */}
                    <div className={`p-2 rounded-lg ${
                      notification.read ? 'bg-gray-800/50' : getNotificationBg(notification.type).split(' ')[0]
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        )}
                        {notification.priority === 'high' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">
                            Urgent
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${notification.read ? 'text-gray-500' : 'text-gray-400'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.action && (
                          <button
                            onClick={() => {
                              markAsRead(notification.id);
                              navigate(notification.action.path);
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                          >
                            {notification.action.label} →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-green-400 transition-all"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </motion.div>

        {/* Load More */}
        {filteredNotifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <button className="px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-gray-300 transition-all text-sm flex items-center gap-2 mx-auto">
              <RefreshCw className="w-4 h-4" />
              Load older notifications
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
