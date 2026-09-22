import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  User, Mail, Shield, Award, Star, TrendingUp, Calendar, Clock, 
  ChevronLeft, Edit2, Camera, Save, X, CheckCircle, Lock, Globe,
  Activity, Target, Zap, Trophy, Medal, BookOpen, Code, Terminal,
  Eye, EyeOff, AlertCircle, Bell, Settings, LogOut, Copy, Check
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    displayName: user?.name || 'Cyber Agent',
    email: user?.email || 'agent@osintx.com',
    bio: 'Aspiring cyber security analyst with a passion for digital forensics and threat intelligence.',
    location: 'India',
    organization: 'OsintX Academy',
    joinDate: '2024-01-15',
    avatar: null,
    skills: ['OSINT', 'Digital Forensics', 'Network Analysis', 'Threat Intelligence', 'Social Engineering'],
    certifications: [
      { name: 'Cyber Fundamentals', date: '2024-02', verified: true },
      { name: 'OSINT Basics', date: '2024-03', verified: true },
      { name: 'Network Security', date: '2024-05', verified: false },
    ],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: ''
    }
  });

  // Stats data
  const stats = {
    totalInvestigations: 47,
    completedCases: 32,
    successRate: 89,
    creditsEarned: 2450,
    currentStreak: 7,
    longestStreak: 21,
    hoursSpent: 156,
    rank: 'Field Agent',
    xp: 4750,
    level: 12,
    nextLevelXp: 5500,
    badges: [
      { id: 1, name: 'First Blood', icon: '🎯', description: 'Completed first investigation', earned: true },
      { id: 2, name: 'Streak Master', icon: '🔥', description: '7 day streak', earned: true },
      { id: 3, name: 'OSINT Pro', icon: '🔍', description: 'Complete 20 OSINT tasks', earned: true },
      { id: 4, name: 'Night Owl', icon: '🦉', description: 'Complete task after midnight', earned: true },
      { id: 5, name: 'Speed Demon', icon: '⚡', description: 'Complete task under 5 mins', earned: false },
      { id: 6, name: 'Perfect Score', icon: '💯', description: '100% accuracy in 10 tasks', earned: false },
    ],
    recentActivity: [
      { type: 'investigation', title: 'IP Trace Analysis', date: '2024-01-02', result: 'success' },
      { type: 'learning', title: 'Advanced OSINT Module', date: '2024-01-01', result: 'completed' },
      { type: 'investigation', title: 'Domain Reconnaissance', date: '2023-12-30', result: 'success' },
      { type: 'badge', title: 'Earned OSINT Pro Badge', date: '2023-12-28', result: 'badge' },
      { type: 'investigation', title: 'Email Header Analysis', date: '2023-12-27', result: 'partial' },
    ]
  };

  const handleSave = () => {
    setIsEditing(false);
    // Save to backend/localStorage
  };

  const copyUserId = () => {
    navigator.clipboard.writeText(user?.id || 'CR-2024-001234');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
              <h1 className="text-2xl font-bold text-white">Agent Profile</h1>
              <p className="text-sm text-gray-500 font-mono">Security Clearance: FIELD</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/student/settings')}
              className="p-2 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0a1520]/80 border border-cyan-500/30 rounded-2xl overflow-hidden backdrop-blur-xl mb-6"
        >
          {/* Cover/Banner */}
          <div className="h-32 bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-purple-600/30 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg2LDE4MiwyMTIsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
          </div>

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 relative">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-1">
                  <div className="w-full h-full rounded-xl bg-[#0a1520] flex items-center justify-center overflow-hidden">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-16 h-16 text-cyan-400" />
                    )}
                  </div>
                </div>
                <button className="absolute bottom-2 right-2 p-2 rounded-lg bg-cyan-500 text-black opacity-0 group-hover:opacity-100 transition-all">
                  <Camera className="w-4 h-4" />
                </button>
                {/* Level Badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold text-sm border-2 border-[#0a1520]">
                  {stats.level}
                </div>
              </div>

              {/* Name & Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="text-2xl font-bold bg-transparent border-b border-cyan-500 text-white outline-none"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-white">{profileData.displayName}</h2>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 text-xs font-mono">
                    {stats.rank}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profileData.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {profileData.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profileData.joinDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                {/* User ID */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-mono text-gray-500">ID: {user?.id || 'CR-2024-001234'}</span>
                  <button onClick={copyUserId} className="text-gray-500 hover:text-cyan-400 transition-colors">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-black font-medium flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-lg bg-gray-700/50 border border-gray-600 text-gray-300"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 font-medium flex items-center gap-2 hover:bg-cyan-500/20 transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4">
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className="w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-300 text-sm outline-none focus:border-cyan-500 resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-gray-400 text-sm">{profileData.bio}</p>
              )}
            </div>

            {/* XP Progress Bar */}
            <div className="mt-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Level {stats.level} Progress</span>
                <span className="text-sm text-cyan-400 font-mono">{stats.xp} / {stats.nextLevelXp} XP</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.xp / stats.nextLevelXp) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{stats.nextLevelXp - stats.xp} XP to Level {stats.level + 1}</p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['overview', 'stats', 'badges', 'activity', 'skills'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                  : 'bg-gray-800/30 border border-gray-700/50 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {/* Quick Stats Cards */}
              {[
                { label: 'Total Investigations', value: stats.totalInvestigations, icon: Target, color: 'cyan' },
                { label: 'Success Rate', value: `${stats.successRate}%`, icon: TrendingUp, color: 'green' },
                { label: 'Credits Earned', value: stats.creditsEarned, icon: Zap, color: 'amber' },
                { label: 'Current Streak', value: `${stats.currentStreak} days`, icon: Activity, color: 'purple' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20 backdrop-blur-xl"
                >
                  <div className={`w-10 h-10 rounded-lg bg-${stat.color}-500/20 flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Detailed Statistics */}
              <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Investigation Stats</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Completed Cases', value: stats.completedCases, max: stats.totalInvestigations },
                    { label: 'Hours Spent', value: stats.hoursSpent, max: 200 },
                    { label: 'Success Rate', value: stats.successRate, max: 100 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-cyan-400 font-mono">{item.value}{item.label === 'Success Rate' ? '%' : ''}</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${(item.value / item.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Streaks & Time</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                    <span className="text-gray-400">Current Streak</span>
                    <span className="text-2xl font-bold text-orange-400">🔥 {stats.currentStreak}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                    <span className="text-gray-400">Longest Streak</span>
                    <span className="text-xl font-bold text-cyan-400">{stats.longestStreak} days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50">
                    <span className="text-gray-400">Total Hours</span>
                    <span className="text-xl font-bold text-purple-400">{stats.hoursSpent}h</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'badges' && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
            >
              {stats.badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    badge.earned
                      ? 'bg-[#0a1520]/80 border-cyan-500/30 hover:border-cyan-500/50'
                      : 'bg-gray-900/30 border-gray-800 opacity-50'
                  }`}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h4 className={`font-medium text-sm ${badge.earned ? 'text-white' : 'text-gray-500'}`}>
                    {badge.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  {badge.earned && (
                    <CheckCircle className="w-4 h-4 text-green-400 mx-auto mt-2" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 rounded-lg bg-gray-900/50 border border-gray-800"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.result === 'success' ? 'bg-green-500/20' :
                      activity.result === 'completed' ? 'bg-blue-500/20' :
                      activity.result === 'badge' ? 'bg-amber-500/20' :
                      'bg-orange-500/20'
                    }`}>
                      {activity.type === 'investigation' ? <Target className="w-5 h-5 text-green-400" /> :
                       activity.type === 'learning' ? <BookOpen className="w-5 h-5 text-blue-400" /> :
                       <Trophy className="w-5 h-5 text-amber-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      activity.result === 'success' ? 'bg-green-500/20 text-green-400' :
                      activity.result === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      activity.result === 'badge' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {activity.result}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Skills */}
              <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4">Certifications</h3>
                <div className="space-y-3">
                  {profileData.certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 border border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <Award className={`w-5 h-5 ${cert.verified ? 'text-cyan-400' : 'text-gray-500'}`} />
                        <div>
                          <p className="text-sm text-white">{cert.name}</p>
                          <p className="text-xs text-gray-500">{cert.date}</p>
                        </div>
                      </div>
                      {cert.verified && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
