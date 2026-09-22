import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, X, Search, Zap, Globe, MapPin, User, Shield, Signal,
  AlertTriangle, CheckCircle, Clock, Copy, RefreshCw, Activity,
  Smartphone, Radio, PhoneCall, Wifi, Eye, Database, Lock, MessageCircle
} from 'lucide-react';
import { Download } from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { exportToJSON, exportToCSV, formatForExport } from '../../utils/export';
import { useToolResult } from '../../context/ToolResultContext';
import { fetchWithTimeout } from '../../utils/fetchWithTimeout';

const WhatsAppTraceTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { copy } = useClipboard();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isTracing, setIsTracing] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'Whats App Trace', query: '' });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('call');
  const [traceProgress, setTraceProgress] = useState(0);
  const [signalPulse, setSignalPulse] = useState(false);
  const [phoneEnriched, setPhoneEnriched] = useState(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const canvasRef = useRef(null);

  const handleRefresh = () => {
    setPhoneNumber('');
    setResults(null);
    setTraceProgress(0);
    toast.info('Ready for new trace');
  };

  const handleExportJSON = () => {
    if (!results) { toast.error('No results to export'); return; }
    const ok = exportToJSON(results, `whatsapp_trace_${Date.now()}.json`);
    if (ok) toast.success('Exported JSON'); else toast.error('Export failed');
  };

  const handleExportCSV = () => {
    if (!results) { toast.error('No results to export'); return; }
    const prepared = formatForExport(results, 'csv');
    const ok = exportToCSV(prepared, `whatsapp_trace_${Date.now()}.csv`);
    if (ok) toast.success('Exported CSV'); else toast.error('Export failed');
  };

  // Signal wave animation
  useEffect(() => {
    if (isTracing) {
      const interval = setInterval(() => setSignalPulse(p => !p), 500);
      return () => clearInterval(interval);
    }
  }, [isTracing]);

  // Background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y += p.speedY;
        p.x += p.speedX;
        if (p.y > canvas.height || p.y < 0) p.speedY *= -1;
        if (p.x > canvas.width || p.x < 0) p.speedX *= -1;
      });
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  const handleTrace = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    trackToolUsage('whatsapp-trace', 'trace', 'start');
    setIsTracing(true);
    setTraceProgress(0);
    onConsume?.(15);

    const progressInterval = setInterval(() => {
      if (!mountedRef.current) { clearInterval(progressInterval); return; }
      setTraceProgress(prev => Math.min(prev + 3, 95));
    }, 100);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetchWithTimeout(`${API_BASE}/tools/whatsapp/trace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim() }),
      });

      clearInterval(progressInterval);
      setTraceProgress(100);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'WhatsApp trace failed');
      }

      const resultData = await response.json();
      setResults(resultData);
      addToHistory({
        tool: 'WhatsApp Trace',
        query: phoneNumber,
        timestamp: new Date().toISOString(),
        results: resultData,
      });
      trackToolUsage('whatsapp-trace', 'trace', 'success');
      toast.success('Trace completed successfully — real data!');
      setIsEnriching(true);
      try {
        const enrichResp = await fetchWithTimeout(`${API_BASE}/tools/phone/enriched`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phoneNumber.trim() }),
        });
        if (enrichResp.ok) {
          const enrichData = await enrichResp.json();
          setPhoneEnriched(enrichData);
        }
      } catch (e) {
        console.log('[Phone Enrich]', e.message);
      } finally {
        setIsEnriching(false);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error('WhatsApp trace error:', error);
      toast.error(error.message || 'Trace failed. Is the backend running?');
      trackToolUsage('whatsapp-trace', 'trace', 'error');
    } finally {
      setIsTracing(false);
    }
  };

  const tabs = [
    { id: 'call', label: 'Call Trace', icon: PhoneCall },
    { id: 'ip', label: 'IP Details', icon: Globe },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'device', label: 'Device', icon: Smartphone },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'social', label: 'Social Presence', icon: User },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-gray-900 via-green-950/30 to-gray-900 rounded-2xl border border-green-500/30 overflow-hidden"
      >
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-green-500/30 bg-gray-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">WhatsApp Trace</h2>
              <p className="text-xs sm:text-sm text-green-400/80 truncate hidden sm:block">Trace IP from WhatsApp voice/video calls</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-200 hidden sm:inline">New Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!results}
              onClick={handleExportJSON}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 transition-all hidden sm:flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-200">Export JSON</span>
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 hidden sm:flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-amber-300">20</span>
              <span className="text-xs text-amber-200/70">credits</span>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 transition-all"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!results ? (
            <div className="max-w-xl mx-auto space-y-6">
              {/* Input Section */}
              <div className="p-6 rounded-xl bg-gray-800/50 border border-green-500/20">
                <label className="block text-sm text-green-400 mb-2 font-mono">TARGET PHONE NUMBER</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 XXXXXXXXXX"
                    className="w-full pl-12 pr-4 py-4 rounded-lg bg-gray-900 border border-green-500/30 focus:border-green-500 outline-none text-white text-lg font-mono placeholder-gray-600"
                    onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Enter phone number with country code for WhatsApp call trace</p>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-amber-400 font-medium">Important Instructions</p>
                    <ul className="mt-2 text-sm text-amber-300/80 space-y-1">
                      <li>• Call must be active or recently completed for IP trace</li>
                      <li>• Works with both voice and video calls</li>
                      <li>• VPN/Proxy detection included in analysis</li>
                      <li>• Use only for authorized investigations</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Trace Button */}
              <button
                onClick={handleTrace}
                disabled={isTracing}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg flex items-center justify-center gap-3 hover:from-green-400 hover:to-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30"
              >
                {isTracing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Radio className="w-6 h-6" />
                    </motion.div>
                    Tracing IP... {traceProgress}%
                  </>
                ) : (
                  <>
                    <Signal className="w-6 h-6" />
                    Trace WhatsApp Call IP
                  </>
                )}
              </button>

              {isTracing && (
                <div className="space-y-3">
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${traceProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-green-400 text-sm">
                    <motion.div animate={{ scale: signalPulse ? 1.2 : 1 }}>
                      <Wifi className="w-4 h-4" />
                    </motion.div>
                    <span>Intercepting call packets...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Results Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'call' && (
                  <motion.div
                    key="call"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                      <h3 className="text-sm font-mono text-green-400 mb-3">WHATSAPP STATUS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Registered</span>
                          <span className="text-green-400">{results.whatsappStatus.registered ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Seen</span>
                          <span className="text-white">{results.whatsappStatus.lastSeen}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">About</span>
                          <span className="text-white">{results.whatsappStatus.about}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Profile Photo</span>
                          <span className="text-white">{results.whatsappStatus.profilePhoto ? 'Present' : 'None'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                      <h3 className="text-sm font-mono text-green-400 mb-3">CALL DETAILS</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Call Type</span>
                          <span className="text-white">{results.callTrace.callType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Duration</span>
                          <span className="text-white">{results.callTrace.callDuration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Timestamp</span>
                          <span className="text-white">{results.callTrace.callTimestamp}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Protocol</span>
                          <span className="text-amber-400">{results.callTrace.protocol}</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30">
                      <h3 className="text-sm font-mono text-green-400 mb-3">TRACED IP ADDRESSES</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-gray-900/50">
                          <p className="text-xs text-gray-500 mb-1">Source IP</p>
                          <p className="text-lg font-mono text-green-400">{results.callTrace.sourceIP}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-900/50">
                          <p className="text-xs text-gray-500 mb-1">Destination IP</p>
                          <p className="text-lg font-mono text-green-400">{results.callTrace.destinationIP}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'ip' && (
                  <motion.div
                    key="ip"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                        <h3 className="text-sm font-mono text-green-400 mb-3">ISP INFORMATION</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">IP Address</span>
                            <span className="text-green-400 font-mono">{results.ipDetails.ip}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">ISP</span>
                            <span className="text-white">{results.ipDetails.isp}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Organization</span>
                            <span className="text-white">{results.ipDetails.organization}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">ASN</span>
                            <span className="text-cyan-400 font-mono">{results.ipDetails.asn}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                        <h3 className="text-sm font-mono text-green-400 mb-3">LOCATION</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Country</span>
                            <span className="text-white">{results.ipDetails.country}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">State</span>
                            <span className="text-white">{results.ipDetails.state}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">City</span>
                            <span className="text-white">{results.ipDetails.city}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pincode</span>
                            <span className="text-white">{results.ipDetails.pincode}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Timezone</span>
                            <span className="text-white">{results.ipDetails.timezone}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                      <h3 className="text-sm font-mono text-green-400 mb-3">COORDINATES</h3>
                      <div className="flex items-center gap-4">
                        <MapPin className="w-8 h-8 text-green-400" />
                        <div>
                          <p className="text-xl font-mono text-white">
                            {results.ipDetails.coordinates.lat}, {results.ipDetails.coordinates.lng}
                          </p>
                          <p className="text-sm text-gray-500">Approximate location based on IP geolocation</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'network' && (
                  <motion.div
                    key="network"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                      <h3 className="text-sm font-mono text-green-400 mb-3">CONNECTION INFO</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Connection Type</span>
                          <span className="text-white">{results.networkInfo.connectionType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Network Provider</span>
                          <span className="text-white">{results.networkInfo.networkProvider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Signal Strength</span>
                          <span className="text-green-400">{results.networkInfo.signalStrength}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                      <h3 className="text-sm font-mono text-green-400 mb-3">CELL TOWER</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">LAC</span>
                          <span className="text-cyan-400 font-mono">{results.networkInfo.cellTower.lac}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cell ID</span>
                          <span className="text-cyan-400 font-mono">{results.networkInfo.cellTower.cellId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MCC</span>
                          <span className="text-white">{results.networkInfo.cellTower.mcc}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">MNC</span>
                          <span className="text-white">{results.networkInfo.cellTower.mnc}</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-6 h-6 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-400">Approximate Location</p>
                          <p className="text-lg text-white font-medium">{results.networkInfo.approximateLocation}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'device' && (
                  <motion.div
                    key="device"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                      <h3 className="text-sm font-mono text-green-400 mb-3">DEVICE INFO</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Device Type</span>
                          <span className="text-white">{results.deviceInfo.deviceType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Model</span>
                          <span className="text-white">{results.deviceInfo.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">OS Version</span>
                          <span className="text-white">{results.deviceInfo.osVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">WhatsApp Version</span>
                          <span className="text-cyan-400">{results.deviceInfo.whatsappVersion}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                      <h3 className="text-sm font-mono text-green-400 mb-3">RISK ASSESSMENT</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Risk Score</span>
                          <span className={`text-xl font-bold ${results.riskAssessment.score < 30 ? 'text-green-400' : results.riskAssessment.score < 70 ? 'text-amber-400' : 'text-red-400'}`}>
                            {results.riskAssessment.score}/100
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Level</span>
                          <span className={`px-2 py-1 rounded text-sm ${results.riskAssessment.level === 'Low' ? 'bg-green-500/20 text-green-400' : results.riskAssessment.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                            {results.riskAssessment.level}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-700">
                          <p className="text-xs text-gray-500 mb-2">Flags</p>
                          <div className="flex flex-wrap gap-1">
                            {results.riskAssessment.flags.map((flag, i) => (
                              <span key={i} className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-300">{flag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <h3 className="text-sm font-mono text-green-400">CALL HISTORY</h3>
                    {results.callHistory.map((call, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            call.type === 'incoming' ? 'bg-green-500/20 text-green-400' :
                            call.type === 'outgoing' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            <PhoneCall className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-white capitalize">{call.type} Call</p>
                            <p className="text-sm text-gray-500">{call.timestamp}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-mono">{call.duration}</p>
                          {call.ip && <p className="text-xs text-green-400 font-mono">{call.ip}</p>}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'social' && (
                  <motion.div
                    key="social"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-green-400" />
                      <h3 className="text-sm font-mono text-green-400">Social Presence & Phone Intelligence</h3>
                      {isEnriching && <RefreshCw className="w-3 h-3 animate-spin text-green-400" />}
                    </div>

                    {!phoneEnriched && !isEnriching && (
                      <p className="text-sm text-gray-500 p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                        Social presence data loads automatically after tracing a number.
                      </p>
                    )}

                    {isEnriching && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 p-4">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Querying Truecaller, WhatsApp, Alpha_X, Signal...
                      </div>
                    )}

                    {phoneEnriched && (
                      <>
                        {/* Truecaller */}
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Phone className="w-4 h-4 text-emerald-400" />
                            Truecaller Lookup
                          </h4>
                          {phoneEnriched.truecaller?.error ? (
                            <p className="text-xs text-amber-400">{phoneEnriched.truecaller.error}</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2 rounded-lg bg-gray-900/50">
                                <div className="text-[10px] text-gray-500">Name</div>
                                <div className="text-sm text-white">{phoneEnriched.truecaller.name || 'Unknown'}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-gray-900/50">
                                <div className="text-[10px] text-gray-500">Carrier</div>
                                <div className="text-sm text-white">{phoneEnriched.truecaller.carrier || 'Unknown'}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-gray-900/50">
                                <div className="text-[10px] text-gray-500">Location</div>
                                <div className="text-sm text-white">{phoneEnriched.truecaller.location || 'Unknown'}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-gray-900/50">
                                <div className="text-[10px] text-gray-500">Spam Risk</div>
                                <div className={`text-sm ${phoneEnriched.truecaller.spamRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {phoneEnriched.truecaller.spamRisk ? 'Yes' : 'No'}
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-[10px] text-gray-600">Source: truecaller.com</div>
                        </div>

                        {/* WhatsApp */}
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-green-400" />
                            WhatsApp
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 rounded-lg bg-gray-900/50">
                              <div className="text-[10px] text-gray-500">Has WhatsApp</div>
                              <div className={`text-sm ${phoneEnriched.whatsapp?.hasWhatsApp ? 'text-emerald-400' : 'text-red-400'}`}>
                                {phoneEnriched.whatsapp?.hasWhatsApp ? 'Yes' : 'No / Unknown'}
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-gray-900/50">
                              <div className="text-[10px] text-gray-500">WA.me Link</div>
                              <a href={phoneEnriched.whatsapp?.waMeUrl} target="_blank" rel="noopener noreferrer"
                                className="text-sm text-blue-400 underline truncate block">Open Chat</a>
                            </div>
                          </div>
                        </div>

                        {/* Alpha_X */}
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Signal className="w-4 h-4 text-blue-400" />
                            Alpha_X & Signal
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-gray-900/50">
                              <div className="text-[10px] text-gray-500">Alpha_X</div>
                              <div className={`text-sm ${phoneEnriched.telegram?.hasTelegram ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {phoneEnriched.telegram?.hasTelegram ? 'Account found' : 'Not detected'}
                              </div>
                              {phoneEnriched.telegram?.username && (
                                <div className="text-xs text-gray-400 mt-1">@{phoneEnriched.telegram.username}</div>
                              )}
                              <a href={phoneEnriched.telegram?.telegramUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-blue-400 underline">Open Alpha_X</a>
                            </div>
                            <div className="p-3 rounded-lg bg-gray-900/50">
                              <div className="text-[10px] text-gray-500">Signal</div>
                              <div className="text-sm text-slate-400">Check manually via Signal app</div>
                              <a href={phoneEnriched.signal?.signalUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-blue-400 underline">Open Signal</a>
                            </div>
                          </div>
                        </div>

                        {/* GetContact */}
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Search className="w-4 h-4 text-purple-400" />
                            GetContact
                          </h4>
                          {phoneEnriched.getcontact?.error ? (
                            <p className="text-xs text-amber-400">{phoneEnriched.getcontact.error}</p>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-2 rounded-lg bg-gray-900/50">
                                <div className="text-[10px] text-gray-500">Saved Name</div>
                                <div className="text-sm text-white">{phoneEnriched.getcontact?.name || 'Unknown'}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-gray-900/50">
                                <div className="text-[10px] text-gray-500">Tags</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {(phoneEnriched.getcontact?.tags || []).map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[10px]">{tag}</span>
                                  ))}
                                  {(!phoneEnriched.getcontact?.tags || phoneEnriched.getcontact.tags.length === 0) && (
                                    <span className="text-xs text-gray-500">No tags</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Google Voice */}
                        <div className="p-4 rounded-xl bg-gray-800/50 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-amber-400" />
                            Google Voice
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 rounded-lg bg-gray-900/50">
                              <div className="text-[10px] text-gray-500">Google Voice</div>
                              <div className={`text-sm ${phoneEnriched.googleVoice?.isGoogleVoice === true ? 'text-emerald-400' : phoneEnriched.googleVoice?.isGoogleVoice ? 'text-amber-400' : 'text-slate-400'}`}>
                                {phoneEnriched.googleVoice?.isGoogleVoice === true ? 'Yes' : phoneEnriched.googleVoice?.isGoogleVoice === false ? 'No' : phoneEnriched.googleVoice?.note || 'Unknown'}
                              </div>
                            </div>
                            <div className="p-2 rounded-lg bg-gray-900/50">
                              <div className="text-[10px] text-gray-500">Country</div>
                              <div className="text-sm text-white">{phoneEnriched.country}</div>
                            </div>
                          </div>
                        </div>

                        {/* Sources */}
                        <div className="flex flex-wrap gap-2">
                          {(phoneEnriched.sources || []).map(s => (
                            <span key={s} className="px-2 py-1 rounded-md bg-gray-800/50 border border-gray-700/50 text-[10px] text-gray-500">{s}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WhatsAppTraceTool;
