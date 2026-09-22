import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, ChevronLeft, Download, Calendar, TrendingUp, TrendingDown,
  Clock, Target, Award, Zap, FileText, CheckCircle, XCircle, AlertCircle,
  ChevronDown, Filter, Printer, Mail, Share2, RefreshCw, Eye,
  Brain, Shield, Terminal, Activity, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const ProgressReports = () => {
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Mock user stats
  const userStats = {
    totalXP: 4850,
    xpChange: +450,
    level: 5,
    levelProgress: 72,
    totalCredits: 1250,
    creditsChange: +180,
    casesCompleted: 24,
    casesChange: +5,
    successRate: 87,
    successRateChange: +3,
    timeSpent: 48.5,
    timeChange: +12.5,
    currentStreak: 12,
    bestStreak: 15,
    rank: 127,
    rankChange: -15, // Negative means improved (moved up)
  };

  // Weekly activity data
  const weeklyActivity = [
    { day: 'Mon', hours: 2.5, cases: 1 },
    { day: 'Tue', hours: 1.8, cases: 0 },
    { day: 'Wed', hours: 3.2, cases: 2 },
    { day: 'Thu', hours: 2.0, cases: 1 },
    { day: 'Fri', hours: 4.5, cases: 2 },
    { day: 'Sat', hours: 1.5, cases: 0 },
    { day: 'Sun', hours: 3.0, cases: 1 },
  ];

  // Skill breakdown
  const skills = [
    { name: 'Network Security', level: 85, change: +5, color: 'cyan' },
    { name: 'Malware Analysis', level: 72, change: +8, color: 'purple' },
    { name: 'Phishing Detection', level: 90, change: +2, color: 'green' },
    { name: 'Forensics', level: 65, change: +12, color: 'amber' },
    { name: 'Cryptography', level: 58, change: +3, color: 'blue' },
    { name: 'Social Engineering', level: 78, change: -2, color: 'pink' },
  ];

  // Case completion by difficulty
  const casesByDifficulty = [
    { difficulty: 'Easy', completed: 12, total: 15, color: 'green' },
    { difficulty: 'Medium', completed: 8, total: 12, color: 'yellow' },
    { difficulty: 'Hard', completed: 4, total: 8, color: 'red' },
  ];

  // Recent achievements
  const recentAchievements = [
    { name: 'First Blood', date: 'Dec 28', xp: 100 },
    { name: 'Network Ninja', date: 'Dec 25', xp: 250 },
    { name: 'Streak Master', date: 'Dec 20', xp: 150 },
    { name: 'Quick Solver', date: 'Dec 15', xp: 200 },
  ];

  // Strengths & Weaknesses
  const strengths = ['Pattern Recognition', 'Quick Analysis', 'Network Traffic', 'Email Security'];
  const weaknesses = ['Memory Forensics', 'Reverse Engineering', 'Advanced Cryptography'];

  // Recommendations
  const recommendations = [
    { type: 'case', title: 'Try "Memory Dump Analysis"', reason: 'Improve forensics skills', difficulty: 'Medium' },
    { type: 'tutorial', title: 'Complete Crypto Fundamentals', reason: 'Strengthen cryptography', duration: '25 min' },
    { type: 'challenge', title: 'Join Weekly CTF', reason: 'Boost ranking', reward: '500 XP' },
  ];

  const periods = [
    { id: 'week', name: 'This Week' },
    { id: 'month', name: 'This Month' },
    { id: 'quarter', name: 'Last 3 Months' },
    { id: 'year', name: 'This Year' },
    { id: 'all', name: 'All Time' },
  ];

  const handleExportPDF = () => {
    // Simulate PDF export
    alert('PDF report downloading...');
    setShowExportMenu(false);
  };

  const handleShareReport = () => {
    // Simulate share
    navigator.clipboard.writeText(window.location.href);
    alert('Report link copied to clipboard!');
    setShowExportMenu(false);
  };

  const StatCard = ({ icon: Icon, label, value, change, suffix = '', color = 'cyan' }) => (
    <div className="p-4 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-${color}-500/20`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        {change !== undefined && (
          <span className={`text-xs flex items-center gap-1 ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}{suffix}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}{suffix}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#010408] text-gray-100">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-transparent to-blue-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6" ref={reportRef}>
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
                <BarChart3 className="w-6 h-6 text-cyan-400" />
                Progress Reports
              </h1>
              <p className="text-sm text-gray-500">Track your growth and performance</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-sm text-gray-300 outline-none focus:border-cyan-500"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Export Button */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/30 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0a1520] border border-cyan-500/20 shadow-xl overflow-hidden z-50"
                  >
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3"
                    >
                      <FileText className="w-4 h-4 text-red-400" />
                      Export as PDF
                    </button>
                    <button
                      onClick={() => { alert('Printing...'); setShowExportMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3"
                    >
                      <Printer className="w-4 h-4 text-blue-400" />
                      Print Report
                    </button>
                    <button
                      onClick={() => { alert('Email sent!'); setShowExportMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3"
                    >
                      <Mail className="w-4 h-4 text-green-400" />
                      Email Report
                    </button>
                    <button
                      onClick={handleShareReport}
                      className="w-full px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800/50 flex items-center gap-3"
                    >
                      <Share2 className="w-4 h-4 text-purple-400" />
                      Share Link
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <StatCard icon={Zap} label="Total XP" value={userStats.totalXP.toLocaleString()} change={userStats.xpChange} />
          <StatCard icon={FileText} label="Cases Completed" value={userStats.casesCompleted} change={userStats.casesChange} />
          <StatCard icon={Target} label="Success Rate" value={userStats.successRate} suffix="%" change={userStats.successRateChange} />
          <StatCard icon={Clock} label="Hours Invested" value={userStats.timeSpent} suffix="h" change={userStats.timeChange} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Weekly Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Weekly Activity
            </h3>
            <div className="h-48 flex items-end justify-between gap-2">
              {weeklyActivity.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <span className="text-xs text-cyan-400">{day.cases} cases</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-cyan-500/50 to-cyan-400/80 transition-all hover:from-cyan-500/70 hover:to-cyan-400"
                      style={{ height: `${(day.hours / 5) * 120}px` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">{day.day}</p>
                    <p className="text-xs text-gray-600">{day.hours}h</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Level Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Level Progress
            </h3>
            <div className="text-center mb-4">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    className="text-gray-800"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    className="text-cyan-400"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${userStats.levelProgress * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div>
                    <p className="text-3xl font-bold text-white">Lv.{userStats.level}</p>
                    <p className="text-xs text-gray-500">{userStats.levelProgress}%</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                <span className="text-cyan-400">{1500 - (userStats.levelProgress * 15)}</span> XP to Level {userStats.level + 1}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Rank</span>
                <span className="text-white flex items-center gap-1">
                  #{userStats.rank}
                  <span className="text-green-400">↑{Math.abs(userStats.rankChange)}</span>
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Current Streak</span>
                <span className="text-amber-400">{userStats.currentStreak} days 🔥</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Best Streak</span>
                <span className="text-white">{userStats.bestStreak} days</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Skills Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Skills Breakdown
            </h3>
            <div className="space-y-4">
              {skills.map((skill, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{skill.name}</span>
                    <span className="text-sm flex items-center gap-2">
                      <span className="text-white">{skill.level}%</span>
                      <span className={`text-xs ${skill.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {skill.change >= 0 ? '+' : ''}{skill.change}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.level}%` }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full bg-${skill.color}-500`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Cases by Difficulty */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-400" />
              Cases by Difficulty
            </h3>
            <div className="space-y-4">
              {casesByDifficulty.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm text-${item.color}-400`}>{item.difficulty}</span>
                      <span className="text-sm text-gray-400">
                        {item.completed}/{item.total}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-${item.color}-500`}
                        style={{ width: `${(item.completed / item.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-lg font-bold text-white">
                    {Math.round((item.completed / item.total) * 100)}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Total Completion</span>
                <span className="text-lg font-bold text-cyan-400">
                  {Math.round((24 / 35) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl bg-[#0a1520]/80 border border-green-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Strengths
            </h3>
            <div className="space-y-2">
              {strengths.map((strength, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"
                >
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">{strength}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weaknesses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="p-6 rounded-xl bg-[#0a1520]/80 border border-amber-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Areas to Improve
            </h3>
            <div className="space-y-2">
              {weaknesses.map((weakness, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300">{weakness}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-xl bg-[#0a1520]/80 border border-cyan-500/20"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Recent Achievements
            </h3>
            <div className="space-y-3">
              {recentAchievements.map((achievement, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏆</span>
                    <div>
                      <p className="text-sm text-white">{achievement.name}</p>
                      <p className="text-xs text-gray-500">{achievement.date}</p>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-400">+{achievement.xp} XP</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Personalized Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Personalized Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#0a1520]/60 border border-gray-800 hover:border-cyan-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 mb-2">
                  {rec.type === 'case' && <FileText className="w-4 h-4 text-cyan-400" />}
                  {rec.type === 'tutorial' && <Eye className="w-4 h-4 text-purple-400" />}
                  {rec.type === 'challenge' && <Zap className="w-4 h-4 text-amber-400" />}
                  <span className="text-xs text-gray-500 uppercase">{rec.type}</span>
                </div>
                <h4 className="text-white font-medium mb-1 group-hover:text-cyan-400 transition-colors">
                  {rec.title}
                </h4>
                <p className="text-xs text-gray-500 mb-2">{rec.reason}</p>
                <div className="flex items-center gap-2 text-xs">
                  {rec.difficulty && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                      {rec.difficulty}
                    </span>
                  )}
                  {rec.duration && (
                    <span className="text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rec.duration}
                    </span>
                  )}
                  {rec.reward && (
                    <span className="text-cyan-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {rec.reward}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressReports;
