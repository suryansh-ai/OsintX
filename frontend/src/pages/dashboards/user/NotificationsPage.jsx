import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActivity } from '../../../context/ActivityContext';
import { useNavigate } from 'react-router-dom';
import {
  Bell, ArrowLeft, CheckCircle, AlertTriangle, X, Info,
  Trash2, Check, Filter, Clock, Zap, Target, Folder,
  Settings, ChevronDown
} from 'lucide-react';

// ============== NOTIFICATIONS PAGE ==============
const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications, formatTimeAgo, addNotification } = useActivity();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filterOptions = [
    { id: 'all', label: 'All Notifications' },
    { id: 'unread', label: 'Unread Only' },
    { id: 'success', label: 'Success' },
    { id: 'warning', label: 'Warnings' },
    { id: 'info', label: 'Info' }
  ];

  const filteredNotifications = notifications?.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  }) || [];

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error': return <X className="w-5 h-5 text-rose-400" />;
      default: return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getNotificationBg = (type, read) => {
    if (read) return 'bg-slate-800 border-slate-700';
    switch (type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/30';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30';
      case 'error': return 'bg-rose-500/10 border-rose-500/30';
      default: return 'bg-cyan-500/10 border-cyan-500/30';
    }
  };

  // Demo function to add sample notifications
  const addSampleNotification = (type) => {
    const messages = {
      success: 'Investigation completed successfully!',
      warning: 'Your credits are running low',
      info: 'New tool update available',
      error: 'Failed to process request'
    };
    if (addNotification) {
      addNotification(messages[type] || messages.info, type);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard/user')}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Bell className="w-6 h-6 text-cyan-400" />
                  Notifications
                </h1>
                <p className="text-sm text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">{filterOptions.find(f => f.id === filter)?.label}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showFilterMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 py-2 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-10"
                    >
                      {filterOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setFilter(option.id);
                            setShowFilterMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                            filter === option.id
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : 'text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {notifications && notifications.length > 0 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={markAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-cyan-500/50 transition-colors"
                  >
                    <Check className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-gray-300">Mark all read</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearNotifications}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span className="text-sm text-rose-400">Clear all</span>
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <p className="text-2xl font-bold text-white">{notifications?.length || 0}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <p className="text-2xl font-bold text-cyan-400">{unreadCount}</p>
            <p className="text-xs text-gray-500">Unread</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {notifications?.filter(n => n.type === 'success').length || 0}
            </p>
            <p className="text-xs text-gray-500">Success</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {notifications?.filter(n => n.type === 'warning').length || 0}
            </p>
            <p className="text-xs text-gray-500">Warnings</p>
          </div>
        </div>

        {/* Demo Buttons - Add Sample Notifications */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-sm text-gray-400 mb-3">Add sample notifications for testing:</p>
          <div className="flex gap-2">
            <button
              onClick={() => addSampleNotification('success')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors"
            >
              + Success
            </button>
            <button
              onClick={() => addSampleNotification('warning')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 text-sm hover:bg-amber-500/30 transition-colors"
            >
              + Warning
            </button>
            <button
              onClick={() => addSampleNotification('info')}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
            >
              + Info
            </button>
            <button
              onClick={() => addSampleNotification('error')}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/30 transition-colors"
            >
              + Error
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            <AnimatePresence>
              {filteredNotifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all hover:shadow-lg ${getNotificationBg(notif.type, notif.read)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      notif.type === 'success' ? 'bg-emerald-500/20' :
                      notif.type === 'warning' ? 'bg-amber-500/20' :
                      notif.type === 'error' ? 'bg-rose-500/20' : 'bg-cyan-500/20'
                    }`}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-base ${notif.read ? 'text-gray-400' : 'text-white font-medium'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(notif.timestamp)}
                        </span>
                        {!notif.read && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                    {!notif.read && (
                      <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Bell className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
              </h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                {filter === 'all' 
                  ? 'When you have notifications, they will appear here. Stay tuned!'
                  : 'Try changing the filter to see other notifications.'}
              </p>
            </motion.div>
          )}
        </div>

        {/* Notification Settings Link */}
        <div className="mt-8 p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Settings className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Notification Preferences</h3>
                <p className="text-sm text-gray-400">Customize how you receive notifications</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/dashboard/user/settings')}
              className="px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
            >
              Manage Settings
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
