import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Copy, Download, RefreshCw, Info, Users, ChevronDown, ChevronUp, ExternalLink, Github, Globe, MapPin, Code, MessageCircle, Key, Star, Activity, Music, Camera, MessageSquare, Linkedin } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const platformIcons = {
  github: Github, gitlab: Code, devto: Code, reddit: MessageCircle,
  hackernews: Activity, keybase: Key, npm: Code, chess: Star,
  lichess: Star, gravatar: Users, bluesky: Globe, mastodon: Globe,
};

const platformColors = {
  github: 'text-white', gitlab: 'text-orange-400', devto: 'text-indigo-400', reddit: 'text-orange-500',
  hackernews: 'text-orange-300', keybase: 'text-blue-400', npm: 'text-red-400', chess: 'text-green-400',
  lichess: 'text-gray-300', gravatar: 'text-blue-300', bluesky: 'text-sky-400', mastodon: 'text-purple-400',
};

const SocialAnalyzerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Social Analyzer', query: query });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [expanded, setExpanded] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3,
      color: ['#ec4899', '#f472b6', '#db2777', '#f9a8d4'][Math.floor(Math.random() * 4)],
    }));
    let id;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { ctx.beginPath(); ctx.fillStyle = p.color + '15'; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); p.x += p.speedX; p.y += p.speedY; if (p.x < 0 || p.x > canvas.width) p.speedX *= -1; if (p.y < 0 || p.y > canvas.height) p.speedY *= -1; });
      id = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(id);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) { toast.error('Enter a username'); return; }
    trackToolUsage('social', 'analyze', 'start');
    setIsSearching(true); setResults(null); setExpanded({}); onConsume?.(15);
    try {
      const resp = await fetch(`${API_BASE}/tools/social/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: query.trim() }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Analysis failed'); }
      const data = await resp.json();
      setResults(data);
      addToHistory('social', query, data);
      toast.success(`Found ${data.platformsFound} platform(s)!`);
    } catch (err) { toast.error(err.message); }
    finally { setIsSearching(false); }
  };

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-pink-950/10 to-slate-950 border border-pink-500/30 shadow-[0_0_100px_rgba(236,72,153,0.1)]">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30"><Users className="w-6 h-6 text-pink-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Social Media Analyzer</h2><p className="text-sm text-slate-400">Deep profile search across 12+ platforms</p></div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-6 border-b border-white/5">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Users className="absolute w-5 h-5 left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter username to search across platforms" className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-pink-500/50 focus:outline-none" />
              </div>
              <button onClick={handleSearch} disabled={isSearching}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {isSearching ? 'Scanning...' : 'Analyze'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {isSearching && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
                <p className="mt-4 text-slate-400">Scanning 12 platforms...</p>
              </div>
            )}
            {results && !isSearching && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Platforms Found</p>
                    <p className="text-3xl font-bold text-pink-400">{results.platformsFound} / {results.platformsChecked}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Total Followers</p>
                    <p className="text-2xl font-bold text-white">{results.summary?.totalFollowers?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Oldest Account</p>
                    <p className="text-sm font-mono text-white">{results.summary?.oldestAccount ? new Date(results.summary.oldestAccount).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-slate-400">Locations</p>
                    <p className="text-sm text-white">{results.summary?.locations?.join(', ') || 'None found'}</p>
                  </div>
                </div>
                {/* Digital Identity Analysis */}
                {results.digitalIdentity && (
                  <div className="p-4 rounded-xl bg-white/5 border border-pink-500/10">
                    <h4 className="text-pink-300 text-sm font-medium mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> Digital Identity</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase">Presence Level</p>
                        <p className={`text-sm font-bold ${results.digitalIdentity.presenceLevel === 'Extensive' ? 'text-red-400' : results.digitalIdentity.presenceLevel === 'Moderate' ? 'text-amber-400' : 'text-green-400'}`}>{results.digitalIdentity.presenceLevel}</p>
                      </div>
                      {results.digitalIdentity.categories && Object.entries(results.digitalIdentity.categories).filter(([, v]) => v > 0).map(([cat, count]) => (
                        <div key={cat} className="p-3 rounded-lg bg-white/5 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase">{cat}</p>
                          <p className="text-sm font-bold text-white">{count} platforms</p>
                        </div>
                      ))}
                    </div>
                    {results.digitalIdentity.privacyExposure && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {results.digitalIdentity.privacyExposure.emailExposed && <span className="px-2 py-1 text-xs rounded bg-red-500/10 text-red-300 border border-red-500/20">Email Exposed</span>}
                        {results.digitalIdentity.privacyExposure.locationExposed && <span className="px-2 py-1 text-xs rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Location Exposed</span>}
                        {results.digitalIdentity.privacyExposure.realNameExposed && <span className="px-2 py-1 text-xs rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">Real Name Exposed</span>}
                        {results.digitalIdentity.privacyExposure.avatarConsistent && <span className="px-2 py-1 text-xs rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">Consistent Avatar</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Activity Timeline */}
                {results.activityTimeline?.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/5 border border-pink-500/10">
                    <h4 className="text-pink-300 text-sm font-medium mb-3">Account Timeline</h4>
                    <div className="space-y-2">
                      {results.activityTimeline.map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-pink-400 flex-shrink-0" />
                          <span className="text-xs text-slate-400 font-mono w-24 flex-shrink-0">{new Date(item.date).toLocaleDateString()}</span>
                          <span className="text-xs text-white capitalize">{item.platform}</span>
                          <span className="text-[10px] text-slate-500">joined</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Platform Cards */}
                <div className="space-y-3">
                  {Object.entries(results.profiles || {}).map(([platform, data]) => {
                    const Icon = platformIcons[platform] || Globe;
                    const colorClass = platformColors[platform] || 'text-white';
                    return (
                      <div key={platform} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                        <button onClick={() => toggleExpand(platform)} className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5">
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                            {data.avatar ? <img src={data.avatar} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <Icon className={`w-5 h-5 ${colorClass}`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${colorClass}`}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</p>
                            <p className="text-xs text-slate-400 truncate">{data.name || data.displayName || data.username || ''}</p>
                          </div>
                          {data.bio && <p className="text-xs text-slate-500 max-w-xs truncate hidden md:block">{data.bio || data.note || data.description}</p>}
                          {data.url && <a href={data.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded hover:bg-white/10"><ExternalLink className="w-3.5 h-3.5 text-slate-400" /></a>}
                          {expanded[platform] ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        <AnimatePresence>
                          {expanded[platform] && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                              className="px-4 pb-4 border-t border-white/5 pt-3">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                {Object.entries(data).filter(([k]) => !['found', 'avatar', 'url', 'topRepos', 'recentActivity', 'packages', 'proofs'].includes(k)).map(([key, val]) => {
                                  if (val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) return null;
                                  const display = Array.isArray(val) ? val.join(', ') : typeof val === 'object' ? JSON.stringify(val) : String(val);
                                  return (
                                    <div key={key}><p className="text-slate-500 capitalize text-xs">{key.replace(/([A-Z])/g, ' $1')}</p><p className="text-white text-xs break-all">{display}</p></div>
                                  );
                                })}
                              </div>
                              {/* GitHub repos */}
                              {data.topRepos?.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-slate-500 mb-1.5">Top Repos</p>
                                  <div className="flex flex-wrap gap-2">
                                    {data.topRepos.map((r, i) => (
                                      <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                                        className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors">
                                        <span className="text-white font-medium">{r.name}</span>
                                        <span className="text-slate-500 ml-2">★{r.stars}</span>
                                        {r.language && <span className="text-slate-600 ml-1">• {r.language}</span>}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {/* Keybase proofs */}
                              {data.proofs?.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs text-slate-500 mb-1.5">Identity Proofs</p>
                                  <div className="flex flex-wrap gap-2">
                                    {data.proofs.map((p, i) => (
                                      <span key={i} className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 text-xs border border-blue-500/20">{p.type}: {p.nametag}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => copy(JSON.stringify(results, null, 2))} className="p-2 rounded-lg hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                  <button onClick={() => exportToJSON(results, 'social-analyzer-results')} className="p-2 rounded-lg hover:bg-white/10"><Download className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2"><Info className="w-3 h-3" /> Sources: {results.dataSources?.join(', ')} • {results.searchDuration}</div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SocialAnalyzerTool;
