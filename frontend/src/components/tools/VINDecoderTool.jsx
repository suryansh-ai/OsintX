import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car, X, Search, Shield, AlertTriangle, CheckCircle, Server, Wifi, Lock, Eye, Target, Copy,
  ChevronDown, ChevronUp, ExternalLink, Globe, Calendar, Fuel, Cpu, Gauge, Truck, AlertOctagon, Star
} from 'lucide-react';
import { useToast } from '../common/Toast';
import { useHistory } from '../../context/HistoryContext';
import { useSearchHistory } from '../../context/SearchHistoryContext';
import useClipboard from '../../hooks/useClipboard';
import { trackToolUsage } from '../../utils/analytics';
import { useToolResult } from '../../context/ToolResultContext';

const InfoRow = ({ label, value, mono, copyFn }) => {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-800/50 last:border-0 group">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-white text-sm flex items-center gap-1 ${mono ? 'font-mono' : ''}`}>
        {String(value)}
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
      for (let i=1;i<=4;i++){ctx.beginPath();ctx.arc(cx,cy,(mr/4)*i,0,Math.PI*2);ctx.strokeStyle='rgba(251,191,36,0.15)';ctx.lineWidth=1;ctx.stroke();}
      ctx.strokeStyle='rgba(251,191,36,0.1)';ctx.beginPath();ctx.moveTo(cx,cy-mr);ctx.lineTo(cx,cy+mr);ctx.moveTo(cx-mr,cy);ctx.lineTo(cx+mr,cy);ctx.stroke();
      if(active){
        ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,mr,a,a+0.4);ctx.closePath();
        const g=ctx.createRadialGradient(cx,cy,0,cx,cy,mr);g.addColorStop(0,'rgba(251,191,36,0.4)');g.addColorStop(1,'rgba(251,191,36,0)');
        ctx.fillStyle=g;ctx.fill(); a+=0.04;
        if(Math.random()>0.93){const bx=cx+Math.cos(Math.random()*6.28)*mr*0.7,by=cy+Math.sin(Math.random()*6.28)*mr*0.7;ctx.beginPath();ctx.arc(bx,by,3,0,6.28);ctx.fillStyle='#fbbf24';ctx.fill();}
      }
      ctx.beginPath();ctx.arc(cx,cy,3,0,6.28);ctx.fillStyle='#fbbf24';ctx.fill();
      id=requestAnimationFrame(draw);
    };
    draw(); return ()=>cancelAnimationFrame(id);
  }, [active]);
  return <canvas ref={ref} className="w-[180px] h-[180px] mx-auto" />;
};

const VINDecoderTool = ({ onClose, onConsume }) => {
  const toast = useToast();
  const { addToHistory } = useHistory();
  const { addSearch, getToolHistory } = useSearchHistory();
  const { copy } = useClipboard();

  const [vin, setVin] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const [results, setResults] = useState(null);
  const { setLastResult } = useToolResult();
  // Register result with global Save to Case button
  useEffect(() => {
    if (results) setLastResult({ data: results, toolName: 'V I N Decoder', query: vin });
  }, [results]);
  useEffect(() => () => setLastResult(null), []);  const [activeTab, setActiveTab] = useState('vehicle');

  const recentSearches = getToolHistory('vin-decode');

  const handleRefresh = () => { setVin(''); setResults(null); toast.info('Ready for new search'); };

  const handleDecode = async () => {
    const cleanVin = vin.trim().toUpperCase();
    if (!cleanVin || cleanVin.length !== 17) { toast.error('VIN must be exactly 17 characters'); return; }
    trackToolUsage('vin-decoder', 'decode', 'start');
    setIsDecoding(true); onConsume?.(12);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE}/tools/vin/decode`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vin: cleanVin }),
      });
      if (!response.ok) { const err = await response.json().catch(()=>({})); throw new Error(err.error || 'VIN decode failed'); }
      const data = await response.json();
      setResults(data);
      addToHistory('vin-decoder', cleanVin, data);
      addSearch('vin-decode', cleanVin, data);
      trackToolUsage('vin-decoder', 'decode', 'success');
      toast.success(data.success ? 'VIN decoded successfully' : 'Could not decode VIN');
    } catch (err) {
      toast.error(err.message || 'VIN decode failed');
      trackToolUsage('vin-decoder', 'decode', 'error');
    } finally { setIsDecoding(false); }
  };

  const tabs = [
    { id: 'vehicle', label: 'Vehicle', icon: Car },
    { id: 'engine', label: 'Engine', icon: Cpu },
    { id: 'safety', label: 'Safety', icon: Shield },
    { id: 'recalls', label: 'Recalls', icon: AlertOctagon },
  ];

  const d = results?.decoded;
  const r = results;

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{scale:0.92,y:20,opacity:0}} animate={{scale:1,y:0,opacity:1}} exit={{scale:0.92,y:20,opacity:0}}
        transition={{type:'spring',damping:22}} onClick={e=>e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-950 via-amber-950/10 to-slate-950 border border-amber-500/30 shadow-2xl shadow-amber-500/10">

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 px-4 sm:px-6 py-4 border-b border-amber-500/20 bg-slate-950/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30" style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b)'}}>
                <Car className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  VIN Decoder
                </h2>
                <p className="text-xs text-amber-300/70 flex items-center gap-1.5 mt-0.5">
                  <Search className="w-3.5 h-3.5" /> NHTSA vehicle lookup & safety ratings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button whileHover={{scale:1.05}} onClick={handleRefresh} className="p-2 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all">
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
                  <RadarScan active={isDecoding} />
                </div>
                <div className="lg:col-span-3 p-5 rounded-xl bg-slate-900/60 border border-amber-500/20">
                  <label className="text-amber-400 text-sm font-medium mb-3 flex items-center gap-2"><Car className="w-4 h-4" /> 17-Character VIN</label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                      <input type="text" value={vin} onChange={e=>setVin(e.target.value.toUpperCase())} placeholder="e.g. 1HGCM82633A004352"
                        className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-800/80 border-2 border-amber-500/30 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white text-lg font-mono placeholder-slate-500 outline-none transition-all uppercase"
                        maxLength={17}
                        onKeyDown={e=>e.key==='Enter'&&handleDecode()} />
                    </div>
                    <motion.button whileHover={{scale:1.03,boxShadow:'0 0 40px rgba(251,191,36,0.4)'}} whileTap={{scale:0.97}}
                      onClick={handleDecode} disabled={isDecoding||vin.trim().length!==17}
                      className="px-8 py-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-amber-500/30"
                      style={{background:'linear-gradient(135deg,#fbbf24,#f59e0b)'}}>
                      {isDecoding ? (<><motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:'linear'}}><Search className="w-5 h-5" /></motion.div><span>Decoding...</span></>) : (<><Search className="w-5 h-5" /><span>Decode VIN</span></>)}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                <div className="flex items-center gap-4">
                  <Car className="w-8 h-8 text-amber-400" />
                  <div>
                    <div className="text-xl font-bold text-white">{d?.make || 'N/A'} {d?.model || ''}</div>
                    <div className="text-sm text-slate-400 font-mono">{r.vin} • {d?.modelYear || '?'} • {d?.vehicleType || d?.bodyClass || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {r.recalls && r.recalls.length > 0 && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-red-400 font-bold text-xs uppercase">{r.recalls.length} Active Recall(s)</span></div>
                  <p className="text-xs text-slate-400">This vehicle has open safety recalls. Check the Recalls tab for details.</p>
                </div>
              )}

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {tabs.map(tab=>(
                  <motion.button key={tab.id} whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setActiveTab(tab.id)}
                    className={`px-4 py-2.5 rounded-xl flex items-center gap-2 font-medium whitespace-nowrap transition-all text-sm ${activeTab===tab.id ? 'text-white shadow-lg shadow-amber-500/30' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 border border-amber-500/20'}`}
                    style={activeTab===tab.id ? {background:'linear-gradient(135deg,#fbbf24,#f59e0b)'} : {}}>
                    <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>

                  {activeTab === 'vehicle' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Vehicle Identification" icon={Car} color="amber">
                        <InfoRow label="VIN" value={r.vin} mono copyFn={copy} />
                        <InfoRow label="Make" value={d?.make} />
                        <InfoRow label="Model" value={d?.model} />
                        <InfoRow label="Year" value={d?.modelYear} />
                        <InfoRow label="Trim" value={d?.trim} />
                        <InfoRow label="Series" value={d?.series} />
                        <InfoRow label="Body Class" value={d?.bodyClass} />
                        <InfoRow label="Vehicle Type" value={d?.vehicleType} />
                        <InfoRow label="Manufacturer" value={d?.manufacturer} />
                      </SectionCard>

                      <SectionCard title="Dimensions & Weight" icon={Gauge} color="blue">
                        <InfoRow label="Length (inches)" value={d?.length} />
                        <InfoRow label="Width (inches)" value={d?.width} />
                        <InfoRow label="Height (inches)" value={d?.height} />
                        <InfoRow label="Wheelbase (inches)" value={d?.wheelbase} />
                        <InfoRow label="Curb Weight (lbs)" value={d?.curbWeight} />
                        <InfoRow label="GVWR" value={d?.grossWeight} />
                        <InfoRow label="Seats" value={d?.seats} />
                        <InfoRow label="Doors" value={d?.doors} />
                      </SectionCard>

                      <SectionCard title="Drivetrain" icon={Truck} color="emerald">
                        <InfoRow label="Drive Type" value={d?.driveType} />
                        <InfoRow label="Transmission" value={d?.transmission} />
                        <InfoRow label="Brake System" value={d?.brakeSystem} />
                        <InfoRow label="ABS" value={d?.ABS} />
                        <InfoRow label="Steering Location" value={d?.steering} />
                        <InfoRow label="Tire Pressure (PSI)" value={d?.tirePressure} />
                      </SectionCard>

                      <SectionCard title="Manufacturing" icon={Globe} color="purple">
                        <InfoRow label="Plant City" value={d?.plantCity} />
                        <InfoRow label="Plant State" value={d?.plantState} />
                        <InfoRow label="Plant Country" value={d?.plantCountry} />
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'engine' && (
                    <div className="grid lg:grid-cols-2 gap-4">
                      <SectionCard title="Engine Specifications" icon={Cpu} color="amber">
                        <InfoRow label="Configuration" value={d?.engineConfig} />
                        <InfoRow label="Cylinders" value={d?.engineCylinders} />
                        <InfoRow label="Displacement (L)" value={d?.engineDisplacementL} />
                        <InfoRow label="Displacement (CC)" value={d?.engineDisplacementCC} />
                        <InfoRow label="Displacement (CI)" value={d?.engineDisplacementCI} />
                        <InfoRow label="Horsepower" value={d?.engineHP} />
                        <InfoRow label="Engine Model" value={d?.engineModel} />
                        <InfoRow label="Engine Manufacturer" value={d?.engineManufacturer} />
                      </SectionCard>

                      <SectionCard title="Fuel System" icon={Fuel} color="emerald">
                        <InfoRow label="Fuel Type" value={d?.fuelType} />
                        <InfoRow label="Fuel Delivery" value={d?.fuelDelivery} />
                        <InfoRow label="Aspiration" value={d?.aspiration} />
                      </SectionCard>
                    </div>
                  )}

                  {activeTab === 'safety' && r.safetyRatings && (
                    <div className="space-y-4">
                      {r.safetyRatings.map((s, i) => (
                        <SectionCard key={i} title={`Safety Rating ${r.safetyRatings.length > 1 ? `#${i+1}` : ''}`} icon={Shield} color="emerald">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="text-3xl">{s.overallRating || s.overallRatingStars ? '⭐'.repeat(parseInt(s.overallRatingStars) || Math.ceil(parseInt(s.overallRating)/2) || 3) : '—'}</div>
                            <div><div className="text-white font-bold text-lg">Overall: {s.overallRating || s.overallRatingStars || 'N/A'}</div></div>
                          </div>
                          <InfoRow label="Front Crash (Driver)" value={s.frontCrashDriversideRating} />
                          <InfoRow label="Front Crash (Passenger)" value={s.frontCrashPassengersideRating} />
                          <InfoRow label="Side Crash (Driver)" value={s.sideCrashDriversideRating} />
                          <InfoRow label="Side Crash (Passenger)" value={s.sideCrashPassengersideRating} />
                          <InfoRow label="Rollover Rating" value={s.rolloverRating} />
                          <InfoRow label="Rollover Possibility" value={s.rolloverPossibility} />
                          <InfoRow label="Dynamic Test" value={s.dynamicTestResult} />
                        </SectionCard>
                      ))}
                    </div>
                  )}

                  {activeTab === 'safety' && !r.safetyRatings && (
                    <div className="p-6 text-center rounded-xl bg-slate-900/60 border border-slate-700/50">
                      <Shield className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-400">No safety ratings available for this VIN</p>
                    </div>
                  )}

                  {activeTab === 'recalls' && r.recalls && (
                    <div className="space-y-4">
                      {r.recalls.map((rec, i) => (
                        <SectionCard key={i} title={`Recall: ${rec.nhtsaCampaignNumber || `#${i+1}`}`} icon={AlertOctagon} color="red">
                          <InfoRow label="NHTSA Campaign" value={rec.nhtsaCampaignNumber} />
                          <InfoRow label="Manufacturer Campaign" value={rec.mfrCampaignNumber} />
                          <InfoRow label="Component" value={rec.component} />
                          <InfoRow label="Report Date" value={rec.reportReceivedDate} />
                          {rec.summary && <div className="mt-2 p-2 rounded-lg bg-slate-800/50"><p className="text-xs text-slate-300">{rec.summary}</p></div>}
                          {rec.consequence && <div className="mt-2 p-2 rounded-lg bg-red-500/10"><p className="text-xs text-red-300"><strong>Consequence:</strong> {rec.consequence}</p></div>}
                          {rec.remedy && <div className="mt-2 p-2 rounded-lg bg-emerald-500/10"><p className="text-xs text-emerald-300"><strong>Remedy:</strong> {rec.remedy}</p></div>}
                          {rec.notes && <div className="mt-2 p-2 rounded-lg bg-amber-500/10"><p className="text-xs text-amber-300">{rec.notes}</p></div>}
                        </SectionCard>
                      ))}
                    </div>
                  )}

                  {activeTab === 'recalls' && !r.recalls && (
                    <div className="p-6 text-center rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <p className="text-emerald-400 font-medium">No open recalls found for this VIN</p>
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

export default VINDecoderTool;
