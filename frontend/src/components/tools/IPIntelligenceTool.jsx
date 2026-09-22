import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, X, Search, MapPin, Shield, Clock, Activity, Download,
  AlertTriangle, CheckCircle, Server, Wifi, Lock, Eye, Target, Copy,
  FolderPlus, History, FileText, RefreshCw, Radio, Crosshair,
  Network, TrendingUp, Database, Signal, Radar, ExternalLink,
  ChevronDown, ChevronUp, Info, Hash, Bug, Skull, Users,
  Zap, Cloud
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useSearchHistory } from '../../context/SearchHistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import ExportReportModal from '../common/ExportReportModal';
import SaveToCaseModal from '../common/SaveToCaseModal';
import SearchHistoryPanel from '../common/SearchHistoryPanel';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

/* ═══════════════════════════════════════════════════════════════════════
   RISK SCORE GAUGE — Canvas radial gauge 0-100
   ═══════════════════════════════════════════════════════════════════════ */
const RiskScoreGauge = ({ score = 0, size = 170 }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    c.width = size; c.height = size;
    const cx = size/2, cy = size/2+8, r = size*0.35;
    let cur = 0, animId;
    const target = (Math.min(score,100)/100)*240;
    const color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#10b981';
    const draw = () => {
      ctx.clearRect(0,0,size,size);
      ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI*0.75,Math.PI*2.25);
      ctx.strokeStyle='rgba(100,116,139,0.2)'; ctx.lineWidth=10; ctx.lineCap='round'; ctx.stroke();
      cur += (target-cur)*0.06;
      const end = Math.PI*0.75+(cur/240)*Math.PI*1.5;
      ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI*0.75,end);
      ctx.strokeStyle=color; ctx.lineWidth=10; ctx.lineCap='round'; ctx.stroke();
      ctx.shadowBlur=12; ctx.shadowColor=color;
      ctx.beginPath(); ctx.arc(cx,cy,r,Math.PI*0.75,end); ctx.strokeStyle='transparent'; ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle='#fff'; ctx.font=`bold ${size*0.18}px sans-serif`; ctx.textAlign='center';
      ctx.fillText(Math.round(cur/240*100), cx, cy+2);
      ctx.fillStyle='#94a3b8'; ctx.font=`${size*0.07}px sans-serif`;
      ctx.fillText('RISK SCORE', cx, cy+size*0.12);
      if (Math.abs(cur-target)>0.5) { animId = requestAnimationFrame(draw); }
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [score, size]);
  return <canvas ref={ref} className="mx-auto" style={{width:size,height:size}} />;
};

/* ═══════════════════════════════════════════════════════════════════════
   RADAR SCAN ANIMATION — shown during loading
   ═══════════════════════════════════════════════════════════════════════ */
const RadarScan = ({ active }) => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let id, a=0;
    const s=180; c.width=s; c.height=s;
    const cx=s/2, cy=s/2, mr=70;
    const draw = () => {
      ctx.clearRect(0,0,s,s);
      for (let i=1;i<=4;i++){ctx.beginPath();ctx.arc(cx,cy,(mr/4)*i,0,Math.PI*2);ctx.strokeStyle='rgba(34,211,238,0.15)';ctx.lineWidth=1;ctx.stroke();}
      ctx.strokeStyle='rgba(34,211,238,0.1)';ctx.beginPath();ctx.moveTo(cx,cy-mr);ctx.lineTo(cx,cy+mr);ctx.moveTo(cx-mr,cy);ctx.lineTo(cx+mr,cy);ctx.stroke();
      if(active){
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,mr,a,a+0.4);ctx.closePath();
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,mr);g.addColorStop(0,'rgba(34,211,238,0.4)');g.addColorStop(1,'rgba(34,211,238,0)');
        ctx.fillStyle=g;ctx.fill(); a+=0.04;
        if(Math.random()>0.93){const bx=cx+Math.cos(Math.random()*6.28)*mr*0.7,by=cy+Math.sin(Math.random()*6.28)*mr*0.7;ctx.beginPath();ctx.arc(bx,by,3,0,6.28);ctx.fillStyle='#22d3ee';ctx.fill();}
      }
      ctx.beginPath();ctx.arc(cx,cy,3,0,6.28);ctx.fillStyle='#22d3ee';ctx.fill();
      id=requestAnimationFrame(draw);
    };
    draw(); return ()=>cancelAnimationFrame(id);
  }, [active]);
  return <canvas ref={ref} className="w-[180px] h-[180px] mx-auto" />;
};

/* ═══════════════════════════════════════════════════════════════════════
   SMALL REUSABLE SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */
const SecurityBadge = ({ label, active }) => (
  <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${active ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
    {label}: {active ? 'YES' : 'NO'}
  </span>
);

const InfoRow = ({ label, value, mono, copyFn }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0 group">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-white text-sm flex items-center gap-1 ${mono ? 'font-mono' : ''}`}>
        {typeof value === 'string' && value.startsWith('http') ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">{value.slice(0,40)}... <ExternalLink className="w-3 h-3" /></a>
        ) : String(value)}
        {copyFn && <button onClick={()=>copyFn(String(value))} className="opacity-0 group-hover:opacity-100 transition-opacity"><Copy className="w-3 h-3 text-slate-500 hover:text-cyan-400" /></button>}
      </span>
    </div>
  );
};

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true, color = 'cyan' }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl bg-slate-900/60 border border-${color}-500/20 overflow-hidden`}>
      <button onClick={()=>setOpen(!open)} className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
        <span className={`text-xs text-${color}-400/80 uppercase tracking-wider flex items-center gap-2 font-medium`}>
          {Icon && <Icon className="w-3.5 h-3.5" />} {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.2}}>
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ThreatLevelBadge = ({ level }) => {
  const colors = { critical:'bg-red-500/20 text-red-400 border-red-500/50', high:'bg-orange-500/20 text-orange-400 border-orange-500/50', medium:'bg-amber-500/20 text-amber-400 border-amber-500/50', low:'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' };
  return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${colors[level]||colors.low}`}>{level} risk</span>;
};

const DataSourcePills = ({ sources, queryTime }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className="text-[10px] text-slate-500 uppercase tracking-wider mr-1">Sources ({sources?.length || 0})</span>
    {sources?.map((s,i)=>(<span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400">{s}</span>))}
    {queryTime && <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-[10px] text-slate-400 ml-auto">{queryTime}</span>}
  </div>
);

/* ═════════ PORT MAP ═════════ */
const PortMap = ({ ports = [] }) => {
  const commonPorts = [21,22,23,25,53,80,110,143,443,445,993,995,1433,3306,3389,5432,5900,6379,8080,8443,27017];
  const names = {21:'FTP',22:'SSH',23:'Telnet',25:'SMTP',53:'DNS',80:'HTTP',110:'POP3',143:'IMAP',443:'HTTPS',445:'SMB',993:'IMAPS',995:'POP3S',1433:'MSSQL',3306:'MySQL',3389:'RDP',5432:'Postgres',5900:'VNC',6379:'Redis',8080:'HTTP-Alt',8443:'HTTPS-Alt',27017:'MongoDB'};
  const risky = [23,25,445,1433,3306,3389,5432,6379,27017];
  const allPorts = [...new Set([...commonPorts, ...ports])].sort((a,b)=>a-b);
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
      {allPorts.map(p=>{
        const isOpen = ports.includes(p);
        const isRisky = risky.includes(p) && isOpen;
        return (
          <div key={p} className={`p-1.5 rounded-lg text-center border text-[10px] ${isRisky ? 'bg-red-500/15 border-red-500/40 text-red-400' : isOpen ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 border-slate-700/30 text-slate-600'}`}>
            <div className="font-mono font-bold">:{p}</div>
            <div className="truncate">{names[p]||'—'}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ═════════ BLACKLIST TABLE ═════════ */
const BlacklistTable = ({ results = [] }) => (
  <div className="space-y-1">
    {results.map((bl,i)=>(
      <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${bl.listed ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-800/30 border border-slate-700/30'}`}>
        <span className="text-sm text-slate-300">{bl.name}</span>
        <span className={`text-xs font-bold ${bl.listed?'text-red-400':'text-emerald-400'}`}>{bl.listed?'LISTED':'CLEAN'}</span>
      </div>
    ))}
  </div>
);

/* ═════════ RISK FACTORS LIST ═════════ */
const RiskFactorsList = ({ factors = [] }) => (
  <div className="space-y-1.5">
    {factors.map((f,i)=>{
      const sev = { critical:'text-red-400 bg-red-500/10', high:'text-orange-400 bg-orange-500/10', medium:'text-amber-400 bg-amber-500/10', low:'text-slate-400 bg-slate-700/30', positive:'text-emerald-400 bg-emerald-500/10' };
      return (
        <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${sev[f.severity]||sev.low}`}>
          <span className="text-sm">{f.factor}</span>
          <span className={`text-xs font-bold font-mono ${f.impact>0?'text-red-400':'text-emerald-400'}`}>{f.impact>0?'+':''}{f.impact}</span>
        </div>
      );
    })}
  </div>
);

/* ═════════ VT DETECTION BAR ═════════ */
const VTDetectionBar = ({ malicious=0, suspicious=0, harmless=0, undetected=0 }) => {
  const total = malicious+suspicious+harmless+undetected || 1;
  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-800 mb-1">
        {malicious > 0 && <div className="bg-red-500" style={{width:`${malicious/total*100}%`}} />}
        {suspicious > 0 && <div className="bg-amber-500" style={{width:`${suspicious/total*100}%`}} />}
        {harmless > 0 && <div className="bg-emerald-500" style={{width:`${harmless/total*100}%`}} />}
        {undetected > 0 && <div className="bg-slate-600" style={{width:`${undetected/total*100}%`}} />}
      </div>
      <div className="flex gap-3 text-[10px] flex-wrap">
        <span className="text-red-400">{malicious} malicious</span>
        <span className="text-amber-400">{suspicious} suspicious</span>
        <span className="text-emerald-400">{harmless} harmless</span>
        <span className="text-slate-400">{undetected} undetected</span>
      </div>
    </div>
  );
};

/* ═════════ OTX PULSE CARD ═════════ */
const OTXPulseCard = ({ pulse }) => {
  const tlpColors = { white:'bg-white/10 text-white', green:'bg-emerald-500/20 text-emerald-400', amber:'bg-amber-500/20 text-amber-400', red:'bg-red-500/20 text-red-400' };
  return (
    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-sm text-white font-medium line-clamp-2">{pulse.name}</span>
        {pulse.tlp && <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${tlpColors[pulse.tlp]||tlpColors.white}`}>TLP:{pulse.tlp}</span>}
      </div>
      {pulse.description && <p className="text-xs text-slate-400 line-clamp-2 mb-1">{pulse.description}</p>}
      <div className="flex flex-wrap gap-1 mt-1">
        {pulse.adversary && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[9px]">{pulse.adversary}</span>}
        {pulse.tags?.slice(0,4).map((t,i)=>(<span key={i} className="px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 text-[9px]">{t}</span>))}
      </div>
      {pulse.created && <div className="text-[10px] text-slate-500 mt-1">{new Date(pulse.created).toLocaleDateString()}</div>}
    </div>
  );
};

/* ═════════ ABUSE REPORT ROW ═════════ */
const AbuseReportRow = ({ report }) => (
  <div className="p-2 rounded-lg bg-slate-800/30 border border-slate-700/30">
    <div className="flex justify-between text-xs mb-0.5">
      <span className="text-slate-400">{report.reporterCountry || '—'}</span>
      <span className="text-slate-500">{report.reportedAt ? new Date(report.reportedAt).toLocaleDateString() : '—'}</span>
    </div>
    {report.comment && <p className="text-xs text-slate-300 line-clamp-2">{report.comment}</p>}
    {report.categories?.length > 0 && (
      <div className="flex gap-1 mt-1 flex-wrap">
        {report.categories.map((c,i)=><span key={i} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px]">Cat {c}</span>)}
      </div>
    )}
  </div>
);

/* ═════════ WHOIS ENTITY CARD ═════════ */
const WhoisEntity = ({ entity }) => (
  <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
    <div className="flex items-center gap-2 mb-2">
      <Users className="w-4 h-4 text-purple-400" />
      <span className="text-sm text-white font-medium">{entity.name || entity.handle || 'Unknown'}</span>
      {entity.roles?.map((r,i)=><span key={i} className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[9px] uppercase">{r}</span>)}
    </div>
    {entity.org && <div className="text-xs text-slate-400 mb-0.5">Org: {entity.org}</div>}
    {entity.address && <div className="text-xs text-slate-400 mb-0.5">Addr: {entity.address}</div>}
    {entity.email && <div className="text-xs text-cyan-400 mb-0.5">{entity.email}</div>}
    {entity.phone && <div className="text-xs text-slate-400">{entity.phone}</div>}
  </div>
);

/* ═════════ INVESTIGATION TIMELINE ═════════ */
const InvestigationTimeline = ({ events = [] }) => {
  const typeColors = { info:'bg-blue-500 border-blue-500', warning:'bg-amber-500 border-amber-500', critical:'bg-red-500 border-red-500' };
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-500 via-blue-500 to-transparent" />
      {events.map((ev,i)=>{
        const c = typeColors[ev.type]||typeColors.info;
        return (
          <motion.div key={i} initial={{opacity:0,x:-15}} animate={{opacity:1,x:0}} transition={{delay:i*0.08}} className="relative mb-3 last:mb-0">
            <div className={`absolute -left-4 w-2.5 h-2.5 rounded-full ${c} border-2 border-slate-900`} />
            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 ml-2">
              <div className="text-[10px] text-slate-500 font-mono">{ev.date ? new Date(ev.date).toLocaleString() : ''}</div>
              <div className="text-sm text-white">{ev.event}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN IP INTELLIGENCE TOOL
   ═══════════════════════════════════════════════════════════════════════ */
const IPIntelligenceTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { addSearch, getToolHistory } = useSearchHistory();
  const { copy } = useClipboard();
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [ipAddress, setIpAddress] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPhase, setScanPhase] = useState('');

  const [showExportModal, setShowExportModal] = useState(false);
  const [showSaveToCaseModal, setShowSaveToCaseModal] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [enrichedData, setEnrichedData] = useState(null);

  const recentSearches = getToolHistory('ip-trace');

  const handleRefresh = () => { setIpAddress(''); setResults(null); setScanProgress(0); setScanPhase(''); toast.info('Ready for new search'); };
  const handleSelectFromHistory = (search) => { setIpAddress(search.query); setShowSearchHistory(false); };

  const handleAnalyze = async () => {
    if (!ipAddress.trim()) { toast.error('Please enter an IP address'); return; }
    trackToolUsage('ip-intelligence', 'lookup', 'start');
    setIsAnalyzing(true); setScanProgress(0); onConsume?.(10);

    const phases = [
      'Resolving DNS & reverse lookups...', 'Querying 6 geolocation APIs...', 'Scanning Shodan InternetDB...',
      'Checking BGPView ASN data...', 'Querying RDAP / WHOIS...', 'Checking DNS blacklists (5 lists)...',
      'Querying AbuseIPDB...', 'Scanning VirusTotal...', 'Checking GreyNoise...', 'Querying AlienVault OTX...',
      'Compiling comprehensive results...',
    ];
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), 30000);
    try {
      for (let i = 0; i < phases.length; i++) {
        if (!mountedRef.current) return;
        setScanPhase(phases[i]); setScanProgress((i / phases.length) * 90);
        await new Promise(r => setTimeout(r, 400));
      }
      setScanProgress(95);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/tools/ip/lookup`, {
        signal: abortController.signal,
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipAddress.trim() }),
      });
      clearTimeout(timer);
      if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.error || 'IP lookup failed'); }
      const data = await response.json();
      setScanProgress(100); setResults(data);
      addToHistory('ip-intelligence', ipAddress, data);
      addSearch('ip-trace', ipAddress, data);
      trackToolUsage('ip-intelligence', 'lookup', 'success');
      toast.success(`IP analysis complete — ${data.sourceCount || data.dataSources?.length || 0} sources queried`);
      setActiveTab('overview');
      if (mountedRef.current) {
        try {
          const enhRes = await fetch(`${API_BASE}/tools/ip/enriched`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ip: ipAddress.trim() }),
          });
          if (enhRes.ok) setEnrichedData(await enhRes.json());
        } catch (e) { /* non-critical */ }
      }
    } catch (err) {
      if (abortController.signal.aborted) return;
      toast.error(err.message || 'IP analysis failed');
      trackToolUsage('ip-intelligence', 'lookup', 'error');
    } finally { setIsAnalyzing(false); setScanPhase(''); clearTimeout(timer); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'network', label: 'Network & ASN', icon: Network },
    { id: 'whois', label: 'WHOIS', icon: FileText },
    { id: 'threats', label: 'Threats', icon: Skull },
    { id: 'blacklists', label: 'Blacklists', icon: Shield },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'enrichment', label: 'Enrichment', icon: Zap },
  ];

  const r = results; // shorthand

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{scale:0.92,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.92,y:20,opacity:0}}
        transition={{type:'spring',damping:22}} onClick={e=>e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

        {/* ═══ HEADER ═══ */}
        <div className="relative z-10 px-4 sm:px-6 py-4 border-b border-cyan-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30" style={{background:'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  IP Intelligence <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded-full border border-cyan-500/30">19+ SOURCES</span>
                </h2>
                <p className="text-xs text-cyan-300/70 flex items-center gap-1.5 mt-0.5">
                  <Radar className="w-3.5 h-3.5" /> Multi-source threat intelligence & investigation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button whileHover={{scale:1.05}} onClick={()=>setShowSearchHistory(true)} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 transition-all items-center relative">
                <History className="w-5 h-5 text-violet-400" />
                {recentSearches.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] flex items-center justify-center">{recentSearches.length > 9 ? '9+' : recentSearches.length}</span>}
              </motion.button>
              <motion.button whileHover={{scale:1.05}} disabled={!r} onClick={()=>setShowExportModal(true)} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all disabled:opacity-40">
                <Download className="w-5 h-5 text-emerald-400" />
              </motion.button>
              <motion.button whileHover={{scale:1.05}} disabled={!r} onClick={()=>setShowSaveToCaseModal(true)} className="hidden sm:flex p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all disabled:opacity-40">
                <FolderPlus className="w-5 h-5 text-amber-400" />
              </motion.button>
              <motion.button whileHover={{scale:1.05}} onClick={handleRefresh} className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 transition-all">
                <RefreshCw className="w-4 h-4 text-cyan-400" />
              </motion.button>
              <motion.button whileHover={{scale:1.05}} onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 transition-all">
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] custom-scrollbar">

          {/* ─── INPUT / SEARCH STATE ─── */}
          {!r ? (
            <div className="max-w-3xl mx-auto">
              <div className="grid lg:grid-cols-5 gap-6 mb-6">
                <div className="lg:col-span-2 flex items-center justify-center">
                  <RadarScan active={isAnalyzing} />
                </div>
                <div className="lg:col-span-3 p-5 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                  <label className="text-cyan-400 text-sm font-medium mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> Target IP Address</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                      <input type="text" value={ipAddress} onChange={e=>setIpAddress(e.target.value)} placeholder="e.g. 8.8.8.8 or 1.1.1.1"
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white text-lg font-mono placeholder-slate-500 outline-none transition-all"
                        onKeyDown={e=>e.key==='Enter'&&handleAnalyze()} />
                    </div>
                    <motion.button whileHover={{scale:1.03,boxShadow:'0 0 40px rgba(34,211,238,0.4)'}} whileTap={{scale:0.97}}
                      onClick={handleAnalyze} disabled={isAnalyzing||!ipAddress.trim()}
                      className="px-8 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/30"
                      style={{background:'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>
                      {isAnalyzing ? (<><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}><Radio className="w-5 h-5" /></motion.div><span>Scanning...</span></>) : (<><Search className="w-5 h-5" /><span>Analyze</span></>)}
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {isAnalyzing && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="mt-5">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-cyan-400">{scanPhase}</span>
                          <span className="text-slate-400 font-mono">{Math.round(scanProgress)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{width:`${scanProgress}%`}} />
                        </div>
                        <div className="flex gap-2 mt-4 flex-wrap">
                          {['DNS','Geo','ASN','WHOIS','Threats','DNSBL','AbuseIPDB','VirusTotal','OTX','Compile'].map((step,i)=>(
                            <span key={step} className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${scanProgress > i*9 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800/50 text-slate-600'}`}>{step}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {!isAnalyzing && recentSearches.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50">
                  <div className="text-xs text-slate-500 mb-3">Recent searches:</div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.slice(0,6).map(s=>(<motion.button key={s.id} whileHover={{scale:1.05}} onClick={()=>setIpAddress(s.query)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-sm text-cyan-300 transition-all font-mono">{s.query}</motion.button>))}
                  </div>
                </div>
              )}
              {!isAnalyzing && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  {[{icon:Globe,label:'19+ Data Sources',color:'cyan'},{icon:Shield,label:'Threat Intel (VT, OTX)',color:'emerald'},{icon:Network,label:'ASN / BGP / WHOIS',color:'blue'},{icon:Bug,label:'CVE & Blacklists',color:'red'}].map((f,i)=>(
                    <motion.div key={f.label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.1}} className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center">
                      <f.icon className={`w-6 h-6 text-${f.color}-400 mx-auto mb-2`} /><p className="text-xs text-slate-400">{f.label}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ─── RESULTS ─── */
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">

              {/* ═══ TOP SUMMARY BAR ═══ */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{r.location?.flag || '🌐'}</div>
                    <div>
                      <div className="text-2xl font-bold text-white font-mono flex items-center gap-2">
                        {r.ip}
                        <button onClick={()=>copy(r.ip)} className="p-1 rounded hover:bg-white/10"><Copy className="w-4 h-4 text-slate-400" /></button>
                      </div>
                      <div className="text-cyan-400">{r.location?.city}, {r.location?.region}, {r.location?.country}</div>
                      <div className="text-xs text-slate-400">{r.network?.isp} • {r.asn?.number || r.network?.org}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RiskScoreGauge score={r.riskScore || 0} size={100} />
                    <ThreatLevelBadge level={r.threatLevel || 'low'} />
                  </div>
                </div>
              </div>

              {/* ═══ DATA SOURCES & QUICK FLAGS ═══ */}
              <DataSourcePills sources={r.dataSources} queryTime={r.queryTime} />

              <div className="flex flex-wrap gap-2">
                <SecurityBadge label="VPN" active={r.security?.vpn} />
                <SecurityBadge label="Proxy" active={r.security?.proxy} />
                <SecurityBadge label="Tor" active={r.security?.tor} />
                <SecurityBadge label="Datacenter" active={r.security?.datacenter} />
                <SecurityBadge label="Mobile" active={r.security?.mobile} />
                <SecurityBadge label="Relay" active={r.security?.relay} />
              </div>

              {/* ═══ CVE ALERT ═══ */}
              {r.vulnerabilities?.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs text-red-400 font-bold uppercase">{r.vulnerabilities.length} Known CVEs (Shodan)</span></div>
                  <div className="flex flex-wrap gap-1">
                    {r.vulnerabilities.map((v,i)=>(<a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 rounded bg-red-500/20 text-[10px] text-red-300 hover:bg-red-500/30 font-mono">{v.id}</a>))}
                  </div>
                </div>
              )}

              {/* ═══ TABS ═══ */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab=>(
                  <motion.button key={tab.id} whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all text-sm ${activeTab===tab.id ? 'text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-cyan-500/20'}`}
                    style={activeTab===tab.id ? {background:'linear-gradient(135deg,#06b6d4,#3b82f6)'} : {}}>
                    <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* ═══ TAB CONTENT ═══ */}
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>

                  {/* ── OVERVIEW ── */}
                  {activeTab === 'overview' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Geolocation" icon={MapPin} color="cyan">
                        <InfoRow label="Country" value={`${r.location?.flag || ''} ${r.location?.country}`} copyFn={copy} />
                        <InfoRow label="City" value={r.location?.city} />
                        <InfoRow label="Region" value={r.location?.region} />
                        <InfoRow label="ZIP" value={r.location?.zip} />
                        <InfoRow label="Coordinates" value={`${r.location?.lat?.toFixed(4)}, ${r.location?.lng?.toFixed(4)}`} mono copyFn={copy} />
                        <InfoRow label="Timezone" value={r.location?.timezone} />
                        <InfoRow label="Continent" value={r.location?.continent} />
                        <InfoRow label="Currency" value={r.location?.currency} />
                        <InfoRow label="Languages" value={r.location?.languages} />
                        <InfoRow label="Calling Code" value={r.location?.callingCode} />
                      </SectionCard>

                      <div className="space-y-4">
                        <SectionCard title="Risk Analysis" icon={AlertTriangle} color="red">
                          <div className="flex justify-center mb-3">
                            <RiskScoreGauge score={r.riskScore || 0} size={150} />
                          </div>
                          <RiskFactorsList factors={r.riskFactors || []} />
                        </SectionCard>
                      </div>

                      <SectionCard title="ISP & Network" icon={Server} color="blue">
                        <InfoRow label="ISP" value={r.network?.isp} copyFn={copy} />
                        <InfoRow label="Organization" value={r.network?.org} />
                        <InfoRow label="ASN" value={r.asn?.number} mono copyFn={copy} />
                        <InfoRow label="Hostname" value={r.network?.hostname} mono copyFn={copy} />
                        <InfoRow label="Domain" value={r.network?.domain} />
                        <InfoRow label="Type" value={r.network?.type} />
                        <InfoRow label="SSL" value={r.network?.ssl ? 'Yes (Port 443 open)' : 'Not detected'} />
                      </SectionCard>

                      <SectionCard title="Threat Intelligence Summary" icon={Skull} color="red">
                        <div className="space-y-2">
                          {r.threatIntel?.abuseIPDB && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">AbuseIPDB:</span> <span className={`text-sm font-bold ${r.threatIntel.abuseIPDB.confidenceScore > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{r.threatIntel.abuseIPDB.confidenceScore}% confidence</span> <span className="text-xs text-slate-500">({r.threatIntel.abuseIPDB.totalReports} reports)</span></div>
                          )}
                          {r.threatIntel?.virusTotal && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">VirusTotal:</span> <span className={`text-sm font-bold ${r.threatIntel.virusTotal.malicious > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{r.threatIntel.virusTotal.malicious}/{r.threatIntel.virusTotal.totalEngines} malicious</span></div>
                          )}
                          {r.threatIntel?.greyNoise && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">GreyNoise:</span> <span className="text-sm text-white">{r.threatIntel.greyNoise.classification || 'N/A'}</span> {r.threatIntel.greyNoise.riot && <span className="text-[10px] text-emerald-400 ml-1">RIOT (benign)</span>}</div>
                          )}
                          {r.threatIntel?.alienVaultOTX && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">AlienVault OTX:</span> <span className={`text-sm font-bold ${r.threatIntel.alienVaultOTX.pulseCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{r.threatIntel.alienVaultOTX.pulseCount} pulses</span></div>
                          )}
                          {r.threatIntel?.threatFox && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">ThreatFox:</span> <span className="text-sm font-bold text-red-400">{r.threatIntel.threatFox.iocCount} IOC matches</span></div>
                          )}
                          {r.blacklists && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">Blacklists:</span> <span className={`text-sm font-bold ${r.blacklists.listed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{r.blacklists.listed}/{r.blacklists.total} listed</span></div>
                          )}
                          {r.torrentActivity?.found && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">Torrents:</span> <span className="text-sm font-bold text-amber-400">{r.torrentActivity.totalTorrents} downloads detected</span></div>
                          )}
                          {r.ipFraudScore?.available && r.ipFraudScore?.riskScore !== null && (
                            <div className="p-2 rounded-lg bg-slate-800/30"><span className="text-xs text-slate-400">Fraud Score:</span> <span className={`text-sm font-bold ${r.ipFraudScore.riskScore > 70 ? 'text-red-400' : r.ipFraudScore.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{r.ipFraudScore.riskScore}</span></div>
                          )}
                        </div>
                      </SectionCard>
                    </div>
                  )}

                  {/* ── NETWORK & ASN ── */}
                  {activeTab === 'network' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      {r.asn?.name && (
                        <SectionCard title="ASN Details (BGPView)" icon={Network} color="blue">
                          <InfoRow label="ASN" value={r.asn.number} mono copyFn={copy} />
                          <InfoRow label="Name" value={r.asn.name} />
                          <InfoRow label="Description" value={r.asn.description} />
                          <InfoRow label="RIR" value={r.asn.rir} />
                          <InfoRow label="Allocated" value={r.asn.allocationDate} />
                          <InfoRow label="Country" value={r.asn.country} />
                          <InfoRow label="Website" value={r.asn.website} />
                          {r.asn.abuseContacts?.length > 0 && <InfoRow label="Abuse Contact" value={r.asn.abuseContacts.join(', ')} copyFn={copy} />}
                          {r.asn.emailContacts?.length > 0 && <InfoRow label="Email" value={r.asn.emailContacts.join(', ')} copyFn={copy} />}
                        </SectionCard>
                      )}

                      <SectionCard title="DNS & Hostnames" icon={Globe} color="cyan">
                        <InfoRow label="Hostname" value={r.network?.hostname} mono copyFn={copy} />
                        {r.network?.hostnames?.length > 0 && (
                          <div className="mt-2"><span className="text-xs text-slate-500">All hostnames:</span>
                            <div className="flex flex-wrap gap-1 mt-1">{r.network.hostnames.map((h,i)=>(<span key={i} className="px-2 py-0.5 rounded bg-slate-800/50 text-xs text-cyan-300 font-mono">{h}</span>))}</div>
                          </div>
                        )}
                        {r.network?.cpes?.length > 0 && (
                          <div className="mt-2"><span className="text-xs text-slate-500">CPEs (software):</span>
                            <div className="flex flex-wrap gap-1 mt-1">{r.network.cpes.map((c,i)=>(<span key={i} className="px-2 py-0.5 rounded bg-amber-500/10 text-xs text-amber-300 font-mono">{c}</span>))}</div>
                          </div>
                        )}
                      </SectionCard>

                      <SectionCard title={`Open Ports (${r.network?.ports?.length || 0})`} icon={Signal} color="emerald" defaultOpen={true}>
                        <PortMap ports={r.network?.ports || []} />
                        {r.network?.protocols?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">{r.network.protocols.map((p,i)=>(<span key={i} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px]">{p}</span>))}</div>
                        )}
                      </SectionCard>

                      {r.vulnerabilities?.length > 0 && (
                        <SectionCard title={`CVEs (${r.vulnerabilities.length})`} icon={Bug} color="red">
                          <div className="space-y-1">
                            {r.vulnerabilities.map((v,i)=>(
                              <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                                <span className="text-sm text-red-300 font-mono">{v.id}</span>
                                <span className={`text-[10px] font-bold uppercase ${v.severity==='critical'?'text-red-400':'text-orange-400'}`}>{v.severity}</span>
                              </a>
                            ))}
                          </div>
                        </SectionCard>
                      )}

                      {r.asn?.peers?.length > 0 && (
                        <SectionCard title={`BGP Peers (${r.asn.peers.length})`} icon={Users} color="purple" defaultOpen={false}>
                          <div className="space-y-1 max-h-60 overflow-y-auto">{r.asn.peers.map((p,i)=>(
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 text-xs">
                              <span className="text-purple-300 font-mono">AS{p.asn}</span>
                              <span className="text-slate-400 truncate ml-2 flex-1">{p.name || p.description}</span>
                              <span className="text-slate-500 ml-1">{p.country}</span>
                            </div>
                          ))}</div>
                        </SectionCard>
                      )}

                      {r.asn?.upstreams?.length > 0 && (
                        <SectionCard title={`BGP Upstreams (${r.asn.upstreams.length})`} icon={TrendingUp} color="blue" defaultOpen={false}>
                          <div className="space-y-1">{r.asn.upstreams.map((u,i)=>(
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 text-xs">
                              <span className="text-blue-300 font-mono">AS{u.asn}</span>
                              <span className="text-slate-400 truncate ml-2 flex-1">{u.name || u.description}</span>
                            </div>
                          ))}</div>
                        </SectionCard>
                      )}

                      {r.asn?.prefixes?.length > 0 && (
                        <SectionCard title={`IPv4 Prefixes (${r.asn.prefixes.length})`} icon={Database} color="teal" defaultOpen={false}>
                          <div className="space-y-1 max-h-60 overflow-y-auto">{r.asn.prefixes.map((p,i)=>(
                            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 text-xs">
                              <span className="text-teal-300 font-mono">{p.prefix}</span>
                              <span className="text-slate-400 truncate ml-2 flex-1">{p.name || p.description}</span>
                            </div>
                          ))}</div>
                        </SectionCard>
                      )}
                    </div>
                  )}

                  {/* ── WHOIS ── */}
                  {activeTab === 'whois' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="RDAP Registration" icon={FileText} color="purple">
                        {r.whois?.name || r.whois?.handle ? (
                          <>
                            <InfoRow label="Net Name" value={r.whois.name} copyFn={copy} />
                            <InfoRow label="Handle" value={r.whois.handle} mono />
                            <InfoRow label="Type" value={r.whois.type} />
                            <InfoRow label="Start Address" value={r.whois.startAddress} mono />
                            <InfoRow label="End Address" value={r.whois.endAddress} mono />
                            <InfoRow label="CIDR" value={r.whois.cidr} mono copyFn={copy} />
                            <InfoRow label="Country" value={r.whois.country} />
                            {r.whois.status?.length > 0 && (
                              <div className="mt-2"><span className="text-xs text-slate-500">Status:</span>
                                <div className="flex flex-wrap gap-1 mt-1">{r.whois.status.map((s,i)=>(<span key={i} className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px]">{s}</span>))}</div>
                              </div>
                            )}
                          </>
                        ) : <p className="text-sm text-slate-500">No RDAP data available for this IP.</p>}
                      </SectionCard>

                      {r.whois?.events?.length > 0 && (
                        <SectionCard title="Registration Events" icon={Clock} color="blue">
                          <div className="space-y-1">{r.whois.events.map((ev,i)=>(
                            <div key={i} className="flex justify-between p-2 rounded-lg bg-slate-800/30">
                              <span className="text-sm text-slate-300 capitalize">{ev.action}</span>
                              <span className="text-xs text-slate-400 font-mono">{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</span>
                            </div>
                          ))}</div>
                        </SectionCard>
                      )}

                      {r.whois?.entities?.length > 0 && (
                        <SectionCard title="Entities / Contacts" icon={Users} color="purple">
                          <div className="space-y-2">{r.whois.entities.map((ent,i)=>(<WhoisEntity key={i} entity={ent} />))}</div>
                        </SectionCard>
                      )}

                      {r.whois?.remarks?.length > 0 && (
                        <SectionCard title="Remarks" icon={Info} color="slate" defaultOpen={false}>
                          <div className="space-y-2">{r.whois.remarks.map((rm,i)=>(
                            <div key={i} className="p-2 rounded-lg bg-slate-800/30">
                              {rm.title && <div className="text-sm text-white font-medium mb-0.5">{rm.title}</div>}
                              <div className="text-xs text-slate-400">{rm.description}</div>
                            </div>
                          ))}</div>
                        </SectionCard>
                      )}
                    </div>
                  )}

                  {/* ── THREATS ── */}
                  {activeTab === 'threats' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      {/* AbuseIPDB */}
                      <SectionCard title="AbuseIPDB" icon={AlertTriangle} color="red">
                        {r.threatIntel?.abuseIPDB ? (
                          <>
                            <div className="flex items-center gap-4 mb-3">
                              <div className={`text-4xl font-bold ${r.threatIntel.abuseIPDB.confidenceScore > 50 ? 'text-red-400' : r.threatIntel.abuseIPDB.confidenceScore > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {r.threatIntel.abuseIPDB.confidenceScore}%
                              </div>
                              <div>
                                <div className="text-sm text-white">Abuse Confidence Score</div>
                                <div className="text-xs text-slate-400">{r.threatIntel.abuseIPDB.totalReports} total reports</div>
                              </div>
                            </div>
                            <InfoRow label="ISP" value={r.threatIntel.abuseIPDB.isp} />
                            <InfoRow label="Usage Type" value={r.threatIntel.abuseIPDB.usageType} />
                            <InfoRow label="Domain" value={r.threatIntel.abuseIPDB.domain} />
                            <InfoRow label="Last Reported" value={r.threatIntel.abuseIPDB.lastReportedAt ? new Date(r.threatIntel.abuseIPDB.lastReportedAt).toLocaleString() : null} />
                            <InfoRow label="Whitelisted" value={r.threatIntel.abuseIPDB.isWhitelisted ? 'Yes' : 'No'} />
                            {r.threatIntel.abuseIPDB.reports?.length > 0 && (
                              <div className="mt-3"><span className="text-xs text-slate-500 mb-1 block">Recent Reports:</span>
                                <div className="space-y-1 max-h-48 overflow-y-auto">{r.threatIntel.abuseIPDB.reports.map((rp,i)=>(<AbuseReportRow key={i} report={rp} />))}</div>
                              </div>
                            )}
                          </>
                        ) : <p className="text-sm text-slate-500">No AbuseIPDB data. Set ABUSEIPDB_KEY to enable.</p>}
                      </SectionCard>

                      {/* VirusTotal */}
                      <SectionCard title="VirusTotal" icon={Shield} color="emerald">
                        {r.threatIntel?.virusTotal ? (
                          <>
                            <VTDetectionBar {...r.threatIntel.virusTotal} />
                            <div className="mt-3">
                              <InfoRow label="Reputation" value={r.threatIntel.virusTotal.reputation} />
                              <InfoRow label="AS Owner" value={r.threatIntel.virusTotal.asOwner} />
                              <InfoRow label="Network" value={r.threatIntel.virusTotal.network} mono />
                              <InfoRow label="Last Analysis" value={r.threatIntel.virusTotal.lastAnalysisDate ? new Date(r.threatIntel.virusTotal.lastAnalysisDate).toLocaleString() : null} />
                            </div>
                            {r.threatIntel.virusTotal.cert && (
                              <div className="mt-2 p-2 rounded-lg bg-slate-800/30">
                                <span className="text-xs text-slate-500">SSL Cert:</span>
                                <InfoRow label="Issuer" value={r.threatIntel.virusTotal.cert.issuer} />
                                <InfoRow label="Subject" value={r.threatIntel.virusTotal.cert.subject} />
                              </div>
                            )}
                            {r.threatIntel.virusTotal.engines?.length > 0 && (
                              <div className="mt-3"><span className="text-xs text-slate-500 mb-1 block">Engine Results:</span>
                                <div className="space-y-0.5 max-h-48 overflow-y-auto">{r.threatIntel.virusTotal.engines.filter(e=>e.category!=='harmless'&&e.category!=='undetected').slice(0,20).map((e,i)=>(
                                  <div key={i} className={`flex justify-between p-1.5 rounded text-xs ${e.category==='malicious'?'bg-red-500/10 text-red-300':e.category==='suspicious'?'bg-amber-500/10 text-amber-300':'text-slate-400'}`}>
                                    <span>{e.engine}</span><span className="font-bold uppercase">{e.category}</span>
                                  </div>
                                ))}</div>
                              </div>
                            )}
                          </>
                        ) : <p className="text-sm text-slate-500">No VirusTotal data. Set VT_API_KEY to enable.</p>}
                      </SectionCard>

                      {/* GreyNoise */}
                      <SectionCard title="GreyNoise" icon={Radio} color="blue">
                        {r.threatIntel?.greyNoise ? (
                          <>
                            <InfoRow label="Classification" value={r.threatIntel.greyNoise.classification} />
                            <InfoRow label="Noise" value={r.threatIntel.greyNoise.noise ? 'Yes (Internet scanner)' : 'No'} />
                            <InfoRow label="RIOT" value={r.threatIntel.greyNoise.riot ? 'Yes (Known benign)' : 'No'} />
                            <InfoRow label="Name" value={r.threatIntel.greyNoise.name} />
                            <InfoRow label="Last Seen" value={r.threatIntel.greyNoise.lastSeen} />
                            {r.threatIntel.greyNoise.link && (
                              <a href={r.threatIntel.greyNoise.link} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-2"><ExternalLink className="w-3 h-3" /> View on GreyNoise</a>
                            )}
                          </>
                        ) : <p className="text-sm text-slate-500">No GreyNoise data. Set GREYNOISE_KEY to enable.</p>}
                      </SectionCard>

                      {/* AlienVault OTX */}
                      <SectionCard title="AlienVault OTX" icon={Eye} color="amber">
                        {r.threatIntel?.alienVaultOTX ? (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`text-3xl font-bold ${r.threatIntel.alienVaultOTX.pulseCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{r.threatIntel.alienVaultOTX.pulseCount}</div>
                              <div className="text-sm text-white">Threat Pulses</div>
                            </div>
                            {r.threatIntel.alienVaultOTX.pulses?.length > 0 && (
                              <div className="space-y-2 max-h-64 overflow-y-auto">{r.threatIntel.alienVaultOTX.pulses.map((p,i)=>(<OTXPulseCard key={i} pulse={p} />))}</div>
                            )}
                            {r.threatIntel.alienVaultOTX.malware?.length > 0 && (
                              <div className="mt-3"><span className="text-xs text-slate-500 mb-1 block">Associated Malware:</span>
                                <div className="space-y-1">{r.threatIntel.alienVaultOTX.malware.map((m,i)=>(
                                  <div key={i} className="p-2 rounded-lg bg-red-500/10 text-xs"><span className="text-red-300 font-mono">{m.hash?.substring(0,16)}...</span></div>
                                ))}</div>
                              </div>
                            )}
                          </>
                        ) : <p className="text-sm text-slate-500">No OTX data. Set OTX_API_KEY to enable.</p>}
                      </SectionCard>

                      {/* ThreatFox */}
                      {r.threatIntel?.threatFox && (
                        <SectionCard title={`ThreatFox IOCs (${r.threatIntel.threatFox.iocCount})`} icon={Bug} color="red">
                          <div className="space-y-2">{r.threatIntel.threatFox.iocs?.map((ioc,i)=>(
                            <div key={i} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-red-300 font-bold">{ioc.threatType}</span>
                                <span className="text-slate-400">{ioc.confidence}% confidence</span>
                              </div>
                              <div className="text-xs text-white">{ioc.malware}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">First: {ioc.firstSeen} | Reporter: {ioc.reporter}</div>
                            </div>
                          ))}</div>
                        </SectionCard>
                      )}

                      {/* Torrent Activity (iKnowWhatYouDownload) */}
                      <SectionCard title={`Torrent Activity${r.torrentActivity?.found ? ` (${r.torrentActivity.totalTorrents})` : ''}`} icon={Download} color={r.torrentActivity?.found ? 'amber' : 'emerald'}>
                        {r.torrentActivity?.found ? (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="text-3xl font-bold text-amber-400">{r.torrentActivity.totalTorrents}</div>
                              <div className="text-sm text-white">Torrents Downloaded</div>
                            </div>
                            {r.torrentActivity.torrents?.length > 0 && (
                              <div className="space-y-1 max-h-64 overflow-y-auto">{r.torrentActivity.torrents.map((t,i)=>(
                                <div key={i} className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                                  <div className="text-amber-300 font-medium truncate">{t.name}</div>
                                  <div className="flex gap-3 mt-0.5 text-slate-500">
                                    {t.category && <span>{t.category}</span>}
                                    {t.size && <span>{t.size}</span>}
                                    {t.startDate && <span>{t.startDate}</span>}
                                  </div>
                                </div>
                              ))}</div>
                            )}
                            {r.torrentActivity.lookupUrl && (
                              <a href={r.torrentActivity.lookupUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-2"><ExternalLink className="w-3 h-3" /> View on iKnowWhatYouDownload</a>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-3">
                            <div className="text-emerald-400 text-sm font-bold">No Torrent Activity Detected</div>
                            {r.torrentActivity?.lookupUrl && (
                              <a href={r.torrentActivity.lookupUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-2 justify-center"><ExternalLink className="w-3 h-3" /> Manual Check</a>
                            )}
                          </div>
                        )}
                      </SectionCard>

                      {/* IP Fraud Score */}
                      {r.ipFraudScore && (
                        <SectionCard title="IP Fraud Score" icon={Target} color={r.ipFraudScore.available ? 'amber' : 'slate'}>
                          {r.ipFraudScore.available ? (
                            <>
                              {r.ipFraudScore.riskScore !== null && (
                                <div className="flex items-center gap-3 mb-3">
                                  <div className={`text-3xl font-bold ${r.ipFraudScore.riskScore > 70 ? 'text-red-400' : r.ipFraudScore.riskScore > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {r.ipFraudScore.riskScore}
                                  </div>
                                  <div className="text-sm text-white">Risk Score</div>
                                </div>
                              )}
                              {r.ipFraudScore.riskLevel && <InfoRow label="Risk Level" value={r.ipFraudScore.riskLevel} />}
                              <InfoRow label="Automation" value={r.ipFraudScore.isBot ? 'Yes' : 'No'} />
                              <InfoRow label="Crawler" value={r.ipFraudScore.isCrawler ? 'Yes' : 'No'} />
                              <InfoRow label="Spam" value={r.ipFraudScore.isSpam ? 'Yes' : 'No'} />
                            </>
                          ) : (
                            <div className="text-center py-3">
                              <p className="text-sm text-slate-500">IP fraud score data not available.</p>
                              {r.ipFraudScore.lookupUrl && (
                                <a href={r.ipFraudScore.lookupUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-2 justify-center"><ExternalLink className="w-3 h-3" /> Check on ip-score.com</a>
                              )}
                            </div>
                          )}
                        </SectionCard>
                      )}
                    </div>
                  )}

                  {/* ── BLACKLISTS ── */}
                  {activeTab === 'blacklists' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title={`DNS Blacklist Results (${r.blacklists?.listed || 0}/${r.blacklists?.total || 0} listed)`} icon={Shield} color="red">
                        <BlacklistTable results={r.blacklists?.results || []} />
                      </SectionCard>

                      {r.blacklists?.stopForumSpam && (
                        <SectionCard title="StopForumSpam Details" icon={AlertTriangle} color="amber">
                          <InfoRow label="Appears" value={r.blacklists.stopForumSpam.appears ? 'Yes' : 'No'} />
                          <InfoRow label="Frequency" value={r.blacklists.stopForumSpam.frequency} />
                          <InfoRow label="Confidence" value={r.blacklists.stopForumSpam.confidence ? `${r.blacklists.stopForumSpam.confidence}%` : null} />
                          <InfoRow label="Last Seen" value={r.blacklists.stopForumSpam.lastSeen} />
                        </SectionCard>
                      )}

                      {r.blacklists?.blocklistDe?.raw && (
                        <SectionCard title="Blocklist.de Details" icon={Database} color="red" defaultOpen={false}>
                          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono bg-slate-800/50 p-3 rounded-lg">{r.blacklists.blocklistDe.raw}</pre>
                        </SectionCard>
                      )}

                      <SectionCard title="Summary" icon={CheckCircle} color="emerald">
                        <div className="text-center py-4">
                          <div className={`text-5xl font-bold mb-2 ${(r.blacklists?.listed||0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {r.blacklists?.listed || 0}
                          </div>
                          <div className="text-slate-400 text-sm">out of {r.blacklists?.total || 0} blacklists</div>
                          <div className={`mt-2 text-sm font-bold ${(r.blacklists?.listed||0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {(r.blacklists?.listed||0) > 0 ? 'IP IS BLACKLISTED' : 'IP IS CLEAN'}
                          </div>
                        </div>
                      </SectionCard>
                    </div>
                  )}

                  {/* ── TIMELINE ── */}
                  {activeTab === 'timeline' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Investigation Events" icon={Clock} color="cyan">
                        <InvestigationTimeline events={r.history || []} />
                      </SectionCard>
                      <SectionCard title="Investigation Statistics" icon={Activity} color="blue">
                        <div className="space-y-3">
                          <InfoRow label="Sources Queried" value={r.sourceCount || r.dataSources?.length} />
                          <InfoRow label="Query Time" value={r.queryTime} />
                          <InfoRow label="Risk Score" value={`${r.riskScore || 0}/100`} />
                          <InfoRow label="Threat Level" value={r.threatLevel} />
                          <InfoRow label="Open Ports" value={r.network?.ports?.length || 0} />
                          <InfoRow label="Known CVEs" value={r.vulnerabilities?.length || 0} />
                          <InfoRow label="Blacklists Hit" value={`${r.blacklists?.listed || 0}/${r.blacklists?.total || 0}`} />
                          <InfoRow label="AbuseIPDB Confidence" value={r.threatIntel?.abuseIPDB ? `${r.threatIntel.abuseIPDB.confidenceScore}%` : 'N/A'} />
                          <InfoRow label="VT Malicious" value={r.threatIntel?.virusTotal ? `${r.threatIntel.virusTotal.malicious}/${r.threatIntel.virusTotal.totalEngines}` : 'N/A'} />
                          <InfoRow label="OTX Pulses" value={r.threatIntel?.alienVaultOTX?.pulseCount ?? 'N/A'} />
                          <InfoRow label="ThreatFox IOCs" value={r.threatIntel?.threatFox?.iocCount ?? 0} />
                          <InfoRow label="Risk Factors" value={r.riskFactors?.length || 0} />
                        </div>
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'enrichment' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      {!enrichedData ? (
                        <div className="lg:col-span-2 text-center py-8 text-slate-500 text-sm">Enrichment data loading... <RefreshCw size={14} className="inline animate-spin ml-1" /></div>
                      ) : (
                        <>
                          {/* Tor Exit Node */}
                          <SectionCard title="Tor Exit Node Check" icon={Eye} color={enrichedData.tor?.isTorExit ? 'red' : 'green'}>
                            <SecurityBadge label="Tor Exit" active={enrichedData.tor?.isTorExit} />
                            {enrichedData.tor?.sources?.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {enrichedData.tor.sources.map((s, i) => (
                                  <div key={i} className="p-2 rounded-lg bg-slate-800/30 text-xs text-slate-400">
                                    <span className="text-slate-500">{s.source}:</span> {s.exitAddress || 'Found'}
                                    {s.timestamp && <span className="block text-[10px] text-slate-600 mt-0.5">{s.timestamp}</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </SectionCard>

                          {/* VPN / Proxy Detection */}
                          <SectionCard title="VPN / Proxy Detection" icon={Shield}
                            color={enrichedData.vpnProxy?.isVpn || enrichedData.vpnProxy?.isProxy ? 'red' : 'green'}>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <SecurityBadge label="VPN" active={enrichedData.vpnProxy?.isVpn} />
                              <SecurityBadge label="Proxy" active={enrichedData.vpnProxy?.isProxy} />
                              <SecurityBadge label="Tor" active={enrichedData.vpnProxy?.isTor} />
                              <SecurityBadge label="Crawler" active={enrichedData.vpnProxy?.isCrawler} />
                            </div>
                            <InfoRow label="Provider" value={enrichedData.vpnProxy?.isp} />
                            <InfoRow label="ASN" value={enrichedData.vpnProxy?.asn} mono />
                            <InfoRow label="Country" value={enrichedData.vpnProxy?.country} />
                            <InfoRow label="City" value={enrichedData.vpnProxy?.city} />
                            {enrichedData.vpnProxy?.sources?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {enrichedData.vpnProxy.sources.map((s, i) => <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-700/50 text-slate-400">{s}</span>)}
                              </div>
                            )}
                          </SectionCard>

                          {/* Honeypot Check */}
                          <SectionCard title="Honeypot Check" icon={Bug}
                            color={enrichedData.honeypot?.isHoneypot ? 'red' : 'green'}>
                            <SecurityBadge label="Honeypot" active={enrichedData.honeypot?.isHoneypot} />
                            <InfoRow label="Score" value={enrichedData.honeypot?.score != null ? `${enrichedData.honeypot.score}/100` : null} />
                            <InfoRow label="Reports" value={enrichedData.honeypot?.reports} />
                            <InfoRow label="Last Reported" value={enrichedData.honeypot?.lastReported} />
                          </SectionCard>

                          {/* Cloud Provider Detection */}
                          <SectionCard title="Cloud Provider Detection" icon={Cloud}
                            color={enrichedData.cloudProvider?.provider ? 'blue' : 'slate'}>
                            {enrichedData.cloudProvider?.provider ? (
                              <>
                                <InfoRow label="Provider" value={enrichedData.cloudProvider.provider} />
                                <InfoRow label="Service" value={enrichedData.cloudProvider.service} mono />
                                <InfoRow label="Region" value={enrichedData.cloudProvider.region} />
                              </>
                            ) : (
                              <div className="text-sm text-slate-500 text-center py-2">Not hosted on a major cloud provider</div>
                            )}
                          </SectionCard>

                          {/* ASN Neighbor Analysis */}
                          <SectionCard title="ASN Neighbor Analysis" icon={Network} color="blue" defaultOpen={true}>
                            <InfoRow label="ASN" value={enrichedData.asnNeighbors?.asn} mono />
                            <InfoRow label="Name" value={enrichedData.asnNeighbors?.name} />
                            <InfoRow label="Country" value={enrichedData.asnNeighbors?.country} />
                            <InfoRow label="RIR" value={enrichedData.asnNeighbors?.rir} />
                            {enrichedData.asnNeighbors?.neighbors?.length > 0 && (
                              <>
                                <div className="mt-3 pt-3 border-t border-slate-700/50">
                                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Peers & Upstreams ({enrichedData.asnNeighbors.neighbors.length})</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto space-y-1 mt-2">
                                  {enrichedData.asnNeighbors.neighbors.slice(0, 30).map((n, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30 text-xs">
                                      <span className="text-cyan-300 font-mono">AS{n.asn}</span>
                                      <span className="text-slate-400 flex-1 truncate mx-2">{n.name || n.description}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                        n.type === 'peer' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                      }`}>{n.type}</span>
                                      <span className="text-slate-600 ml-1">{n.country}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                            {enrichedData.asnNeighbors?.prefixes?.length > 0 && (
                              <div className="mt-3">
                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Prefixes</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {enrichedData.asnNeighbors.prefixes.map((p, i) => (
                                    <span key={i} className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-700/50 text-slate-300">{p.prefix}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </SectionCard>
                        </>
                      )}
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ═══ MODALS ═══ */}
      <ExportReportModal isOpen={showExportModal} onClose={()=>setShowExportModal(false)} data={r} title={`IP Analysis - ${ipAddress}`} toolName="IP Intelligence" />
      <SaveToCaseModal isOpen={showSaveToCaseModal} onClose={()=>setShowSaveToCaseModal(false)} data={r} toolName="IP Intelligence" query={ipAddress} />
      <SearchHistoryPanel isOpen={showSearchHistory} onClose={()=>setShowSearchHistory(false)} onSelectSearch={handleSelectFromHistory} activeToolId="ip-trace" />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar{width:6px}
        .custom-scrollbar::-webkit-scrollbar-track{background:rgba(15,23,42,0.5);border-radius:3px}
        .custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(34,211,238,0.3);border-radius:3px}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(34,211,238,0.5)}
        .scrollbar-hide::-webkit-scrollbar{display:none}
        .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </motion.div>
  );
};

export default IPIntelligenceTool;
