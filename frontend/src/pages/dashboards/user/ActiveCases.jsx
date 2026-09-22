import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useCases } from '../../../context/CaseContext';
import { useActivity } from '../../../context/ActivityContext';
import { useCredits } from '../../../context/CreditContext';
import { KanbanBoard, CaseTemplates } from '../../../components/case';
import {
  ArrowLeft,
  FolderOpen,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Archive,
  Share2,
  Target,
  Clock,
  BarChart3,
  TrendingUp,
  X,
  Edit,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  Zap,
  Layout,
  List,
  Grid
} from 'lucide-react';

const ActiveCases = () => {
  const navigate = useNavigate();
  const { cases, createCase, updateCase, deleteCase, getStatistics } = useCases();
  const { logActivity, addNotification } = useActivity();
  const { credits } = useCredits();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'kanban', 'templates'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showMenuFor, setShowMenuFor] = useState(null);
  const [newCase, setNewCase] = useState({ title: '', description: '', priority: 'medium' });

  const stats = getStatistics();

  const priorityColors = {
    high: 'text-red-400 bg-red-500/10 border-red-500/30',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    low: 'text-green-400 bg-green-500/10 border-green-500/30'
  };

  const statusColors = {
    active: 'text-green-400 bg-green-500/20 border-green-500/30',
    paused: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
    completed: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
  };

  const statusIcons = {
    active: Play,
    paused: Pause,
    completed: CheckCircle
  };

  // Filter and sort cases
  const filteredCases = cases
    .filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'progress':
          return b.progress - a.progress;
        case 'recent':
        default:
          return new Date(b.lastActivity) - new Date(a.lastActivity);
      }
    });

  // Handle create case
  const handleCreateCase = async () => {
    if (!newCase.title.trim()) return;
    const title = newCase.title;
    const result = await createCase(newCase);
    setNewCase({ title: '', description: '', priority: 'medium' });
    setShowCreateModal(false);
    if (result.success) {
      logActivity('Created new case', { caseId: result.case.id || result.case._id, type: 'case' });
      addNotification(`New case "${title}" created successfully`, 'success');
    } else {
      addNotification(result.error || 'Failed to create case', 'error');
    }
  };

  // Handle status change
  const handleStatusChange = (caseId, newStatus) => {
    updateCase(caseId, { status: newStatus });
    logActivity(`Changed case status to ${newStatus}`, { caseId, type: 'case' });
    addNotification(`Case status updated to ${newStatus}`, 'info');
    setShowMenuFor(null);
  };

  // Handle delete case
  const handleDeleteCase = (caseId) => {
    deleteCase(caseId);
    logActivity('Deleted case', { caseId, type: 'case' });
    addNotification('Case deleted successfully', 'warning');
    setShowDeleteModal(null);
  };

  // Handle view case - navigate to detail page
  const handleViewCase = (caseItem) => {
    const id = caseItem._id || caseItem.caseId || caseItem.id;
    navigate(`/dashboard/user/cases/${id}`);
    logActivity('Viewed case details', { caseId: id, type: 'view' });
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/dashboard/user"
                className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-amber-400 font-mono">ACTIVE CASES</h1>
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono hidden sm:block">Investigation Management • {stats.total} Total Cases</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-1 sm:gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold text-sm sm:text-base">{credits}</span>
                <span className="text-xs text-amber-400/70 hidden sm:inline">credits</span>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-400 hover:to-orange-400 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">NEW CASE</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 focus:border-amber-500/50 outline-none text-gray-300 text-sm"
              />
            </div>

            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
              <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
              {['all', 'active', 'paused', 'completed'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                    statusFilter === status
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {status === 'all' ? 'ALL' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-900 border border-gray-800">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'kanban' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-white'
                }`}
                title="Kanban Board"
              >
                <Layout className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('templates')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                  viewMode === 'templates' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-white'
                }`}
                title="Case Templates"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 text-sm outline-none cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="priority">Priority</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === 'kanban' && (
          <KanbanBoard
            cases={filteredCases.map(c => ({
              ...c,
              status: c.status === 'active' ? 'in-progress' : c.status === 'paused' ? 'pending' : c.status === 'completed' ? 'resolved' : 'open',
              tags: c.tags || [],
              assignee: c.assignee || 'Unassigned',
              dueDate: c.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }))}
            onStatusChange={(caseId, newStatus) => {
              const statusMap = {
                'open': 'active',
                'in-progress': 'active',
                'pending': 'paused',
                'resolved': 'completed',
                'closed': 'completed'
              };
              handleStatusChange(caseId, statusMap[newStatus] || 'active');
            }}
            onViewCase={handleViewCase}
            onCreateCase={async (caseData) => {
              const result = await createCase({
                title: caseData.title,
                description: '',
                priority: caseData.priority
              });
              if (result.success) {
                addNotification(`Case "${caseData.title}" created`, 'success');
              }
            }}
          />
        )}

        {/* Templates View */}
        {viewMode === 'templates' && (
          <CaseTemplates
            onCreateFromTemplate={async (template) => {
              const result = await createCase({
                title: `New ${template.name} Investigation`,
                description: template.description,
                priority: template.defaultPriority,
                checklist: template.checklist,
                tags: template.defaultTags
              });
              if (result.success) {
                logActivity('Created case from template', { template: template.name, type: 'case' });
                addNotification(`Case created from "${template.name}" template`, 'success');
                navigate(`/dashboard/user/cases/${result.case._id || result.case.id}`);
              }
            }}
            onSaveTemplate={(template) => {
              // Save to local storage or backend
              const savedTemplates = JSON.parse(localStorage.getItem('customCaseTemplates') || '[]');
              savedTemplates.push(template);
              localStorage.setItem('customCaseTemplates', JSON.stringify(savedTemplates));
              addNotification('Template saved successfully', 'success');
            }}
            customTemplates={JSON.parse(localStorage.getItem('customCaseTemplates') || '[]')}
          />
        )}

        {/* Cases Grid - List View */}
        {viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <AnimatePresence>
            {filteredCases.map((caseItem, index) => {
              const StatusIcon = statusIcons[caseItem.status];
              return (
                <motion.div
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl p-5 bg-gray-900/50 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group backdrop-blur-sm"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div onClick={() => handleViewCase(caseItem)} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-amber-500">{caseItem.id}</span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusColors[caseItem.status]} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {caseItem.status.toUpperCase()}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${priorityColors[caseItem.priority]}`}>
                          {caseItem.priority.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-200">{caseItem.title}</h3>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setShowMenuFor(showMenuFor === caseItem.id ? null : caseItem.id)}
                        className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {showMenuFor === caseItem.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-10 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
                          >
                            <button
                              onClick={() => handleViewCase(caseItem)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                            {caseItem.status !== 'active' && (
                              <button
                                onClick={() => handleStatusChange(caseItem.id, 'active')}
                                className="w-full px-4 py-2 text-left text-sm text-green-400 hover:bg-gray-800 flex items-center gap-2"
                              >
                                <Play className="w-4 h-4" /> Set Active
                              </button>
                            )}
                            {caseItem.status !== 'paused' && caseItem.status !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(caseItem.id, 'paused')}
                                className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-gray-800 flex items-center gap-2"
                              >
                                <Pause className="w-4 h-4" /> Pause Case
                              </button>
                            )}
                            {caseItem.status !== 'completed' && (
                              <button
                                onClick={() => handleStatusChange(caseItem.id, 'completed')}
                                className="w-full px-4 py-2 text-left text-sm text-cyan-400 hover:bg-gray-800 flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" /> Mark Complete
                              </button>
                            )}
                            <button
                              onClick={() => setShowDeleteModal(caseItem)}
                              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Case
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{caseItem.description}</p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Investigation Progress</span>
                      <span className="text-amber-400">{caseItem.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${caseItem.progress}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500">{formatTimeAgo(caseItem.lastActivity)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Team avatars */}
                      <div className="flex -space-x-2">
                        {caseItem.team?.map((member, i) => (
                          <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-950 flex items-center justify-center" title={member.name || member}>
                            <span className="text-xs text-gray-400">{typeof member === 'object' ? member.avatar : member}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Actions */}
                      <button 
                        onClick={() => handleViewCase(caseItem)}
                        className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-amber-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        )}

        {filteredCases.length === 0 && viewMode === 'list' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <FolderOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No cases found matching your criteria</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30"
            >
              Create New Case
            </button>
          </motion.div>
        )}
      </main>

      {/* Create Case Modal */}
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
                    Create New Case
                  </h2>
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Case Title *</label>
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                    placeholder="Enter case title..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description</label>
                  <textarea
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    placeholder="Describe the investigation..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:border-amber-500/50 outline-none text-white resize-none"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Priority</label>
                  <div className="flex gap-3">
                    {['low', 'medium', 'high'].map(priority => (
                      <button
                        key={priority}
                        onClick={() => setNewCase({ ...newCase, priority })}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                          newCase.priority === priority
                            ? priorityColors[priority]
                            : 'border-gray-700 text-gray-500 hover:border-gray-600'
                        }`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
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
                  onClick={handleCreateCase}
                  disabled={!newCase.title.trim()}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Case
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
                <h2 className="text-xl font-bold text-white mb-2">Delete Case?</h2>
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
                    onClick={() => handleDeleteCase(showDeleteModal.id)}
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

      {/* Case Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-gray-900 rounded-2xl border border-amber-500/30"
            >
              <div className="p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-amber-500">{showDetailModal.id}</span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusColors[showDetailModal.status]}`}>
                        {showDetailModal.status.toUpperCase()}
                      </span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${priorityColors[showDetailModal.priority]}`}>
                        {showDetailModal.priority.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{showDetailModal.title}</h2>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">Description</h3>
                  <p className="text-gray-300">{showDetailModal.description}</p>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Investigation Progress</span>
                    <span className="text-amber-400 font-bold">{showDetailModal.progress}%</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                      style={{ width: `${showDetailModal.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-gray-800/50 text-center">
                    <p className="text-2xl font-bold text-amber-400">{showDetailModal.dataPoints}</p>
                    <p className="text-xs text-gray-500">Data Points</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 text-center">
                    <p className="text-2xl font-bold text-blue-400">{showDetailModal.correlations}</p>
                    <p className="text-xs text-gray-500">Correlations</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 text-center">
                    <p className="text-2xl font-bold text-green-400">{showDetailModal.creditsSpent}c</p>
                    <p className="text-xs text-gray-500">Credits Spent</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-800/50 text-center">
                    <p className="text-2xl font-bold text-purple-400">{showDetailModal.evidence?.length || 0}</p>
                    <p className="text-xs text-gray-500">Evidence Items</p>
                  </div>
                </div>

                {/* Team */}
                <div>
                  <h3 className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Team Members
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {showDetailModal.team?.map((member, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <span className="text-sm text-amber-400">{typeof member === 'object' ? member.avatar : member}</span>
                        </div>
                        {typeof member === 'object' && (
                          <div>
                            <p className="text-sm text-white">{member.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                {showDetailModal.timeline?.length > 0 && (
                  <div>
                    <h3 className="text-sm text-gray-400 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Activity Timeline
                    </h3>
                    <div className="space-y-2">
                      {showDetailModal.timeline.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
                          <div className={`w-2 h-2 rounded-full ${
                            item.type === 'system' ? 'bg-blue-400' :
                            item.type === 'action' ? 'bg-green-400' : 'bg-amber-400'
                          }`} />
                          <span className="text-sm text-gray-300 flex-1">{item.event}</span>
                          <span className="text-xs text-gray-500">{formatTimeAgo(item.time)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm text-gray-300">{showDetailModal.created}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Activity</p>
                    <p className="text-sm text-gray-300">{formatTimeAgo(showDetailModal.lastActivity)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailModal(null);
                    navigate('/dashboard/user');
                  }}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2"
                >
                  <Target className="w-4 h-4" /> Open in Workspace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menu */}
      {showMenuFor && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenuFor(null)}
        />
      )}
    </div>
  );
};

export default ActiveCases;
