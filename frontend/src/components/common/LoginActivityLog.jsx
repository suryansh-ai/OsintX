/**
 * Login Activity Log Component
 * Displays detailed login history with device info and actions
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, X, Monitor, Smartphone, Tablet, Globe, Clock, 
  CheckCircle, XCircle, AlertTriangle, Shield, LogIn, LogOut,
  Chrome, Laptop, MapPin, Trash2, RefreshCw
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';

// Device icons
const deviceIcons = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

// Browser icons (simplified)
const browserIcons = {
  Chrome: Chrome,
  Firefox: Globe,
  Safari: Globe,
  Edge: Globe,
};

// Activity type configurations
const activityTypes = {
  login: { 
    icon: LogIn, 
    color: 'emerald', 
    label: 'Logged In',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/20'
  },
  logout: { 
    icon: LogOut, 
    color: 'cyan', 
    label: 'Logged Out',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/20'
  },
  session_expired: { 
    icon: AlertTriangle, 
    color: 'amber', 
    label: 'Session Expired',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500/20'
  },
  failed_attempt: { 
    icon: XCircle, 
    color: 'rose', 
    label: 'Failed Attempt',
    bgClass: 'bg-rose-500/10',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500/20'
  },
};

const LoginActivityLog = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { getUserActivity, getAllActivity, clearActivity, getActivityStats } = useSession();
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('user'); // 'user' or 'all'
  const [confirmClear, setConfirmClear] = useState(false);

  const activity = viewMode === 'user' ? getUserActivity() : getAllActivity();
  const stats = getActivityStats();

  const filteredActivity = filter === 'all' 
    ? activity 
    : activity.filter(a => a.type === filter);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now - then;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(timestamp);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border ${
              isDark 
                ? 'bg-slate-900 border-white/10' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-gradient-to-r from-violet-500/10 to-rose-500/10' : 'border-gray-200 bg-gradient-to-r from-violet-50 to-rose-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center shadow-lg">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Login Activity
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Monitor your account security
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </motion.button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stats.totalLogins}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Logins</div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <div className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {stats.last24Hours}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last 24 Hours</div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <div className={`text-2xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    {stats.sessionExpiries}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sessions Expired</div>
                </div>
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <div className={`text-2xl font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                    {stats.failedAttempts}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Failed Attempts</div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-2">
                  {['all', 'login', 'logout', 'session_expired', 'failed_attempt'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filter === type
                          ? 'bg-gradient-to-r from-violet-500 to-rose-500 text-white'
                          : isDark
                            ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type === 'all' ? 'All' : activityTypes[type]?.label || type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Activity List */}
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar">
              {filteredActivity.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {filteredActivity.map((entry, idx) => {
                    const typeConfig = activityTypes[entry.type] || activityTypes.login;
                    const TypeIcon = typeConfig.icon;
                    const DeviceIcon = deviceIcons[entry.device?.device] || Monitor;
                    
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className={`p-4 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Activity Type Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${typeConfig.bgClass}`}>
                            <TypeIcon className={`w-5 h-5 ${typeConfig.textClass}`} />
                          </div>

                          {/* Activity Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {typeConfig.label}
                              </span>
                              {entry.success ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-400" />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2">
                              {/* Device Info */}
                              <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <DeviceIcon className="w-3.5 h-3.5" />
                                <span>{entry.device?.device || 'Unknown'}</span>
                              </div>
                              
                              {/* OS */}
                              <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Laptop className="w-3.5 h-3.5" />
                                <span>{entry.device?.os || 'Unknown'}</span>
                              </div>
                              
                              {/* Browser */}
                              <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Globe className="w-3.5 h-3.5" />
                                <span>{entry.device?.browser || 'Unknown'}</span>
                              </div>
                            </div>

                            {/* Email */}
                            {entry.user?.email && (
                              <div className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                {entry.user.email}
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div className="text-right">
                            <div className={`flex items-center gap-1.5 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Clock className="w-4 h-4" />
                              {formatTimeAgo(entry.timestamp)}
                            </div>
                            <div className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                              {formatDate(entry.timestamp)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Shield className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No activity recorded
                  </h3>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    Your login activity will appear here
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                {confirmClear ? (
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Clear all login activity?
                    </span>
                    <button
                      onClick={() => {
                        clearActivity();
                        setConfirmClear(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-sm font-medium hover:bg-rose-500/30 transition-colors"
                    >
                      Yes, clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClear(true)}
                    className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-500 hover:text-rose-400' : 'text-gray-500 hover:text-rose-500'} transition-colors`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear activity log
                  </button>
                )}
                
                <div className="flex items-center gap-3">
                  {stats.lastLogin && (
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      Last login: {formatTimeAgo(stats.lastLogin)}
                    </span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-rose-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Done
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginActivityLog;
