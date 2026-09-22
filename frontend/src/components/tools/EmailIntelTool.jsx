import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, X, Shield, AlertTriangle, CheckCircle, ExternalLink, Copy,
  Download, RefreshCw, Search, Eye, Lock, ChevronRight, Activity,
  Clock, FileText, Layers, Crosshair, Fingerprint, Globe, User,
  Database, Server, AlertCircle, ChevronDown, ChevronUp, MapPin,
  Camera, Calendar, Hash, Radio, Zap, Info, BarChart3, Users,
  Key, BookOpen, Link2, Terminal, Code, Monitor, Target, Cpu,
  ShieldCheck, Wifi, Bug, Scan, Phone
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON } from '../../utils/export';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/* ═══════════════════════════════════════════════════════════════════════════════
   THEME & CONSTANTS — Intelligence-grade design system
   ═══════════════════════════════════════════════════════════════════════════════ */

const SCAN_CATEGORIES = [
  { name: 'DNS & VALIDATION', sources: ['DNS (MX/SPF/DKIM/DMARC)', 'WHOIS/RDAP', 'Disify', 'EmailRep.io', 'SPF/DKIM/DMARC', 'BIMI/MTA-STS'] },
  { name: 'BREACH INTELLIGENCE', sources: ['XposedOrNot', 'HIBP Breaches', 'HIBP Pastes', 'Hudson Rock', 'Pwned Passwords', 'Dark Web Intel'] },
  { name: 'IDENTITY & SOCIAL', sources: ['Gravatar', 'Holehe (122 Sites)', 'Sherlock OSINT', 'Maigret Deep Recon', 'GHunt Google', 'GitHub Search', 'Professional Profile'] },
  { name: 'INFRASTRUCTURE', sources: ['VirusTotal Domain', 'crt.sh Certs', 'DNS Blacklists', 'Typosquatting', 'PGP Keys', 'Wayback Machine'] },
  { name: 'RAPIDAPI INTEL', sources: ['Email Checker', 'NetDetective', 'Web Security', 'Malicious URLs', 'Subdomain Scan', 'IOC Search', 'IP Blacklist', 'Proxy Check', 'MITRE ATT&CK', 'Facebook'] },
];
const ALL_SOURCES = SCAN_CATEGORIES.flatMap(c => c.sources);

const SEV = {
  critical: { bg: 'bg-red-500/12', text: 'text-red-400', border: 'border-red-500/30', dot: 'bg-red-500', bar: 'bg-red-500', accent: '#ef4444' },
  high: { bg: 'bg-orange-500/12', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500', bar: 'bg-orange-500', accent: '#f97316' },
  medium: { bg: 'bg-amber-500/12', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400', bar: 'bg-amber-400', accent: '#eab308' },
  low: { bg: 'bg-blue-500/12', text: 'text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-400', bar: 'bg-blue-400', accent: '#3b82f6' },
  clean: { bg: 'bg-emerald-500/12', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500', bar: 'bg-emerald-500', accent: '#22c55e' },
  info: { bg: 'bg-cyan-500/8', text: 'text-cyan-400', border: 'border-cyan-500/20', dot: 'bg-cyan-400', bar: 'bg-cyan-400', accent: '#06b6d4' },
};
const sev = s => SEV[s] || SEV.info;

const NAV_ITEMS = [
  { id: 'brief', label: 'INTEL BRIEF', icon: Layers, desc: 'Executive summary' },
  { id: 'threats', label: 'THREATS', icon: Shield, desc: 'Risk & reputation' },
  { id: 'breaches', label: 'BREACHES', icon: Database, desc: 'Breach intelligence' },
  { id: 'identity', label: 'IDENTITY', icon: Fingerprint, desc: 'Digital footprint' },
  { id: 'infra', label: 'INFRA', icon: Server, desc: 'Infrastructure' },
  { id: 'forensics', label: 'FORENSICS', icon: Terminal, desc: 'Headers & hashes' },
];

/* ═══════════════════════════════════════════════════════════════════════════════
   HUD BACKGROUND — Minimal dot grid with ambient glow
   ═══════════════════════════════════════════════════════════════════════════════ */

const HudBg = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0" style={{
      backgroundImage: 'radial-gradient(circle, rgba(6,182,212,0.07) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    }} />
    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
    <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent" />
    <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent" />
    {/* Ambient glow */}
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-cyan-500/[0.02] blur-[100px]" />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   SCAN HUD — Terminal-style intelligence gathering visualization
   ═══════════════════════════════════════════════════════════════════════════════ */

const ScanHUD = () => {
  const [completed, setCompleted] = useState([]);
  const [active, setActive] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const logRef = useRef(null);

  useEffect(() => {
    const timers = [];
    let lineIdx = 0;
    // Add initial log lines
    timers.push(setTimeout(() => setLogLines(p => [...p, { t: 'sys', msg: 'Initializing OSINT intelligence modules...' }]), 100));
    timers.push(setTimeout(() => setLogLines(p => [...p, { t: 'sys', msg: 'Establishing secure connections to 37+ sources...' }]), 400));

    ALL_SOURCES.forEach((src, i) => {
      const baseDelay = 700 + i * 280;
      const jitter = Math.random() * 200;
      timers.push(setTimeout(() => {
        setActive(i);
        setLogLines(p => [...p, { t: 'scan', msg: `Querying ${src}...`, src }]);
      }, baseDelay));
      timers.push(setTimeout(() => {
        setCompleted(p => [...p, i]);
        setLogLines(p => [...p, { t: 'ok', msg: `${src} — data acquired`, src }]);
      }, baseDelay + jitter + 150));
    });

    // Final line
    const totalTime = 700 + ALL_SOURCES.length * 280 + 400;
    timers.push(setTimeout(() => {
      setLogLines(p => [...p, { t: 'sys', msg: 'Compiling intelligence report...' }]);
    }, totalTime));

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logLines]);

  const pct = Math.min((completed.length / ALL_SOURCES.length) * 100, 100);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
      {/* Radar pulse */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full border-2 border-cyan-500/20 flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full border border-cyan-500/8" />
          <div className="absolute inset-4 rounded-full border border-cyan-500/6" />
          <Scan size={32} className="text-cyan-400 animate-pulse" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0a1120] border border-cyan-500/30 rounded text-xs font-mono text-cyan-400 font-bold whitespace-nowrap">
          {completed.length}/{ALL_SOURCES.length} SOURCES
        </div>
      </div>

      {/* Progress */}
      <div className="w-full max-w-xl mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-[0.2em]">Intelligence Gathering Progress</span>
          <span className="text-sm font-mono text-cyan-400 font-bold">{Math.round(pct)}%</span>
        </div>
        <div className="h-1.5 bg-[#0d1628] rounded-full overflow-hidden border border-[#1a2744]">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-emerald-400"
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      {/* Category grid + Terminal log side by side */}
      <div className="w-full grid grid-cols-5 gap-3 mb-4">
        {SCAN_CATEGORIES.map((cat, ci) => {
          const catDone = cat.sources.filter((_, si) => {
            const globalIdx = SCAN_CATEGORIES.slice(0, ci).reduce((a, c) => a + c.sources.length, 0) + si;
            return completed.includes(globalIdx);
          }).length;
          const catPct = (catDone / cat.sources.length) * 100;
          return (
            <div key={ci} className="p-2.5 rounded-lg border border-[#1a2744] bg-[#0a1120]/60">
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">{cat.name}</div>
              <div className="h-1 bg-[#0d1628] rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full bg-cyan-500/60 transition-all duration-300" style={{ width: `${catPct}%` }} />
              </div>
              <div className="space-y-0.5">
                {cat.sources.map((src, si) => {
                  const globalIdx = SCAN_CATEGORIES.slice(0, ci).reduce((a, c) => a + c.sources.length, 0) + si;
                  const isDone = completed.includes(globalIdx);
                  const isAct = active === globalIdx && !isDone;
                  return (
                    <div key={si} className="flex items-center gap-1.5">
                      {isDone ? <CheckCircle size={10} className="text-emerald-400 shrink-0" />
                        : isAct ? <RefreshCw size={10} className="text-cyan-400 animate-spin shrink-0" />
                        : <div className="w-2.5 h-2.5 rounded-full border border-slate-700 shrink-0" />}
                      <span className={`text-[10px] font-mono truncate ${isDone ? 'text-slate-500' : isAct ? 'text-cyan-400' : 'text-slate-700'}`}>{src}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal log */}
      <div className="w-full max-w-xl">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#080e1a] border border-[#1a2744] border-b-0 rounded-t-lg">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500/60" />
            <div className="w-2 h-2 rounded-full bg-amber-500/60" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">sigint-console</span>
        </div>
        <div ref={logRef} className="h-28 bg-[#060a13] border border-[#1a2744] rounded-b-lg p-2 overflow-y-auto osintx-scroll font-mono text-[11px]">
          {logLines.map((l, i) => (
            <div key={i} className={`leading-relaxed ${l.t === 'sys' ? 'text-cyan-500/70' : l.t === 'ok' ? 'text-emerald-500/70' : 'text-slate-600'}`}>
              <span className="text-slate-700">[{new Date().toISOString().slice(11, 19)}]</span>{' '}
              {l.t === 'sys' && <span className="text-cyan-600">[SYS]</span>}
              {l.t === 'scan' && <span className="text-amber-600">[SCAN]</span>}
              {l.t === 'ok' && <span className="text-emerald-600">[OK]</span>}
              {' '}{l.msg}
            </div>
          ))}
          <div className="text-slate-700 animate-pulse">█</div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   UI PRIMITIVES — Professional intelligence display components
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ── Copy button with micro feedback ── */
const Cp = ({ val }) => {
  const [copied, setCopied] = useState(false);
  if (!val) return null;
  return (
    <button onClick={() => { navigator.clipboard?.writeText(String(val)); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all shrink-0" title="Copy">
      {copied ? <CheckCircle size={11} className="text-emerald-400" /> : <Copy size={11} className="text-slate-600 hover:text-cyan-400" />}
    </button>
  );
};

/* ── Risk Gauge — SVG-based circular threat score ── */
const RiskRing = ({ score = 0, level = 'clean', size = 140 }) => {
  const s = sev(level);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r - 8} fill="none" stroke="rgba(148,163,184,0.04)" strokeWidth={1} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.accent} strokeWidth={7}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.8, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black font-mono ${s.text} leading-none`}>{score}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-1.5 font-bold">{level}</span>
      </div>
    </div>
  );
};

/* ── Data Row: Label → Value with copy ── */
const Row = ({ label, value, icon: Icon, mono, href }) => {
  if (value === undefined || value === null || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? '● Yes' : '○ No') : String(value);
  return (
    <div className="group flex items-center gap-2 py-1.5 px-2.5 rounded hover:bg-[#111d33]/60 transition-colors">
      {Icon && <Icon size={13} className="text-cyan-600/60 shrink-0" />}
      <span className="text-[11px] text-slate-500 min-w-[90px] shrink-0 uppercase tracking-[0.1em] font-semibold">{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-[13px] flex-1 truncate text-cyan-400 hover:text-cyan-300 font-mono">{display}</a>
      ) : (
        <span className={`text-[13px] flex-1 truncate ${mono ? 'font-mono' : ''} ${
          typeof value === 'boolean' ? (value ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold') : 'text-slate-200'}`}>{display}</span>
      )}
      <Cp val={typeof value === 'string' ? value : null} />
    </div>
  );
};

/* ── Metric Card: Compact stat display ── */
const Metric = ({ label, value, icon: Icon, severity, onClick, small }) => {
  const s = severity ? sev(severity) : sev('info');
  return (
    <button onClick={onClick} disabled={!onClick}
      className={`flex flex-col items-center justify-center ${small ? 'p-2' : 'p-3'} rounded-lg border ${s.border} ${s.bg} ${
        onClick ? 'hover:brightness-125 cursor-pointer' : 'cursor-default'} transition-all group relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${s.bar} opacity-40`} />
      {Icon && <Icon size={small ? 14 : 16} className={`${s.text} mb-1 opacity-70`} />}
      <span className={`${small ? 'text-base' : 'text-xl'} font-black font-mono ${s.text} leading-tight`}>{value ?? '—'}</span>
      <span className="text-[9px] uppercase tracking-[0.15em] text-slate-500 mt-0.5 font-bold leading-tight">{label}</span>
    </button>
  );
};

/* ── Intel Section: Collapsible card with severity stripe ── */
const Section = ({ title, icon: Icon, badge, severity, open: defaultOpen = true, children, className = '' }) => {
  const [open, setOpen] = useState(defaultOpen);
  const s = severity ? sev(severity) : null;
  return (
    <div className={`rounded-lg border overflow-hidden transition-all ${
      s ? `${s.border} bg-[#0a1120]/40` : 'border-[#1a2744] bg-[#0a1120]/40'} ${className}`}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#111d33]/40 transition-colors">
        {s && <div className={`w-[3px] h-5 rounded-full ${s.bar} shrink-0`} />}
        {Icon && <Icon size={15} className={s ? s.text : 'text-cyan-500/80'} />}
        <span className="text-[13px] font-bold text-slate-300 uppercase tracking-[0.08em] flex-1 text-left">{title}</span>
        {badge !== undefined && badge !== null && (
          <span className={`px-2 py-0.5 text-[11px] font-black rounded font-mono ${
            s ? `${s.bg} ${s.text}` : 'bg-cyan-500/10 text-cyan-400'}`}>{badge}</span>
        )}
        <ChevronDown size={13} className={`text-slate-600 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-3 pb-3 pt-0.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Pill: Color-coded tag ── */
const Pill = ({ children, color = 'cyan' }) => {
  const colors = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/15',
    red: 'bg-red-500/10 text-red-400 border-red-500/15',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/15',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/15',
    slate: 'bg-slate-700/30 text-slate-400 border-slate-600/20',
  };
  return <span className={`inline-block px-1.5 py-0.5 text-[11px] font-mono rounded border ${colors[color] || colors.cyan}`}>{children}</span>;
};

/* ── Status dot indicator ── */
const Dot = ({ active, color = 'emerald' }) => (
  <div className={`w-2 h-2 rounded-full shrink-0 ${active ? `bg-${color}-400` : 'bg-slate-700'}`} />
);

/* ═══════════════════════════════════════════════════════════════════════════════
   PANEL 1: INTEL BRIEF — Executive intelligence summary
   ═══════════════════════════════════════════════════════════════════════════════ */

const BriefPanel = ({ d, setActiveTab }) => {
  const risk = d.riskAssessment || {};
  const bs = d.breachSummary || {};
  const meta = d.investigationMeta || {};
  const val = d.validation || {};

  return (
    <div className="space-y-4">
      {/* Classification header */}
      <div className="flex items-center gap-3 px-3 py-2 bg-[#0a1120]/60 rounded-lg border border-[#1a2744]">
        <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded tracking-[0.15em]">TLP:CLEAR</span>
        <span className="text-[11px] font-mono text-slate-500 tracking-wider">INTELLIGENCE BRIEF — {meta.caseRef}</span>
        <span className="ml-auto text-[11px] font-mono text-slate-600">{meta.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0]}</span>
      </div>

      {/* Hero: Threat Score + Primary Metrics */}
      <div className="flex items-start gap-4">
        <div className="flex flex-col items-center p-4 rounded-xl border border-[#1a2744] bg-[#0a1120]/60">
          <RiskRing score={risk.riskScore || 0} level={risk.riskLevel || 'clean'} size={130} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-2 font-bold">Threat Assessment</span>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-2.5">
          <Metric label="Breaches" value={bs.total || 0} icon={Database}
            severity={bs.total > 0 ? (bs.critical > 0 ? 'critical' : 'high') : 'clean'}
            onClick={() => setActiveTab('breaches')} />
          <Metric label="Accounts" value={d.registeredCount || 0} icon={User}
            severity={d.registeredCount > 8 ? 'medium' : d.registeredCount > 0 ? 'info' : undefined}
            onClick={() => setActiveTab('identity')} />
          <Metric label="Sources" value={meta.sourceCount || 0} icon={Layers} severity="info" />
          <Metric label="Infostealers" value={d.infostealerData?.results?.length || 0} icon={Bug}
            severity={d.infostealerData?.results?.length > 0 ? 'critical' : undefined} />
          <Metric label="Pastes" value={d.pastes?.items?.length || 0} icon={FileText}
            severity={d.pastes?.items?.length > 0 ? 'high' : undefined} />
          <Metric label="Social" value={d.socialMedia?.filter(s => s.found).length || 0} icon={Globe}
            severity={d.socialMedia?.filter(s => s.found).length > 0 ? 'info' : undefined}
            onClick={() => setActiveTab('identity')} />
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        <Metric label="Usernames" value={d.usernameIntel?.totalFound || 0} icon={Fingerprint} severity="info" small />
        <Metric label="Typosquats" value={d.typosquatting?.active?.length || 0} icon={AlertTriangle}
          severity={d.typosquatting?.active?.length > 0 ? 'critical' : 'clean'} small />
        <Metric label="SSL Certs" value={d.certificateTransparency?.totalCerts || 0} icon={Lock} severity="info" small />
        <Metric label="DNSBL" value={d.dnsBlacklist?.isBlacklisted ? 'LISTED' : 'Clear'} icon={Shield}
          severity={d.dnsBlacklist?.isBlacklisted ? 'critical' : 'clean'} small />
        <Metric label="HIBP" value={d.hibpBreaches?.total || 0} icon={Database}
          severity={d.hibpBreaches?.total > 0 ? 'high' : 'clean'} small />
        <Metric label="Passwords" value={d.passwordExposure?.exposed ? 'EXPOSED' : d.passwordExposure?.checked ? 'Safe' : '—'} icon={Key}
          severity={d.passwordExposure?.exposed ? 'critical' : 'clean'} small />
        <Metric label="Dark Web" value={d.darkWebIndicators?.found ? d.darkWebIndicators.totalIndicators : 0} icon={Eye}
          severity={d.darkWebIndicators?.found ? 'critical' : undefined} small />
      </div>

      {/* Key findings + Risk factors */}
      {(risk.riskFactors || []).length > 0 && (
        <Section title="Risk Factor Analysis" icon={AlertTriangle} badge={risk.totalFactors}
          severity={risk.riskLevel === 'critical' ? 'critical' : risk.riskLevel === 'high' ? 'high' : 'medium'}>
          <div className="space-y-0.5">
            {risk.riskFactors.map((f, i) => {
              const fs = sev(f.weight > 20 ? 'critical' : f.weight > 10 ? 'high' : 'medium');
              return (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <span className={`px-1.5 py-0.5 text-[10px] font-black rounded ${fs.bg} ${fs.text} uppercase tracking-wider`}>{f.category}</span>
                  <span className="text-[13px] text-slate-300 flex-1">{f.factor}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-500">+{f.weight}</span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Investigation metadata + Deliverability */}
      <div className="grid grid-cols-2 gap-3">
        <Section title="Investigation Metadata" icon={Crosshair}>
          <Row label="Case Ref" value={meta.caseRef} icon={FileText} mono />
          <Row label="Grade" value={meta.evidenceGrade} icon={Shield} />
          <Row label="Duration" value={meta.searchDuration} icon={Clock} />
          <Row label="Sources" value={meta.sourceCount} icon={Layers} />
          <Row label="Version" value={meta.toolVersion} icon={Info} />
          <Row label="Timestamp" value={meta.timestamp} icon={Calendar} />
          <Row label="Validation" value={val.format ? `${val.score || 0}% valid` : 'Invalid format'} icon={CheckCircle} />
          <Row label="Disposable" value={val.disposable} icon={AlertTriangle} />
          <Row label="Free Provider" value={val.freeProvider} icon={Info} />
          <Row label="Role Account" value={val.roleAccount} icon={User} />
        </Section>
        <Section title="Mail Deliverability" icon={Mail}>
          {d.deliverability ? Object.entries(d.deliverability).map(([k, v]) => (
            <Row key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={typeof v === 'object' ? JSON.stringify(v) : v} icon={Mail} />
          )) : <div className="text-[13px] text-slate-500 py-2">No deliverability data</div>}
        </Section>
      </div>

      {/* Timeline preview */}
      {(() => { const tlEvents = Array.isArray(d.timeline) ? d.timeline : d.timeline?.events || []; return tlEvents.length > 0 ? (
        <Section title="Timeline Preview" icon={Clock} badge={tlEvents.length + ' events'} open={false}>
          {tlEvents.slice(0, 5).map((e, i) => {
            const es = sev(e.severity || 'info');
            return (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <div className={`w-2 h-2 rounded-full ${es.dot}`} />
                <span className="text-[12px] text-slate-500 font-mono min-w-[70px]">{e.date}</span>
                <span className="text-[13px] text-slate-300 flex-1">{e.event}</span>
                <span className={`text-[10px] px-1 py-0.5 rounded ${es.bg} ${es.text} uppercase font-bold`}>{e.severity || 'info'}</span>
              </div>
            );
          })}
          <button onClick={() => setActiveTab('forensics')}
            className="mt-2 text-[12px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
            View full timeline <ChevronRight size={12} />
          </button>
        </Section>
      ) : null; })()}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   PANEL 2: THREATS — Risk assessment, reputation, dark web, IOCs
   ═══════════════════════════════════════════════════════════════════════════════ */

const ThreatPanel = ({ d }) => {
  const rep = d.reputation || {};
  const risk = d.riskAssessment || {};

  return (
    <div className="space-y-3">
      {/* Central threat score */}
      <div className="flex items-center justify-center py-2">
        <RiskRing score={risk.riskScore || 0} level={risk.riskLevel || 'clean'} size={130} />
      </div>

      {/* Reputation grid */}
      <Section title="Email Reputation Intelligence" icon={Shield}>
        <div className="grid grid-cols-2 gap-x-2">
          <Row label="Reputation" value={rep.emailReputation} icon={Shield} />
          <Row label="Suspicious" value={rep.suspicious} icon={AlertTriangle} />
          <Row label="References" value={rep.references} icon={Activity} />
          <Row label="Blacklisted" value={rep.blacklisted} icon={AlertCircle} />
          <Row label="Malicious" value={rep.maliciousActivity} icon={AlertTriangle} />
          <Row label="Recent Mal." value={rep.maliciousActivityRecent} icon={Zap} />
          <Row label="Cred Leaked" value={rep.credentialsLeaked} icon={Key} />
          <Row label="Recent Leak" value={rep.credentialsLeakedRecent} icon={Zap} />
          <Row label="Breaches" value={rep.dataBreaches} icon={Database} />
          <Row label="Spam" value={rep.spamReports} icon={Mail} />
          <Row label="Spoofable" value={rep.spoofable} icon={AlertTriangle} />
          <Row label="SPF Strict" value={rep.spfStrict} icon={Lock} />
          <Row label="DMARC" value={rep.dmarcEnforced} icon={Lock} />
          <Row label="Domain Rep" value={rep.domainReputation} icon={Globe} />
          <Row label="First Seen" value={rep.firstSeen} icon={Calendar} />
          <Row label="Last Seen" value={rep.lastSeen} icon={Clock} />
        </div>
      </Section>

      {/* Risk factors */}
      {(risk.riskFactors || []).length > 0 && (
        <Section title="Detailed Risk Factors" icon={AlertTriangle} badge={risk.totalFactors}
          severity={risk.riskLevel === 'critical' ? 'critical' : risk.riskLevel === 'high' ? 'high' : 'medium'}>
          {risk.riskFactors.map((f, i) => {
            const fs = sev(f.weight > 20 ? 'critical' : f.weight > 10 ? 'high' : 'medium');
            return (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <span className={`px-1.5 py-0.5 text-[10px] font-black rounded ${fs.bg} ${fs.text} uppercase`}>{f.category}</span>
                <span className="text-[13px] text-slate-300 flex-1">{f.factor}</span>
                <span className="text-[11px] font-mono font-bold text-slate-500">+{f.weight}</span>
              </div>
            );
          })}
        </Section>
      )}

      {/* Dark web intelligence */}
      {d.darkWebIndicators?.found && (
        <Section title="Dark Web Intelligence" icon={Eye} badge={d.darkWebIndicators.totalIndicators} severity="critical">
          {(d.darkWebIndicators.indicators || []).map((ind, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-red-400 min-w-[60px] text-[12px] font-bold">{ind.source}</span>
              <span className="text-[13px] text-slate-300 flex-1">{ind.type}: {ind.detail}</span>
              <span className="text-[11px] text-slate-500 font-mono">{ind.confidence}</span>
            </div>
          ))}
          {(d.darkWebIndicators.mentions || []).map((m, i) => (
            <div key={`m-${i}`} className="flex items-center gap-2 py-1.5">
              <Eye size={12} className="text-red-400 shrink-0" />
              <span className="text-[13px] text-slate-300 flex-1">{m.type}: {m.detail}</span>
              <span className="text-[11px] text-slate-500 font-mono">{m.lastSeen}</span>
            </div>
          ))}
        </Section>
      )}

      {/* Known profiles */}
      {rep.knownProfiles?.length > 0 && (
        <Section title="Known Profiles (EmailRep)" icon={Globe} badge={rep.knownProfiles.length} open={false}>
          <div className="flex flex-wrap gap-1.5 py-1">
            {rep.knownProfiles.map((p, i) => <Pill key={i} color="cyan">{p}</Pill>)}
          </div>
        </Section>
      )}

      {/* RapidAPI: Email Validation */}
      {d.rapidApiIntel?.emailValidation && (
        <Section title="Advanced Email Validation" icon={Mail} badge={d.rapidApiIntel.emailValidation.valid ? 'VALID' : 'CHECK'} severity="info">
          <Row label="Valid" value={d.rapidApiIntel.emailValidation.valid != null ? String(d.rapidApiIntel.emailValidation.valid) : 'N/A'} icon={CheckCircle} />
          <Row label="Disposable" value={d.rapidApiIntel.emailValidation.disposable != null ? String(d.rapidApiIntel.emailValidation.disposable) : 'N/A'} icon={AlertTriangle} />
          <Row label="Role Acct" value={d.rapidApiIntel.emailValidation.role != null ? String(d.rapidApiIntel.emailValidation.role) : 'N/A'} icon={User} />
          <Row label="Free" value={d.rapidApiIntel.emailValidation.free != null ? String(d.rapidApiIntel.emailValidation.free) : 'N/A'} icon={Mail} />
          <Row label="MX Found" value={d.rapidApiIntel.emailValidation.mxFound != null ? String(d.rapidApiIntel.emailValidation.mxFound) : 'N/A'} icon={Server} />
          <Row label="SMTP Check" value={d.rapidApiIntel.emailValidation.smtpCheck != null ? String(d.rapidApiIntel.emailValidation.smtpCheck) : 'N/A'} icon={Shield} />
          <Row label="Catch-All" value={d.rapidApiIntel.emailValidation.catchAll != null ? String(d.rapidApiIntel.emailValidation.catchAll) : 'N/A'} icon={Globe} />
          <Row label="Score" value={d.rapidApiIntel.emailValidation.score} icon={Activity} />
          {d.rapidApiIntel.emailValidation.suggestion && <Row label="Suggestion" value={d.rapidApiIntel.emailValidation.suggestion} icon={Info} />}
        </Section>
      )}

      {/* RapidAPI: IP Blacklist */}
      {d.rapidApiIntel?.ipBlacklist && (
        <Section title="IP Blacklist Intelligence" icon={Shield}
          badge={d.rapidApiIntel.ipBlacklist.blacklisted ? 'BLACKLISTED' : 'CLEAN'}
          severity={d.rapidApiIntel.ipBlacklist.blacklisted ? 'critical' : 'clean'}>
          <Row label="Target" value={d.rapidApiIntel.ipBlacklist.target} icon={Globe} />
          <Row label="Blacklisted" value={d.rapidApiIntel.ipBlacklist.blacklisted ? 'YES' : 'No'} icon={AlertTriangle} />
          <Row label="Score" value={d.rapidApiIntel.ipBlacklist.score} icon={Activity} />
          <Row label="Country" value={d.rapidApiIntel.ipBlacklist.country} icon={MapPin} />
          {d.rapidApiIntel.ipBlacklist.sources?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 pl-2">
              {(Array.isArray(d.rapidApiIntel.ipBlacklist.sources) ? d.rapidApiIntel.ipBlacklist.sources : []).slice(0, 15).map((s, i) => (
                <Pill key={i} color="red">{typeof s === 'string' ? s : s.name || JSON.stringify(s)}</Pill>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* RapidAPI: Proxy Detection */}
      {d.rapidApiIntel?.proxyDetection && (
        <Section title="Proxy / VPN Detection" icon={Eye}
          badge={d.rapidApiIntel.proxyDetection.isProxy ? 'PROXY' : 'CLEAN'}
          severity={d.rapidApiIntel.proxyDetection.isProxy ? 'high' : 'clean'}>
          <Row label="Is Proxy" value={d.rapidApiIntel.proxyDetection.isProxy ? 'YES' : 'No'} icon={Eye} />
          <Row label="Type" value={d.rapidApiIntel.proxyDetection.proxyType} icon={Server} />
          <Row label="Anonymity" value={d.rapidApiIntel.proxyDetection.anonymity} icon={Shield} />
          <Row label="Last Seen" value={d.rapidApiIntel.proxyDetection.lastSeen} icon={Clock} />
        </Section>
      )}

      {/* RapidAPI: IOC Search */}
      {d.rapidApiIntel?.iocSearch?.found && (
        <Section title="IOC Search Results" icon={Target} badge={`${d.rapidApiIntel.iocSearch.count} IOCs`} severity="critical">
          {d.rapidApiIntel.iocSearch.indicators.map((ioc, i) => (
            <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-red-500/15 text-red-400 uppercase">{ioc.type || 'IOC'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-slate-300 font-mono truncate">{ioc.value}</div>
                <div className="text-[11px] text-slate-500">{[ioc.source, ioc.severity, ioc.firstSeen].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* RapidAPI: MITRE ATT&CK */}
      {d.rapidApiIntel?.mitreAttack?.techniques?.length > 0 && (
        <Section title="MITRE ATT&CK Mapping" icon={Shield} badge={`${d.rapidApiIntel.mitreAttack.count} TTPs`} severity="high" open={false}>
          {d.rapidApiIntel.mitreAttack.techniques.map((t, i) => (
            <div key={i} className="py-1.5 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-1.5">
                {t.id && <span className="px-1.5 py-0.5 text-[10px] font-black rounded bg-orange-500/15 text-orange-400 font-mono">{t.id}</span>}
                <span className="text-[12px] text-slate-300 font-semibold">{t.name}</span>
              </div>
              {t.tactic && <div className="text-[11px] text-cyan-500/60 mt-0.5">Tactic: {t.tactic}</div>}
              {t.description && <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{t.description}</div>}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   PANEL 3: BREACHES — All breach intelligence consolidated
   ═══════════════════════════════════════════════════════════════════════════════ */

const BreachPanel = ({ d }) => {
  const bs = d.breachSummary || {};
  const allBreaches = d.breaches || [];
  const [expanded, setExpanded] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const BREACH_LIMIT = 50;
  const breaches = showAll ? allBreaches : allBreaches.slice(0, BREACH_LIMIT);

  return (
    <div className="space-y-3">
      {/* Severity distribution bar */}
      <div className="flex items-stretch gap-1.5">
        {[
          { label: 'Total', val: bs.total || 0, sev: 'info' },
          { label: 'Critical', val: bs.critical || 0, sev: 'critical' },
          { label: 'High', val: bs.high || 0, sev: 'high' },
          { label: 'Medium', val: bs.medium || 0, sev: 'medium' },
          { label: 'Low', val: bs.low || 0, sev: 'low' },
        ].map((b, i) => {
          const s = sev(b.sev);
          return (
            <div key={i} className={`flex-1 text-center py-2 rounded-lg border ${s.border} ${s.bg}`}>
              <div className={`text-lg font-black font-mono ${s.text}`}>{b.val}</div>
              <div className="text-[9px] uppercase tracking-[0.15em] text-slate-500 font-bold">{b.label}</div>
            </div>
          );
        })}
      </div>

      {/* Breach database */}
      {breaches.length > 0 && (
        <Section title="Breach Database" icon={Database} badge={breaches.length}
          severity={bs.critical > 0 ? 'critical' : bs.high > 0 ? 'high' : bs.total > 0 ? 'medium' : 'clean'}>
          <div className="space-y-1">
            {breaches.map((b, i) => {
              const bs2 = sev(b.severity || 'medium');
              const isOpen = expanded === i;
              return (
                <div key={i} className={`rounded-lg border ${bs2.border} ${bs2.bg.replace('/12', '/[0.04]')} overflow-hidden`}>
                  <button onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-[3px] h-4 rounded-full ${bs2.bar} shrink-0`} />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${bs2.bg} ${bs2.text}`}>{b.severity || 'MED'}</span>
                    <span className="text-[13px] text-slate-200 flex-1 text-left truncate font-semibold">{b.name || b.domain}</span>
                    <span className="text-[11px] text-slate-600 font-mono">{b.date?.split('T')[0]}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{(b.recordCount || b.records)?.toLocaleString()}</span>
                    <ChevronDown size={12} className={`text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-2.5 pt-1 border-t border-white/[0.06]">
                      <Row label="Domain" value={b.domain} icon={Globe} mono />
                      <Row label="Date" value={b.date?.split('T')[0]} icon={Calendar} />
                      <Row label="Records" value={(b.recordCount || b.records)?.toLocaleString()} icon={Database} />
                      {(() => { const dt = Array.isArray(b.dataTypes) ? b.dataTypes : typeof b.dataTypes === 'string' ? b.dataTypes.split(';').map(s => s.trim()).filter(Boolean) : []; return dt.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1 ml-2">
                          {dt.map((t, j) => <Pill key={j} color="slate">{t}</Pill>)}
                        </div>
                      ) : null; })()}
                      {b.details && <p className="text-[12px] text-slate-500 mt-1 ml-2 line-clamp-2">{b.details}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {!showAll && allBreaches.length > BREACH_LIMIT && (
            <button onClick={() => setShowAll(true)}
              className="mt-2 w-full py-2 text-[12px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 rounded-lg border border-cyan-500/15 font-bold transition-colors">
              Show all {allBreaches.length} breaches (+{allBreaches.length - BREACH_LIMIT} more)
            </button>
          )}
        </Section>
      )}

      {/* Infostealers */}
      {(() => { const stealers = d.infostealerData?.results || d.infostealerData?.stealers || []; return stealers.length > 0 ? (
        <Section title="Infostealer Intelligence" icon={Bug} badge={`${stealers.length} machines`} severity="critical">
          {stealers.map((r, i) => (
            <div key={i} className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/[0.04] mb-1.5 last:mb-0">
              <Row label="Source" value={r.source} icon={Server} />
              <Row label="Date" value={r.dateCompromised || r.date_compromised} icon={Calendar} />
              <Row label="Computer" value={r.computer_name} icon={Monitor} />
              <Row label="OS" value={r.operating_system} icon={Cpu} />
              {r.passwords?.length > 0 && (
                <div className="mt-1 ml-2 text-[12px] text-red-400 font-mono font-bold">{r.passwords.length} passwords stolen</div>
              )}
              {r.stolen_credentials?.length > 0 && (
                <div className="mt-1 ml-2">
                  <span className="text-[11px] text-red-400 uppercase tracking-wider font-bold">Stolen credentials:</span>
                  {r.stolen_credentials.slice(0, 5).map((c, j) => (
                    <div key={j} className="text-[11px] text-slate-500 font-mono ml-2 truncate">{c.url || c.domain} → {c.username}</div>
                  ))}
                  {r.stolen_credentials.length > 5 && <div className="text-[11px] text-slate-600 ml-2">+{r.stolen_credentials.length - 5} more</div>}
                </div>
              )}
            </div>
          ))}
        </Section>
      ) : null; })()}

      {/* Paste dumps */}
      {(() => { const pasteItems = d.pastes?.items || d.pastes?.entries || []; return pasteItems.length > 0 ? (
        <Section title="Paste Dumps" icon={FileText} badge={pasteItems.length} severity="high">
          {pasteItems.map((p, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <FileText size={12} className="text-orange-400 shrink-0" />
              <span className="text-[13px] text-slate-300 flex-1 truncate">{p.title || p.source || 'Untitled'}</span>
              <span className="text-[11px] text-slate-600 font-mono">{p.date?.split('T')[0]}</span>
              {p.emailCount && <span className="text-[11px] text-slate-500 font-mono">{p.emailCount} emails</span>}
            </div>
          ))}
        </Section>
      ) : null; })()}

      {/* GitHub code leaks */}
      {d.githubLeaks?.found && (
        <Section title="GitHub Code Leaks" icon={Code} badge={d.githubLeaks.totalResults} severity="high">
          {(d.githubLeaks.results || []).map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <Code size={12} className="text-amber-400 shrink-0" />
              <span className="text-[12px] text-slate-300 font-mono flex-1 truncate">{r.repository}/{r.file_name || r.file_path}</span>
              {r.url && <a href={r.url} target="_blank" rel="noreferrer"><ExternalLink size={11} className="text-cyan-400" /></a>}
            </div>
          ))}
        </Section>
      )}

      {/* Breach metrics */}
      {d.breachMetrics && (
        <Section title="Breach Analytics" icon={BarChart3} open={false}>
          {d.breachMetrics.risk && <Row label="Risk" value={`${d.breachMetrics.risk.risk_label} (${d.breachMetrics.risk.risk_score})`} icon={AlertTriangle} />}
          {d.breachMetrics.passwordStrength && (
            <Row label="Passwords" value={`Plain: ${d.breachMetrics.passwordStrength.PlainText || 0} | Weak: ${d.breachMetrics.passwordStrength.EasyToCrack || 0} | Strong: ${d.breachMetrics.passwordStrength.StrongHash || 0}`} icon={Key} />
          )}
          {d.breachMetrics.exposedDataTypes?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 ml-2">
              {d.breachMetrics.exposedDataTypes.map((t, i) => <Pill key={i} color="slate">{t.name || t}</Pill>)}
            </div>
          )}
        </Section>
      )}

      {/* HIBP Direct */}
      {(d.hibpBreaches?.total || d.hibpBreaches?.totalBreaches || 0) > 0 && (
        <Section title="Have I Been Pwned — Breaches" icon={ShieldCheck} badge={d.hibpBreaches.total || d.hibpBreaches.totalBreaches} severity="high">
          {(d.hibpBreaches.breaches || []).map((b, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
              {b.LogoPath && <img src={b.LogoPath} alt="" className="w-5 h-5 rounded shrink-0 mt-0.5" onError={e => { e.target.style.display = 'none'; }} />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-slate-200">{b.Name}</span>
                  {b.IsSensitive && <Pill color="red">SENSITIVE</Pill>}
                  <span className="text-[11px] text-slate-600 font-mono ml-auto">{b.BreachDate}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{b.PwnCount?.toLocaleString()} records</div>
                {b.DataClasses?.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {b.DataClasses.slice(0, 6).map((dc, j) => <Pill key={j} color="orange">{dc}</Pill>)}
                    {b.DataClasses.length > 6 && <span className="text-[11px] text-slate-600">+{b.DataClasses.length - 6}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* HIBP Pastes */}
      {(d.hibpPastes?.total || d.hibpPastes?.pastes?.length || 0) > 0 && (
        <Section title="HIBP Paste Dumps" icon={FileText} badge={d.hibpPastes.total || d.hibpPastes.pastes?.length} severity="medium">
          {(d.hibpPastes.pastes || []).map((p, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
              <FileText size={12} className="text-amber-400 shrink-0" />
              <span className="text-[13px] text-slate-300 flex-1 truncate">{p.Title || p.Source}</span>
              <span className="text-[11px] text-slate-600 font-mono">{p.Date?.split('T')[0]}</span>
              {p.EmailCount && <span className="text-[11px] text-slate-500 font-mono">{p.EmailCount}</span>}
            </div>
          ))}
        </Section>
      )}

      {/* Password exposure */}
      {d.passwordExposure?.checked && (
        <Section title="Password Exposure (k-Anonymity)" icon={Key}
          badge={d.passwordExposure.exposed ? 'EXPOSED' : 'SAFE'}
          severity={d.passwordExposure.exposed ? 'critical' : 'clean'}>
          <Row label="Checked" value={d.passwordExposure.checked} icon={Shield} />
          <Row label="Exposed" value={d.passwordExposure.exposed} icon={AlertTriangle} />
          {d.passwordExposure.breachesWithPasswords?.length > 0 && (
            <div className="mt-1 ml-2 space-y-0.5">
              <span className="text-[11px] text-red-400 uppercase tracking-wider font-bold">Password breaches:</span>
              {d.passwordExposure.breachesWithPasswords.map((b, i) => (
                <div key={i} className="text-[11px] text-slate-500 font-mono ml-2">{b.name} ({b.date}) — {b.recordCount?.toLocaleString()} records</div>
              ))}
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   PANEL 4: IDENTITY — Digital footprint, accounts, social, Google OSINT
   ═══════════════════════════════════════════════════════════════════════════════ */

const IdentityPanel = ({ d }) => {
  const grav = d.gravatar || {};
  const github = d.githubAccounts?.[0] || null;
  const social = d.socialMedia || [];
  const accounts = d.registeredAccounts || [];
  const registered = accounts.filter(a => a.registered === true);
  const notRegistered = accounts.filter(a => a.registered === false);
  const ui = d.usernameIntel || {};
  const platforms = ui.platformsFound || [];
  const g = d.googleOsint;

  return (
    <div className="space-y-3">
      {/* Gravatar */}
      {grav.exists && (
        <Section title="Gravatar Profile" icon={Camera} badge="FOUND" severity="info">
          <div className="flex items-start gap-3 py-1">
            {grav.avatarUrl && <img src={grav.avatarUrl} alt="" className="w-14 h-14 rounded-xl border-2 border-cyan-500/20" onError={e => { e.target.style.display = 'none'; }} />}
            <div className="flex-1">
              <Row label="Name" value={grav.displayName} icon={User} />
              <Row label="Username" value={grav.preferredUsername} icon={Fingerprint} mono />
              <Row label="Location" value={grav.location} icon={MapPin} />
              <Row label="About" value={grav.aboutMe} icon={Info} />
              {grav.profileUrl && <a href={grav.profileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 text-[12px] flex items-center gap-1 mt-1 ml-2 font-semibold"><ExternalLink size={11} /> View Profile</a>}
            </div>
          </div>
          {grav.accounts?.length > 0 && (
            <div className="mt-2 border-t border-white/[0.04] pt-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Linked Accounts</div>
              <div className="flex flex-wrap gap-1">
                {grav.accounts.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer">
                    <Pill color="cyan">{a.shortname || a.domain}</Pill>
                  </a>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* GitHub */}
      {github && (
        <Section title="GitHub Profile" icon={Code} badge={github.login} severity="info">
          <div className="flex items-start gap-3 py-1">
            {github.avatar && <img src={github.avatar} alt="" className="w-12 h-12 rounded-xl border border-cyan-500/20" />}
            <div className="flex-1">
              <Row label="Username" value={github.login} icon={User} mono />
              <Row label="Name" value={github.name} icon={Fingerprint} />
              <Row label="Bio" value={github.bio} icon={Info} />
              <Row label="Company" value={github.company} icon={Server} />
              <Row label="Location" value={github.location} icon={MapPin} />
              <Row label="Blog" value={github.blog} icon={Globe} />
              <Row label="Twitter" value={github.twitter} icon={Radio} />
              <Row label="Repos" value={github.publicRepos} icon={Database} />
              <Row label="Followers" value={github.followers} icon={Users} />
              <Row label="Created" value={github.createdAt?.split('T')[0]} icon={Calendar} />
            </div>
          </div>
        </Section>
      )}

      {/* Social media grid */}
      <Section title="Social Media Presence" icon={Globe} badge={`${social.filter(s => s.found).length}/${social.length}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {social.map((s, i) => (
            <div key={i} className={`flex items-center gap-1.5 p-2 rounded-lg text-[13px] ${
              s.found ? 'bg-emerald-500/[0.06] border border-emerald-500/15' : 'bg-[#0d1628]/60 border border-transparent'}`}>
              <div className={`w-2 h-2 rounded-full ${s.found ? 'bg-emerald-400' : 'bg-slate-700'} shrink-0`} />
              <span className={s.found ? 'text-emerald-400 font-semibold' : 'text-slate-600'}>{s.platform}</span>
              {s.url && <a href={s.url} target="_blank" rel="noreferrer" className="ml-auto"><ExternalLink size={11} className="text-cyan-400" /></a>}
            </div>
          ))}
        </div>
      </Section>

      {/* Registered accounts */}
      <Section title="Registered Accounts" icon={User} badge={`${registered.length} found`}
        severity={registered.length > 10 ? 'medium' : registered.length > 0 ? 'info' : undefined}>
        {registered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {registered.map((a, i) => (
              <div key={i} className="flex items-center gap-1.5 p-1.5 rounded bg-emerald-500/[0.04] border border-emerald-500/10 text-[12px]">
                <span className="text-sm">{a.icon}</span>
                <span className="text-emerald-400 flex-1 truncate font-medium">{a.service}</span>
                <span className="text-[10px] text-slate-600">{a.source}</span>
              </div>
            ))}
          </div>
        ) : <div className="text-[13px] text-slate-500">No registered accounts detected</div>}
        {notRegistered.length > 0 && (
          <div className="mt-2 border-t border-white/[0.04] pt-2">
            <div className="text-[11px] text-slate-500 mb-1">Not registered ({notRegistered.length}):</div>
            <div className="flex flex-wrap gap-1">
              {notRegistered.map((a, i) => <Pill key={i} color="slate">{a.service}</Pill>)}
            </div>
          </div>
        )}
      </Section>

      {/* Professional profile */}
      <Section title="Professional Profile" icon={Users}
        badge={d.professionalProfile?.found ? d.professionalProfile.sources?.join(', ') : 'None'}
        severity={d.professionalProfile?.found ? 'info' : undefined}>
        {d.professionalProfile?.found ? (
          <div className="space-y-2">
            {d.professionalProfile.clearbit && (
              <div className="border border-cyan-500/10 rounded-lg bg-cyan-500/[0.03] p-2.5">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.15em] mb-1.5">Clearbit Enrichment</div>
                <div className="flex items-start gap-2">
                  {d.professionalProfile.clearbit.avatar && <img src={d.professionalProfile.clearbit.avatar} alt="" className="w-10 h-10 rounded-lg border border-cyan-500/20" onError={e => { e.target.style.display = 'none'; }} />}
                  <div className="flex-1">
                    <Row label="Name" value={d.professionalProfile.clearbit.fullName} icon={User} />
                    <Row label="Title" value={d.professionalProfile.clearbit.title} icon={Fingerprint} />
                    <Row label="Company" value={d.professionalProfile.clearbit.company} icon={Server} />
                    <Row label="Role" value={d.professionalProfile.clearbit.role} icon={Shield} />
                    <Row label="Seniority" value={d.professionalProfile.clearbit.seniority} icon={Activity} />
                    <Row label="Location" value={d.professionalProfile.clearbit.location} icon={MapPin} />
                    <Row label="Bio" value={d.professionalProfile.clearbit.bio} icon={Info} />
                    {d.professionalProfile.clearbit.twitter && <Row label="Twitter" value={`@${d.professionalProfile.clearbit.twitter}`} icon={Radio} />}
                    {d.professionalProfile.clearbit.linkedin && <Row label="LinkedIn" value={d.professionalProfile.clearbit.linkedin} icon={Link2} />}
                    {d.professionalProfile.clearbit.github && <Row label="GitHub" value={d.professionalProfile.clearbit.github} icon={Code} />}
                  </div>
                </div>
              </div>
            )}
            {d.professionalProfile.company && (
              <div className="border border-violet-500/10 rounded-lg bg-violet-500/[0.03] p-2.5">
                <div className="text-[10px] text-violet-400 font-bold uppercase tracking-[0.15em] mb-1.5">Company Intel</div>
                {d.professionalProfile.company.logo && <img src={d.professionalProfile.company.logo} alt="" className="w-7 h-7 rounded mb-1 border border-violet-500/20" onError={e => { e.target.style.display = 'none'; }} />}
                <Row label="Company" value={d.professionalProfile.company.name} icon={Server} />
                <Row label="Industry" value={d.professionalProfile.company.category} icon={Layers} />
                <Row label="Sector" value={d.professionalProfile.company.sector} icon={Activity} />
                <Row label="Employees" value={d.professionalProfile.company.employees} icon={Users} />
                <Row label="Founded" value={d.professionalProfile.company.founded} icon={Calendar} />
                <Row label="Location" value={d.professionalProfile.company.location} icon={MapPin} />
                {d.professionalProfile.company.description && <p className="text-[11px] text-slate-500 mt-1 ml-2 line-clamp-2">{d.professionalProfile.company.description}</p>}
              </div>
            )}
            {d.professionalProfile.fullcontact && (
              <div className="border border-teal-500/10 rounded-lg bg-teal-500/[0.03] p-2.5">
                <div className="text-[10px] text-teal-400 font-bold uppercase tracking-[0.15em] mb-1.5">FullContact</div>
                <Row label="Name" value={d.professionalProfile.fullcontact.fullName} icon={User} />
                <Row label="Title" value={d.professionalProfile.fullcontact.title} icon={Fingerprint} />
                <Row label="Org" value={d.professionalProfile.fullcontact.organization} icon={Server} />
                <Row label="Location" value={d.professionalProfile.fullcontact.location} icon={MapPin} />
                <Row label="Bio" value={d.professionalProfile.fullcontact.bio} icon={Info} />
              </div>
            )}
            {d.professionalProfile.github && (
              <div className="border border-slate-600/20 rounded-lg bg-slate-700/[0.06] p-2.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">GitHub (Fallback)</div>
                <Row label="Name" value={d.professionalProfile.github.name} icon={User} />
                <Row label="Company" value={d.professionalProfile.github.company} icon={Server} />
                <Row label="Bio" value={d.professionalProfile.github.bio} icon={Info} />
                <Row label="Location" value={d.professionalProfile.github.location} icon={MapPin} />
              </div>
            )}
            {d.professionalProfile.gravatar && (
              <div className="border border-slate-600/20 rounded-lg bg-slate-700/[0.06] p-2.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">Gravatar (Fallback)</div>
                <Row label="Name" value={d.professionalProfile.gravatar.name} icon={User} />
                <Row label="Location" value={d.professionalProfile.gravatar.location} icon={MapPin} />
                <Row label="Bio" value={d.professionalProfile.gravatar.bio} icon={Info} />
              </div>
            )}
            {d.professionalProfile.google && (
              <div className="border border-slate-600/20 rounded-lg bg-slate-700/[0.06] p-2.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5">Google Account</div>
                <Row label="Name" value={d.professionalProfile.google.name} icon={User} />
              </div>
            )}
          </div>
        ) : <div className="text-[13px] text-slate-500">No professional data available</div>}
      </Section>

      {/* Facebook (RapidAPI) */}
      {d.rapidApiIntel?.facebookProfile && (
        <Section title="Facebook Profile" icon={Globe} badge="FOUND" severity="info">
          <Row label="Name" value={d.rapidApiIntel.facebookProfile.name} icon={User} />
          <Row label="Profile" value={d.rapidApiIntel.facebookProfile.profileUrl} icon={ExternalLink} href={d.rapidApiIntel.facebookProfile.profileUrl} />
          <Row label="Bio" value={d.rapidApiIntel.facebookProfile.bio} icon={Info} />
          <Row label="Location" value={d.rapidApiIntel.facebookProfile.location} icon={MapPin} />
          <Row label="Workplace" value={d.rapidApiIntel.facebookProfile.workplace} icon={Server} />
          <Row label="Followers" value={d.rapidApiIntel.facebookProfile.followers} icon={Users} />
          <Row label="Friends" value={d.rapidApiIntel.facebookProfile.friends} icon={Users} />
          <Row label="Verified" value={d.rapidApiIntel.facebookProfile.verified} icon={CheckCircle} />
        </Section>
      )}

      {/* Username intelligence */}
      <Section title="Username Intelligence" icon={Fingerprint} badge={`${ui.totalFound || 0} found`}>
        <Row label="Primary" value={ui.derivedUsername} icon={User} mono />
        <Row label="Checked" value={ui.totalPlatformsChecked} icon={Layers} />
        <Row label="Holehe" value={ui.holeheRan ? `✓ ${ui.holeheTotalChecked || 0} sites` : '⏭ Skipped'} icon={Search} />
        <Row label="Sherlock" value={ui.sherlockRan ? `✓ ${ui.sherlockFound || platforms.filter(p => !p.source || p.source !== 'Maigret').length} profiles` : '⏭ Skipped'} icon={Search} />
        <Row label="Maigret" value={ui.maigretRan ? `✓ ${ui.maigretFound || 0} profiles` : '⏭ Skipped'} icon={Search} />
      </Section>

      {/* Username variants */}
      {(ui.variants || []).length > 0 && (
        <Section title="Username Variants" icon={Hash} open={false}>
          <div className="flex flex-wrap gap-1.5 py-1">
            {ui.variants.map((v, i) => <Pill key={i} color="cyan">{v}</Pill>)}
          </div>
        </Section>
      )}

      {/* Platforms found */}
      {platforms.length > 0 && (
        <Section title="Platforms Found" icon={Globe} badge={platforms.length} severity="info" open={false}>
          <div className="grid grid-cols-2 gap-1">
            {platforms.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 p-1.5 rounded bg-emerald-500/[0.04] border border-emerald-500/10 text-[12px]">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-emerald-400 flex-1 truncate">{p.platform || p.name}</span>
                {p.source && <span className="text-[10px] text-slate-600">{p.source}</span>}
                {p.url && <a href={p.url} target="_blank" rel="noreferrer"><ExternalLink size={10} className="text-cyan-400" /></a>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Rate-limited */}
      {ui.holeheRateLimited?.length > 0 && (
        <Section title="Rate-Limited Services" icon={AlertTriangle} badge={ui.holeheRateLimited.length} open={false}>
          <div className="flex flex-wrap gap-1 py-0.5">
            {ui.holeheRateLimited.slice(0, 30).map((s, i) => <Pill key={i} color="amber">{s}</Pill>)}
            {ui.holeheRateLimited.length > 30 && <span className="text-[11px] text-slate-600">+{ui.holeheRateLimited.length - 30} more</span>}
          </div>
        </Section>
      )}

      {/* Related emails */}
      {d.relatedEmails?.patterns?.length > 0 && (
        <Section title="Related Email Patterns" icon={Mail} badge={d.relatedEmails.patterns.length} open={false}>
          {d.relatedEmails.patterns.map((e, i) => (
            <div key={i} className="text-[13px] font-mono text-slate-300 py-0.5 ml-2">{e}</div>
          ))}
        </Section>
      )}

      {/* Epieos Google ID Resolution */}
      {d.epieosResolution && (
        <Section title="Epieos — Google ID Resolution" icon={Search} severity="info" badge={d.epieosResolution.services?.length || 0}>
          <div className="space-y-2">
            {d.epieosResolution.profilePhoto && (
              <div className="flex items-center gap-3 py-1">
                <img src={d.epieosResolution.profilePhoto} alt="" className="w-12 h-12 rounded-full border-2 border-cyan-500/20" onError={e => { e.target.style.display = 'none'; }} />
                <div>
                  {d.epieosResolution.displayName && <div className="text-sm text-white font-medium">{d.epieosResolution.displayName}</div>}
                  {d.epieosResolution.googleId && <div className="text-xs text-slate-500 font-mono">GAIA ID: {d.epieosResolution.googleId}</div>}
                </div>
              </div>
            )}
            {!d.epieosResolution.profilePhoto && d.epieosResolution.googleId && (
              <Row label="Google ID" value={d.epieosResolution.googleId} icon={Fingerprint} mono />
            )}
            {d.epieosResolution.displayName && !d.epieosResolution.profilePhoto && <Row label="Display Name" value={d.epieosResolution.displayName} icon={User} />}
            {d.epieosResolution.mapsContributions && <Row label="Maps Contributions" value={d.epieosResolution.mapsContributions} icon={MapPin} />}
            {d.epieosResolution.youtubeChannel && (
              <a href={d.epieosResolution.youtubeChannel} target="_blank" rel="noreferrer" className="text-cyan-400 text-[12px] flex items-center gap-1 ml-2"><ExternalLink size={11} /> YouTube Channel</a>
            )}
            {d.epieosResolution.calendarUrl && (
              <a href={d.epieosResolution.calendarUrl} target="_blank" rel="noreferrer" className="text-cyan-400 text-[12px] flex items-center gap-1 ml-2"><ExternalLink size={11} /> Google Calendar</a>
            )}
            {d.epieosResolution.services?.length > 0 && (
              <div className="pt-2 space-y-1">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">Linked Services</div>
                <div className="flex flex-wrap gap-1.5">
                  {d.epieosResolution.services.map((s, i) => <Pill key={i} color="cyan">{typeof s === 'string' ? s : s.name || s.service || 'Unknown'}</Pill>)}
                </div>
              </div>
            )}
            {d.epieosResolution.investigationLinks?.length > 0 && (
              <div className="pt-2 space-y-1">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider">Investigation Links</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {d.epieosResolution.investigationLinks.slice(0, 12).map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[11px] text-cyan-300 hover:bg-slate-700/50 transition-colors truncate">
                      <ExternalLink size={10} className="flex-shrink-0" /> {link.name || link.service || 'Link'}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {d.epieosResolution.summary && (
              <div className="pt-1 text-[11px] text-slate-500">
                {d.epieosResolution.summary.services_found > 0 && <span>Services found: {d.epieosResolution.summary.services_found} · </span>}
                {d.epieosResolution.summary.has_google && <span className="text-green-400">Google ✓ · </span>}
                {d.epieosResolution.summary.has_gravatar && <span className="text-purple-400">Gravatar ✓ · </span>}
                {d.epieosResolution.summary.has_github && <span className="text-slate-300">GitHub ✓</span>}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Recovery Page Scraper */}
      {d.recoveryData && d.recoveryData.servicesChecked > 0 && (
        <Section title="Account Recovery Intelligence" icon={Lock} severity={d.recoveryData.accountsFound > 0 ? 'warning' : undefined} badge={`${d.recoveryData.accountsFound} / ${d.recoveryData.servicesChecked}`}>
          <div className="space-y-2">
            {d.recoveryData.results?.filter(r => r.exists !== null).map((r, i) => (
              <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                r.exists ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/30 border-slate-700/30'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${r.exists ? 'bg-amber-400' : 'bg-slate-600'}`} />
                  <span className="text-[13px] text-slate-300">{r.service}</span>
                </div>
                <span className={`text-[11px] font-mono ${r.exists ? 'text-amber-400' : 'text-slate-600'}`}>
                  {r.exists ? 'FOUND' : r.exists === false ? 'NOT FOUND' : 'UNKNOWN'}
                </span>
              </div>
            ))}
            {d.recoveryData.partialPhones?.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Partial Phone Numbers</div>
                {d.recoveryData.partialPhones.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] py-0.5">
                    <Phone size={11} className="text-amber-400" />
                    <span className="text-slate-400">{p.service}:</span>
                    <span className="text-amber-300 font-mono">{p.masked}</span>
                  </div>
                ))}
              </div>
            )}
            {d.recoveryData.partialEmails?.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Partial Alternate Emails</div>
                {d.recoveryData.partialEmails.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] py-0.5">
                    <Mail size={11} className="text-cyan-400" />
                    <span className="text-slate-400">{e.service}:</span>
                    <span className="text-cyan-300 font-mono">{e.masked}</span>
                  </div>
                ))}
              </div>
            )}
            {d.recoveryData.results?.some(r => r.hints?.recovery_url) && (
              <div className="pt-2">
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Recovery Page Links</div>
                <div className="flex flex-wrap gap-1.5">
                  {d.recoveryData.results.filter(r => r.hints?.recovery_url).map((r, i) => (
                    <a key={i} href={r.hints.recovery_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/50 border border-slate-700/50 text-[11px] text-cyan-300 hover:bg-slate-700/50 transition-colors">
                      <ExternalLink size={10} /> {r.service}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Google OSINT */}
      {g && (
        <>
          <Section title="Google Account (GHunt)" icon={Search} severity="info">
            <div className="flex items-start gap-3 py-1">
              {g.profilePhoto && <img src={g.profilePhoto} alt="" className="w-14 h-14 rounded-full border-2 border-cyan-500/20" onError={e => { e.target.style.display = 'none'; }} />}
              <div className="flex-1">
                <Row label="Name" value={g.name} icon={User} />
                <Row label="Gaia ID" value={g.gaiaId} icon={Fingerprint} mono />
                <Row label="Last Edit" value={g.lastEdited} icon={Calendar} />
                <Row label="Photo" value={g.customPhoto} icon={Camera} />
                <Row label="Types" value={g.userTypes?.join(', ')} icon={Layers} />
              </div>
            </div>
            {g.coverPhoto && <img src={g.coverPhoto} alt="" className="w-full h-20 object-cover rounded-lg mt-2 border border-cyan-500/10" onError={e => { e.target.style.display = 'none'; }} />}
          </Section>

          {g.maps && (
            <Section title="Google Maps" icon={MapPin}>
              <Row label="Reviews" value={g.maps.reviews?.length || 0} icon={FileText} />
              <Row label="Photos" value={g.maps.photos?.length || 0} icon={Camera} />
              {g.maps.profileUrl && <a href={g.maps.profileUrl} target="_blank" rel="noreferrer" className="text-cyan-400 text-[12px] flex items-center gap-1 mt-1 ml-2"><ExternalLink size={11} /> View Maps Profile</a>}
            </Section>
          )}

          {g.youtube && (
            <Section title="YouTube" icon={Radio}>
              <Row label="Channel" value={g.youtube.channelName || g.youtube.channel_name} icon={Radio} />
              <Row label="Subscribers" value={g.youtube.subscribers} icon={Users} />
              {(g.youtube.channelUrl || g.youtube.channel_url) && (
                <a href={g.youtube.channelUrl || g.youtube.channel_url} target="_blank" rel="noreferrer" className="text-cyan-400 text-[12px] flex items-center gap-1 mt-1 ml-2"><ExternalLink size={11} /> View Channel</a>
              )}
            </Section>
          )}

          {g.calendar && <Section title="Calendar" icon={Calendar}><Row label="Calendar" value={g.calendar.summary || g.calendar.calendarId} icon={Calendar} /></Section>}
          {g.playGames && (
            <Section title="Play Games" icon={Zap}>
              <Row label="Gamer Tag" value={g.playGames.gamerTag || g.playGames.gamertag} icon={Fingerprint} />
              <Row label="Avatar" value={g.playGames.avatar ? 'Custom' : 'Default'} icon={Camera} />
            </Section>
          )}

          <Section title="Google Services" icon={Layers} open={false}>
            {Object.entries(g.services || {}).map(([k, v]) => (
              <div key={k} className={`flex items-center gap-2 py-0.5 text-[13px] ${v ? 'text-emerald-400' : 'text-slate-600'}`}>
                {v ? <CheckCircle size={12} /> : <X size={12} />}
                <span className="capitalize">{k}</span>
              </div>
            ))}
          </Section>
        </>
      )}

      {!g && (
        <Section title="Google OSINT (GHunt)" icon={Search}>
          <div className="flex flex-col items-center py-4">
            <Search size={24} className="text-slate-600 mb-2" />
            <div className="text-[13px] text-slate-500">No Google OSINT data — GHunt may have skipped or auth required</div>
          </div>
        </Section>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   PANEL 5: INFRASTRUCTURE — Domain, DNS, certs, security
   ═══════════════════════════════════════════════════════════════════════════════ */

const InfraPanel = ({ d }) => {
  const dom = d.domain || {};
  const auth = d.authentication || {};
  const layers = d.securityLayers || [];
  const cert = d.certificateTransparency || {};
  const typo = d.typosquatting || {};
  const dnsbl = d.dnsBlacklist || {};
  const pgp = d.pgpKeys || {};
  const wb = d.waybackMachine || {};
  const [showAllCerts, setShowAllCerts] = useState(false);
  const [showAllSubs, setShowAllSubs] = useState(false);

  return (
    <div className="space-y-3">
      {/* Domain intelligence */}
      <Section title="Domain Intelligence" icon={Globe}>
        <Row label="Domain" value={dom.name} icon={Globe} mono />
        <Row label="Registrar" value={dom.registrar} icon={Server} />
        <Row label="Created" value={dom.created?.split('T')[0]} icon={Calendar} />
        <Row label="Expires" value={dom.expires?.split('T')[0]} icon={Calendar} />
        <Row label="Age" value={dom.age} icon={Clock} />
        {dom.nameservers?.length > 0 && <Row label="Nameservers" value={dom.nameservers.join(', ')} icon={Server} />}
        {dom.mxRecords?.length > 0 && (
          <div className="mt-1 ml-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">MX Records</span>
            {dom.mxRecords.map((mx, i) => <div key={i} className="text-[13px] text-slate-300 font-mono ml-2">{mx}</div>)}
          </div>
        )}
      </Section>

      {/* Email Authentication */}
      <Section title="Email Authentication" icon={Lock}
        severity={auth.spf && auth.dmarc && auth.dkim ? 'clean' : !auth.spf || !auth.dmarc ? 'high' : 'medium'}>
        <div className="space-y-1.5">
          {[
            { name: 'SPF', pass: auth.spf, detail: auth.spfRecord },
            { name: 'DMARC', pass: auth.dmarc, detail: auth.dmarcParsed?.p ? `Policy: ${auth.dmarcParsed.p}` : null },
            { name: 'DKIM', pass: auth.dkim, detail: auth.dkimSelectors?.map(s => s.selector).join(', ') },
          ].map((item, i) => (
            <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg ${item.pass ? 'bg-emerald-500/[0.06] border border-emerald-500/15' : 'bg-red-500/[0.06] border border-red-500/15'}`}>
              {item.pass ? <CheckCircle size={14} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={14} className="text-red-400 shrink-0" />}
              <div className="flex-1">
                <div className="text-[13px] text-slate-200 font-bold">{item.name} {item.pass ? 'PASS' : 'FAIL'}</div>
                {item.detail && <div className="text-[11px] text-slate-500 font-mono break-all mt-0.5">{item.detail}</div>}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-1.5">
            {[{ name: 'BIMI', pass: auth.bimi }, { name: 'MTA-STS', pass: auth.mtaSts }].map((item, i) => (
              <div key={i} className={`flex items-center gap-1.5 p-2 rounded-lg text-[13px] ${
                item.pass ? 'bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400' : 'bg-[#0d1628] border border-[#1a2744] text-slate-600'}`}>
                {item.pass ? <CheckCircle size={12} /> : <X size={12} />} {item.name}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Security layers */}
      {layers.length > 0 && (
        <Section title="Security Layers" icon={Shield} open={false}>
          {layers.map((l, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${
              l.status === 'secure' ? 'bg-emerald-500/[0.04] border border-emerald-500/10 text-emerald-400' :
              l.status === 'warning' ? 'bg-red-500/[0.04] border border-red-500/10 text-red-400' :
              'bg-[#0d1628]/40 border border-[#1a2744] text-slate-500'} text-[13px]`}>
              {l.status === 'secure' ? <CheckCircle size={12} /> : l.status === 'warning' ? <AlertTriangle size={12} /> : <Info size={12} />}
              <span className="font-semibold min-w-[60px] text-slate-300">{l.name}</span>
              <span className="text-slate-500 flex-1 truncate">{l.detail}</span>
            </div>
          ))}
        </Section>
      )}

      {/* VirusTotal */}
      {d.virusTotal && (
        <Section title="VirusTotal Domain" icon={Shield}
          badge={d.virusTotal.malicious > 0 ? `${d.virusTotal.malicious} MALICIOUS` : 'Clean'}
          severity={d.virusTotal.malicious > 0 ? 'critical' : 'clean'}>
          <div className="grid grid-cols-4 gap-1.5 py-1">
            {[
              { l: 'Malicious', v: d.virusTotal.malicious, s: d.virusTotal.malicious > 0 ? 'critical' : 'clean' },
              { l: 'Suspicious', v: d.virusTotal.suspicious, s: d.virusTotal.suspicious > 0 ? 'high' : 'clean' },
              { l: 'Harmless', v: d.virusTotal.harmless, s: 'clean' },
              { l: 'Undetected', v: d.virusTotal.undetected, s: undefined },
            ].map((x, i) => <Metric key={i} label={x.l} value={x.v} severity={x.s} small />)}
          </div>
          {d.virusTotal.registrar && <Row label="Registrar" value={d.virusTotal.registrar} icon={Server} />}
          {d.virusTotal.lastAnalysis && <Row label="Last Scan" value={d.virusTotal.lastAnalysis.split('T')[0]} icon={Calendar} />}
        </Section>
      )}

      {/* Certificate Transparency */}
      <Section title="Certificate Transparency (crt.sh)" icon={Lock}
        badge={cert.found ? `${cert.totalCerts} certs` : 'N/A'}
        severity={cert.found ? 'info' : undefined}>
        {cert.found ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Total Certs" value={cert.totalCerts} severity="info" small />
              <Metric label="Subdomains" value={cert.subdomains?.length || 0} severity="clean" small />
              <Metric label="Issuers" value={cert.issuers?.length || 0} severity="info" small />
            </div>
            {cert.subdomains?.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold flex items-center gap-1"><Globe size={11} /> Subdomains</div>
                <div className="flex flex-wrap gap-1">
                  {(showAllSubs ? cert.subdomains : cert.subdomains.slice(0, 15)).map((s, i) => <Pill key={i} color="cyan">{s}</Pill>)}
                  {cert.subdomains.length > 15 && (
                    <button onClick={() => setShowAllSubs(!showAllSubs)} className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-semibold">
                      {showAllSubs ? 'Less' : `+${cert.subdomains.length - 15} more`}
                    </button>
                  )}
                </div>
              </div>
            )}
            {cert.issuers?.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">Issuers</div>
                {cert.issuers.map((issuer, i) => (
                  <div key={i} className="text-[13px] text-slate-300 py-0.5 flex items-center gap-1"><Shield size={11} className="text-emerald-500/60" /> {issuer}</div>
                ))}
              </div>
            )}
            {cert.certs?.length > 0 && (
              <div>
                <button onClick={() => setShowAllCerts(!showAllCerts)} className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold">
                  {showAllCerts ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllCerts ? 'Hide' : 'Show'} Cert Details ({cert.certs.length})
                </button>
                {showAllCerts && (
                  <div className="mt-1 space-y-0.5 max-h-[180px] overflow-y-auto osintx-scroll">
                    {cert.certs.slice(0, 15).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0d1628]/60 border border-[#1a2744] text-[11px]">
                        <Lock size={11} className="text-emerald-500/60 shrink-0" />
                        <span className="text-slate-300 font-mono flex-1 truncate">{c.commonName || c.nameValue}</span>
                        <span className="text-slate-600">{c.notBefore?.split('T')[0]}</span>
                        <span className="text-slate-700">→</span>
                        <span className="text-slate-600">{c.notAfter?.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : <div className="text-[13px] text-slate-500">No certificate transparency data</div>}
      </Section>

      {/* Typosquatting */}
      <Section title="Typosquatting Detection" icon={AlertTriangle}
        badge={typo.active?.length > 0 ? `${typo.active.length} ACTIVE` : 'Clear'}
        severity={typo.active?.length > 0 ? 'critical' : 'clean'}>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <Metric label="Generated" value={typo.totalGenerated || 0} small />
          <Metric label="DNS Checked" value={typo.checked || 0} small />
          <Metric label="Active" value={typo.active?.length || 0} severity={typo.active?.length > 0 ? 'critical' : 'clean'} small />
        </div>
        {typo.active?.length > 0 ? (
          <div className="space-y-0.5">
            <div className="text-[11px] text-red-400 uppercase tracking-wider font-bold flex items-center gap-1"><AlertTriangle size={11} /> Active typosquat domains:</div>
            {typo.active.map((t, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/[0.04] border border-red-500/10">
                <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="text-red-400 font-mono text-[13px] flex-1">{t.domain}</span>
                {t.ips && <span className="text-[11px] text-slate-600 font-mono">{t.ips.join(', ')}</span>}
              </div>
            ))}
          </div>
        ) : <div className="text-[13px] text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> No active typosquat domains</div>}
      </Section>

      {/* DNS Blacklists */}
      <Section title="DNS Blacklist Check" icon={Shield}
        badge={dnsbl.isBlacklisted ? 'LISTED' : dnsbl.checked > 0 ? 'Clean' : 'N/A'}
        severity={dnsbl.isBlacklisted ? 'critical' : dnsbl.checked > 0 ? 'clean' : undefined}>
        {dnsbl.checked > 0 ? (
          <div>
            {dnsbl.ip && <Row label="Resolved IP" value={dnsbl.ip} icon={Server} mono />}
            <Row label="Checked" value={dnsbl.checked} icon={Database} />
            <Row label="Clean" value={dnsbl.clean} icon={CheckCircle} />
            {dnsbl.listed?.length > 0 && (
              <div className="space-y-0.5 mt-1">
                <div className="text-[11px] text-red-400 uppercase tracking-wider font-bold">Listed on:</div>
                {dnsbl.listed.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-red-500/[0.04] border border-red-500/10">
                    <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-red-400 text-[12px]">{l.list}</span>
                    <span className="text-[11px] text-slate-600 font-mono">{l.zone}</span>
                  </div>
                ))}
              </div>
            )}
            {!dnsbl.isBlacklisted && <div className="text-[13px] text-emerald-400 flex items-center gap-1 mt-1"><CheckCircle size={12} /> Not blacklisted</div>}
          </div>
        ) : <div className="text-[13px] text-slate-500">DNS blacklist check not available</div>}
      </Section>

      {/* PGP Keys */}
      <Section title="PGP Key Server" icon={Key} badge={pgp.found ? 'FOUND' : 'None'} severity={pgp.found ? 'info' : undefined}>
        {pgp.found ? (
          <div>
            <div className="flex items-center gap-1 text-[13px] text-emerald-400 mb-1"><CheckCircle size={12} /> PGP public key found</div>
            {pgp.keyData?.address && <Row label="Address" value={pgp.keyData.address} icon={Mail} />}
            {pgp.keyData?.raw && (
              <div className="mt-1 p-2 bg-[#060a13] rounded-lg text-[11px] font-mono text-slate-600 max-h-[70px] overflow-y-auto osintx-scroll break-all select-all border border-[#1a2744]">{pgp.keyData.raw}</div>
            )}
          </div>
        ) : <div className="text-[13px] text-slate-500">No PGP public key found</div>}
      </Section>

      {/* Wayback Machine */}
      <Section title="Wayback Machine" icon={Clock} badge={wb.found ? 'Archived' : 'N/A'} severity={wb.found ? 'info' : undefined}>
        {wb.found ? (
          <div>
            <div className="flex items-center gap-1 text-[13px] text-emerald-400 mb-1"><CheckCircle size={12} /> Domain archived</div>
            {wb.snapshots?.formattedDate && <Row label="Snapshot" value={wb.snapshots.formattedDate} icon={Calendar} />}
            {wb.snapshots?.status && <Row label="HTTP" value={wb.snapshots.status} icon={Activity} />}
            {wb.totalPages > 0 && <Row label="Pages" value={wb.totalPages.toLocaleString()} icon={Database} />}
            {wb.snapshots?.url && <a href={wb.snapshots.url} target="_blank" rel="noreferrer" className="text-cyan-400 text-[12px] flex items-center gap-1 mt-1 ml-2 font-semibold"><ExternalLink size={11} /> View Archive</a>}
          </div>
        ) : <div className="text-[13px] text-slate-500">Domain not in Internet Archive</div>}
      </Section>

      {/* RapidAPI Infra tools */}
      {d.rapidApiIntel?.subdomainScan?.count > 0 && (
        <Section title="Subdomain Scan" icon={Globe} badge={`${d.rapidApiIntel.subdomainScan.count} FOUND`} severity="info" open={false}>
          <div className="flex flex-wrap gap-1">
            {d.rapidApiIntel.subdomainScan.subdomains.map((sub, i) => <Pill key={i} color="cyan">{sub}</Pill>)}
          </div>
        </Section>
      )}

      {d.rapidApiIntel?.subdomainFinder?.count > 0 && (
        <Section title="Subdomain Finder" icon={Globe} badge={`${d.rapidApiIntel.subdomainFinder.count} FOUND`} severity="info" open={false}>
          <div className="flex flex-wrap gap-1">
            {d.rapidApiIntel.subdomainFinder.subdomains.map((sub, i) => <Pill key={i} color="blue">{sub}</Pill>)}
          </div>
        </Section>
      )}

      {d.rapidApiIntel?.websiteSecurity && (
        <Section title="Website Security Audit" icon={Shield}
          badge={d.rapidApiIntel.websiteSecurity.grade || 'SCANNED'}
          severity={d.rapidApiIntel.websiteSecurity.score > 70 ? 'clean' : d.rapidApiIntel.websiteSecurity.score > 40 ? 'medium' : 'critical'}>
          <Row label="Grade" value={d.rapidApiIntel.websiteSecurity.grade} icon={Shield} />
          <Row label="Score" value={d.rapidApiIntel.websiteSecurity.score} icon={Activity} />
          {d.rapidApiIntel.websiteSecurity.vulnerabilities?.length > 0 && (
            <div className="mt-1 ml-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Vulnerabilities</div>
              {d.rapidApiIntel.websiteSecurity.vulnerabilities.slice(0, 10).map((v, i) => (
                <div key={i} className="text-[11px] text-red-400 py-0.5 border-b border-white/[0.03]">{typeof v === 'string' ? v : v.name || v.title || JSON.stringify(v)}</div>
              ))}
            </div>
          )}
          {d.rapidApiIntel.websiteSecurity.recommendations?.length > 0 && (
            <div className="mt-1 ml-2">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-0.5">Recommendations</div>
              {d.rapidApiIntel.websiteSecurity.recommendations.slice(0, 5).map((r, i) => (
                <div key={i} className="text-[11px] text-emerald-400 py-0.5">{typeof r === 'string' ? r : r.title || JSON.stringify(r)}</div>
              ))}
            </div>
          )}
        </Section>
      )}

      {d.rapidApiIntel?.netDetective && (
        <Section title="NetDetective Intelligence" icon={Server} badge="RECON" severity="info">
          <Row label="IP" value={d.rapidApiIntel.netDetective.ip} icon={Globe} />
          <Row label="Hosting" value={d.rapidApiIntel.netDetective.hosting} icon={Server} />
          <Row label="ASN" value={d.rapidApiIntel.netDetective.asn} icon={Hash} />
          <Row label="Location" value={typeof d.rapidApiIntel.netDetective.location === 'string' ? d.rapidApiIntel.netDetective.location : JSON.stringify(d.rapidApiIntel.netDetective.location)} icon={MapPin} />
          {d.rapidApiIntel.netDetective.technologies?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 ml-2">
              {d.rapidApiIntel.netDetective.technologies.slice(0, 20).map((t, i) => <Pill key={i} color="violet">{typeof t === 'string' ? t : t.name || t}</Pill>)}
            </div>
          )}
          {d.rapidApiIntel.netDetective.ports?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 ml-2">
              {d.rapidApiIntel.netDetective.ports.map((p, i) => <Pill key={i} color="orange">{p}</Pill>)}
            </div>
          )}
        </Section>
      )}

      {d.rapidApiIntel?.maliciousUrls && (
        <Section title="Malicious URL Check" icon={AlertTriangle}
          badge={d.rapidApiIntel.maliciousUrls.malicious ? 'MALICIOUS' : 'CLEAN'}
          severity={d.rapidApiIntel.maliciousUrls.malicious ? 'critical' : 'clean'}>
          <Row label="Malicious" value={d.rapidApiIntel.maliciousUrls.malicious ? 'YES' : 'No'} icon={AlertTriangle} />
          <Row label="Type" value={d.rapidApiIntel.maliciousUrls.threatType} icon={Shield} />
          <Row label="Score" value={d.rapidApiIntel.maliciousUrls.score} icon={Activity} />
        </Section>
      )}

      {d.rapidApiIntel?.maliciousScanner && (
        <Section title="Malicious Scanner" icon={Shield}
          badge={d.rapidApiIntel.maliciousScanner.safe ? 'SAFE' : 'THREAT'}
          severity={d.rapidApiIntel.maliciousScanner.safe === false ? 'critical' : 'clean'}>
          <Row label="Safe" value={d.rapidApiIntel.maliciousScanner.safe} icon={CheckCircle} />
          <Row label="Malware" value={d.rapidApiIntel.maliciousScanner.malware ? 'DETECTED' : 'None'} icon={AlertTriangle} />
          <Row label="Phishing" value={d.rapidApiIntel.maliciousScanner.phishing ? 'DETECTED' : 'None'} icon={AlertTriangle} />
          <Row label="Suspicious" value={d.rapidApiIntel.maliciousScanner.suspicious} icon={Eye} />
          <Row label="Score" value={d.rapidApiIntel.maliciousScanner.score} icon={Activity} />
        </Section>
      )}

      {d.rapidApiIntel?.sourcesActive?.length > 0 && (
        <Section title="Active RapidAPI Sources" icon={Zap} badge={`${d.rapidApiIntel.sourcesActive.length}/12`} severity="clean" open={false}>
          <div className="flex flex-wrap gap-1">
            {d.rapidApiIntel.sourcesActive.map((src, i) => <Pill key={i} color="emerald">{src}</Pill>)}
          </div>
        </Section>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   PANEL 6: FORENSICS — Headers, timeline, hashes
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ── Safe Panel Wrapper — catches panel render crashes ── */
const SafePanel = ({ children, name }) => {
  try {
    return children;
  } catch (e) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
        <div className="text-[13px] text-red-400 font-bold">{name} panel encountered an error</div>
        <div className="text-[11px] text-slate-600 mt-1 font-mono">{e?.message || 'Unknown error'}</div>
      </div>
    );
  }
};

class PanelErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error(`[Panel:${this.props.name}]`, error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
          <div className="text-[13px] text-red-400 font-bold">{this.props.name} panel encountered an error</div>
          <div className="text-[11px] text-slate-600 mt-1 font-mono break-all max-w-md mx-auto">{this.state.error?.message || 'Unknown render error'}</div>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg text-[12px] font-bold border border-cyan-500/25 hover:bg-cyan-500/15 transition-colors">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ForensicsPanel = ({ d }) => {
  const [rawHeaders, setRawHeaders] = useState('');
  const [headerData, setHeaderData] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [headerError, setHeaderError] = useState('');
  const toast = useToast();
  const events = Array.isArray(d.timeline) ? d.timeline : d.timeline?.events || [];
  const hashes = d.emailHashes || {};
  const val = d.validation || {};

  const parseHeaders = async () => {
    if (!rawHeaders.trim()) return;
    setParsing(true);
    setHeaderError('');
    try {
      const res = await fetch(`${API_BASE}/tools/email/parse-headers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: rawHeaders }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Parsing failed');
      setHeaderData(json);
      toast?.success?.(`Parsed ${json.totalHeaders} headers across ${json.hops?.length || 0} hops`);
    } catch (err) { setHeaderError(err.message); } finally { setParsing(false); }
  };

  return (
    <div className="space-y-3">
      {/* Header analysis */}
      <Section title="Email Header Analysis" icon={Terminal}>
        <textarea value={rawHeaders} onChange={e => setRawHeaders(e.target.value)}
          placeholder="Paste raw email headers here...&#10;&#10;Received: from mail.example.com...&#10;From: sender@example.com&#10;To: recipient@example.com"
          className="w-full h-28 bg-[#060a13] border border-[#1a2744] rounded-lg p-3 text-[13px] font-mono text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/10 resize-none osintx-scroll" />
        <div className="flex items-center gap-2 mt-2">
          <button onClick={parseHeaders} disabled={parsing || !rawHeaders.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400 rounded-lg text-[13px] font-bold border border-cyan-500/20 disabled:opacity-40 transition-colors">
            {parsing ? <RefreshCw size={12} className="animate-spin" /> : <Search size={12} />}
            {parsing ? 'Analyzing...' : 'Analyze Headers'}
          </button>
          {headerError && <span className="text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {headerError}</span>}
        </div>
      </Section>

      {/* Header results */}
      {headerData && (
        <>
          <div className={`p-3 rounded-lg border ${
            headerData.riskLevel === 'HIGH' ? 'bg-red-500/[0.06] border-red-500/20' :
            headerData.riskLevel === 'MEDIUM' ? 'bg-amber-500/[0.06] border-amber-500/20' :
            'bg-emerald-500/[0.06] border-emerald-500/15'}`}>
            <div className="flex items-center gap-2">
              <Shield size={14} className={headerData.riskLevel === 'HIGH' ? 'text-red-400' : headerData.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'} />
              <span className="text-[13px] font-bold text-slate-200 uppercase tracking-wider">Header Risk: {headerData.riskLevel}</span>
              <span className="text-[11px] text-slate-500 ml-auto font-mono">{headerData.totalHeaders} headers</span>
            </div>
          </div>

          <Section title="Key Headers" icon={Mail}>
            {Object.entries(headerData.keyHeaders || {}).filter(([, v]) => v).map(([k, v]) => (
              <Row key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={typeof v === 'string' ? v.substring(0, 200) : v} icon={Mail} />
            ))}
          </Section>

          <Section title="Authentication Results" icon={Lock}>
            {['spf', 'dkim', 'dmarc'].map(a => {
              const val2 = headerData.authentication?.[a];
              const pass = val2?.toLowerCase() === 'pass';
              return (
                <div key={a} className={`flex items-center gap-2 p-2.5 rounded-lg mb-1 ${
                  pass ? 'bg-emerald-500/[0.06] border border-emerald-500/15' :
                  val2 ? 'bg-red-500/[0.06] border border-red-500/15' :
                  'bg-[#0d1628]/40 border border-[#1a2744]'}`}>
                  {pass ? <CheckCircle size={12} className="text-emerald-400" /> : val2 ? <AlertTriangle size={12} className="text-red-400" /> : <Info size={12} className="text-slate-600" />}
                  <span className="text-[13px] text-slate-200 uppercase font-black font-mono min-w-[50px]">{a}</span>
                  <span className={`text-[13px] ${pass ? 'text-emerald-400' : val2 ? 'text-red-400' : 'text-slate-600'}`}>{val2 || 'Not found'}</span>
                </div>
              );
            })}
          </Section>

          {headerData.hops?.length > 0 && (
            <Section title="Email Route" icon={Activity} badge={`${headerData.hops.length} hops`}>
              <div className="relative">
                <div className="absolute left-[5px] top-0 bottom-0 w-px bg-cyan-500/10" />
                {headerData.hops.map((hop, i) => (
                  <div key={i} className="relative pl-6 pb-2.5 last:pb-0">
                    <div className="absolute left-0 top-1 w-[11px] h-[11px] rounded-full bg-cyan-500/15 border-2 border-cyan-400/40 flex items-center justify-center">
                      <span className="text-[7px] font-bold text-cyan-400">{hop.hop}</span>
                    </div>
                    <div className="border border-cyan-500/8 bg-[#0d1628]/40 rounded-lg p-2 text-[11px]">
                      {hop.from && <div className="text-slate-300"><span className="text-slate-500">from:</span> <span className="font-mono">{hop.from}</span></div>}
                      {hop.by && <div className="text-slate-300"><span className="text-slate-500">by:</span> <span className="font-mono">{hop.by}</span></div>}
                      {hop.ip && <div className="text-amber-400 font-mono">{hop.ip}</div>}
                      {hop.date && <div className="text-slate-500">{hop.date}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {headerData.extractedIPs?.length > 0 && (
            <Section title="Extracted IPs" icon={Globe} badge={headerData.extractedIPs.length}>
              {headerData.ipDetails?.map((ip, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-[#0d1628]/60 border border-[#1a2744] text-[11px] mb-0.5">
                  <span className="text-amber-400 font-mono min-w-[100px]">{ip.ip}</span>
                  <span className="text-slate-300 flex-1 truncate">{[ip.city, ip.country].filter(Boolean).join(', ') || 'Unknown'}</span>
                  <span className="text-slate-600 truncate max-w-[120px]">{ip.isp || ip.org || ''}</span>
                </div>
              ))}
            </Section>
          )}

          {/* Hop Delays & Transit Time */}
          {(headerData.hopDelays?.length > 0 || headerData.totalTransitTime) && (
            <Section title="Transit Analysis" icon={Clock} badge={headerData.totalTransitTime || ''}>
              {headerData.hopDelays?.map((hd, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded-lg mb-1 border ${hd.suspicious ? 'bg-amber-500/[0.06] border-amber-500/15' : 'bg-[#0d1628]/40 border-[#1a2744]'}`}>
                  <span className="text-[11px] text-slate-500 font-mono min-w-[60px]">Hop {hd.from}→{hd.to}</span>
                  <span className={`text-[13px] font-bold font-mono ${hd.suspicious ? 'text-amber-400' : 'text-slate-300'}`}>{hd.delay}</span>
                  {hd.suspicious && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 uppercase font-black ml-auto">Slow</span>}
                </div>
              ))}
            </Section>
          )}

          {/* ARC Chain */}
          {headerData.arcChain?.length > 0 && (
            <Section title="ARC Chain" icon={Shield} badge={`${headerData.arcChain.length} seals`}>
              {headerData.arcChain.map((arc, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#0d1628]/40 border border-[#1a2744] mb-1 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-mono font-bold">i={arc.instance}</span>
                    {arc.result && <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${arc.result === 'pass' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{arc.result}</span>}
                    {arc.domain && <span className="text-slate-400 font-mono">{arc.domain}</span>}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* Header Email Age (distinct from account email age) */}
          {headerData.emailAge && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#0d1628]/40 border border-[#1a2744]">
              <Clock size={12} className="text-cyan-400" />
              <span className="text-[13px] text-slate-400">Email Age:</span>
              <span className="text-[13px] text-white font-bold">{headerData.emailAge} days</span>
            </div>
          )}

          {headerData.suspiciousIndicators?.length > 0 && (
            <Section title="Suspicious Indicators" icon={AlertTriangle} badge={headerData.suspiciousIndicators.length}
              severity={headerData.riskLevel === 'HIGH' ? 'critical' : 'medium'}>
              {headerData.suspiciousIndicators.map((s, i) => {
                const sc = sev(s.severity);
                return (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${sc.bg} border ${sc.border} mb-1`}>
                    <AlertTriangle size={11} className={sc.text} />
                    <div className="flex-1">
                      <div className={`text-[13px] font-semibold ${sc.text}`}>{s.indicator}</div>
                      <div className="text-[11px] text-slate-500">{s.detail}</div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${sc.bg} ${sc.text} uppercase font-black`}>{s.severity}</span>
                  </div>
                );
              })}
            </Section>
          )}
        </>
      )}

      {!headerData && !parsing && (
        <div className="flex flex-col items-center py-6">
          <Terminal size={24} className="text-slate-600 mb-2" />
          <div className="text-[13px] text-slate-500">Paste raw email headers above to analyze</div>
          <div className="text-[11px] text-slate-600 mt-1 max-w-sm text-center">
            Analyzes routing, SPF/DKIM/DMARC authentication, geolocation, and suspicious indicators.
          </div>
        </div>
      )}

      {/* Timeline */}
      <Section title="Event Timeline" icon={Clock} badge={`${events.length} events`}>
        {events.length > 0 ? (
          <div className="relative">
            <div className="absolute left-[5px] top-1 bottom-1 w-px bg-cyan-500/10" />
            {events.map((e, i) => {
              const es = sev(e.severity || 'info');
              return (
                <div key={i} className="relative pl-6 pb-3 last:pb-0">
                  <div className={`absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 ${es.border} ${es.bg} flex items-center justify-center`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${es.dot}`} />
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[11px] font-mono text-slate-500 min-w-[70px] mt-0.5">{e.date}</span>
                    <div className="flex-1">
                      <span className="text-[13px] text-slate-200">{e.event}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1 py-0 rounded ${es.bg} ${es.text} uppercase font-black`}>{e.severity || 'info'}</span>
                        <span className="text-[11px] text-slate-500">{e.source}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="text-[13px] text-slate-500 py-3 text-center">No timeline events available</div>}
      </Section>

      {/* Email age */}
      {d.emailAge && (
        <Section title="Email Age Estimation" icon={Calendar}>
          <Row label="Estimated" value={d.emailAge.estimatedAge} icon={Calendar} />
          <Row label="Confidence" value={d.emailAge.confidence} icon={Shield} />
          {(d.emailAge.dataPoints || []).map((dp, i) => <Row key={i} label={dp.source} value={dp.date} icon={Clock} />)}
        </Section>
      )}

      {/* Enhanced: PGP Key Fingerprinting */}
      {d.enhancedEmail?.pgpKeys?.found && (
        <Section title="PGP Key Fingerprinting" icon={Key} badge={`${d.enhancedEmail.pgpKeys.keys.length} keys`} severity="info">
          {d.enhancedEmail.pgpKeys.keys.map((k, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-[#0d1628]/40 border border-[#1a2744] mb-1.5">
              <Row label="Server" value={k.server} icon={Server} />
              <Row label="Email" value={k.email} icon={Mail} />
              <div className="mt-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Key Preview</span>
                <div className="mt-1 text-[11px] font-mono text-amber-400/80 bg-[#060a13] p-2 rounded border border-[#1a2744] break-all max-h-20 overflow-y-auto">{k.keyPreview}</div>
              </div>
            </div>
          ))}
        </Section>
      )}
      {d.enhancedEmail?.pgpKeys && !d.enhancedEmail.pgpKeys.found && (
        <Section title="PGP Key Fingerprinting" icon={Key} severity="clean">
          <div className="text-[13px] text-slate-500 py-2 text-center">No PGP keys found for this email</div>
        </Section>
      )}

      {/* Enhanced: Email Age Timeline */}
      {d.enhancedEmail?.emailAge && (
        <Section title="Email Age & Breach Timeline" icon={Clock}
          badge={d.enhancedEmail.emailAge.ageDays ? `${d.enhancedEmail.emailAge.ageDays}d` : 'N/A'}>
          {d.enhancedEmail.emailAge.ageDays && (
            <Row label="Age (days)" value={d.enhancedEmail.emailAge.ageDays} icon={Calendar} />
          )}
          {d.enhancedEmail.emailAge.firstSeen && (
            <Row label="First Seen" value={d.enhancedEmail.emailAge.firstSeen} icon={Calendar} />
          )}
          {d.enhancedEmail.emailAge.lastSeen && (
            <Row label="Last Seen" value={d.enhancedEmail.emailAge.lastSeen} icon={Clock} />
          )}
          {d.enhancedEmail.emailAge.domainCreated && (
            <Row label="Domain Created" value={d.enhancedEmail.emailAge.domainCreated} icon={Globe} />
          )}
          {d.enhancedEmail.emailAge.credentialsLeaked !== undefined && (
            <Row label="Creds Leaked" value={d.enhancedEmail.emailAge.credentialsLeaked} icon={Key} />
          )}
          {d.enhancedEmail.emailAge.dataBreaches !== undefined && (
            <Row label="Data Breaches" value={d.enhancedEmail.emailAge.dataBreaches} icon={Database} />
          )}
          {d.enhancedEmail.emailAge.breachTimeline?.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Breach Timeline</span>
              {d.enhancedEmail.emailAge.breachTimeline.slice(0, 10).map((b, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-white/[0.03] text-[12px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400/60 shrink-0" />
                  <span className="text-slate-300 flex-1">{typeof b === 'string' ? b : b.name || b.domain}</span>
                  <span className="text-slate-600 font-mono">{typeof b === 'string' ? '' : b.date?.split('T')[0] || b.year}</span>
                </div>
              ))}
            </div>
          )}
          {d.enhancedEmail.emailAge.sources?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {d.enhancedEmail.emailAge.sources.map((s, i) => <Pill key={i} color="slate">{s}</Pill>)}
            </div>
          )}
        </Section>
      )}

      {/* Enhanced: Header IP Geo-trace */}
      {d.enhancedEmail?.headerGeo?.hops?.length > 0 && (
        <Section title="Header IP Geo-trace" icon={MapPin} badge={`${d.enhancedEmail.headerGeo.totalHops} hops`}>
          <div className="relative">
            <div className="absolute left-[5px] top-0 bottom-0 w-px bg-cyan-500/10" />
            {d.enhancedEmail.headerGeo.hops.map((hop, i) => (
              <div key={i} className="relative pl-6 pb-3 last:pb-0">
                <div className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 flex items-center justify-center ${
                  i === d.enhancedEmail.headerGeo.hops.length - 1 ? 'border-emerald-400 bg-emerald-500/15' : 'border-cyan-400 bg-cyan-500/15'
                }`}>
                  <span className="text-[7px] font-bold text-cyan-400">{i + 1}</span>
                </div>
                <div className="border border-cyan-500/8 bg-[#0d1628]/40 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 font-mono text-[12px] font-bold">{hop.ip}</span>
                    {hop.countryCode && <span className="text-[10px] text-slate-500">{hop.countryCode}</span>}
                  </div>
                  {hop.location && <div className="text-[11px] text-slate-300">{hop.location}</div>}
                  <div className="flex flex-wrap gap-x-4 text-[10px] text-slate-500 mt-1">
                    {hop.isp && <span>ISP: {hop.isp}</span>}
                    {hop.asn && <span>ASN: {hop.asn}</span>}
                    {hop.timezone && <span>TZ: {hop.timezone}</span>}
                  </div>
                  {hop.lat && hop.lon && (
                    <a href={`https://www.google.com/maps?q=${hop.lat},${hop.lon}`} target="_blank" rel="noreferrer"
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 mt-1 inline-flex items-center gap-1">
                      <MapPin size={10} /> View on map
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {d.enhancedEmail.headerGeo.originatingIP && (
            <div className="mt-2 p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider font-bold">Originating IP:</span>
              <span className="text-[13px] text-amber-300 font-mono ml-2">{d.enhancedEmail.headerGeo.originatingIP}</span>
            </div>
          )}
        </Section>
      )}

      {/* Email hashes */}
      <Section title="Email Hashes" icon={Hash}>
        <div className="text-[10px] text-slate-600 mb-2 uppercase tracking-[0.15em] font-bold">For correlation with external databases and breach dumps</div>
        {Object.entries(hashes).map(([algo, hash]) => (
          <div key={algo} className="group flex items-center gap-2 py-1.5 border-b border-white/[0.03] last:border-0">
            <span className="text-[11px] text-cyan-500/70 uppercase font-black font-mono min-w-[50px]">{algo}</span>
            <span className="text-[13px] text-slate-300 font-mono flex-1 break-all select-all">{hash}</span>
            <Cp val={hash} />
          </div>
        ))}
      </Section>

      {/* Validation details */}
      <Section title="Validation Details" icon={CheckCircle}>
        <Row label="Format" value={val.format} icon={CheckCircle} />
        <Row label="Score" value={`${val.score || 0}%`} icon={BarChart3} />
        <Row label="Disposable" value={val.disposable} icon={AlertTriangle} />
        <Row label="Free Provider" value={val.freeProvider} icon={Info} />
        <Row label="Role Account" value={val.roleAccount} icon={User} />
        <Row label="Accept All" value={val.acceptAll} icon={Mail} />
        <Row label="Spoofable" value={val.spoofable} icon={AlertTriangle} />
      </Section>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT — EmailIntelTool
   ═══════════════════════════════════════════════════════════════════════════════ */

const EmailIntelTool = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (data) {
      setLastResult({ data: data, toolName: 'EmailIntel', query: email });
    }
  }, [data]);
  useEffect(() => () => setLastResult(null), []);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('brief');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMenu, setReportMenu] = useState(false);
  const [reportPreview, setReportPreview] = useState(null); // { text, reportType, fileFormat, meta }
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy: copyText } = useClipboard();
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (!data) return;
      const map = { '1': 'brief', '2': 'threats', '3': 'breaches', '4': 'identity', '5': 'infra', '6': 'forensics' };
      if (e.altKey && map[e.key]) { e.preventDefault(); setActiveTab(map[e.key]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [data, onClose]);

  /* API: Run analysis */
  const runAnalysis = useCallback(async () => {
    if (!email.trim()) return;
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch(`${API_BASE}/tools/email/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Analysis failed');
      setData(json);
      setActiveTab('brief');
      addToHistory?.({ tool: 'Email Intelligence', query: email, timestamp: Date.now() });
      trackToolUsage('email-intel', 'scan', { domain: email.split('@')[1] });
      (async () => {
        try {
          const enhRes = await fetch(`${API_BASE}/tools/email/enhanced`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim() }),
          });
          if (enhRes.ok) {
            const enhJson = await enhRes.json();
            json.enhancedEmail = enhJson;
            setData({...json});
          }
        } catch (e) { /* non-critical */ }
      })();
    } catch (err) {
      setError(err.message);
      toast?.error?.(err.message);
    } finally { setLoading(false); }
  }, [email]);

  /* API: Preview report (fetch text first, then user can download) */
  const previewReport = useCallback(async (reportType = 'cyber', fileFormat = 'text') => {
    if (!data) return;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tools/email/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, format: 'json', reportType }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Failed (${res.status})`); }
      const json = await res.json();
      setReportPreview({ text: json.report, meta: json.meta, reportType, fileFormat });
    } catch (err) {
      console.error('Preview error:', err);
      toast?.error?.(err.message);
    } finally { setReportLoading(false); }
  }, [data]);

  /* API: Download report (direct file download) */
  const downloadReport = useCallback(async (reportType = 'cyber', fileFormat = 'text') => {
    if (!data) return;
    setReportLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tools/email/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, format: fileFormat, reportType }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Failed (${res.status})`); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.style.display = 'none';
      const ext = fileFormat === 'pdf' ? 'pdf' : fileFormat === 'docx' ? 'docx' : 'txt';
      a.download = `OSINTX-${reportType === 'corporate' ? 'Corporate' : 'CyberIntel'}-${data.investigationMeta?.caseRef || 'unknown'}.${ext}`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
      toast?.success?.(`${ext.toUpperCase()} report downloaded`);
    } catch (err) {
      console.error('Report error:', err);
      toast?.error?.(err.message);
    } finally { setReportLoading(false); }
  }, [data]);

  /* API: Copy report */
  const copyFullReport = useCallback(async (reportType = 'cyber') => {
    if (!data) return;
    try {
      const res = await fetch(`${API_BASE}/tools/email/report`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, format: 'json', reportType }),
      });
      if (!res.ok) throw new Error('Failed to generate report');
      const json = await res.json();
      await navigator.clipboard.writeText(json.report);
      toast?.success?.('Report copied to clipboard');
    } catch (err) {
      toast?.error?.('Copy failed: ' + err.message);
    }
  }, [data]);

  /* Badge counts */
  const badges = useMemo(() => {
    if (!data) return {};
    return {
      breaches: data.breachSummary?.total || 0,
      identity: data.registeredCount || 0,
      infra: data.typosquatting?.active?.length || 0,
      threats: data.darkWebIndicators?.found ? data.darkWebIndicators.totalIndicators : 0,
    };
  }, [data]);

  /* Panel renderer */
  const renderPanel = () => {
    if (!data) return null;
    switch (activeTab) {
      case 'brief': return <PanelErrorBoundary name="Brief"><BriefPanel d={data} setActiveTab={setActiveTab} /></PanelErrorBoundary>;
      case 'threats': return <PanelErrorBoundary name="Threats"><ThreatPanel d={data} /></PanelErrorBoundary>;
      case 'breaches': return <PanelErrorBoundary name="Breaches"><BreachPanel d={data} /></PanelErrorBoundary>;
      case 'identity': return <PanelErrorBoundary name="Identity"><IdentityPanel d={data} /></PanelErrorBoundary>;
      case 'infra': return <PanelErrorBoundary name="Infra"><InfraPanel d={data} /></PanelErrorBoundary>;
      case 'forensics': return <PanelErrorBoundary name="Forensics"><ForensicsPanel d={data} /></PanelErrorBoundary>;
      default: return <PanelErrorBoundary name="Brief"><BriefPanel d={data} setActiveTab={setActiveTab} /></PanelErrorBoundary>;
    }
  };

  /* Threat level */
  const riskScore = data?.riskAssessment?.riskScore || 0;
  const riskLevel = data?.riskAssessment?.riskLevel || 'clean';
  const threatColor = riskScore > 70 ? 'text-red-400' : riskScore > 40 ? 'text-amber-400' : riskScore > 20 ? 'text-blue-400' : 'text-emerald-400';
  const threatBg = riskScore > 70 ? 'bg-red-500' : riskScore > 40 ? 'bg-amber-500' : riskScore > 20 ? 'bg-blue-500' : 'bg-emerald-500';
  const threatGlow = riskScore > 70 ? 'shadow-red-500/20' : riskScore > 40 ? 'shadow-amber-500/15' : 'shadow-cyan-500/10';

  /* ═══════════════ RENDER ═══════════════ */

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2">
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }}
        className={`relative w-full max-w-[1440px] max-h-[96vh] flex flex-col bg-[#060a13] rounded-2xl border border-[#1a2744] shadow-2xl ${threatGlow} overflow-hidden`}>
        <HudBg />

        {/* ═══════ HEADER ═══════ */}
        <div className="relative z-10 flex items-center gap-3 px-4 py-2.5 border-b border-[#1a2744] bg-[#0a1120]/95 backdrop-blur-sm shrink-0">
          {/* TLP + Logo */}
          <span className="px-1.5 py-0.5 text-[9px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded tracking-[0.15em]">TLP:CLEAR</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/25 flex items-center justify-center">
              <Crosshair size={16} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-[12px] font-black text-slate-200 tracking-[0.2em] uppercase leading-tight">OSINT-X</div>
              <div className="text-[9px] text-slate-600 tracking-[0.15em] uppercase font-bold">SIGINT v3.2</div>
            </div>
          </div>

          <div className="w-px h-7 bg-[#1a2744]" />

          {/* Search (when data exists) */}
          {data && (
            <div className="flex-1 flex items-center gap-2 max-w-md">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-cyan-600/50 font-mono font-bold">$</span>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !loading && runAnalysis()}
                  className="w-full pl-7 pr-3 py-1.5 bg-[#060a13] border border-[#1a2744] rounded-lg text-[13px] font-mono text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all" />
              </div>
              <button onClick={runAnalysis} disabled={loading || !email.trim()}
                className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400 rounded-lg text-[12px] font-black uppercase tracking-wider border border-cyan-500/25 disabled:opacity-40 transition-colors">
                {loading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
              </button>
            </div>
          )}

          {/* Threat bar */}
          {data && (
            <div className="flex items-center gap-2 px-2">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">THREAT</span>
              <div className="w-20 h-1.5 bg-[#0d1628] rounded-full overflow-hidden border border-[#1a2744]">
                <motion.div className={`h-full rounded-full ${threatBg}`}
                  initial={{ width: 0 }} animate={{ width: `${riskScore}%` }} transition={{ duration: 1.2 }} />
              </div>
              <span className={`text-[13px] font-black font-mono ${threatColor}`}>{riskScore}</span>
            </div>
          )}

          <div className="flex-1" />

          {/* Report actions */}
          {data && (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button onClick={() => setReportMenu(!reportMenu)} disabled={reportLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-cyan-500/10 text-cyan-300 rounded-lg hover:bg-cyan-500/15 border border-cyan-500/25 disabled:opacity-40 transition-colors font-bold">
                  <Download size={13} /> {reportLoading ? 'Generating...' : 'Reports'}
                  <ChevronDown size={11} />
                </button>
                {reportMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0a1120] border border-[#1a2744] rounded-xl shadow-2xl shadow-black/60 z-50 py-1"
                    onMouseLeave={() => setReportMenu(false)}>
                    <div className="px-3 py-1.5 text-[9px] font-black text-cyan-500 uppercase tracking-[0.2em] border-b border-[#1a2744]">Cyber Investigation</div>
                    {[
                      { label: 'Plain Text (.txt)', type: 'cyber', fmt: 'text', icon: FileText, c: 'text-cyan-400' },
                      { label: 'PDF Report (.pdf)', type: 'cyber', fmt: 'pdf', icon: FileText, c: 'text-red-400' },
                      { label: 'Word Doc (.docx)', type: 'cyber', fmt: 'docx', icon: FileText, c: 'text-blue-400' },
                    ].map((r, i) => (
                      <button key={`c-${i}`} onClick={() => { previewReport(r.type, r.fmt); setReportMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-300 hover:bg-cyan-500/10 transition-colors group">
                        <r.icon size={13} className={r.c} />
                        <span className="flex-1 text-left">{r.label}</span>
                        <Eye size={11} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </button>
                    ))}
                    <div className="px-3 py-1.5 text-[9px] font-black text-violet-400 uppercase tracking-[0.2em] border-y border-[#1a2744] mt-0.5">Corporate Assessment</div>
                    {[
                      { label: 'Plain Text (.txt)', type: 'corporate', fmt: 'text', icon: FileText, c: 'text-violet-400' },
                      { label: 'PDF Report (.pdf)', type: 'corporate', fmt: 'pdf', icon: FileText, c: 'text-red-400' },
                      { label: 'Word Doc (.docx)', type: 'corporate', fmt: 'docx', icon: FileText, c: 'text-blue-400' },
                    ].map((r, i) => (
                      <button key={`p-${i}`} onClick={() => { previewReport(r.type, r.fmt); setReportMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-slate-300 hover:bg-cyan-500/10 transition-colors group">
                        <r.icon size={13} className={r.c} />
                        <span className="flex-1 text-left">{r.label}</span>
                        <Eye size={11} className="text-slate-600 group-hover:text-violet-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => copyFullReport()}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/15 border border-emerald-500/25 transition-colors font-bold">
                <Copy size={12} /> Copy
              </button>
              <button onClick={() => exportToJSON(data, `email-intel-${email}`)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[12px] bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/15 border border-amber-500/25 transition-colors font-bold">
                <Download size={12} /> JSON
              </button>
            </div>
          )}

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/8 text-slate-600 hover:text-slate-300 transition-colors ml-1">
            <X size={16} />
          </button>
        </div>

        {/* ═══════ MAIN AREA ═══════ */}
        <div className="relative z-10 flex-1 flex overflow-hidden">

          {/* ── IDLE: Landing page ── */}
          {!loading && !data && !error && (
            <div className="flex-1 flex flex-col items-center justify-center px-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl">
                {/* Logo */}
                <div className="relative inline-block mb-10">
                  <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/[0.08]">
                    <Crosshair size={48} className="text-cyan-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-400/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute top-1 -left-1 w-3 h-3 rounded-full bg-emerald-400/15 animate-pulse" />
                  <div className="absolute top-0 right-0 px-1.5 py-0.5 text-[8px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded tracking-[0.15em]">TLP:CLEAR</div>
                </div>

                <h1 className="text-3xl font-black text-slate-100 tracking-[0.25em] uppercase mb-2">OSINT-X SIGINT</h1>
                <p className="text-[13px] text-slate-500 tracking-[0.15em] uppercase mb-1 font-bold">Email Intelligence Aggregator</p>
                <p className="text-[11px] text-slate-600 tracking-[0.1em] uppercase mb-10">v3.2.0 — 37+ OSINT Sources — Real-Time Intelligence</p>

                {/* Terminal input */}
                <div className="max-w-xl mx-auto mb-10">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <span className="text-cyan-500/50 font-mono text-[14px] font-bold">$</span>
                      <span className="text-cyan-500/30 font-mono text-[11px]">investigate</span>
                    </div>
                    <input ref={inputRef} value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !loading && runAnalysis()}
                      placeholder="target@email.com"
                      className="w-full pl-28 pr-40 py-4 bg-[#0a1120] border-2 border-[#1a2744] rounded-xl text-lg font-mono text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/10 focus:shadow-xl focus:shadow-cyan-500/[0.06] transition-all" />
                    <button onClick={runAnalysis} disabled={loading || !email.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-400 rounded-lg text-[13px] font-black uppercase tracking-[0.15em] border border-cyan-500/25 disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-cyan-500/10">
                      Investigate
                    </button>
                  </div>
                  {error && <div className="mt-3 text-[13px] text-red-400 flex items-center gap-1.5"><AlertTriangle size={13} /> {error}</div>}
                </div>

                {/* Capabilities grid */}
                <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-8">
                  {[
                    { icon: Database, label: 'Breach Intelligence', desc: 'HIBP, XposedOrNot, Hudson Rock' },
                    { icon: Fingerprint, label: 'Identity Resolution', desc: 'Holehe, Sherlock, Maigret' },
                    { icon: Server, label: 'Infrastructure Recon', desc: 'DNS, Certs, VirusTotal' },
                    { icon: Eye, label: 'Dark Web Monitoring', desc: 'Credential exposure tracking' },
                    { icon: Radio, label: 'Phone Intelligence', desc: 'Cross-reference phone data' },
                    { icon: Shield, label: 'Threat Assessment', desc: 'MITRE ATT&CK, IOC search' },
                    { icon: Lock, label: 'Cert Transparency', desc: 'crt.sh subdomain enum' },
                    { icon: AlertTriangle, label: 'Typosquatting Scan', desc: 'Phishing domain detection' },
                    { icon: Terminal, label: 'Header Forensics', desc: 'Full email header analysis' },
                  ].map((cap, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg border border-[#1a2744] bg-[#0a1120]/40 hover:bg-[#0d1628]/60 transition-colors text-left">
                      <cap.icon size={16} className="text-cyan-500/50 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-[12px] text-slate-300 font-bold uppercase tracking-wider">{cap.label}</div>
                        <div className="text-[10px] text-slate-600">{cap.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-600 tracking-wider uppercase font-bold">Press Enter or click Investigate to begin · ESC to close</p>
              </motion.div>
            </div>
          )}

          {/* ── LOADING: Scan HUD ── */}
          {loading && !data && (
            <div className="flex-1 overflow-y-auto osintx-scroll">
              <ScanHUD />
            </div>
          )}

          {/* ── RESULTS: Sidebar + Content ── */}
          {data && (
            <>
              {/* Navigation sidebar */}
              <nav className="w-[130px] border-r border-[#1a2744] bg-[#0a1120]/70 flex flex-col shrink-0 py-2">
                {NAV_ITEMS.map((nav, idx) => {
                  const isActive = activeTab === nav.id;
                  const badge = badges[nav.id];
                  return (
                    <button key={nav.id} onClick={() => setActiveTab(nav.id)}
                      title={`${nav.label} (Alt+${idx + 1})`}
                      className={`relative flex items-center gap-2 px-3 py-2.5 mx-1.5 mb-0.5 rounded-lg transition-all text-left ${
                        isActive
                          ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-[#111d33]/40 border border-transparent'}`}>
                      {isActive && <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-cyan-400 rounded-r" />}
                      <nav.icon size={15} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-black uppercase tracking-[0.1em] leading-tight truncate">{nav.label}</div>
                        <div className="text-[9px] text-slate-600 leading-tight truncate">{nav.desc}</div>
                      </div>
                      {badge > 0 && (
                        <div className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black shadow-lg ${
                          nav.id === 'breaches' || nav.id === 'threats' ? 'bg-red-500 text-white' :
                          nav.id === 'infra' ? 'bg-red-500 text-white' :
                          'bg-emerald-500 text-white'}`}>{badge}</div>
                      )}
                    </button>
                  );
                })}

                {/* Bottom stats */}
                <div className="mt-auto px-3 py-3 border-t border-[#1a2744] space-y-2">
                  <div className="text-center">
                    <div className={`text-lg font-black font-mono ${threatColor}`}>{riskScore}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-[0.15em] font-bold">Risk Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-black font-mono text-slate-300">{data.investigationMeta?.sourceCount || 0}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-[0.15em] font-bold">Sources</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-mono text-slate-500">{data.investigationMeta?.searchDuration || '—'}</div>
                    <div className="text-[9px] text-slate-600 uppercase tracking-[0.15em] font-bold">Duration</div>
                  </div>
                </div>
              </nav>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto osintx-scroll p-4">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}>
                    {renderPanel()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* ═══════ FOOTER / STATUS BAR ═══════ */}
        {data && (
          <div className="relative z-10 flex items-center gap-3 px-4 py-2 border-t border-[#1a2744] bg-[#0a1120]/95 shrink-0">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
              <Crosshair size={11} className="text-cyan-600/50" />
              <span className="text-cyan-400/80 font-bold">{data.investigationMeta?.caseRef}</span>
            </div>
            <div className="w-px h-3.5 bg-[#1a2744]" />
            <span className="text-[11px] font-mono text-slate-600">{data.investigationMeta?.sourceCount} sources</span>
            <div className="w-px h-3.5 bg-[#1a2744]" />
            <span className="text-[11px] font-mono text-slate-600">{data.investigationMeta?.searchDuration}</span>
            <div className="w-px h-3.5 bg-[#1a2744]" />
            <span className={`text-[11px] font-mono font-black ${threatColor}`}>{riskLevel?.toUpperCase()}</span>
            <div className="w-px h-3.5 bg-[#1a2744]" />
            <span className="text-[11px] font-mono text-slate-600">Evidence: {data.investigationMeta?.evidenceGrade}</span>
            <div className="flex-1" />
            <span className="text-[10px] font-mono text-slate-700">Keyboard: Alt+1..6 Navigate · ESC Close</span>
            <div className="w-px h-3.5 bg-[#1a2744]" />
            <span className="text-[10px] font-mono text-slate-700">v{data.investigationMeta?.toolVersion || '3.2.0'}</span>
          </div>
        )}

        {/* ═══════ CUSTOM STYLES ═══════ */}
        <style>{`
          .osintx-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
          .osintx-scroll::-webkit-scrollbar-track { background: transparent; }
          .osintx-scroll::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.12); border-radius: 99px; }
          .osintx-scroll::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.25); }
        `}</style>
      </motion.div>

      {/* ═══════ REPORT PREVIEW MODAL ═══════ */}
      <AnimatePresence>
        {reportPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setReportPreview(null)}>
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#060a13] rounded-2xl border border-[#1a2744] shadow-2xl shadow-cyan-500/5 overflow-hidden">

              {/* Preview Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1a2744] bg-[#0a1120]/95 shrink-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  reportPreview.reportType === 'corporate'
                    ? 'bg-violet-500/15 border-violet-500/25'
                    : 'bg-cyan-500/15 border-cyan-500/25'
                }`}>
                  <Eye size={16} className={reportPreview.reportType === 'corporate' ? 'text-violet-400' : 'text-cyan-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-slate-200">
                    {reportPreview.reportType === 'corporate' ? 'Corporate Security Assessment' : 'Cyber Investigation Report'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-mono">{reportPreview.meta?.caseRef || data?.investigationMeta?.caseRef}</span>
                    <span>•</span>
                    <span className="uppercase font-bold">
                      {reportPreview.fileFormat === 'pdf' ? 'PDF' : reportPreview.fileFormat === 'docx' ? 'DOCX' : 'TXT'} format selected
                    </span>
                    <span>•</span>
                    <span>{reportPreview.text?.length?.toLocaleString()} chars</span>
                  </div>
                </div>

                {/* Format switcher pills */}
                <div className="flex items-center gap-1 bg-[#0d1628] rounded-lg p-0.5 border border-[#1a2744]">
                  {[
                    { fmt: 'text', label: 'TXT', active: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
                    { fmt: 'pdf', label: 'PDF', active: 'bg-red-500/20 text-red-400 border-red-500/30' },
                    { fmt: 'docx', label: 'DOCX', active: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
                  ].map(f => (
                    <button key={f.fmt}
                      onClick={() => setReportPreview(prev => ({ ...prev, fileFormat: f.fmt }))}
                      className={`px-2.5 py-1 text-[11px] font-black uppercase rounded-md transition-all border ${
                        reportPreview.fileFormat === f.fmt
                          ? f.active
                          : 'text-slate-500 hover:text-slate-300 border-transparent'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                <button onClick={() => setReportPreview(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Preview Body */}
              <div className="flex-1 overflow-y-auto osintx-scroll bg-[#080c15]">
                <pre className="p-5 text-[12px] leading-relaxed text-slate-300 font-mono whitespace-pre-wrap break-words selection:bg-cyan-500/20">
                  {reportPreview.text}
                </pre>
              </div>

              {/* Preview Footer — Action Buttons */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-t border-[#1a2744] bg-[#0a1120]/95 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-1">
                  <Info size={12} />
                  <span>Preview shows the text version. Download will use your selected format.</span>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(reportPreview.text);
                      toast?.success?.('Report copied to clipboard');
                    } catch (err) { toast?.error?.('Copy failed'); }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-[12px] bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/15 border border-emerald-500/25 transition-colors font-bold">
                  <Copy size={13} /> Copy Text
                </button>

                <button
                  disabled={reportLoading}
                  onClick={async () => {
                    await downloadReport(reportPreview.reportType, reportPreview.fileFormat);
                    setReportPreview(null);
                  }}
                  className="flex items-center gap-1.5 px-5 py-2 text-[12px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 rounded-lg hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 transition-all font-bold disabled:opacity-40 shadow-lg shadow-cyan-500/10">
                  <Download size={14} />
                  {reportLoading ? 'Generating...' : `Download ${reportPreview.fileFormat === 'pdf' ? 'PDF' : reportPreview.fileFormat === 'docx' ? 'Word Doc' : 'Text File'}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EmailIntelTool;
