import { useState, useRef, useCallback , useEffect} from 'react';
import { useToolResult } from '../../context/ToolResultContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Upload, FileArchive, Download, Globe, MapPin, Bookmark,
  Users, Calendar, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { useToast } from '../common/Toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GoogleTakeoutTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState(null);
  const { setLastResult } = useToolResult();
  // Auto-register result with global Save to Case button
  useEffect(() => {
    if (result) {
      setLastResult({ data: result, toolName: 'GoogleTakeout', query: '' });
    }
  }, [result]);
  useEffect(() => () => setLastResult(null), []);  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.zip')) {
      toast.error('Please select a .zip file (Google Takeout)');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleParse = useCallback(async () => {
    if (!file) { toast.error('Select a Google Takeout ZIP file'); return; }
    onConsume?.(15);
    setIsParsing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const resp = await fetch(`${API_BASE}/tools/email/takeout`, {
        method: 'POST',
        body: form,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Parse failed');
      setResult(data);
      toast.success('Takeout parsed successfully');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsParsing(false);
    }
  }, [file, onConsume, toast]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 24 }} transition={{ type: 'spring', damping: 22, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl h-auto max-h-[90vh] overflow-hidden rounded-2xl bg-[#0a0e17] border border-white/10">

        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#0a0e17]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <FileArchive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">Google Takeout Parser</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">Extract Contacts, Bookmarks & Location</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-amber-500/50 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
            <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{file ? file.name : 'Click to upload Google Takeout ZIP'}</p>
            <p className="text-[10px] text-gray-600 mt-1">Supports Contacts, Bookmarks, YouTube Subs, Location History, Calendar</p>
          </div>

          {file && (
            <button onClick={handleParse} disabled={isParsing}
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium hover:from-amber-500 hover:to-orange-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {isParsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : <><Download className="w-4 h-4" /> Parse Takeout</>}
            </button>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {result && (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-4">
                {(() => {
                  const contacts = result.contacts || [];
                  const bookmarks = result.chromeBookmarks || result.bookmarks || [];
                  const locations = result.locationHistory || result.locations || [];
                  const calendarEvents = result.calendarEvents || [];
                  return (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Contacts', value: contacts.length, icon: Users, color: 'text-blue-400' },
                          { label: 'Bookmarks', value: bookmarks.length, icon: Bookmark, color: 'text-amber-400' },
                          { label: 'Location Pts', value: locations.length, icon: MapPin, color: 'text-emerald-400' },
                          { label: 'Calendar Events', value: calendarEvents.length, icon: Calendar, color: 'text-violet-400' },
                        ].map((s) => (
                          <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                            <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                            <p className="text-xl font-bold text-white">{s.value}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {contacts.length > 0 && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Users className="w-3 h-3" /> Contacts
                          </h5>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {contacts.slice(0, 50).map((c, i) => (
                              <div key={i} className="text-xs text-gray-400 py-1 px-2 rounded hover:bg-white/5">
                                {c.name} {c.email ? `<${c.email}>` : ''} {c.phone ? `• ${c.phone}` : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {calendarEvents.length > 0 && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Calendar className="w-3 h-3" /> Calendar Events
                          </h5>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {calendarEvents.slice(0, 50).map((e, i) => (
                              <div key={i} className="text-xs text-gray-400 py-1 px-2 rounded hover:bg-white/5">
                                {e.summary} — <span className="text-gray-600">{e.start}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {locations.length > 0 && (
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                          <h5 className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <MapPin className="w-3 h-3" /> Location History (Recent)
                          </h5>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {locations.slice(0, 50).map((l, i) => (
                              <div key={i} className="text-xs text-gray-400 py-1 px-2 rounded hover:bg-white/5">
                                {(l.lat ?? l.latitude)?.toFixed(4)}, {(l.lng ?? l.lon ?? l.longitude)?.toFixed(4)} — <span className="text-gray-600">{l.timestamp || ''}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GoogleTakeoutTool;
