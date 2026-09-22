import { useState, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, X, Search, RefreshCw, Copy, Download, ExternalLink,
  User, Hash, Shield, AlertTriangle, CheckCircle, Clock, ChevronDown,
  ChevronUp, Globe, Server, Info, Star
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { exportToJSON } from '../../utils/export';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Section = ({ title, icon: Icon, children, color = 'indigo', defaultOpen = true }) => {
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

const Badge = ({ label, color = 'indigo' }) => (
  <span className={`px-2 py-0.5 text-xs rounded-full bg-${color}-500/15 text-${color}-300 border border-${color}-500/25`}>
    {label}
  </span>
);

const BADGE_COLORS = {
  'Discord Staff': 'red',
  'Discord Partner': 'blue',
  'HypeSquad Events': 'purple',
  'Bug Hunter Level 1': 'green',
  'Bug Hunter Level 2': 'emerald',
  'HypeSquad Bravery': 'orange',
  'HypeSquad Brilliance': 'yellow',
  'HypeSquad Balance': 'teal',
  'Early Supporter': 'pink',
  'Verified Automation Developer': 'cyan',
  'Active Developer': 'violet',
};

const cleanBadgeLabel = (label) => String(label || '').replace(/\bBot\b/gi, 'Automation');

const DiscordScannerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('auto');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'DiscordScanner', query: query });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);
  const handleSearch = useCallback(async () => {
    if (!query.trim()) { toast.error('Enter a Discord user ID, server name, or username'); return; }
    onConsume?.(8);
    setIsSearching(true);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/discord/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), type: searchType }),
      });
      const data = await resp.json();
      if (!resp.ok || (data.error && !data.success)) throw new Error(data.error || 'Scan failed');
      setResult(data);
      addToHistory('discord', query, data);
      toast.success(data.type === 'user' ? 'User profile retrieved' : `Found ${data.totalResults || 0} results`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSearching(false);
    }
  }, [query, searchType, onConsume, toast, addToHistory]);

  const profile = result?.profile;
  const snowflake = result?.snowflake;
  const risk = result?.riskAssessment;

  const riskColor = risk?.level === 'critical' ? 'red' : risk?.level === 'high' ? 'orange' : risk?.level === 'medium' ? 'amber' : 'emerald';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950/15 to-slate-950 border border-indigo-500/30 shadow-[0_0_80px_rgba(99,102,241,0.1)]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
              <MessageCircle className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Discord Scanner</h2>
              <p className="text-sm text-slate-400">User ID lookup · Server search · Snowflake decoder</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <>
                <button onClick={() => copy(JSON.stringify(result, null, 2))}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => exportToJSON(result, 'discord-scan')}
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
        <div className="p-5 border-b border-white/5 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Hash className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="User ID (e.g. 123456789012345678) or server name"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500/50 focus:outline-none text-sm" />
            </div>
            <select value={searchType} onChange={e => setSearchType(e.target.value)}
              className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm focus:outline-none focus:border-indigo-500/50">
              <option value="auto">Auto</option>
              <option value="user">User ID</option>
              <option value="server">Server</option>
            </select>
            <button onClick={handleSearch} disabled={isSearching}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 text-sm">
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {isSearching ? 'Scanning...' : 'Scan'}
            </button>
          </div>
          <p className="text-xs text-slate-600">
            User IDs are 17–20 digit numbers. Server search uses Disboard, top.gg, and Disforge.
          </p>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-5 max-h-[calc(92vh-200px)] space-y-4">
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">Querying Discord databases...</p>
            </div>
          )}

          {result && !isSearching && (
            <>
              {/* User profile */}
              {result.type === 'user' && (
                <>
                  {/* Profile card */}
                  {profile && (
                    <Section title="User Profile" icon={User} color="indigo">
                      <div className="flex items-start gap-4 mt-2">
                        {profile.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="avatar"
                            className="w-16 h-16 rounded-full border-2 border-indigo-500/40 shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center shrink-0">
                            <User className="w-8 h-8 text-indigo-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-lg font-bold text-white">
                              {profile.globalName || profile.username || 'Unknown'}
                            </p>
                            {profile.discriminator && profile.discriminator !== '0' && (
                              <span className="text-slate-400 text-sm">#{profile.discriminator}</span>
                            )}
                            {profile.bot && <Badge label="AUTOMATION" color="blue" />}
                            {profile.verified && <Badge label="VERIFIED" color="green" />}
                          </div>
                          <p className="text-slate-400 text-sm font-mono mt-0.5">{profile.id || result.query}</p>
                          {/* Badges */}
                          {profile.badges?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {profile.badges.map((badge, i) => (
                                <Badge key={i} label={cleanBadgeLabel(badge)}
                                  color={BADGE_COLORS[badge] || 'indigo'} />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <a href={`https://discord.com/users/${profile.id || result.query}`}
                            target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" /> Open Profile
                          </a>
                        </div>
                      </div>
                      {profile.bannerColor && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: profile.bannerColor }} />
                          <span className="text-xs text-slate-400">Banner color: {profile.bannerColor}</span>
                        </div>
                      )}
                    </Section>
                  )}

                  {/* Snowflake info */}
                  {snowflake?.valid && (
                    <Section title="Snowflake Decoder" icon={Clock} color="purple">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {[
                          ['Created At', snowflake.createdAtHuman],
                          ['Account Age', `${snowflake.accountAgeDays} days (${snowflake.accountAgeYears} years)`],
                          ['Worker ID', snowflake.workerId],
                          ['Process ID', snowflake.processId],
                          ['Increment', snowflake.increment],
                          ['Snowflake', snowflake.snowflake],
                        ].map(([k, v]) => (
                          <div key={k} className="p-2 rounded-lg bg-white/5">
                            <p className="text-xs text-slate-500">{k}</p>
                            <p className="text-sm text-white font-mono">{v}</p>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {/* Risk assessment */}
                  {risk && (
                    <Section title="Risk Assessment" icon={Shield} color={riskColor}>
                      <div className="flex items-center gap-3 mt-2 mb-3">
                        <div className={`px-3 py-1.5 rounded-lg bg-${riskColor}-500/15 border border-${riskColor}-500/30`}>
                          <span className={`text-sm font-bold text-${riskColor}-400 uppercase`}>{risk.level}</span>
                        </div>
                        <span className="text-slate-400 text-sm">Risk Score: {risk.score}/100</span>
                      </div>
                      {risk.factors?.length > 0 ? (
                        <div className="space-y-1.5">
                          {risk.factors.map((f, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                              <p className="text-xs text-slate-300">{f.factor}</p>
                              <span className={`ml-auto text-xs text-${riskColor}-400 shrink-0`}>+{f.impact}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <p className="text-xs text-emerald-300">No risk factors detected</p>
                        </div>
                      )}
                    </Section>
                  )}
                </>
              )}

              {/* Server search results */}
              {result.type === 'search' && (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm text-white">Found <strong>{result.totalResults || 0}</strong> results across {result.dataSources?.join(', ')}</span>
                  </div>

                  {result.disboard?.length > 0 && (
                    <Section title={`Disboard (${result.disboard.length})`} icon={Server} color="indigo">
                      <div className="space-y-2 mt-2">
                        {result.disboard.map((s, i) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                                {s.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{s.description}</p>}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                {s.members && <span className="text-xs text-indigo-300">{Number(s.members).toLocaleString()} members</span>}
                                {s.url && (
                                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> View
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {result.topgg?.bots?.length > 0 && (
                    <Section title={`Top.gg Automation Listings (${result.topgg.bots.length})`} icon={Star} color="yellow">
                      <div className="space-y-2 mt-2">
                        {result.topgg.bots.map((b, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                            <p className="text-sm text-white">{b.name}</p>
                            <div className="flex items-center gap-2">
                              {b.votes && <span className="text-xs text-yellow-400">{Number(b.votes).toLocaleString()} votes</span>}
                              {b.url && <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-yellow-400"><ExternalLink className="w-3 h-3" /></a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}

                  {result.disforge?.length > 0 && (
                    <Section title={`Disforge (${result.disforge.length})`} icon={Globe} color="purple">
                      <div className="space-y-2 mt-2">
                        {result.disforge.map((s, i) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                            <p className="text-sm text-white">{s.name}</p>
                            <div className="flex items-center gap-2">
                              {s.members && <span className="text-xs text-purple-400">{Number(s.members).toLocaleString()} members</span>}
                              {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-purple-400"><ExternalLink className="w-3 h-3" /></a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Section>
                  )}
                </>
              )}

              <div className="text-xs text-slate-600 flex items-center gap-2 pt-1">
                <Info className="w-3 h-3" />
                Sources: {result.dataSources?.join(', ')} · {result.queryTime}
              </div>
            </>
          )}

          {!result && !isSearching && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <MessageCircle className="w-12 h-12 text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Discord Intelligence</p>
                <p className="text-slate-400 text-sm mt-1">Look up users by Snowflake ID or search public servers</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 max-w-xs">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🔢 Snowflake decoder</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">👤 User profile lookup</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🏷 Badge detection</div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">🔍 Server search</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DiscordScannerTool;
