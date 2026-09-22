import { useState, useCallback, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Target, Filter, ArrowUpDown, CheckCircle, XCircle, AlertTriangle,
  Eye, RotateCcw, Trash2, Loader2, Search, ChevronDown, ChevronUp,
  ExternalLink, Activity, Clock, Shield, User, Globe, Mail, Phone,
  Hash, FileText, RefreshCw
} from 'lucide-react';
import caseService from '../../services/caseService';

const PRIORITY_COLORS = {
  critical: 'text-red-400 bg-red-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  medium: 'text-yellow-400 bg-yellow-500/10',
  low: 'text-gray-400 bg-gray-500/10',
};

const STATUS_COLORS = {
  new: 'text-blue-400 bg-blue-500/10',
  accepted: 'text-emerald-400 bg-emerald-500/10',
  investigating: 'text-amber-400 bg-amber-500/10',
  verified: 'text-green-400 bg-green-500/10',
  weak: 'text-orange-400 bg-orange-500/10',
  dead_end: 'text-red-400 bg-red-500/10',
  duplicate: 'text-purple-400 bg-purple-500/10',
  ignored: 'text-gray-500 bg-gray-600/10',
  resolved: 'text-gray-400 bg-gray-500/10',
};

const STATUS_OPTIONS = ['new', 'accepted', 'investigating', 'verified', 'weak', 'dead_end', 'duplicate', 'ignored', 'resolved'];
const PRIORITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

const LEAD_ICONS = {
  ip: Globe, domain: Globe, url: Globe, email: Mail, phone: Phone,
  username: User, crypto: Hash, person: User, organization: User,
  file: FileText, hash: Hash,
};

const LeadQueuePanel = memo(function LeadQueuePanel({ caseId }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [expandedId, setExpandedId] = useState(null);
  const [bulkStatus, setBulkStatus] = useState('');

  const loadLeads = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await caseService.getLeads(caseId);
      if (res?.success) {
        setLeads(res.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleGenerate = useCallback(async () => {
    if (!caseId) return;
    setGenerating(true);
    try {
      const res = await caseService.generateLeads(caseId);
      if (res?.success) {
        await loadLeads();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate leads');
    } finally {
      setGenerating(false);
    }
  }, [caseId, loadLeads]);

  const handleBulkUpdate = useCallback(async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    try {
      await caseService.bulkUpdateLeads(caseId, {
        leadIds: Array.from(selectedIds),
        status: bulkStatus,
      });
      setSelectedIds(new Set());
      setBulkStatus('');
      await loadLeads();
    } catch (err) {
      setError(err.message || 'Bulk update failed');
    }
  }, [caseId, selectedIds, bulkStatus, loadLeads]);

  const handleUpdateLead = useCallback(async (leadId, updates) => {
    try {
      await caseService.updateLead(caseId, leadId, updates);
      await loadLeads();
    } catch (err) {
      setError(err.message || 'Update failed');
    }
  }, [caseId, loadLeads]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(l => l._id)));
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortAsc(prev => !prev);
    else { setSortBy(field); setSortAsc(false); }
  };

  const filtered = leads
    .filter(l => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && l.priority !== priorityFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return l.value?.toLowerCase().includes(q) || l.entityType?.toLowerCase().includes(q) || l.recommendedAction?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const prioRank = { critical: 0, high: 1, medium: 2, low: 3 };
      const dir = sortAsc ? 1 : -1;
      if (sortBy === 'priority') return (prioRank[a.priority] - prioRank[b.priority]) * dir;
      if (sortBy === 'riskScore') return ((a.riskScore || 0) - (b.riskScore || 0)) * dir;
      if (sortBy === 'confidenceScore') return ((a.confidenceScore || 0) - (b.confidenceScore || 0)) * dir;
      if (sortBy === 'entityType') return (a.entityType || '').localeCompare(b.entityType || '') * dir;
      return 0;
    });

  const selectedEntityTypeCounts = {};
  leads.forEach(l => {
    selectedEntityTypeCounts[l.entityType] = (selectedEntityTypeCounts[l.entityType] || 0) + 1;
  });

  const statusCounts = {};
  leads.forEach(l => {
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200">Lead Queue</h3>
          {!loading && <span className="text-xs text-gray-500">({leads.length})</span>}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 bg-cyan-500/15 text-cyan-400 px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-cyan-500/25 disabled:opacity-40 transition-colors"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {generating ? 'Generating...' : 'Generate from Entities'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Status ({leads.length})</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s} ({statusCounts[s] || 0})</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Priority</option>
          {PRIORITY_OPTIONS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={toggleSort.bind(null, 'priority')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors ${sortBy === 'priority' ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'border-gray-700/50 text-gray-400 hover:text-gray-300'}`}
        >
          <ArrowUpDown className="w-3 h-3" />
          Priority
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 bg-cyan-500/5 border border-cyan-500/20 rounded-lg px-3 py-2">
          <span className="text-xs text-gray-300">{selectedIds.size} selected</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value)}
            className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50"
          >
            <option value="">Set status...</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={!bulkStatus}
            className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-[11px] hover:bg-cyan-500/30 disabled:opacity-40 transition-colors"
          >
            Apply
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-gray-500 hover:text-gray-300 px-2 py-1 rounded text-[11px] transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{leads.length === 0 ? 'No leads yet' : 'No leads match filters'}</p>
          {leads.length === 0 && (
            <button onClick={handleGenerate} disabled={generating} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
              {generating ? 'Generating...' : 'Generate leads from entities'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Select All</span>
            </label>
          </div>
          {filtered.map((lead) => {
            const LeadIcon = LEAD_ICONS[lead.entityType] || Activity;
            const isExpanded = expandedId === lead._id;
            return (
              <motion.div
                key={lead._id}
                layout
                initial={false}
                className="bg-gray-800/30 border border-gray-700/30 rounded-lg overflow-hidden hover:border-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 p-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead._id)}
                    onChange={() => toggleSelect(lead._id)}
                    className="rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500/30 w-3.5 h-3.5 shrink-0"
                  />
                  <LeadIcon className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-200 font-medium truncate">{lead.value}</span>
                      <span className="text-[10px] text-gray-500">{lead.entityType}</span>
                    </div>
                    {lead.recommendedAction && (
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{lead.recommendedAction}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.medium}`}>
                      {lead.priority}
                    </span>
                    <select
                      value={lead.status}
                      onChange={e => handleUpdateLead(lead._id, { status: e.target.value })}
                      className={`text-[10px] px-1.5 py-0.5 rounded border-0 cursor-pointer ${STATUS_COLORS[lead.status] || STATUS_COLORS.new}`}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : lead._id)}
                      className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-2.5 pb-2.5 pt-0 border-t border-gray-700/20">
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {lead.confidenceScore !== undefined && (
                        <div className="text-center">
                          <p className="text-sm font-bold text-gray-200">{lead.confidenceScore}</p>
                          <p className="text-[10px] text-gray-500">Confidence</p>
                        </div>
                      )}
                      {lead.riskScore !== undefined && (
                        <div className="text-center">
                          <p className={`text-sm font-bold ${lead.riskScore >= 70 ? 'text-red-400' : lead.riskScore >= 40 ? 'text-orange-400' : 'text-gray-400'}`}>{lead.riskScore}</p>
                          <p className="text-[10px] text-gray-500">Risk</p>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-400">{lead.sourceTool || '—'}</p>
                        <p className="text-[10px] text-gray-500">Source Tool</p>
                      </div>
                    </div>
                    {lead.reason && (
                      <p className="text-[10px] text-gray-500 mt-1.5">{lead.reason}</p>
                    )}
                    {lead.suggestedTools?.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-600">Tools:</span>
                        {lead.suggestedTools.map(t => (
                          <span key={t} className="text-[10px] text-cyan-400/70 bg-cyan-500/10 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                    )}
                    {lead.discoveryPath?.length > 0 && (
                      <div className="mt-1.5">
                        <p className="text-[10px] text-gray-600 mb-0.5">Discovery Path:</p>
                        {lead.discoveryPath.map((step, i) => (
                          <span key={i} className="text-[10px] text-gray-500">{i > 0 && ' → '}{step.type}: {step.value}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default LeadQueuePanel;
