import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../../context/SettingsContext';
import SaveToCaseModal from '../common/SaveToCaseModal';
import { api } from '../../services/api';
import EntityRelationshipGraph from './EntityRelationshipGraph';
import ProfessionalReport from './ProfessionalReport';
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, Beaker,
  CheckCircle, ChevronDown, ChevronRight, Clock, Clock3, Cpu, Download,
  Eye, FileText, Fingerprint, Folder, FolderTree, Globe, HelpCircle,
  History, Link, Mail, MessageCircle, Network, PanelLeftOpen, PanelRightOpen,
  Pen, Phone, Plus, RefreshCw, Save, Search, Send, Share2, Sparkles,
  SquareTerminal, User, Wallet, Wifi, X, XCircle, MoreHorizontal,
  BookOpen, ExternalLink, List, GitBranch, Camera, Upload, ClipboardList, Zap,
  Shield, Siren, SlidersHorizontal,
} from 'lucide-react';

// ─── PLAYBOOK DEFINITIONS ───

const PLAYBOOKS = {
  'email_investigation': {
    label: 'Email Investigation',
    icon: 'Mail',
    steps: [
      { entityType: 'email', tools: ['GHunt', 'Alpha_X', 'Breach Check', 'Social Lookup'], maxPivots: 3 },
      { entityType: 'domain', tools: ['DNS Lookup', 'WHOIS', 'Subdomain Finder', 'Web Profiler'], maxPivots: 2 },
      { entityType: 'ip', tools: ['IP Lookup', 'ASN Lookup', 'Reputation Check'], maxPivots: 2 },
    ],
  },
  'domain_investigation': {
    label: 'Domain Investigation',
    icon: 'Globe',
    steps: [
      { entityType: 'domain', tools: ['DNS Lookup', 'WHOIS', 'Subdomain Finder', 'Web Profiler'], maxPivots: 3 },
      { entityType: 'ip', tools: ['IP Lookup', 'ASN Lookup', 'Port Scan'], maxPivots: 2 },
      { entityType: 'email', tools: ['GHunt', 'Breach Check'], maxPivots: 2 },
    ],
  },
  'identity_investigation': {
    label: 'Identity Investigation',
    icon: 'User',
    steps: [
      { entityType: 'email', tools: ['GHunt', 'Alpha_X', 'Social Lookup'], maxPivots: 3 },
      { entityType: 'username', tools: ['Alpha_X', 'Social Lookup', 'Username Search'], maxPivots: 3 },
      { entityType: 'phone', tools: ['Alpha_X', 'Reverse Lookup'], maxPivots: 2 },
    ],
  },
  'infrastructure_investigation': {
    label: 'Infrastructure Scan',
    icon: 'Network',
    steps: [
      { entityType: 'ip', tools: ['IP Lookup', 'ASN Lookup', 'Port Scan', 'Reputation Check'], maxPivots: 3 },
      { entityType: 'domain', tools: ['DNS Lookup', 'WHOIS', 'Web Profiler'], maxPivots: 2 },
    ],
  },
  'full_investigation': {
    label: 'Full Deep Dive',
    icon: 'Beaker',
    steps: [
      { entityType: 'email', tools: ['GHunt', 'Alpha_X'], maxPivots: 2 },
      { entityType: 'domain', tools: ['DNS Lookup', 'WHOIS', 'Subdomain Finder'], maxPivots: 2 },
      { entityType: 'ip', tools: ['IP Lookup', 'ASN Lookup', 'Port Scan'], maxPivots: 2 },
      { entityType: 'username', tools: ['Alpha_X', 'Username Search'], maxPivots: 2 },
      { entityType: 'phone', tools: ['Reverse Lookup'], maxPivots: 1 },
    ],
  },
};

// ─── ENTITY TYPE DEFINITIONS ───

const ENTITY_DEFS = [
  { id: 'email',    icon: Mail,       label: 'Email',       color: 'text-cyan-400',  bg: 'bg-cyan-500/15', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  { id: 'phone',    icon: Phone,      label: 'Phone',       color: 'text-violet-400', bg: 'bg-violet-500/15', pattern: /^\+?[\d\s\-()]{7,18}$/ },
  { id: 'domain',   icon: Globe,      label: 'Domain',      color: 'text-emerald-400',bg: 'bg-emerald-500/15', pattern: /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/ },
  { id: 'ip',       icon: Network,    label: 'IP Address',  color: 'text-amber-400',  bg: 'bg-amber-500/15', pattern: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/ },
  { id: 'username', icon: User,       label: 'Username',    color: 'text-pink-400',   bg: 'bg-pink-500/15', pattern: /^@?\w{3,30}$/ },
  { id: 'wallet',   icon: Wallet,     label: 'Wallet',      color: 'text-yellow-400', bg: 'bg-yellow-500/15', pattern: /^0x[a-fA-F0-9]{40}$/ },
  { id: 'url',      icon: Link,       label: 'URL',         color: 'text-sky-400',    bg: 'bg-sky-500/15', pattern: /^https?:\/\/[^\s]+$/ },
  { id: 'hash',     icon: Fingerprint,label: 'Hash',        color: 'text-rose-400',   bg: 'bg-rose-500/15', pattern: /^[a-fA-F0-9]{32,64}$/ },
];

const ENTITY_MAP = Object.fromEntries(ENTITY_DEFS.map(e => [e.id, e]));

// ─── TOOL DEFINITIONS ───

const TOOLS = {
  email:   ['GHunt', 'Alpha_X', 'Breach Check', 'Social Lookup'],
  phone:   ['Alpha_X', 'Social Lookup', 'Reverse Lookup'],
  domain:  ['DNS Lookup', 'WHOIS', 'Subdomain Finder', 'Web Profiler'],
  ip:      ['IP Lookup', 'ASN Lookup', 'Port Scan', 'Reputation Check'],
  username:['Alpha_X', 'Social Lookup', 'Username Search'],
  wallet:  ['Crypto Tracer', 'Chain Analysis', 'Exchange Check'],
  url:     ['DNS Lookup', 'Web Profiler', 'Screenshot'],
  hash:    ['Hash Lookup', 'VirusTotal'],
};

// ─── MOCK PIVOT DEFINITIONS (toolId → entityType → pivots[]) ───

const MOCK_PIVOTS = {
  'GHunt':             { email: ['username', 'domain'], domain: ['ip'], username: ['email'] },
  'Alpha_X':           { email: ['phone', 'domain', 'username'], phone: ['email', 'username'], domain: ['ip', 'email'], username: ['email', 'phone'] },
  'Breach Check':      { email: ['domain', 'hash'] },
  'Social Lookup':     { email: ['username', 'domain'], phone: ['username'], username: ['email'] },
  'Reverse Lookup':    { phone: ['email', 'username', 'domain'] },
  'DNS Lookup':        { domain: ['ip'], url: ['ip'] },
  'WHOIS':             { domain: ['email', 'ip'] },
  'Subdomain Finder':  { domain: ['domain'] },
  'Web Profiler':      { domain: ['url', 'email'], url: ['domain'] },
  'IP Lookup':         { ip: ['domain'] },
  'ASN Lookup':        { ip: ['domain'] },
  'Port Scan':         { ip: ['domain'] },
  'Reputation Check':  { ip: [] },
  'Username Search':   { username: ['email', 'domain'] },
  'Crypto Tracer':     { wallet: ['wallet'] },
  'Chain Analysis':    { wallet: ['wallet', 'domain'] },
  'Exchange Check':    { wallet: [] },
  'Screenshot':        { url: [] },
  'Hash Lookup':       { hash: [] },
  'VirusTotal':        { hash: [] },
};

// ─── MOCK ENTITY VALUES ───

const MOCK_VALS = {
  email:    ['contact@protonmail.com', 'admin@darkweb.io', 'user@signal.org', 'bot@telegram.org', 'info@onion.com'],
  phone:    ['+1-555-0192', '+44-7700-900123', '+7-495-123-4567', '+91-98765-43210', '+49-30-1234-5678'],
  domain:   ['malicious.com', 'c2-server.net', 'phish-page.org', 'darknet-market.io', 'proxy-relay.xyz'],
  ip:       ['45.33.32.156', '185.220.101.42', '198.51.100.73', '203.0.113.88', '104.28.7.115'],
  username: ['dark_ghost', 'phantom_sec', 'cipher_zero', 'nexus_h4x', 'silent_watcher'],
  wallet:   ['0x1a2b3c4d5e6f7890abcdef1234567890abcdef12', '0xdeadbeefcafe0123456789abcdef0123456789ab'],
  url:      ['https://malicious.com/login', 'https://c2-server.net/gate', 'https://phish-page.org/verify'],
  hash:     ['a3f5b8c9d1e2f4a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9', 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4'],
};

const STATUS_CFG = {
  new:           { label: 'New',         icon: AlertCircle,   cls: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  running:       { label: 'Running',     icon: RefreshCw,     cls: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
  has_findings:  { label: 'Has Findings',icon: CheckCircle,   cls: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  dead_end:      { label: 'Dead End',    icon: XCircle,       cls: 'text-red-400 bg-red-500/15 border-red-500/30' },
  loop:          { label: 'Loop',        icon: AlertTriangle, cls: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  needs_review:  { label: 'Needs Review',icon: HelpCircle,    cls: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
  low_confidence:{ label: 'Low Confidence',icon: AlertTriangle,cls: 'text-gray-400 bg-gray-500/15 border-gray-500/30' },
};

const LEAD_STATUS = ['new', 'accepted', 'investigating', 'resolved', 'ignored'];

// ─── HELPERS ───

let nodeIdCounter = 0;
const genId = () => `n_${++nodeIdCounter}`;
let leadIdCounter = 0;
const genLeadId = () => `l_${++leadIdCounter}`;

function classifyInput(text) {
  const trimmed = text.trim();
  for (const def of ENTITY_DEFS) {
    if (def.pattern.test(trimmed)) return def.id;
  }
  if (trimmed.startsWith('/')) return 'command';
  return 'general';
}

function extractEntities(type) {
  const vals = MOCK_VALS[type] || [];
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...vals].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(v => ({
    type,
    value: v,
    confidence: Math.floor(Math.random() * 30) + 60,
  }));
}

function getNextBestAction(tree, leads, mode) {
  const openLeads = leads.filter(l => l.status === 'new' || l.status === 'accepted');
  if (openLeads.length > 0) return { type: 'investigate_lead', lead: openLeads[0] };
  if (mode === 'autopilot-deep') {
    const allNodes = tree.filter(n => n.status !== 'dead_end' && n.status !== 'loop');
    if (allNodes.length > 0) return { type: 'run_tool', node: allNodes[allNodes.length - 1] };
  } else {
    const leafNodes = tree.filter(n => n.children.length === 0 && n.status !== 'dead_end' && n.status !== 'loop');
    if (leafNodes.length > 0) return { type: 'run_tool', node: leafNodes[leafNodes.length - 1] };
  }
  if (tree.length === 0) return { type: 'enter_indicator' };
  return { type: 'generate_poc' };
}

const sizePresets = {
  full: { top: 0, right: 0, bottom: 0, left: 0 },
  large: { top: '2%', right: '5%', bottom: '2%', left: '5%' },
  medium: { top: '4%', right: '12%', bottom: '4%', left: '12%' },
  compact: { top: '6%', right: '20%', bottom: '6%', left: '20%' },
};

// ─── SUB COMPONENTS ───

function TreeNode({ node, tree, selected, onSelect, depth }) {
  const [expanded, setExpanded] = useState(true);
  const children = tree.filter(n => n.parentId === node.id);
  const hasChildren = children.length > 0;
  const isSelected = selected?.id === node.id;
  const st = STATUS_CFG[node.status] || STATUS_CFG.new;
  const edef = ENTITY_MAP[node.type];
  const StatusIcon = st.icon;

  return (
    <div>
      <div
        className={`flex cursor-pointer items-center gap-1 rounded px-1.5 py-1 text-xs transition-colors ${
          isSelected ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-300 hover:bg-gray-800/50'
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => { onSelect(node); if (hasChildren) setExpanded(e => !e); }}
      >
        {hasChildren ? (
          <span className="text-gray-500">{expanded ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}</span>
        ) : <span className="w-2.5" />}
        <span className={`shrink-0 ${edef?.color || 'text-gray-400'}`}>
          {edef ? <edef.icon className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
        </span>
        <span className="truncate flex-1 ml-0.5">{node.label || node.value}</span>
        <span className={`text-[9px] px-1 rounded ${st.cls} flex items-center gap-0.5`}>
          <StatusIcon className="h-2 w-2" />
          {st.label}
        </span>
        {node.confidence && (
          <span className="text-[9px] text-gray-500">{node.confidence}%</span>
        )}
      </div>
      {expanded && children.map(child => (
        <TreeNode key={child.id} node={child} tree={tree} selected={selected} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
}

function LeadItem({ lead, onAccept, onIgnore }) {
  const edef = ENTITY_MAP[lead.type];
  const idx = ['new', 'accepted', 'investigating', 'resolved', 'ignored'].indexOf(lead.status);
  const colors = ['text-blue-400', 'text-cyan-400', 'text-amber-400', 'text-emerald-400', 'text-gray-500'];

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-800/40 bg-gray-900/30 px-2 py-1.5 text-xs">
      <span className={`shrink-0 ${edef?.color || 'text-gray-400'}`}>
        {edef ? <edef.icon className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="truncate text-gray-200">{lead.value}</div>
        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
          <span className={`${colors[idx] || 'text-gray-500'}`}>{lead.status}</span>
          <span>{lead.score}%</span>
          <span>{edef?.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          onClick={() => onAccept(lead)}
          className="rounded p-0.5 text-gray-500 hover:text-cyan-400 hover:bg-gray-800 transition-colors"
          title="Investigate"
        >
          <ArrowRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => onIgnore(lead)}
          className="rounded p-0.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
          title="Ignore"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}

function ClassificationTag({ type }) {
  if (type === 'command') return null;
  if (type === 'general') return <span className="text-[9px] text-gray-500 px-1.5 py-0.5 rounded bg-gray-800/50">General</span>;
  const edef = ENTITY_MAP[type];
  if (!edef) return null;
  return (
    <span className={`flex items-center gap-1 text-[9px] ${edef.color} ${edef.bg} px-1.5 py-0.5 rounded`}>
      <edef.icon className="h-2.5 w-2.5" />
      {edef.label}
    </span>
  );
}

function NextActionBar({ action, onAction }) {
  if (!action) return null;
  const icons = { investigate_lead: ArrowRight, run_tool: Beaker, enter_indicator: Search, generate_poc: FileText };
  const labels = {
    investigate_lead: 'Investigate lead',
    run_tool: 'Run tool on current node',
    enter_indicator: 'Enter an indicator to start',
    generate_poc: 'Generate POC report',
  };
  const Icon = icons[action.type] || Activity;
  return (
    <div className="flex items-center gap-2 border-t border-gray-800/40 bg-gray-900/60 px-3 py-1.5">
      <span className="text-[9px] uppercase tracking-wider text-gray-500 shrink-0">Next Action</span>
      <button
        onClick={() => onAction(action)}
        className="flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-1 text-[10px] text-cyan-400 hover:bg-cyan-500/20 transition-colors"
      >
        <Icon className="h-3 w-3" />
        {labels[action.type] || action.type}
      </button>
    </div>
  );
}

// ─── TYPING TEXT ───

function TypingText({ text, speed = 20, active = true, onComplete }) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active || !text) { setDisplayed(text || ''); return; }
    idxRef.current = 0;
    doneRef.current = false;
    setDisplayed('');
    const interval = setInterval(() => {
      idxRef.current++;
      setDisplayed(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length) {
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete?.();
        }
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active, onComplete]);

  return <span>{displayed}{active && displayed.length < (text || '').length ? <span className="animate-pulse text-cyan-400">▊</span> : null}</span>;
}

// ─── ENTITY PARSER ───

function parseMessageEntities(text) {
  if (!text) return [{ type: 'text', value: text || '' }];
  const segments = [];
  let remaining = text;
  while (remaining.length > 0) {
    let earliest = null;
    let earliestDef = null;
    for (const def of ENTITY_DEFS) {
      const m = remaining.match(def.pattern);
      if (m && m.index === 0) {
        const e = m[0];
        if (!earliest || e.length > earliest.value.length) {
          earliest = { value: e, entityType: def.id, entityLabel: def.label, color: def.color, bg: def.bg };
          earliestDef = def;
        }
      }
    }
    if (earliest) {
      segments.push({ type: 'text', value: remaining.slice(0, 0) });
      segments.push({ type: 'entity', ...earliest });
      remaining = remaining.slice(earliest.value.length);
    } else {
      const nextBreak = (() => {
        let minIdx = remaining.length;
        for (const def of ENTITY_DEFS) {
          const m = def.pattern.exec(remaining);
          if (m && m.index < minIdx) minIdx = m.index;
        }
        return minIdx;
      })();
      segments.push({ type: 'text', value: remaining.slice(0, nextBreak || remaining.length) });
      remaining = remaining.slice(nextBreak || remaining.length);
    }
  }
  return segments;
}

// ─── COMMAND PALETTE ───

function CommandPalette({ show, onClose, commands }) {
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (show) { setSearch(''); setSelectedIdx(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [show]);

  const filtered = useMemo(() => {
    if (!search.trim()) return commands;
    const q = search.toLowerCase();
    return commands.filter(c => c.label.toLowerCase().includes(q) || (c.keywords || '').toLowerCase().includes(q));
  }, [commands, search]);

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && filtered[selectedIdx]) { filtered[selectedIdx].action(); onClose(); }
    else if (e.key === 'Escape') onClose();
  }, [filtered, selectedIdx, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12%] bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.12 }}
        className="w-full max-w-lg rounded-xl border border-gray-700/50 bg-gray-900 shadow-2xl shadow-black/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-gray-800/60 px-4 py-3">
          <Search className="h-4 w-4 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600"
            placeholder="Type a command..."
          />
          <kbd className="rounded border border-gray-700/50 bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-500 font-mono">ESC</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1 custom-scrollbar">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              onClick={() => { cmd.action(); onClose(); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                i === selectedIdx ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-300 hover:bg-gray-800/50'
              }`}
            >
              <span className="text-base shrink-0 w-6 text-center">{cmd.icon}</span>
              <span className="flex-1">{cmd.label}</span>
              {cmd.shortcut && (
                <kbd className="rounded border border-gray-700/50 bg-gray-800/50 px-1.5 py-0.5 text-[9px] text-gray-600 font-mono">{cmd.shortcut}</kbd>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-gray-600">No commands match "<span className="text-gray-400">{search}</span>"</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── SPLASH OVERLAY ───

function SplashOverlay({ show, onComplete }) {
  const [phase, setPhase] = useState('fade_in');
  useEffect(() => {
    if (!show) return;
    setPhase('fade_in');
    const t1 = setTimeout(() => setPhase('visible'), 400);
    const t2 = setTimeout(() => setPhase('fade_out'), 2500);
    const t3 = setTimeout(() => onComplete?.(), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [show, onComplete]);

  if (!show) return null;

  const opacity = phase === 'fade_in' ? 'opacity-0' : phase === 'fade_out' ? 'opacity-0 scale-105' : 'opacity-100';

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center bg-gray-950 transition-all duration-500 ${opacity}`}>
      <div className="text-center">
        <pre className="text-[10px] sm:text-xs leading-tight text-cyan-400 font-mono tracking-wide mb-6 select-none">
{`╔═══╗  ╔══╗  ╔══════╗  ╔═══╗  ╔══════╗  ╔═══╗  ╔══╗  ╔══════╗  ╔═══╗  ╔════╗  ╔══════╗  ╔══╗
║╔═╗║  ║╔╗║  ║╔╗╔╗║  ║╔═╝  ║╔╗╔╗║  ║╔══╝  ║╔╗║  ║╔╗╔╗║  ║╔═╝  ║╔╗╔╗║  ║╔╗╔╗║  ║╔╗║
║║║║║  ║║║║  ╚╝║║╚╝  ║╚═╗  ╚╝║║╚╝  ║╚══╗  ║║║║  ╚╝║║╚╝  ║╚═╗    ║║    ║╚╝╚╝║  ║╚╝║
║║║║║  ║║║║    ║║    ╚═╗║    ║║    ╚══╗║  ║║║║    ║║    ╚═╗║    ║║    ╚══╗║  ║╔╗║
║╚═╝║  ║╚╝║    ║║    ╔═╝║    ║║    ╔══╝║  ║╚╝║    ║║    ╔═╝║    ║║    ╔══╝║  ║║║║
╚═══╝  ╚══╝    ╚╝    ╚══╝    ╚╝    ╚═══╝  ╚══╝    ╚╝    ╚══╝    ╚╝    ╚═══╝  ╚╝╚╝`}</pre>
        <div className="flex items-center justify-center gap-3 text-xs text-gray-600 font-mono">
          <span className="text-cyan-400">◆</span>
          <TypingText text="Initializing investigation engine..." speed={30} active={phase === 'visible'} />
        </div>
      </div>
    </div>
  );
}

// ─── ENTITY GRAPH (FOCUS MODE) ───

function EntityGraph({ tree, selectedNode, onSelect }) {
  const svgRef = useRef(null);

  const layout = useMemo(() => {
    if (tree.length === 0) return { nodes: [], edges: [] };
    const nodeMap = {};
    const edgeList = [];

    const walk = (nodes, depth, xStart, xEnd) => {
      const siblings = nodes.filter(n => !n.parentId || nodes.some(p => p.id === n.parentId));
      // Actually just lay out all root-level nodes
      const roots = tree.filter(n => !n.parentId);
      const rootCount = roots.length;

      // Position roots at the top
      roots.forEach((root, i) => {
        const x = ((i + 0.5) / rootCount) * 800;
        nodeMap[root.id] = { ...root, x, y: 60 };
        layoutChildren(root, tree, 0);
      });

      function layoutChildren(parent, allNodes, depth) {
        const children = allNodes.filter(c => c.parentId === parent.id);
        if (children.length === 0) return;
        const parentPos = nodeMap[parent.id];
        const totalSpan = 200;
        const startX = parentPos.x - totalSpan / 2;
        children.forEach((child, i) => {
          const cx = startX + ((i + 0.5) / children.length) * totalSpan;
          const cy = parentPos.y + 90;
          nodeMap[child.id] = { ...child, x: cx, y: cy };
          edgeList.push({ from: parent.id, to: child.id, fx: parentPos.x, fy: parentPos.y, tx: cx, ty: cy });
          layoutChildren(child, allNodes, depth + 1);
        });
      }
    };

    walk(tree, 0, 0, 800);
    return { nodes: Object.values(nodeMap), edges: edgeList };
  }, [tree]);

  const getNodeColor = (type) => {
    const colors = {
      email: '#22d3ee', phone: '#a78bfa', domain: '#34d399', ip: '#fbbf24',
      username: '#f472b6', wallet: '#facc15', url: '#38bdf8', hash: '#fb7185',
    };
    return colors[type] || '#6b7280';
  };

  return (
    <svg ref={svgRef} className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {layout.edges.map((edge, i) => (
        <line key={i} x1={edge.fx} y1={edge.fy} x2={edge.tx} y2={edge.ty} stroke="#374151" strokeWidth="1.5" strokeDasharray="4 3" />
      ))}
      {layout.nodes.map((n) => {
        const isSelected = selectedNode?.id === n.id;
        const color = getNodeColor(n.type);
        return (
          <g key={n.id} onClick={() => onSelect(n)} className="cursor-pointer">
            <circle cx={n.x} cy={n.y} r={isSelected ? 18 : 14} fill={isSelected ? color : `${color}33`} stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} filter={isSelected ? 'url(#glow)' : undefined} />
            <text x={n.x} y={n.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontFamily="monospace" pointerEvents="none">
              {n.value?.substring(0, isSelected ? 14 : 8)}
            </text>
            {isSelected && (
              <text x={n.x} y={n.y + 28} textAnchor="middle" fill={color} fontSize="8" fontFamily="monospace">
                {n.confidence}%
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── PROFESSIONAL POC HELPERS ───

const escapeMarkdownCell = (value) => String(value ?? 'N/A').replace(/\|/g, '\\|').replace(/\n/g, ' ');

const makeMarkdownTable = (headers, rows) => {
  if (!rows.length) return '_No records available._';
  const header = `| ${headers.map(escapeMarkdownCell).join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${row.map(escapeMarkdownCell).join(' | ')} |`).join('\n');
  return [header, divider, body].join('\n');
};

const renderInlineText = (text) => {
  const safe = String(text || '');
  const parts = safe.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-gray-950">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

const severityBadgeClass = (value) => {
  const level = String(value || '').toLowerCase();
  if (level === 'critical') return 'bg-red-100 text-red-700 border-red-200';
  if (level === 'high') return 'bg-orange-100 text-orange-700 border-orange-200';
  if (level === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
  return '';
};

const parseMarkdownTable = (lines, startIndex) => {
  const tableLines = [];
  let index = startIndex;
  while (index < lines.length && lines[index].trim().startsWith('|')) {
    tableLines.push(lines[index]);
    index += 1;
  }
  const rows = tableLines
    .filter((line, lineIndex) => lineIndex !== 1)
    .map(line => line.split('|').slice(1, -1).map(cell => cell.trim()));
  return { rows, nextIndex: index };
};

const buildTerminalPocMarkdown = (tree, leads, pocOutput, selectedNode) => {
  const now = new Date().toLocaleString();
  const nodeCount = tree.length;
  const leadCount = leads.length;
  const openLeads = leads.filter(l => l.status === 'new' || l.status === 'accepted').length;
  const findings = tree.filter(n => n.status === 'has_findings').length;
  const deadEnds = tree.filter(n => n.status === 'dead_end').length;
  const avgConfidence = tree.length ? Math.round(tree.reduce((s, n) => s + (n.confidence || 0), 0) / tree.length) : 0;

  const indicatorRows = tree
    .filter(n => n.value)
    .map(n => [n.type?.toUpperCase() || 'UNKNOWN', n.value, n.status?.replace(/_/g, ' ') || 'new', `${n.confidence || 0}%`, n.tool || 'Manual']);

  const leadRows = leads
    .filter(l => l.status !== 'ignored')
    .map(l => [l.type?.toUpperCase() || 'UNKNOWN', l.value, l.status, `${l.score || 0}%`, l.source || 'Unknown']);

  const statusCounts = {};
  tree.forEach(n => { statusCounts[n.status] = (statusCounts[n.status] || 0) + 1; });
  const statusSummary = Object.entries(statusCounts).map(([s, c]) => `${s.replace(/_/g, ' ')}: ${c}`).join(', ');

  const sections = [
    `# OsintX Report`,
    `## Investigation Terminal Report`,
    '',
    `*This report was automatically generated by the OsintX Investigation Terminal on ${now}. It captures the full entity tree, lead pipeline, and investigation log from the session.*`,
    '',
    `| | |`,
    `|---|---|`,
    `| **Generated** | ${now} |`,
    `| **Entities Investigated** | ${nodeCount} |`,
    `| **Leads Generated** | ${leadCount} (${openLeads} open) |`,
    `| **Findings** | ${findings} |`,
    `| **Dead Ends** | ${deadEnds} |`,
    `| **Average Confidence** | ${avgConfidence}% |`,
    `| **Status Distribution** | ${statusSummary} |`,
    '',
    '---',
    '',
    '## 1. Executive Summary',
    `This POC report was generated from an interactive terminal investigation of ${nodeCount} entities across ${Object.keys(
      tree.reduce((acc, n) => { acc[n.type] = true; return acc; }, {})
    ).length || 0} entity types. The investigation produced ${leadCount} leads (${openLeads} actionable) with an average confidence of ${avgConfidence}%.`,
    '',
    `The evidence chain below converts the investigation tree into a reproducible POC format suitable for investigator review, reporting, and case evidence preservation.`,
    '',
    '## 2. Scope And Source Material',
    makeMarkdownTable(['Metric', 'Value'], [
      ['Entities investigated', nodeCount],
      ['Entity types', Object.keys(tree.reduce((acc, n) => { acc[n.type] = true; return acc; }, {})).length],
      ['Total leads', leadCount],
      ['Open leads', openLeads],
      ['Findings', findings],
      ['Dead ends', deadEnds],
      ['Average confidence', `${avgConfidence}%`],
      ['POC lines captured', pocOutput.length],
    ]),
    '',
    '## 3. Investigation Tree',
    tree.length
      ? makeMarkdownTable(['Type', 'Value', 'Status', 'Confidence', 'Tool Used'], indicatorRows)
      : 'No entities were investigated. Enter an indicator to begin.',
    '',
    '## 4. Lead Inbox',
    leadRows.length
      ? makeMarkdownTable(['Type', 'Value', 'Status', 'Score', 'Source'], leadRows)
      : 'No leads were generated during this investigation.',
    '',
    '## 5. Investigation Log',
    pocOutput.length
      ? pocOutput.map(line => `- ${line}`).join('\n')
      : 'No investigation log entries captured.',
    '',
    '## 6. Findings',
    `- **Entities examined:** ${nodeCount}`,
    `- **Actionable leads:** ${openLeads}`,
    `- **Confirmed findings:** ${findings}`,
    `- **Dead ends:** ${deadEnds}`,
    `- **Average confidence:** ${avgConfidence}%`,
    `- **Entity types observed:** ${[...new Set(tree.map(n => n.type))].filter(Boolean).join(', ') || 'None'}`,
    '',
    '## 7. Recommended Next Actions',
    '- Review open leads and investigate promising pivots.',
    '- Re-run tools on dead-end nodes with different parameters.',
    '- Cross-reference findings with existing case evidence.',
    '- Save verified findings back to the case record.',
    '- Export the final POC after investigator review.',
    '',
    '---',
    '',
    `*OsintX Report — Investigation Terminal Session — ${now}*`,
    '',
    `*This document contains confidential investigation material. Handle in accordance with applicable data protection and disclosure requirements.*`
  ];

  return sections.filter(Boolean).join('\n');
};

// ─── PROFESSIONAL POC PREVIEW ───

const ProfessionalPocPreview = ({ markdown = '', tree = [], leads = [] }) => {
  const lines = markdown.split('\n');
  const blocks = [];
  let currentHeading = '';

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('|') && lines[i + 1]?.trim().startsWith('|')) {
      const { rows, nextIndex } = parseMarkdownTable(lines, i);
      const [header = [], ...body] = rows;
      const compact = currentHeading.toLowerCase().includes('sensitive data');
      blocks.push(
        <div key={`table-${i}`} className={`${compact ? 'my-3' : 'my-5'} overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm`}>
          <table className={`w-full text-left ${compact ? 'text-xs' : 'text-sm'}`}>
            <thead className="bg-slate-950 text-white">
              <tr>{header.map((cell, cellIndex) => <th key={cellIndex} className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} font-semibold`}>{cell}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {body.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-white even:bg-slate-50/70">
                  {row.map((cell, cellIndex) => {
                    const badgeClass = cellIndex === 0 ? severityBadgeClass(cell) : '';
                    return (
                      <td key={cellIndex} className={`${compact ? 'px-3 py-1.5 leading-5' : 'px-4 py-3'} text-slate-700 align-top`}>
                        {badgeClass
                          ? <span className={`inline-flex rounded-full border ${compact ? 'px-2 py-0.5' : 'px-2.5 py-1'} text-xs font-semibold ${badgeClass}`}>{cell}</span>
                          : renderInlineText(cell)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      i = nextIndex - 1;
      continue;
    }

    if (line === '---') {
      blocks.push(<div key={`hr-${i}`} className="my-8 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />);
      continue;
    }

    if (line.startsWith('# ')) {
      currentHeading = line.slice(2);
      blocks.push(<h1 key={i} className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">{line.slice(2)}</h1>);
      continue;
    }
    if (line.startsWith('## ')) {
      currentHeading = line.slice(3);
      blocks.push(<h2 key={i} className="mt-8 mb-3 text-xl sm:text-2xl font-bold text-slate-950 border-b border-slate-200 pb-2">{line.slice(3)}</h2>);
      continue;
    }
    if (line.startsWith('### ')) {
      currentHeading = line.slice(4);
      blocks.push(<h3 key={i} className="mt-6 mb-2 text-lg font-semibold text-amber-800">{line.slice(4)}</h3>);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      i -= 1;
      blocks.push(
        <ul key={`ul-${i}`} className="my-3 space-y-2">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      i -= 1;
      blocks.push(
        <ol key={`ol-${i}`} className="my-3 space-y-2">
          {items.map((item, itemIndex) => (
            <li key={itemIndex} className="flex gap-3 text-sm leading-6 text-slate-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white shrink-0">{itemIndex + 1}</span>
              <span>{renderInlineText(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    blocks.push(<p key={i} className="my-3 text-sm sm:text-base leading-7 text-slate-700">{renderInlineText(line)}</p>);
  }

  return (
    <article className="rounded-2xl bg-white text-slate-950 shadow-xl max-w-full overflow-hidden">
      <div className="bg-slate-950 px-6 sm:px-8 py-6 text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Cyber Security Investigation</p>
                        <h1 className="mt-2 text-2xl sm:text-3xl font-bold" style={{ fontFamily: "'Papyrus', 'Copperplate', fantasy" }}>OsintX Report</h1>
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Entities', tree.length],
            ['Leads', leads.length],
            ['Findings', tree.filter(n => n.status === 'has_findings').length],
            ['Confidence', tree.length ? `${Math.round(tree.reduce((s, n) => s + (n.confidence || 0), 0) / tree.length)}%` : 'N/A'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-6 sm:px-8 py-7">{blocks}</div>
    </article>
  );
};

// ─── MAIN COMPONENT ───

export default function InvestigationTerminal({ isOpen, onClose, isTab = false, userId }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode] = useState('manual');
  const [leftTab, setLeftTab] = useState('tree');
  const [rightTab, setRightTab] = useState('leads');
  const [leftVisible, setLeftVisible] = useState(true);
  const [rightVisible, setRightVisible] = useState(true);
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(280);
  const [terminalSize, setTerminalSize] = useState('full');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [pocOutput, setPocOutput] = useState([]);
  const [tree, setTree] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [runningTool, setRunningTool] = useState(null);
  const [classifiedType, setClassifiedType] = useState(null);
  const [pocEditContent, setPocEditContent] = useState('');

  const regeneratePoc = useCallback(() => {
    const result = buildTerminalPocMarkdown(tree, leads, pocOutput, selectedNode);
    setPocEditContent(result);
  }, [tree, leads, pocOutput, selectedNode]);

  // Initialize POC on mount
  useEffect(() => {
    regeneratePoc();
  }, [regeneratePoc]);

  // Settings from context (must be before useState that references it)
  const { settings: appSettings } = useSettings();

  const [autoSaveEnabled, setAutoSaveEnabled] = useState(appSettings.autoSaveVerifiedEvidence ?? false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef(null);
  const [saveNotification, setSaveNotification] = useState(null);

  // Runbook engine state
  const [runbookMode, setRunbookMode] = useState(null); // null | 'quick' | 'deep'
  const [runbookDepth, setRunbookDepth] = useState(appSettings.maxAutomationDepth ?? 2);
  const [runbookRunning, setRunbookRunning] = useState(false);
  const [runbookProgress, setRunbookProgress] = useState({ current: 0, total: 0 });
  const [runbookPaused, setRunbookPaused] = useState(false);
  const [pendingPivotApproval, setPendingPivotApproval] = useState(null);
  const [skippedDuplicates, setSkippedDuplicates] = useState(0);
  const [consecutiveDuplicates, setConsecutiveDuplicates] = useState(0);
  const [stopReason, setStopReason] = useState(null);
  const [requireApproval, setRequireApproval] = useState(appSettings.requireApprovalBeforeRecursivePivots ?? true);

  // UI enhancements
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [typingEnabled, setTypingEnabled] = useState(true);

  // Recursive pivot queue
  const [pivotQueue, setPivotQueue] = useState([]);
  const [queueRunning, setQueueRunning] = useState(false);

  // Result diffing
  const [resultSnapshots, setResultSnapshots] = useState([]);
  const [diffResult, setDiffResult] = useState(null);
  const [showDiff, setShowDiff] = useState(false);

  // Batch investigation
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchRunning, setBatchRunning] = useState(false);
  const [showingPlaybooks, setShowingPlaybooks] = useState(false);
  const [selectedPlaybook, setSelectedPlaybook] = useState(null);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplateSave, setShowTemplateSave] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showTemplateLoad, setShowTemplateLoad] = useState(false);

  // Smart auto-pivot threshold
  const [minPivotConfidence, setMinPivotConfidence] = useState(40);
  const [showThresholdSlider, setShowThresholdSlider] = useState(false);

  // AI narrative
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrative, setNarrative] = useState('');

  // Report
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStyle, setReportStyle] = useState('executive');
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  // Entity memory (cross-session)
  const [entityMemory, setEntityMemory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('terminal_entity_memory') || '{}'); } catch { return {}; }
  });
  const rememberEntity = useCallback((type, value, tool, confidence) => {
    const key = `${type}:${(value || '').toLowerCase()}`;
    setEntityMemory(prev => {
      const existing = prev[key];
      const now = Date.now();
      const updated = { ...prev, [key]: {
        type, value, tool, confidence,
        firstSeen: existing?.firstSeen || now,
        lastSeen: now,
        seenCount: (existing?.seenCount || 0) + 1,
        previousTools: [...new Set([...(existing?.previousTools || []), tool].filter(Boolean))],
      }};
      localStorage.setItem('terminal_entity_memory', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getEntityMemory = useCallback((type, value) => {
    const key = `${type}:${(value || '').toLowerCase()}`;
    return entityMemory[key] || null;
  }, [entityMemory]);

  // ─── REFS (stale closure safety) ───

  const treeRef = useRef(tree);
  const leadsRef = useRef(leads);
  const runbookRunningRef = useRef(false);
  useEffect(() => { treeRef.current = tree; }, [tree]);
  useEffect(() => { leadsRef.current = leads; }, [leads]);
  useEffect(() => { runbookRunningRef.current = runbookRunning; }, [runbookRunning]);
  const runbookPausedRef = useRef(false);
  useEffect(() => { runbookPausedRef.current = runbookPaused; }, [runbookPaused]);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const runbookTimeouts = useRef([]);

  // Sync settings → terminal state
  useEffect(() => {
    setRequireApproval(appSettings.requireApprovalBeforeRecursivePivots ?? true);
  }, [appSettings.requireApprovalBeforeRecursivePivots]);

  useEffect(() => {
    setAutoSaveEnabled(appSettings.autoSaveVerifiedEvidence ?? false);
  }, [appSettings.autoSaveVerifiedEvidence]);

  useEffect(() => {
    setRunbookDepth(appSettings.maxAutomationDepth ?? 2);
  }, [appSettings.maxAutomationDepth]);

  // Keyboard shortcut: Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Splash auto-hide
  useEffect(() => {
    if (!showSplash) return;
    const t = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(t);
  }, [showSplash]);

  // ─── CORE HELPERS (defined early to avoid TDZ) ───

  const addChatMessage = useCallback((who, text, meta = {}) => {
    setChatMessages(prev => [...prev, { who, text, ...meta }]);
  }, []);

  const addPocLine = useCallback((line) => {
    setPocOutput(prev => [...prev, line]);
  }, []);

  // ─── TEMPLATES ───

  const loadTemplates = useCallback(async () => {
    try {
      const res = await api.get('/terminal/templates');
      if (res?.data) setTemplates(res.data);
    } catch {}
  }, []);

  const saveAsTemplate = useCallback(async () => {
    if (!templateName.trim()) return;
    try {
      const steps = Object.entries(
        tree.reduce((acc, n) => {
          if (!acc[n.type]) acc[n.type] = [];
          if (n.tool && !acc[n.type].includes(n.tool)) acc[n.type].push(n.tool);
          return acc;
        }, {})
      ).map(([entityType, tools]) => ({ entityType, tools: tools || [], maxPivots: 3 }));
      await api.post('/terminal/templates', {
        name: templateName.trim(),
        description: `Template from investigation of ${tree[0]?.value || 'unknown'}`,
        icon: 'beaker',
        steps,
        mode,
      });
      setShowTemplateSave(false);
      setTemplateName('');
      loadTemplates();
      addPocLine(`[template] Saved as "${templateName.trim()}"`);
      addChatMessage('system', `Template "${templateName.trim()}" saved`, { type: 'tool_done', tool: 'Template' });
    } catch (err) {
      addChatMessage('system', `Failed to save template: ${err.message}`, { type: 'no_match' });
    }
  }, [templateName, tree, mode, loadTemplates, addPocLine, addChatMessage]);

  const loadTemplate = useCallback(async (templateId) => {
    try {
      const t = templates.find(tm => tm.id === templateId);
      if (!t) return;
      addChatMessage('system', `Loaded template: ${t.name}`, { type: 'tool_start', tool: 'Template' });
      addPocLine(`[template] Loaded: ${t.name}`);
      setShowTemplateLoad(false);
    } catch (err) {
      addChatMessage('system', `Failed to load template: ${err.message}`, { type: 'no_match' });
    }
  }, [templates, addChatMessage, addPocLine]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // ─── AI NARRATIVE ───

  const generateNarrative = useCallback(async () => {
    if (tree.length === 0) return;
    setNarrativeLoading(true);
    try {
      const res = await api.post('/terminal/narrative', {
        toolResults: tree.map(n => ({
          toolName: n.tool, entityType: n.type, entityValue: n.value, score: n.confidence, summary: `Investigated ${n.value}`,
        })),
        entityValue: tree[0]?.value,
      });
      if (res?.data?.summary) {
        setNarrative(res.data.summary);
        addChatMessage('system', res.data.summary, { type: 'tool_done', tool: 'AI Narrative' });
      }
    } catch {}
    setNarrativeLoading(false);
  }, [tree, addChatMessage]);

  // ─── REPORT GENERATION ───

  const generateReport = useCallback(async (style) => {
    const s = style || reportStyle;
    setReportLoading(true);
    try {
      const toolResults = tree.map(n => ({
        toolName: n.tool, entityValue: n.value, entityType: n.type, score: n.confidence, summary: `Investigated ${n.value}`,
      }));
      const res = await api.post('/terminal/report', {
        tree, leads, pocOutput, toolResults,
        options: { style: s, entityValue: tree[0]?.value },
      });
      if (res?.data) {
        setReportData(res.data);
        setReportStyle(s);
        if (res.data.sections) {
          const execSection = res.data.sections.find(s => s.id === 'executive_summary');
          setPocEditContent(execSection?.body || 'Report generated.');
        }
      }
    } catch {}
    setReportLoading(false);
  }, [tree, leads, pocOutput, reportStyle]);

  useEffect(() => {
    if (tree.length > 0 && !reportData) generateReport(reportStyle);
  }, [tree.length]);

  // ─── TEMPLATE SAVE MODAL ───

  const TemplateSaveModal = useMemo(() => showTemplateSave ? (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowTemplateSave(false)}>
      <div className="w-80 rounded-xl border border-gray-700/50 bg-gray-900 p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Save as Template</h3>
        <input
          autoFocus
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') saveAsTemplate(); if (e.key === 'Escape') setShowTemplateSave(false); }}
          className="w-full rounded-lg border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 mb-3"
          placeholder="Template name..."
        />
        <div className="flex gap-2 justify-end">
          <button onClick={() => setShowTemplateSave(false)} className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-800 transition-colors">Cancel</button>
          <button onClick={saveAsTemplate} className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/25 transition-colors">Save</button>
        </div>
      </div>
    </div>
  ) : null, [showTemplateSave, templateName, saveAsTemplate]);

  // ─── TEMPLATE LOAD MODAL ───

  const TemplateLoadModal = useMemo(() => showTemplateLoad ? (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowTemplateLoad(false)}>
      <div className="w-80 rounded-xl border border-gray-700/50 bg-gray-900 p-4 shadow-2xl max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Load Template</h3>
        {templates.length === 0 ? (
          <p className="text-xs text-gray-500">No saved templates.</p>
        ) : (
          <div className="space-y-1">
            {templates.map(t => (
              <button key={t.id} onClick={() => loadTemplate(t.id)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-gray-300 hover:bg-gray-800/50 transition-colors text-left"
              >
                <span className="text-cyan-400">◆</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{t.name}</div>
                  <div className="text-[9px] text-gray-500">{t.steps?.length || 0} steps · used {t.useCount || 0}x</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null, [showTemplateLoad, templates, loadTemplate]);

  // ─── CONFIDENCE THRESHOLD SLIDER ───

  const ThresholdSlider = useMemo(() => showThresholdSlider ? (
    <div className="absolute top-full right-0 mt-1 z-50 w-56 rounded-lg border border-gray-700/60 bg-gray-900/95 backdrop-blur-xl p-3 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-medium text-gray-400">Min Pivot Confidence</span>
        <span className="text-xs font-mono text-cyan-400">{minPivotConfidence}%</span>
      </div>
      <input
        type="range" min={10} max={95} step={5}
        value={minPivotConfidence}
        onChange={e => setMinPivotConfidence(Number(e.target.value))}
        className="w-full accent-cyan-500"
      />
      <div className="flex justify-between text-[9px] text-gray-600 mt-1">
        <span>Aggressive</span>
        <span>Conservative</span>
      </div>
    </div>
  ) : null, [showThresholdSlider, minPivotConfidence]);

  // Download menu outside-click
  useEffect(() => {
    const handler = (e) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showDownloadMenu]);

  // ─── CORE FUNCTIONS ───

  const handleCommand = useCallback((cmd) => {
    const c = cmd.toLowerCase();
    if (c === '/help') addChatMessage('system', 'Available commands: /help, /tree, /leads, /poc, /clear, /status');
    else if (c === '/tree') addChatMessage('system', `Investigation tree: ${tree.length} nodes`);
    else if (c === '/leads') addChatMessage('system', `Lead inbox: ${leads.length} total, ${leads.filter(l => l.status === 'new').length} new`);
    else if (c === '/poc') addChatMessage('system', 'POC report available in the right panel Edit tab.');
    else if (c === '/clear') setChatMessages([]);
    else if (c === '/status') addChatMessage('system', `Tree: ${tree.length} nodes, Leads: ${leads.length}, Auto-save: ${autoSaveEnabled ? 'ON' : 'OFF'}`);
    else addChatMessage('system', `Unknown command: ${cmd}. Type /help.`);
  }, [addChatMessage, tree, leads, autoSaveEnabled]);

  const addNode = useCallback((parentId, type, value, tool, status = 'new', confidence = 50) => {
    const node = { id: genId(), parentId, type, value, tool, status, confidence, label: value, children: [] };
    setTree(prev => [...prev, node]);
    rememberEntity(type, value, tool, confidence);
    return node;
  }, [rememberEntity]);

  const toolTimeoutRef = useRef(appSettings.apiTimeout ?? 30000);
  useEffect(() => { toolTimeoutRef.current = appSettings.apiTimeout ?? 30000; }, [appSettings.apiTimeout]);
  const consecutiveDupRef = useRef(0);

  const runToolWithAutoSaveRef = useRef(null);
  const [streamingResult, setStreamingResult] = useState(null);
  const [toolOutputs, setToolOutputs] = useState({});
  const toolRunIdRef = useRef(0);

  const addToolOutput = useCallback((runId, line) => {
    setToolOutputs(prev => ({ ...prev, [runId]: [...(prev[runId] || []), line] }));
  }, []);

  // ─── SESSION PERSISTENCE ───
  const SESSION_ID = useMemo(() => 'terminal_session', []);
  const abortControllerRef = useRef(null);

  const saveSession = useCallback(async (t, l, p, c, pe) => {
    try {
      await api.post('/terminal/session/save', {
        sessionId: SESSION_ID,
        data: { tree: t, leads: l, pocOutput: p, chatMessages: c, pocEditContent: pe },
      });
    } catch {}
  }, [SESSION_ID]);

  const saveTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveSession(tree, leads, pocOutput, chatMessages, pocEditContent);
    }, 2000);
    return () => clearTimeout(saveTimerRef.current);
  }, [tree, leads, pocOutput, chatMessages, pocEditContent, saveSession]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`/terminal/session/${SESSION_ID}`);
        if (cancelled || !data) return;
        if (data.tree?.length > 0) setTree(data.tree);
        if (data.leads?.length > 0) setLeads(data.leads);
        if (data.pocOutput?.length > 0) setPocOutput(data.pocOutput);
        if (data.chatMessages?.length > 0) setChatMessages(data.chatMessages);
        if (data.pocEditContent) setPocEditContent(data.pocEditContent);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [SESSION_ID]);

  const runTool = useCallback(async (nodeId, toolName) => {
    setRunningTool(toolName);
    const node = treeRef.current.find(n => n.id === nodeId);
    if (!node) { setRunningTool(null); return; }

    const runId = `run_${++toolRunIdRef.current}`;
    setToolOutputs(prev => ({ ...prev, [runId]: [] }));

    setTree(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'running' } : n));
    addChatMessage('system', `Running ${toolName} on ${node.value}...`, { type: 'tool_start', tool: toolName, runId });
    addPocLine(`[tool] Running ${toolName} on ${node.value}`);

    try {
      const timeout = toolTimeoutRef.current || 30000;
      addToolOutput(runId, `$ osintx ${toolName.toLowerCase().replace(/\s+/g, '-')} --target ${node.value}`);
      addToolOutput(runId, `  ╰─ Starting ${toolName} analysis...`);
      addToolOutput(runId, `  ╰─ Timeout: ${(timeout / 1000).toFixed(0)}s`);

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      addToolOutput(runId, `  ╰─ Querying backend services...`);

      let res;
      try {
        res = await api.post('/terminal/investigate', {
          value: node.value,
          type: node.type,
          tool: toolName,
        }, { signal: controller.signal });
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        if (abortControllerRef.current === controller) abortControllerRef.current = null;
        const isTimeout = fetchErr.name === 'AbortError' || fetchErr.message?.includes('abort') || fetchErr.message?.includes('timeout');
        const errorMsg = isTimeout
          ? `Request timed out after ${(timeout / 1000).toFixed(0)}s. The backend service may be unresponsive.`
          : `Request failed: ${fetchErr.message}`;

        addToolOutput(runId, `  ╰─ ✗ ERROR: ${errorMsg}`);
        addToolOutput(runId, `  ╰─ Status: FAILED (${isTimeout ? 'TIMEOUT' : 'ERROR'})`);

        setTree(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'dead_end', confidence: Math.max(10, (n.confidence || 50) - 10) } : n));
        addChatMessage('system', `${toolName}: ${isTimeout ? 'Timed out' : 'Failed'} — ${errorMsg}`, { type: 'tool_done', tool: toolName, runId });
        addPocLine(`[tool] ${toolName} ${isTimeout ? 'timed out' : 'failed'}: ${errorMsg}`);
        setRunningTool(null);
        setStreamingResult(null);
        return;
      }

      clearTimeout(timeoutId);
      if (abortControllerRef.current === controller) abortControllerRef.current = null;

      const result = res.error ? { status: 'failed', error: res.error } : res;

      addToolOutput(runId, `  ╰─ ✓ Response received (${result.elapsed || '?'}ms)`);

      if (result.status === 'failed' || result.status === 'error' || result.status === 'timeout') {
        addToolOutput(runId, `  ╰─ ✗ ${result.error || 'Unknown error'}`);
        addToolOutput(runId, `  ╰─ Status: FAILED`);

        setTree(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'dead_end', confidence: Math.max(10, (n.confidence || 50) - 10) } : n));
        addChatMessage('system', `${toolName}: Failed — ${result.error || 'Unknown error'}`, { type: 'tool_done', tool: toolName, runId });
        addPocLine(`[tool] ${toolName} failed: ${result.error || 'Unknown'}`);
        setRunningTool(null);
        setStreamingResult(null);
        return;
      }

      const summary = result.summary || `${toolName} completed for ${node.value}`;
      const hasFindings = result.pivots?.length > 0 || (result.status === 'success');

      addToolOutput(runId, `  ╰─ ✓ ${hasFindings ? 'Findings detected' : 'Analysis complete'}`);
      addToolOutput(runId, `  ╰─ Confidence: ${result.score || 'N/A'}`);
      if (result.pivots?.length > 0) {
        addToolOutput(runId, `  ╰─ Pivots discovered: ${result.pivots.length}`);
        result.pivots.slice(0, 8).forEach(p => addToolOutput(runId, `      ${p.type}: ${p.value} (${p.confidence || '?'}%)`));
      }

      setStreamingResult({ tool: toolName, summary, nodeId });

      setTree(prev => prev.map(n => n.id === nodeId ? {
        ...n, status: hasFindings ? 'has_findings' : 'dead_end',
        confidence: Math.min(100, result.score || (n.confidence || 50) + 10),
      } : n));

      addChatMessage('system', `${toolName}: ${hasFindings ? 'Findings detected' : 'No results'}`, { type: 'tool_done', tool: toolName, result, runId });
      addPocLine(`[tool] ${toolName} result: ${hasFindings ? 'findings' : 'no results'}`);

      if (hasFindings && result.pivots && result.pivots.length > 0) {
        let newLeadsAdded = false;
        for (const pivot of result.pivots) {
          if (treeRef.current.some(n => n.value === pivot.value) || leadsRef.current.some(l => l.value === pivot.value)) {
            setSkippedDuplicates(prev => prev + 1);
            continue;
          }
          if ((pivot.confidence || 50) < minPivotConfidence) {
            setSkippedDuplicates(prev => prev + 1);
            continue;
          }
          setLeads(prev => [...prev, {
            id: genLeadId(), type: pivot.type, value: pivot.value,
            score: pivot.confidence || 70, status: 'new',
            source: pivot.source || toolName, timestamp: Date.now(),
          }]);
          addPocLine(`[lead] ${pivot.type}:${pivot.value} (${pivot.confidence || 70}%)`);
          newLeadsAdded = true;
        }

        if (!newLeadsAdded) {
          consecutiveDupRef.current += 1;
          setConsecutiveDuplicates(consecutiveDupRef.current);
          if (consecutiveDupRef.current >= 5) {
            runbookRunningRef.current = false;
            setRunbookRunning(false);
            setQueueRunning(false);
            setStopReason('Stopped: only duplicate evidence produced after 5 consecutive runs');
            addChatMessage('system', 'Auto-stop: only duplicate entities found. Ending runbook.', { type: 'tool_done', tool: 'Stop' });
            addPocLine('[runbook] Stopped: only duplicate evidence produced');
          }
        } else {
          consecutiveDupRef.current = 0;
          setConsecutiveDuplicates(0);
        }

        const bestPivot = result.pivots.sort((a, b) => (b.confidence || 50) - (a.confidence || 50))[0];
        if (bestPivot && !requireApproval) {
          const newNode = addNode(nodeId, bestPivot.type, bestPivot.value, toolName, 'new', bestPivot.confidence || 70);
          addChatMessage('system', `Pivot: found ${bestPivot.type} ${bestPivot.value}`, { type: 'pivot_found', entityType: bestPivot.type, confidence: bestPivot.confidence || 70 });
          addPocLine(`[pivot] ${node.value} -> ${bestPivot.type}:${bestPivot.value}`);
          if (modeRef.current.startsWith('autopilot-')) {
            const pivotTools = TOOLS[bestPivot.type] || [];
            if (pivotTools.length > 0) {
              const nextTool = modeRef.current === 'autopilot-deep' ? pivotTools[Math.floor(Math.random() * pivotTools.length)] : pivotTools[0];
              setTimeout(() => runToolWithAutoSaveRef.current?.(newNode.id, nextTool), 1000);
            }
          }
        } else if (bestPivot && requireApproval) {
          setPendingPivotApproval({
            lead: bestPivot, nodeId, toolName,
            onApprove: () => {
              const newNode = addNode(nodeId, bestPivot.type, bestPivot.value, toolName, 'new', bestPivot.confidence || 70);
              addChatMessage('system', `Pivot: found ${bestPivot.type} ${bestPivot.value}`, { type: 'pivot_found', entityType: bestPivot.type, confidence: bestPivot.confidence || 70 });
              addPocLine(`[pivot] ${node.value} -> ${bestPivot.type}:${bestPivot.value}`);
              setPendingPivotApproval(null);
              if (modeRef.current.startsWith('autopilot-')) {
                const pivotTools = TOOLS[bestPivot.type] || [];
                if (pivotTools.length > 0) {
                  const nt = modeRef.current === 'autopilot-deep' ? pivotTools[Math.floor(Math.random() * pivotTools.length)] : pivotTools[0];
                  setTimeout(() => runToolWithAutoSaveRef.current?.(newNode.id, nt), 1000);
                }
              }
            },
            onReject: () => {
              addChatMessage('system', `Pivot ${bestPivot.value} rejected.`, { type: 'tool_done', tool: 'Approval' });
              addPocLine(`[pivot] Rejected: ${bestPivot.type}:${bestPivot.value}`);
              setPendingPivotApproval(null);
            },
          });
        }
      }

      setTimeout(() => setStreamingResult(null), 2000);
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      const errorMsg = isTimeout
        ? `Request timed out after ${((toolTimeoutRef.current || 30000) / 1000).toFixed(0)}s`
        : err.message;
      addToolOutput(runId, `  ╰─ ✗ CRITICAL: ${errorMsg}`);
      setTree(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'dead_end' } : n));
      addChatMessage('system', `${toolName}: ${isTimeout ? 'Timed out' : 'Error'} — ${errorMsg}`, { type: 'tool_done', tool: toolName, runId });
      addPocLine(`[tool] ${toolName} ${isTimeout ? 'timed out' : 'error'}: ${errorMsg}`);
    }
    setRunningTool(null);
    setStreamingResult(null);
  }, [addChatMessage, addPocLine, addNode, addToolOutput, setSkippedDuplicates, setPendingPivotApproval, requireApproval, runToolWithAutoSaveRef]);

  const runToolWithAutoSave = useCallback((nodeId, toolName) => {
    runTool(nodeId, toolName);
  }, [runTool]);
  runToolWithAutoSaveRef.current = runToolWithAutoSave;

  const saveToCase = useCallback(() => {
    setShowSaveModal(true);
  }, []);

  // ─── HANDLERS ───

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    setChatInput(val);
    setClassifiedType(val.trim() ? classifyInput(val.trim()) : null);
  }, []);

  const runFullInvestigation = useCallback(async (rootNode, entityType) => {
    setRunningTool('full_investigation');
    const runId = `full_${++toolRunIdRef.current}`;
    setToolOutputs(prev => ({ ...prev, [runId]: [] }));

    const tools = TOOLS[entityType] || [];
    addToolOutput(runId, `$ osintx investigate --type ${entityType} --value ${rootNode.value}`);
    addToolOutput(runId, `  ╰─ Launching ${tools.length} tools in parallel via Promise.all...`);
    tools.forEach(t => addToolOutput(runId, `  ╰─ Queued: ${t}`));

    addChatMessage('system', `Running ${tools.length} tools in parallel on ${rootNode.value}...`, { type: 'tool_start', tool: 'Parallel Investigation', runId });

    try {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const res = await api.post('/terminal/investigate', {
        value: rootNode.value,
        type: entityType,
      }, { signal: controller.signal });

      if (abortControllerRef.current === controller) abortControllerRef.current = null;
      if (!res || !res.toolResults) throw new Error('No results returned');

      addToolOutput(runId, `  ╰─ ✓ All ${res.toolResults.length} tools responded`);
      addToolOutput(runId, `  ╰─ Overall confidence: ${res.overallScore || 'N/A'}%`);
      addToolOutput(runId, `  ╰─ Pivots discovered: ${res.pivots?.length || 0}`);
      if (res.images?.length > 0) addToolOutput(runId, `  ╰─ Images captured: ${res.images.length}`);

      setTree(prev => prev.map(n => n.id === rootNode.id ? {
        ...n, status: 'has_findings',
        confidence: Math.min(100, (n.confidence || 50) + 15),
      } : n));

      addChatMessage('system', `Parallel investigation complete — ${res.toolResults.length} tools, ${res.pivots?.length || 0} pivots, ${res.images?.length || 0} images`, { type: 'tool_done', tool: 'Parallel', result: res, runId });

      // Show each tool result as a separate chat message with summary + images
      for (const tr of res.toolResults || []) {
        const summaryLines = (tr.summary || '').split('\n').filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '')).slice(0, 6);
        const summaryText = [`${tr.toolName} completed for ${tr.entityValue || rootNode.value}`, ...summaryLines].join('\n');
        addPocLine(`[tool] ${tr.toolName}: ${tr._note ? 'partial' : 'success'} (${tr.elapsed || '?'}ms)`);
        addChatMessage('system', summaryText, { type: 'tool_done', tool: tr.toolName, result: tr, runId: `tool_${runId}_${tr.toolName}` });
      }

      let newLeadsAdded = false;
      for (const pivot of res.pivots || []) {
        if (treeRef.current.some(n => n.value === pivot.value) || leadsRef.current.some(l => l.value === pivot.value)) {
          setSkippedDuplicates(prev => prev + 1);
          continue;
        }
        setLeads(prev => [...prev, {
          id: genLeadId(), type: pivot.type, value: pivot.value,
          score: pivot.confidence || 60, status: 'new',
          source: pivot.source || 'auto', timestamp: Date.now(),
        }]);
        addPocLine(`[lead] ${pivot.type}:${pivot.value} (${pivot.confidence || 60}%)`);
        newLeadsAdded = true;
      }

      if (!newLeadsAdded) {
        consecutiveDupRef.current += 1;
        setConsecutiveDuplicates(consecutiveDupRef.current);
      } else {
        consecutiveDupRef.current = 0;
        setConsecutiveDuplicates(0);
      }

      if (res.images?.length > 0) {
        addPocLine(`[media] ${res.images.length} image(s) captured`);
        addChatMessage('system', `${res.images.length} image(s) captured from investigation tools`, { type: 'tool_done', tool: 'Media', result: res });
      }

      // Display combined images from all tools
      if (res.images?.length > 0) {
        addChatMessage('system', `Images collected from tools`, { type: 'tool_done', tool: 'Images', result: { images: res.images } });
        res.images.forEach(img => addPocLine(`[media] Image: ${img.label} — ${img.url.slice(0, 60)}...`));
      }

      setRunningTool(null);
      setStreamingResult(null);
      setRightTab('leads');
      generateReport();
      return res;
    } catch (err) {
      const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
      addToolOutput(runId, `  ╰─ ✗ ${isTimeout ? 'Cancelled by user' : 'Error: ' + err.message}`);
      setTree(prev => prev.map(n => n.id === rootNode.id ? { ...n, status: 'dead_end' } : n));
      addChatMessage('system', `Investigation ${isTimeout ? 'cancelled' : 'failed'}: ${err.message}`, { type: 'tool_done', tool: 'Error' });
      addPocLine(`[error] Investigation ${isTimeout ? 'cancelled' : err.message}`);
      setRunningTool(null);
      setStreamingResult(null);
    }
  }, [addChatMessage, addPocLine, addNode, addToolOutput, setSkippedDuplicates, generateReport]);

  const sendMessage = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg) return;
    setChatInput('');
    setClassifiedType(null);
    if (msg.startsWith('/')) { handleCommand(msg); return; }
    const ctype = classifyInput(msg);
    addChatMessage('analyst', msg, { type: 'indicator', entityType: ctype });
    if (ctype !== 'general') {
      const root = addNode(null, ctype, msg, 'Manual input', 'new', 60);
      setSelectedNode(root);
      addPocLine(`[indicator] Input: ${msg} (${ctype})`);
      addChatMessage('system', `Classified as ${ctype}. Launching ${(TOOLS[ctype] || []).length} tools in parallel...`, { type: 'classified', entityType: ctype, tools: TOOLS[ctype] || [] });
      runFullInvestigation(root, ctype);
    } else {
      addChatMessage('system', 'Could not classify. Enter an email, domain, IP, etc.');
    }
  }, [chatInput, addChatMessage, addPocLine, addNode, handleCommand, runFullInvestigation]);

  const handleNodeSelect = useCallback((node) => { setSelectedNode(node); }, []);

  const acceptLead = useCallback((lead) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'accepted' } : l));
    addChatMessage('system', `Investigating lead: ${lead.value}`, { type: 'tool_start', tool: 'Lead' });
    addPocLine(`[lead] Accepted: ${lead.value}`);
    const root = addNode(null, lead.type, lead.value, 'Lead', 'new', lead.score || 50);
    setSelectedNode(root);
    const tools = TOOLS[lead.type] || [];
    if (tools.length > 0) setTimeout(() => runToolWithAutoSave(root.id, tools[0]), 1000);
  }, [addChatMessage, addPocLine, addNode, runToolWithAutoSave]);

  const ignoreLead = useCallback((lead) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'ignored' } : l));
    addPocLine(`[lead] Ignored: ${lead.value}`);
  }, [addPocLine]);

  const handleNextAction = useCallback((action) => {
    if (action.type === 'enter_indicator') document.querySelector('.chat-input')?.focus();
    else if (action.type === 'run_tool' && action.node) {
      setSelectedNode(action.node);
      const tools = TOOLS[action.node.type] || [];
      if (tools.length > 0) runToolWithAutoSave(action.node.id, tools[0]);
    } else if (action.type === 'investigate_lead' && action.lead) acceptLead(action.lead);
    else if (action.type === 'generate_poc') setRightTab('edit');
  }, [runToolWithAutoSave, acceptLead]);

  // ─── RUNBOOK ───

  const runQuickScan = useCallback(() => {
    const leaves = treeRef.current.filter(n => n.children.length === 0 && n.status !== 'dead_end' && n.status !== 'loop');
    if (leaves.length === 0) { addChatMessage('system', 'No leaves to scan.', { type: 'no_match' }); return; }
    if (mode !== 'autopilot-quick') setMode('autopilot-quick');
    setRunbookMode('quick'); setRunbookRunning(true); runbookRunningRef.current = true;
    setRunbookPaused(false); setStopReason(null); consecutiveDupRef.current = 0; setConsecutiveDuplicates(0);
    setRunbookProgress({ current: 0, total: leaves.length });
    addChatMessage('system', 'Starting Quick Scan...', { type: 'tool_start', tool: 'QuickScan' });
    addPocLine(`[runbook] Quick Scan: ${leaves.length} leaves`);
    leaves.forEach((leaf, i) => {
      const processLeaf = () => {
        if (!runbookRunningRef.current) return;
        if (runbookPausedRef.current) {
          const retry = setTimeout(processLeaf, 1000);
          runbookTimeouts.current.push(retry);
          return;
        }
        const tools = TOOLS[leaf.type] || [];
        if (tools.length > 0) runToolWithAutoSave(leaf.id, tools[0]);
        setRunbookProgress(p => ({ ...p, current: i + 1 }));
        if (i === leaves.length - 1) {
          const completeScan = () => {
            if (!runbookRunningRef.current) return;
            if (runbookPausedRef.current) {
              const retry = setTimeout(completeScan, 1000);
              runbookTimeouts.current.push(retry);
              return;
            }
            setRunbookRunning(false);
            addChatMessage('system', 'Quick Scan completed.', { type: 'tool_done', tool: 'QuickScan' });
            addPocLine('[runbook] Quick Scan completed');
          };
          const doneTid = setTimeout(completeScan, 2000);
          runbookTimeouts.current.push(doneTid);
        }
      };
      const tid = setTimeout(processLeaf, i * 3000);
      runbookTimeouts.current.push(tid);
    });
  }, [addChatMessage, addPocLine, runToolWithAutoSave, mode]);

  const runDeepScan = useCallback(() => {
    const toScan = treeRef.current.filter(n => n.status !== 'dead_end' && n.status !== 'loop');
    if (toScan.length === 0) { addChatMessage('system', 'No nodes to scan.', { type: 'no_match' }); return; }
    if (mode !== 'autopilot-deep') setMode('autopilot-deep');
    setRunbookMode('deep'); setRunbookRunning(true); runbookRunningRef.current = true; setQueueRunning(true);
    setRunbookPaused(false); setStopReason(null); consecutiveDupRef.current = 0; setConsecutiveDuplicates(0);
    setRunbookProgress({ current: 0, total: toScan.length });
    addChatMessage('system', 'Starting Deep Scan...', { type: 'tool_start', tool: 'DeepScan' });
    addPocLine(`[runbook] Deep Scan: ${toScan.length} nodes`);
    let idx = 0;
    const next = () => {
      if (!runbookRunningRef.current) return;
      if (runbookPausedRef.current) {
        const retry = setTimeout(next, 1000);
        runbookTimeouts.current.push(retry);
        return;
      }
      if (idx >= toScan.length) {
        setRunbookRunning(false); setQueueRunning(false);
        addChatMessage('system', 'Deep Scan completed.', { type: 'tool_done', tool: 'DeepScan' });
        addPocLine('[runbook] Deep Scan completed');
        return;
      }
      const node = toScan[idx];
      const tools = TOOLS[node.type] || [];
      addPocLine(`[runbook] Deep [${idx + 1}/${toScan.length}]: ${node.value}`);
      if (tools.length > 0) runToolWithAutoSave(node.id, tools[Math.floor(Math.random() * tools.length)]);
      setRunbookProgress(p => ({ ...p, current: idx + 1 }));
      idx++;
      const tid = setTimeout(next, 2000 + Math.random() * 1000);
      runbookTimeouts.current.push(tid);
    };
    const startTid = setTimeout(next, 500);
    runbookTimeouts.current.push(startTid);
  }, [addChatMessage, addPocLine, runToolWithAutoSave, mode]);

  const stopRunbook = useCallback(() => {
    runbookRunningRef.current = false; setRunbookRunning(false); setQueueRunning(false);
    setRunbookPaused(false); setBatchRunning(false); setRunningTool(null);
    runbookTimeouts.current.forEach(clearTimeout);
    runbookTimeouts.current = [];
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setPendingPivotApproval(null);
    setStreamingResult(null);
    setStopReason('Stopped by user');
    addChatMessage('system', 'Investigation stopped by user. All operations cancelled.', { type: 'tool_done', tool: 'Stop' });
    addPocLine('[stop] Investigation stopped by user');
  }, [addChatMessage, addPocLine]);

  const resetStopReason = useCallback(() => { setStopReason(null); }, []);

  // ─── MODE SWITCHING ───

  const handleModeChange = useCallback((newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    const modeLabels = { manual: 'Manual', 'autopilot-quick': 'Autopilot Quick', 'autopilot-deep': 'Autopilot Deep' };
    addChatMessage('system', `Switched to ${modeLabels[newMode] || newMode} mode`, { type: 'tool_done', tool: 'Mode' });
    addPocLine(`[mode] Switched to ${modeLabels[newMode] || newMode}`);

    if (newMode.startsWith('autopilot-') && tree.length > 0 && !runbookRunningRef.current) {
      const scanType = newMode === 'autopilot-quick' ? 'quick' : 'deep';
      addChatMessage('system', `Auto-starting ${scanType} scan for existing nodes...`, { type: 'tool_start', tool: 'Autopilot' });
      addPocLine(`[mode] Auto-starting ${scanType} scan`);
      const toScan = scanType === 'quick'
        ? treeRef.current.filter(n => n.children.length === 0 && n.status !== 'dead_end' && n.status !== 'loop')
        : treeRef.current.filter(n => n.status !== 'dead_end' && n.status !== 'loop');
      if (toScan.length > 0) {
        if (scanType === 'quick') runQuickScan();
        else runDeepScan();
      }
    }
  }, [mode, addChatMessage, addPocLine, tree, runQuickScan, runDeepScan]);

  const handlePauseResume = useCallback(() => {
    setRunbookPaused(prev => !prev);
    if (runbookPaused) {
      addChatMessage('system', 'Runbook resumed.', { type: 'tool_done', tool: 'Runbook' });
    } else {
      addChatMessage('system', 'Runbook paused.', { type: 'tool_done', tool: 'Runbook' });
    }
  }, [runbookPaused, addChatMessage]);

  // ─── SNAPSHOTS & DIFF ───

  const snapshotResults = useCallback(() => {
    const snapshot = {
      id: Date.now(), timestamp: new Date().toISOString(),
      treeCount: tree.length, leadCount: leads.length,
      entities: tree.map(n => ({ type: n.type, value: n.value, confidence: n.confidence, status: n.status })),
      leadItems: leads.map(l => ({ type: l.type, value: l.value, score: l.score, status: l.status })),
    };
    setResultSnapshots(prev => [...prev, snapshot]);
    addChatMessage('system', `Snapshot taken: ${tree.length} entities, ${leads.length} leads`, { type: 'tool_done', tool: 'Snapshot' });
    addPocLine(`[snapshot] Snapshot #${resultSnapshots.length + 1}: ${tree.length} entities, ${leads.length} leads`);
  }, [tree, leads, addChatMessage, addPocLine, resultSnapshots.length]);

  const compareSnapshots = useCallback((idxA, idxB) => {
    const a = resultSnapshots[idxA]; const b = resultSnapshots[idxB];
    if (!a || !b) return;
    const aEntities = new Set(a.entities.map(e => `${e.type}:${e.value}`));
    const newEntities = b.entities.filter(e => !aEntities.has(`${e.type}:${e.value}`));
    const changedEntities = b.entities.filter(e => {
      const ae = a.entities.find(x => x.type === e.type && x.value === e.value);
      return ae && (ae.status !== e.status || ae.confidence !== e.confidence);
    });
    const newLeads = b.leadItems.filter(l => !a.leadItems.some(x => x.value === l.value));
    setDiffResult({
      snapshotA: a.timestamp, snapshotB: b.timestamp,
      treeCountDiff: b.treeCount - a.treeCount,
      leadCountDiff: b.leadCount - a.leadCount,
      newEntities, newLeads, changedEntities,
    });
    setShowDiff(true); setRightTab('edit');
  }, [resultSnapshots]);

  // ─── EXPORTS ───

  const exportIocCsv = useCallback(() => {
    const iocs = tree.map(n => `${n.type},${n.value},${n.confidence},${n.status}`).join('\n');
    const blob = new Blob([`type,value,confidence,status\n${iocs}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `iocs_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    addPocLine(`[export] Exported ${tree.length} IOCs to CSV`);
  }, [tree, addPocLine]);

  const exportIocJson = useCallback(() => {
    const data = tree.map(n => ({ type: n.type, value: n.value, confidence: n.confidence, status: n.status }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `iocs_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    addPocLine(`[export] Exported ${tree.length} IOCs to JSON`);
  }, [tree, addPocLine]);

  const exportStix = useCallback(async () => {
    addPocLine('[export] Generating STIX 2.1 bundle...');
    try {
      const res = await api.post('/terminal/export/stix', {
        tree, leads,
        entityType: tree[0]?.type || '',
        entityValue: tree[0]?.value || '',
        toolResults: [],
      });
      if (res?.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `stix_${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        addPocLine(`[export] Exported STIX 2.1 bundle (${res.data.objects?.length || 0} objects)`);
      }
    } catch (err) {
      addPocLine(`[export] STIX export failed: ${err.message}`);
    }
  }, [tree, leads, addPocLine]);

  const exportMitre = useCallback(async () => {
    addPocLine('[export] Generating MITRE ATT&CK mapping...');
    try {
      const res = await api.post('/terminal/export/mitre', {
        tree, leads,
        entityType: tree[0]?.type || '',
        entityValue: tree[0]?.value || '',
      });
      if (res?.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `mitre_attack_${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        addPocLine(`[export] Exported MITRE ATT&CK mapping (${res.data.objects?.length || 0} objects)`);
      }
    } catch (err) {
      addPocLine(`[export] MITRE export failed: ${err.message}`);
    }
  }, [tree, leads, addPocLine]);

  // ─── POC DOWNLOAD ───

  const buildFullHtmlReport = useCallback((markdown) => {
    const lines = markdown.split('\n');
    let bodyHtml = '';
    for (const line of lines) {
      if (line.startsWith('# ')) bodyHtml += `<h1 style="color:#22d3ee;border-bottom:2px solid #1e293b;padding-bottom:8px">${line.slice(2)}</h1>`;
      else if (line.startsWith('## ')) bodyHtml += `<h2 style="color:#34d399;margin-top:20px">${line.slice(3)}</h2>`;
      else if (line.startsWith('### ')) bodyHtml += `<h3 style="color:#818cf8;margin-top:16px">${line.slice(4)}</h3>`;
      else if (line.startsWith('- ')) bodyHtml += `<li style="color:#d1d5db;margin:2px 0">${line.slice(2)}</li>`;
      else if (line.startsWith('| ')) {
        const cells = line.split('|').filter(Boolean).map(c => c.trim());
        const isHeader = lines.indexOf(line) > 0 && lines[lines.indexOf(line) - 1]?.startsWith('|') && cells.some(c => c.includes('---'));
        if (!isHeader) bodyHtml += `<tr>${cells.map(c => `<td style="padding:6px 12px;border:1px solid #374151;color:#d1d5db">${c}</td>`).join('')}</tr>`;
      }
      else if (line.trim() === '') bodyHtml += '<br/>';
      else if (line.startsWith('---')) bodyHtml += '<hr style="border-color:#1e293b;margin:16px 0"/>';
      else bodyHtml += `<p style="color:#9ca3af;line-height:1.6">${line}</p>`;
    }
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>OsintX POC Report</title>
<style>body{font-family:'Inter',system-ui,-apple-system,sans-serif;background:#030712;color:#e5e7eb;max-width:900px;margin:40px auto;padding:20px}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:120px;font-weight:900;color:rgba(6,182,212,0.04);pointer-events:none;z-index:9999;white-space:nowrap;user-select:none}
table{width:100%;border-collapse:collapse;margin:12px 0}th{background:#1e293b;color:#22d3ee;padding:8px 12px;text-align:left;border:1px solid #374151}
@media print{body{background:#fff;color:#000}.watermark{color:rgba(0,0,0,0.04)!important}th{background:#f3f4f6;color:#111}td,th{border-color:#ddd}}
.footer{margin-top:30px;padding-top:12px;border-top:1px solid #1e293b;font-size:11px;color:#4b5563;text-align:center}
@media print{.footer{border-color:#ddd;color:#999}}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#374151;border-radius:3px}</style></head><body>
<div class="watermark">OsintX</div>
<h1 style="color:#22d3ee;font-size:28px;margin-bottom:4px">OsintX Investigation POC</h1>
<p style="color:#6b7280;font-size:13px;margin-top:0">Proof of Concept Report</p>
${bodyHtml}
<div class="footer">OsintX — Confidential Investigation Material</div>
<script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}</script>
</body></html>`;
  }, []);

  const downloadPoc = useCallback((format) => {
    const content = pocEditContent || buildTerminalPocMarkdown(tree, leads, pocOutput, selectedNode);
    const timestamp = Date.now();
    const caseName = tree[0]?.value?.replace(/[^a-zA-Z0-9]/g, '_') || 'investigation';

    if (format === 'md') {
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `poc_${caseName}_${timestamp}.md`; a.click();
      URL.revokeObjectURL(url);
      addPocLine('[export] POC exported as Markdown');
    } else if (format === 'html') {
      const html = buildFullHtmlReport(content);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `poc_${caseName}_${timestamp}.html`; a.click();
      URL.revokeObjectURL(url);
      addPocLine('[export] POC exported as HTML');
    } else if (format === 'pdf') {
      const html = buildFullHtmlReport(content);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      } else {
        addPocLine('[export] PDF blocked — allow popups for this site');
      }
      addPocLine('[export] POC opened for PDF print');
    } else if (format === 'docx') {
      const html = buildFullHtmlReport(content);
      const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `poc_${caseName}_${timestamp}.docx`; a.click();
      URL.revokeObjectURL(url);
      addPocLine('[export] POC exported as Word document');
    }
  }, [pocEditContent, tree, leads, pocOutput, selectedNode, addPocLine, buildFullHtmlReport]);

  // ─── NEXT ACTION ───

  const nextAction = useMemo(() => getNextBestAction(tree, leads, mode), [tree, leads, mode]);

  // ─── BATCH INVESTIGATION ───

  const runBatchInvestigation = useCallback(() => {
    const lines = batchInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      addChatMessage('system', 'No indicators to investigate. Enter one indicator per line.', { type: 'no_match' });
      return;
    }
    setBatchRunning(true);
    addChatMessage('system', `Batch investigation started: ${lines.length} indicators`, { type: 'tool_start', tool: 'Batch' });
    addPocLine(`[batch] Starting batch investigation: ${lines.length} indicators`);

    let idx = 0;
    const processNext = () => {
      if (idx >= lines.length) {
        setBatchRunning(false);
        setBatchMode(false);
        setBatchInput('');
        addChatMessage('system', 'Batch investigation completed.', { type: 'tool_done', tool: 'Batch' });
        addPocLine('[batch] Batch investigation completed');
        if (autoSaveEnabled) {
          setTimeout(() => { saveToCase(); addPocLine('[autosave] Auto-saved after batch'); }, 1000);
        }
        return;
      }
      const line = lines[idx];
      const ctype = classifyInput(line);
      addPocLine(`[batch] [${idx + 1}/${lines.length}] Processing: ${line} (${ctype})`);
      if (ctype !== 'general') {
        addChatMessage('analyst', line, { type: 'indicator', entityType: ctype });
        const root = addNode(null, ctype, line, 'Batch input', 'new', Math.floor(Math.random() * 20) + 70);
        setSelectedNode(root);
        const tools = TOOLS[ctype] || [];
        addChatMessage('system', `Classified as ${ctype}. Tools: ${tools.join(', ') || 'none available'}`, { type: 'classified', entityType: ctype, tools });
        addPocLine(`[batch] Classified as ${ctype}: ${line}`);
        if (tools.length > 0) {
          runToolWithAutoSave(root.id, tools[0]);
        } else {
          addChatMessage('system', `No tools available for ${ctype}.`, { type: 'no_match' });
        }
      } else {
        addChatMessage('system', `Could not classify: "${line}". Skipping.`, { type: 'no_match' });
        addPocLine(`[batch] Skipped (unclassifiable): ${line}`);
      }
      idx++;
      setTimeout(processNext, 3000 + Math.random() * 1000);
    };
    setTimeout(processNext, 500);
  }, [batchInput, addChatMessage, addPocLine, addNode, classifyInput, runToolWithAutoSave, autoSaveEnabled, saveToCase]);

  // ─── PLAYBOOK ENGINE ───

  const runPlaybook = useCallback((playbookId) => {
    const playbook = PLAYBOOKS[playbookId];
    if (!playbook) return;
    setSelectedPlaybook(playbookId);
    setShowingPlaybooks(false);
    addChatMessage('system', `Starting playbook: ${playbook.label}`, { type: 'tool_start', tool: 'Playbook' });
    addPocLine(`[playbook] Starting: ${playbook.label}`);

    let stepIdx = 0;
    const runNextStep = () => {
      if (stepIdx >= playbook.steps.length) {
        setSelectedPlaybook(null);
        addChatMessage('system', `Playbook "${playbook.label}" completed.`, { type: 'tool_done', tool: 'Playbook' });
        addPocLine(`[playbook] Completed: ${playbook.label}`);
        if (autoSaveEnabled) {
          setTimeout(() => { saveToCase(); addPocLine('[autosave] Auto-saved after playbook'); }, 1000);
        }
        return;
      }
      const step = playbook.steps[stepIdx];
      const matchingNodes = tree.filter(n => n.type === step.entityType && n.children.length === 0 && n.status !== 'dead_end' && n.status !== 'loop');
      if (matchingNodes.length === 0) {
        addPocLine(`[playbook] Step ${stepIdx + 1}: No ${step.entityType} nodes to investigate, skipping`);
        stepIdx++;
        setTimeout(runNextStep, 500);
        return;
      }
      addPocLine(`[playbook] Step ${stepIdx + 1}/${playbook.steps.length}: ${step.entityType} — ${step.tools.join(', ')}`);
      addChatMessage('system', `Playbook step ${stepIdx + 1}: Running ${step.tools[0]} on ${step.entityType} entities`, { type: 'tool_start', tool: step.tools[0] });

      let nodeIdx = 0;
      const runOnNextNode = () => {
        if (nodeIdx >= Math.min(matchingNodes.length, step.maxPivots || matchingNodes.length)) {
          stepIdx++;
          setTimeout(runNextStep, 1000);
          return;
        }
        const node = matchingNodes[nodeIdx];
        const toolName = step.tools[nodeIdx % step.tools.length];
        addPocLine(`[playbook] Running ${toolName} on ${node.value}`);
        runTool(node.id, toolName);
        nodeIdx++;
        setTimeout(runOnNextNode, 2500 + Math.random() * 1000);
      };
      setTimeout(runOnNextNode, 500);
    };
    setTimeout(runNextStep, 500);
  }, [tree, runTool, addChatMessage, addPocLine, autoSaveEnabled, saveToCase]);

  // ─── ENTITY ICON HELPER ───

  const EntityIcon = useCallback(({ type, className }) => {
    const ed = ENTITY_MAP[type];
    if (!ed?.icon) return null;
    const Ic = ed.icon;
    return <Ic className={className || 'h-3 w-3'} />;
  }, []);

  // ─── DIVIDER DRAG ───

  const startDividerDrag = (e, side) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = side === 'left' ? leftWidth : rightWidth;
    const onMove = (e) => {
      const delta = e.clientX - startX;
      if (side === 'left') setLeftWidth(Math.max(140, Math.min(400, startWidth + delta)));
      else setRightWidth(Math.max(140, Math.min(450, startWidth - delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // ─── FOCUS MODE ───

  const toggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
    if (focusMode) {
      setLeftVisible(true);
      setRightVisible(true);
    } else {
      setLeftVisible(false);
      setRightVisible(false);
    }
  }, [focusMode]);

  // ─── ENTITY CHIP CLICK ───

  const handleEntityChipClick = useCallback((entityValue, entityType) => {
    const ctype = entityType || classifyInput(entityValue);
    if (ctype !== 'general') {
      addChatMessage('analyst', entityValue, { type: 'indicator', entityType: ctype });
      const root = addNode(null, ctype, entityValue, 'Entity chip', 'new', 60);
      setSelectedNode(root);
      addPocLine(`[chip] Investigated: ${entityValue} (${ctype})`);
      const tools = TOOLS[ctype] || [];
      if (tools.length > 0) {
        addChatMessage('system', `${ctype}: ${entityValue}. Tools: ${tools.join(', ')}`, { type: 'classified', entityType: ctype, tools });
      }
    }
  }, [addChatMessage, addPocLine, addNode]);

  // ─── COMMAND PALETTE ACTIONS ───

  const paletteCommands = useMemo(() => [
    { id: 'quick', icon: '⚡', label: 'Quick Scan', keywords: 'scan quick', shortcut: '', action: runQuickScan },
    { id: 'deep', icon: '🌊', label: 'Deep Scan', keywords: 'scan deep', shortcut: '', action: runDeepScan },
    { id: 'batch', icon: '📋', label: 'Toggle Batch Mode', keywords: 'batch bulk', shortcut: '', action: () => setBatchMode(b => !b) },
    { id: 'sep1', icon: '', label: '', keywords: '', action: () => {} },
    { id: 'email_pb', icon: '📖', label: 'Playbook: Email Investigation', keywords: 'playbook email', shortcut: '', action: () => runPlaybook('email_investigation') },
    { id: 'domain_pb', icon: '📖', label: 'Playbook: Domain Investigation', keywords: 'playbook domain', shortcut: '', action: () => runPlaybook('domain_investigation') },
    { id: 'identity_pb', icon: '📖', label: 'Playbook: Identity Investigation', keywords: 'playbook identity', shortcut: '', action: () => runPlaybook('identity_investigation') },
    { id: 'infra_pb', icon: '📖', label: 'Playbook: Infrastructure Scan', keywords: 'playbook infrastructure', shortcut: '', action: () => runPlaybook('infrastructure_investigation') },
    { id: 'full_pb', icon: '📖', label: 'Playbook: Full Deep Dive', keywords: 'playbook full deep', shortcut: '', action: () => runPlaybook('full_investigation') },
    { id: 'sep2', icon: '', label: '', keywords: '', action: () => {} },
    { id: 'save_template', icon: '📝', label: 'Save as Template', keywords: 'template save', shortcut: '', action: () => setShowTemplateSave(true) },
    { id: 'load_template', icon: '📂', label: 'Load Template', keywords: 'template load', shortcut: '', action: () => { loadTemplates(); setShowTemplateLoad(true); } },
    { id: 'narrative', icon: '🤖', label: `Generate AI Narrative${narrativeLoading ? '...' : ''}`, keywords: 'ai narrative summary', shortcut: '', action: generateNarrative },
    { id: 'threshold', icon: '🎚', label: `Confidence Threshold (${minPivotConfidence}%)`, keywords: 'threshold confidence pivot', shortcut: '', action: () => setShowThresholdSlider(p => !p) },
    { id: 'sep3', icon: '', label: '', keywords: '', action: () => {} },
    { id: 'snapshot', icon: '📸', label: 'Take Snapshot', keywords: 'snapshot capture', shortcut: '', action: snapshotResults },
    { id: 'autosave', icon: '💾', label: `Toggle Auto-save (${autoSaveEnabled ? 'ON' : 'OFF'})`, keywords: 'autosave save auto', shortcut: '', action: () => setAutoSaveEnabled(p => !p) },
    { id: 'focus', icon: '🎯', label: `Toggle Focus Mode (${focusMode ? 'ON' : 'OFF'})`, keywords: 'focus graph fullscreen', shortcut: '', action: toggleFocusMode },
    { id: 'sep4', icon: '', label: '', keywords: '', action: () => {} },
    { id: 'export_csv', icon: '📥', label: 'Export CSV', keywords: 'export csv', shortcut: '', action: exportIocCsv },
    { id: 'export_json', icon: '📥', label: 'Export JSON', keywords: 'export json', shortcut: '', action: exportIocJson },
    { id: 'export_stix', icon: '🛡', label: 'Export STIX 2.1', keywords: 'export stix', shortcut: '', action: exportStix },
    { id: 'export_mitre', icon: '⚔', label: 'Export MITRE ATT&CK', keywords: 'export mitre attack', shortcut: '', action: exportMitre },
    { id: 'save_case', icon: '💾', label: 'Save to Case', keywords: 'save case', shortcut: '', action: saveToCase },
    { id: 'sep5', icon: '', label: '', keywords: '', action: () => {} },
    { id: 'clear', icon: '🗑', label: 'Clear Chat', keywords: 'clear chat', shortcut: '', action: () => setChatMessages([]) },
    { id: 'help', icon: '❓', label: 'Show Help', keywords: 'help commands', shortcut: '', action: () => handleCommand('/help') },
  ], [runQuickScan, runDeepScan, runPlaybook, snapshotResults, autoSaveEnabled, focusMode, toggleFocusMode, exportIocCsv, exportIocJson, exportStix, exportMitre, saveToCase, addPocLine, handleCommand, setBatchMode, setChatMessages, narrativeLoading, minPivotConfidence, generateNarrative, loadTemplates]);

  // ─── LEFT PANEL TABS ───

  const leftTabs = [
    { id: 'tree', icon: GitBranch, label: 'Tree' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'search', icon: Search, label: 'Search' },
  ];

  const rightTabs = [
    { id: 'leads', icon: List, label: 'Leads' },
    { id: 'live', icon: Zap, label: 'Live POC' },
    { id: 'preview', icon: Eye, label: 'Preview' },
    { id: 'edit', icon: Pen, label: 'Edit' },
    { id: 'timeline', icon: Clock, label: 'Timeline' },
    { id: 'graph', icon: Network, label: 'Graph' },
  ];

  // ─── RENDER ───

  const shell = (
    <div className="flex h-full flex-col bg-gray-950 text-gray-100 font-sans">

      {/* HEADER */}
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-gray-800/60 bg-gray-900/90 backdrop-blur-xl px-3 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs uppercase tracking-[0.25em] text-cyan-400 shrink-0">
            <SquareTerminal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Investigation Terminal</span>
            <span className="sm:hidden">Terminal</span>
          </div>
          <div className="flex items-center gap-0.5 rounded border border-gray-700/40 bg-gray-800/40 px-0.5 py-0.5">
            {['manual', 'autopilot-quick', 'autopilot-deep'].map(m => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                disabled={runbookRunning}
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-all ${
                  mode === m
                    ? m === 'manual' ? 'bg-amber-500/20 text-amber-400 shadow-sm' : 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                } ${runbookRunning ? 'cursor-not-allowed opacity-50' : ''}`}
                title={m === 'manual' ? 'Manual mode: you control every action'
                  : m === 'autopilot-quick' ? 'Autopilot Quick Scan: automatically scan leaf nodes'
                  : 'Autopilot Deep Scan: automatically scan all nodes'}
              >
                {m === 'manual' ? 'Manual' : m === 'autopilot-quick' ? 'Auto Q' : 'Auto D'}
              </button>
            ))}
          </div>

          {/* Run state indicator */}
          {runbookRunning && (
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
              <span className="text-[10px] text-amber-400/80">{runbookMode} {runbookProgress.current}/{runbookProgress.total}</span>
              {runbookPaused && <span className="text-[10px] text-amber-300">PAUSED</span>}
            </div>
          )}
          {runningTool && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-cyan-400/70">
              <RefreshCw className="h-2.5 w-2.5 animate-spin" /> {runningTool}
            </span>
          )}
          {stopReason && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-amber-400/80 truncate max-w-[200px]">
              <AlertTriangle className="h-2.5 w-2.5 shrink-0" /> {stopReason}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Node/lead counts */}
          {!focusMode && (
            <span className="text-[10px] text-gray-600 hidden sm:inline">
              {tree.length}n · {leads.filter(l => l.status === 'new' || l.status === 'accepted').length}l
            </span>
          )}

          {/* Stop Investigation */}
          {(runbookRunning || runningTool || queueRunning || batchRunning) && (
            <button
              onClick={stopRunbook}
              className="flex items-center gap-1 rounded bg-red-500/15 px-2 py-0.5 text-[10px] text-red-400 hover:bg-red-500/25 transition-colors animate-pulse"
              title="Stop all running investigations"
            >
              <XCircle className="h-3 w-3" /> Stop
            </button>
          )}

          {/* Focus mode toggle */}
          <button
            onClick={toggleFocusMode}
            className={`rounded p-1 text-[10px] transition-colors ${focusMode ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-500 hover:text-gray-300'}`}
            title="Toggle focus mode"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>

          {/* Confidence threshold */}
          <div className="relative">
            <button
              onClick={() => setShowThresholdSlider(p => !p)}
              className={`rounded p-1 text-[10px] transition-colors ${minPivotConfidence > 40 ? 'text-amber-400' : 'text-gray-500 hover:text-gray-300'}`}
              title={`Min pivot confidence: ${minPivotConfidence}%`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
            {minPivotConfidence > 40 && (
              <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
            )}
          </div>

          {/* Cmd+K hint / button */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden sm:flex items-center gap-1 rounded border border-gray-700/50 bg-gray-800/50 px-2 py-0.5 text-[10px] text-gray-500 hover:text-gray-300 hover:border-gray-600/50 transition-colors"
          >
            <Zap className="h-2.5 w-2.5" /> Commands <kbd className="ml-1 font-mono text-[8px] text-gray-600">⌘K</kbd>
          </button>

          {/* Download POC dropdown */}
          {tree.length > 0 && (
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setShowDownloadMenu(prev => !prev)}
                className="flex items-center gap-1 rounded border border-gray-700/50 bg-gray-800/50 px-1.5 py-0.5 text-[10px] text-gray-500 hover:text-gray-300 hover:border-gray-600/50 transition-colors"
                title="Download POC Report"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">POC</span>
                <ChevronDown className={`h-2.5 w-2.5 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-gray-700/60 bg-gray-900/95 backdrop-blur-xl shadow-xl py-1">
                  <button onClick={() => { setShowDownloadMenu(false); downloadPoc('md'); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors">
                    <FileText className="h-3 w-3 text-cyan-400" /> Markdown (.md)
                  </button>
                  <button onClick={() => { setShowDownloadMenu(false); downloadPoc('html'); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors">
                    <Globe className="h-3 w-3 text-emerald-400" /> HTML Report
                  </button>
                  <button onClick={() => { setShowDownloadMenu(false); downloadPoc('pdf'); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors">
                    <FileText className="h-3 w-3 text-rose-400" /> PDF Report
                  </button>
                  <button onClick={() => { setShowDownloadMenu(false); downloadPoc('docx'); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors">
                    <FileText className="h-3 w-3 text-blue-400" /> Word (.docx)
                  </button>
                  <div className="my-1 border-t border-gray-800/60" />
                  <button onClick={() => { setShowDownloadMenu(false); exportStix(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors">
                    <Shield className="h-3 w-3 text-violet-400" /> STIX 2.1
                  </button>
                  <button onClick={() => { setShowDownloadMenu(false); exportMitre(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors">
                    <Siren className="h-3 w-3 text-rose-400" /> MITRE ATT&CK
                  </button>
                  <div className="my-1 border-t border-gray-800/60" />
                  <button onClick={() => { setShowDownloadMenu(false); saveToCase(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-gray-300 hover:bg-gray-800 transition-colors">
                    <Save className="h-3 w-3 text-amber-400" /> Save to Case
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Save notification */}
          {saveNotification && (
            <span className={`text-[10px] ${saveNotification.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {saveNotification.text}
            </span>
          )}

          {!isTab && (
            <button onClick={() => onClose?.()} className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* MAIN 3-PANEL */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT PANEL */}
        {leftVisible && (
          <>
            <div className="flex shrink-0 min-h-0 flex-col border-r border-gray-800/60 bg-gray-900/50" style={{ width: leftWidth }}>
              <div className="flex border-b border-gray-800/60">
                {leftTabs.map(tab => (
                  <button key={tab.id} onClick={() => setLeftTab(tab.id)} className={`flex flex-1 items-center justify-center gap-1.5 border-r border-gray-800/60 py-2 text-[11px] font-medium transition-colors ${leftTab === tab.id ? 'bg-gray-950 text-cyan-400 border-b-2 border-b-cyan-400' : 'bg-gray-900/50 text-gray-500 hover:text-gray-300'}`}>
                    <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {leftTab === 'tree' && (
                  <div className="p-1.5">
                    <div className="mb-1.5 flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      <span>Investigation Tree</span>
                      <span className="text-[9px] text-gray-600">{tree.length} nodes</span>
                    </div>
                    {tree.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-gray-600">
                        <GitBranch className="h-6 w-6 mx-auto mb-2 text-gray-700" />
                        Enter an indicator to begin your investigation tree.
                      </div>
                    ) : (
                      tree.filter(n => !n.parentId).map(root => (
                        <TreeNode key={root.id} node={root} tree={tree} selected={selectedNode} onSelect={handleNodeSelect} depth={0} />
                      ))
                    )}
                  </div>
                )}

                {leftTab === 'history' && (
                  <div className="p-2 text-center text-[10px] text-gray-600">
                    <History className="h-5 w-5 mx-auto mb-2 text-gray-700" />
                    Investigation history will appear here.
                  </div>
                )}

                {leftTab === 'search' && (
                  <div className="p-2 space-y-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-gray-700/50 bg-gray-800/50 px-2 py-1.5">
                      <Search className="h-3 w-3 text-gray-500" />
                      <input className="w-full bg-transparent text-xs text-gray-200 outline-none placeholder:text-gray-600" placeholder="Search entities..." />
                    </div>
                    {Object.keys(entityMemory).length > 0 && (
                      <div>
                        <div className="flex items-center justify-between px-1 py-1 text-[10px]">
                          <span className="font-semibold uppercase tracking-wider text-gray-500">Entity Memory</span>
                          <span className="text-gray-600">{Object.keys(entityMemory).length} known</span>
                        </div>
                        <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                          {Object.entries(entityMemory).sort(([,a], [,b]) => b.lastSeen - a.lastSeen).slice(0, 30).map(([key, mem]) => {
                            const edef = ENTITY_MAP[mem.type];
                            const ago = Math.round((Date.now() - mem.lastSeen) / 86400000);
                            return (
                              <div key={key} className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px] text-gray-300 hover:bg-gray-800/50 cursor-default">
                                <span className={`shrink-0 ${edef?.color || 'text-gray-400'}`}>
                                  {edef ? <edef.icon className="h-2.5 w-2.5" /> : <Activity className="h-2.5 w-2.5" />}
                                </span>
                                <span className="truncate flex-1">{mem.value}</span>
                                <span className="text-[8px] text-gray-600">{ago}d ago</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-800/60 bg-gray-900/50 px-3 py-1.5 text-[10px] text-gray-500">
                <span>{leftTab === 'tree' ? `${tree.length} nodes` : leftTab === 'history' ? 'history' : 'search'}</span>
                <button onClick={() => setLeftVisible(false)} className="rounded p-0.5 hover:bg-gray-800 hover:text-gray-400" title="Close panel"><X className="h-3 w-3" /></button>
              </div>
            </div>
            <div className="w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-cyan-500/30 active:bg-cyan-400/40" onMouseDown={e => startDividerDrag(e, 'left')} />
          </>
        )}

        {!leftVisible && (
          <button onClick={() => setLeftVisible(true)} className="flex w-5 shrink-0 items-center justify-center border-r border-gray-800/60 bg-gray-900/50 text-gray-500 hover:text-gray-300" title="Show left panel">
            <PanelLeftOpen className="h-3 w-3" />
          </button>
        )}

        {/* CENTER PANEL */}
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-gray-950">
          <div className="flex items-center border-b border-gray-800/60 bg-gray-900/50 px-4 py-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-200">
              {focusMode ? (
                <><Network className="h-4 w-4 text-cyan-400" /> Entity Graph</>
              ) : (
                <><MessageCircle className="h-4 w-4 text-cyan-400" /> Investigation Chat</>
              )}
            </div>
            {!focusMode && (
              <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-500">
                {selectedNode && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <EntityIcon type={selectedNode.type} className="h-3 w-3" />
                    {selectedNode.value?.substring(0, 20)}
                  </span>
                )}
                <button onClick={() => setChatMessages([])} className="rounded-lg px-2.5 py-1 hover:bg-gray-800 transition-colors">Clear</button>
              </div>
            )}
          </div>

          {focusMode ? (
            <div className="flex-1 min-h-0 overflow-hidden bg-gray-950/80">
              {tree.length === 0 ? (
                <div className="flex h-full items-center justify-center text-center text-xs text-gray-600">
                  <div><Network className="h-8 w-8 mx-auto mb-2 text-gray-700" /><p>Enter an indicator to build the graph</p></div>
                </div>
              ) : (
                <EntityGraph tree={tree} selectedNode={selectedNode} onSelect={handleNodeSelect} />
              )}
            </div>
          ) : (<>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 custom-scrollbar">
            <div className="space-y-2">
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="flex gap-2">
                  {msg.who === 'analyst' ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-[10px] font-bold text-cyan-400">U</div>
                  ) : msg.who === 'system' ? (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-700/30 text-[10px] font-bold text-gray-400"><Cpu className="h-3 w-3" /></div>
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-400">AI</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <span className="font-medium text-gray-300">
                        {msg.who === 'analyst' ? 'You' : msg.who === 'system' ? 'System' : 'AI Assistant'}
                      </span>
                      {msg.type === 'classified' && msg.tools && (
                        <div className="flex items-center gap-1">
                          {msg.tools.map(t => (
                              <button
                                key={t}
                                onClick={() => { const n = tree[tree.length - 1]; if (n) runToolWithAutoSave(n.id, t); }}
                                className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[9px] text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                              >
                                {t}
                              </button>
                          ))}
                        </div>
                      )}
                      {msg.type === 'pivot_found' && msg.entityType && (
                        <span className={`text-[9px] ${ENTITY_MAP[msg.entityType]?.color || 'text-gray-500'}`}>
                          {ENTITY_MAP[msg.entityType]?.label} · {msg.confidence}%
                        </span>
                      )}
                      {msg.type === 'tool_start' && (
                        <span className="flex items-center gap-1 text-[9px] text-amber-400"><RefreshCw className="h-2.5 w-2.5 animate-spin" /> running...</span>
                      )}
                    </div>
                    <div className="text-xs leading-relaxed text-gray-300">
                      {msg.who === 'system' && typingEnabled && msg.type && !['no_match', 'tool_done'].includes(msg.type) ? (
                        <TypingText text={msg.text} speed={12} active={true} />
                      ) : (
                        <span>{parseMessageEntities(msg.text).map((seg, j) =>
                          seg.type === 'entity' ? (
                            <span
                              key={j}
                              onClick={() => handleEntityChipClick(seg.value, seg.entityType)}
                              className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 cursor-pointer transition-all mx-0.5 ${seg.bg} ${seg.color} hover:opacity-80 border border-transparent hover:border-current`}
                              title={`Investigate ${seg.value}`}
                            >
                              {(() => { const Ic = ENTITY_MAP[seg.entityType]?.icon; return Ic ? <Ic className="h-2.5 w-2.5" /> : null; })()}
                              {seg.value}
                            </span>
                          ) : (
                            <span key={j}>{seg.value}</span>
                          )
                        )}</span>
                      )}
                      {msg.runId && toolOutputs[msg.runId] && toolOutputs[msg.runId].length > 0 && (
                        <div className="mt-1.5 rounded-lg border border-gray-800/60 bg-gray-950/80 p-2 font-mono text-[10px] leading-5 overflow-x-auto max-h-48 overflow-y-auto">
                          {toolOutputs[msg.runId].map((line, li) => (
                            <div key={li} className={`whitespace-pre-wrap ${
                              line.includes('✗') || line.includes('ERROR') || line.includes('FAILED') || line.includes('CRITICAL')
                                ? 'text-red-400'
                                : line.includes('✓')
                                  ? 'text-emerald-400'
                                  : line.includes('╰─')
                                    ? 'text-gray-400'
                                    : line.startsWith('$')
                                      ? 'text-cyan-400 font-semibold'
                                      : 'text-gray-500'
                            }`}>
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
                      {msg.result?.images?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {msg.result.images.map((img, idx) => (
                            <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer"
                              className="group relative block w-20 h-20 rounded-lg overflow-hidden border border-gray-700/50 hover:border-cyan-500/50 transition-all"
                              title={`${img.label} (${img.source || 'tool'})`}
                            >
                              <img src={img.url} alt={img.label}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                                loading="lazy"
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                                <span className="text-[7px] text-gray-300 truncate block">{img.source || ''}</span>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Streaming tool result */}
          <AnimatePresence>
            {streamingResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-cyan-500/20 bg-cyan-500/5 px-4 py-2"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono text-cyan-500 font-semibold">{streamingResult.tool}</span>
                  <span className="text-[9px] text-cyan-600">LIVE</span>
                </div>
                <div className="text-xs text-cyan-300/90 font-mono leading-relaxed max-h-32 overflow-y-auto">
                  <TypingText text={streamingResult.summary} speed={8} active={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Next Best Action */}
          {tree.length > 0 && (
            <NextActionBar action={nextAction} onAction={handleNextAction} />
          )}

          {/* APPROVAL GATE */}
          {pendingPivotApproval && (
            <div className="border-t border-amber-500/30 bg-amber-500/10 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Approve pivot: <strong>{pendingPivotApproval.lead.value}</strong> (<span className={ENTITY_MAP[pendingPivotApproval.lead.type]?.color}>{ENTITY_MAP[pendingPivotApproval.lead.type]?.label || pendingPivotApproval.lead.type}</span>) via {pendingPivotApproval.toolName}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={pendingPivotApproval.onApprove} className="rounded bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/30 transition-colors">Approve</button>
                <button onClick={() => {
                  pendingPivotApproval.onApprove();
                  addChatMessage('system', 'Approval requirement disabled for future pivots — auto-approving all.', { type: 'tool_done', tool: 'Approval' });
                  setRequireApproval(false);
                }} className="rounded bg-emerald-600/20 px-3 py-1 text-[11px] text-emerald-300 hover:bg-emerald-600/30 transition-colors" title="Approve this and auto-approve all future pivots">
                  <CheckCircle className="h-3 w-3 inline mr-0.5" />Approve All
                </button>
                <button onClick={pendingPivotApproval.onReject} className="rounded bg-red-500/20 px-3 py-1 text-[11px] text-red-400 hover:bg-red-500/30 transition-colors">Reject</button>
                <button onClick={() => { setPendingPivotApproval(null); setRequireApproval(false); addChatMessage('system', 'Approval requirement disabled for future pivots.', { type: 'tool_done', tool: 'Approval' }); }} className="rounded bg-gray-700/30 px-3 py-1 text-[11px] text-gray-400 hover:bg-gray-700/50 transition-colors">Reject All</button>
              </div>
            </div>
          )}

          {/* INPUT */}
          <div className="border-t border-gray-800/60 bg-gray-900/50 p-3">
            {batchMode ? (
              <div className="space-y-2">
                <textarea
                  value={batchInput}
                  onChange={e => setBatchInput(e.target.value)}
                  placeholder="Paste multiple indicators, one per line:&#10;email@test.com&#10;example.com&#10;8.8.8.8&#10;@username&#10;+1234567890"
                  className="w-full rounded-xl border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-600 resize-none font-mono"
                  rows={4}
                  spellCheck={false}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">{batchInput.split('\n').filter(Boolean).length} indicators</span>
                  <button onClick={runBatchInvestigation} disabled={batchRunning} className="flex items-center gap-1.5 rounded-lg bg-violet-500/15 px-4 py-1.5 text-xs font-medium text-violet-400 hover:bg-violet-500/25 transition-colors disabled:opacity-40">
                    {batchRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                    {batchRunning ? 'Running...' : 'Run Batch'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-gray-700/50 bg-gray-800/50 px-3 py-2">
                <input
                  value={chatInput}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
                  className="chat-input flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-600"
                  placeholder="Enter email, domain, IP, phone, username, wallet..."
                />
                {classifiedType && <ClassificationTag type={classifiedType} />}
                <div className="hidden sm:flex items-center gap-1">
                  {['/help', '/tree', '/leads', '/poc'].map(cmd => (
                    <button key={cmd} onClick={() => setChatInput(cmd)} className="rounded border border-gray-700/50 bg-gray-800/50 px-1.5 py-0.5 font-mono text-[9px] text-gray-500 hover:border-cyan-500/30 hover:text-cyan-400 transition-colors">{cmd}</button>
                  ))}
                </div>
                <button onClick={sendMessage} className="flex items-center gap-1.5 rounded-lg bg-cyan-500/15 px-4 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/25 transition-colors">
                  <Send className="h-3.5 w-3.5" /> Send
                </button>
              </div>
            )}
          </div>
            </>
          )}

        </div>

        {/* RIGHT PANEL */}
        {rightVisible && (
          <>
            <div className="w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-emerald-500/30 active:bg-emerald-400/40" onMouseDown={e => startDividerDrag(e, 'right')} />
            <div className="flex shrink-0 min-h-0 flex-col border-l border-gray-800/60 bg-gray-900/50" style={{ width: rightWidth }}>
              <div className="flex border-b border-gray-800/60">
                {rightTabs.map(tab => (
                  <button key={tab.id} onClick={() => setRightTab(tab.id)} className={`flex flex-1 items-center justify-center gap-1.5 border-r border-gray-800/60 py-2 text-[11px] font-medium transition-colors ${rightTab === tab.id ? 'bg-gray-950 text-emerald-400 border-b-2 border-b-emerald-400' : 'bg-gray-900/50 text-gray-500 hover:text-gray-300'}`}>
                    <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {/* LEADS TAB */}
                {rightTab === 'leads' && (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-1.5 text-[11px] text-gray-500">
                      <span className="font-semibold uppercase tracking-wider">Lead Inbox</span>
                      <span className="text-[10px] text-gray-600">{leads.filter(l => l.status === 'new' || l.status === 'accepted').length} open</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                      {leads.length === 0 ? (
                        <div className="p-4 text-center text-[10px] text-gray-600">
                          <List className="h-5 w-5 mx-auto mb-2 text-gray-700" />
                          Extracted pivots will appear here as leads.
                        </div>
                      ) : (
                        leads.map(lead => (
                          <LeadItem key={lead.id} lead={lead} onAccept={acceptLead} onIgnore={ignoreLead} />
                        ))
                      )}
                    </div>
                    <div className="flex items-center gap-2 border-t border-gray-800/60 px-3 py-1.5 text-[9px] text-gray-500">
                      <span>{leads.length} total</span>
                      <span>{leads.filter(l => l.status === 'new').length} new</span>
                      <span>{leads.filter(l => l.status === 'investigating').length} active</span>
                      <span>{leads.filter(l => l.status === 'resolved').length} resolved</span>
                    </div>
                  </div>
                )}

                {/* LIVE POC TAB */}
                {rightTab === 'live' && (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-1.5 text-[11px] text-gray-500">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-emerald-400" />
                        <span>Live POC Builder</span>
                      </span>
                      <span className="flex items-center gap-1 text-[9px]">
                        <span className={`h-1.5 w-1.5 rounded-full ${runningTool ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                        {runningTool ? 'Recording' : 'Idle'}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {pocOutput.length === 0 ? (
                        <div className="p-4 text-center text-[10px] text-gray-600">
                          <FileText className="h-5 w-5 mx-auto mb-2 text-gray-700" />
                          Investigation events will appear here in real-time as a live POC report.
                        </div>
                      ) : (
                        <div className="space-y-0.5 font-mono">
                          {pocOutput.map((line, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.01 }}
                              className={`text-[10px] leading-5 ${
                                line.startsWith('[indicator]') ? 'text-cyan-400' :
                                line.startsWith('[tool]') ? 'text-amber-400' :
                                line.startsWith('[lead]') ? 'text-emerald-400' :
                                line.startsWith('[pivot]') ? 'text-violet-400' :
                                line.startsWith('[runbook]') ? 'text-rose-400' :
                                line.startsWith('[tool]') && line.includes('Running') ? 'text-blue-400' :
                                'text-gray-500'
                              }`}
                            >
                              <span className="text-gray-700 mr-1.5 select-none">{String(i + 1).padStart(3, '0')}</span>
                              {line}
                              {i === pocOutput.length - 1 && runningTool && (
                                <span className="inline-block ml-0.5 h-3 w-1.5 bg-emerald-400/70 animate-pulse" />
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-800/60 px-3 py-1.5 text-[9px] text-gray-600 flex items-center justify-between">
                      <span>{pocOutput.length} events · {tree.length} entities · {leads.length} leads</span>
                      {pocOutput.length > 0 && (
                        <button onClick={() => setRightTab('preview')} className="text-emerald-500 hover:text-emerald-400 transition-colors">
                          View Full Report →
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* PREVIEW TAB */}
                {rightTab === 'preview' && (
                  <div className="flex min-h-0 h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-1.5 text-[11px] text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold uppercase tracking-wider">Report</span>
                        <div className="relative">
                          <button
                            onClick={() => setShowStyleMenu(p => !p)}
                            className="flex items-center gap-1 rounded bg-gray-800/50 px-2 py-0.5 text-[9px] text-gray-400 hover:text-gray-300 transition-colors"
                          >
                            {({ executive: 'Executive', technical: 'Technical', simplified: 'Simplified' })[reportStyle]}
                            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          {showStyleMenu && (
                            <div className="absolute left-0 top-full mt-1 z-50 w-40 rounded-lg border border-gray-700/60 bg-gray-900/95 backdrop-blur-xl shadow-xl py-1">
                              {Object.entries({ executive: 'Executive', technical: 'Technical', simplified: 'Simplified' }).map(([key, label]) => (
                                <button key={key} onClick={() => { setShowStyleMenu(false); setReportStyle(key); generateReport(key); }}
                                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${reportStyle === key ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-300 hover:bg-gray-800'}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 custom-scrollbar">
                      {reportLoading ? (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-cyan-400" />
                            <p className="text-xs text-gray-500">Generating {reportStyle} report...</p>
                          </div>
                        </div>
                      ) : reportData ? (
                        <ProfessionalReport
                          report={reportData}
                          onRegenerate={() => generateReport(reportStyle)}
                          loading={reportLoading}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center text-xs text-gray-600">
                          <div><FileText className="h-8 w-8 mx-auto mb-2 text-gray-700" /><p>Investigate entities first, then the report will auto-generate.</p></div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 border-t border-gray-800/60 px-3 py-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${runningTool ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                      <span className="text-[10px] text-gray-600">{runningTool ? `Running ${runningTool}...` : 'Live'}</span>
                      <span className="ml-auto flex gap-1">
                        <button onClick={() => downloadPoc('html')} className="rounded px-2 py-0.5 text-[10px] text-cyan-400 hover:bg-gray-800 transition-colors" title="Download HTML"><Globe className="h-3 w-3 inline mr-1" />HTML</button>
                        <button onClick={() => downloadPoc('md')} className="rounded px-2 py-0.5 text-[10px] text-cyan-400 hover:bg-gray-800 transition-colors" title="Download Markdown"><FileText className="h-3 w-3 inline mr-1" />MD</button>
                        <button onClick={saveToCase} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors" title="Save to Case"><Save className="h-3 w-3" /></button>
                      </span>
                    </div>
                  </div>
                )}

                {/* EDIT TAB */}
                {rightTab === 'edit' && (
                  <div className="flex min-h-0 h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-1.5 text-[11px] text-gray-500">
                      <span className="font-semibold uppercase tracking-wider">{showDiff ? 'Diff View' : 'POC Editor'}</span>
                      <div className="flex gap-1">
                        {!showDiff && resultSnapshots.length >= 2 && (
                          <button onClick={() => { compareSnapshots(resultSnapshots.length - 2, resultSnapshots.length - 1); setShowDiff(true); }} className="rounded px-2 py-0.5 text-[9px] text-cyan-400 hover:bg-gray-800 transition-colors" title="Compare last two snapshots">
                            <GitBranch className="h-3 w-3 inline mr-1" />Diff
                          </button>
                        )}
                        {showDiff && (
                          <button onClick={() => setShowDiff(false)} className="rounded px-2 py-0.5 text-[9px] text-gray-400 hover:bg-gray-800 transition-colors">
                            Editor
                          </button>
                        )}
                        <button onClick={saveToCase} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors" title="Save"><Save className="h-3.5 w-3.5" /></button>
                        <button onClick={exportIocJson} className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors" title="Export"><Download className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                    {showDiff && diffResult ? (
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="text-cyan-400">{diffResult.snapshotA}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="text-amber-400">{diffResult.snapshotB}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1">
                            <span className="block text-emerald-400 font-semibold">+{diffResult.treeCountDiff > 0 ? diffResult.treeCountDiff : 0}</span>
                            <span className="text-gray-400">entities</span>
                          </div>
                          <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2 py-1">
                            <span className="block text-violet-400 font-semibold">+{diffResult.leadCountDiff > 0 ? diffResult.leadCountDiff : 0}</span>
                            <span className="text-gray-400">leads</span>
                          </div>
                        </div>
                        {diffResult.newEntities.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">New Entities ({diffResult.newEntities.length})</h4>
                            <div className="space-y-0.5">
                              {diffResult.newEntities.map((e, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-300 font-mono">
                                  <span className={`w-1 h-1 rounded-full bg-emerald-400`} />
                                  <span className="text-gray-500">{e.type}</span>
                                  <span>{e.value}</span>
                                  <span className="text-gray-600">{e.confidence}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {diffResult.newLeads.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1">New Leads ({diffResult.newLeads.length})</h4>
                            <div className="space-y-0.5">
                              {diffResult.newLeads.map((l, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-300 font-mono">
                                  <span className={`w-1 h-1 rounded-full bg-violet-400`} />
                                  <span className="text-gray-500">{l.type}</span>
                                  <span>{l.value}</span>
                                  <span className="text-gray-600">{l.score}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {diffResult.changedEntities.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1">Changed Entities ({diffResult.changedEntities.length})</h4>
                            <div className="space-y-0.5">
                              {diffResult.changedEntities.map((e, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[10px] text-gray-300 font-mono">
                                  <span className="w-1 h-1 rounded-full bg-amber-400" />
                                  <span className="text-gray-500">{e.type}</span>
                                  <span>{e.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!diffResult.newEntities.length && !diffResult.newLeads.length && !diffResult.changedEntities.length && (
                          <p className="text-[11px] text-gray-500 text-center py-8">No differences found between these snapshots.</p>
                        )}
                      </div>
                    ) : (
                      <textarea value={pocEditContent} onChange={e => setPocEditContent(e.target.value)} className="flex-1 resize-none bg-gray-950 p-3 font-mono text-sm leading-relaxed text-gray-300 outline-none custom-scrollbar" spellCheck={false} />
                    )}
                    {!showDiff && (
                      <div className="flex items-center justify-between border-t border-gray-800/60 px-3 py-1.5 text-[10px] text-gray-600">
                        <span>Markdown · {pocEditContent.split('\n').length} lines</span>
                        <button className="flex items-center gap-1 rounded-lg bg-cyan-500/15 px-3 py-1 text-[11px] text-cyan-400 hover:bg-cyan-500/25 transition-colors"><Save className="h-3 w-3" /> Save Draft</button>
                      </div>
                    )}
                  </div>
                )}

                {/* TIMELINE TAB */}
                {rightTab === 'timeline' && (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-1.5 text-[11px] text-gray-500">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-emerald-400" />
                        <span>Timeline</span>
                      </span>
                      <span className="text-[10px] text-gray-600">{pocOutput.length} events</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {pocOutput.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-xs text-gray-600">
                          <div className="text-center"><Clock className="h-8 w-8 mx-auto mb-2 text-gray-700" /><p>No timeline events yet</p></div>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-800" />
                          {pocOutput.map((line, i) => {
                            const isTool = line.startsWith('[tool]');
                            const isLead = line.startsWith('[lead]');
                            const isPivot = line.startsWith('[pivot]');
                            const isIndicator = line.startsWith('[indicator]');
                            const dotColor = isIndicator ? 'bg-cyan-400' : isTool ? 'bg-amber-400' : isLead ? 'bg-emerald-400' : isPivot ? 'bg-violet-400' : 'bg-gray-600';
                            return (
                              <div key={i} className="relative flex gap-3 pb-3">
                                <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotColor} border-2 border-gray-950 z-10`} style={{ marginLeft: '10px' }} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-[9px] text-gray-600 font-mono">{String(i + 1).padStart(3, '0')}</div>
                                  <div className={`text-[11px] ${
                                    isIndicator ? 'text-cyan-300' : isTool ? 'text-amber-300' : isLead ? 'text-emerald-300' : isPivot ? 'text-violet-300' : 'text-gray-400'
                                  }`}>{line}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-800/60 px-3 py-1.5 text-[9px] text-gray-600 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> Indicator
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Tool
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Lead
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Pivot
                    </div>
                  </div>
                )}

                {/* GRAPH TAB */}
                {rightTab === 'graph' && (
                  <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-gray-800/60 px-3 py-1.5 text-[11px] text-gray-500">
                      <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <Network className="h-3 w-3 text-emerald-400" />
                        <span>Entity Graph</span>
                      </span>
                      <span className="text-[10px] text-gray-600">{tree.length} nodes · {leads.length} leads</span>
                    </div>
                    <div className="flex-1 min-h-0 p-2">
                      {tree.length + leads.length > 0 ? (
                        <EntityRelationshipGraph
                          tree={tree}
                          leads={leads}
                          onSelectNode={handleNodeSelect}
                          selectedNode={selectedNode}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-600">
                          <div className="text-center"><Network className="h-8 w-8 mx-auto mb-2 text-gray-700" /><p>No data to visualize</p></div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-800/60 bg-gray-900/50 px-3 py-1.5 text-[10px] text-gray-500">
                <span>{rightTab === 'leads' ? `${leads.length} leads` : rightTab === 'live' ? `${pocOutput.length} events` : rightTab === 'preview' ? 'live' : rightTab === 'edit' ? 'editable' : 'view'}</span>
                <button onClick={() => setRightVisible(false)} className="rounded p-0.5 hover:bg-gray-800 hover:text-gray-400" title="Close panel"><X className="h-3 w-3" /></button>
              </div>
            </div>
          </>
        )}

        {!rightVisible && (
          <button onClick={() => setRightVisible(true)} className="flex w-5 shrink-0 items-center justify-center border-l border-gray-800/60 bg-gray-900/50 text-gray-500 hover:text-gray-300" title="Show right panel">
            <PanelRightOpen className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* STATUS BAR */}
      <footer className="flex h-[22px] shrink-0 items-center justify-between bg-gradient-to-r from-cyan-600 to-cyan-700 px-3 text-[11px] text-white">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium"><Wifi className="h-3 w-3" /> {mode === 'manual' ? 'Manual' : mode === 'autopilot-quick' ? 'Auto Quick' : 'Auto Deep'}</span>
          <span className="flex items-center gap-1.5 text-white/70">tree: {tree.length}</span>
          <span className="flex items-center gap-1.5 text-white/70">leads: {leads.filter(l => l.status === 'new' || l.status === 'accepted').length}</span>
          <span className={`flex items-center gap-1 ${autoSaveEnabled ? 'text-emerald-300' : 'text-white/40'}`}>
            <Save className="h-2.5 w-2.5" /> auto
          </span>
          {runbookRunning && (
            <span className="flex items-center gap-1 text-amber-300">
              <RefreshCw className="h-2.5 w-2.5 animate-spin" /> {runbookMode} scan {runbookProgress.current}/{runbookProgress.total}
            </span>
          )}
          {runbookPaused && (
            <span className="flex items-center gap-1 text-amber-300">
              <Clock3 className="h-2.5 w-2.5" /> PAUSED
            </span>
          )}
          {skippedDuplicates > 0 && (
            <span className="flex items-center gap-1 text-white/50">
              dup: {skippedDuplicates}
            </span>
          )}
          {consecutiveDuplicates >= 3 && (
            <span className="flex items-center gap-1 text-amber-300">
              <AlertTriangle className="h-2.5 w-2.5" />consec: {consecutiveDuplicates}/5
            </span>
          )}
          {pendingPivotApproval && (
            <span className="flex items-center gap-1 text-amber-300">
              <AlertTriangle className="h-2.5 w-2.5" /> approval
            </span>
          )}
          {resultSnapshots.length > 0 && (
            <span className="flex items-center gap-1 text-white/50"><Camera className="h-2.5 w-2.5" />{resultSnapshots.length}</span>
          )}
          <span className="flex items-center gap-1 text-white/40"><History className="h-2.5 w-2.5" />{Object.keys(entityMemory).length}</span>
          {appSettings.apiTimeout && (
            <span className="flex items-center gap-1 text-white/40"><Clock className="h-2.5 w-2.5" />{appSettings.apiTimeout / 1000}s</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {runningTool && <span className="flex items-center gap-1 text-white/70"><RefreshCw className="h-2.5 w-2.5 animate-spin" /> {runningTool}</span>}
          <Sparkles className="h-3 w-3 text-white/70" />
          <span className="font-mono text-[11px]">v8</span>
          <Clock3 className="h-3 w-3 text-white/70" />
          <span>{currentTime.toLocaleTimeString('en-GB', { hour12: false })}</span>
        </div>
      </footer>

      {/* Command palette overlay */}
      <CommandPalette
        show={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={paletteCommands}
      />

      {/* Template modals */}
      {TemplateSaveModal}
      {TemplateLoadModal}

      {/* Confidence threshold slider */}
      {ThresholdSlider}

      {/* Splash screen */}
      <SplashOverlay
        show={showSplash}
        onComplete={() => setShowSplash(false)}
      />

      {/* Save to Case modal */}
      <SaveToCaseModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        data={{
          tree,
          leads,
          pocContent: pocEditContent,
          nodeCount: tree.length,
          leadCount: leads.length,
          timestamp: new Date().toISOString(),
        }}
        toolName="Investigation Terminal"
        query={`${tree.length} entities, ${leads.length} leads`}
      />
    </div>
  );

  if (!isOpen && !isTab) return null;
  if (isTab) return <div className="fixed inset-x-0 z-50 overflow-hidden" style={{ top: '96px', bottom: 0 }}>{shell}</div>;
  return <div className="fixed z-50 overflow-hidden" style={sizePresets[terminalSize]}>{shell}</div>;
}
