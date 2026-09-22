import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEvidence } from '../../../context/EvidenceContext';
import { useActivity } from '../../../context/ActivityContext';
import { useCases } from '../../../context/CaseContext';
import {
  ArrowLeft,
  Search,
  Plus,
  Link2,
  Image,
  FileText,
  Globe,
  Mail,
  User,
  Phone,
  MapPin,
  Hash,
  Filter,
  Grid,
  List,
  ZoomIn,
  Download,
  Trash2,
  MoreVertical,
  Eye,
  Network,
  Clock,
  X,
  AlertTriangle,
  Tag,
  CheckCircle,
  Shield,
  Zap,
  Database
} from 'lucide-react';
import { sanitizeString, stringifySanitized } from '../../../utils/resultSanitizer';

const EvidenceBoard = () => {
  const { evidence, createEvidence, updateEvidence, deleteEvidence, verifyEvidence, addTag, removeTag, getStatistics } = useEvidence();
  const { logActivity, addNotification } = useActivity();
  const { cases } = useCases();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showCorrelationModal, setShowCorrelationModal] = useState(false);
  const [newEvidence, setNewEvidence] = useState({ type: 'ip', title: '', data: '', notes: '', caseId: '' });
  const [newTag, setNewTag] = useState('');

  const stats = getStatistics();
  const cleanText = (value, fallback = '') => sanitizeString(value || fallback || '');
  const cleanDataText = (value) => typeof value === 'string' ? sanitizeString(value) : stringifySanitized(value);

  const typeIcons = {
    ip: Globe,
    domain: Link2,
    email: Mail,
    image: Image,
    hash: Hash,
    user: User,
    tool_result: Database,
    data: Database,
    document: FileText,
    location: MapPin,
    phone: Phone
  };

  const typeColors = {
    ip: 'amber',
    domain: 'blue',
    email: 'purple',
    image: 'pink',
    hash: 'red',
    user: 'cyan',
    tool_result: 'cyan',
    data: 'amber',
    document: 'green',
    location: 'orange',
    phone: 'teal'
  };

  const types = ['all', 'tool_result', 'data', 'ip', 'domain', 'email', 'image', 'hash', 'user', 'document', 'location'];

  const filteredEvidence = evidence.filter(e => {
    const dataText = typeof e.data === 'string' ? sanitizeString(e.data) : stringifySanitized(e.data || '');
    const matchesSearch = sanitizeString(e.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dataText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.tags?.some(tag => sanitizeString(tag).toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Handle create evidence
  const handleCreateEvidence = () => {
    if (!newEvidence.title.trim() || !newEvidence.data.trim()) return;
    
    const result = createEvidence(newEvidence);
    if (result.success) {
      logActivity('Added new evidence', { evidenceId: result.evidence.id, type: 'evidence' });
      addNotification(`Evidence "${newEvidence.title}" added successfully`, 'success');
      setNewEvidence({ type: 'ip', title: '', data: '', notes: '', caseId: '' });
      setShowCreateModal(false);
    }
  };

  // Handle delete evidence
  const handleDeleteEvidence = (evidenceId) => {
    deleteEvidence(evidenceId);
    logActivity('Deleted evidence', { evidenceId, type: 'evidence' });
    addNotification('Evidence deleted successfully', 'warning');
    setShowDeleteModal(null);
    setSelectedEvidence(null);
  };

  // Handle verify evidence
  const handleVerifyEvidence = (evidenceId) => {
    verifyEvidence(evidenceId);
    logActivity('Verified evidence', { evidenceId, type: 'evidence' });
    addNotification('Evidence marked as verified', 'success');
    // Update selected evidence if it's the one being verified
    if (selectedEvidence?.id === evidenceId) {
      const updated = evidence.find(e => e.id === evidenceId);
      if (updated) setSelectedEvidence({ ...updated, verified: true });
    }
  };

  // Handle add tag
  const handleAddTag = (evidenceId, tag) => {
    if (!tag.trim()) return;
    addTag(evidenceId, tag.trim());
    setNewTag('');
  };

  // Handle remove tag
  const handleRemoveTag = (evidenceId, tag) => {
    removeTag(evidenceId, tag);
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.1), transparent 50%), radial-gradient(circle at 80% 50%, rgba(234, 88, 12, 0.1), transparent 50%)'
      }} />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />

      {/* Header */}
      <header className="relative z-40 border-b border-amber-900/30 bg-gray-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                to="/dashboard/user"
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-amber-400 font-mono">EVIDENCE BOARD</h1>
                <p className="text-xs text-gray-500 font-mono">Collected Investigation Data • {stats.total} Items</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowCorrelationModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-amber-500/30 transition-colors"
              >
                <Network className="w-4 h-4" />
                <span className="text-sm">View Correlations</span>
              </button>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-400 hover:to-orange-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">ADD EVIDENCE</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Evidence', value: stats.total, icon: FileText, color: 'amber' },
            { label: 'Total Correlations', value: stats.totalCorrelations, icon: Link2, color: 'blue' },
            { label: 'Verified Items', value: stats.verified, icon: CheckCircle, color: 'green' },
            { label: 'Evidence Types', value: stats.byType ? Object.keys(stats.byType).length : 0, icon: Grid, color: 'purple' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl p-4 bg-gray-900/50 border border-amber-500/20 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 text-${stat.color}-400/30`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 focus:border-amber-500/50 outline-none text-gray-300 text-sm"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              <Filter className="w-4 h-4 text-gray-500 mr-1" />
              {types.map(type => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                    typeFilter === type
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-amber-500/20 text-amber-400' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Evidence Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-3'}>
          <AnimatePresence>
            {filteredEvidence.map((item, index) => {
              const IconComponent = typeIcons[item.type] || FileText;
              const color = typeColors[item.type] || 'gray';
              
              return viewMode === 'grid' ? (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedEvidence(item)}
                  className="rounded-xl p-4 bg-gray-900/50 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center`}>
                      <IconComponent className={`w-5 h-5 text-${color}-400`} />
                    </div>
                    <div className="flex items-center gap-2">
                      {item.verified && <CheckCircle className="w-4 h-4 text-green-400" />}
                      <span className="text-xs font-mono text-gray-500">{item.id}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-medium text-gray-200 mb-1">{cleanText(item.title)}</h3>
                  <p className="text-xs text-amber-400 font-mono mb-2 truncate">{cleanDataText(item.data)}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{cleanText(item.notes)}</p>
                  
                  {/* Tags */}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                          {cleanText(tag)}
                        </span>
                      ))}
                      {item.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <span className="text-xs text-gray-500">{item.caseId}</span>
                    <div className="flex items-center gap-1">
                      <Link2 className="w-3 h-3 text-amber-400" />
                      <span className="text-xs text-amber-400">{item.correlations?.length || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => setSelectedEvidence(item)}
                  className="rounded-xl p-4 bg-gray-900/50 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group flex items-center gap-4 backdrop-blur-sm"
                >
                  <div className={`w-12 h-12 rounded-lg bg-${color}-500/10 border border-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`w-6 h-6 text-${color}-400`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-500">{item.id}</span>
                      <span className="text-xs font-mono text-amber-500">{item.caseId}</span>
                      {item.verified && <CheckCircle className="w-3 h-3 text-green-400" />}
                    </div>
                    <h3 className="text-sm font-medium text-gray-200">{cleanText(item.title)}</h3>
                    <p className="text-xs text-gray-500 truncate">{cleanText(item.notes)}</p>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-mono text-amber-400">{cleanDataText(item.data)}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Link2 className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{item.correlations?.length || 0} correlations</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(item);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredEvidence.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No evidence found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
            >
              Add Evidence
            </button>
          </motion.div>
        )}
      </main>

      {/* Create Evidence Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-900 rounded-2xl border border-amber-500/30 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-amber-400" />
                    Add New Evidence
                  </h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Evidence Type *</label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(typeIcons).map(([type, Icon]) => (
                      <button
                        key={type}
                        onClick={() => setNewEvidence({ ...newEvidence, type })}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          newEvidence.type === type
                            ? `bg-${typeColors[type]}-500/20 border-${typeColors[type]}-500/50 text-${typeColors[type]}-400`
                            : 'border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Title *</label>
                  <input
                    type="text"
                    value={newEvidence.title}
                    onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                    placeholder="Evidence title..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Evidence Data *</label>
                  <input
                    type="text"
                    value={newEvidence.data}
                    onChange={(e) => setNewEvidence({ ...newEvidence, data: e.target.value })}
                    placeholder="IP, domain, hash, etc..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Link to Case</label>
                  <select
                    value={newEvidence.caseId}
                    onChange={(e) => setNewEvidence({ ...newEvidence, caseId: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white cursor-pointer"
                  >
                    <option value="">No case link</option>
                    {cases.map(c => (
                      <option key={c._id || c.id} value={c._id || c.caseId || c.id}>{c.caseId || c.id} - {c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Notes</label>
                  <textarea
                    value={newEvidence.notes}
                    onChange={(e) => setNewEvidence({ ...newEvidence, notes: e.target.value })}
                    placeholder="Investigation notes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white resize-none"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvidence}
                  disabled={!newEvidence.title.trim() || !newEvidence.data.trim()}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Evidence
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 rounded-2xl border border-red-500/30 overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Delete Evidence?</h2>
                <p className="text-gray-400 mb-6">
                  Are you sure you want to delete "{showDeleteModal.title}"? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(null)}
                    className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteEvidence(showDeleteModal.id)}
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

      {/* Correlation View Modal */}
      <AnimatePresence>
        {showCorrelationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowCorrelationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-900 rounded-2xl border border-amber-500/30"
            >
              <div className="p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Network className="w-5 h-5 text-amber-400" />
                    Evidence Correlations
                  </h2>
                  <button onClick={() => setShowCorrelationModal(false)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {evidence.filter(e => e.correlations?.length > 0).map(item => (
                    <div key={item.id} className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                      <div className="flex items-center gap-3 mb-3">
                        {(() => {
                          const Icon = typeIcons[item.type];
                          return <Icon className={`w-5 h-5 text-${typeColors[item.type]}-400`} />;
                        })()}
                        <span className="font-medium text-gray-200">{cleanText(item.title)}</span>
                        <span className="text-xs text-amber-400 font-mono">{cleanDataText(item.data)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.correlations?.map((corr, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            → {corr}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {evidence.filter(e => e.correlations?.length > 0).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Network className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No correlations found yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evidence Detail Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedEvidence(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-gray-900 rounded-2xl border border-amber-500/30 overflow-hidden"
            >
              <div className="p-6 border-b border-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const Icon = typeIcons[selectedEvidence.type] || FileText;
                      const color = typeColors[selectedEvidence.type] || 'gray';
                      return (
                        <div className={`w-14 h-14 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-7 h-7 text-${color}-400`} />
                        </div>
                      );
                    })()}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500">{selectedEvidence.id}</span>
                        {selectedEvidence.verified && (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-white">{cleanText(selectedEvidence.title)}</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedEvidence(null)}
                    className="text-gray-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Data */}
                <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Evidence Data</p>
                  <p className="text-lg font-mono text-amber-400">{cleanDataText(selectedEvidence.data)}</p>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-gray-800/50">
                    <p className="text-xs text-gray-500">Case Reference</p>
                    <p className="text-sm font-mono text-amber-400">{selectedEvidence.caseId || 'Not linked'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-800/50">
                    <p className="text-xs text-gray-500">Collected</p>
                    <p className="text-sm text-gray-300">{formatTimeAgo(selectedEvidence.collected)}</p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">Investigation Notes</p>
                  <p className="text-sm text-gray-400">{cleanText(selectedEvidence.notes, 'No notes added')}</p>
                </div>

                {/* Tags */}
                <div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                    <Tag className="w-3 h-3" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedEvidence.tags?.map((tag, i) => (
                      <span 
                        key={i} 
                        className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1"
                      >
                        {cleanText(tag)}
                        <button 
                          onClick={() => handleRemoveTag(selectedEvidence.id, tag)}
                          className="hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag(selectedEvidence.id, newTag)}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white text-sm"
                    />
                    <button 
                      onClick={() => handleAddTag(selectedEvidence.id, newTag)}
                      className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Correlations */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-amber-400" />
                      <span className="text-sm font-mono text-amber-400">CORRELATIONS FOUND</span>
                    </div>
                    <span className="text-2xl font-bold text-amber-400">{selectedEvidence.correlations?.length || 0}</span>
                  </div>
                  {selectedEvidence.correlations?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedEvidence.correlations.map((corr, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded bg-gray-900/50 text-gray-300">
                          {corr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!selectedEvidence.verified && (
                    <button 
                      onClick={() => handleVerifyEvidence(selectedEvidence.id)}
                      className="flex-1 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold flex items-center justify-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Verify Evidence
                    </button>
                  )}
                  <button className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Correlations
                  </button>
                  <button className="px-4 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedEvidence(null);
                      setShowDeleteModal(selectedEvidence);
                    }}
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

export default EvidenceBoard;
