import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useActivity } from '../../../context/ActivityContext';
import { useCases } from '../../../context/CaseContext';
import { useCredits } from '../../../context/CreditContext';
import { useSession } from '../../../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import {
  User, Settings, Shield, Bell, Mail, Lock, Eye, EyeOff,
  ArrowLeft, Camera, Save, Trash2, CheckCircle, AlertTriangle,
  Activity, Target, Folder, Zap, ChevronRight, Edit3, Key,
  History, LogIn, Phone, Loader
} from 'lucide-react';
import LoginActivityLog from '../../../components/common/LoginActivityLog';
import PhoneVerification from '../../../components/common/PhoneVerification';
import EmailVerification from '../../../components/common/EmailVerification';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============== SETTING TOGGLE COMPONENT ==============
const SettingToggle = ({ label, description, value, onChange, icon: Icon }) => (
  <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-colors">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <div>
        <p className="text-base font-semibold text-white">{label}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => onChange(!value)}
      className={`relative w-14 h-7 rounded-full transition-colors ${
        value ? 'bg-cyan-500' : 'bg-slate-600'
      }`}
    >
      <motion.div
        animate={{ x: value ? 28 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg"
      />
    </motion.button>
  </div>
);

// ============== PROFILE SETTINGS PAGE ==============
const ProfileSettings = () => {
  const { user, logout, token, updateUser } = useAuth();
  const { activities, getRecentActivities, formatTimeAgo } = useActivity();
  const { getStatistics: getCaseStats } = useCases();
  const { credits } = useCredits();
  const { getActivityStats } = useSession();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLoginActivity, setShowLoginActivity] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(user?.phoneVerified || false);
  const [emailVerified, setEmailVerified] = useState(user?.emailVerified || false);
  const [saveError, setSaveError] = useState('');

  const loginStats = getActivityStats();

  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    bio: user?.bio || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [settings, setSettings] = useState({
    darkMode: true,
    soundEffects: true,
    autoSave: true,
    twoFactor: false,
    emailAlerts: true,
    pushNotifications: true,
    weeklyReport: false,
    loginAlerts: true
  });

  const caseStats = getCaseStats();
  const recentActivities = getRecentActivities(5);
  const toolsUsedCount = activities?.filter(a => a.type === 'tool').length || 0;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ];

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');
    
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profileData.username,
          username: profileData.username,
          bio: profileData.bio,
          organization: profileData.organization,
          phone: profileData.phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      // Update local auth context
      updateUser?.(data.user);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Save profile error:', error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsSaving(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSaveSuccess(true);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
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
                <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                <p className="text-sm text-gray-400">Manage your profile and preferences</p>
              </div>
            </div>

            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">Changes saved!</span>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 p-1 mx-auto">
                    <div className="w-full h-full rounded-2xl bg-slate-900 flex items-center justify-center">
                      <User className="w-12 h-12 text-cyan-400" />
                    </div>
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center border-2 border-slate-900 hover:bg-cyan-400 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{user?.username || 'User'}</h3>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {user?.role || 'user'}
                </span>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-800 text-center">
                  <p className="text-xl font-bold text-cyan-400">{caseStats?.completed || 0}</p>
                  <p className="text-xs text-gray-500">Cases</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-800 text-center">
                  <p className="text-xl font-bold text-violet-400">{toolsUsedCount}</p>
                  <p className="text-xs text-gray-500">Tools</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className={`w-4 h-4 ml-auto transition-transform ${activeTab === tab.id ? 'rotate-90' : ''}`} />
                </button>
              ))}
            </nav>

            {/* Danger Zone */}
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <h4 className="text-sm font-semibold text-rose-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Danger Zone
              </h4>
              <p className="text-xs text-gray-400 mb-3">Permanently delete your account</p>
              <button className="w-full px-4 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-sm hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Personal Information</h2>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsEditing(!isEditing)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                        isEditing 
                          ? 'bg-slate-700 text-gray-300' 
                          : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </motion.button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                      <input
                        type="text"
                        value={profileData.username}
                        onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none disabled:opacity-60 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            disabled={true}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none disabled:opacity-60 transition-colors pr-24"
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
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                            emailVerified 
                              ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-not-allowed'
                              : 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30'
                          }`}
                        >
                          <Mail className="w-4 h-4" />
                          {emailVerified ? 'Verified' : 'Verify'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            disabled={!isEditing}
                            placeholder="Enter phone number"
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none disabled:opacity-60 transition-colors pr-24"
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
                          className="px-4 py-3 rounded-xl text-sm font-medium bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors flex items-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          {phoneVerified ? 'Change' : 'Verify'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Organization</label>
                      <input
                        type="text"
                        value={profileData.organization}
                        onChange={(e) => setProfileData({...profileData, organization: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Enter organization"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none disabled:opacity-60 transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none disabled:opacity-60 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex justify-end"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isSaving ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          <Save className="w-5 h-5" />
                        )}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </motion.button>
                    </motion.div>
                  )}
                </div>

                {/* Activity Summary */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-6">Recent Activity</h2>
                  <div className="space-y-3">
                    {recentActivities && recentActivities.length > 0 ? (
                      recentActivities.map((activity, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 border border-slate-700">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            activity.type === 'tool' ? 'bg-violet-500/20' :
                            activity.type === 'credits' ? 'bg-amber-500/20' :
                            activity.type === 'case' ? 'bg-cyan-500/20' : 'bg-slate-700'
                          }`}>
                            {activity.type === 'tool' ? <Target className="w-5 h-5 text-violet-400" /> :
                             activity.type === 'credits' ? <Zap className="w-5 h-5 text-amber-400" /> :
                             activity.type === 'case' ? <Folder className="w-5 h-5 text-cyan-400" /> :
                             <Activity className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white">{activity.action}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Change Password */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Key className="w-6 h-6 text-cyan-400" />
                    Change Password
                  </h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePasswordChange}
                      disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock className="w-5 h-5" />
                      Update Password
                    </motion.button>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Shield className="w-6 h-6 text-cyan-400" />
                    Security Settings
                  </h2>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Two-Factor Authentication"
                      description="Add an extra layer of security to your account"
                      value={settings.twoFactor}
                      onChange={(v) => setSettings({...settings, twoFactor: v})}
                      icon={Shield}
                    />
                    <SettingToggle
                      label="Login Alerts"
                      description="Get notified when someone logs into your account"
                      value={settings.loginAlerts}
                      onChange={(v) => setSettings({...settings, loginAlerts: v})}
                      icon={Bell}
                    />
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-6">Active Sessions</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-emerald-500/30">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Current Session</p>
                          <p className="text-xs text-gray-500">Windows • Chrome • Active now</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">Active</span>
                    </div>
                  </div>
                </div>

                {/* Login Activity */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <History className="w-6 h-6 text-violet-400" />
                    Login Activity
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Monitor your account's login history for security
                  </p>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-800 text-center">
                      <p className="text-2xl font-bold text-cyan-400">{loginStats?.totalLogins || 0}</p>
                      <p className="text-xs text-gray-500">Total Logins</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800 text-center">
                      <p className="text-2xl font-bold text-amber-400">{loginStats?.sessionExpiries || 0}</p>
                      <p className="text-xs text-gray-500">Expired Sessions</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800 text-center">
                      <p className="text-2xl font-bold text-rose-400">{loginStats?.failedAttempts || 0}</p>
                      <p className="text-xs text-gray-500">Failed Attempts</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLoginActivity(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-500/20 text-violet-400 font-medium border border-violet-500/30 hover:bg-violet-500/30 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    View Full Login History
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* General Settings */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Settings className="w-6 h-6 text-cyan-400" />
                    General Settings
                  </h2>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Sound Effects"
                      description="Play sounds for notifications and actions"
                      value={settings.soundEffects}
                      onChange={(v) => setSettings({...settings, soundEffects: v})}
                      icon={Bell}
                    />
                    <SettingToggle
                      label="Auto-Save Progress"
                      description="Automatically save investigation progress"
                      value={settings.autoSave}
                      onChange={(v) => setSettings({...settings, autoSave: v})}
                      icon={Save}
                    />
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <Bell className="w-6 h-6 text-cyan-400" />
                    Notification Preferences
                  </h2>
                  <div className="space-y-4">
                    <SettingToggle
                      label="Push Notifications"
                      description="Receive browser push notifications"
                      value={settings.pushNotifications}
                      onChange={(v) => setSettings({...settings, pushNotifications: v})}
                      icon={Bell}
                    />
                    <SettingToggle
                      label="Email Alerts"
                      description="Get important updates via email"
                      value={settings.emailAlerts}
                      onChange={(v) => setSettings({...settings, emailAlerts: v})}
                      icon={Mail}
                    />
                    <SettingToggle
                      label="Weekly Report"
                      description="Receive weekly activity summary"
                      value={settings.weeklyReport}
                      onChange={(v) => setSettings({...settings, weeklyReport: v})}
                      icon={Activity}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Login Activity Modal */}
      <LoginActivityLog 
        isOpen={showLoginActivity} 
        onClose={() => setShowLoginActivity(false)} 
      />

      {/* Phone Verification Modal */}
      <PhoneVerification
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onVerified={(phone) => {
          setProfileData({ ...profileData, phone });
          setPhoneVerified(true);
          updateUser?.({ ...user, phone, phoneVerified: true });
        }}
        token={token}
        currentPhone={profileData.phone}
      />

      {/* Email Verification Modal */}
      <EmailVerification
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onVerified={() => {
          setEmailVerified(true);
          updateUser?.({ ...user, emailVerified: true });
        }}
        token={token}
        email={profileData.email}
      />
    </div>
  );
};

export default ProfileSettings;
