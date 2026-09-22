import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, X, Search, Globe, Shield, Clock, Activity, Upload,
  AlertTriangle, CheckCircle, Server, Wifi, Lock, Eye, Target, Copy,
  ChevronDown, ChevronUp, ExternalLink, Download, File, MapPin, Image, Table, BookOpen, Terminal, Radio
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

const DocumentMetadataTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { addSearch, getToolHistory } = useSearchHistory();
  const { copy } = useClipboard();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Document Metadata', query: '' });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('metadata');
  const fileInputRef = useRef(null);

  const recentSearches = getToolHistory('doc-metadata');

  const handleRefresh = () => { setSelectedFile(null); setResults(null); toast.info('Ready for new analysis'); };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['pdf', 'docx', 'pptx', 'xlsx'];
    if (!allowed.includes(ext)) { toast.error('Supported formats: PDF, DOCX, PPTX, XLSX'); return; }
    setSelectedFile(file);
    toast.success(`Selected: ${file.name}`);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) { toast.error('Please select a file first'); return; }
    trackToolUsage('doc-metadata', 'extract', 'start');
    setIsAnalyzing(true); onConsume?.(10);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      const response = await fetch(`${API_BASE}/tools/doc/metadata`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, fileName: selectedFile.name }),
      });
      if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.error || 'Metadata extraction failed'); }
      const data = await response.json();
      setResults(data);
      addToHistory('doc-metadata', selectedFile.name, data);
      addSearch('doc-metadata', selectedFile.name, data);
      trackToolUsage('doc-metadata', 'extract', 'success');
      toast.success('Metadata extracted');
    } catch (err) {
      toast.error(err.message || 'Extraction failed');
      trackToolUsage('doc-metadata', 'extract', 'error');
    } finally { setIsAnalyzing(false); }
  };

  const tabs = [
    { id: 'metadata', label: 'Metadata', icon: FileText },
    { id: 'ole', label: 'OLE Analysis', icon: Shield },
    { id: 'gps', label: 'GPS', icon: MapPin },
    { id: 'content', label: 'Content', icon: BookOpen },
  ];

  const m = results?.metadata;
  const r = results;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{scale:0.92,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.92,y:20,opacity:0}}
        transition={{type:'spring',damping:22}} onClick={e=>e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950/10 to-slate-950 border border-violet-500/30 shadow-2xl shadow-violet-500/10">

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-6 py-4 border-b border-violet-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30" style={{background:'linear-gradient(135deg,#a855f7,#8b5cf6)'}}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Document Metadata
                </h2>
                <p className="text-xs text-violet-300/70 flex items-center gap-1.5 mt-0.5">
                  <Radio className="w-3.5 h-3.5" /> PDF, DOCX, PPTX, XLSX forensic analysis
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button whileHover={{scale:1.05}} onClick={handleRefresh} className="p-2 rounded-lg bg-white/5 hover:bg-violet-500/20 border border-white/10 hover:border-violet-500/30 transition-all">
                <X className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] custom-scrollbar">

          {!r ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="p-6 rounded-xl bg-slate-900/60 border border-violet-500/20">
                <label className="text-violet-400 text-sm font-medium mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Document</label>
                <div className="flex flex-col items-center gap-4 p-8 rounded-xl border-2 border-dashed border-violet-500/30 hover:border-violet-400/50 transition-all cursor-pointer" onClick={()=>fileInputRef.current?.click()}>
                  <Upload className="w-12 h-12 text-violet-400" />
                  <p className="text-slate-400 text-sm">{selectedFile ? selectedFile.name : 'Click to select a file'}</p>
                  <p className="text-xs text-slate-500">PDF, DOCX, PPTX, XLSX supported</p>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.pptx,.xlsx" onChange={handleFileSelect} className="hidden" />
                </div>
              </div>

              <motion.button whileHover={{scale:1.03,boxShadow:'0 0 40px rgba(168,85,247,0.4)'}} whileTap={{scale:0.97}}
                onClick={handleAnalyze} disabled={isAnalyzing||!selectedFile}
                className="w-full px-8 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/30"
                style={{background:'linear-gradient(135deg,#a855f7,#8b5cf6)'}}>
                {isAnalyzing ? (<><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}><Radio className="w-5 h-5" /></motion.div><span>Extracting...</span></>) : (<><Search className="w-5 h-5" /><span>Extract Metadata</span></>)}
              </motion.button>
            </div>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30">
                <div className="flex items-center gap-4">
                  <File className="w-8 h-8 text-violet-400" />
                  <div>
                    <div className="text-xl font-bold text-white">{r.fileName}</div>
                    <div className="text-sm text-slate-400">{r.detectedFormat || 'Document'} • {r.fileSize ? `${(r.fileSize / 1024).toFixed(1)} KB` : ''}</div>
                  </div>
                  {r.hasGps && <MapPin className="w-6 h-6 text-emerald-400 ml-auto animate-pulse" />}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab=>(
                  <motion.button key={tab.id} whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all text-sm ${activeTab===tab.id ? 'text-white shadow-lg shadow-violet-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-violet-500/20'}`}
                    style={activeTab===tab.id ? {background:'linear-gradient(135deg,#a855f7,#8b5cf6)'} : {}}>
                    <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>

                  {activeTab === 'metadata' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Document Properties" icon={FileText} color="violet">
                        <InfoRow label="Title" value={m?.title} />
                        <InfoRow label="Subject" value={m?.subject} />
                        <InfoRow label="Author" value={m?.author} />
                        <InfoRow label="Manager" value={m?.manager} />
                        <InfoRow label="Company" value={m?.company} />
                        <InfoRow label="Category" value={m?.category} />
                        <InfoRow label="Keywords" value={m?.keywords} />
                        <InfoRow label="Comments" value={m?.comments} />
                        <InfoRow label="Language" value={m?.language} />
                      </SectionCard>

                      <SectionCard title="Change History" icon={Clock} color="amber">
                        <InfoRow label="Created" value={m?.created?.split?.('T')?.[0] || m?.created} />
                        <InfoRow label="Modified" value={m?.modified?.split?.('T')?.[0] || m?.modified} />
                        <InfoRow label="Last Printed" value={m?.lastPrinted?.split?.('T')?.[0] || m?.lastPrinted} />
                        <InfoRow label="Last Modified By" value={m?.lastModifiedBy} />
                        <InfoRow label="Content Status" value={m?.contentStatus} />
                        <InfoRow label="Revision" value={m?.revision} />
                        <InfoRow label="Version" value={m?.version} />
                        <InfoRow label="Identifier" value={m?.identifier} />
                      </SectionCard>

                      <SectionCard title="Structure" icon={Table} color="cyan">
                        {m?.pageCount !== undefined && <InfoRow label="Pages" value={m.pageCount} />}
                        {m?.slideCount !== undefined && <InfoRow label="Slides" value={m.slideCount} />}
                        {m?.paragraphCount !== undefined && <InfoRow label="Paragraphs" value={m.paragraphCount} />}
                        {m?.sectionCount !== undefined && <InfoRow label="Sections" value={m.sectionCount} />}
                        {m?.sheetCount !== undefined && <InfoRow label="Sheets" value={m.sheetCount} />}
                        {m?.wordCount !== undefined && <InfoRow label="Words" value={m.wordCount} />}
                        {m?.charCount !== undefined && <InfoRow label="Characters" value={m.charCount} />}
                        {m?.imageCount !== undefined && <InfoRow label="Images" value={m.imageCount} />}
                        {m?.tableCount !== undefined && <InfoRow label="Tables" value={m.tableCount} />}
                        {m?.shapeCount !== undefined && <InfoRow label="Shapes" value={m.shapeCount} />}
                        {m?.chartCount !== undefined && <InfoRow label="Charts" value={m.chartCount} />}
                        {m?.slidesWithNotes !== undefined && <InfoRow label="Slides w/ Notes" value={m.slidesWithNotes} />}
                        {m?.formFieldCount !== undefined && <InfoRow label="Form Fields" value={m.formFieldCount} />}
                        {m?.sheetNames && <InfoRow label="Sheet Names" value={m.sheetNames?.join(', ')} />}
                      </SectionCard>

                      <SectionCard title="PDF Specific" icon={FileText} color="red">
                        {m?.producer !== undefined && <InfoRow label="Producer" value={m.producer} />}
                        {m?.creator !== undefined && <InfoRow label="Creator" value={m.creator} />}
                        {m?.hasXFA !== undefined && <InfoRow label="Has XFA" value={m.hasXFA} />}
                        {m?.sampleText && <InfoRow label="Sample Text" value={m.sampleText?.substring(0, 200)} />}
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'ole' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Macro Detection" icon={Shield} color={r.hasMacros ? 'red' : 'emerald'}>
                        <div className={`p-3 rounded-lg mb-2 ${r.hasMacros ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
                          <div className="flex items-center gap-2">
                            {r.hasMacros ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle className="w-5 h-5 text-emerald-400" />}
                            <span className={`font-bold ${r.hasMacros ? 'text-red-400' : 'text-emerald-400'}`}>{r.hasMacros ? 'Macros Detected' : 'No Macros Found'}</span>
                          </div>
                        </div>
                        <InfoRow label="Is OLE File" value={r.oleAnalysis?.isOleFile} />
                        <InfoRow label="Has OLE Streams" value={r.oleAnalysis?.hasOleStreams} />
                      </SectionCard>

                      <SectionCard title="Embedded Files" icon={File} color="amber" defaultOpen={true}>
                        {r.embeddedFiles?.length > 0 ? (
                          <div className="space-y-1 max-h-60 overflow-y-auto">
                            {r.embeddedFiles.map((f, i) => (
                              <div key={i} className="p-2 rounded bg-amber-500/10 text-xs text-amber-300 font-mono">{f}</div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-slate-400">No embedded files detected</p>}
                      </SectionCard>

                      <SectionCard title="OLE Streams" icon={Terminal} color="blue" defaultOpen={false}>
                        {r.oleAnalysis?.oleStreams?.length > 0 ? (
                          <div className="space-y-0.5 max-h-60 overflow-y-auto">
                            {r.oleAnalysis.oleStreams.map((s, i) => (
                              <div key={i} className="p-1 rounded bg-slate-800/50 text-[10px] text-slate-400 font-mono">{s}</div>
                            ))}
                          </div>
                        ) : <p className="text-sm text-slate-400">No OLE streams</p>}
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'gps' && (
                    <div>
                      {r.hasGps && r.gpsCoordinates ? (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                            <div className="flex items-center gap-2 mb-3">
                              <MapPin className="w-5 h-5 text-emerald-400" />
                              <span className="font-bold text-emerald-400">GPS Coordinates Found</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {Object.entries(r.gpsCoordinates).map(([k, v]) => (
                                <div key={k} className="p-2 rounded-lg bg-slate-800/50">
                                  <div className="text-xs text-slate-400 capitalize">{k}</div>
                                  <div className="text-sm text-white font-mono">{v}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50">
                            <p className="text-xs text-slate-400 mb-2">Open in map:</p>
                            <a href={`https://www.google.com/maps?q=${r.gpsCoordinates.lat || ''},${r.gpsCoordinates.long || ''}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 inline-flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4" /> View on Google Maps <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-700/50">
                          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400">No GPS coordinates found in document metadata</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'content' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      {m?.headings && (
                        <SectionCard title="Headings / Outline" icon={BookOpen} color="cyan">
                          <div className="p-2 rounded-lg bg-slate-800/50 text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">{m.headings}</div>
                        </SectionCard>
                      )}
                      {m?.sampleText && (
                        <SectionCard title="Sample Text" icon={FileText} color="emerald">
                          <div className="p-2 rounded-lg bg-slate-800/50 text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">{m.sampleText}</div>
                        </SectionCard>
                      )}
                      {!m?.headings && !m?.sampleText && (
                        <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-700/50 col-span-2">
                          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-400">No readable text content extracted</p>
                        </div>
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

export default DocumentMetadataTool;
