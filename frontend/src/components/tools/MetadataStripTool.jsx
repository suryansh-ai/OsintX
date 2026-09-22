import { useState, useRef, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, Download, Image, AlertCircle, CheckCircle, FileImage, Loader2, Trash2
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MetadataStripTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'MetadataStrip', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleStrip = useCallback(async () => {
    if (!file) { toast.error('Select an image first'); return; }
    onConsume?.(8);
    setIsProcessing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const resp = await fetch(`${API_BASE}/tools/image/metadata-strip`, {
        method: 'POST',
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Processing failed');
      setResult(data);
      toast.success('Metadata stripped successfully');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [file, onConsume, toast]);

  const handleDownload = () => {
    if (!result?.downloadUrl) return;
    const a = document.createElement('a');
    a.href = `${API_BASE}${result.downloadUrl}`;
    a.download = `cleaned_${file?.name || 'image.png'}`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg h-auto max-h-[90vh] overflow-hidden rounded-2xl bg-[#0a0e17] border border-white/10">

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Metadata Stripper</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Remove EXIF & Hidden Data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-violet-500/50 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg object-contain" />
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Upload image to strip metadata</p>
                <p className="text-[10px] text-gray-600 mt-1">JPEG, PNG, WebP supported</p>
              </>
            )}
          </div>

          {file && !result && (
            <button onClick={handleStrip} disabled={isProcessing}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : <><Trash2 className="w-4 h-4" /> Strip Metadata</>}
            </button>
          )}

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                <div className={`p-5 rounded-xl ${result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
                  <div className="flex items-center gap-3">
                    {result.success ? <CheckCircle className="w-6 h-6 text-emerald-400" /> : <AlertCircle className="w-6 h-6 text-amber-400" />}
                    <div>
                      <p className={`text-sm font-bold ${result.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {result.success ? 'Metadata stripped successfully' : result.message || 'Partial success'}
                      </p>
                      {result.originalSize && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {result.originalSize} → {result.cleanedSize || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {result.removedFields?.length > 0 && (
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Removed Fields</h5>
                    <div className="flex flex-wrap gap-2">
                      {result.removedFields.map((f, i) => (
                        <span key={i} className="px-2 py-1 text-[10px] rounded-md bg-red-500/10 text-red-400 border border-red-500/20">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {result.downloadUrl && (
                  <button onClick={handleDownload}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" /> Download Cleaned Image
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MetadataStripTool;
