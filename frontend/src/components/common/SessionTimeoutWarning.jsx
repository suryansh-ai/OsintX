/**
 * Session Timeout Warning
 * Shows a warning modal before session expires with countdown
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Clock, AlertTriangle, LogOut, RefreshCw, Shield } from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { useTheme } from '../../context/ThemeContext';

const SessionTimeoutWarning = () => {
  const { showTimeoutWarning, timeRemaining, extendSession } = useSession();
  const { isDark } = useTheme();

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercent = (timeRemaining / (5 * 60 * 1000)) * 100;

  return (
    <AnimatePresence>
      {showTimeoutWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 20 }}
            className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${
              isDark 
                ? 'bg-slate-900 border-amber-500/30' 
                : 'bg-white border-amber-300'
            }`}
          >
            {/* Warning Header */}
            <div className="relative p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/20">
              {/* Animated Warning Icon */}
              <div className="flex justify-center mb-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="relative"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <AlertTriangle className="w-10 h-10 text-white" />
                  </div>
                  {/* Pulse Effect */}
                  <motion.div
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-amber-500"
                  />
                </motion.div>
              </div>

              <h2 className={`text-xl font-bold text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Session Expiring Soon
              </h2>
              <p className={`text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Your session will expire due to inactivity
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center">
                  {/* Circular Progress */}
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={isDark ? '#1e293b' : '#e5e7eb'}
                      strokeWidth="8"
                      fill="none"
                    />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={352}
                      strokeDashoffset={352 - (352 * progressPercent) / 100}
                      transition={{ duration: 1 }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Clock className={`w-6 h-6 mb-1 ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
                    <motion.span
                      key={timeRemaining}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className={`text-3xl font-bold font-mono ${
                        timeRemaining < 60000 ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {formatTime(timeRemaining)}
                    </motion.span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Message */}
              <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
                isDark ? 'bg-slate-800/50' : 'bg-gray-50'
              }`}>
                <Shield className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-500'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  For your security, we automatically log you out after 30 minutes of inactivity. 
                  Click "Stay Logged In" to continue your session.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={extendSession}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
                >
                  <RefreshCw className="w-5 h-5" />
                  Stay Logged In
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = '/login'}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border transition-colors ${
                    isDark 
                      ? 'border-white/10 text-gray-400 hover:bg-white/5' 
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Log Out Now
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionTimeoutWarning;
