import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Plus, Play, CheckCircle, AlertCircle, XCircle,
  SkipForward, RefreshCw, MessageSquare, Clock, ChevronDown,
  ChevronRight, AlertTriangle, Eye, RotateCcw
} from 'lucide-react';
import caseService from '../../services/caseService';

const STATE_CONFIG = {
  not_started:    { label: 'Not Started',    icon: GitBranch,    color: 'text-gray-400',  bg: 'bg-gray-500/10',   border: 'border-gray-500/30' },
  running:        { label: 'Running',        icon: Play,         color: 'text-blue-400',  bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  findings_found: { label: 'Findings Found', icon: AlertCircle,  color: 'text-amber-400', bg: 'bg-amber-500/10',  border: 'border-amber-500/30' },
  needs_review:   { label: 'Needs Review',   icon: Eye,          color: 'text-orange-400',bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  verified:       { label: 'Verified',       icon: CheckCircle,  color: 'text-green-400', bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  dead_end:       { label: 'Dead End',       icon: XCircle,      color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30' },
  duplicate_loop: { label: 'Duplicate Loop', icon: RotateCcw,    color: 'text-purple-400',bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  failed:         { label: 'Failed',         icon: AlertTriangle,color: 'text-red-400',   bg: 'bg-red-500/10',   border: 'border-red-500/30' },
  skipped:        { label: 'Skipped',         icon: SkipForward,  color: 'text-gray-500',  bg: 'bg-gray-600/10',  border: 'border-gray-600/30' },
};

const TRANSITION_OPTIONS = {
  not_started:    [{ to: 'running', label: 'Start', icon: Play }],
  running:        [{ to: 'findings_found', label: 'Findings Found', icon: AlertCircle }, { to: 'dead_end', label: 'Dead End', icon: XCircle }, { to: 'duplicate_loop', label: 'Duplicate Loop', icon: RotateCcw }, { to: 'failed', label: 'Failed', icon: AlertTriangle }, { to: 'needs_review', label: 'Needs Review', icon: Eye }],
  findings_found: [{ to: 'needs_review', label: 'Needs Review', icon: Eye }, { to: 'verified', label: 'Verified', icon: CheckCircle }, { to: 'dead_end', label: 'Dead End', icon: XCircle }],
  needs_review:   [{ to: 'verified', label: 'Verified', icon: CheckCircle }, { to: 'dead_end', label: 'Dead End', icon: XCircle }, { to: 'running', label: 'Reopen', icon: Play }],
  verified:       [{ to: 'needs_review', label: 'Reopen Review', icon: Eye }],
  dead_end:       [{ to: 'running', label: 'Reopen', icon: Play }],
  duplicate_loop: [{ to: 'running', label: 'Reopen', icon: Play }],
  failed:         [{ to: 'running', label: 'Retry', icon: RefreshCw }],
  skipped:        [{ to: 'running', label: 'Reopen', icon: Play }],
};

const InvestigationBranchPanel = memo(function InvestigationBranchPanel({ caseId }) {
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, needsReview: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedBranches, setExpandedBranches] = useState(new Set());
  const [newBranch, setNewBranch] = useState({ label: '', description: '', entityType: '', entityValue: '', toolName: '', query: '' });
  const [transitionReason, setTransitionReason] = useState('');
  const [transitioningBranch, setTransitioningBranch] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await caseService.getBranches(caseId);
      if (res.success) {
        setBranches(res.data || []);
        setStats(res.stats || { total: 0, active: 0, needsReview: 0 });
      }
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleCreate = useCallback(async () => {
    if (!newBranch.label.trim()) return;
    try {
      const res = await caseService.createBranch(caseId, newBranch);
      if (res.success) {
        setShowCreate(false);
        setNewBranch({ label: '', description: '', entityType: '', entityValue: '', toolName: '', query: '' });
        fetchBranches();
      }
    } catch (err) {
      console.error('Failed to create branch:', err);
    }
  }, [caseId, newBranch, fetchBranches]);

  const handleTransition = useCallback(async (branchId, toState) => {
    try {
      const res = await caseService.transitionBranch(caseId, branchId, toState, transitionReason);
      if (res.success) {
        setTransitioningBranch(null);
        setTransitionReason('');
        fetchBranches();
      }
    } catch (err) {
      console.error('Failed to transition branch:', err);
    }
  }, [caseId, transitionReason, fetchBranches]);

  const toggleExpand = (id) => {
    setExpandedBranches(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const branchesByState = useMemo(() => {
    const groups = {};
    branches.forEach(b => {
      const state = b.state || 'not_started';
      if (!groups[state]) groups[state] = [];
      groups[state].push(b);
    });
    return groups;
  }, [branches]);

  const StateIcon = ({ state }) => {
    const cfg = STATE_CONFIG[state] || STATE_CONFIG.not_started;
    const Icon = cfg.icon;
    return <Icon className={`w-4 h-4 ${cfg.color}`} />;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-gray-200">Investigation Branches</h3>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 bg-cyan-500/15 text-cyan-400 px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-cyan-500/25 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Branch
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-gray-200">{stats.total}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-blue-400">{stats.active}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Active</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-orange-400">{stats.needsReview}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Needs Review</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{stats.completed || 0}</p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Completed</p>
        </div>
      </div>

      {/* Branch list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12">
          <GitBranch className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No investigation branches yet</p>
          <p className="text-gray-600 text-xs mt-1">Create a branch to track your investigation path</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(branchesByState).map(([state, stateBranches]) => (
            <div key={state}>
              <div className="flex items-center gap-2 mb-2">
                <StateIcon state={state} />
                <span className={`text-xs font-medium ${(STATE_CONFIG[state] || STATE_CONFIG.not_started).color}`}>
                  {(STATE_CONFIG[state] || STATE_CONFIG.not_started).label}
                </span>
                <span className="text-[10px] text-gray-600">({stateBranches.length})</span>
              </div>
              <div className="space-y-1.5">
                {stateBranches.map(branch => {
                  const cfg = STATE_CONFIG[branch.state] || STATE_CONFIG.not_started;
                  const isExpanded = expandedBranches.has(branch._id);
                  const transitions = TRANSITION_OPTIONS[branch.state] || [];
                  return (
                    <div key={branch._id} className={`bg-gray-800/40 border ${cfg.border} rounded-lg overflow-hidden`}>
                      <button
                        onClick={() => toggleExpand(branch._id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-800/60 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">{branch.label}</p>
                            <p className="text-[10px] text-gray-500">
                              {branch.entityType && branch.entityValue ? `${branch.entityType}: ${branch.entityValue}` : branch.toolName || 'Manual branch'}
                              {branch.depth > 0 ? ` (depth ${branch.depth})` : ''}
                            </p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium ${cfg.color} shrink-0 ml-2`}>
                          {cfg.label}
                        </span>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-800/60">
                            <div className="p-3 space-y-3">
                              {branch.description && (
                                <p className="text-xs text-gray-400">{branch.description}</p>
                              )}

                              {/* Transition history */}
                              {branch.transitionHistory?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wider">History</p>
                                  <div className="space-y-1">
                                    {branch.transitionHistory.map((t, i) => (
                                      <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <Clock className="w-3 h-3 shrink-0" />
                                        <span className={STATE_CONFIG[t.fromState]?.color || ''}>{STATE_CONFIG[t.fromState]?.label || t.fromState}</span>
                                        <span className="text-gray-600">→</span>
                                        <span className={STATE_CONFIG[t.toState]?.color || ''}>{STATE_CONFIG[t.toState]?.label || t.toState}</span>
                                        {t.reason && <span className="text-gray-600">— {t.reason}</span>}
                                        <span className="text-gray-700 ml-auto">{new Date(t.transitionedAt).toLocaleDateString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Findings */}
                              {branch.findings?.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-gray-500 font-medium mb-1 uppercase tracking-wider">Findings ({branch.findings.length})</p>
                                  <div className="space-y-1">
                                    {branch.findings.map((f, i) => (
                                      <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                                        <MessageSquare className="w-3 h-3 text-gray-600 mt-0.5 shrink-0" />
                                        <span>{f}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Transition buttons */}
                              {transitions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {transitions.map(t => (
                                    <button
                                      key={t.to}
                                      onClick={() => setTransitioningBranch({ id: branch._id, toState: t.to, label: t.label })}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors"
                                    >
                                      <t.icon className="w-3 h-3" />
                                      {t.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-gray-900 border border-gray-800 rounded-xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h4 className="text-sm font-semibold text-gray-200 mb-4">New Investigation Branch</h4>
              <div className="space-y-3">
                <input
                  value={newBranch.label}
                  onChange={e => setNewBranch(p => ({ ...p, label: e.target.value }))}
                  placeholder="Branch label (required)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                />
                <textarea
                  value={newBranch.description}
                  onChange={e => setNewBranch(p => ({ ...p, description: e.target.value }))}
                  placeholder="Description"
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 outline-none resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newBranch.entityType}
                    onChange={e => setNewBranch(p => ({ ...p, entityType: e.target.value }))}
                    placeholder="Entity type (e.g. email)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                  />
                  <input
                    value={newBranch.entityValue}
                    onChange={e => setNewBranch(p => ({ ...p, entityValue: e.target.value }))}
                    placeholder="Entity value"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                  />
                </div>
                <input
                  value={newBranch.toolName}
                  onChange={e => setNewBranch(p => ({ ...p, toolName: e.target.value }))}
                  placeholder="Tool name (optional)"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newBranch.label.trim()}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Create Branch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition reason modal */}
      <AnimatePresence>
        {transitioningBranch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setTransitioningBranch(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-gray-900 border border-gray-800 rounded-xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
              <h4 className="text-sm font-semibold text-gray-200 mb-2">Transition to {transitioningBranch.label}</h4>
              <p className="text-xs text-gray-500 mb-3">Add a reason for this transition (optional)</p>
              <input
                value={transitionReason}
                onChange={e => setTransitionReason(e.target.value)}
                placeholder="Reason for transition..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500/50 outline-none"
                autoFocus
              />
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setTransitioningBranch(null)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleTransition(transitioningBranch.id, transitioningBranch.toState);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default InvestigationBranchPanel;
