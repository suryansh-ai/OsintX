import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FolderOpen, Search, Clock, AlertTriangle,
  Target, FileText, Filter, Plus, MoreVertical, Eye,
  Archive, Trash2, X, CheckCircle, Pause, Play
} from 'lucide-react';
import { useCases } from '../../../context/CaseContext';

const CaseFiles = () => {
  const navigate = useNavigate();
  const {
    cases, isLoading, createCase, updateCase, deleteCase, getStatistics
  } = useCases();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [newCase, setNewCase] = useState({ title: '', description: '', priority: 'medium' });
  const [creating, setCreating] = useState(false);

  const stats = getStatistics();

  const statusColors = {
    active: 'bg-green-500',
    paused: 'bg-amber-500',
    completed: 'bg-gray-500',
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.caseId || c.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatTimeAgo = (ts) => {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7) return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
  };

  const handleCreate = async () => {
    if (!newCase.title.trim()) return;
    setCreating(true);
    await createCase(newCase);
    setNewCase({ title: '', description: '', priority: 'medium' });
    setShowCreateModal(false);
    setCreating(false);
  };

  const handleDelete = async (caseId) => {
    await deleteCase(caseId);
    setShowDeleteModal(null);
    if (selectedCase?.id === caseId || selectedCase?._id === caseId) setSelectedCase(null);
  };

  const handleStatusChange = async (caseId, status) => {
    await updateCase(caseId, { status });
    if (selectedCase?.id === caseId || selectedCase?._id === caseId) {
      setSelectedCase(prev => ({ ...prev, status }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      <div className="absolute inset-0 investigation-grid-student opacity-30" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-signal-pulse" />

      {/* Restriction Banner */}
      <div className="relative z-50 bg-cyan-950/80 border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-300 text-sm font-mono">
            CASE FILES: Limited correlation data • Export restrictions apply
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-40 border-b border-cyan-900/50 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-cyan-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-cyan-400 font-mono">CASE FILES</h1>
                <p className="text-xs text-gray-500 font-mono">Investigation Records • {stats.total} Total</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-mono">NEW CASE</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Active Cases',      value: stats.active,         color: 'green' },
            { label: 'Paused',            value: stats.paused,         color: 'amber' },
            { label: 'Completed',         value: stats.completed,      color: 'gray' },
            { label: 'Total Data Points', value: stats.totalDataPoints, color: 'cyan' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-student rounded-xl p-4 border border-cyan-500/20"
            >
              <p className="text-xs text-gray-500 font-mono mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 focus:border-cyan-500/50 outline-none text-gray-300 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            {['all', 'active', 'paused', 'completed'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  statusFilter === s
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Cases List */}
        {!isLoading && (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredCases.map((caseItem, index) => (
                <motion.div
                  key={caseItem._id || caseItem.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.04 }}
                  className="glass-student rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-500/50 transition-all cursor-pointer group"
                  onClick={() => setSelectedCase(caseItem)}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon + status dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                        <FolderOpen className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${statusColors[caseItem.status] || 'bg-gray-500'} ${caseItem.status === 'active' ? 'animate-pulse' : ''}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-cyan-500">{caseItem.caseId || caseItem.id}</span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          caseItem.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          caseItem.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {caseItem.status?.toUpperCase()}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                          caseItem.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                          caseItem.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {caseItem.priority?.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-200 mt-1 truncate">{caseItem.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(caseItem.lastActivity)}
                        </span>
                        {caseItem.description && (
                          <span className="text-xs text-gray-600 truncate max-w-xs hidden md:block">
                            {caseItem.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-500">Data Points</div>
                      <div className="text-lg font-bold text-cyan-400">{caseItem.dataPoints || 0}</div>
                      <div className="text-xs text-amber-400 mt-0.5">{caseItem.evidence?.length || 0} evidence</div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedCase(caseItem)}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-cyan-400 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(caseItem)}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredCases.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <FolderOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchQuery || statusFilter !== 'all' ? 'No cases match your filters' : 'No cases yet'}
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors"
                >
                  Create First Case
                </button>
              </motion.div>
            )}
          </div>
        )}
      </main>

      {/* ── Create Case Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 rounded-2xl border border-cyan-500/30 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" /> New Case
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Case Title *</label>
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="Enter case title..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500/50 outline-none text-white"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description</label>
                  <textarea
                    value={newCase.description}
                    onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                    placeholder="Describe the investigation..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-cyan-500/50 outline-none text-white resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Priority</label>
                  <div className="flex gap-3">
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        onClick={() => setNewCase({ ...newCase, priority: p })}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                          newCase.priority === p
                            ? p === 'high' ? 'bg-red-500/20 border-red-500/50 text-red-400'
                              : p === 'medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                              : 'bg-green-500/20 border-green-500/50 text-green-400'
                            : 'border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newCase.title.trim() || creating}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Case'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-2xl border border-red-500/30 overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Delete Case?</h2>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete "{showDeleteModal.title}"? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteModal._id || showDeleteModal.id)}
                    className="flex-1 py-3 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Case Detail Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedCase(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl glass-student rounded-2xl border border-cyan-500/30 overflow-hidden max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-cyan-500/20 sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-cyan-500">{selectedCase.caseId || selectedCase.id}</span>
                    <h2 className="text-xl font-bold text-white mt-1">{selectedCase.title}</h2>
                  </div>
                  <button onClick={() => setSelectedCase(null)} className="text-gray-500 hover:text-white p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status / Priority / Dates */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-gray-900/50">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className={`text-sm font-mono ${
                      selectedCase.status === 'active' ? 'text-green-400' :
                      selectedCase.status === 'paused' ? 'text-amber-400' : 'text-gray-400'
                    }`}>{selectedCase.status?.toUpperCase()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/50">
                    <p className="text-xs text-gray-500 mb-1">Priority</p>
                    <p className={`text-sm font-mono ${
                      selectedCase.priority === 'high' ? 'text-red-400' :
                      selectedCase.priority === 'medium' ? 'text-amber-400' : 'text-green-400'
                    }`}>{selectedCase.priority?.toUpperCase()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-900/50">
                    <p className="text-xs text-gray-500 mb-1">Last Activity</p>
                    <p className="text-sm text-gray-300">{formatTimeAgo(selectedCase.lastActivity)}</p>
                  </div>
                </div>

                {/* Description */}
                {selectedCase.description && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-mono">DESCRIPTION</p>
                    <p className="text-sm text-gray-300">{selectedCase.description}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <Target className="w-5 h-5 text-cyan-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedCase.dataPoints || 0}</p>
                    <p className="text-xs text-gray-500">Data Points</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <FileText className="w-5 h-5 text-amber-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedCase.evidence?.length || 0}</p>
                    <p className="text-xs text-gray-500">Evidence Items</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-cyan-400">{selectedCase.progress || 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                      style={{ width: `${selectedCase.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Recent Timeline */}
                {selectedCase.timeline?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2 font-mono">RECENT ACTIVITY</p>
                    <div className="space-y-2">
                      {selectedCase.timeline.slice(-4).reverse().map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 flex-shrink-0" />
                          <span className="text-gray-400 flex-1">{item.event}</span>
                          <span className="text-gray-600">{formatTimeAgo(item.time)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Field Restriction Notice */}
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-mono text-amber-400">FIELD ACCESS NOTICE</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Case data is limited to single-layer correlation. Full analysis requires elevated access.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedCase.status !== 'active' && (
                    <button
                      onClick={() => handleStatusChange(selectedCase._id || selectedCase.id, 'active')}
                      className="flex-1 py-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 font-bold flex items-center justify-center gap-2 hover:bg-green-500/30 transition-colors"
                    >
                      <Play className="w-4 h-4" /> Activate
                    </button>
                  )}
                  {selectedCase.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(selectedCase._id || selectedCase.id, 'paused')}
                      className="flex-1 py-3 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center gap-2 hover:bg-amber-500/30 transition-colors"
                    >
                      <Pause className="w-4 h-4" /> Pause
                    </button>
                  )}
                  {selectedCase.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(selectedCase._id || selectedCase.id, 'completed')}
                      className="flex-1 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center gap-2 hover:bg-cyan-500/30 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Complete
                    </button>
                  )}
                  <button
                    onClick={() => { setShowDeleteModal(selectedCase); setSelectedCase(null); }}
                    className="px-4 py-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CaseFiles;
