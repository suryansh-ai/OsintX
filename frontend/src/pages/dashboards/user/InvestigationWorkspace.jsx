import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { useCases } from '../../../context/CaseContext';
import { useEvidence } from '../../../context/EvidenceContext';
import { useActivity } from '../../../context/ActivityContext';
import { useCredits } from '../../../context/CreditContext';
import { useNavigate } from 'react-router-dom';
import {
  Search, Globe, Eye, Database, FileText, Activity, Clock, Zap,
  LogOut, Target, TrendingUp, Lock, Mail, Phone, Hash, Image, Link2,
  Server, MapPin, Bell, User, Compass, Sparkles, Layers, Workflow,
  Satellite, Waves, Rss, ArrowUpRight, Play, Folder, CheckCircle, X,
  Radio, Wifi, Shield, AlertTriangle, Scan, MessageCircle, Car, Wallet
} from 'lucide-react';

import ToolErrorBoundary from '../../../components/common/ToolErrorBoundary';

// Import all tools
import IPIntelligenceTool from '../../../components/tools/IPIntelligenceTool';
import DomainAnalysisTool from '../../../components/tools/DomainAnalysisTool';
import EmailIntelTool from '../../../components/tools/EmailIntelTool';
import SocialProfilerTool from '../../../components/tools/SocialProfilerTool';
import HashAnalyzerTool from '../../../components/tools/HashAnalyzerTool';
import URLScannerTool from '../../../components/tools/URLScannerTool';
import GeolocationTool from '../../../components/tools/GeolocationTool';
import BreachDatabaseTool from '../../../components/tools/BreachDatabaseTool';
import DNSRecordsTool from '../../../components/tools/DNSRecordsTool';
import DataMiningTool from '../../../components/tools/DataMiningTool';

// Import new investigation tools
import WhatsAppTraceTool from '../../../components/tools/WhatsAppTraceTool';


// Import Global Threat Map component
import GlobalThreatMap from '../../../components/threat-map/GlobalThreatMap';

const InvestigationWorkspace = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Context hooks for real data
  const { cases, getStatistics: getCaseStats, updateCase } = useCases();
  const { evidence, getStatistics: getEvidenceStats } = useEvidence();
  const { activities, notifications, getRecentActivities, markAsRead, markAllAsRead, formatTimeAgo, logActivity, addNotification } = useActivity();
  const { credits, consumeCredits } = useCredits();

  const [systemTime, setSystemTime] = useState(new Date());
  const [activeView, setActiveView] = useState('flow'); // flow, tools, vault, archive
  const [activeTool, setActiveTool] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const caseStats = getCaseStats();
  const evidenceStats = getEvidenceStats();

  // Time update
  useEffect(() => {
    const interval = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    logActivity({
      type: 'tool_used',
      title: `Used ${tool.name}`,
      description: `Accessed ${tool.name} tool`,
      category: 'Tool Usage'
    });
  };

  const recentActivities = getRecentActivities(10);
  const unreadNotifications = notifications.filter(n => !n.read);

  // Tool components mapping
  const toolComponents = {
    'ip-trace': IPIntelligenceTool,
    'domain': DomainAnalysisTool,
    'email': EmailIntelTool,
    'social': SocialProfilerTool,
    'hash': HashAnalyzerTool,
    'url': URLScannerTool,
    'geo': GeolocationTool,
    'breach': BreachDatabaseTool,
    'dns': DNSRecordsTool,
    'database': DataMiningTool,
    // New investigation tools
    'whatsapp': WhatsAppTraceTool,
  };

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    logActivity(`Opened ${toolId} tool`, { type: 'tool' });
  };

  const handleToolClose = () => {
    setActiveTool(null);
  };

  const handleConsumeCredits = (amount) => {
    consumeCredits(amount);
    logActivity(`Used ${amount} credits`, { type: 'credits' });
  };

  const ActiveToolComponent = activeTool ? toolComponents[activeTool] : null;

  // Dynamic signals from real data
  const signals = [
    { label: 'Active Cases', value: caseStats.active.toString(), accent: 'text-cyan-300' },
    { label: 'Total Evidence', value: evidenceStats.total.toString(), accent: 'text-pink-300' },
    { label: 'Correlations', value: evidenceStats.totalCorrelations.toString(), accent: 'text-amber-300' },
    { label: 'Verified Items', value: evidenceStats.verified.toString(), accent: 'text-emerald-300' },
  ];

  const tools = [
    { id: 'ip-trace', name: 'IP Intelligence', icon: Globe, category: 'Network', cost: 10, color: 'from-blue-500 to-cyan-500' },
    { id: 'domain', name: 'Domain Analysis', icon: Search, category: 'OSINT', cost: 8, color: 'from-purple-500 to-pink-500' },
    { id: 'email', name: 'Email Intelligence', icon: Mail, category: 'OSINT', cost: 12, color: 'from-sky-500 to-cyan-500' },
    { id: 'phone', name: 'Phone Lookup', icon: Phone, category: 'OSINT', cost: 14, color: 'from-amber-500 to-orange-500' },
    { id: 'social', name: 'Social Profiler', icon: Eye, category: 'OSINT', cost: 16, color: 'from-pink-500 to-rose-500' },
    { id: 'hash', name: 'Hash Analyzer', icon: Hash, category: 'Forensics', cost: 6, color: 'from-cyan-500 to-blue-500' },
    { id: 'url', name: 'URL Scanner', icon: Link2, category: 'Threat', cost: 10, color: 'from-red-500 to-rose-500' },
    { id: 'geo', name: 'Geolocation', icon: MapPin, category: 'Geospatial', cost: 12, color: 'from-emerald-500 to-green-500' },
    { id: 'breach', name: 'Breach Database', icon: Lock, category: 'Security', cost: 14, color: 'from-violet-500 to-purple-500' },
    { id: 'dns', name: 'DNS Records', icon: Server, category: 'Network', cost: 8, color: 'from-indigo-500 to-blue-500' },
    { id: 'database', name: 'Data Mining', icon: Database, category: 'Analytics', cost: 18, color: 'from-slate-500 to-gray-500' },
    // New investigation tools
    { id: 'whatsapp', name: 'WhatsApp Trace', icon: MessageCircle, category: 'Communication', cost: 20, color: 'from-green-500 to-emerald-600' },
    { id: 'face', name: 'Face Recognition', icon: Scan, category: 'Biometric', cost: 25, color: 'from-purple-500 to-pink-600' },
    { id: 'vehicle', name: 'Vehicle Info', icon: Car, category: 'Records', cost: 15, color: 'from-orange-500 to-amber-600' },
    { id: 'upi', name: 'UPI Lookup', icon: Wallet, category: 'Financial', cost: 18, color: 'from-blue-500 to-indigo-600' },
  ];

  // Color generator for cases
  const caseColors = [
    'from-fuchsia-500 to-cyan-500',
    'from-amber-500 to-orange-500',
    'from-indigo-500 to-purple-600',
    'from-emerald-500 to-green-600',
    'from-pink-500 to-rose-500',
    'from-blue-500 to-cyan-500'
  ];

  useEffect(() => {
    const interval = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statusColors = {
    active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    completed: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  };

  const priorityColors = {
    high: 'bg-pink-500/20 text-pink-300 border border-pink-500/30',
    medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    low: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  };

  const viewTabs = [
    { id: 'flow', label: 'Flow', icon: Workflow },
    { id: 'tools', label: 'Lab', icon: Layers },
    { id: 'vault', label: 'Case Vault', icon: Folder },
    { id: 'archive', label: 'Signals', icon: Activity },
  ];

  const gradientFrame = 'bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-white/5 shadow-2xl';

  return (
    <div className="min-h-screen bg-[#040711] text-gray-100 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#22d3ee15,_transparent_45%),radial-gradient(circle_at_20%_20%,_#a855f715,_transparent_35%),radial-gradient(circle_at_80%_0%,_#f59e0b15,_transparent_30%)]" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(90deg, #ffffff0d 1px, transparent 1px), linear-gradient(0deg, #ffffff0d 1px, transparent 1px)', backgroundSize: '120px 120px' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ scale: 1.02 }} className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Target className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Trace Atlas</p>
              <h1 className="text-2xl font-bold text-white">Immersive Investigation Flow</h1>
            </div>
            <div className="hidden lg:flex items-center gap-2 ml-6">
              {viewTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeView === tab.id
                      ? 'bg-white/10 text-white border border-white/20 shadow-lg shadow-cyan-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Clock className="w-4 h-4 text-cyan-300" />
              <span className="font-mono text-sm text-white">{systemTime.toLocaleTimeString()}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-300" />
              <span className="text-amber-200 font-bold">{credits}</span>
              <span className="text-xs text-amber-100/70">credits</span>
            </div>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <Bell className="w-5 h-5 text-cyan-200" />
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
              <User className="w-4 h-4 text-cyan-200" />
              <span className="text-sm text-white font-medium">{user?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {activeView === 'flow' && (
            <motion.div
              key="flow"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Hero Narrative */}
                <div className={`lg:col-span-2 rounded-3xl p-6 ${gradientFrame} relative overflow-hidden`}
                  >
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#22d3ee33,transparent_40%),radial-gradient(circle_at_80%_0%,#a855f733,transparent_35%)]" />
                  <div className="flex items-start justify-between relative">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70 mb-2">Live Flow</p>
                      <h2 className="text-3xl font-bold text-white mb-2">Sequenced Intelligence Stream</h2>
                      <p className="text-gray-300/80 max-w-xl">Follow signals as they merge, branch, and resolve. Everything is aligned as a cinematic storyline instead of static cards.</p>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-fuchsia-300" />
                          Adaptive views
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-white flex items-center gap-2">
                          <Waves className="w-4 h-4 text-cyan-300" />
                          Signal heatmaps
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 text-right">
                      <div className="text-xs uppercase text-gray-400">Momentum</div>
                      <div className="text-4xl font-extrabold text-white">94%</div>
                      <div className="flex gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1 text-emerald-300"><ArrowUpRight className="w-4 h-4" />+8% today</span>
                        <span className="flex items-center gap-1 text-cyan-300"><TrendingUp className="w-4 h-4" /> steady</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid md:grid-cols-2 gap-4">
                    {signals.map((sig, idx) => (
                      <div
                        key={sig.label}
                        className="rounded-2xl p-4 bg-white/5 border border-white/10 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm text-gray-300/80">{sig.label}</p>
                          <p className={`text-2xl font-bold ${sig.accent}`}>{sig.value}</p>
                        </div>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/5 to-white/0 border border-white/10 flex items-center justify-center">
                          <Satellite className="w-6 h-6 text-white/70" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pulse Rail */}
                <div className={`rounded-3xl p-5 ${gradientFrame} space-y-4`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-pink-300/70">Pulse Rail</p>
                      <h3 className="text-xl font-semibold text-white">Active operations</h3>
                    </div>
                    <Compass className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div className="space-y-3">
                    {cases.filter(c => c.status !== 'completed').slice(0, 4).map((c, idx) => (
                      <div 
                        key={c.id} 
                        onClick={() => navigate('/dashboard/user/cases')}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-400/40 transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-gray-400">{c.id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusColors[c.status]}`}>{c.status}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] ${priorityColors[c.priority]}`}>{c.priority}</span>
                            </div>
                            <p className="text-white font-semibold">{c.title}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-white">{c.progress}%</p>
                            <p className="text-xs text-gray-400">{formatTimeAgo(c.lastActivity)}</p>
                          </div>
                        </div>
                        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${c.progress}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full bg-gradient-to-r ${caseColors[idx % caseColors.length]}`}
                          />
                        </div>
                      </div>
                    ))}
                    {cases.filter(c => c.status !== 'completed').length === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        <p>No active cases</p>
                        <button 
                          onClick={() => navigate('/dashboard/user/cases')}
                          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          Create a new case →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid below hero */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className={`rounded-3xl p-5 ${gradientFrame} space-y-4 lg:col-span-2`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/70">Signal Weave</p>
                      <h3 className="text-xl font-semibold text-white">Evidence motion view</h3>
                    </div>
                    <Sparkles className="w-5 h-5 text-emerald-200" />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tools.slice(0, 6).map((tool, idx) => (
                      <motion.div
                        key={tool.id}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => handleToolClick(tool.id)}
                        className="rounded-2xl p-4 bg-white/5 border border-white/10 relative overflow-hidden cursor-pointer hover:border-cyan-400/40 transition-all"
                      >
                        <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${tool.color}`} />
                        <div className="relative flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white`}>
                            <tool.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-semibold">{tool.name}</p>
                            <p className="text-xs text-gray-400">{tool.category}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center gap-1 text-amber-200"><Zap className="w-4 h-4" />{tool.cost}</span>
                          <span className="text-cyan-200">Click to launch</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className={`rounded-3xl p-5 ${gradientFrame} space-y-4`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Live Stream</p>
                      <h3 className="text-xl font-semibold text-white">Global Threat Monitor</h3>
                    </div>
                    <Globe className="w-5 h-5 text-cyan-200" />
                  </div>
                  <div className="-mx-2">
                    <GlobalThreatMap />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'tools' && (
            <motion.div
              key="tools"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">Lab</p>
                  <h2 className="text-3xl font-bold text-white">Reactive Tool Constellation</h2>
                </div>
                <button className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-200" />
                  Auto-orchestrate
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ scale: 1.04, y: -4 }}
                    onClick={() => handleToolClick(tool.id)}
                    className="relative overflow-hidden rounded-2xl p-5 bg-white/5 border border-white/10 cursor-pointer hover:border-cyan-500/40 transition-all duration-300"
                  >
                    <div className={`absolute inset-0 opacity-15 bg-gradient-to-br ${tool.color}`} />
                    <div className="relative flex items-start justify-between gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center text-white shadow-lg shadow-black/30`}>
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <div className="text-right text-xs text-gray-300/80 flex flex-col items-end">
                        <span className="flex items-center gap-1 text-amber-200 font-semibold"><Zap className="w-4 h-4" />{tool.cost}</span>
                        <span className="text-[11px] text-gray-400">ready</span>
                      </div>
                    </div>
                    <div className="relative mt-3 space-y-1">
                      <p className="text-white font-semibold">{tool.name}</p>
                      <p className="text-xs text-gray-400">{tool.category}</p>
                      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-3/4 bg-white/40" />
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 hover:opacity-100 transition-opacity rounded-2xl" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeView === 'vault' && (
            <motion.div
              key="vault"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Case Vault</p>
                  <h2 className="text-3xl font-bold text-white">Narrative case wall</h2>
                </div>
                <button 
                  onClick={() => navigate('/dashboard/user/cases')}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-white text-sm font-semibold flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Manage Cases
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((c, idx) => (
                  <div 
                    key={c.id} 
                    onClick={() => navigate('/dashboard/user/cases')}
                    className={`rounded-2xl p-5 bg-white/5 border border-white/10 relative overflow-hidden cursor-pointer hover:border-cyan-500/40 transition-all`}
                  >
                    <div className={`absolute inset-0 opacity-15 bg-gradient-to-br ${caseColors[idx % caseColors.length]}`} />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-xs font-mono text-gray-400">{c.id}</p>
                        <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${statusColors[c.status]}`}>{c.status}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${priorityColors[c.priority]}`}>{c.priority}</span>
                      </div>
                    </div>
                    <div className="relative mt-4 space-y-2">
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-white/50" style={{ width: `${c.progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{c.progress}% stitched</span>
                        <span>{c.dataPoints} data points</span>
                        <span>{formatTimeAgo(c.lastActivity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {cases.length === 0 && (
                  <div className="col-span-full p-12 text-center text-gray-500">
                    <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No cases yet</p>
                    <button 
                      onClick={() => navigate('/dashboard/user/cases')}
                      className="mt-3 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    >
                      Create First Case
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'archive' && (
            <motion.div
              key="archive"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">Signal Archive</p>
                  <h2 className="text-3xl font-bold text-white">Story-first activity timeline</h2>
                </div>
              </div>

              <div className={`rounded-3xl p-6 ${gradientFrame}`}>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? recentActivities.map((item, idx) => (
                    <div key={idx} className="grid sm:grid-cols-6 gap-4 items-start">
                      <div className="sm:col-span-1 text-xs text-gray-400 font-mono">{formatTimeAgo(item.timestamp)}</div>
                      <div className="sm:col-span-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          item.type === 'case' ? 'bg-emerald-300' :
                          item.type === 'evidence' ? 'bg-amber-300' :
                          item.type === 'tool' ? 'bg-pink-300' :
                          'bg-cyan-300'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm text-white/90">{item.action}</p>
                          {item.metadata && (
                            <p className="text-xs text-gray-400 mt-1">
                              {item.metadata.caseId && `Case: ${item.metadata.caseId}`}
                              {item.metadata.evidenceId && `Evidence: ${item.metadata.evidenceId}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-12 text-center text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No activity recorded yet</p>
                      <p className="text-xs mt-1">Start using tools or create cases to see activity</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tool Modal */}
      <AnimatePresence>
        {ActiveToolComponent && (
          <ToolErrorBoundary key={activeTool} onClose={handleToolClose}>
            <ActiveToolComponent
              onClose={handleToolClose}
              onConsume={handleConsumeCredits}
            />
          </ToolErrorBoundary>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowNotifications(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-20 right-6 z-50 w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/10 shadow-2xl"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-300" />
                  Notifications
                </h3>
                {unreadNotifications.length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="p-2">
                {notifications.length > 0 ? notifications.slice(0, 10).map((notif, idx) => (
                  <div
                    key={idx}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3 rounded-xl mb-2 flex items-start gap-3 cursor-pointer transition-all ${
                      notif.read ? 'bg-white/5' : 'bg-cyan-500/10 border border-cyan-500/20'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notif.type === 'success' ? 'bg-emerald-400' :
                      notif.type === 'warning' ? 'bg-amber-400' :
                      notif.type === 'error' ? 'bg-red-400' :
                      'bg-cyan-400'
                    }`} />
                    <div className="flex-1">
                      <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white'}`}>{notif.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(notif.timestamp)}</p>
                    </div>
                    {!notif.read && (
                      <CheckCircle className="w-4 h-4 text-cyan-400" />
                    )}
                  </div>
                )) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvestigationWorkspace;
