import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  GitCompare, ArrowRight, Loader2, Search, AlertTriangle,
  CheckCircle, XCircle, ArrowUp, ArrowDown, Minus,
  FileText, Users, Activity, Clock
} from 'lucide-react';
import caseService from '../../services/caseService';

const CaseComparePanel = memo(function CaseComparePanel({ caseId, caseTitle }) {
  const [otherCaseId, setOtherCaseId] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = useCallback(async () => {
    if (!otherCaseId.trim()) return;
    setLoading(true);
    setError(null);
    setComparison(null);
    try {
      const res = await caseService.compareCases(caseId, otherCaseId.trim());
      if (res?.success) {
        setComparison(res.data);
      } else {
        setError(res?.error || 'Comparison failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to compare cases');
    } finally {
      setLoading(false);
    }
  }, [caseId, otherCaseId]);

  const DeltaBadge = ({ value, label, inverse }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    const Icon = isNeutral ? Minus : isPositive ? ArrowUp : ArrowDown;
    const color = inverse
      ? (isPositive ? 'text-red-400' : isNeutral ? 'text-gray-500' : 'text-green-400')
      : (isPositive ? 'text-green-400' : isNeutral ? 'text-gray-500' : 'text-red-400');
    return (
      <div className="text-center p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
        <div className={`flex items-center justify-center gap-1 ${color}`}>
          <Icon className="w-4 h-4" />
          <span className="text-lg font-bold">{isNeutral ? '—' : `${isPositive ? '+' : ''}${value}`}</span>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
      </div>
    );
  };

  const EntityList = ({ entities, label, icon: Icon, color }) => {
    if (!entities || entities.length === 0) return null;
    return (
      <div className="mt-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Icon className={`w-3.5 h-3.5 ${color}`} />
          <span className="text-xs text-gray-400">{label} ({entities.length})</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {entities.map((e, i) => (
            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded ${color.replace('text-', 'bg-')}/10 border border-${color.replace('text-', '')}/20 ${color}`}>
              {e.value}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <GitCompare className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-gray-200">Case Compare</h3>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Current Case</p>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2">
            <p className="text-xs text-gray-300 truncate">{caseTitle || caseId || 'Unknown'}</p>
            <p className="text-[10px] text-gray-600">{caseId}</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-600 mb-2" />
        <div className="flex-1">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Compare With</p>
          <input
            type="text"
            value={otherCaseId}
            onChange={e => setOtherCaseId(e.target.value)}
            placeholder="Case ID or _id..."
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            onKeyDown={e => e.key === 'Enter' && handleCompare()}
          />
        </div>
        <button
          onClick={handleCompare}
          disabled={loading || !otherCaseId.trim()}
          className="flex items-center gap-1.5 bg-cyan-500/15 text-cyan-400 px-3 py-2 rounded-lg text-[11px] font-medium hover:bg-cyan-500/25 disabled:opacity-40 transition-colors mb-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitCompare className="w-3.5 h-3.5" />}
          Compare
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {comparison && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-400 mb-1">{comparison.caseA?.title || 'Case A'}</p>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400">Status: {comparison.caseA?.status} | Priority: {comparison.caseA?.priority}</p>
                <p className="text-[10px] text-gray-400">Progress: {comparison.caseA?.progress}% | Risk: {comparison.caseA?.riskScore}</p>
                <p className="text-[10px] text-gray-400">Evidence: {comparison.caseA?.evidenceCount}</p>
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
              <p className="text-xs font-medium text-emerald-400 mb-1">{comparison.caseB?.title || 'Case B'}</p>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400">Status: {comparison.caseB?.status} | Priority: {comparison.caseB?.priority}</p>
                <p className="text-[10px] text-gray-400">Progress: {comparison.caseB?.progress}% | Risk: {comparison.caseB?.riskScore}</p>
                <p className="text-[10px] text-gray-400">Evidence: {comparison.caseB?.evidenceCount}</p>
              </div>
            </div>
          </div>

          {comparison.summary && (
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-300">{comparison.summary}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <DeltaBadge value={comparison.diffs?.riskScoreDelta} label="Risk Delta" inverse />
            <DeltaBadge value={comparison.diffs?.confidenceScoreDelta} label="Confidence Delta" inverse={false} />
            <DeltaBadge value={comparison.diffs?.progressDelta} label="Progress Delta" />
            <DeltaBadge value={comparison.diffs?.evidenceDelta} label="Evidence Delta" />
          </div>

          {comparison.entities && (
            <div className="bg-gray-800/20 border border-gray-700/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-300">
                  Entities: A ({comparison.entities.totalA}) vs B ({comparison.entities.totalB})
                </span>
                <span className="text-xs text-cyan-400">| {comparison.entities.shared} shared</span>
              </div>
              <EntityList entities={comparison.entities.sharedEntities} label="Shared Entities" icon={CheckCircle} color="text-cyan-400" />
              <EntityList entities={comparison.entities.onlyA} label="Unique to Case A" icon={ArrowUp} color="text-blue-400" />
              <EntityList entities={comparison.entities.onlyB} label="Unique to Case B" icon={ArrowDown} color="text-emerald-400" />
            </div>
          )}
        </motion.div>
      )}

      {!comparison && !loading && !error && (
        <div className="text-center py-12">
          <GitCompare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Enter a Case ID to compare</p>
          <p className="text-gray-600 text-xs mt-1">Compare entities, risk scores, and evidence counts</p>
        </div>
      )}
    </div>
  );
});

export default CaseComparePanel;
