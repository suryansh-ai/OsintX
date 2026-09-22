import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link, X, Search, Zap, Shield, AlertTriangle, CheckCircle, Globe,
  ExternalLink, Lock, Unlock, Bug, Skull, FileWarning, Eye, Server,
  Clock, RefreshCw, ChevronDown, Copy, Scan, Target, Radio, Image,
  FileCode, QrCode, Diff, Camera, Upload
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';
import { Download } from 'lucide-react';
import { useToolResult } from '../../context/ToolResultContext';

const RISK_BORDER = { high: 'border-red-500/30', medium: 'border-amber-500/30' };
const RISK_TEXT = { high: 'text-red-400', medium: 'text-amber-400' };
const STAT_COLOR = { emerald: 'text-emerald-400', cyan: 'text-cyan-400', amber: 'text-amber-400', red: 'text-red-400', blue: 'text-blue-400' };

const URLScannerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const { copy } = useClipboard();
  
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'U R L Scanner', query: url });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [scanLines, setScanLines] = useState([]);
  const [lastLookupTime, setLastLookupTime] = useState(null);
  const [enrichment, setEnrichment] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [qrImage, setQrImage] = useState(null);
  const [qrImageBase64, setQrImageBase64] = useState('');
  const fileInputRef = useRef(null);

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `url_scan_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `url_scan_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Generate scan line animations
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanLines(prev => {
          const newLines = [...prev, Date.now()];
          return newLines.slice(-10);
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setScanLines([]);
    }
  }, [isScanning]);

  const handleScan = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    trackToolUsage('url-scanner', 'scan', 'start');
    setIsScanning(true);
    setScanProgress(0);
    onConsume?.(6);

    const progressInterval = setInterval(() => {
      if (!mountedRef.current) { clearInterval(progressInterval); return; }
      setScanProgress(prev => Math.min(prev + 1, 95));
    }, 30);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/url/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      clearInterval(progressInterval);
      setScanProgress(100);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'URL scan failed');
      }
      const resultData = await response.json();
      setResults(resultData);
      setLastLookupTime(new Date());
      addToHistory('url-scanner', url, resultData);
      trackToolUsage('url-scanner', 'scan', 'success');
      toast.success('URL scan complete — real data!');
    } catch (err) {
      clearInterval(progressInterval);
      toast.error(err.message || 'URL scan failed');
      trackToolUsage('url-scanner', 'scan', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleEnrich = async () => {
    if (!results) return;
    setIsEnriching(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/url/enriched`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: results.url,
          imageBase64: qrImageBase64,
          currentHtml: '',
        }),
      });
      if (!response.ok) throw new Error('Enrichment failed');
      const data = await response.json();
      setEnrichment(data);
      toast.success('Enrichment data loaded');
    } catch (err) {
      toast.error(err.message || 'Enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleQRUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQrImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(',')[1];
      setQrImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRefresh = () => {
    setUrl('');
    setResults(null);
    setLastLookupTime(null);
    setEnrichment(null);
    setQrImage(null);
    setQrImageBase64('');
    toast.info('Ready for new search');
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'red';
      case 'medium': return 'amber';
      default: return 'emerald';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'threats', label: 'Threats', icon: Shield },
    { id: 'content', label: 'Page Analysis', icon: Scan },
    { id: 'ssl', label: 'SSL/TLS', icon: Lock },
    { id: 'server', label: 'Server', icon: Server },
    { id: 'headers', label: 'Headers', icon: FileWarning },
    { id: 'enrichment', label: 'Enrichment', icon: QrCode },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, rotateY: 15, opacity: 0 }}
        animate={{ scale: 1, rotateY: 0, opacity: 1 }}
        exit={{ scale: 0.8, rotateY: -15, opacity: 0 }}
        transition={{ type: 'spring', damping: 18 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950 border border-rose-500/30 shadow-[0_0_100px_rgba(244,63,94,0.15)]"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Scan grid */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `
              linear-gradient(90deg, #f43f5e 1px, transparent 1px),
              linear-gradient(#f43f5e 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />

          {/* Scanning lines animation */}
          {scanLines.map(line => (
            <motion.div
              key={line}
              initial={{ top: 0, opacity: 0.8 }}
              animate={{ top: '100%', opacity: 0 }}
              transition={{ duration: 1, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent"
            />
          ))}

          {/* Threat radar */}
          <div className="absolute top-20 right-20 w-40 h-40 opacity-20">
            <svg className="w-full h-full">
              <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#f43f5e" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="50%" fill="none" stroke="#f43f5e" strokeWidth="1" />
              <circle cx="50%" cy="50%" r="70%" fill="none" stroke="#f43f5e" strokeWidth="1" />
              <motion.line
                x1="50%"
                y1="50%"
                x2="50%"
                y2="0%"
                stroke="#f43f5e"
                strokeWidth="2"
                style={{ transformOrigin: '50% 50%' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
            </svg>
          </div>

          {/* Gradient glows */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-red-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <div className="relative px-3 sm:px-6 py-3 sm:py-5 border-b border-rose-500/20 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-5">
              <div className="relative">
                <motion.div
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/40"
                >
                  <Link className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                </motion.div>
                {/* Pulsing threat indicator */}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-rose-500 hidden sm:block"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                  URL Scanner
                  <span className="px-2 py-0.5 text-[10px] sm:text-xs bg-rose-500/20 text-rose-300 rounded-full border border-rose-500/30 hidden sm:inline">SECURITY</span>
                </h2>
                <p className="text-xs sm:text-sm text-rose-300/70 flex items-center gap-2">
                  <Scan className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Malware, phishing & threat detection</span>
                  <span className="sm:hidden">Threat detection</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-2"
                title="New Search"
              >
                <RefreshCw className="w-5 h-5 text-rose-400" />
                <span className="text-xs text-rose-200">New Search</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportJSON}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-rose-400" />
                <span className="text-xs text-rose-200">Export JSON</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                disabled={!results}
                onClick={handleExportCSV}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-5 h-5 text-rose-400" />
                <span className="text-xs text-rose-200">Export CSV</span>
              </motion.button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hidden sm:flex items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-400" />
                <span className="text-lg font-bold text-amber-300">6</span>
                <span className="text-xs text-amber-200/70">credits</span>
              </motion.div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-3 sm:p-6 overflow-y-auto max-h-[calc(92vh-80px)] sm:max-h-[calc(92vh-100px)]">
          {/* Input Section */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-rose-500/20 backdrop-blur-sm">
            <label className="text-rose-300 text-xs sm:text-sm font-medium mb-2 sm:mb-3 flex items-center gap-2">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
              Target URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <Link className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://example.com/suspicious-page"
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 rounded-xl bg-slate-800/80 border-2 border-rose-500/30 text-white text-base sm:text-lg placeholder-gray-500 focus:outline-none focus:border-rose-400 focus:shadow-[0_0_30px_rgba(244,63,94,0.2)] transition-all"
                  onKeyDown={e => e.key === 'Enter' && handleScan()}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(244,63,94,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleScan}
                disabled={isScanning || !url.trim()}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-rose-500/30"
              >
                {isScanning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Target className="w-5 h-5" />
                )}
                <span>{isScanning ? 'Scanning...' : 'Scan URL'}</span>
              </motion.button>
            </div>

            {/* Scan Progress */}
            {isScanning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-rose-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse" />
                    Scanning for threats...
                  </span>
                  <span className="text-rose-400 font-mono">{scanProgress}%</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-500 bg-[length:200%_100%]"
                    style={{ width: `${scanProgress}%` }}
                    animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {[
                    { icon: Shield, label: 'Malware Check', done: scanProgress > 25 },
                    { icon: Bug, label: 'Phishing Check', done: scanProgress > 50 },
                    { icon: Lock, label: 'SSL Analysis', done: scanProgress > 75 },
                    { icon: Server, label: 'Server Info', done: scanProgress > 90 },
                  ].map((step, i) => (
                    <motion.div
                      key={step.label}
                      className={`p-3 rounded-xl text-center transition-all ${
                        step.done ? 'bg-rose-500/20 border border-rose-500/40' : 'bg-slate-800/50'
                      }`}
                      animate={{ scale: step.done ? [1, 1.05, 1] : 1 }}
                    >
                      <step.icon className={`w-5 h-5 mx-auto mb-1 ${step.done ? 'text-rose-400' : 'text-gray-500'}`} />
                      <div className={`text-xs ${step.done ? 'text-rose-300' : 'text-gray-500'}`}>{step.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Risk Overview */}
                <div className={`mb-6 p-6 rounded-2xl border ${
                  results.safe 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        results.safe ? 'bg-emerald-500/20' : 'bg-red-500/20'
                      }`}>
                        {results.safe ? (
                          <CheckCircle className="w-10 h-10 text-emerald-400" />
                        ) : (
                          <Skull className="w-10 h-10 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${results.safe ? 'text-emerald-400' : 'text-red-400'}`}>
                          {results.safe ? 'URL Appears Safe' : 'Potential Threats Detected'}
                        </div>
                        <div className="text-gray-400 text-sm truncate max-w-md">{results.url}</div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className={`text-center px-6 py-3 rounded-xl bg-slate-800/50 ${RISK_BORDER[results.riskLevel] || 'border-gray-500/30'}`}>
                        <div className={`text-2xl font-bold ${RISK_TEXT[results.riskLevel] || 'text-gray-400'}`}>
                          {results.riskScore}
                        </div>
                        <div className="text-xs text-gray-400">Risk Score</div>
                      </div>
                      <div className="text-center px-6 py-3 rounded-xl bg-slate-800/50 border border-rose-500/20">
                        <div className="text-2xl font-bold text-white">{results.redirects}</div>
                        <div className="text-xs text-gray-400">Redirects</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Sources & Threat Intel */}
                <div className="mb-4 space-y-3">
                  {results.dataSources && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Scanned by</span>
                      {results.dataSources.map((src, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] text-cyan-400 font-medium">{src}</span>
                      ))}
                    </div>
                  )}
                  {results.securityHeaders && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">Security Grade:</span>
                      <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                        results.securityGrade === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                        results.securityGrade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                        results.securityGrade === 'C' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{results.securityGrade} ({results.securityHeaders.score}/{results.securityHeaders.maxScore} headers)</span>
                    </div>
                  )}
                  {results.threats?.malware && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400 font-bold">MALWARE DETECTED — Listed on URLhaus (abuse.ch)</span>
                    </div>
                  )}
                  {results.threats?.phishing && (
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-xs text-orange-400 font-bold">PHISHING DETECTED — Found in PhishStats database</span>
                    </div>
                  )}
                  {results.threats?.threatFoxMalicious && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2">
                      <Skull className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400 font-bold">THREATFOX IOC MATCH — Domain linked to malware campaigns</span>
                    </div>
                  )}
                  {results.pageAnalysis?.hasLoginForm && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400 font-bold">LOGIN FORM DETECTED — Possible credential harvesting page</span>
                    </div>
                  )}
                  {results.pageAnalysis?.hasObfuscatedJS && (
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center gap-2">
                      <Bug className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-400 font-bold">OBFUSCATED JAVASCRIPT — Suspicious code patterns detected</span>
                    </div>
                  )}
                  {results.wayback?.archived && (
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs text-blue-300">
                        Archived on Wayback Machine — {results.wayback.snapshotDate && `Last snapshot: ${results.wayback.snapshotDate}`}
                      </span>
                      {results.wayback.closestSnapshot && (
                        <a href={results.wayback.closestSnapshot} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:underline ml-auto flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                      )}
                    </div>
                  )}
                  {results.vulnerabilities?.length > 0 && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <span className="text-xs text-red-400 font-bold">{results.vulnerabilities.length} Server Vulnerabilities (Shodan): </span>
                      {results.vulnerabilities.map((v, i) => (
                        <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-red-300 hover:underline font-mono mr-2">{v.id}</a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {tabs.map(tab => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-3 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all ${
                        activeTab === tab.id
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                          : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-rose-500/20'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 rounded-2xl bg-slate-900/60 border border-rose-500/20"
                  >
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Quick Stats */}
                        <div className="grid md:grid-cols-4 gap-4">
                          {[
                            { label: 'Status Code', value: results.server.statusCode, color: 'emerald' },
                            { label: 'Response Time', value: results.server.responseTime, color: 'cyan' },
                            { label: 'SSL Grade', value: results.ssl.grade, color: 'amber' },
                            { label: 'Blacklists', value: `${results.blacklists.flagged}/${results.blacklists.total}`, color: results.blacklists.flagged > 0 ? 'red' : 'emerald' },
                          ].map((item, i) => (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="p-4 rounded-xl bg-slate-800/50 text-center"
                            >
                              <div className={`text-2xl font-bold ${STAT_COLOR[item.color] || 'text-gray-400'}`}>{item.value}</div>
                              <div className="text-gray-400 text-sm">{item.label}</div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Categories & Technologies */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-rose-300 font-medium mb-3">Categories</h4>
                            <div className="flex flex-wrap gap-2">
                              {results.categories?.map(cat => (
                                <span key={cat} className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-sm border border-rose-500/30">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-rose-300 font-medium mb-3">Technologies Detected</h4>
                            <div className="flex flex-wrap gap-2">
                              {results.technologies?.map(tech => (
                                <span key={tech} className="px-3 py-1 rounded-lg bg-slate-800/50 text-gray-300 text-sm border border-slate-700/50">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Redirect Chain */}
                        {results.redirectChain?.length > 1 && (
                          <div>
                            <h4 className="text-rose-300 font-medium mb-3">Redirect Chain</h4>
                            <div className="space-y-2">
                              {results.redirectChain?.map((redirect, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50"
                                >
                                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                                    redirect.status === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {redirect.status}
                                  </span>
                                  <code className="text-gray-300 text-sm truncate">{redirect.url}</code>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'threats' && (
                      <div className="space-y-4">
                        <h3 className="text-rose-300 font-semibold flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Threat Analysis
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            { label: 'Malware', detected: results.threats?.malware, icon: Bug },
                            { label: 'Phishing', detected: results.threats?.phishing, icon: Skull },
                            { label: 'Spam', detected: results.threats?.spam, icon: AlertTriangle },
                            { label: 'Suspicious Content', detected: results.threats?.suspicious, icon: Eye },
                          ].map((threat, i) => (
                            <motion.div
                              key={threat.label}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className={`p-5 rounded-xl flex items-center justify-between ${
                                threat.detected 
                                  ? 'bg-red-500/10 border border-red-500/30' 
                                  : 'bg-emerald-500/10 border border-emerald-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <threat.icon className={`w-6 h-6 ${threat.detected ? 'text-red-400' : 'text-emerald-400'}`} />
                                <span className="text-white font-medium">{threat.label}</span>
                              </div>
                              {threat.detected ? (
                                <span className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm">Detected</span>
                              ) : (
                                <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">Clean</span>
                              )}
                            </motion.div>
                          ))}
                        </div>

                        {/* Blacklist Check */}
                        <div className="p-5 rounded-xl bg-slate-800/50">
                          <h4 className="text-white font-medium mb-3">Blacklist Sources Checked</h4>
                          <div className="flex flex-wrap gap-2">
                            {results.blacklists.sources?.map(source => (
                              <div key={source} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/50">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-gray-300 text-sm">{source}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'content' && results.pageAnalysis && (
                      <div className="space-y-4">
                        <h3 className="text-rose-300 font-semibold flex items-center gap-2">
                          <Scan className="w-5 h-5" />
                          Page Content Analysis
                        </h3>
                        <div className="grid md:grid-cols-4 gap-3">
                          {[
                            { label: 'Page Size', value: results.pageAnalysis.htmlSizeKB ? `${results.pageAnalysis.htmlSizeKB} KB` : 'N/A', color: 'cyan' },
                            { label: 'Forms', value: results.pageAnalysis.forms || 0, color: results.pageAnalysis.forms > 0 ? 'amber' : 'emerald' },
                            { label: 'Scripts', value: results.pageAnalysis.scripts || 0, color: 'blue' },
                            { label: 'Iframes', value: results.pageAnalysis.iframes || 0, color: results.pageAnalysis.iframes > 0 ? 'amber' : 'emerald' },
                          ].map((item, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-800/50 text-center">
                              <div className={`text-xl font-bold text-${item.color}-400`}>{item.value}</div>
                              <div className="text-gray-400 text-xs">{item.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid md:grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-slate-800/50">
                            <div className="text-gray-400 text-xs mb-1">Page Title</div>
                            <div className="text-white text-sm">{results.pageAnalysis.title || 'N/A'}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-800/50">
                            <div className="text-gray-400 text-xs mb-1">Password Fields</div>
                            <div className={`text-sm font-bold ${results.pageAnalysis.passwordFields > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {results.pageAnalysis.passwordFields || 0}
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-800/50">
                            <div className="text-gray-400 text-xs mb-1">External Links</div>
                            <div className="text-cyan-400 text-sm font-bold">{results.pageAnalysis.externalLinks || 0}</div>
                          </div>
                        </div>
                        {results.pageAnalysis.suspiciousIndicators?.length > 0 && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <h4 className="text-red-400 font-medium text-sm mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> Suspicious Indicators
                            </h4>
                            <div className="space-y-1">
                              {results.pageAnalysis.suspiciousIndicators.map((ind, i) => (
                                <div key={i} className="text-red-300 text-xs flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  {ind}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {results.pageAnalysis.description && (
                          <div className="p-3 rounded-xl bg-slate-800/50">
                            <div className="text-gray-400 text-xs mb-1">Meta Description</div>
                            <div className="text-gray-300 text-sm">{results.pageAnalysis.description}</div>
                          </div>
                        )}
                        {results.threats?.threatFox && results.threats.threatFox.length > 0 && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <h4 className="text-red-400 font-medium text-sm mb-2">ThreatFox IOC Matches</h4>
                            {results.threats.threatFox.map((t, i) => (
                              <div key={i} className="text-xs text-red-300 p-2 bg-red-500/5 rounded mb-1">
                                <span className="font-bold">{t.malware || 'Unknown'}</span> — {t.iocType || 'IOC'} | Confidence: {t.confidence || 'N/A'}%
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'ssl' && (
                      <div className="space-y-4">
                        <h3 className="text-rose-300 font-semibold flex items-center gap-2">
                          <Lock className="w-5 h-5" />
                          SSL/TLS Certificate
                        </h3>
                        <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                              <Lock className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-xl font-bold text-emerald-400">Valid Certificate</div>
                              <div className="text-gray-400">Grade: {results.ssl.grade}</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            { label: 'Issuer', value: results.ssl.issuer },
                            { label: 'Protocol', value: results.ssl.protocol },
                            { label: 'Expires', value: results.ssl.expires },
                            { label: 'Grade', value: results.ssl.grade },
                          ].map(item => (
                            <div key={item.label} className="p-4 rounded-xl bg-slate-800/50">
                              <div className="text-gray-400 text-sm mb-1">{item.label}</div>
                              <div className="text-white font-medium">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'server' && (
                      <div className="space-y-4">
                        <h3 className="text-rose-300 font-semibold flex items-center gap-2">
                          <Server className="w-5 h-5" />
                          Server Information
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {Object.entries(results.server || {}).map(([key, value], i) => (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="p-4 rounded-xl bg-slate-800/50 flex justify-between"
                            >
                              <span className="text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-white font-medium">{value}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'headers' && (
                      <div className="space-y-4">
                        <h3 className="text-rose-300 font-semibold flex items-center gap-2">
                          <FileWarning className="w-5 h-5" />
                          Security Headers
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(results.headers || {}).map(([key, value], i) => (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="p-4 rounded-xl bg-slate-800/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-rose-300 font-mono text-sm">{key}</span>
                                <button onClick={() => navigator.clipboard.writeText(value)} className="p-1 rounded hover:bg-white/10">
                                  <Copy className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                              <code className="text-gray-300 text-sm break-all">{value}</code>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'enrichment' && (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-rose-300 font-semibold flex items-center gap-2">
                            <QrCode className="w-5 h-5" />
                            URL Enrichment
                          </h3>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleEnrich}
                            disabled={isEnriching}
                            className="px-4 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2 disabled:opacity-50"
                          >
                            {isEnriching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            {isEnriching ? 'Loading...' : 'Load Enrichment'}
                          </motion.button>
                        </div>

                        {enrichment && (
                          <div className="space-y-4">
                            {/* OpenPhish */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-rose-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-rose-400" />
                                OpenPhish Feed
                              </h4>
                              {enrichment.openphish ? (
                                <div>
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm mb-2 ${
                                    enrichment.openphish.found ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                    {enrichment.openphish.found ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    {enrichment.openphish.found ? 'URL found in OpenPhish feed' : 'Not found in OpenPhish feed'}
                                  </div>
                                  {enrichment.openphish.matchCount > 0 && (
                                    <div className="text-xs text-gray-400 mt-1">
                                      {enrichment.openphish.matchCount} match(es)
                                    </div>
                                  )}
                                  {enrichment.openphish.samples?.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {enrichment.openphish.samples.map((s, i) => (
                                        <div key={i} className="text-xs text-gray-300 font-mono truncate">{s}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Feed not available</div>
                              )}
                            </div>

                            {/* PhishTank */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-rose-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Skull className="w-4 h-4 text-orange-400" />
                                PhishTank
                              </h4>
                              {enrichment.phishtank ? (
                                <div>
                                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm mb-2 ${
                                    enrichment.phishtank.found ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                    {enrichment.phishtank.found ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                    {enrichment.phishtank.found ? 'Listed on PhishTank' : 'Not found on PhishTank'}
                                  </div>
                                  {enrichment.phishtank.matches?.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {enrichment.phishtank.matches.map((m, i) => (
                                        <div key={i} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                                          <div className="text-red-300">Target: {m.target || 'N/A'}</div>
                                          <div className="text-gray-400">Verified: {m.verified ? 'Yes' : 'No'} | {m.verifiedAt || ''}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Feed not available</div>
                              )}
                            </div>

                            {/* QR Code Detection */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-rose-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-cyan-400" />
                                QR Code Detection
                              </h4>
                              <div className="flex items-center gap-4 mb-3">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handleQRUpload}
                                  className="hidden"
                                />
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => fileInputRef.current?.click()}
                                  className="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-gray-300 text-sm flex items-center gap-2"
                                >
                                  <Upload className="w-4 h-4" />
                                  {qrImage ? qrImage.name : 'Upload Image for QR Scan'}
                                </motion.button>
                                {qrImage && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleEnrich}
                                    disabled={isEnriching}
                                    className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm flex items-center gap-2"
                                  >
                                    <Camera className="w-4 h-4" />
                                    Detect QR
                                  </motion.button>
                                )}
                              </div>
                              {enrichment.qrDetection && (
                                <div>
                                  {enrichment.qrDetection.available === false && (
                                    <div className="text-xs text-amber-400">QR detection: pyzbar not available on server</div>
                                  )}
                                  {enrichment.qrDetection.found && enrichment.qrDetection.codes?.length > 0 && (
                                    <div className="space-y-2">
                                      {enrichment.qrDetection.codes.map((code, i) => (
                                        <div key={i} className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                          <div className="text-xs text-cyan-300 font-mono break-all">{code.data}</div>
                                          <div className="text-[10px] text-gray-500 mt-1">Type: {code.type}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {enrichment.qrDetection.found === false && enrichment.qrDetection.available !== false && (
                                    <div className="text-xs text-gray-400">No QR codes detected in image</div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Wayback HTML Diff */}
                            <div className="p-4 rounded-xl bg-slate-800/50 border border-rose-500/20">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <Diff className="w-4 h-4 text-blue-400" />
                                Wayback Machine HTML Diff
                              </h4>
                              {enrichment.waybackDiff?.available ? (
                                <div>
                                  <div className="grid grid-cols-3 gap-3 mb-3">
                                    <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                                      <div className="text-lg font-bold text-blue-400">{enrichment.waybackDiff.totalChanges}</div>
                                      <div className="text-[10px] text-gray-500">Total Changes</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                                      <div className="text-lg font-bold text-emerald-400">{enrichment.waybackDiff.linesAdded}</div>
                                      <div className="text-[10px] text-gray-500">Lines Added</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-900/50 text-center">
                                      <div className="text-lg font-bold text-red-400">{enrichment.waybackDiff.linesRemoved}</div>
                                      <div className="text-[10px] text-gray-500">Lines Removed</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-400 mb-2">
                                    Change: {enrichment.waybackDiff.changePercent}% of page changed
                                  </div>
                                  {enrichment.waybackDiff.snapshotUrl && (
                                    <a
                                      href={enrichment.waybackDiff.snapshotUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 mb-3"
                                    >
                                      <ExternalLink className="w-3 h-3" /> View archived snapshot
                                    </a>
                                  )}
                                  {enrichment.waybackDiff.diffPreview?.length > 0 && (
                                    <div className="max-h-48 overflow-y-auto bg-slate-900/80 rounded-lg p-3 font-mono text-[10px] leading-relaxed">
                                      {enrichment.waybackDiff.diffPreview.map((line, i) => (
                                        <div key={i} className={`${
                                          line.startsWith('+') ? 'text-emerald-400' :
                                          line.startsWith('-') ? 'text-red-400' :
                                          line.startsWith('@@') ? 'text-cyan-400' : 'text-gray-500'
                                        }`}>{line}</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">
                                  {enrichment.waybackDiff === null ? 'Load enrichment to check' : 'No archived snapshot available for comparison'}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {!enrichment && !isEnriching && (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            Click "Load Enrichment" to fetch OpenPhish, PhishTank, and Wayback data
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !isScanning && (
            <div className="text-center py-20">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Target className="w-24 h-24 text-rose-500/30 mx-auto mb-6" />
              </motion.div>
              <h3 className="text-2xl text-gray-400 mb-3">Enter a URL to scan</h3>
              <p className="text-gray-500">Check for malware, phishing, and security issues</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default URLScannerTool;
