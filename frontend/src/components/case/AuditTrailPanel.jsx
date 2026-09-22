import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import {
  History, Clock, User, Target, Filter, Search,
  AlertTriangle, RefreshCw, ChevronDown, ChevronRight,
  FileText, GitBranch, Shield, Eye, Edit, Trash2, Upload, Download
} from 'lucide-react';
import caseService from '../../services/caseService';

const ACTION_ICONS = {
  case_created: FileText,
  case_exported: Download,
  evidence_added: Upload,
  evidence_review_updated: Eye,
  evidence_removed: Trash2,
  lead_updated: Edit,
  entity_verification_updated: Shield,
  branch_created: GitBranch,
  branch_transitioned: GitBranch,
  intelligence_refresh: RefreshCw,
};

const ACTION_COLORS = {
  case_created: 'text-green-400',
  case_exported: 'text-blue-400',
  evidence_added: 'text-cyan-400',
  evidence_review_updated: 'text-purple-400',
  evidence_removed: 'text-red-400',
  lead_updated: 'text-amber-400',
  entity_verification_updated: 'text-indigo-400',
  branch_created: 'text-orange-400',
  branch_transitioned: 'text-orange-400',
  intelligence_refresh: 'text-teal-400',
};

const AuditTrailPanel = memo(function AuditTrailPanel({ caseId }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());

  const fetchLogs = useCallback(async () => {
    try {
      const res = await caseService.getAuditLog(caseId);
      if (res.success) {
        setLogs(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const uniqueActions = useMemo(() => {
    const actions = new Set();
    logs.forEach(l => actions.add(l.action));
    return ['all', ...Array.from(actions).sort()];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterAction !== 'all' && log.action !== filterAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const searchable = [log.summary, log.actor, log.targetType, log.action].filter(Boolean).join(' ').toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [logs, filterAction, searchQuery]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const ActionIcon = ({ action }) => {
    const Icon = ACTION_ICONS[action] || History;
    return <Icon className={`w-4 h-4 ${ACTION_COLORS[action] || 'text-gray-400'}`} />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200">Audit Trail</h3>
          <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{total} entries</span>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 px-2 py-1 rounded text-[11px] transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 outline-none"
          />
        </div>
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-cyan-500/50 outline-none"
        >
          {uniqueActions.map(action => (
            <option key={action} value={action}>
              {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Log list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {searchQuery || filterAction !== 'all' ? 'No matching audit entries' : 'No audit entries yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredLogs.map(log => {
            const isExpanded = expandedRows.has(log._id);
            return (
              <div key={log._id} className="bg-gray-800/30 border border-gray-800/60 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleExpand(log._id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-gray-800/50 transition-colors text-left"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                  <ActionIcon action={log.action} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 truncate">{log.summary}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-600">{log.action.replace(/_/g, ' ')}</span>
                      {log.actor && (
                        <>
                          <span className="text-[10px] text-gray-700">•</span>
                          <User className="w-3 h-3 text-gray-600" />
                          <span className="text-[10px] text-gray-600">{log.actor}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-600 whitespace-nowrap">{formatTime(log.createdAt)}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-800/60 p-3 space-y-2">
                    {log.targetType && (
                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <Target className="w-3 h-3 text-gray-600" />
                        <span>{log.targetType}</span>
                        {log.targetId && <span className="text-gray-600">— {log.targetId}</span>}
                      </div>
                    )}
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Metadata</p>
                        <pre className="text-[10px] text-gray-500 bg-gray-900/50 rounded p-2 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.previousValue !== undefined && (
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="text-gray-500 shrink-0">From:</span>
                        <span className="text-gray-400 line-through">{typeof log.previousValue === 'object' ? JSON.stringify(log.previousValue).slice(0, 200) : String(log.previousValue)}</span>
                      </div>
                    )}
                    {log.newValue !== undefined && (
                      <div className="flex items-start gap-2 text-[11px]">
                        <span className="text-gray-500 shrink-0">To:</span>
                        <span className="text-cyan-400">{typeof log.newValue === 'object' ? JSON.stringify(log.newValue).slice(0, 200) : String(log.newValue)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[10px] text-gray-600 pt-1">
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      <span>{log.action.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default AuditTrailPanel;
