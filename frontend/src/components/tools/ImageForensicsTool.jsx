import { useState, useCallback, useRef , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Image, Link, ExternalLink, Camera, FileImage,
  ChevronDown, ChevronUp, Loader2, Upload, AlertTriangle,
  CheckCircle, Info, Eye, FileText, Scan, Shield
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ImageForensicsTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const [imageUrl, setImageUrl] = useState('');
  const [base64Preview, setBase64Preview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'ImageForensics', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [showRaw, setShowRaw] = useState(false);
  const [activeTab, setActiveTab] = useState('properties');
  const fileInputRef = useRef(null);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBase64Preview(ev.target.result);
      setImageUrl('');
      toast.info('Image loaded — click Analyze');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  const handleAnalyze = useCallback(async () => {
    const url = imageUrl.trim();
    if (!url && !base64Preview) {
      toast.error('Enter an image URL or upload an image');
      return;
    }
    onConsume?.(18);
    setIsAnalyzing(true);
    setResult(null);
    try {
      const resp = await fetch(`${API_BASE}/tools/image/forensics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: url || '',
          base64: base64Preview || '',
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      toast.success('Forensic analysis complete');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageUrl, base64Preview, onConsume, toast]);

  const props = result?.imageProperties;
  const ela = result?.ela;
  const ocr = result?.ocr;
  const faces = result?.faceDetection;
  const stego = result?.steganography;

  const tabs = [
    { id: 'properties', label: 'Properties', icon: FileImage },
    { id: 'ela', label: 'ELA', icon: Eye },
    { id: 'ocr', label: 'OCR', icon: FileText },
    { id: 'faces', label: 'Faces', icon: Camera },
    { id: 'stego', label: 'Stegano', icon: Shield },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl h-auto max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0e17] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.3)]">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80 sticky top-0 z-10 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-900/30">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white tracking-wide">Image Forensics</h1>
              <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">ELA · OCR · Face · Steganography</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1 flex items-center rounded-xl bg-[#111827] border border-gray-800 focus-within:border-amber-600/50 transition-all overflow-hidden">
                <Link className="w-4 h-4 text-gray-500 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={e => { setImageUrl(e.target.value); setBase64Preview(null); }}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 bg-transparent text-white text-sm px-3 py-4 outline-none placeholder-gray-600 font-mono"
                />
              </div>
              <button onClick={handleAnalyze} disabled={isAnalyzing || (!imageUrl && !base64Preview)}
                className="px-5 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm font-medium hover:from-amber-500 hover:to-orange-500 transition-all flex items-center gap-2 rounded-xl disabled:opacity-50">
                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {isAnalyzing ? '…' : 'Analyze'}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-800" />
              <span className="text-[10px] text-gray-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <div className="flex items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#111827] border border-gray-800 hover:border-amber-600/30 transition-all text-sm text-gray-400 hover:text-gray-200">
                <Upload className="w-4 h-4" /> Upload Image
              </button>
              {base64Preview && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <CheckCircle className="w-3 h-3" /> Loaded
                  <button onClick={() => setBase64Preview(null)} className="text-red-400 hover:text-red-300 ml-1">Clear</button>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {/* Techniques badges */}
                <div className="flex flex-wrap gap-1.5">
                  {(result.techniques || []).map((t, i) => (
                    <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {t}
                    </span>
                  ))}
                </div>

                {/* Tab nav */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 overflow-x-auto">
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all flex-1 justify-center whitespace-nowrap">
                      <tab.icon className="w-3 h-3" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Properties tab */}
                {activeTab === 'properties' && props && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Format', value: props.format },
                        { label: 'Dimensions', value: `${props.width}×${props.height}` },
                      { label: 'Megapixels', value: props.megapixels },
                      { label: 'Aspect Ratio', value: props.aspectRatio },
                      { label: 'Color Mode', value: props.mode },
                      { label: 'DPI', value: props.dpi || 'Unknown' },
                      { label: 'Has EXIF', value: props.hasExif ? 'Yes' : 'No' },
                      { label: 'Animated', value: props.isAnimated ? Yes ( frames) : 'No' },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                        <p className="text-sm text-white font-mono">{String(item.value)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ELA tab */}
                {activeTab === 'ela' && (
                  <div className="space-y-3">
                    {ela?.error ? (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{ela.error}</div>
                    ) : ela ? (
                      <>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Tamper Score</span>
                            <span className="text-sm font-bold text-gray-300">
                              {ela.tamperScore}/100
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-800 mb-3">
                            <div className="h-full rounded-full bg-red-500 transition-all"
                              style={{ width: `${ela.tamperScore}%` }} />
                          </div>
                          <p className="text-xs text-gray-400">{ela.interpretation}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] text-gray-500">Quality Used</p>
                            <p className="text-sm text-white font-mono">{ela.quality}%</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] text-gray-500">Max Difference</p>
                            <p className="text-sm text-white font-mono">{ela.maxDifference}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] text-gray-500">Avg Difference</p>
                            <p className="text-sm text-white font-mono">{ela.averageDifference}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] text-gray-500">Status</p>
                            <p className="text-sm font-mono text-gray-300">
                              {ela.likelyTampered ? 'Tampered' : 'Clean'}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">ELA result not available</div>
                    )}
                  </div>
                )}

                {/* OCR tab */}
                {activeTab === 'ocr' && (
                  <div className="space-y-3">
                    {ocr?.available === false ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-400">{ocr.note || 'OCR not available'}</p>
                      </div>
                    ) : ocr?.hasText ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-2xl text-white font-bold">{ocr.wordCount}</p>
                            <p className="text-[10px] text-gray-500">Words</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-2xl text-white font-bold">{ocr.charCount}</p>
                            <p className="text-[10px] text-gray-500">Characters</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <p className="text-2xl text-white font-bold">{ocr.averageConfidence}%</p>
                            <p className="text-[10px] text-gray-500">Confidence</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                            {ocr.text}
                          </pre>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">
                        {ocr?.error ? <span className="text-red-400">{ocr.error}</span> : 'No text detected'}
                      </div>
                    )}
                  </div>
                )}

                {/* Faces tab */}
                {activeTab === 'faces' && (
                  <div className="space-y-3">
                    {faces?.available === false ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-400">{faces.note || 'Face detection not available'}</p>
                      </div>
                    ) : faces?.faceCount > 0 ? (
                      <>
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                          <p className="text-3xl text-white font-bold">{faces.faceCount}</p>
                          <p className="text-xs text-gray-500 mt-1">Face{faces.faceCount !== 1 ? 's' : ''} Detected</p>
                          <p className="text-[10px] text-gray-600 mt-1">Method: {faces.method}</p>
                        </div>
                        {faces.faces.map((f, i) => (
                          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-xs text-gray-400 mb-2">Face #{f.index + 1}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <span className="text-gray-500">Position:</span>
                              <span className="text-gray-300 font-mono">({f.bounds.left},{f.bounds.top})</span>
                              <span className="text-gray-500">Size:</span>
                              <span className="text-gray-300 font-mono">{f.width}×{f.height}px</span>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-sm">No faces detected</div>
                    )}
                  </div>
                )}

                {/* Steganography tab */}
                {activeTab === 'stego' && (
                  <div className="space-y-3">
                    {stego && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] text-gray-500">Unique Colors</p>
                            <p className="text-sm text-white font-mono">{stego.uniqueColors}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                            <p className="text-[10px] text-gray-500">Transparency</p>
                            <p className="text-sm font-mono text-gray-300">
                              {stego.hasTransparency ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                        {stego.suspiciousFlags?.length > 0 && (
                          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-400 font-medium mb-1">Suspicious Indicators</p>
                            {stego.suspiciousFlags.map((f, i) => (
                              <p key={i} className="text-xs text-gray-400">• {f}</p>
                            ))}
                          </div>
                        )}
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <p className="text-[10px] text-amber-400">{stego.steganalysisNote}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Raw toggle */}
                <div className="flex items-center justify-between pt-2">
                  {result?.timestamp && <span className="text-[10px] text-gray-600">{new Date(result.timestamp).toLocaleString()}</span>}
                  <button onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-gray-400 transition-colors ml-auto">
                    {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} Raw JSON
                  </button>
                </div>
                {showRaw && (
                  <pre className="text-[10px] text-gray-500 bg-black/30 rounded-xl p-4 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImageForensicsTool;
