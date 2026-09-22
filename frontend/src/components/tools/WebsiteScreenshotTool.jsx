import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, X, Search, Globe, Shield, Clock, Activity, Link2,
  AlertTriangle, CheckCircle, Server, Wifi, Lock, Eye, Target, Copy,
  ChevronDown, ChevronUp, ExternalLink, Image, FileText, Tag, Code, BookOpen
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useSearchHistory } from '../../context/SearchHistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { useToolResult } from '../../context/ToolResultContext';

const InfoRow = ({ label, value, mono }) => {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0 group">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-white text-sm flex items-center gap-1 ${mono ? 'font-mono' : ''}`}>
        {typeof value === 'boolean' ? (value ? '✓' : '✗') : String(value)}
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

const WebsiteScreenshotTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { addSearch, getToolHistory } = useSearchHistory();
  const { copy } = useClipboard();

  const [url, setUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [results, setResults] = useState(null);
  const [screenshotError, setScreenshotError] = useState(false);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => { setScreenshotError(false); }, [results]);
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Website Screenshot', query: url });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);
  const [activeTab, setActiveTab] = useState('preview');

  const recentSearches = getToolHistory('screenshot');

  const handleRefresh = () => { setUrl(''); setResults(null); toast.info('Ready for new search'); };

  const handleCapture = async () => {
    if (!url.trim()) { toast.error('Please enter a URL'); return; }
    trackToolUsage('screenshot', 'capture', 'start');
    setIsCapturing(true); onConsume?.(8);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/tools/screenshot/capture`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.error || 'Screenshot capture failed'); }
      const data = await response.json();
      setResults(data);
      addToHistory('screenshot', url, data);
      addSearch('screenshot', url, data);
      trackToolUsage('screenshot', 'capture', 'success');
      toast.success('Page data captured');
    } catch (err) {
      toast.error(err.message || 'Capture failed');
      trackToolUsage('screenshot', 'capture', 'error');
    } finally { setIsCapturing(false); }
  };

  const tabs = [
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'metadata', label: 'Metadata', icon: FileText },
    { id: 'page', label: 'Page Analysis', icon: Code },
  ];

  const r = results;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{scale:0.92,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.92,y:20,opacity:0}}
        transition={{type:'spring',damping:22}} onClick={e=>e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/10 to-slate-950 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10">

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-6 py-4 border-b border-cyan-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30" style={{background:'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Website Screenshot
                </h2>
                <p className="text-xs text-cyan-300/70 flex items-center gap-1.5 mt-0.5">
                  <Camera className="w-3.5 h-3.5" /> Page preview & metadata extraction
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button whileHover={{scale:1.05}} onClick={handleRefresh} className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 transition-all">
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] custom-scrollbar">

          {!r ? (
            <div className="max-w-3xl mx-auto">
              <div className="grid lg:grid-cols-5 gap-6 mb-6">
                <div className="lg:col-span-2 flex items-center justify-center">
                  <RadarScan active={isCapturing} />
                </div>
                <div className="lg:col-span-3 p-5 rounded-xl bg-slate-900/60 border border-cyan-500/20">
                  <label className="text-cyan-400 text-sm font-medium mb-3 flex items-center gap-2"><Globe className="w-4 h-4" /> Website URL</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-500" />
                      <input type="text" value={url} onChange={e=>setUrl(e.target.value)} placeholder="e.g. https://example.com"
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-cyan-500/30 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 text-white text-lg font-mono placeholder-slate-500 outline-none transition-all"
                        onKeyDown={e=>e.key==='Enter'&&handleCapture()} />
                    </div>
                    <motion.button whileHover={{scale:1.03,boxShadow:'0 0 40px rgba(34,211,238,0.4)'}} whileTap={{scale:0.97}}
                      onClick={handleCapture} disabled={isCapturing||!url.trim()}
                      className="px-8 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-500/30"
                      style={{background:'linear-gradient(135deg,#06b6d4,#3b82f6)'}}>
                      {isCapturing ? (<><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}><Camera className="w-5 h-5" /></motion.div><span>Capturing...</span></>) : (<><Search className="w-5 h-5" /><span>Capture</span></>)}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                <div className="flex items-center gap-4">
                  {r.favicon && <img src={r.favicon} alt="" className="w-8 h-8 rounded" onError={e=>e.target.style.display='none'} />}
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-bold text-white truncate">{r.title || 'No title'}</div>
                    <div className="text-sm text-cyan-400 truncate">{r.url}</div>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg">{r.statusCode}</div>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab=>(
                  <motion.button key={tab.id} whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all text-sm ${activeTab===tab.id ? 'text-white shadow-lg shadow-cyan-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-cyan-500/20'}`}
                    style={activeTab===tab.id ? {background:'linear-gradient(135deg,#06b6d4,#3b82f6)'} : {}}>
                    <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>

                  {activeTab === 'preview' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Screenshot Preview" icon={Image} color="cyan" defaultOpen={true}>
                        <div className="rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
                          {r.microlink?.screenshotUrl && !screenshotError ? (
                            <img src={r.microlink.screenshotUrl} alt="Screenshot" className="w-full object-cover" onError={() => setScreenshotError(true)} />
                          ) : (
                            <div className="p-8 text-center text-slate-500">
                              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Screenshot unavailable</p>
                            </div>
                          )}
                        </div>
                        {r.microlink?.logoUrl && (
                          <div className="mt-2 flex items-center gap-2">
                            <img src={r.microlink.logoUrl} alt="Logo" className="w-6 h-6 rounded" onError={e=>e.target.style.display='none'} />
                            <span className="text-xs text-slate-400">Site logo</span>
                          </div>
                        )}
                      </SectionCard>

                      <SectionCard title="Page Summary" icon={BookOpen} color="emerald">
                        <InfoRow label="Title" value={r.title} />
                        <InfoRow label="Description" value={r.description?.substring(0, 200)} />
                        <InfoRow label="Domain" value={r.domain} />
                        <InfoRow label="Final URL" value={r.finalUrl} />
                        <InfoRow label="Status Code" value={r.statusCode} />
                        <InfoRow label="Content Type" value={r.contentType} />
                        <InfoRow label="Content Size" value={r.contentLength ? `${(r.contentLength / 1024).toFixed(1)} KB` : null} />
                        <InfoRow label="Language" value={r.language} />
                        <InfoRow label="Server" value={r.server} />
                        <InfoRow label="Powered By" value={r.poweredBy} />
                      </SectionCard>

                      <SectionCard title="Open Graph Tags" icon={Tag} color="purple">
                        <InfoRow label="og:title" value={r.title && r.ogTagsFound > 0 ? r.title : null} />
                        <InfoRow label="og:description" value={r.ogTagsFound > 0 ? r.description : null} />
                        <InfoRow label="og:image" value={r.ogImage} />
                        <InfoRow label="og:url" value={r.ogUrl} />
                        <InfoRow label="og:type" value={r.ogType} />
                        <InfoRow label="og:site_name" value={r.ogSiteName} />
                        <InfoRow label="OG Tags Found" value={r.ogTagsFound} />
                        <InfoRow label="Twitter Card" value={r.twitterCard} />
                        <InfoRow label="Twitter Site" value={r.twitterSite} />
                      </SectionCard>

                      <SectionCard title="Canonical & Identity" icon={Link2} color="blue">
                        <InfoRow label="Canonical URL" value={r.canonical} />
                        <InfoRow label="Favicon" value={r.favicon} />
                        <InfoRow label="Author" value={r.author} />
                        <InfoRow label="Keywords" value={r.keywords} />
                        <InfoRow label="Robots" value={r.robots} />
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'metadata' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Technical Details" icon={FileText} color="cyan">
                        <InfoRow label="URL" value={r.url} />
                        <InfoRow label="Final URL" value={r.finalUrl} />
                        <InfoRow label="Domain" value={r.domain} />
                        <InfoRow label="Status Code" value={r.statusCode} />
                        <InfoRow label="Content Type" value={r.contentType} />
                        <InfoRow label="Content Size" value={r.contentLength ? `${(r.contentLength / 1024).toFixed(1)} KB` : null} />
                        <InfoRow label="Language" value={r.language} />
                      </SectionCard>

                      <SectionCard title="Server Headers" icon={Server} color="purple">
                        <InfoRow label="Server" value={r.server} />
                        <InfoRow label="X-Powered-By" value={r.poweredBy} />
                      </SectionCard>

                      {r.microlink && (
                        <SectionCard title="Microlink Enrichment" icon={ExternalLink} color="emerald">
                          <InfoRow label="Publisher" value={r.microlink?.publisher} />
                          <InfoRow label="Author" value={r.microlink?.author} />
                          <InfoRow label="Date" value={r.microlink?.date} />
                          <InfoRow label="Language" value={r.microlink?.lang} />
                          <InfoRow label="AMP URL" value={r.microlink?.ampUrl} />
                          <InfoRow label="Video URL" value={r.microlink?.videoUrl} />
                        </SectionCard>
                      )}
                    </div>
                  )}

                  {activeTab === 'page' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Page Structure" icon={Code} color="blue">
                        <InfoRow label="Scripts" value={r.scripts} />
                        <InfoRow label="External Scripts" value={r.externalScriptsCount} />
                        <InfoRow label="Stylesheets" value={r.stylesheets} />
                        <InfoRow label="Images" value={r.images} />
                        <InfoRow label="Links" value={r.links} />
                        <InfoRow label="Has Forms" value={r.hasForms} />
                        <InfoRow label="Has Iframes" value={r.hasIframe} />
                        <InfoRow label="Has Password Field" value={r.hasPasswordField} />
                      </SectionCard>

                      {r.externalScripts?.length > 0 && (
                        <SectionCard title="External Scripts" icon={Code} color="amber">
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {r.externalScripts.map((s, i) => (
                              <div key={i} className="p-1.5 rounded bg-slate-800/50 text-xs text-cyan-300 font-mono truncate">{s}</div>
                            ))}
                          </div>
                        </SectionCard>
                      )}
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

export default WebsiteScreenshotTool;
