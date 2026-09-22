import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Zap, User, Globe, CheckCircle, XCircle, ExternalLink,
  Copy, Download, RefreshCw, Eye, Filter, BarChart3, ChevronRight, Clock,
  Shield, AlertTriangle, TrendingUp, Hash, Layers, Grid3X3, List,
  ChevronDown, ChevronUp, Star, Bookmark, Link2, Activity, Target,
  Crosshair, Radar, Wifi, Database, FileText, Image, MapPin, Calendar,
  ArrowUpRight, Percent, Lock, Unlock, AlertCircle, Info, Settings,
  Maximize2, Minimize2, PieChart, Users, Network, Fingerprint, Cpu,
  Camera, GitBranch, Award, Sparkles, History
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ═══════════════════════════════════════════════════════════════════════
   RISK ASSESSMENT ENGINE (Enhanced with multi-engine scoring)
   ═══════════════════════════════════════════════════════════════════════ */
const calculateFootprintScore = (results) => {
  if (!results?.profiles) return { score: 0, level: 'UNKNOWN', factors: [] };
  const factors = [];
  const found = results.found || 0;
  const total = results.totalChecked || 1;
  const ratio = found / total;

  let score = Math.min(ratio * 100 * 3, 40);
  if (found > 50) factors.push({ text: 'Massively high platform presence (50+)', severity: 'critical', points: 20 });
  else if (found > 30) factors.push({ text: 'Extremely high platform presence (30+)', severity: 'critical', points: 15 });
  else if (found > 20) factors.push({ text: 'Very high platform presence (20+)', severity: 'high', points: 10 });
  else if (found > 10) factors.push({ text: 'Moderate platform presence (10+)', severity: 'medium', points: 5 });

  const cats = Object.keys(results.categoryBreakdown || {});
  if (cats.length > 8) { score += 20; factors.push({ text: `Spread across ${cats.length} categories — extremely diverse`, severity: 'critical', points: 20 }); }
  else if (cats.length > 6) { score += 15; factors.push({ text: `Active across ${cats.length} categories`, severity: 'high', points: 15 }); }
  else if (cats.length > 3) { score += 8; factors.push({ text: `Present in ${cats.length} categories`, severity: 'medium', points: 8 }); }

  const profiles = results.profiles || [];
  const sensitivePatterns = ['dating', 'adult', 'gambling', 'crypto', 'darknet', 'hack', 'leaked', 'nsfw', 'tor'];
  const sensitiveFound = profiles.filter(p => sensitivePatterns.some(s =>
    (p.category || '').toLowerCase().includes(s) || (p.platform || '').toLowerCase().includes(s)
  ));
  if (sensitiveFound.length > 0) {
    score += sensitiveFound.length * 8;
    factors.push({ text: `${sensitiveFound.length} sensitive platform(s) detected`, severity: 'critical', points: sensitiveFound.length * 8 });
  }

  const socialCount = profiles.filter(p => ['social', 'social media', 'Social', 'social-networks'].includes(p.category)).length;
  if (socialCount > 5) { score += 10; factors.push({ text: `${socialCount} social media accounts — high social exposure`, severity: 'high', points: 10 }); }

  const devCount = profiles.filter(p => ['developer', 'coding', 'programming', 'Development', 'dev', 'Developer'].includes(p.category)).length;
  if (devCount > 3) { score += 8; factors.push({ text: `${devCount} developer platforms — potential code/key exposure`, severity: 'medium', points: 8 }); }

  const finCount = profiles.filter(p => ['finance', 'cryptocurrency', 'shopping', 'commerce', 'Commerce'].includes(p.category?.toLowerCase?.() || p.category)).length;
  if (finCount > 0) { score += finCount * 5; factors.push({ text: `${finCount} financial/commerce platform(s)`, severity: 'high', points: finCount * 5 }); }

  // Multi-engine confirmation bonus
  const multiConfirmed = profiles.filter(p => (p.sources?.length || 0) > 1).length;
  if (multiConfirmed > 5) { score += 10; factors.push({ text: `${multiConfirmed} accounts confirmed by multiple engines`, severity: 'high', points: 10 }); }
  else if (multiConfirmed > 2) { score += 5; factors.push({ text: `${multiConfirmed} accounts confirmed by multiple engines`, severity: 'medium', points: 5 }); }

  // Enrichment found
  const enriched = profiles.filter(p => p.enrichment && Object.keys(p.enrichment).length > 0).length;
  if (enriched > 3) { score += 5; factors.push({ text: `${enriched} profiles with enriched metadata (bio, stats)`, severity: 'medium', points: 5 }); }

  // Avatar reuse
  const avatarCount = results.avatarMatches || 0;
  if (avatarCount > 2) { score += 12; factors.push({ text: `Avatar images found on ${avatarCount}+ platforms — visual correlation possible`, severity: 'high', points: 12 }); }

  // Historical presence (enhanced with backend wayback data)
  const waybackHits = results.waybackResults?.filter(w => w.found)?.length || 0;
  const waybackArchived = results.waybackSummary?.totalArchived || 0;
  const totalWayback = waybackArchived || waybackHits;
  if (totalWayback > 0) { score += Math.min(totalWayback * 3, 15); factors.push({ text: `${totalWayback} profile(s) found in Wayback Machine archives (${results.waybackSummary?.totalCaptures || 0} total snapshots)`, severity: totalWayback > 5 ? 'high' : 'medium', points: Math.min(totalWayback * 3, 15) }); }

  // Hudson Rock infostealer compromise
  if (results.hudsonRock?.compromised) {
    score += 25;
    factors.push({ text: `USERNAME COMPROMISED — found in ${results.hudsonRock.stealerCount} infostealer log(s) (Hudson Rock)`, severity: 'critical', points: 25 });
  }

  // Domain exists
  if (results.domainCheck?.exists) { score += 10; factors.push({ text: `Domain "${results.domainCheck.domain}" exists — may be associated`, severity: 'high', points: 10 }); }

  score = Math.min(Math.round(score), 100);
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MODERATE' : score >= 20 ? 'LOW' : 'MINIMAL';
  return { score, level, factors: factors.sort((a, b) => b.points - a.points) };
};

const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-400', dot: 'bg-orange-500' },
  medium: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400', dot: 'bg-amber-500' },
  low: { bg: 'bg-blue-500/15', border: 'border-blue-500/40', text: 'text-blue-400', dot: 'bg-blue-500' },
  minimal: { bg: 'bg-slate-500/15', border: 'border-slate-500/40', text: 'text-slate-400', dot: 'bg-slate-500' },
};

const RISK_COLORS = {
  CRITICAL: { ring: '#ef4444', bg: 'from-red-500/20 to-red-900/10', text: 'text-red-400', badge: 'bg-red-500/20 border-red-500/40 text-red-300' },
  HIGH: { ring: '#f97316', bg: 'from-orange-500/20 to-orange-900/10', text: 'text-orange-400', badge: 'bg-orange-500/20 border-orange-500/40 text-orange-300' },
  MODERATE: { ring: '#f59e0b', bg: 'from-amber-500/20 to-amber-900/10', text: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/40 text-amber-300' },
  LOW: { ring: '#06b6d4', bg: 'from-cyan-500/20 to-cyan-900/10', text: 'text-cyan-400', badge: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' },
  MINIMAL: { ring: '#22c55e', bg: 'from-emerald-500/20 to-emerald-900/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' },
  UNKNOWN: { ring: '#64748b', bg: 'from-slate-500/20 to-slate-900/10', text: 'text-slate-400', badge: 'bg-slate-500/20 border-slate-500/40 text-slate-300' },
};

/* ═══════════════════════════════════════════════════════════════════════
   SVG RISK GAUGE
   ═══════════════════════════════════════════════════════════════════════ */
const RiskGauge = ({ score, level, size = 140 }) => {
  const colors = RISK_COLORS[level] || RISK_COLORS.UNKNOWN;
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={colors.ring} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${colors.ring}60)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}
          className={`text-3xl font-black font-mono ${colors.text}`}>{score}</motion.span>
        <span className="text-[10px] font-bold tracking-widest text-slate-500 mt-0.5">{level}</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   CATEGORY DONUT CHART
   ═══════════════════════════════════════════════════════════════════════ */
const CAT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#3b82f6', '#14b8a6'];

const CategoryDonut = ({ breakdown, size = 120 }) => {
  const entries = Object.entries(breakdown || {}).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
        {entries.map(([cat, count], i) => {
          const pct = count / total;
          const rotation = accumulated * 360;
          accumulated += pct;
          return (
            <circle key={cat} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={CAT_COLORS[i % CAT_COLORS.length]}
              strokeWidth="10" strokeDasharray={`${circumference * pct} ${circumference * (1 - pct)}`}
              strokeDashoffset={0} style={{ transformOrigin: 'center', transform: `rotate(${rotation}deg)` }} opacity={0.85} />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{total}</span>
        <span className="text-[9px] text-slate-500 uppercase tracking-wider">Found</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   CONFIDENCE BADGE
   ═══════════════════════════════════════════════════════════════════════ */
const ConfidenceBadge = ({ sources }) => {
  const count = sources?.length || 1;
  const colors = count >= 3 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    : count === 2 ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
      : 'bg-slate-500/20 text-slate-400 border-slate-500/40';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${colors} font-mono`}>
      {count}× verified
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */
const getFavicon = (url) => {
  try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; }
  catch { return null; }
};

const SOURCE_COLORS = {
  sherlock: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', label: 'Sherlock' },
  maigret: { bg: 'bg-purple-500/20', text: 'text-purple-300', label: 'Maigret' },
  enrichment: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Enriched' },
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: Target, desc: 'Risk assessment & summary' },
  { id: 'profiles', label: 'Profiles', icon: Users, desc: 'All discovered accounts' },
  { id: 'analysis', label: 'Analysis', icon: PieChart, desc: 'Category & pattern analysis' },
  { id: 'crossintel', label: 'Cross-Intel', icon: Network, desc: 'Avatars, enrichment & correlation' },
  { id: 'timeline', label: 'Timeline', icon: Clock, desc: 'Discovery timeline' },
  { id: 'risk', label: 'Risk Intel', icon: Shield, desc: 'Threat assessment' },
  { id: 'enriched', label: 'Enriched', icon: Database, desc: 'WhatsMyName, DetectDee, Bio, Screenshot' },
];

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const SherlockTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  const canvasRef = useRef(null);
  const inputRef = useRef(null);

  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Sherlock', query: username });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('overview');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [bookmarked, setBookmarked] = useState(new Set());
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [searchPhase, setSearchPhase] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSources, setScanSources] = useState([]);
  const [sortBy, setSortBy] = useState('confidence');
  const [batchMode, setBatchMode] = useState(false);
  const [batchUsernames, setBatchUsernames] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [usernameEnriched, setUsernameEnriched] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [bioText, setBioText] = useState('');
  const [screenshotSite, setScreenshotSite] = useState('instagram');

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.altKey && e.key >= '1' && e.key <= '6') { e.preventDefault(); setActiveTab(TABS[parseInt(e.key) - 1]?.id); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* ── Canvas HUD ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth * 2; canvas.height = canvas.offsetHeight * 2; ctx.scale(2, 2); };
    resize();
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.offsetWidth, y: Math.random() * canvas.offsetHeight,
      size: Math.random() * 1.5 + 0.3, speed: Math.random() * 0.3 + 0.1,
      angle: Math.random() * Math.PI * 2,
      color: ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#ec4899'][Math.floor(Math.random() * 5)],
    }));
    let t = 0, animId;
    const animate = () => {
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(99,102,241,0.04)'; ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      if (isSearching) {
        const scanY = (t * 0.5) % h;
        const g = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
        g.addColorStop(0, 'rgba(99,102,241,0)'); g.addColorStop(0.5, 'rgba(99,102,241,0.25)'); g.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.fillStyle = g; ctx.fillRect(0, scanY - 30, w, 60);
      }
      particles.forEach(p => {
        p.angle += p.speed * 0.02;
        ctx.beginPath(); ctx.fillStyle = p.color + '30';
        ctx.arc(p.x + Math.cos(p.angle) * 2, p.y + Math.sin(p.angle) * 2, p.size, 0, Math.PI * 2); ctx.fill();
      });
      const bs = 20; ctx.strokeStyle = 'rgba(99,102,241,0.15)'; ctx.lineWidth = 1.5;
      [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]].forEach(([x, y, dx, dy]) => {
        ctx.beginPath(); ctx.moveTo(x + dx * bs, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * bs); ctx.stroke();
      });
      t++; animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [isSearching]);

  /* ══════════════════════════════════════════════════════════════════
     FREE PROFILE ENRICHMENT (GitHub, Reddit, Keybase, Gravatar, Dev.to, Wayback, DNS)
     ══════════════════════════════════════════════════════════════════ */
  const enrichProfiles = useCallback(async (target) => {
    const data = {};
    const fetchers = [
      // GitHub (free, no key needed)
      fetch(`https://api.github.com/users/${target}`, { signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null)
        .then(d => { if (d && !d.message) data.github = { platform: 'GitHub', url: d.html_url, avatar: d.avatar_url, bio: d.bio, name: d.name, location: d.location, company: d.company, repos: d.public_repos, followers: d.followers, following: d.following, created: d.created_at, blog: d.blog, category: 'Developer' }; })
        .catch(() => {}),
      // Reddit (free)
      fetch(`https://www.reddit.com/user/${target}/about.json`, { signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.data && !d?.data?.is_suspended) data.reddit = { platform: 'Reddit', url: `https://reddit.com/user/${target}`, avatar: d.data.icon_img?.split('?')[0], karma: (d.data.link_karma || 0) + (d.data.comment_karma || 0), created: new Date(d.data.created_utc * 1000).toISOString(), category: 'Social' }; })
        .catch(() => {}),
      // Keybase (free)
      fetch(`https://keybase.io/_/api/1.0/user/lookup.json?usernames=${target}`, { signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null)
        .then(d => { const u = d?.them?.[0]; if (u?.basics) data.keybase = { platform: 'Keybase', url: `https://keybase.io/${target}`, avatar: u.pictures?.primary?.url, bio: u.profile?.bio, name: u.profile?.full_name, proofs: u.proofs_summary?.all?.length || 0, category: 'Security' }; })
        .catch(() => {}),
      // Gravatar (free)
      fetch(`https://en.gravatar.com/${target}.json`, { signal: AbortSignal.timeout(6000) }).then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.entry?.[0]) data.gravatar = { platform: 'Gravatar', avatar: d.entry[0].thumbnailUrl, name: d.entry[0].displayName, bio: d.entry[0].aboutMe, location: d.entry[0].currentLocation, category: 'Identity' }; })
        .catch(() => {}),
      // Dev.to (free)
      fetch(`https://dev.to/api/users/by_username?url=${target}`, { signal: AbortSignal.timeout(6000) }).then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.id) data.devto = { platform: 'DEV.to', url: `https://dev.to/${target}`, avatar: d.profile_image, bio: d.summary, name: d.name, joined: d.joined_at, category: 'Developer' }; })
        .catch(() => {}),
      // Wayback Machine (free)
      fetch(`https://archive.org/wayback/available?url=github.com/${target}`, { signal: AbortSignal.timeout(8000) }).then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.archived_snapshots?.closest) data.wayback = { found: true, url: d.archived_snapshots.closest.url, timestamp: d.archived_snapshots.closest.timestamp }; })
        .catch(() => {}),
      // Domain check via Google DNS (free)
      fetch(`https://dns.google/resolve?name=${target}.com&type=A`, { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : null)
        .then(d => { data.domainCheck = { domain: `${target}.com`, exists: !!(d?.Answer?.length) }; })
        .catch(() => { data.domainCheck = { domain: `${target}.com`, exists: false }; }),
    ];
    await Promise.allSettled(fetchers);
    return data;
  }, []);

  /* ══════════════════════════════════════════════════════════════════
     MERGE RESULTS FROM ALL ENGINES
     ══════════════════════════════════════════════════════════════════ */
  const mergeResults = useCallback((target, sherlockData, maigretData, enrichData) => {
    const profileMap = new Map();
    const normKey = (platform) => (platform || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // Sherlock results
    (sherlockData?.profiles || []).forEach(p => {
      const key = normKey(p.platform);
      profileMap.set(key, { ...p, sources: ['sherlock'], confidence: 1 });
    });

    // Maigret results (merge/dedupe)
    (maigretData?.profiles || []).forEach(p => {
      const key = normKey(p.platform);
      if (profileMap.has(key)) {
        const existing = profileMap.get(key);
        existing.sources.push('maigret');
        existing.confidence = existing.sources.length;
        if (p.tags) existing.tags = p.tags;
      } else {
        profileMap.set(key, {
          platform: p.platform, url: p.url,
          category: (Array.isArray(p.tags) ? p.tags[0] : p.tags) || p.category || 'Other',
          status: 'found', sources: ['maigret'], confidence: 1, tags: p.tags,
        });
      }
    });

    // Enrichment data (merge/add)
    Object.entries(enrichData || {}).forEach(([key, edata]) => {
      if (key === 'wayback' || key === 'domainCheck') return;
      const normK = normKey(edata.platform);
      if (profileMap.has(normK)) {
        const existing = profileMap.get(normK);
        if (!existing.sources.includes('enrichment')) existing.sources.push('enrichment');
        existing.confidence = existing.sources.length;
        existing.enrichment = edata;
        existing.avatar = edata.avatar || existing.avatar;
      } else if (edata.url || edata.avatar) {
        profileMap.set(normK, {
          platform: edata.platform, url: edata.url, category: edata.category || 'Other',
          status: 'found', sources: ['enrichment'], confidence: 1, enrichment: edata, avatar: edata.avatar,
        });
      }
    });

    const profiles = Array.from(profileMap.values());
    const avatarProfiles = profiles.filter(p => p.avatar || p.enrichment?.avatar);

    // Category breakdown
    const categoryBreakdown = {};
    profiles.forEach(p => { const cat = p.category || 'Other'; categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1; });

    // Source breakdown
    const sourceBreakdown = { sherlock: 0, maigret: 0, enrichment: 0 };
    profiles.forEach(p => (p.sources || []).forEach(s => { sourceBreakdown[s] = (sourceBreakdown[s] || 0) + 1; }));

    const sherlockCount = (sherlockData?.profiles || []).length;
    const maigretCount = (maigretData?.profiles || []).length;
    const enrichmentCount = Object.keys(enrichData || {}).filter(k => k !== 'wayback' && k !== 'domainCheck').length;
    const enginesUsed = [sherlockData ? 'Sherlock' : null, maigretData?.profiles?.length ? 'Maigret' : null, enrichmentCount > 0 ? 'Enrichment' : null].filter(Boolean).length;

    return {
      username: target, profiles, found: profiles.length,
      totalChecked: (sherlockData?.totalChecked || 0) + (maigretData?.totalChecked || 0),
      categoryBreakdown, sourceBreakdown, enginesUsed,
      avatarMatches: avatarProfiles.length, avatars: avatarProfiles.map(p => ({ platform: p.platform, url: p.avatar || p.enrichment?.avatar })),
      waybackResults: enrichData?.wayback ? [enrichData.wayback] : [],
      waybackSummary: sherlockData?.waybackSummary || null,
      hudsonRock: sherlockData?.hudsonRock || null,
      backendFootprintScore: sherlockData?.footprintScore || null,
      backendDataSources: sherlockData?.dataSources || [],
      domainCheck: enrichData?.domainCheck,
      sherlockCount, maigretCount, enrichmentCount,
      searchDuration: sherlockData?.searchDuration || 'N/A',
      notFoundCount: sherlockData?.notFoundCount || 0,
      notFoundPlatforms: sherlockData?.notFoundPlatforms || [],
      verifiedFound: sherlockData?.verifiedFound || 0,
      unverifiedFound: sherlockData?.unverifiedFound || 0,
    };
  }, []);

  /* ══════════════════════════════════════════════════════════════════
     MULTI-ENGINE SEARCH
     ══════════════════════════════════════════════════════════════════ */
  const handleSearch = useCallback(async () => {
    const target = username.trim();
    if (!target) { toast?.error?.('Enter a username to investigate'); return; }
    trackToolUsage('sherlock', 'search', { username: target });
    setIsSearching(true); setResults(null); setScanProgress(0); setActiveTab('overview');
    onConsume?.(18);

    const sources = [
      { name: 'Sherlock Engine', status: 'pending', icon: '🔍' },
      { name: 'Maigret Deep Scan', status: 'pending', icon: '🕵️' },
      { name: 'GitHub API', status: 'pending', icon: '🐙' },
      { name: 'Reddit API', status: 'pending', icon: '🔴' },
      { name: 'Keybase Lookup', status: 'pending', icon: '🔐' },
      { name: 'Gravatar Check', status: 'pending', icon: '👤' },
      { name: 'Wayback Machine', status: 'pending', icon: '📜' },
      { name: 'Domain Check', status: 'pending', icon: '🌐' },
    ];
    setScanSources([...sources]);

    const phases = [
      'Initializing multi-engine reconnaissance...',
      'Running Sherlock across 50+ platforms...',
      'Launching Maigret deep analysis (2000+ sites)...',
      'Querying free enrichment APIs (GitHub, Reddit, Keybase)...',
      'Checking Gravatar & DEV.to...',
      'Probing Wayback Machine for historical presence...',
      'Checking domain registration...',
      'Cross-correlating findings across engines...',
      'Computing digital footprint & threat score...',
      'Compiling investigation dossier...',
    ];

    let phaseIdx = 0;
    setSearchPhase(phases[0]);
    const phaseInterval = setInterval(() => {
      phaseIdx++;
      if (phaseIdx < phases.length) setSearchPhase(phases[phaseIdx]);
      setScanProgress(Math.min(((phaseIdx + 1) / phases.length) * 90, 90));
      if (phaseIdx === 1 && sources[0]) sources[0].status = 'done';
      if (phaseIdx === 2 && sources[1]) sources[1].status = 'done';
      if (phaseIdx === 3) { if (sources[2]) sources[2].status = 'done'; if (sources[3]) sources[3].status = 'done'; if (sources[4]) sources[4].status = 'done'; }
      if (phaseIdx === 4 && sources[5]) sources[5].status = 'done';
      if (phaseIdx === 5 && sources[6]) sources[6].status = 'done';
      if (phaseIdx === 6 && sources[7]) sources[7].status = 'done';
      setScanSources([...sources]);
    }, 2000);

    try {
      // Fire ALL engines in parallel
      const [sherlockResp, maigretResp, enrichResp] = await Promise.allSettled([
        fetch(`${API_BASE}/tools/sherlock/check`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: target }),
        }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE}/tools/maigret/check`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: target }),
        }).then(r => r.ok ? r.json() : null).catch(() => null),
        enrichProfiles(target),
      ]);

      clearInterval(phaseInterval);
      setScanProgress(100);
      sources.forEach(s => s.status = 'done');
      setScanSources([...sources]);

      const sherlockData = sherlockResp.status === 'fulfilled' ? sherlockResp.value : null;
      const maigretData = maigretResp.status === 'fulfilled' ? maigretResp.value : null;
      const enrichData = enrichResp.status === 'fulfilled' ? enrichResp.value : {};

      const merged = mergeResults(target, sherlockData, maigretData, enrichData);
      setResults(merged);
      addToHistory?.('sherlock', target, merged);
      toast?.success?.(`Discovered ${merged.found} accounts from ${merged.enginesUsed} engine(s) across ${merged.totalChecked}+ platforms`);
      setIsEnriching(true);
      try {
        const enrichBackendResp = await fetch(`${API_BASE}/tools/username/enriched`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: target, action: 'all' }),
        });
        if (enrichBackendResp.ok) {
          const enrichBackendData = await enrichBackendResp.json();
          setUsernameEnriched(enrichBackendData);
        }
      } catch (e) {
        console.log('[Username Enrich]', e.message);
      } finally {
        setIsEnriching(false);
      }
    } catch (err) {
      clearInterval(phaseInterval);
      toast?.error?.(err.message || 'Investigation failed');
    } finally {
      setIsSearching(false); setSearchPhase(''); setScanProgress(0);
    }
  }, [username, enrichProfiles, mergeResults, onConsume, addToHistory]);

  /* ── Batch Search ── */
  const handleBatchSearch = useCallback(async () => {
    const usernames = batchUsernames.split('\n').map(u => u.trim()).filter(Boolean);
    if (!usernames.length) { toast?.error?.('Enter at least one username'); return; }
    setBatchResults([]); setIsSearching(true);
    onConsume?.(18 * Math.min(usernames.length, 5));
    for (const uname of usernames.slice(0, 5)) {
      try {
        const [sherlockResp, enrichResp] = await Promise.allSettled([
          fetch(`${API_BASE}/tools/sherlock/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: uname }) }).then(r => r.ok ? r.json() : null),
          enrichProfiles(uname),
        ]);
        const merged = mergeResults(uname, sherlockResp.value, null, enrichResp.value || {});
        setBatchResults(prev => [...prev, merged]);
      } catch { /* skip */ }
    }
    setIsSearching(false);
    toast?.success?.(`Batch scan complete for ${Math.min(usernames.length, 5)} usernames`);
  }, [batchUsernames, enrichProfiles, mergeResults, onConsume]);

  /* ── Computed ── */
  const footprint = useMemo(() => calculateFootprintScore(results), [results]);
  const categories = useMemo(() => results ? ['all', ...Object.keys(results.categoryBreakdown || {})] : ['all'], [results]);
  const allSources = useMemo(() => {
    if (!results) return ['all'];
    const s = new Set();
    (results.profiles || []).forEach(p => (p.sources || []).forEach(src => s.add(src)));
    return ['all', ...s];
  }, [results]);

  const filteredProfiles = useMemo(() => {
    let profiles = results?.profiles || [];
    if (filterCategory !== 'all') profiles = profiles.filter(p => p.category === filterCategory);
    if (filterSource !== 'all') profiles = profiles.filter(p => p.sources?.includes(filterSource));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      profiles = profiles.filter(p => p.platform?.toLowerCase().includes(q) || p.url?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (sortBy === 'platform') profiles.sort((a, b) => (a.platform || '').localeCompare(b.platform || ''));
    else if (sortBy === 'category') profiles.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    else if (sortBy === 'confidence') profiles.sort((a, b) => (b.confidence || 1) - (a.confidence || 1));
    return profiles;
  }, [results, filterCategory, filterSource, searchQuery, sortBy]);

  const toggleBookmark = useCallback((url) => {
    setBookmarked(prev => { const next = new Set(prev); if (next.has(url)) next.delete(url); else next.add(url); return next; });
  }, []);

  /* ── Export ── */
  const handleExport = useCallback((format) => {
    if (!results) return;
    const filename = `sherlock_${results.username || username}_${new Date().toISOString().slice(0, 10)}`;
    if (format === 'json') {
      exportToJSON({ ...results, footprintScore: footprint }, `${filename}.json`);
    } else if (format === 'csv') {
      const csvData = (results.profiles || []).map(p => ({
        Platform: p.platform, Category: p.category, URL: p.url, Sources: (p.sources || []).join('+'),
        Confidence: p.confidence || (p.verified ? 'high' : 'low'), Followers: p.enrichment?.followers || p.followers || '',
        Avatar: p.avatar || p.enrichment?.avatar || '', WaybackCaptures: p.wayback?.totalCaptures || 0,
        WaybackFirstSeen: p.wayback?.firstCapture || '', Verified: p.verified ? 'Yes' : 'No',
      }));
      exportToCSV(csvData, `${filename}.csv`);
    } else if (format === 'txt') {
      const lines = [
        'SHERLOCK PRO — MULTI-ENGINE INVESTIGATION REPORT', '═'.repeat(60),
        `Target Username: ${results.username}`, `Date: ${new Date().toISOString()}`,
        `Engines Used: ${results.enginesUsed}`, `Platforms Checked: ${results.totalChecked}+`,
        `Accounts Found: ${results.found}`, `Digital Footprint Score: ${footprint.score}/100 (${footprint.level})`, '',
        'SOURCE BREAKDOWN:', `  Sherlock: ${results.sherlockCount || 0}`, `  Maigret: ${results.maigretCount || 0}`,
        `  Enrichment: ${results.enrichmentCount || 0}`, '',
        '═══ CYBER THREAT INTELLIGENCE ═══', '',
        results.hudsonRock?.compromised
          ? `[CRITICAL] USERNAME COMPROMISED — Found in ${results.hudsonRock.stealerCount} infostealer log(s)`
          : '[CLEAR] No infostealer compromise detected',
        '',
        '═══ WAYBACK MACHINE ═══', '',
        `  Profiles Archived: ${results.waybackSummary?.totalArchived || 0}`,
        `  Total Snapshots: ${results.waybackSummary?.totalCaptures || 0}`,
        `  Oldest Capture: ${results.waybackSummary?.oldestCapture || 'N/A'}`,
        '',
        '═══ DISCOVERED ACCOUNTS ═══', '',
        ...(results.profiles || []).map(p => `[${(p.sources || []).join('+')}] [${p.category}] ${p.platform}: ${p.url}`),
        '', '═══ RISK FACTORS ═══', '',
        ...footprint.factors.map(f => `[${f.severity.toUpperCase()}] ${f.text} (+${f.points}pts)`),
        '', '═══ ENRICHMENT DATA ═══', '',
        ...(results.profiles || []).filter(p => p.enrichment).map(p => {
          const e = p.enrichment;
          return `${p.platform}: ${e.bio || 'N/A'} | Followers: ${e.followers || 'N/A'} | Location: ${e.location || 'N/A'}`;
        }),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${filename}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    toast?.success?.(`Exported as ${format.toUpperCase()}`);
  }, [results, footprint, username]);

  /* ═══════════════════════════════════════════════════════════════════
     TAB 1: OVERVIEW
     ═══════════════════════════════════════════════════════════════════ */
  const renderOverview = () => {
    if (!results) return null;
    const riskColors = RISK_COLORS[footprint.level] || RISK_COLORS.UNKNOWN;
    const catEntries = Object.entries(results.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`p-6 rounded-2xl bg-gradient-to-br ${riskColors.bg} border border-white/10 flex flex-col items-center justify-center`}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3 font-semibold">Digital Footprint Score</div>
            <RiskGauge score={footprint.score} level={footprint.level} size={150} />
            <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${riskColors.badge}`}>{footprint.level} EXPOSURE</div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:col-span-2">
            {[
              { label: 'Total Found', value: results.found || 0, icon: CheckCircle, color: 'text-emerald-400', borderColor: 'border-emerald-500/20', bgColor: 'bg-emerald-500/10' },
              { label: 'Engines Used', value: results.enginesUsed || 1, icon: Cpu, color: 'text-indigo-400', borderColor: 'border-indigo-500/20', bgColor: 'bg-indigo-500/10' },
              { label: 'Verified', value: results.verifiedFound || results.sherlockCount || 0, icon: Shield, color: 'text-blue-400', borderColor: 'border-blue-500/20', bgColor: 'bg-blue-500/10' },
              { label: 'Maigret Hits', value: results.maigretCount || 0, icon: Eye, color: 'text-purple-400', borderColor: 'border-purple-500/20', bgColor: 'bg-purple-500/10' },
              { label: 'Archived', value: results.waybackSummary?.totalArchived || 0, icon: History, color: 'text-amber-400', borderColor: 'border-amber-500/20', bgColor: 'bg-amber-500/10' },
              { label: 'Categories', value: catEntries.length, icon: Layers, color: 'text-cyan-400', borderColor: 'border-cyan-500/20', bgColor: 'bg-cyan-500/10' },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className={`p-4 rounded-xl bg-slate-900/70 border ${m.borderColor} hover:bg-slate-800/70 transition-colors`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${m.bgColor}`}><m.icon className={`w-3.5 h-3.5 ${m.color}`} /></div>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{m.label}</span>
                </div>
                <div className={`text-2xl font-black font-mono ${m.color}`}>{m.value}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Engine Contribution */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-indigo-400" /> Engine Contribution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(results.sourceBreakdown || {}).filter(([, v]) => v > 0).map(([src, count]) => {
              const sc = SOURCE_COLORS[src] || SOURCE_COLORS.sherlock;
              return (
                <div key={src} className={`p-4 rounded-xl ${sc.bg} border border-white/5 text-center`}>
                  <div className={`text-2xl font-black font-mono ${sc.text}`}>{count}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{sc.label}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-[10px] text-slate-600 text-center">
            {(results.profiles || []).filter(p => (p.sources?.length || 0) > 1).length} profiles confirmed by multiple engines
          </div>
        </div>

        {/* Category + Enriched */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><PieChart className="w-4 h-4 text-indigo-400" /> Category Distribution</h3>
            <div className="flex items-center gap-6">
              <CategoryDonut breakdown={results.categoryBreakdown} size={130} />
              <div className="flex-1 space-y-2">
                {catEntries.slice(0, 8).map(([cat, count], i) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                    <span className="text-xs text-slate-400 flex-1 truncate">{cat}</span>
                    <span className="text-xs font-bold text-white font-mono">{count}</span>
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / (results.found || 1)) * 100}%`, backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Enriched Accounts</h3>
            <div className="space-y-2">
              {(results.profiles || []).filter(p => p.enrichment).slice(0, 6).map((p, i) => {
                const e = p.enrichment;
                return (
                  <motion.a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 border border-white/5 hover:border-indigo-500/30 transition-all group">
                    {(p.avatar || e?.avatar) && <img src={p.avatar || e.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-800 object-cover" onError={ev => { ev.target.style.display = 'none'; }} />}
                    <span className="text-sm text-white font-medium flex-1 truncate">{p.platform}</span>
                    {e?.followers !== undefined && <span className="text-xs text-indigo-400 font-mono">{Number(e.followers).toLocaleString()}</span>}
                    {e?.repos && <span className="text-xs text-emerald-400 font-mono">{e.repos} repos</span>}
                    {e?.karma && <span className="text-xs text-amber-400 font-mono">{Number(e.karma).toLocaleString()}</span>}
                    <ConfidenceBadge sources={p.sources} />
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400" />
                  </motion.a>
                );
              })}
              {!(results.profiles || []).some(p => p.enrichment) && (
                <div className="text-center py-6 text-slate-600 text-sm">No enriched profiles</div>
              )}
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {footprint.factors.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Risk Factors ({footprint.factors.length})</h3>
            <div className="space-y-2">
              {footprint.factors.map((f, i) => {
                const sc = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.low;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${sc.bg} border ${sc.border}`}>
                    <div className={`w-2 h-2 rounded-full ${sc.dot}`} />
                    <span className={`text-sm flex-1 ${sc.text}`}>{f.text}</span>
                    <span className={`text-xs font-mono font-bold ${sc.text}`}>+{f.points}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hudson Rock Infostealer Alert */}
        {results.hudsonRock?.compromised && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-red-500/10 border-2 border-red-500/40 shadow-lg shadow-red-500/10">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 animate-pulse" /> INFOSTEALER COMPROMISE DETECTED
            </h3>
            <div className="flex items-center gap-4 mb-3">
              <div className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/30 text-center">
                <div className="text-2xl font-black text-red-400 font-mono">{results.hudsonRock.stealerCount}</div>
                <div className="text-[10px] text-red-400/60 uppercase tracking-wider">Stealer Log(s)</div>
              </div>
              <p className="text-sm text-red-300/80 flex-1">
                This username was found in infostealer malware logs collected by Hudson Rock's cybercrime intelligence.
                Credentials may be compromised.
              </p>
            </div>
            {results.hudsonRock.stealers?.length > 0 && (
              <div className="space-y-2">
                {results.hudsonRock.stealers.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-500/5 border border-red-500/15">
                    <Lock className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {s.date && <span className="text-red-300"><Calendar className="w-3 h-3 inline mr-1" />{s.date}</span>}
                      {s.computerName && <span className="text-slate-400">💻 {s.computerName}</span>}
                      {s.os && <span className="text-slate-400">🖥️ {s.os}</span>}
                      {s.malware && <span className="text-red-400/70">🦠 {s.malware}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Wayback Machine Summary */}
        {results.waybackSummary && results.waybackSummary.totalArchived > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" /> Historical Web Presence (Wayback Machine)
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-xl font-black text-amber-400 font-mono">{results.waybackSummary.totalArchived}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Profiles Archived</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-xl font-black text-amber-400 font-mono">{results.waybackSummary.totalCaptures?.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Snapshots</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-xl font-black text-amber-400 font-mono">{results.waybackSummary.oldestCapture || 'N/A'}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Oldest Capture</div>
              </div>
            </div>
            {/* Show per-profile wayback data */}
            <div className="space-y-1.5">
              {(results.profiles || []).filter(p => p.wayback?.totalCaptures > 0).slice(0, 10).map((p, i) => (
                <a key={i} href={p.wayback.archiveUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-white/5 hover:border-amber-500/30 transition-all">
                  <span className="text-sm">{p.icon || '🌐'}</span>
                  <span className="text-xs text-white font-medium flex-1">{p.platform}</span>
                  <span className="text-[10px] text-amber-400 font-mono">{p.wayback.totalCaptures} snapshots</span>
                  {p.wayback.firstCapture && <span className="text-[10px] text-slate-500 font-mono">since {p.wayback.firstCapture}</span>}
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     TAB 2: PROFILES (source badges + confidence + enrichment)
     ═══════════════════════════════════════════════════════════════════ */
  const renderProfiles = () => {
    if (!results) return null;
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/8">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter profiles..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50" />
          </div>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800/50 text-slate-500'}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800/50 text-slate-500'}`}><List className="w-4 h-4" /></button>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white appearance-none cursor-pointer">
            <option value="confidence">Sort: Confidence</option>
            <option value="platform">Sort: A-Z</option>
            <option value="category">Sort: Category</option>
          </select>
          <span className="text-xs text-slate-500 font-mono">{filteredProfiles.length} results</span>
        </div>

        {/* Source filter */}
        <div className="flex flex-wrap gap-1.5">
          {allSources.map(src => {
            const sc = SOURCE_COLORS[src];
            return (
              <button key={src} onClick={() => setFilterSource(src)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filterSource === src
                  ? `${sc?.bg || 'bg-indigo-500/25'} ${sc?.text || 'text-indigo-300'} border border-white/20`
                  : 'bg-slate-800/40 text-slate-500 border border-white/5 hover:text-slate-300'}`}>
                {src === 'all' ? `All Engines (${results.found})` : `${sc?.label || src} (${results.sourceBreakdown?.[src] || 0})`}
              </button>
            );
          })}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${filterCategory === cat
                ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-800/40 text-slate-500 border border-white/5 hover:text-slate-300'}`}>
              {cat === 'all' ? `All (${results.found})` : `${cat} (${results.categoryBreakdown?.[cat] || 0})`}
            </button>
          ))}
        </div>

        {/* Profile cards */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2'}>
          {filteredProfiles.map((p, i) => (
            <motion.div key={`${p.platform}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4) }}
              className={`group relative rounded-xl border transition-all cursor-pointer ${expandedProfile === i
                ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5'
                : 'bg-slate-900/50 border-white/6 hover:border-indigo-500/20 hover:bg-slate-800/50'
              } ${viewMode === 'list' ? 'flex items-center gap-4 p-3' : 'p-4'}`}
              onClick={() => setExpandedProfile(expandedProfile === i ? null : i)}>
              <div className={`flex items-center gap-3 ${viewMode === 'grid' ? 'mb-2' : ''}`}>
                <div className="relative flex-shrink-0">
                  {(p.avatar || p.enrichment?.avatar) ? (
                    <img src={p.avatar || p.enrichment.avatar} alt="" className="w-8 h-8 rounded-full bg-slate-800 object-cover"
                      onError={e => { e.target.onerror = null; e.target.src = getFavicon(p.url) || ''; e.target.className = 'w-8 h-8 rounded-lg bg-slate-800'; }} />
                  ) : p.url ? (
                    <img src={getFavicon(p.url)} alt="" className="w-8 h-8 rounded-lg bg-slate-800"
                      onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">{p.icon || '🌐'}</div>
                  )}
                  {(p.confidence || 1) > 1 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-white">{p.confidence}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate flex items-center gap-2">
                    {p.platform}
                    {(p.confidence || 1) > 1 && <ConfidenceBadge sources={p.sources} />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500 truncate">{p.category}</span>
                    {(p.sources || []).map(s => {
                      const sc = SOURCE_COLORS[s];
                      return sc ? <span key={s} className={`px-1 py-0 rounded text-[8px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span> : null;
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); toggleBookmark(p.url); }}
                    className={`p-1.5 rounded-lg transition-colors ${bookmarked.has(p.url) ? 'text-amber-400 bg-amber-500/20' : 'text-slate-600 hover:text-amber-400'}`}>
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); copy?.(p.url); toast?.success?.('Copied'); }}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-400"><Copy className="w-3.5 h-3.5" /></button>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400"><ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
              </div>
              <div className="text-[11px] text-indigo-400/60 font-mono truncate">{p.url}</div>

              <AnimatePresence>
                {expandedProfile === i && (
                  <motion.div key="det" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-white/5 space-y-2 overflow-hidden">
                    {p.enrichment?.name && <div className="flex items-center gap-2 text-xs"><User className="w-3.5 h-3.5 text-indigo-400" /><span className="text-slate-400">Name:</span><span className="text-white">{p.enrichment.name}</span></div>}
                    {p.enrichment?.bio && <div className="text-xs text-slate-400 italic">"{p.enrichment.bio}"</div>}
                    {p.enrichment?.location && <div className="flex items-center gap-2 text-xs"><MapPin className="w-3.5 h-3.5 text-emerald-400" /><span className="text-slate-400">Location:</span><span className="text-white">{p.enrichment.location}</span></div>}
                    {p.enrichment?.followers !== undefined && <div className="flex items-center gap-2 text-xs"><Users className="w-3.5 h-3.5 text-indigo-400" /><span className="text-slate-400">Followers:</span><span className="text-white font-mono">{Number(p.enrichment.followers).toLocaleString()}</span></div>}
                    {p.enrichment?.repos && <div className="flex items-center gap-2 text-xs"><Database className="w-3.5 h-3.5 text-emerald-400" /><span className="text-slate-400">Repos:</span><span className="text-white font-mono">{p.enrichment.repos}</span></div>}
                    {p.enrichment?.karma && <div className="flex items-center gap-2 text-xs"><TrendingUp className="w-3.5 h-3.5 text-amber-400" /><span className="text-slate-400">Karma:</span><span className="text-white font-mono">{Number(p.enrichment.karma).toLocaleString()}</span></div>}
                    {p.enrichment?.proofs && <div className="flex items-center gap-2 text-xs"><Award className="w-3.5 h-3.5 text-cyan-400" /><span className="text-slate-400">Keybase Proofs:</span><span className="text-white font-mono">{p.enrichment.proofs}</span></div>}
                    {p.enrichment?.created && <div className="flex items-center gap-2 text-xs"><Calendar className="w-3.5 h-3.5 text-purple-400" /><span className="text-slate-400">Created:</span><span className="text-white font-mono">{new Date(p.enrichment.created).toLocaleDateString()}</span></div>}
                    {p.tags && <div className="flex flex-wrap gap-1 mt-1">{(Array.isArray(p.tags) ? p.tags : [p.tags]).map((t, ti) => <span key={ti} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 border border-white/5">{t}</span>)}</div>}
                    {p.bio && <div className="text-xs text-slate-400 italic mt-1">"{p.bio}"</div>}
                    {p.followers !== undefined && !p.enrichment?.followers && <div className="flex items-center gap-2 text-xs"><Users className="w-3.5 h-3.5 text-indigo-400" /><span className="text-slate-400">Followers:</span><span className="text-white font-mono">{Number(p.followers).toLocaleString()}</span></div>}
                    {p.karma && !p.enrichment?.karma && <div className="flex items-center gap-2 text-xs"><TrendingUp className="w-3.5 h-3.5 text-amber-400" /><span className="text-slate-400">Karma:</span><span className="text-white font-mono">{Number(p.karma).toLocaleString()}</span></div>}
                    {p.repos && !p.enrichment?.repos && <div className="flex items-center gap-2 text-xs"><Database className="w-3.5 h-3.5 text-emerald-400" /><span className="text-slate-400">Repos:</span><span className="text-white font-mono">{p.repos}</span></div>}
                    {/* Per-profile Wayback Machine data */}
                    {p.wayback?.totalCaptures > 0 && (
                      <a href={p.wayback.archiveUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs mt-1 p-2 rounded-lg bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all">
                        <History className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400">{p.wayback.totalCaptures} Wayback snapshots</span>
                        {p.wayback.firstCapture && <span className="text-slate-500">· since {p.wayback.firstCapture}</span>}
                        {p.wayback.lastCapture && <span className="text-slate-500">· last {p.wayback.lastCapture}</span>}
                        <ExternalLink className="w-3 h-3 text-amber-500/50 ml-auto" />
                      </a>
                    )}
                    {/* Confidence indicator */}
                    {p.confidence && (
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <Shield className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-slate-400">Confidence:</span>
                        <span className={`font-bold ${p.confidence === 'high' ? 'text-emerald-400' : p.confidence === 'medium' ? 'text-amber-400' : 'text-slate-400'}`}>
                          {p.confidence.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        {filteredProfiles.length === 0 && (
          <div className="text-center py-12 text-slate-600"><Search className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No profiles match your filters</p></div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     TAB 3: ANALYSIS
     ═══════════════════════════════════════════════════════════════════ */
  const renderAnalysis = () => {
    if (!results) return null;
    const catEntries = Object.entries(results.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);
    const maxCount = Math.max(...catEntries.map(([, v]) => v), 1);
    const profiles = results.profiles || [];
    const multiConf = profiles.filter(p => (p.sources?.length || 0) > 1).length;

    const insights = [];
    if (profiles.some(p => p.category?.toLowerCase().includes('social')) && profiles.some(p => ['developer', 'Developer', 'Development'].includes(p.category)))
      insights.push({ text: 'Tech-savvy user with strong social media presence', icon: Cpu, color: 'text-indigo-400' });
    if (profiles.some(p => p.category?.toLowerCase().includes('gaming')))
      insights.push({ text: 'Active in gaming communities — check for linked accounts', icon: Activity, color: 'text-purple-400' });
    if (profiles.some(p => ['finance', 'shopping', 'commerce', 'Commerce', 'cryptocurrency'].includes(p.category?.toLowerCase())))
      insights.push({ text: 'Financial/commerce platforms — potential PII exposure', icon: AlertTriangle, color: 'text-amber-400' });
    if (profiles.some(p => p.category?.toLowerCase().includes('dating')))
      insights.push({ text: 'Dating platform presence — sensitive personal information', icon: AlertCircle, color: 'text-red-400' });
    if ((results.found || 0) > 20)
      insights.push({ text: 'Extremely broad digital footprint — high OPSEC risk', icon: Shield, color: 'text-red-400' });
    if (catEntries.length >= 5)
      insights.push({ text: `Accounts span ${catEntries.length} categories — diverse online activity`, icon: Network, color: 'text-cyan-400' });
    if (multiConf > 3)
      insights.push({ text: `${multiConf} accounts confirmed by multiple engines — high confidence`, icon: Award, color: 'text-emerald-400' });

    return (
      <div className="space-y-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-400" /> Platform Category Analysis</h3>
          <div className="space-y-3">
            {catEntries.map(([cat, count], i) => (
              <div key={cat} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }} />
                <span className="text-xs text-slate-400 w-28 truncate">{cat}</span>
                <div className="flex-1 h-6 bg-slate-800/60 rounded-lg overflow-hidden relative">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                    className="h-full rounded-lg" style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] + '40', borderLeft: `3px solid ${CAT_COLORS[i % CAT_COLORS.length]}` }} />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-white">{count}</span>
                </div>
                <span className="text-[11px] text-slate-600 font-mono w-10 text-right">{Math.round((count / (results.found || 1)) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
        {insights.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-purple-400" /> Behavioral Insights</h3>
            <div className="space-y-2">
              {insights.map((ins, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-white/5">
                  <ins.icon className={`w-4 h-4 flex-shrink-0 ${ins.color}`} /><span className="text-sm text-slate-300">{ins.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Hash className="w-4 h-4 text-cyan-400" /> Username Intelligence</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Matches', value: results.found || 0, color: 'text-indigo-400' },
              { label: 'Multi-Confirmed', value: multiConf, color: 'text-emerald-400' },
              { label: 'Username Length', value: (username || '').length, color: 'text-cyan-400' },
              { label: 'Has Numbers', value: /\d/.test(username) ? 'Yes' : 'No', color: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-800/40 border border-white/5 text-center">
                <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        {bookmarked.size > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-amber-500/20">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Bookmark className="w-4 h-4 text-amber-400" /> Bookmarked ({bookmarked.size})</h3>
            <div className="space-y-1.5">
              {(results.profiles || []).filter(p => bookmarked.has(p.url)).map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/40 border border-white/5">
                  <span className="text-sm">{p.icon || '🌐'}</span><span className="text-sm text-white flex-1 truncate">{p.platform}</span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline truncate max-w-[200px]">{p.url}</a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     TAB 4: CROSS-INTEL (Avatars, Enrichment, Correlation)
     ═══════════════════════════════════════════════════════════════════ */
  const renderCrossIntel = () => {
    if (!results) return null;
    const enrichedProfiles = (results.profiles || []).filter(p => p.enrichment && Object.keys(p.enrichment).length > 0);
    const avatarProfiles = (results.profiles || []).filter(p => p.avatar || p.enrichment?.avatar);
    const multiConfirmed = (results.profiles || []).filter(p => (p.sources?.length || 0) > 1);

    return (
      <div className="space-y-5">
        {/* Avatar Gallery */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Camera className="w-4 h-4 text-purple-400" /> Avatar Gallery ({avatarProfiles.length})</h3>
          {avatarProfiles.length > 0 ? (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {avatarProfiles.map((p, i) => (
                  <motion.a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                    className="group relative flex flex-col items-center gap-1.5 p-2 rounded-xl bg-slate-800/40 border border-white/5 hover:border-indigo-500/30 transition-all">
                    <img src={p.avatar || p.enrichment?.avatar} alt="" className="w-12 h-12 rounded-full bg-slate-700 object-cover ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all"
                      onError={e => { e.target.onerror = null; e.target.src = getFavicon(p.url) || ''; e.target.className = 'w-12 h-12 rounded-lg bg-slate-700'; }} />
                    <span className="text-[9px] text-slate-400 truncate w-full text-center">{p.platform}</span>
                    {(p.confidence || 1) > 1 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <span className="text-[7px] font-bold text-white">{p.confidence}×</span>
                      </div>
                    )}
                  </motion.a>
                ))}
              </div>
              {avatarProfiles.length >= 2 && (
                <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Avatar images found across {avatarProfiles.length} platforms — visual correlation analysis recommended</span>
                  </div>
                </div>
              )}
            </>
          ) : <div className="text-center py-6 text-slate-600 text-sm">No avatar images found</div>}
        </div>

        {/* Multi-Engine Confirmed */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-emerald-400" /> Multi-Engine Confirmed ({multiConfirmed.length})</h3>
          {multiConfirmed.length > 0 ? (
            <div className="space-y-2">
              {multiConfirmed.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  {(p.avatar || p.enrichment?.avatar) && <img src={p.avatar || p.enrichment?.avatar} alt="" className="w-7 h-7 rounded-full bg-slate-800 object-cover" onError={e => { e.target.style.display = 'none'; }} />}
                  <span className="text-sm text-white font-medium flex-1">{p.platform}</span>
                  <div className="flex gap-1">
                    {(p.sources || []).map(s => { const sc = SOURCE_COLORS[s]; return sc ? <span key={s} className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${sc.bg} ${sc.text}`}>{sc.label}</span> : null; })}
                  </div>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300"><ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-6 text-slate-600 text-sm">No multi-engine confirmations</div>}
        </div>

        {/* Enrichment Deep Dive */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400" /> Profile Enrichment ({enrichedProfiles.length})</h3>
          {enrichedProfiles.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {enrichedProfiles.map((p, i) => {
                const e = p.enrichment;
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:border-indigo-500/20 transition-all space-y-2">
                    <div className="flex items-center gap-3">
                      {(p.avatar || e?.avatar) && <img src={p.avatar || e.avatar} alt="" className="w-10 h-10 rounded-full bg-slate-700 object-cover" onError={ev => { ev.target.style.display = 'none'; }} />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white">{p.platform}</div>
                        {e?.name && <div className="text-xs text-indigo-400">{e.name}</div>}
                      </div>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400"><ExternalLink className="w-4 h-4" /></a>
                    </div>
                    {e?.bio && <p className="text-xs text-slate-400 italic line-clamp-2">"{e.bio}"</p>}
                    <div className="flex flex-wrap gap-2">
                      {e?.followers !== undefined && <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/15 text-indigo-300 font-mono">{Number(e.followers).toLocaleString()} followers</span>}
                      {e?.repos && <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 font-mono">{e.repos} repos</span>}
                      {e?.karma && <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-300 font-mono">{Number(e.karma).toLocaleString()} karma</span>}
                      {e?.location && <span className="px-2 py-0.5 rounded-full text-[10px] bg-cyan-500/15 text-cyan-300">📍 {e.location}</span>}
                      {e?.proofs && <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/15 text-purple-300">{e.proofs} proofs</span>}
                      {e?.company && <span className="px-2 py-0.5 rounded-full text-[10px] bg-pink-500/15 text-pink-300">🏢 {e.company}</span>}
                    </div>
                    {e?.created && <div className="text-[10px] text-slate-600">Account created: {new Date(e.created).toLocaleDateString()}</div>}
                  </motion.div>
                );
              })}
            </div>
          ) : <div className="text-center py-6 text-slate-600 text-sm">No enrichment data — GitHub, Reddit, Keybase, Gravatar, DEV.to are queried automatically</div>}
        </div>

        {/* Wayback + Domain + Hudson Rock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><History className="w-4 h-4 text-amber-400" /> Wayback Machine Archives</h3>
            {/* Show per-profile wayback from backend */}
            {(results.profiles || []).some(p => p.wayback?.totalCaptures > 0) ? (
              <div className="space-y-2">
                {results.waybackSummary && (
                  <div className="flex gap-3 mb-3">
                    <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center flex-1">
                      <div className="text-lg font-bold text-amber-400 font-mono">{results.waybackSummary.totalArchived}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Archived</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center flex-1">
                      <div className="text-lg font-bold text-amber-400 font-mono">{results.waybackSummary.totalCaptures?.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Snapshots</div>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center flex-1">
                      <div className="text-sm font-bold text-amber-400 font-mono">{results.waybackSummary.oldestCapture || '—'}</div>
                      <div className="text-[9px] text-slate-500 uppercase">Oldest</div>
                    </div>
                  </div>
                )}
                {(results.profiles || []).filter(p => p.wayback?.totalCaptures > 0).map((p, i) => (
                  <a key={i} href={p.wayback.archiveUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all">
                    <span className="text-sm">{p.icon || '🌐'}</span>
                    <span className="text-xs text-white font-medium flex-1 truncate">{p.platform}</span>
                    <span className="text-[10px] text-amber-300 font-mono">{p.wayback.totalCaptures} captures</span>
                    {p.wayback.firstCapture && <span className="text-[10px] text-slate-600 font-mono">{p.wayback.firstCapture}</span>}
                    <ExternalLink className="w-3 h-3 text-amber-500/50" />
                  </a>
                ))}
              </div>
            ) : (results.waybackResults || []).filter(w => w.found).length > 0 ? (
              <div className="space-y-2">
                {results.waybackResults.filter(w => w.found).map((w, i) => (
                  <a key={i} href={w.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-all">
                    <History className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-amber-300 truncate flex-1">{w.url}</span>
                    <span className="text-[10px] text-slate-600 font-mono">{w.timestamp}</span>
                  </a>
                ))}
              </div>
            ) : <div className="text-center py-4 text-slate-600 text-xs">No Wayback snapshots found</div>}
          </div>
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Globe className="w-4 h-4 text-cyan-400" /> Domain Check</h3>
            {results.domainCheck ? (
              <div className={`p-4 rounded-xl border ${results.domainCheck.exists ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-800/40 border-white/5'}`}>
                <div className="flex items-center gap-3">
                  {results.domainCheck.exists ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-slate-500" />}
                  <div>
                    <div className="text-sm text-white font-mono">{results.domainCheck.domain}</div>
                    <div className={`text-xs ${results.domainCheck.exists ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {results.domainCheck.exists ? 'Domain exists — may belong to target' : 'Domain not registered'}
                    </div>
                  </div>
                </div>
              </div>
            ) : <div className="text-center py-4 text-slate-600 text-xs">Domain check not performed</div>}
          </div>
        </div>

        {/* Hudson Rock Infostealer Intelligence */}
        {results.hudsonRock && (
          <div className={`p-5 rounded-2xl border ${results.hudsonRock.compromised ? 'bg-red-500/5 border-red-500/25' : 'bg-slate-900/60 border-white/8'}`}>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${results.hudsonRock.compromised ? 'text-red-400' : 'text-white'}`}>
              <Lock className="w-4 h-4" /> Hudson Rock Cybercrime Intelligence
            </h3>
            {results.hudsonRock.compromised ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-bold">Username found in {results.hudsonRock.stealerCount} infostealer log(s)</span>
                  </div>
                  <p className="text-[11px] text-red-300/60">
                    This username was discovered in credentials harvested by infostealer malware. This indicates the account owner's device was compromised.
                  </p>
                </div>
                {results.hudsonRock.stealers?.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-red-500/10">
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-mono">{i + 1}</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs flex-1">
                      {s.date && <span className="text-red-300">📅 {s.date}</span>}
                      {s.computerName && <span className="text-slate-400">💻 {s.computerName}</span>}
                      {s.os && <span className="text-slate-400">🖥️ {s.os}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-sm text-emerald-400 font-medium">No Infostealer Compromise</div>
                  <div className="text-[11px] text-slate-500">Username not found in Hudson Rock's cybercrime database</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     TAB 5: TIMELINE
     ═══════════════════════════════════════════════════════════════════ */
  const renderTimeline = () => {
    if (!results) return null;
    const catEntries = Object.entries(results.categoryBreakdown || {}).sort((a, b) => b[1] - a[1]);
    const entries = [
      { time: '00:00.0', event: 'Multi-engine investigation initiated', type: 'system', icon: Crosshair },
      { time: '00:00.1', event: `Target: "${results.username}"`, type: 'system', icon: Target },
      { time: '00:01.0', event: `Sherlock engine: ${results.sherlockCount || 0} accounts found`, type: results.sherlockCount > 0 ? 'found' : 'system', icon: Search },
      { time: '00:03.0', event: `Maigret deep scan: ${results.maigretCount || 0} accounts found`, type: results.maigretCount > 0 ? 'found' : 'system', icon: Eye },
      { time: '00:05.0', event: `Free API enrichment: ${results.enrichmentCount || 0} profiles enriched`, type: results.enrichmentCount > 0 ? 'found' : 'system', icon: Sparkles },
      ...catEntries.map(([cat, count], i) => ({
        time: `00:${String(Math.floor(6 + i)).padStart(2, '0')}.0`,
        event: `${cat}: ${count} account(s)`, type: count > 3 ? 'alert' : 'found', icon: count > 3 ? AlertTriangle : CheckCircle,
      })),
      { time: `00:${String(Math.min(6 + catEntries.length + 1, 59)).padStart(2, '0')}.0`, event: `Cross-correlation: ${(results.profiles || []).filter(p => (p.sources?.length || 0) > 1).length} multi-confirmed`, type: 'result', icon: Award },
      { time: `00:${String(Math.min(6 + catEntries.length + 2, 59)).padStart(2, '0')}.0`, event: `Footprint: ${footprint.score}/100 (${footprint.level})`, type: footprint.score > 60 ? 'alert' : 'result', icon: Shield },
      { time: results.searchDuration || '01:00.0', event: 'Investigation complete', type: 'system', icon: CheckCircle },
    ];
    const typeColors = { system: 'border-slate-500/30 text-slate-400', scan: 'border-indigo-500/30 text-indigo-400', found: 'border-emerald-500/30 text-emerald-400', alert: 'border-amber-500/30 text-amber-400', result: 'border-cyan-500/30 text-cyan-400' };

    return (
      <div className="space-y-1">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/8 mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> Investigation Timeline</h3>
          <p className="text-[11px] text-slate-500 mt-1">Multi-engine discovery log — {results.enginesUsed} engine(s)</p>
        </div>
        <div className="relative ml-6">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500/40 via-cyan-500/20 to-transparent" />
          {entries.map((entry, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className={`relative pl-8 pb-4 ${i === entries.length - 1 ? 'pb-0' : ''}`}>
              <div className={`absolute left-0 top-2 w-2.5 h-2.5 rounded-full -translate-x-1 border-2 ${
                entry.type === 'alert' ? 'bg-amber-500 border-amber-400' : entry.type === 'found' ? 'bg-emerald-500 border-emerald-400' :
                  entry.type === 'result' ? 'bg-cyan-500 border-cyan-400' : 'bg-slate-500 border-slate-400'}`} />
              <div className={`flex items-start gap-3 p-3 rounded-xl border bg-slate-900/40 ${typeColors[entry.type]}`}>
                <entry.icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0"><div className="text-sm text-white">{entry.event}</div></div>
                <span className="text-[10px] font-mono text-slate-600 flex-shrink-0">{entry.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════════════
     TAB 6: RISK INTEL
     ═══════════════════════════════════════════════════════════════════ */
  const renderRiskIntel = () => {
    if (!results) return null;
    const profiles = results.profiles || [];
    const riskColors = RISK_COLORS[footprint.level] || RISK_COLORS.UNKNOWN;

    const sensitivePatterns = {
      'Dating & Adult': ['dating', 'adult', 'nsfw'], 'Financial': ['finance', 'crypto', 'shopping', 'commerce', 'payment'],
      'Dark Web / Hacking': ['darknet', 'hack', 'underground', 'tor'], 'Gambling': ['gambling', 'betting', 'casino'],
    };
    const sensitiveFindings = {};
    Object.entries(sensitivePatterns).forEach(([cat, pats]) => {
      const found = profiles.filter(p => pats.some(pat => (p.category || '').toLowerCase().includes(pat) || (p.platform || '').toLowerCase().includes(pat)));
      if (found.length) sensitiveFindings[cat] = found;
    });

    const opsecIssues = [];
    if (results.hudsonRock?.compromised) opsecIssues.push(`⚠️ CRITICAL: Username found in ${results.hudsonRock.stealerCount} infostealer log(s) — credentials likely compromised`);
    if ((results.found || 0) > 15) opsecIssues.push('Username reuse across 15+ platforms indicates poor OPSEC');
    if (Object.keys(results.categoryBreakdown || {}).length > 5) opsecIssues.push('Activity diversity suggests a primary personal account');
    if (profiles.some(p => p.platform?.toLowerCase().includes('github'))) opsecIssues.push('GitHub presence may expose real name, email, location via commits');
    if (profiles.some(p => p.platform?.toLowerCase().includes('linkedin'))) opsecIssues.push('LinkedIn may reveal employer, education, and professional network');
    if (profiles.some(p => ['reddit'].includes(p.platform?.toLowerCase()))) opsecIssues.push('Reddit post history may contain personally identifying information');
    if (results.domainCheck?.exists) opsecIssues.push(`Domain ${results.domainCheck.domain} exists — WHOIS may reveal registrant data`);
    const waybackedCount = (results.profiles || []).filter(p => p.wayback?.totalCaptures > 0).length;
    if (waybackedCount > 0) opsecIssues.push(`${waybackedCount} profile(s) archived in Wayback Machine — historical data may reveal deleted content`);
    const enrichedLoc = profiles.filter(p => p.enrichment?.location || p.location);
    if (enrichedLoc.length > 0) opsecIssues.push(`Location found in ${enrichedLoc.length} profile(s): ${enrichedLoc.map(p => p.enrichment.location).join(', ')}`);

    return (
      <div className="space-y-5">
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${riskColors.bg} border border-white/10`}>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <RiskGauge score={footprint.score} level={footprint.level} size={130} />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-1">Threat Assessment</h3>
              <p className="text-sm text-slate-400 mb-3">
                Target "{results.username}" has <span className={`font-bold ${riskColors.text}`}>{footprint.level}</span> exposure across {results.found} accounts from {results.enginesUsed} engine(s).
              </p>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${riskColors.badge}`}>FOOTPRINT: {footprint.score}/100</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-indigo-500/20 border-indigo-500/40 text-indigo-300">{results.found} ACCOUNTS</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-purple-500/20 border-purple-500/40 text-purple-300">{results.enginesUsed} ENGINES</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> Risk Factor Breakdown</h3>
          {footprint.factors.length > 0 ? (
            <div className="space-y-2">
              {footprint.factors.map((f, i) => {
                const sc = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.low;
                return (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${sc.bg} border ${sc.border}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${sc.dot} flex-shrink-0`} />
                    <span className={`text-sm flex-1 ${sc.text}`}>{f.text}</span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>+{f.points}pts</span>
                  </div>
                );
              })}
            </div>
          ) : <div className="text-center py-6 text-slate-600 text-sm">No significant risk factors</div>}
        </div>

        {Object.keys(sensitiveFindings).length > 0 && (
          <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20">
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2"><Lock className="w-4 h-4" /> Sensitive Platform Detections</h3>
            <div className="space-y-3">
              {Object.entries(sensitiveFindings).map(([cat, platforms]) => (
                <div key={cat} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">{cat}</div>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p, i) => (
                      <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 hover:border-red-500/40">
                        <span className="text-xs text-red-300">{p.platform}</span><ExternalLink className="w-3 h-3 text-red-500/60" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {opsecIssues.length > 0 && (
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Fingerprint className="w-4 h-4 text-purple-400" /> OPSEC Assessment</h3>
            <div className="space-y-2">
              {opsecIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
                  <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" /><span className="text-sm text-purple-300/80">{issue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-cyan-400" /> Recommended Investigation Steps</h3>
          <div className="space-y-2">
            {[
              'Cross-reference with breach databases (HIBP, XposedOrNot) using Email Intel tool',
              'Check GitHub commits for real email addresses and PGP keys',
              'Review Reddit/forum post history for location leaks & personal details',
              'Compare avatar images using reverse image search (Google, TinEye, Yandex)',
              'Check Keybase proofs for linked cryptographic identities',
              'Investigate domain WHOIS if domain check was positive',
              'Map social network connections via followers/following lists',
              'Run email permutations through Holehe for additional discovery',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-800/40 border border-white/5">
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{i + 1}</span>
                <span className="text-xs text-slate-400">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ── Enriched Panel (WhatsMyName, DetectDee, Bio Analysis, Screenshot) ── */
  const renderEnriched = useCallback(() => {
    const handleAnalyzeBio = async () => {
      if (!bioText.trim()) { toast?.error?.('Enter bio text to analyze'); return; }
      setIsEnriching(true);
      try {
        const resp = await fetch(`${API_BASE}/tools/username/enriched`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, action: 'analyze_bio', bio: bioText }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setUsernameEnriched(prev => ({ ...(prev || {}), bioAnalysis: data.bioAnalysis }));
        }
      } catch (e) {
        toast?.error?.('Bio analysis failed');
      } finally {
        setIsEnriching(false);
      }
    };
    const handleGetScreenshot = async () => {
      if (!username.trim()) { toast?.error?.('Enter username for screenshot'); return; }
      setIsEnriching(true);
      try {
        const resp = await fetch(`${API_BASE}/tools/username/enriched`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username, action: 'screenshot', site: screenshotSite }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setUsernameEnriched(prev => ({ ...(prev || {}), screenshot: data.screenshot }));
        }
      } catch (e) {
        toast?.error?.('Screenshot fetch failed');
      } finally {
        setIsEnriching(false);
      }
    };
    return (
      <div className="space-y-6">
        {/* WhatsMyName Section */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            WhatsMyName — Cross-Platform Scan
            {isEnriching && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
          </h3>
          {usernameEnriched?.whatsMyName ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400">Checked: <strong className="text-white">{usernameEnriched.whatsMyName.totalChecked}</strong> platforms</span>
                <span className="text-slate-400">Found: <strong className="text-emerald-400">{usernameEnriched.whatsMyName.found}</strong> accounts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                {(usernameEnriched.whatsMyName.sites || []).filter(s => s.found).slice(0, 60).map((site, i) => (
                  <a key={i} href={site.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-white/5 hover:border-cyan-500/30 transition-all group">
                    <span className="text-xs text-white truncate group-hover:text-cyan-300">{site.name}</span>
                    <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
              <span className="text-[10px] text-slate-600">Source: whatsmyname.app</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">WhatsMyName data loads automatically after search. Check the "Enriched" tab.</p>
          )}
        </div>

        {/* DetectDee Section */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Radar className="w-4 h-4 text-purple-400" />
            DetectDee — Alternative Scanner
          </h3>
          {usernameEnriched?.detectDee ? (
            <div className="space-y-2">
              {usernameEnriched.detectDee.error ? (
                <p className="text-xs text-amber-400">{usernameEnriched.detectDee.error}</p>
              ) : (
                <pre className="text-xs text-slate-400 max-h-60 overflow-y-auto p-3 rounded-lg bg-slate-800/40">
                  {JSON.stringify(usernameEnriched.detectDee, null, 2)}
                </pre>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">DetectDee scans load automatically after search.</p>
          )}
        </div>

        {/* Bio Analysis */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            Bio Text Analysis — NLP
          </h3>
          <div className="flex gap-2 mb-3">
            <textarea
              value={bioText}
              onChange={e => setBioText(e.target.value)}
              placeholder="Paste bio text from social media profile..."
              className="flex-1 bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 resize-none h-20 focus:outline-none focus:border-amber-500/30"
            />
          </div>
          <button onClick={handleAnalyzeBio} disabled={isEnriching}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50">
            {isEnriching ? 'Analyzing...' : 'Analyze Bio'}
          </button>
          {usernameEnriched?.bioAnalysis && !usernameEnriched.bioAnalysis.error && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">Sentiment</div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-bold ${usernameEnriched.bioAnalysis.sentiment?.label === 'positive' ? 'text-emerald-400' : usernameEnriched.bioAnalysis.sentiment?.label === 'negative' ? 'text-red-400' : 'text-slate-300'}`}>
                    {usernameEnriched.bioAnalysis.sentiment?.label}
                  </span>
                  <span className="text-[10px] text-slate-600">P: {usernameEnriched.bioAnalysis.sentiment?.polarity} S: {usernameEnriched.bioAnalysis.sentiment?.subjectivity}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                <div className="text-[10px] text-slate-500 mb-1">Word Count</div>
                <div className="text-sm font-bold text-white">{usernameEnriched.bioAnalysis.wordCount}</div>
              </div>
              {usernameEnriched.bioAnalysis.possibleLocations?.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">Possible Locations</div>
                  <div className="flex flex-wrap gap-1">
                    {usernameEnriched.bioAnalysis.possibleLocations.map((loc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px]">{loc}</span>
                    ))}
                  </div>
                </div>
              )}
              {usernameEnriched.bioAnalysis.possibleInterests?.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">Possible Interests</div>
                  <div className="flex flex-wrap gap-1">
                    {usernameEnriched.bioAnalysis.possibleInterests.map((int, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px]">{int}</span>
                    ))}
                  </div>
                </div>
              )}
              {usernameEnriched.bioAnalysis.entities?.emails?.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">Emails Found</div>
                  {usernameEnriched.bioAnalysis.entities.emails.map((e, i) => (
                    <div key={i} className="text-xs text-cyan-300 font-mono">{e}</div>
                  ))}
                </div>
              )}
              {usernameEnriched.bioAnalysis.entities?.phones?.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">Phones Found</div>
                  {usernameEnriched.bioAnalysis.entities.phones.map((p, i) => (
                    <div key={i} className="text-xs text-amber-300 font-mono">{p}</div>
                  ))}
                </div>
              )}
              {usernameEnriched.bioAnalysis.entities?.urls?.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-800/40 border border-white/5">
                  <div className="text-[10px] text-slate-500 mb-1">URLs Found</div>
                  {usernameEnriched.bioAnalysis.entities.urls.map((u, i) => (
                    <a key={i} href={u} target="_blank" className="text-xs text-blue-300 underline block truncate">{u}</a>
                  ))}
                </div>
              )}
            </div>
          )}
          {usernameEnriched?.bioAnalysis?.error && (
            <p className="mt-2 text-xs text-red-400">{usernameEnriched.bioAnalysis.error}</p>
          )}
        </div>

        {/* Profile Screenshot */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/8">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" />
            Profile Screenshot Preview
          </h3>
          <div className="flex gap-2 mb-3">
            <select value={screenshotSite} onChange={e => setScreenshotSite(e.target.value)}
              className="bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30">
              <option value="instagram">Instagram</option>
              <option value="twitter">Twitter / X</option>
              <option value="github">GitHub</option>
              <option value="facebook">Facebook</option>
              <option value="reddit">Reddit</option>
              <option value="tiktok">TikTok</option>
              <option value="linkedin">LinkedIn</option>
            </select>
            <button onClick={handleGetScreenshot} disabled={isEnriching}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-50">
              {isEnriching ? 'Loading...' : 'Get Screenshot'}
            </button>
          </div>
          {usernameEnriched?.screenshot?.available && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img src={usernameEnriched.screenshot.screenshotUrl} alt="Profile screenshot"
                className="w-full max-w-sm mx-auto"
                onError={(e) => { e.target.style.display = 'none'; }} />
              <div className="p-2 text-[10px] text-slate-500 text-center">
                Source: screenshotlayer.com · {usernameEnriched.screenshot.targetUrl}
              </div>
            </div>
          )}
          {usernameEnriched?.screenshot?.available === false && (
            <p className="text-xs text-amber-400">Screenshot requires a screenshotlayer API key (set SCREENSHOTLAYER_KEY in env).</p>
          )}
        </div>
      </div>
    );
  }, [usernameEnriched, bioText, screenshotSite, username, isEnriching]);

  /* ── Panel Router (plain function calls to avoid re-mount) ── */
  const renderPanel = useCallback(() => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'profiles': return renderProfiles();
      case 'analysis': return renderAnalysis();
      case 'crossintel': return renderCrossIntel();
      case 'timeline': return renderTimeline();
      case 'risk': return renderRiskIntel();
      case 'enriched': return renderEnriched();
      default: return renderOverview();
    }
  }, [activeTab, results, footprint, filteredProfiles, filterCategory, filterSource, categories, allSources,
    searchQuery, viewMode, sortBy, bookmarked, expandedProfile, username, usernameEnriched, bioText, screenshotSite, isEnriching]);

  /* ═══════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════ */
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }} onClick={e => e.stopPropagation()}
        className={`relative overflow-hidden rounded-2xl bg-[#060a13] border border-indigo-500/25 shadow-[0_0_80px_rgba(99,102,241,0.12)] ${fullscreen ? 'w-screen h-screen max-w-none max-h-none rounded-none' : 'w-full max-w-7xl max-h-[95vh]'}`}>
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* HEADER */}
        <div className="relative z-10 px-4 sm:px-6 py-3 border-b border-indigo-500/20 bg-[#060a13]/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Crosshair className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
                  Sherlock <span className="text-indigo-400">Pro</span>
                  <span className="hidden sm:inline px-2 py-0.5 text-[10px] bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 font-medium">MULTI-ENGINE OSINT</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate">Sherlock + Maigret + Free API Enrichment · {results ? results.found + ' found' : '2000+ platforms'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {results && (
                <div className="relative group">
                  <button className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 transition-all"><Download className="w-4 h-4 text-emerald-400" /></button>
                  <div className="absolute right-0 top-full mt-1 w-36 py-1 rounded-xl bg-slate-900 border border-white/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    {['json', 'csv', 'txt'].map(fmt => (
                      <button key={fmt} onClick={() => handleExport(fmt)}
                        className="w-full px-3 py-2 text-left text-xs text-slate-300 hover:bg-indigo-500/20 hover:text-white flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5" /> Export .{fmt.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={() => setFullscreen(v => !v)} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 transition-all">
                {fullscreen ? <Minimize2 className="w-4 h-4 text-indigo-400" /> : <Maximize2 className="w-4 h-4 text-indigo-400" />}
              </button>
              <button onClick={() => { setUsername(''); setResults(null); setBatchResults([]); inputRef.current?.focus(); }}
                className="p-2 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 transition-all" title="New search"><RefreshCw className="w-4 h-4 text-indigo-400" /></button>
              <div className="hidden sm:flex px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /><span className="text-sm font-bold text-amber-300 font-mono">18</span>
              </div>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} onClick={onClose}
                className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"><X className="w-4 h-4 text-gray-400" /></motion.button>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative z-10 px-4 sm:px-6 py-4 border-b border-white/5 bg-[#060a13]/60 backdrop-blur-sm">
          {!batchMode ? (
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Crosshair className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500/60" />
                <input ref={inputRef} type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Enter target username..." onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/80 border-2 border-indigo-500/20 text-white text-base font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSearch} disabled={isSearching || !username.trim()}
                className="px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center gap-2 disabled:opacity-40 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-shadow">
                {isSearching ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><Radar className="w-5 h-5" /></motion.div> : <Search className="w-5 h-5" />}
                <span className="hidden sm:inline">{isSearching ? 'Scanning...' : 'Investigate'}</span>
              </motion.button>
              <button onClick={() => setBatchMode(true)} title="Batch mode"
                className="px-3 rounded-xl bg-slate-800/80 border border-white/10 text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all"><Layers className="w-5 h-5" /></button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-400 font-medium flex items-center gap-2"><Layers className="w-4 h-4" /> Batch Mode — one username per line (max 5)</span>
                <button onClick={() => setBatchMode(false)} className="text-xs text-slate-500 hover:text-white">Switch to single</button>
              </div>
              <textarea value={batchUsernames} onChange={e => setBatchUsernames(e.target.value)} rows={3} placeholder={"johndoe\njane_doe\nhacker123"}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border-2 border-indigo-500/20 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleBatchSearch} disabled={isSearching || !batchUsernames.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40">
                <Search className="w-5 h-5" /> Batch Investigate
              </motion.button>
            </div>
          )}
        </div>

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col overflow-hidden" style={{ height: fullscreen ? 'calc(100vh - 160px)' : 'calc(95vh - 180px)' }}>
          <AnimatePresence>
            {isSearching && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 border-b border-white/5">
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="flex items-center gap-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}><Radar className="w-8 h-8 text-indigo-400" /></motion.div>
                    <div className="flex-1">
                      <motion.p key={searchPhase} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-indigo-300 mb-2">{searchPhase}</motion.p>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500" animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                    <span className="text-sm font-mono text-indigo-400 font-bold">{Math.round(scanProgress)}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {scanSources.map((src, i) => (
                      <div key={i} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${src.status === 'done' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 animate-pulse'}`}>
                        {src.status === 'done' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span className="mr-1">{src.icon}</span>{src.name}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {results ? (
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar tabs (desktop) */}
              <div className="w-48 flex-shrink-0 border-r border-white/5 bg-[#060a13]/80 p-2 space-y-1 overflow-y-auto hidden lg:block">
                {TABS.map((tab, i) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${activeTab === tab.id
                      ? 'bg-indigo-500/15 border border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}>
                    <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? 'text-indigo-400' : ''}`} />
                    <div className="min-w-0"><div className="text-xs font-semibold truncate">{tab.label}</div><div className="text-[10px] text-slate-600 truncate">{tab.desc}</div></div>
                  </button>
                ))}
                <div className="pt-4 px-2 space-y-1">
                  <div className="text-[9px] text-slate-700 uppercase tracking-widest mb-2">Shortcuts</div>
                  {TABS.map((tab, i) => (
                    <div key={tab.id} className="flex items-center gap-2">
                      <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500 font-mono">Alt+{i + 1}</kbd>
                      <span className="text-[10px] text-slate-600">{tab.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Mobile tabs */}
              <div className="lg:hidden flex overflow-x-auto border-b border-white/5 px-2 py-1.5 gap-1 flex-shrink-0">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-500 hover:text-white'}`}>
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </div>
              {/* Panel */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    {renderPanel()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          ) : !isSearching ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center">
                  <Crosshair className="w-12 h-12 text-indigo-500/50" />
                </div>
                <motion.div className="absolute inset-0 rounded-2xl border border-indigo-500/20"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
              </motion.div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-Engine Username Investigation</h3>
              <p className="text-slate-500 text-center max-w-lg text-sm mb-6">
                Combines Sherlock (50+ platforms), Maigret, and free API enrichment (GitHub, Reddit, Keybase, Gravatar, DEV.to) with Wayback Machine archival analysis, Hudson Rock cybercrime intelligence, and historical presence detection. All free, no API keys required.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Sherlock Engine (50+)', 'Maigret Deep Scan', 'GitHub/Reddit Stats', 'Keybase Proofs', 'Wayback Machine Archives', 'Hudson Rock Infostealer', 'Avatar Gallery', 'Domain Check', 'Digital Footprint Score', 'OPSEC Assessment'].map(tag => (
                  <span key={tag} className="px-2.5 py-1 rounded-full text-[10px] bg-indigo-500/10 text-indigo-400/70 border border-indigo-500/15">{tag}</span>
                ))}
              </div>
            </div>
          ) : null}

          {batchResults.length > 0 && (
            <div className="p-4 border-t border-white/5 bg-slate-900/40 max-h-60 overflow-y-auto">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3">Batch Results</h4>
              <div className="space-y-2">
                {batchResults.map((br, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 border border-white/5 cursor-pointer hover:border-indigo-500/30"
                    onClick={() => { setResults(br); setUsername(br.username); setActiveTab('overview'); setBatchMode(false); }}>
                    <span className="text-sm font-mono text-white font-bold">{br.username}</span>
                    <span className="text-xs text-emerald-400">{br.found} found</span>
                    <span className="text-xs text-purple-400">{br.enginesUsed} engines</span>
                    <span className="text-xs text-slate-600 ml-auto">{br.searchDuration}</span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="relative z-10 px-4 py-2 border-t border-white/5 bg-[#060a13]/80 flex items-center justify-between text-[10px] text-slate-600 font-mono">
          <span>SHERLOCK PRO v3.0 · MULTI-ENGINE · OSINT-X</span>
          <div className="flex items-center gap-4"><span>Alt+1-6: Tabs</span><span>Esc: Close</span></div>
          <span>{new Date().toISOString().slice(0, 19)}Z</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SherlockTool;
