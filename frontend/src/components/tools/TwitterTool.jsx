import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, RefreshCw, Copy, Download, ExternalLink, User, Globe,
  MapPin, Link, Calendar, Shield, AlertTriangle, CheckCircle, ChevronDown,
  ChevronUp, Info, MessageSquare, Heart, Repeat2, BarChart2
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { exportToJSON } from '../../utils/export';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Section = ({ title, icon: Icon, children, color = 'sky', defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl bg-slate-900/60 border border-${color}-500/20 overflow-hidden`}>
      <button onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
        <span className={`text-xs text-${color}-400 uppercase tracking-wider flex items-center gap-2 font-semibold`}>
          {Icon && <Icon className="w-3.5 h-3.5" />}{title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatPill = ({ label, value, color = 'sky' }) => (
  <div className={`p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20 text-center`}>
    <p className={`text-lg font-bold text-${color}-400`}>
      {typeof value === 'number' ? value.toLocaleString() : (value || '—')}
    </p>
    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
  </div>
);

const TwitterTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'Twitter', query: username });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('profile');

  const handleSearch = useCallback(async () => {
    const clean = username.trim().replace(/^@/, '');
    if (!clean) { toast.error('Enter a Twitter/X username'); return; }
    onConsume?.(10);
    setIsSearching(true);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/social/twitter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean }),
      });
      const data = await resp.json();
      if (!resp.ok || (data.error && !data.profile && !data.success)) throw new Error(data.error || 'Lookup failed');
      setResult(data);
      addToHistory('twitter', clean, data);
      if (data.profile) {
        toast.success(`Profile found — ${data.profile.followers?.toLocaleString() || 0} followers`);
      } else {
        toast.warning(data.error || 'Profile data limited');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [username, onConsume, toast, addToHistory]);

  const profile = result?.profile;
  const risk = result?.riskAssessment;
  const tweets = profile?.recentTweets || [];
  const crossPlatform = result?.crossPlatform || [];
  const riskColor = risk?.level === 'high' ? 'red' : risk?.level === 'medium' ? 'amber' : 'emerald';

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'tweets', label: `Tweets (${tweets.length})` },
    { id: 'cross', label: `Cross-Platform (${crossPlatform.length})` },
    { id: 'risk', label: 'Risk' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-sky-950/10 to-slate-950 border border-sky-500/30 shadow-[0_0_80px_rgba(14,165,233,0.1)]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30">
              <span className="text-sky-400 font-bold text-lg">𝕏</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Twitter / X Intelligence</h2>
              <p className="text-sm text-slate-400">Profile · Tweets · Cross-platform · Risk analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <>
                <button onClick={() => copy(JSON.stringify(result, null, 2))}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => exportToJSON(result, 'twitter-intel')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-5 border-b border-white/5">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">@</span>
              <input value={username} onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="username (without @)"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-sky-500/50 focus:outline-none text-sm" />
            </div>
            <button onClick={handleSearch} disabled={isSearching}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm">
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Scrapes public profile via Nitter mirrors — no API key required
          </p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 max-h-[calc(92vh-200px)] space-y-4">
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Scraping public profile via Nitter...</p>
            </div>
          )}

          {result && !isSearching && (
            <>
              {/* Profile summary bar */}
              {profile && (
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3">
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="avatar"
                        className="w-12 h-12 rounded-full border-2 border-sky-500/40" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-sky-500/20 border-2 border-sky-500/40 flex items-center justify-center">
                        <User className="w-6 h-6 text-sky-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-bold">{profile.displayName || profile.username}</p>
                      <p className="text-sky-400 text-sm">@{profile.username || username}</p>
                    </div>
                  </div>
                  {profile.verified && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {profile.protected && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🔒 Protected
                    </span>
                  )}
                  <div className="ml-auto flex gap-2">
                    {result.links && Object.entries(result.links).slice(0, 2).map(([name, url]) => (
                      <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                        className="px-2 py-1 text-xs rounded-lg bg-white/10 text-slate-300 hover:bg-sky-500/20 hover:text-sky-300 transition-colors flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        {name === 'twitter' ? 'Twitter' : name === 'x' ? 'X' : name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats row */}
              {profile && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatPill label="Followers" value={profile.followers} color="sky" />
                  <StatPill label="Following" value={profile.following} color="blue" />
                  <StatPill label="Tweets" value={profile.tweets} color="indigo" />
                  <StatPill label="Likes" value={profile.likes} color="pink" />
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-1 flex-wrap">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-slate-400 hover:bg-white/5'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab: Profile */}
              {activeTab === 'profile' && profile && (
                <div className="space-y-3">
                  {profile.bio && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-slate-500 mb-1">Bio</p>
                      <p className="text-sm text-white">{profile.bio}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {profile.location && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
                        <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="text-sm text-white">{profile.location}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
                        <Link className="w-4 h-4 text-sky-400 shrink-0" />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-sky-300 hover:underline truncate">{profile.website}</a>
                      </div>
                    )}
                    {profile.joinDate && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5">
                        <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                        <span className="text-sm text-white">Joined {profile.joinDate}</span>
                      </div>
                    )}
                    {profile.pinnedTweet && (
                      <div className="col-span-full p-3 rounded-lg bg-white/5">
                        <p className="text-xs text-slate-500 mb-1">📌 Pinned Tweet</p>
                        <p className="text-sm text-white">{profile.pinnedTweet}</p>
                      </div>
                    )}
                  </div>
                  {result.socialBladeStats && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-slate-500 mb-2">SocialBlade Stats</p>
                      <div className="grid grid-cols-3 gap-2">
                        {result.socialBladeStats.grade && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-sky-400">{result.socialBladeStats.grade}</p>
                            <p className="text-xs text-slate-500">Grade</p>
                          </div>
                        )}
                        {result.socialBladeStats.rank && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-blue-400">#{result.socialBladeStats.rank}</p>
                            <p className="text-xs text-slate-500">Rank</p>
                          </div>
                        )}
                        {result.socialBladeStats.growth30d && (
                          <div className="text-center">
                            <p className={`text-lg font-bold ${result.socialBladeStats.growth30d.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                              {result.socialBladeStats.growth30d}
                            </p>
                            <p className="text-xs text-slate-500">30d Growth</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Tweets */}
              {activeTab === 'tweets' && (
                <div className="space-y-2">
                  {tweets.length > 0 ? (
                    tweets.map((tweet, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-sky-500/20 transition-colors">
                        <p className="text-sm text-white leading-relaxed">{tweet.text}</p>
                        {tweet.date && (
                          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{tweet.date}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8">No recent tweets retrieved</p>
                  )}
                </div>
              )}

              {/* Tab: Cross-platform */}
              {activeTab === 'cross' && (
                <div className="space-y-2">
                  {crossPlatform.length > 0 ? (
                    crossPlatform.map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-sky-500/20 hover:bg-sky-500/5 transition-colors group">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-sky-400" />
                          <span className="text-sm text-white">{p.platform}</span>
                          <span className="px-1.5 py-0.5 text-xs rounded bg-emerald-500/20 text-emerald-300">Found</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 group-hover:text-sky-400">
                          <span className="text-xs truncate max-w-48">{p.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-8">No cross-platform profiles found with this username</p>
                  )}
                </div>
              )}

              {/* Tab: Risk */}
              {activeTab === 'risk' && risk && (
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl bg-${riskColor}-500/10 border border-${riskColor}-500/20 flex items-center gap-3`}>
                    <Shield className={`w-6 h-6 text-${riskColor}-400`} />
                    <div>
                      <p className={`text-lg font-bold text-${riskColor}-400 uppercase`}>{risk.level} Risk</p>
                      <p className="text-sm text-slate-400">Score: {risk.score}/100</p>
                    </div>
                  </div>
                  {risk.factors?.length > 0 ? (
                    <div className="space-y-2">
                      {risk.factors.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-slate-300">{f.factor}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <p className="text-sm text-emerald-300">No risk factors detected</p>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
                <Info className="w-3 h-3" />
                Sources: {result.dataSources?.join(', ')}
              </div>
            </>
          )}

          {!result && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-4xl font-bold text-sky-400">𝕏</span>
              </div>
              <div>
                <p className="text-white font-semibold">Twitter / X OSINT</p>
                <p className="text-slate-400 text-sm mt-1">Public profile scraping via Nitter — no API key needed</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 max-w-xs">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">👤 Profile data</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">📝 Recent tweets</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🌐 Cross-platform</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">📊 Growth stats</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TwitterTool;
