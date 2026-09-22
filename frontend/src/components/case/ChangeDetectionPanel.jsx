import { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  GitCompare, AlertTriangle, Info, CheckCircle,
  ArrowUp, ArrowDown, RefreshCw, FileText, Clock
} from 'lucide-react';
import caseService from '../../services/caseService';

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
};

const SEVERITY_COLORS = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  warning: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  info: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  success: 'text-green-400 bg-green-500/10 border-green-500/30',
};

const ChangeDetectionPanel = memo(function ChangeDetectionPanel({ caseId }) {
  const [changes, setChanges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previousSnapshot, setPreviousSnapshot] = useState(null);

  const captureSnapshot = useCallback(() => {
    const evidence = window.__caseData?.evidence || [];
    const entities = window.__caseData?.entitiesSnapshot || [];
    const toolResults = window.__caseData?.toolResults || [];
    return { entities, evidence, toolResults };
  }, []);

  const handleCompare = useCallback(async () => {
    setLoading(true);
    try {
      const currentSnapshot = captureSnapshot();
      if (!previousSnapshot) {
        setPreviousSnapshot(currentSnapshot);
        setChanges([]);
        setSummary({ total: 0, newEntities: 0, entityUpdates: 0, newEvidence: 0, newToolResults: 0, warnings: 0 });
        return;
      }
      const res = await caseService.detectChanges(caseId, {
        previousSnapshots: previousSnapshot,
        currentSnapshots: currentSnapshot,
      });
      if (res.success) {
        setChanges(res.data.changes || []);
        setSummary(res.data.summary);
        setPreviousSnapshot(currentSnapshot);
      }
    } catch (err) {
      console.error('Change detection failed:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, previousSnapshot, captureSnapshot]);

  const handleReset = useCallback(() => {
    setPreviousSnapshot(null);
    setChanges([]);
    setSummary(null);
  }, []);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const SeverityIcon = ({ severity }) => {
    const Icon = SEVERITY_ICONS[severity] || Info;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200">Change Detection</h3>
        </div>
        <div className="flex items-center gap-2">
          {previousSnapshot && (
            <button
              onClick={handleReset}
              className="text-[11px] text-gray-500 hover:text-gray-300 px-2 py-1 rounded transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={handleCompare}
            disabled={loading}
            className="flex items-center gap-1.5 bg-cyan-500/15 text-cyan-400 px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-cyan-500/25 disabled:opacity-40 transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <GitCompare className="w-3.5 h-3.5" />
            )}
            {previousSnapshot ? 'Compare Now' : 'Capture Baseline'}
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-5 gap-2">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-200">{summary.total}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Changes</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-blue-400">{summary.newEntities}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">New Entities</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-purple-400">{summary.entityUpdates}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Updates</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-amber-400">{summary.newEvidence}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">New Evidence</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <p className={`text-lg font-bold ${summary.warnings > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {summary.warnings}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Warnings</p>
          </div>
        </div>
      )}

      {/* No baseline */}
      {!previousSnapshot && !summary && (
        <div className="text-center py-12">
          <GitCompare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No baseline captured yet</p>
          <p className="text-gray-600 text-xs mt-1">Click "Capture Baseline" to save the current state, then run tools and compare</p>
        </div>
      )}

      {/* Baseline captured, no changes */}
      {previousSnapshot && changes.length === 0 && !loading && (
        <div className="text-center py-8">
          <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No changes detected since baseline</p>
          <p className="text-gray-600 text-xs mt-1">Run tools or add evidence, then click "Compare Now"</p>
        </div>
      )}

      {/* Change list */}
      {changes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              Detected at {summary?.timestamp ? formatTime(summary.timestamp) : 'now'}
            </p>
          </div>
          {changes.map((change, index) => {
            const Icon = change.type === 'new_entity' ? ArrowUp
              : change.type === 'risk_score_changed' ? (change.newValue > change.previousValue ? ArrowUp : ArrowDown)
              : change.type === 'new_evidence' ? FileText
              : change.type === 'new_tool_result' ? Clock
              : Info;
            const severityClass = SEVERITY_COLORS[change.severity] || SEVERITY_COLORS.info;
            return (
              <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${severityClass}`}>
                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-200">{change.summary}</p>
                  {change.previousValue !== undefined && change.newValue !== undefined && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span className="line-through">{typeof change.previousValue === 'object' ? JSON.stringify(change.previousValue).slice(0, 80) : change.previousValue}</span>
                      <ArrowUp className="w-3 h-3 text-gray-600" />
                      <span>{typeof change.newValue === 'object' ? JSON.stringify(change.newValue).slice(0, 80) : change.newValue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-600">{change.type.replace(/_/g, ' ')}</span>
                    {change.entityType && <span className="text-[10px] text-gray-600">{change.entityType}: {change.entityValue}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ChangeDetectionPanel;
