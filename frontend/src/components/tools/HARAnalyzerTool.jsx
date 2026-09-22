import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, X, Search, Globe, Shield, Clock, Activity, Upload,
  AlertTriangle, CheckCircle, Server, Wifi, Lock, Eye, Target, Copy,
  ChevronDown, ChevronUp, ExternalLink, Download, BarChart3, Bug, Sliders, List, TrendingUp, Zap, Radio
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useSearchHistory } from '../../context/SearchHistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { useToolResult } from '../../context/ToolResultContext';

const InfoRow = ({ label, value, mono }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0 group">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-white text-sm flex items-center gap-1 ${mono ? 'font-mono' : ''}`}>
        {String(value)}
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

const HARAnalyzerTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { addSearch, getToolHistory } = useSearchHistory();
  const { copy } = useClipboard();

  const [harContent, setHarContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'H A R Analyzer', query: '' });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('summary');
  const [activeRequestTab, setActiveRequestTab] = useState('all');
  const fileInputRef = useRef(null);

  const recentSearches = getToolHistory('har-analyzer');

  const handleRefresh = () => { setHarContent(null); setFileName(''); setResults(null); toast.info('Ready for new analysis'); };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setHarContent(json);
        toast.success(`Loaded ${file.name}`);
      } catch {
        toast.error('Invalid HAR file — must be valid JSON');
      }
    };
    reader.readAsText(file);
  };

  const handlePasteHar = (e) => {
    try {
      const json = JSON.parse(e.target.value);
      setHarContent(json);
      setFileName('pasted-input');
      toast.success('HAR data parsed from input');
    } catch {
      toast.error('Invalid JSON input');
    }
  };

  const handleAnalyze = async () => {
    if (!harContent) { toast.error('Please upload or paste a HAR file first'); return; }
    trackToolUsage('har-analyzer', 'analyze', 'start');
    setIsAnalyzing(true); onConsume?.(15);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/tools/har/analyze`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ har: harContent }),
      });
      if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.error || 'HAR analysis failed'); }
      const data = await response.json();
      setResults(data);
      addToHistory('har-analyzer', fileName, data);
      addSearch('har-analyzer', fileName, data);
      trackToolUsage('har-analyzer', 'analyze', 'success');
      toast.success(`Analysis complete — ${data.totalEntries} requests`);
    } catch (err) {
      toast.error(err.message || 'HAR analysis failed');
      trackToolUsage('har-analyzer', 'analyze', 'error');
    } finally { setIsAnalyzing(false); }
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'requests', label: 'Requests', icon: List },
    { id: 'security', label: 'Security Audit', icon: Shield },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
  ];

  const r = results;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{scale:0.92,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.92,y:20,opacity:0}}
        transition={{type:'spring',damping:22}} onClick={e=>e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/10 to-slate-950 border border-emerald-500/30 shadow-2xl shadow-emerald-500/10">

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-6 py-4 border-b border-emerald-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30" style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  HAR Analyzer
                </h2>
                <p className="text-xs text-emerald-300/70 flex items-center gap-1.5 mt-0.5">
                  <Radio className="w-3.5 h-3.5" /> HTTP Archive performance & security audit
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button whileHover={{scale:1.05}} onClick={handleRefresh} className="p-2 rounded-lg bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all">
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] custom-scrollbar">

          {!r ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-6 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                <label className="text-emerald-400 text-sm font-medium mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload HAR File</label>
                <div className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-400/50 transition-all cursor-pointer" onClick={()=>fileInputRef.current?.click()}>
                  <Upload className="w-12 h-12 text-emerald-400" />
                  <p className="text-slate-400 text-sm">{fileName || 'Click to select a .har file'}</p>
                  <input ref={fileInputRef} type="file" accept=".har,.json" onChange={handleFileUpload} className="hidden" />
                </div>
              </div>

              <div className="p-6 rounded-xl bg-slate-900/60 border border-emerald-500/20">
                <label className="text-emerald-400 text-sm font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Or paste HAR JSON</label>
                <textarea rows={6} onChange={handlePasteHar} placeholder='{"log":{"entries":[...]}}'
                  className="w-full p-4 rounded-xl bg-slate-800/80 border-2 border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-white text-sm font-mono placeholder-slate-500 outline-none transition-all resize-none" />
              </div>

              <motion.button whileHover={{scale:1.03,boxShadow:'0 0 40px rgba(16,185,129,0.4)'}} whileTap={{scale:0.97}}
                onClick={handleAnalyze} disabled={isAnalyzing||!harContent}
                className="w-full px-8 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/30"
                style={{background:'linear-gradient(135deg,#10b981,#059669)'}}>
                {isAnalyzing ? (<><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}><Radio className="w-5 h-5" /></motion.div><span>Analyzing...</span></>) : (<><Zap className="w-5 h-5" /><span>Analyze HAR</span></>)}
              </motion.button>
            </div>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-3xl font-bold text-white">{r.totalEntries}</div>
                  <div className="text-sm text-slate-400">requests • {r.summary?.totalSizeFormatted} • {r.summary?.totalTimeFormatted}</div>
                  <div className="ml-auto flex gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.summary?.successRate > 90 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{r.summary?.successRate}% success</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${r.securityScore > 70 ? 'bg-emerald-500/20 text-emerald-400' : r.securityScore > 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>Security: {r.securityScore}/100</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab=>(
                  <motion.button key={tab.id} whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all text-sm ${activeTab===tab.id ? 'text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-emerald-500/20'}`}
                    style={activeTab===tab.id ? {background:'linear-gradient(135deg,#10b981,#059669)'} : {}}>
                    <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>

                  {activeTab === 'summary' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Overview" icon={BarChart3} color="emerald">
                        <InfoRow label="Total Requests" value={r.totalEntries} />
                        <InfoRow label="Total Pages" value={r.totalPages} />
                        <InfoRow label="Total Size" value={r.summary?.totalSizeFormatted} />
                        <InfoRow label="Total Load Time" value={r.summary?.totalTimeFormatted} />
                        <InfoRow label="Failed Requests" value={r.summary?.failedRequests} />
                        <InfoRow label="Success Rate" value={`${r.summary?.successRate}%`} />
                        <InfoRow label="Avg Request Time" value={`${r.averageRequestTime}ms`} />
                        <InfoRow label="Requests/sec" value={r.requestsPerSecond} />
                        <InfoRow label="Bandwidth" value={`${r.bandwidthKBps} KB/s`} />
                      </SectionCard>

                      <SectionCard title="Content Types" icon={Globe} color="blue">
                        {Object.entries(r.contentTypes || {}).map(([type, count]) => (
                          <div key={type} className="flex justify-between py-1 border-b border-slate-800/30 last:border-0">
                            <span className="text-slate-400 text-sm">{type}</span>
                            <span className="text-white text-sm">{count}</span>
                          </div>
                        ))}
                      </SectionCard>

                      <SectionCard title="Methods" icon={Server} color="purple">
                        {Object.entries(r.methods || {}).map(([method, count]) => (
                          <div key={method} className="flex justify-between py-1 border-b border-slate-800/30 last:border-0">
                            <span className="text-slate-400 text-sm font-mono">{method}</span>
                            <span className="text-white text-sm">{count}</span>
                          </div>
                        ))}
                      </SectionCard>

                      <SectionCard title="Status Codes" icon={Activity} color="amber">
                        {Object.entries(r.statusCodes || {}).map(([code, count]) => (
                          <div key={code} className="flex justify-between py-1 border-b border-slate-800/30 last:border-0">
                            <span className={`text-sm ${code.startsWith('2') ? 'text-emerald-400' : code.startsWith('3') ? 'text-blue-400' : code.startsWith('4') ? 'text-amber-400' : code.startsWith('5') ? 'text-red-400' : 'text-slate-400'}`}>{code}</span>
                            <span className="text-white text-sm">{count}</span>
                          </div>
                        ))}
                      </SectionCard>

                      {r.thirdPartyCount > 0 && (
                        <SectionCard title={`Third-Party Domains (${r.thirdPartyCount})`} icon={Globe} color="red">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {r.thirdPartyDomains?.map((d, i) => (
                              <div key={i} className="p-1.5 rounded bg-slate-800/50 text-xs text-slate-300 font-mono">{d}</div>
                            ))}
                          </div>
                        </SectionCard>
                      )}

                      <SectionCard title="Top Domains" icon={Globe} color="cyan">
                        {Object.entries(r.domains || {}).slice(0, 10).map(([domain, count]) => (
                          <div key={domain} className="flex justify-between py-1 border-b border-slate-800/30 last:border-0">
                            <span className="text-slate-400 text-sm font-mono truncate">{domain}</span>
                            <span className="text-white text-sm">{count}</span>
                          </div>
                        ))}
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'requests' && (
                    <div className="space-y-4">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {['all', 'slowest', 'largest'].map(t => (
                          <button key={t} onClick={()=>setActiveRequestTab(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeRequestTab===t ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-transparent'}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                        ))}
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-slate-800/80 text-slate-400">
                            <th className="p-2 text-left">Method</th>
                            <th className="p-2 text-left">Status</th>
                            <th className="p-2 text-left w-full">URL</th>
                            <th className="p-2 text-right">Time</th>
                            <th className="p-2 text-right">Size</th>
                          </tr></thead>
                          <tbody>
                            {(activeRequestTab === 'slowest' ? r.slowestRequests : activeRequestTab === 'largest' ? r.largestRequests : r.requests || []).slice(0, 50).map((req, i) => (
                              <tr key={i} className="border-t border-slate-800/50 hover:bg-slate-800/30">
                                <td className="p-2 font-mono text-cyan-400 whitespace-nowrap">{req.method}</td>
                                <td className={`p-2 font-mono whitespace-nowrap ${req.status < 300 ? 'text-emerald-400' : req.status < 400 ? 'text-blue-400' : 'text-red-400'}`}>{req.status}</td>
                                <td className="p-2 text-slate-300 truncate max-w-md font-mono" title={req.url}>{req.url?.substring(0, 80)}...</td>
                                <td className="p-2 text-right text-slate-300 font-mono whitespace-nowrap">{req.time?.toFixed?.(0) || req.time}ms</td>
                                <td className="p-2 text-right text-slate-300 font-mono whitespace-nowrap">{req.size ? `${(req.size / 1024).toFixed(1)}KB` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {r.requests?.length > 50 && <div className="p-2 text-center text-xs text-slate-500">Showing 50 of {r.requests.length} requests</div>}
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Security Score" icon={Shield} color={r.securityScore > 70 ? 'emerald' : r.securityScore > 40 ? 'amber' : 'red'}>
                        <div className="text-center py-4">
                          <div className={`text-5xl font-bold ${r.securityScore > 70 ? 'text-emerald-400' : r.securityScore > 40 ? 'text-amber-400' : 'text-red-400'}`}>{r.securityScore}</div>
                          <div className="text-sm text-slate-400 mt-1">/ 100</div>
                        </div>
                      </SectionCard>

                      <SectionCard title="Security Issues" icon={AlertTriangle} color="red" defaultOpen={true}>
                        {r.securityIssues?.length > 0 ? r.securityIssues.map((issue, i) => (
                          <div key={i} className={`p-2 rounded-lg mb-1 ${issue.severity === 'high' ? 'bg-red-500/10 border border-red-500/30' : issue.severity === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                            <span className={`text-xs font-bold uppercase ${issue.severity === 'high' ? 'text-red-400' : issue.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'}`}>{issue.severity}</span>
                            <p className="text-xs text-slate-300 mt-0.5">{issue.detail}</p>
                          </div>
                        )) : <p className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> No security issues detected</p>}
                      </SectionCard>

                      <SectionCard title="Insecure Requests" icon={Lock} color="red" defaultOpen={false}>
                        {r.insecureCount > 0 ? (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {r.insecureRequests?.map((req, i) => (
                              <div key={i} className="p-1.5 rounded bg-red-500/10 text-xs text-slate-300 font-mono truncate">{req.method} {req.url?.substring(0, 100)}</div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-emerald-400">All requests use HTTPS</p>}
                      </SectionCard>

                      <SectionCard title="Cookie Analysis" icon={Lock} color="amber" defaultOpen={false}>
                        <InfoRow label="Total Cookies" value={r.cookieCount} />
                        {r.cookies?.slice(0, 20).map((c, i) => (
                          <div key={i} className="p-1.5 rounded bg-slate-800/50 text-xs mb-1">
                            <span className="text-cyan-300">{c.name}</span>
                            {!c.secure && <span className="text-red-400 ml-1">[!Secure]</span>}
                            {!c.httpOnly && <span className="text-amber-400 ml-1">[!HttpOnly]</span>}
                          </div>
                        ))}
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'performance' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Performance Issues" icon={AlertTriangle} color="amber">
                        {r.performanceIssues?.length > 0 ? r.performanceIssues.map((issue, i) => (
                          <div key={i} className={`p-2 rounded-lg mb-1 ${issue.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                            <span className={`text-xs font-bold uppercase ${issue.severity === 'warning' ? 'text-amber-400' : 'text-blue-400'}`}>{issue.severity}</span>
                            <p className="text-xs text-slate-300 mt-0.5">{issue.detail}</p>
                          </div>
                        )) : <p className="text-sm text-emerald-400">No performance issues</p>}
                      </SectionCard>

                      <SectionCard title="Key Metrics" icon={TrendingUp} color="emerald">
                        <InfoRow label="Total Load Time" value={r.summary?.totalTimeFormatted} />
                        <InfoRow label="Average Request" value={`${r.averageRequestTime}ms`} />
                        <InfoRow label="Requests/sec" value={r.requestsPerSecond} />
                        <InfoRow label="Page Size" value={r.summary?.totalSizeFormatted} />
                        <InfoRow label="Bandwidth" value={`${r.bandwidthKBps} KB/s`} />
                      </SectionCard>

                      <SectionCard title="Slowest Requests" icon={Clock} color="red" defaultOpen={false}>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {r.slowestRequests?.slice(0, 10).map((req, i) => (
                            <div key={i} className="flex justify-between p-1.5 rounded bg-slate-800/50 text-xs">
                              <span className="text-slate-300 truncate mr-2">{req.url?.substring(0, 60)}</span>
                              <span className="text-red-400 font-mono whitespace-nowrap">{req.time}ms</span>
                            </div>
                          ))}
                        </div>
                      </SectionCard>

                      <SectionCard title="Largest Requests" icon={Download} color="blue" defaultOpen={false}>
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {r.largestRequests?.slice(0, 10).map((req, i) => (
                            <div key={i} className="flex justify-between p-1.5 rounded bg-slate-800/50 text-xs">
                              <span className="text-slate-300 truncate mr-2">{req.url?.substring(0, 60)}</span>
                              <span className="text-blue-400 font-mono whitespace-nowrap">{req.size ? `${(req.size / 1024).toFixed(1)}KB` : '-'}</span>
                            </div>
                          ))}
                        </div>
                      </SectionCard>

                      <SectionCard title="Request Timing Breakdown" icon={Sliders} color="purple">
                        <InfoRow label="Total DNS Lookup" value={r.timings?.length ? `${r.timings.reduce((s, t) => s + (t.dns || 0), 0).toFixed(0)}ms` : null} />
                        <InfoRow label="Total Connect" value={r.timings?.length ? `${r.timings.reduce((s, t) => s + (t.connect || 0), 0).toFixed(0)}ms` : null} />
                        <InfoRow label="Total SSL" value={r.timings?.length ? `${r.timings.reduce((s, t) => s + (t.ssl || 0), 0).toFixed(0)}ms` : null} />
                        <InfoRow label="Total Wait (TTFB)" value={r.timings?.length ? `${r.timings.reduce((s, t) => s + (t.wait || 0), 0).toFixed(0)}ms` : null} />
                        <InfoRow label="Total Receive" value={r.timings?.length ? `${r.timings.reduce((s, t) => s + (t.receive || 0), 0).toFixed(0)}ms` : null} />
                      </SectionCard>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default HARAnalyzerTool;
