import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegram } from '../../../context/TelegramContext';
import { useNavigate } from 'react-router-dom';
import telegramService from '../../../services/telegramService';
import SaveToCaseModal from '../../../components/common/SaveToCaseModal';
import { sanitizeResultData, sanitizeString, sanitizeToolName, stringifySanitized } from '../../../utils/resultSanitizer';
import {
  ArrowLeft, Mail, Phone, User, Globe, Lock, MessageSquare,
  Search, Loader, AlertTriangle, CheckCircle, Copy, ChevronDown,
  ChevronUp, Clock, Car, Hash, Layers, Send, Eye, Code, FileText,
  Zap, Shield, Activity, Terminal, Download, Trash2, RotateCcw,
  Crosshair, Wifi, Database, X, FolderPlus, Link as LinkIcon,
  MapPin, Building2
} from 'lucide-react';

// ─── Tool Definitions ──────────────────────────────────────────────────

const TOOLS = [
  { id: 'email',     label: 'Email',     icon: Mail,   placeholder: 'user@example.com',              desc: 'Breach data & linked accounts',    color: '#06b6d4', search: telegramService.searchEmail },
  { id: 'phone',     label: 'Phone',     icon: Phone,  placeholder: '+91XXXXXXXXXX',                 desc: 'Linked accounts & personal data',  color: '#10b981', search: telegramService.searchPhone },
  { id: 'name',      label: 'Name',      icon: User,   placeholder: 'John Doe or nickname',          desc: 'Identity & profile lookup',        color: '#8b5cf6', search: telegramService.searchName },
  { id: 'ip',        label: 'IP',        icon: Globe,  placeholder: '8.8.8.8',                       desc: 'Geolocation & network intel',      color: '#f59e0b', search: telegramService.searchIP },
  { id: 'password',  label: 'Password',  icon: Lock,   placeholder: 'password123',                   desc: 'Breach exposure check',            color: '#ef4444', search: telegramService.searchPassword },
  { id: 'domain',    label: 'Domain',    icon: Shield,  placeholder: 'example.com',                  desc: 'DNS, WHOIS & email domain',        color: '#3b82f6', search: telegramService.searchDomain },
  { id: 'telegram',  label: 'Alpha_X',   icon: Send,   placeholder: '@username or ID',               desc: 'Account & group intelligence',     color: '#0ea5e9', search: telegramService.searchTelegram },
  { id: 'vin',       label: 'VIN',       icon: Car,    placeholder: 'Vehicle Identification Number', desc: 'Vehicle registration & history',   color: '#f97316', search: telegramService.searchVIN },
  { id: 'composite', label: 'Composite', icon: Layers, placeholder: 'Multiple queries (one per line)', desc: 'Multi-vector combined search',  color: '#ec4899', search: telegramService.searchComposite },
];

// ─── Scanline Background ───────────────────────────────────────────────

const ScanlineOverlay = () => (
  <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-[0.03]">
    <div className="absolute inset-0" style={{
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,170,0.15) 2px, rgba(0,255,170,0.15) 4px)',
      backgroundSize: '100% 4px',
    }} />
  </div>
);

// ─── Hex Badge ─────────────────────────────────────────────────────────

const HexBadge = memo(({ icon: Icon, color, active, onClick, label, desc }) => {
  const containerStyle = useMemo(() => ({
    borderColor: active ? color : 'rgba(255,255,255,0.06)',
    boxShadow: active ? `0 0 24px ${color}20, 0 0 48px ${color}10, inset 0 1px 0 ${color}15` : 'none',
  }), [active, color]);

  const iconBgStyle = useMemo(() => ({
    background: active ? `linear-gradient(135deg, ${color}30, ${color}10)` : 'rgba(255,255,255,0.03)',
    boxShadow: active ? `0 0 12px ${color}30` : 'none'
  }), [active, color]);

  const iconStyle = useMemo(() => ({ color: active ? color : '#6b7280' }), [active, color]);
  const labelStyle = useMemo(() => ({ color: active ? color : '#9ca3af' }), [active, color]);

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.97] ${
        active
          ? 'bg-slate-800/80 shadow-xl'
          : 'bg-slate-900/40 hover:bg-slate-800/50 hover:border-white/10'
      }`}
      style={containerStyle}
    >
      {active && (
        <div
          className="absolute -inset-[1px] rounded-2xl opacity-20 animate-pulse"
          style={{ border: `1px solid ${color}` }}
        />
      )}
      <div
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-300"
        style={iconBgStyle}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300" style={iconStyle} />
      </div>
      <span className="text-[10px] sm:text-xs font-semibold tracking-wide transition-colors duration-300" style={labelStyle}>
        {label}
      </span>
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
        <span className="whitespace-nowrap text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-1 rounded-lg shadow-xl">
          {desc}
        </span>
      </div>
    </button>
  );
});

// ─── Typing Scanner Effect ─────────────────────────────────────────────

const ScanProgressBar = memo(({ active, color }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) { setProgress(0); return; }
    const iv = setInterval(() => setProgress(p => p >= 95 ? 95 : p + Math.random() * 8), 200);
    return () => clearInterval(iv);
  }, [active]);

  if (!active) return null;

  const barStyle = { background: `linear-gradient(90deg, ${color}, ${color}80)`, boxShadow: `0 0 12px ${color}60`, width: `${progress}%` };
  const shimmerStyle = { background: `linear-gradient(90deg, transparent, ${color}40, transparent)` };

  return (
    <div className="relative w-full h-1 rounded-full bg-slate-800/80 overflow-hidden">
      <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-300" style={barStyle} />
      <div className="absolute inset-y-0 w-16 rounded-full animate-[shimmer_1.2s_linear_infinite]" style={shimmerStyle} />
    </div>
  );
});

// ─── Result Parsers ────────────────────────────────────────────────────

/**
 * Extract only actionable data records from provider text.
 * Strips source headers (e.g. "Alien TxtBase — At the beginning..."),
 * page indicators, and other noise. Returns structured records.
 */
// Match lines like: 📧 Email: value  |  🔑Password: value  |  💻 App (mobile or desktop application): value
const DATA_FIELD_REGEX = /^[\s]*(?:📧|🔑|🔗|📱|☎|👤|🌐|📋|💻|🏠|📌|🏷|💡|🎮|📍|🚗|💳|🔒|📡|🎯|🔍|🔹|🔸)?\s*(Email|Password|Pass|Link|Telephone|Phone|Tel|App|Username|Login|IP|Name|Address|Domain|VIN|Country|City|Region|ISP|Provider|Carrier|Organization|Org|Registrar|Created|Expires|Bio|ID|User ID|Make|Model|Year|Color|Plate|Engine|First Name|Last Name|Operator|ASN|Latitude|Longitude|Zip|Postal)(?:\s*\([^)]*\))?\s*[:：]\s*(.+)/i;

const SOURCE_NOISE_PATTERNS = [
  /^🔵|^👽|^☁|^🛡|^⚡|^🔶|^🌀|^💀|^🟢|^🟡|^🔴/,  // source emoji headers
  /Alien\s*TxtBase|Cloudata|Cloud.?data|Combo.?list|Collection\s*#/i,
  /^At the beginning of/i,
  /^Large collection of/i,
  /collection.*contained|billion lines|unique records|removing duplicates/i,
  /collected using stylers|viruses stolen|passwords stored/i,
  /collected from many files/i,
  /published in the|telegram channel/i,
  /@\w*bot\b|(?:^|\s)bot(?:\s|$)/i,
  /signs of generation|NAZ\.api|similar leaks/i,
  /contain mail.*phones.*nicknames|installed applications/i,
  /all bases weighed|After removing duplicates/i,
  /about \d+ billion remained/i,
  /initially.*\d+\s*GB/i,
  /Email Pass data/i,
  /^\d+\s*[\\\/]\s*\d+$/, // page indicator like "1\4" or "3/4"
  /^[◀▶←→«»➡]$/, // single navigation arrows
  /^Download$|^Functions$/i, // provider action buttons text
];

const isNoiseLine = (line) => {
  const trimmed = line.trim();
  if (!trimmed) return true;
  return SOURCE_NOISE_PATTERNS.some(p => p.test(trimmed));
};

const extractDataRecords = (text) => {
  const lines = text.split('\n');
  const records = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip noise / source descriptions
    if (isNoiseLine(trimmed)) continue;

    // Match known data fields (with optional parenthetical like "App (mobile or desktop application)")
    const fieldMatch = trimmed.match(DATA_FIELD_REGEX);
    if (fieldMatch) {
      let label = fieldMatch[1].trim();
      const value = fieldMatch[2].trim();
      // Normalize label aliases
      if (/^pass$/i.test(label)) label = 'Password';
      if (/^tel$/i.test(label)) label = 'Phone';
      if (/^org$/i.test(label)) label = 'Organization';
      if (value && value !== '-' && value !== 'N/A' && value !== 'null' && value.length > 1) {
        records.push({ label, value });
      }
      continue;
    }

    // Fallback: generic emoji-prefixed key: value (allow up to 50 chars for key to handle parentheticals)
    const genericKV = trimmed.match(/^[\s]*([^\w\s])\s*([^:：]{2,50})\s*[:：]\s*(.+)/);
    if (genericKV) {
      const rawLabel = genericKV[2].trim().replace(/\s*\([^)]*\)\s*$/, '').trim();  // strip parenthetical
      const label = rawLabel.replace(/^[^\w]+/, '').trim();
      const value = genericKV[3].trim();
      if (label && label.length >= 2 && value && value !== '-' && value !== 'N/A' && !isNoiseLine(value) && !isNoiseLine(label)) {
        records.push({ label, value });
      }
    }
  }

  return records;
};

/** Group records by label for cleaner display */
const groupRecords = (records) => {
  const groups = {};
  for (const rec of records) {
    const key = rec.label;
    if (!groups[key]) groups[key] = [];
    // Avoid exact duplicates
    if (!groups[key].some(r => r.value === rec.value)) {
      groups[key].push(rec);
    }
  }
  return groups;
};

/** Icon + color mapping for data field labels */
const FIELD_STYLES = {
  'email':        { icon: Mail, color: '#06b6d4' },
  'password':     { icon: Lock, color: '#ef4444' },
  'link':         { icon: LinkIcon, color: '#8b5cf6' },
  'telephone':    { icon: Phone, color: '#10b981' },
  'phone':        { icon: Phone, color: '#10b981' },
  'app':          { icon: Database, color: '#f59e0b' },
  'username':     { icon: User, color: '#3b82f6' },
  'login':        { icon: User, color: '#3b82f6' },
  'ip':           { icon: Globe, color: '#f59e0b' },
  'name':         { icon: User, color: '#8b5cf6' },
  'first name':   { icon: User, color: '#8b5cf6' },
  'last name':    { icon: User, color: '#8b5cf6' },
  'address':      { icon: MapPin, color: '#10b981' },
  'domain':       { icon: Globe, color: '#3b82f6' },
  'country':      { icon: MapPin, color: '#10b981' },
  'city':         { icon: MapPin, color: '#10b981' },
  'region':       { icon: MapPin, color: '#10b981' },
  'carrier':      { icon: Send, color: '#0ea5e9' },
  'provider':     { icon: Send, color: '#0ea5e9' },
  'isp':          { icon: Send, color: '#0ea5e9' },
  'organization': { icon: Building2, color: '#6366f1' },
  'id':           { icon: Hash, color: '#f97316' },
  'user id':      { icon: Hash, color: '#f97316' },
  'bio':          { icon: FileText, color: '#a855f7' },
  'vin':          { icon: Car, color: '#f97316' },
  'make':         { icon: Car, color: '#f97316' },
  'model':        { icon: Car, color: '#f97316' },
  'year':         { icon: Clock, color: '#f97316' },
  'color':        { icon: Shield, color: '#ec4899' },
  'plate':        { icon: Car, color: '#f97316' },
  'engine':       { icon: Activity, color: '#6b7280' },
  'registrar':    { icon: FileText, color: '#6366f1' },
  'created':      { icon: Clock, color: '#10b981' },
  'expires':      { icon: Clock, color: '#ef4444' },
  'operator':     { icon: Send, color: '#0ea5e9' },
  'asn':          { icon: Globe, color: '#6366f1' },
  'latitude':     { icon: MapPin, color: '#10b981' },
  'longitude':    { icon: MapPin, color: '#10b981' },
  'zip':          { icon: MapPin, color: '#10b981' },
  'postal':       { icon: MapPin, color: '#10b981' },
  'pass':         { icon: Lock, color: '#ef4444' },
  'tel':          { icon: Phone, color: '#10b981' },
  'org':          { icon: Building2, color: '#6366f1' },
};

const getFieldStyle = (label) => FIELD_STYLES[label.toLowerCase()] || { icon: Database, color: '#6b7280' };

// ─── Result Display ────────────────────────────────────────────────────

const ResultView = ({ result, viewMode, toolColor }) => {
  if (!result) return null;
  const displayResult = sanitizeResultData(result);

  if (viewMode === 'raw') {
    return (
      <div className="relative group">
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-gray-500 font-mono">
          DATA JSON
        </div>
        <pre className="text-xs text-cyan-300/80 font-mono whitespace-pre-wrap bg-[#0a0f1a] p-5 rounded-xl border border-slate-700/50 overflow-auto max-h-[60vh] leading-relaxed selection:bg-cyan-500/20">
          {stringifySanitized(displayResult)}
        </pre>
      </div>
    );
  }

  const text = sanitizeString(displayResult.text || displayResult.translated || displayResult.raw || displayResult.rawMessages?.join('\n') || stringifySanitized(displayResult));

  if (viewMode === 'text') {
    return (
      <div className="relative group">
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-[10px] text-gray-500 font-mono">
          PLAIN
        </div>
        <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap bg-[#0a0f1a] p-5 rounded-xl border border-slate-700/50 overflow-auto max-h-[60vh] leading-relaxed selection:bg-cyan-500/20">
          {text}
        </pre>
      </div>
    );
  }

  // Parsed view — extract only useful data, no source descriptions
  const records = extractDataRecords(text);
  const grouped = groupRecords(records);
  const groupKeys = Object.keys(grouped);

  if (groupKeys.length === 0) {
    // Fallback: show filtered lines (strip source noise)
    const cleanLines = text.split('\n').filter(l => l.trim() && !isNoiseLine(l));
    if (cleanLines.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-gray-500 font-mono">
          No actionable data found in response
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Extracted Data</p>
            <p className="text-xs text-slate-500">Cleaned response without provider metadata</p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">{cleanLines.length} lines</span>
        </div>
        <div className="divide-y divide-slate-800/70 max-h-[60vh] overflow-auto custom-scrollbar">
        {cleanLines.map((line, i) => (
          <div key={i} className="px-4 py-3 text-sm text-gray-300 font-mono animate-fadeIn" style={{ animationDelay: `${i * 30}ms` }}>
            {line.trim()}
          </div>
        ))}
        </div>
      </div>
    );
  }

  const primaryLabels = groupKeys.slice(0, 3).join(', ');

  return (
    <div className="space-y-4 max-h-[64vh] overflow-auto pr-1 custom-scrollbar">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Records</p>
          <p className="mt-1 text-2xl font-semibold text-white">{records.length}</p>
        </div>
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Categories</p>
          <p className="mt-1 text-2xl font-semibold text-white">{groupKeys.length}</p>
        </div>
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Primary Fields</p>
          <p className="mt-2 text-sm text-slate-200 truncate">{primaryLabels || 'General'}</p>
        </div>
      </div>

      {groupKeys.map((label, gi) => {
        const items = grouped[label];
        const style = getFieldStyle(label);
        const FieldIcon = style.icon;
        return (
          <div
            key={label}
            className="rounded-xl bg-slate-950/70 border border-slate-800 overflow-hidden hover:border-slate-700 transition-colors animate-fadeIn"
            style={{ animationDelay: `${gi * 50}ms` }}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-3" style={{ background: `linear-gradient(90deg, ${style.color}10, transparent)` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${style.color}18`, color: style.color }}>
                <FieldIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white capitalize">{label}</p>
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{items.length} value{items.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="divide-y divide-slate-800/50">
              {items.map((rec, j) => (
                <div key={j} className="px-4 py-3 flex items-center gap-3 group/item hover:bg-slate-900/80 transition-colors">
                  <span className="text-[10px] text-slate-600 font-mono w-6">{String(j + 1).padStart(2, '0')}</span>
                  <span className="text-sm text-gray-100 font-mono break-all flex-1">{sanitizeString(rec.value)}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(sanitizeString(rec.value)); }}
                    className="opacity-0 group-hover/item:opacity-100 p-1 rounded hover:bg-white/5 transition-all flex-shrink-0"
                    title="Copy"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Stats Bar ─────────────────────────────────────────────────────────

const StatsBar = memo(({ history, status }) => {
  const total = history.length;
  const success = history.filter(h => h.success).length;
  const fail = total - success;
  return (
    <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${status.configured ? 'bg-emerald-500 shadow-[0_0_6px_#10b98180]' : 'bg-red-500 shadow-[0_0_6px_#ef444480]'}`} />
        <span className="text-[11px] font-mono text-gray-500">{status.configured ? 'CONNECTED' : 'OFFLINE'}</span>
      </div>
      <div className="w-px h-4 bg-slate-700/50" />
      <div className="flex items-center gap-1.5">
        <Activity className="w-3 h-3 text-gray-600" />
        <span className="text-[11px] font-mono text-gray-500">{total} queries</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CheckCircle className="w-3 h-3 text-emerald-600" />
        <span className="text-[11px] font-mono text-emerald-500/70">{success}</span>
      </div>
      {fail > 0 && (
        <div className="flex items-center gap-1.5">
          <X className="w-3 h-3 text-red-600" />
          <span className="text-[11px] font-mono text-red-500/70">{fail}</span>
        </div>
      )}
    </div>
  );
});

// ─── Main Alpha_X Component ────────────────────────────────────────────

const TelegramTools = ({ embedded }) => {
  const { status } = useTelegram();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [selectedTool, setSelectedTool] = useState('email');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('parsed');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTime, setSearchTime] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const tool = TOOLS.find(t => t.id === selectedTool);

  // Focus input on tool switch
  useEffect(() => { inputRef.current?.focus(); }, [selectedTool]);

  const handleSearch = useCallback(async () => {
    if (!input.trim() || !tool) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearchTime(null);
    const start = performance.now();

    try {
      const data = await tool.search(input.trim());
      const cleanData = sanitizeResultData(data);
      setSearchTime(((performance.now() - start) / 1000).toFixed(2));
      setResult(cleanData);
      setHistory(prev => [
        { tool: selectedTool, input: sanitizeString(input.trim()), timestamp: new Date(), success: true },
        ...prev.slice(0, 49),
      ]);
    } catch (err) {
      setSearchTime(((performance.now() - start) / 1000).toFixed(2));
      setError(sanitizeString(err.data?.error || err.message || 'Search failed'));
      setHistory(prev => [
        { tool: selectedTool, input: sanitizeString(input.trim()), timestamp: new Date(), success: false },
        ...prev.slice(0, 49),
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, tool, selectedTool]);

  const handleCopyResult = () => {
    if (!result) return;
    const cleanResult = sanitizeResultData(result);
    const text = sanitizeString(cleanResult.text || cleanResult.translated || cleanResult.raw || stringifySanitized(cleanResult));
    const records = extractDataRecords(text);
    if (records.length > 0) {
      const cleaned = records.map(r => `${sanitizeString(r.label)}: ${sanitizeString(r.value)}`).join('\n');
      navigator.clipboard.writeText(cleaned);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJSON = () => {
    if (!result) return;
    const cleanResult = sanitizeResultData(result);
    const text = sanitizeString(cleanResult.text || cleanResult.translated || cleanResult.raw || stringifySanitized(cleanResult));
    const records = extractDataRecords(text);
    const exportData = records.length > 0
      ? { query: input, tool: selectedTool, timestamp: new Date().toISOString(), records: groupRecords(records) }
      : cleanResult;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpha_x_${selectedTool}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const content = (
    <div className={`relative ${embedded ? 'space-y-5' : 'max-w-5xl mx-auto px-6 py-8 space-y-5'}`}>
      <ScanlineOverlay />

      {/* Status Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <StatsBar history={history} status={status} />
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/40 hover:border-cyan-500/30 transition-all text-xs font-mono text-gray-400 hover:text-cyan-400"
          >
            <Clock className="w-3.5 h-3.5" />
            History ({history.length})
            <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Connection Warning */}
      {!status.loading && !status.configured && (
        <div
          className="relative z-10 flex items-center gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 backdrop-blur-sm animate-fadeIn"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-200/90 font-medium">Session not authenticated</p>
            <p className="text-xs text-amber-300/50 mt-0.5">
              Connect your Alpha_X session via{' '}
              <button onClick={() => navigate('/dashboard/user/telegram')} className="underline text-amber-300/70 hover:text-amber-200 transition-colors">
                Settings
              </button>{' '}
              to enable Alpha_X queries.
            </p>
          </div>
          <Wifi className="w-4 h-4 text-amber-500/40 flex-shrink-0" />
        </div>
      )}

      {/* Tool Selector — Hex Grid */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Crosshair className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Select Vector</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {TOOLS.map((t) => (
            <HexBadge
              key={t.id}
              icon={t.icon}
              label={t.label}
              desc={t.desc}
              color={t.color}
              active={selectedTool === t.id}
              onClick={() => {
                setSelectedTool(t.id);
                setResult(null);
                setError(null);
              }}
            />
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-3.5 h-3.5 text-gray-600" />
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">{tool?.label} Query</span>
        </div>

        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: `linear-gradient(to bottom, ${tool?.color}, transparent)` }} />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <Search className="w-4 h-4 text-gray-600" />
              </div>
              {selectedTool === 'composite' ? (
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={tool?.placeholder}
                  rows={3}
                  className="w-full pl-10 pr-4 py-3.5 bg-[#0a0f1a] border border-slate-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-opacity-60 font-mono text-sm resize-none transition-all"
                  style={{ focusBorderColor: tool?.color }}
                  onFocus={(e) => { e.target.style.borderColor = tool?.color + '60'; e.target.style.boxShadow = `0 0 0 3px ${tool?.color}10`; }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                />
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={tool?.placeholder}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3.5 bg-[#0a0f1a] border border-slate-700/50 rounded-xl text-white placeholder-gray-600 focus:outline-none font-mono text-sm transition-all"
                  onFocus={(e) => { e.target.style.borderColor = tool?.color + '60'; e.target.style.boxShadow = `0 0 0 3px ${tool?.color}10`; }}
                  onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                />
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !input.trim() || (!status.configured && !status.loading)}
              className="relative flex items-center gap-2 px-5 py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden hover:brightness-110 active:scale-[0.97]"
              style={{
                background: loading ? '#1e293b' : `linear-gradient(135deg, ${tool?.color}, ${tool?.color}cc)`,
                boxShadow: loading ? 'none' : `0 4px 16px ${tool?.color}30`,
              }}
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="font-mono text-xs">Scanning...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Execute
                </>
              )}
            </button>
          </div>

          {/* Scan progress bar */}
          <div className="mt-2">
            <ScanProgressBar active={loading} color={tool?.color} />
          </div>

          {/* Keyboard hint */}
          {!loading && input.trim() && (
            <div className="absolute right-28 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-gray-500 font-mono">Enter</kbd>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
        {error && (
          <div
            className="relative z-10 flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20 animate-fadeIn"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-300 font-medium">Query Failed</p>
              <p className="text-xs text-red-400/60 font-mono mt-1 break-all">{error}</p>
            </div>
            {searchTime && (
              <span className="text-[10px] font-mono text-red-500/40 flex-shrink-0">{searchTime}s</span>
            )}
          </div>
        )}

      {/* Result */}
        {result && (
          <div
            className="relative z-10 space-y-3 animate-fadeIn"
          >
            {/* Result header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b98180]" />
                  <span className="text-sm text-emerald-300 font-semibold">Results</span>
                </div>
                {searchTime && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700/50 text-gray-500">
                    {searchTime}s
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* View mode toggle */}
                {[
                  { mode: 'parsed', icon: Eye, tip: 'Structured' },
                  { mode: 'text', icon: FileText, tip: 'Plain text' },
                  { mode: 'raw', icon: Code, tip: 'Raw JSON' },
                ].map(({ mode, icon: ModeIcon, tip }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    title={tip}
                    className={`p-2 rounded-lg text-xs font-medium transition-all ${
                      viewMode === mode
                        ? 'text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                    style={viewMode === mode ? { background: `${tool?.color}20`, color: tool?.color, boxShadow: `inset 0 0 0 1px ${tool?.color}30` } : {}}
                  >
                    <ModeIcon className="w-3.5 h-3.5" />
                  </button>
                ))}
                <div className="w-px h-4 bg-slate-700/50 mx-1" />
                {/* Copy */}
                <button
                  onClick={handleCopyResult}
                  className="p-2 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
                  title="Copy to clipboard"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {/* Export */}
                <button
                  onClick={handleExportJSON}
                  className="p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                  title="Export as JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {/* Save to Case */}
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border border-violet-500/20"
                  title="Save to Case"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save to Case</span>
                </button>
              </div>
            </div>

            {/* Result content */}
            <ResultView result={result} viewMode={viewMode} toolColor={tool?.color} />

            {/* Translation notice */}
            {result.translated && result.translated !== result.text && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <p className="text-xs text-blue-300/70 font-mono">Auto-translated from Russian</p>
              </div>
            )}
          </div>
        )}

      {/* Empty state — no result yet, no error, not loading */}
      {!result && !error && !loading && (
        <div className="relative z-10 flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/30 border border-slate-700/30 flex items-center justify-center">
              <Database className="w-8 h-8 text-gray-700" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[#0a0f1a]" style={{ background: tool?.color, boxShadow: `0 0 8px ${tool?.color}40` }} />
          </div>
          <p className="text-sm text-gray-500 font-medium mb-1">Ready to scan</p>
          <p className="text-xs text-gray-600 font-mono">Enter a target and execute a <span style={{ color: tool?.color }}>{tool?.label.toLowerCase()}</span> query</p>
        </div>
      )}

      {/* Save to Case Modal */}
      <SaveToCaseModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        data={sanitizeResultData(result)}
        toolName={sanitizeToolName(`Alpha_X / ${tool?.label}`)}
        query={sanitizeString(input)}
      />

      {/* History Drawer */}
        {showHistory && history.length > 0 && (
          <div
            className="relative z-10 overflow-hidden animate-fadeIn"
          >
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-600" />
                  <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Query Log</span>
                </div>
                <button
                  onClick={() => setHistory([])}
                  className="flex items-center gap-1 text-[10px] font-mono text-gray-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
              <div className="space-y-1 max-h-52 overflow-auto pr-1 custom-scrollbar">
                {history.map((h, i) => {
                  const ht = TOOLS.find(t => t.id === h.tool);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedTool(h.tool);
                        setInput(h.input);
                        setShowHistory(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/30 hover:bg-slate-800/50 border border-slate-700/20 hover:border-slate-600/40 transition-all text-left group"
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: h.success ? '#10b981' : '#ef4444' }} />
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0"
                        style={{ background: `${ht?.color}15`, color: ht?.color }}
                      >
                        {h.tool}
                      </span>
                      <span className="text-sm text-gray-400 font-mono truncate flex-1 group-hover:text-gray-200 transition-colors">{h.input}</span>
                      <span className="text-[10px] text-gray-700 font-mono flex-shrink-0">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      <RotateCcw className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
    </div>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      {/* Header */}
      <div className="border-b border-slate-800/50 bg-[#050a14]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Alpha_X</h1>
            </div>
          </div>
        </div>
      </div>
      {content}
    </div>
  );
};

export default TelegramTools;
