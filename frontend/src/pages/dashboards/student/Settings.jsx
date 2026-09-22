import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import PhoneVerification from '../../../components/common/PhoneVerification';
import EmailVerification from '../../../components/common/EmailVerification';
import {
  Settings as SettingsIcon, ChevronLeft, User, Shield, Bell, Eye, Moon, Sun,
  Volume2, VolumeX, Globe, Lock, Key, Mail, Smartphone, Monitor, Palette,
  Download, Trash2, LogOut, Save, AlertCircle, CheckCircle, X, ChevronRight,
  ToggleLeft, ToggleRight, Zap, Activity, Clock, Database, Wifi, Terminal, Loader, Phone
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout, token, updateUser } = useAuth();
  
  // Settings State
  const [activeSection, setActiveSection] = useState('account');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Delete Account State
  const [deleteForm, setDeleteForm] = useState({
    password: '',
    confirmText: ''
  });
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Phone Verification State
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified || false);
  
  // Email Verification State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified || false);
  
  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    email: user?.email || '',
    displayName: user?.name || '',
    username: user?.username || '',
    phone: user?.phone || '',
    twoFactorEnabled: false,
  });

  // Update account settings when user changes
  useEffect(() => {
    if (user) {
      setAccountSettings({
        email: user.email || '',
        displayName: user.name || '',
        username: user.username || '',
        phone: user.phone || '',
        twoFactorEnabled: user.twoFactorEnabled || false,
      });
    }
  }, [user]);

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newCaseAlerts: true,
    threatAlerts: true,
    weeklyDigest: false,
    achievementAlerts: true,
    systemUpdates: true,
    marketingEmails: false,
    soundEffects: true,
    desktopNotifications: false,
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: 'dark',
    accentColor: 'cyan',
    fontSize: 'medium',
    animationsEnabled: true,
    reducedMotion: false,
    compactMode: false,
    showGridLines: true,
    terminalTransparency: 80,
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    showActivityStatus: true,
    allowFriendRequests: true,
    showProgress: true,
    shareAnalytics: true,
    dataSaver: false,
  });

  // Session Settings
  const [session, setSession] = useState({
    autoLogout: 30,
    rememberMe: true,
    activeSessions: [
      { id: 1, device: 'Windows PC - Chrome', location: 'Mumbai, India', lastActive: 'Now', current: true },
      { id: 2, device: 'Android - Mobile App', location: 'Delhi, India', lastActive: '2 hours ago', current: false },
    ]
  });

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: accountSettings.displayName,
          username: accountSettings.username,
          bio: '', // Add bio field if needed in the future
          organization: '' // Add organization field if needed
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      // Update user context
      if (updateUser && data.user) {
        updateUser(data.user);
      }
      
      setSaved(true);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => {
        setSaved(false);
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    
    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaved(true);
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => {
        setSaved(false);
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    
    // Validation
    if (deleteForm.confirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }
    
    // For local auth accounts, require password
    if (user?.provider === 'local' && !deleteForm.password) {
      setDeleteError('Please enter your password to confirm deletion');
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          password: deleteForm.password,
          confirmText: deleteForm.confirmText
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Account deleted, logout and redirect
      setShowDeleteModal(false);
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleSetting = (category, key) => {
    if (category === 'notifications') {
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    } else if (category === 'appearance') {
      setAppearance(prev => ({ ...prev, [key]: !prev[key] }));
    } else if (category === 'privacy') {
      setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
    } else if (category === 'session') {
      setSession(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const sections = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'privacy', name: 'Privacy', icon: Eye },
    { id: 'sessions', name: 'Sessions', icon: Monitor },
    { id: 'data', name: 'Data & Export', icon: Database },
  ];

  const accentColors = [
    { name: 'Cyan', value: 'cyan', class: 'bg-cyan-500' },
    { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
    { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
    { name: 'Green', value: 'green', class: 'bg-green-500' },
    { name: 'Amber', value: 'amber', class: 'bg-amber-500' },
    { name: 'Red', value: 'red', class: 'bg-red-500' },
  ];

  const ToggleSwitch = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <div>
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          enabled ? 'bg-cyan-500' : 'bg-gray-700'
        }`}
      >
        <motion.div
          animate={{ x: enabled ? 24 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full"
        />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#010408] text-gray-100">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
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
                <SettingsIcon className="w-6 h-6 text-cyan-400" />
                Settings
              </h1>
              <p className="text-sm text-gray-500">Manage your account and preferences</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
              saved
                ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                : loading
                ? 'bg-gray-500/20 border border-gray-500/50 text-gray-400 cursor-not-allowed'
                : 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30'
            }`}
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </motion.div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {(error || successMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-3 rounded-lg border flex items-center gap-2 ${
                error 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}
            >
              {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              <span className="text-sm">{error || successMessage}</span>
              <button 
                onClick={() => { setError(''); setSuccessMessage(''); }}
                className="ml-auto p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      activeSection === section.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="text-sm">{section.name}</span>
                    {activeSection === section.id && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Settings Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <AnimatePresence mode="wait">
              {/* Account Section */}
              {activeSection === 'account' && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-400" />
                      Account Information
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Display Name</label>
                        <input
                          type="text"
                          value={accountSettings.displayName}
                          onChange={(e) => setAccountSettings({ ...accountSettings, displayName: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input
                          type="text"
                          value={accountSettings.username}
                          onChange={(e) => setAccountSettings({ ...accountSettings, username: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="email"
                              value={accountSettings.email}
                              readOnly
                              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors pr-24"
                            />
                            {emailVerified && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setShowEmailModal(true)}
                            disabled={emailVerified}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                              emailVerified 
                                ? 'bg-green-500/10 border border-green-500/30 text-green-400 cursor-not-allowed'
                                : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                            }`}
                          >
                            <Mail className="w-4 h-4" />
                            {emailVerified ? 'Verified' : 'Verify'}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="tel"
                              value={accountSettings.phone}
                              readOnly
                              placeholder="Not verified"
                              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500 transition-colors pr-24"
                            />
                            {phoneVerified && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-400">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setShowPhoneModal(true)}
                            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-colors flex items-center gap-2"
                          >
                            <Phone className="w-4 h-4" />
                            {phoneVerified ? 'Change' : 'Verify'}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {phoneVerified 
                            ? 'Your phone number is verified and can be used for 2FA'
                            : 'Verify your phone number to enable SMS-based 2FA'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Connected Accounts</h2>
                    <div className="space-y-3">
                      {['Google', 'GitHub', 'LinkedIn'].map((service) => (
                        <div key={service} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                              <Globe className="w-4 h-4 text-gray-400" />
                            </div>
                            <span className="text-sm text-white">{service}</span>
                          </div>
                          <button className="px-3 py-1 rounded-lg text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20">
                            Connect
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-cyan-400" />
                      Password
                    </h2>
                    
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-cyan-500/30 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-gray-400" />
                        <div className="text-left">
                          <p className="text-sm text-white">Change Password</p>
                          <p className="text-xs text-gray-500">Last changed 30 days ago</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      Two-Factor Authentication
                    </h2>
                    
                    <ToggleSwitch
                      enabled={accountSettings.twoFactorEnabled}
                      onChange={() => setAccountSettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
                      label="Enable 2FA"
                      description="Add an extra layer of security to your account"
                    />
                    
                    {accountSettings.twoFactorEnabled && (
                      <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Two-factor authentication is enabled
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Danger Zone
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-cyan-400" />
                      Notification Preferences
                    </h2>
                    
                    <div className="space-y-1">
                      <ToggleSwitch
                        enabled={notifications.emailNotifications}
                        onChange={() => toggleSetting('notifications', 'emailNotifications')}
                        label="Email Notifications"
                        description="Receive notifications via email"
                      />
                      <ToggleSwitch
                        enabled={notifications.pushNotifications}
                        onChange={() => toggleSetting('notifications', 'pushNotifications')}
                        label="Push Notifications"
                        description="Browser and mobile push notifications"
                      />
                      <ToggleSwitch
                        enabled={notifications.desktopNotifications}
                        onChange={() => toggleSetting('notifications', 'desktopNotifications')}
                        label="Desktop Notifications"
                        description="Show notifications on your desktop"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Alert Types</h2>
                    
                    <div className="space-y-1">
                      <ToggleSwitch
                        enabled={notifications.newCaseAlerts}
                        onChange={() => toggleSetting('notifications', 'newCaseAlerts')}
                        label="New Case Alerts"
                        description="Get notified when new cases are available"
                      />
                      <ToggleSwitch
                        enabled={notifications.threatAlerts}
                        onChange={() => toggleSetting('notifications', 'threatAlerts')}
                        label="Threat Alerts"
                        description="Real-time cyber threat notifications"
                      />
                      <ToggleSwitch
                        enabled={notifications.achievementAlerts}
                        onChange={() => toggleSetting('notifications', 'achievementAlerts')}
                        label="Achievement Alerts"
                        description="Badge and level up notifications"
                      />
                      <ToggleSwitch
                        enabled={notifications.systemUpdates}
                        onChange={() => toggleSetting('notifications', 'systemUpdates')}
                        label="System Updates"
                        description="Platform updates and new features"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-cyan-400" />
                      Sound Settings
                    </h2>
                    
                    <ToggleSwitch
                      enabled={notifications.soundEffects}
                      onChange={() => toggleSetting('notifications', 'soundEffects')}
                      label="Sound Effects"
                      description="Play sounds for actions and notifications"
                    />
                  </div>
                </motion.div>
              )}

              {/* Appearance Section */}
              {activeSection === 'appearance' && (
                <motion.div
                  key="appearance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-cyan-400" />
                      Theme
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {['dark', 'light', 'system'].map((theme) => (
                        <button
                          key={theme}
                          onClick={() => setAppearance({ ...appearance, theme })}
                          className={`p-4 rounded-lg border transition-all ${
                            appearance.theme === theme
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                              : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          {theme === 'dark' && <Moon className="w-5 h-5 mx-auto mb-2" />}
                          {theme === 'light' && <Sun className="w-5 h-5 mx-auto mb-2" />}
                          {theme === 'system' && <Monitor className="w-5 h-5 mx-auto mb-2" />}
                          <p className="text-sm capitalize">{theme}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Accent Color</h2>
                    
                    <div className="flex gap-3">
                      {accentColors.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setAppearance({ ...appearance, accentColor: color.value })}
                          className={`w-10 h-10 rounded-full ${color.class} transition-all ${
                            appearance.accentColor === color.value
                              ? 'ring-2 ring-offset-2 ring-offset-[#0a1520] ring-white scale-110'
                              : 'hover:scale-105'
                          }`}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Display Options</h2>
                    
                    <div className="space-y-1">
                      <ToggleSwitch
                        enabled={appearance.animationsEnabled}
                        onChange={() => toggleSetting('appearance', 'animationsEnabled')}
                        label="Animations"
                        description="Enable UI animations and transitions"
                      />
                      <ToggleSwitch
                        enabled={appearance.reducedMotion}
                        onChange={() => toggleSetting('appearance', 'reducedMotion')}
                        label="Reduced Motion"
                        description="Minimize animations for accessibility"
                      />
                      <ToggleSwitch
                        enabled={appearance.compactMode}
                        onChange={() => toggleSetting('appearance', 'compactMode')}
                        label="Compact Mode"
                        description="Reduce spacing for more content"
                      />
                      <ToggleSwitch
                        enabled={appearance.showGridLines}
                        onChange={() => toggleSetting('appearance', 'showGridLines')}
                        label="Show Grid Lines"
                        description="Display grid overlay on globe"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-cyan-400" />
                      Terminal Settings
                    </h2>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Terminal Transparency</label>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={appearance.terminalTransparency}
                        onChange={(e) => setAppearance({ ...appearance, terminalTransparency: parseInt(e.target.value) })}
                        className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>50%</span>
                        <span className="text-cyan-400">{appearance.terminalTransparency}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <motion.div
                  key="privacy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-cyan-400" />
                      Profile Visibility
                    </h2>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {['public', 'friends', 'private'].map((visibility) => (
                        <button
                          key={visibility}
                          onClick={() => setPrivacy({ ...privacy, profileVisibility: visibility })}
                          className={`p-4 rounded-lg border transition-all ${
                            privacy.profileVisibility === visibility
                              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                              : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:border-gray-700'
                          }`}
                        >
                          <p className="text-sm capitalize">{visibility}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Activity & Status</h2>
                    
                    <div className="space-y-1">
                      <ToggleSwitch
                        enabled={privacy.showOnlineStatus}
                        onChange={() => toggleSetting('privacy', 'showOnlineStatus')}
                        label="Show Online Status"
                        description="Let others see when you're online"
                      />
                      <ToggleSwitch
                        enabled={privacy.showActivityStatus}
                        onChange={() => toggleSetting('privacy', 'showActivityStatus')}
                        label="Show Activity Status"
                        description="Share what you're currently working on"
                      />
                      <ToggleSwitch
                        enabled={privacy.showProgress}
                        onChange={() => toggleSetting('privacy', 'showProgress')}
                        label="Show Progress"
                        description="Display your level and XP to others"
                      />
                      <ToggleSwitch
                        enabled={privacy.allowFriendRequests}
                        onChange={() => toggleSetting('privacy', 'allowFriendRequests')}
                        label="Allow Friend Requests"
                        description="Let others send you friend requests"
                      />
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Data & Analytics</h2>
                    
                    <div className="space-y-1">
                      <ToggleSwitch
                        enabled={privacy.shareAnalytics}
                        onChange={() => toggleSetting('privacy', 'shareAnalytics')}
                        label="Share Analytics"
                        description="Help improve the platform with usage data"
                      />
                      <ToggleSwitch
                        enabled={privacy.dataSaver}
                        onChange={() => toggleSetting('privacy', 'dataSaver')}
                        label="Data Saver"
                        description="Reduce data usage for slower connections"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sessions Section */}
              {activeSection === 'sessions' && (
                <motion.div
                  key="sessions"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Monitor className="w-5 h-5 text-cyan-400" />
                      Active Sessions
                    </h2>
                    
                    <div className="space-y-3">
                      {session.activeSessions.map((sess) => (
                        <div
                          key={sess.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            sess.current
                              ? 'bg-cyan-500/10 border-cyan-500/30'
                              : 'bg-gray-900/50 border-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              sess.current ? 'bg-cyan-500/20' : 'bg-gray-800'
                            }`}>
                              {sess.device.includes('Mobile') ? (
                                <Smartphone className={`w-5 h-5 ${sess.current ? 'text-cyan-400' : 'text-gray-400'}`} />
                              ) : (
                                <Monitor className={`w-5 h-5 ${sess.current ? 'text-cyan-400' : 'text-gray-400'}`} />
                              )}
                            </div>
                            <div>
                              <p className="text-sm text-white flex items-center gap-2">
                                {sess.device}
                                {sess.current && (
                                  <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">
                                {sess.location} • {sess.lastActive}
                              </p>
                            </div>
                          </div>
                          {!sess.current && (
                            <button className="px-3 py-1 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20">
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button className="mt-4 w-full py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm">
                      Sign out of all other sessions
                    </button>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Session Settings</h2>
                    
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">Auto Logout (minutes of inactivity)</label>
                      <select
                        value={session.autoLogout}
                        onChange={(e) => setSession({ ...session, autoLogout: parseInt(e.target.value) })}
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hours</option>
                        <option value={0}>Never</option>
                      </select>
                    </div>

                    <ToggleSwitch
                      enabled={session.rememberMe}
                      onChange={() => toggleSetting('session', 'rememberMe')}
                      label="Remember Me"
                      description="Stay logged in on this device"
                    />
                  </div>
                </motion.div>
              )}

              {/* Data & Export Section */}
              {activeSection === 'data' && (
                <motion.div
                  key="data"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5 text-cyan-400" />
                      Export Your Data
                    </h2>
                    <p className="text-sm text-gray-400 mb-4">
                      Download a copy of all your data including investigations, progress, and settings.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-cyan-500/30 transition-all text-left">
                        <Database className="w-5 h-5 text-cyan-400 mb-2" />
                        <p className="text-sm text-white">Full Data Export</p>
                        <p className="text-xs text-gray-500">All your account data</p>
                      </button>
                      <button className="p-4 rounded-lg bg-gray-900/50 border border-gray-800 hover:border-cyan-500/30 transition-all text-left">
                        <Activity className="w-5 h-5 text-cyan-400 mb-2" />
                        <p className="text-sm text-white">Activity Log</p>
                        <p className="text-xs text-gray-500">Investigation history</p>
                      </button>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-4">Storage Usage</h2>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Used Storage</span>
                        <span className="text-cyan-400">245 MB / 500 MB</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: '49%' }} />
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>Case Files</span>
                        <span>128 MB</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Evidence Cache</span>
                        <span>89 MB</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Reports</span>
                        <span>28 MB</span>
                      </div>
                    </div>

                    <button className="mt-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all text-sm">
                      Clear Cache
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[#0a1520] border border-red-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Account</h3>
                  <p className="text-sm text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-400 mb-4">
                Are you sure you want to delete your account? All your data, progress, and achievements will be permanently removed.
              </p>

              {deleteError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {deleteError}
                </div>
              )}

              <div className="space-y-4 mb-6">
                {user?.provider === 'local' && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Enter your password</label>
                    <input
                      type="password"
                      value={deleteForm.password}
                      onChange={(e) => setDeleteForm({ ...deleteForm, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-red-500"
                      placeholder="Your password"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type <span className="text-red-400 font-mono">DELETE</span> to confirm</label>
                  <input
                    type="text"
                    value={deleteForm.confirmText}
                    onChange={(e) => setDeleteForm({ ...deleteForm, confirmText: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-red-500 font-mono"
                    placeholder="DELETE"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteForm({ password: '', confirmText: '' });
                    setDeleteError('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || deleteForm.confirmText !== 'DELETE'}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-4 p-6 rounded-2xl bg-[#0a1520] border border-cyan-500/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Change Password</h3>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {passwordError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white text-sm outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {passwordLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Verification Modal */}
      <PhoneVerification
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onVerified={(phone) => {
          setAccountSettings({ ...accountSettings, phone });
          setPhoneVerified(true);
          setSuccessMessage('Phone number verified successfully!');
          updateUser?.({ ...user, phone, phoneVerified: true });
        }}
        token={token}
        currentPhone={accountSettings.phone}
      />

      {/* Email Verification Modal */}
      <EmailVerification
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onVerified={() => {
          setEmailVerified(true);
          setSuccessMessage('Email verified successfully!');
          updateUser?.({ ...user, emailVerified: true });
        }}
        token={token}
        email={accountSettings.email}
      />
    </div>
  );
};

export default Settings;
