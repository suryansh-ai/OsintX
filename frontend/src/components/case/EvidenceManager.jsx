import { useState, useRef, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Image, Link as LinkIcon, Database, Network,
  X, Plus, Tag, Trash2, Eye, Download, Clock, User, Check,
  AlertTriangle, Lock, Shield, ChevronRight, Search, Filter, Info,
  CheckCircle2, AlertCircle, XCircle, HelpCircle, Flag, Edit,
  Loader2, List, RefreshCw, FileWarning, MessageSquare, Save
} from 'lucide-react';
import { sanitizeString, stringifySanitized } from '../../utils/resultSanitizer';

const evidenceTypes = [
  { id: 'document', label: 'Document', icon: FileText, color: 'blue', accept: '.pdf,.doc,.docx,.txt' },
  { id: 'tool_result', label: 'Tool Result', icon: Database, color: 'cyan', accept: null },
  { id: 'email', label: 'Email Record', icon: Database, color: 'purple', accept: null },
  { id: 'phone', label: 'Phone Record', icon: Database, color: 'green', accept: null },
  { id: 'ip', label: 'IP Record', icon: Network, color: 'amber', accept: null },
  { id: 'domain', label: 'Domain Record', icon: Network, color: 'cyan', accept: null },
  { id: 'hash', label: 'Hash Record', icon: Database, color: 'red', accept: null },
  { id: 'image', label: 'Image', icon: Image, color: 'purple', accept: 'image/*' },
  { id: 'link', label: 'URL/Link', icon: LinkIcon, color: 'cyan', accept: null },
  { id: 'data', label: 'Data File', icon: Database, color: 'amber', accept: '.json,.csv,.xml,.log' },
  { id: 'network', label: 'Network Capture', icon: Network, color: 'green', accept: '.pcap,.pcapng' },
];

const predefinedTags = [
  { id: 'malware', label: 'Malware', color: 'red' },
  { id: 'phishing', label: 'Phishing', color: 'orange' },
  { id: 'credentials', label: 'Credentials', color: 'purple' },
  { id: 'c2', label: 'C2 Server', color: 'pink' },
  { id: 'exfiltration', label: 'Exfiltration', color: 'amber' },
  { id: 'ransomware', label: 'Ransomware', color: 'red' },
  { id: 'apt', label: 'APT', color: 'cyan' },
  { id: 'insider', label: 'Insider Threat', color: 'emerald' },
  { id: 'ioc', label: 'IOC', color: 'blue' },
  { id: 'verified', label: 'Verified', color: 'green' },
  { id: 'identity', label: 'Identity', color: 'violet' },
  { id: 'infrastructure', label: 'Infrastructure', color: 'amber' },
  { id: 'breach', label: 'Breach', color: 'red' },
  { id: 'sensitive', label: 'Sensitive', color: 'pink' },
  { id: 'crypto', label: 'Crypto', color: 'yellow' },
  { id: 'high-confidence', label: 'High Confidence', color: 'emerald' },
  { id: 'needs-review', label: 'Needs Review', color: 'orange' },
];

const reviewStatuses = [
  { id: 'unreviewed', label: 'Unreviewed', icon: HelpCircle, cls: 'text-gray-400 bg-gray-500/10 border-gray-500/30' },
  { id: 'reviewed', label: 'Reviewed', icon: Eye, cls: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { id: 'verified', label: 'Verified', icon: CheckCircle2, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'disputed', label: 'Disputed', icon: AlertCircle, cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { id: 'false_positive', label: 'False Positive', icon: XCircle, cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { id: 'needs_followup', label: 'Needs Follow-Up', icon: Flag, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
];

function computeAutoTags(item) {
  const tags = [];
  const t = (item.title || item.tool || item.type || '').toLowerCase();
  const d = (item.description || '').toLowerCase();
  if (t.includes('email') || t.includes('mail')) tags.push('identity');
  if (t.includes('domain') || t.includes('dns') || t.includes('ip') || t.includes('network')) tags.push('infrastructure');
  if (t.includes('breach') || d.includes('breach')) tags.push('breach');
  if (t.includes('malware') || d.includes('malware')) tags.push('malware');
  if (t.includes('phish') || d.includes('phish')) tags.push('phishing');
  if (t.includes('credential') || d.includes('password') || d.includes('token') || d.includes('api_key') || d.includes('secret')) tags.push('credentials');
  if (t.includes('crypto') || t.includes('wallet') || t.includes('bitcoin') || t.includes('blockchain')) tags.push('crypto');
  if (d.includes('sensitive') || d.includes('pii') || d.includes('confidential')) tags.push('sensitive');
  if (item.confidence && item.confidence >= 80) tags.push('high-confidence');
  if (item.verified === false || item.reviewStatus === 'unreviewed') tags.push('needs-review');
  return tags;
}

function getStaleInfo(item) {
  const now = Date.now();
  const added = new Date(item.addedAt || item.savedAt || item.createdAt || 0).getTime();
  if (!added) return null;
  const days = (now - added) / 86400000;
  const type = (item.type || '').toLowerCase();
  const limits = { dns: 7, whois: 30, ip: 3, reputation: 3, social: 14, profile: 14 };
  const limit = Object.entries(limits).find(([k]) => type.includes(k))?.[1] || 30;
  if (days > limit) return { days: Math.round(days), limit, stale: true };
  return { days: Math.round(days), limit, stale: false };
}

function getEvidenceQuality(item) {
  let score = 0;
  if (item.title) score += 15;
  if (item.description) score += 15;
  if (item.source) score += 10;
  if (item.addedAt || item.savedAt) score += 10;
  if (item.tags?.length) score += 10;
  if (item.chainOfCustody?.length) score += 15;
  if (item.linkedEvidence?.length) score += 10;
  if (item.verified) score += 15;
  return Math.min(100, score);
}

const formatEvidenceData = (value) => {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return sanitizeString(value);
  return stringifySanitized(value);
};

const evidenceText = (value, fallback = '') => sanitizeString(value || fallback || '');

const EvidenceManager = ({
  evidence = [],
  onAddEvidence,
  onUpdateEvidence,
  onDeleteEvidence,
  onDownloadEvidence,
  onLinkEvidence,
  onUpdateReviewStatus,
  onUpdateTags,
  caseId,
  autoNotes = []
}) => {
  const fileInputRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [selectedType, setSelectedType] = useState('document');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkAction, setBulkAction] = useState(null);
  const [newEvidence, setNewEvidence] = useState({
    title: '', type: 'document', description: '', source: '', url: '', tags: [], file: null, chainOfCustody: []
  });
  const [linkingMode, setLinkingMode] = useState(null);
  const [showStaleOnly, setShowStaleOnly] = useState(false);
  const [notesList, setNotesList] = useState([]);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    if (showDetailModal) {
      setNotesList(showDetailModal.notes || showDetailModal.investigatorNotes || []);
      setNewNoteText('');
    }
  }, [showDetailModal]);

  const handleAcceptSuggestion = (suggestion) => {
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: suggestion.text,
      timestamp: new Date().toISOString(),
      sensitive: suggestion.sensitive || false,
      author: 'Current User'
    };
    setNotesList(prev => [...prev, newNote]);
  };

  const handleAddNoteToDetail = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: newNoteText.trim(),
      timestamp: new Date().toISOString(),
      sensitive: false,
      author: 'Current User'
    };
    setNotesList(prev => [...prev, newNote]);
    setNewNoteText('');
  };

  const handleUpdateNote = (index, text) => {
    setNotesList(prev => prev.map((note, i) => i === index ? { ...note, text } : note));
  };

  const handleSaveNotes = () => {
    const evidenceId = showDetailModal.id || showDetailModal._id;
    onUpdateEvidence?.(evidenceId, { notes: notesList, investigatorNotes: notesList });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewEvidence({ ...newEvidence, file, title: newEvidence.title || file.name });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      let type = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.name.match(/\.(pcap|pcapng)$/i)) type = 'network';
      else if (file.name.match(/\.(json|csv|xml|log)$/i)) type = 'data';
      setSelectedType(type);
      setNewEvidence({ ...newEvidence, type, file, title: file.name });
      setShowAddModal(true);
    }
  };

  const handleAddEvidence = () => {
    const autoTags = computeAutoTags({ ...newEvidence, type: selectedType });
    const combinedTags = [...new Set([...newEvidence.tags, ...autoTags])];
    const evidenceItem = {
      id: `EVD-${Date.now()}`,
      ...newEvidence,
      type: selectedType,
      tags: combinedTags,
      addedAt: new Date().toISOString(),
      addedBy: 'Current User',
      reviewStatus: 'unreviewed',
      chainOfCustody: [{
        action: 'Created', user: 'Current User', timestamp: new Date().toISOString(),
        notes: 'Evidence item created'
      }],
      linkedEvidence: []
    };
    onAddEvidence?.(evidenceItem);
    setNewEvidence({
      title: '', type: 'document', description: '', source: '', url: '', tags: [], file: null, chainOfCustody: []
    });
    setShowAddModal(false);
  };

  const toggleTag = (tagId) => {
    const tags = newEvidence.tags.includes(tagId)
      ? newEvidence.tags.filter(t => t !== tagId)
      : [...newEvidence.tags, tagId];
    setNewEvidence({ ...newEvidence, tags });
  };

  const handleLinkEvidence = (fromId, toId) => {
    onLinkEvidence?.(fromId, toId);
    setLinkingMode(null);
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredEvidence.length && filteredEvidence.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredEvidence.map(e => e.id || e._id)));
    }
  };

  const applyBulkAction = (action) => {
    const ids = [...selectedItems];
    if (action === 'verify') {
      ids.forEach(id => onUpdateReviewStatus?.(id, 'verified'));
    } else if (action === 'tag') {
      ids.forEach(id => onUpdateTags?.(id, ['ioc', 'verified']));
    } else if (action === 'delete') {
      ids.forEach(id => onDeleteEvidence?.(id));
    } else if (action === 'unreview') {
      ids.forEach(id => onUpdateReviewStatus?.(id, 'unreviewed'));
    }
    setSelectedItems(new Set());
    setBulkAction(null);
  };

  const filteredEvidence = evidence.filter(e => {
    const title = e.title || e.tool || e.query || e.id || e._id || '';
    const description = e.description || e.notes || '';
    const matchesSearch = title.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                          description.toString().toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = filterTag === 'all' || e.tags?.includes(filterTag);
    const matchesStatus = filterStatus === 'all' || e.reviewStatus === filterStatus;
    const stale = getStaleInfo(e);
    const matchesStale = !showStaleOnly || (stale?.stale === true);
    return matchesSearch && matchesTag && matchesStatus && matchesStale;
  });

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
    return `${diffDays}d ago`;
  };

  const staleCount = useMemo(() =>
    evidence.filter(e => getStaleInfo(e)?.stale).length,
  [evidence]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search evidence..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none focus:border-amber-500/50"
            />
          </div>
          <select
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none"
          >
            <option value="all">All Tags</option>
            {predefinedTags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-gray-900 border border-gray-800 text-sm text-gray-300 outline-none"
          >
            <option value="all">All Statuses</option>
            {reviewStatuses.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          {staleCount > 0 && (
            <button
              onClick={() => setShowStaleOnly(!showStaleOnly)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                showStaleOnly ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-gray-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Stale ({staleCount})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <span className="text-xs text-amber-400">{selectedItems.size} selected</span>
              <select
                onChange={e => { const v = e.target.value; if (v) applyBulkAction(v); }}
                className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-300 outline-none"
                defaultValue=""
              >
                <option value="" disabled>Bulk action...</option>
                <option value="verify">Mark Verified</option>
                <option value="tag">Tag as IOC</option>
                <option value="unreview">Mark Unreviewed</option>
                <option value="delete">Delete</option>
              </select>
              <button onClick={() => setSelectedItems(new Set())} className="text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Evidence
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-amber-500/50 transition-colors"
      >
        <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Drag & drop files here, or click Add Evidence</p>
        <p className="text-xs text-gray-600 mt-1">Supports documents, images, network captures, and data files</p>
      </div>

      {/* Evidence Grid */}
      {filteredEvidence.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          <button onClick={toggleSelectAll} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300">
            {selectedItems.size === filteredEvidence.length && filteredEvidence.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded border border-gray-600" />}
            Select all
          </button>
        </div>
      )}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvidence.map((item, i) => {
          const typeConfig = evidenceTypes.find(t => t.id === item.type) || evidenceTypes[0];
          const TypeIcon = typeConfig.icon;
          const statusConfig = reviewStatuses.find(s => s.id === item.reviewStatus) || reviewStatuses[0];
          const StatusIcon = statusConfig.icon;
          const itemId = item.id || item._id;
          const quality = getEvidenceQuality(item);
          const stale = getStaleInfo(item);

          return (
            <motion.div
              key={itemId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-xl p-4 bg-gray-900/50 border transition-all cursor-pointer relative ${
                linkingMode === itemId ? 'border-amber-500 ring-2 ring-amber-500/30' :
                selectedItems.has(itemId) ? 'border-amber-400/60 ring-1 ring-amber-400/30' :
                stale?.stale ? 'border-amber-500/20 border-l-amber-500' :
                'border-amber-500/20 hover:border-amber-500/40'
              }`}
              onClick={() => {
                if (linkingMode && linkingMode !== itemId) {
                  handleLinkEvidence(linkingMode, itemId);
                } else {
                  setShowDetailModal(item);
                }
              }}
            >
              {/* Stale badge */}
              {stale?.stale && (
                <div className="absolute -top-1.5 -right-1.5 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[9px] text-amber-400">
                  <Clock className="h-2.5 w-2.5" /> {stale.days}d
                </div>
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0" onClick={e => { e.stopPropagation(); toggleSelectItem(itemId); }}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    selectedItems.has(itemId) ? 'border-amber-500 bg-amber-500/20' : 'border-gray-600'
                  }`}>
                    {selectedItems.has(itemId) && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-${typeConfig.color}-500/20 flex items-center justify-center shrink-0`}>
                    <TypeIcon className={`w-5 h-5 text-${typeConfig.color}-400`} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{evidenceText(item.title || item.tool || item.query, 'Evidence item')}</h4>
                    <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Review Status Badge */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${statusConfig.cls}`}>
                    <StatusIcon className="h-2.5 w-2.5" />
                    {statusConfig.label === 'Unreviewed' ? 'New' : statusConfig.label}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLinkingMode(linkingMode === itemId ? null : itemId);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      linkingMode === itemId ? 'bg-amber-500 text-white' : 'hover:bg-gray-800 text-gray-500'
                    }`}
                    title="Link to another evidence"
                  >
                    <LinkIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteEvidence?.(itemId); }}
                    className="p-1.5 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">{evidenceText(item.description)}</p>
              )}

              {/* Tags */}
              {item.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {(item.tags || []).slice(0, 3).map(tagId => {
                    const tag = predefinedTags.find(t => t.id === tagId);
                    return tag ? (
                      <span key={tagId} className={`text-[9px] px-1.5 py-0.5 rounded bg-${tag.color}-500/20 text-${tag.color}-400`}>
                        #{tag.label}
                      </span>
                    ) : null;
                  })}
                  {(item.tags || []).length > 3 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">+{item.tags.length - 3}</span>
                  )}
                </div>
              )}

              {/* Quality bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1 rounded-full bg-gray-800 overflow-hidden">
                  <div className={`h-full rounded-full ${quality >= 70 ? 'bg-emerald-500' : quality >= 40 ? 'bg-amber-500' : 'bg-gray-600'}`} style={{ width: `${quality}%` }} />
                </div>
                <span className={`text-[9px] ${quality >= 70 ? 'text-emerald-400' : quality >= 40 ? 'text-amber-400' : 'text-gray-500'}`}>{quality}%</span>
              </div>

              {/* Linked Evidence */}
              {item.linkedEvidence?.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <LinkIcon className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{item.linkedEvidence.length} linked</span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimeAgo(item.addedAt || item.savedAt)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.addedBy || item.savedBy || 'Unknown'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredEvidence.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">
            {searchQuery || filterTag !== 'all' || filterStatus !== 'all' || showStaleOnly ? 'No evidence matches your filters' : 'No evidence added yet'}
          </p>
        </div>
      )}

      {/* Linking Mode Banner */}
      <AnimatePresence>
        {linkingMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg bg-amber-500 text-white flex items-center gap-3 z-50 shadow-xl"
          >
            <LinkIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Click another evidence item to link</span>
            <button onClick={() => setLinkingMode(null)} className="p-1 rounded hover:bg-amber-600"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Evidence Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-gray-900 rounded-2xl border border-amber-500/30"
            >
              <div className="p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Add Evidence</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Evidence Type</label>
                  <div className="grid grid-cols-5 gap-2">
                    {evidenceTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <button key={type.id} onClick={() => setSelectedType(type.id)}
                          className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                            selectedType === type.id ? `bg-${type.color}-500/20 border border-${type.color}-500/50` : 'bg-gray-800 hover:bg-gray-700'
                          }`}
                        >
                          <Icon className={`w-5 h-5 text-${type.color}-400`} />
                          <span className="text-[10px] text-gray-400">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Upload */}
                {selectedType !== 'link' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Upload File</label>
                    <input ref={fileInputRef} type="file" accept={evidenceTypes.find(t => t.id === selectedType)?.accept || '*/*'} onChange={handleFileSelect} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 rounded-lg border-2 border-dashed border-gray-700 hover:border-amber-500/50 transition-colors text-center">
                      {newEvidence.file ? (
                        <div className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-sm text-gray-300">{newEvidence.file.name}</span>
                        </div>
                      ) : (
                        <><Upload className="w-6 h-6 text-gray-600 mx-auto mb-1" /><span className="text-sm text-gray-500">Click to upload</span></>
                      )}
                    </button>
                  </div>
                )}

                {/* URL for links */}
                {selectedType === 'link' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">URL</label>
                    <input type="url" value={newEvidence.url} onChange={e => setNewEvidence({ ...newEvidence, url: e.target.value })}
                      placeholder="https://..." className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white outline-none focus:border-amber-500/50" />
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Title *</label>
                  <input type="text" value={newEvidence.title} onChange={e => setNewEvidence({ ...newEvidence, title: e.target.value })}
                    placeholder="Evidence title..." className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white outline-none focus:border-amber-500/50" />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description</label>
                  <textarea value={newEvidence.description} onChange={e => setNewEvidence({ ...newEvidence, description: e.target.value })}
                    placeholder="Describe this evidence..." rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white outline-none resize-none focus:border-amber-500/50" />
                </div>

                {/* Source */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Source</label>
                  <input type="text" value={newEvidence.source} onChange={e => setNewEvidence({ ...newEvidence, source: e.target.value })}
                    placeholder="Where was this collected?" className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white outline-none focus:border-amber-500/50" />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Tags <span className="text-gray-600">(auto-tagged by type)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {predefinedTags.map(tag => (
                      <button key={tag.id} onClick={() => toggleTag(tag.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                          newEvidence.tags.includes(tag.id)
                            ? `bg-${tag.color}-500/30 text-${tag.color}-400 border border-${tag.color}-500/50`
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >#{tag.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white">Cancel</button>
                <button onClick={handleAddEvidence} disabled={!newEvidence.title.trim()}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold disabled:opacity-50">Add Evidence</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evidence Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-gray-900 rounded-2xl border border-amber-500/30"
            >
              <div className="p-6 border-b border-gray-800 sticky top-0 bg-gray-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const typeConfig = evidenceTypes.find(t => t.id === showDetailModal.type) || evidenceTypes[0];
                      const Icon = typeConfig.icon;
                      return (
                        <div className={`w-10 h-10 rounded-lg bg-${typeConfig.color}-500/20 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${typeConfig.color}-400`} />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className="text-lg font-bold text-white">{evidenceText(showDetailModal.title || showDetailModal.tool || showDetailModal.query, 'Evidence item')}</h2>
                      <p className="text-sm text-gray-500">ID: {showDetailModal.id || showDetailModal._id}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowDetailModal(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Review Status + Quick Actions */}
                <div className="flex items-center gap-3 flex-wrap">
                  {reviewStatuses.map(s => {
                    const SI = s.icon;
                    const active = showDetailModal.reviewStatus === s.id;
                    return (
                      <button key={s.id} onClick={() => {
                        onUpdateReviewStatus?.(showDetailModal.id || showDetailModal._id, s.id);
                        setShowDetailModal({ ...showDetailModal, reviewStatus: s.id });
                      }}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          active ? `${s.cls} ring-1` : 'text-gray-500 bg-gray-800/50 border-gray-700/50 hover:text-gray-300'
                        }`}
                      ><SI className="w-3.5 h-3.5" />{s.label}</button>
                    );
                  })}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-sm text-white capitalize">{showDetailModal.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Source</p>
                    <p className="text-sm text-white">{evidenceText(showDetailModal.source, 'Not specified')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Added</p>
                    <p className="text-sm text-white">{new Date(showDetailModal.addedAt || showDetailModal.savedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Added By</p>
                    <p className="text-sm text-white">{showDetailModal.addedBy || showDetailModal.savedBy || 'Unknown'}</p>
                  </div>
                  {showDetailModal.confidence && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Confidence</p>
                      <p className="text-sm text-emerald-400">{showDetailModal.confidence}%</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Quality Score</p>
                    <p className={`text-sm ${getEvidenceQuality(showDetailModal) >= 70 ? 'text-emerald-400' : getEvidenceQuality(showDetailModal) >= 40 ? 'text-amber-400' : 'text-gray-400'}`}>
                      {getEvidenceQuality(showDetailModal)}/100
                    </p>
                  </div>
                </div>

                {/* Stale Warning */}
                {(() => {
                  const stale = getStaleInfo(showDetailModal);
                  if (stale?.stale) {
                    return (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <p className="text-sm text-amber-300">This evidence is {stale.days} days old (recommended refresh within {stale.limit} days)</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Description */}
                {showDetailModal.description && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Description</p>
                    <p className="text-sm text-gray-300">{evidenceText(showDetailModal.description)}</p>
                  </div>
                )}

                {formatEvidenceData(showDetailModal.data) && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Saved Tool Data</p>
                    <pre className="max-h-72 overflow-auto rounded-lg bg-gray-950/80 border border-gray-800 p-4 text-xs text-gray-300 whitespace-pre-wrap break-words custom-scrollbar">
                      {formatEvidenceData(showDetailModal.data)}
                    </pre>
                  </div>
                )}

                {showDetailModal.file && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Stored File</p>
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-gray-800/50">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Name</p>
                        <p className="text-sm text-white break-all">{showDetailModal.file.originalName || showDetailModal.file.name || 'Evidence file'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Size</p>
                        <p className="text-sm text-white">{showDetailModal.file.size ? `${Math.round(showDetailModal.file.size / 1024)} KB` : 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Type</p>
                        <p className="text-sm text-white">{showDetailModal.file.mimeType || showDetailModal.file.type || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Storage</p>
                        <p className="text-sm text-white">{showDetailModal.file.storage || (showDetailModal.file.downloadUrl ? 'local' : 'metadata only')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {showDetailModal.tags?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {showDetailModal.tags.map(tagId => {
                        const tag = predefinedTags.find(t => t.id === tagId);
                        return tag ? (
                          <span key={tagId} className={`text-xs px-3 py-1 rounded bg-${tag.color}-500/20 text-${tag.color}-400`}>#{tag.label}</span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Chain of Custody */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-medium text-white">Chain of Custody</p>
                  </div>
                  <div className="space-y-2">
                    {(showDetailModal.chainOfCustody || []).map((entry, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-white">{entry.action}</p>
                          <p className="text-xs text-gray-500">{entry.user} • {new Date(entry.timestamp).toLocaleString()}</p>
                          {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
                        </div>
                      </div>
                    ))}
                    {(!showDetailModal.chainOfCustody || showDetailModal.chainOfCustody.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-4">No custody records</p>
                    )}
                  </div>
                </div>

                {/* Linked Evidence */}
                {showDetailModal.linkedEvidence?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Linked Evidence</p>
                    <div className="space-y-2">
                      {showDetailModal.linkedEvidence.map((linkedId, i) => {
                        const linked = evidence.find(e => e.id === linkedId);
                        return linked ? (
                          <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/50">
                            <LinkIcon className="w-3 h-3 text-gray-500" />
                            <span className="text-sm text-gray-300">{linked.title}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* Investigator Notes */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-medium text-white">Investigator Notes</p>
                    {notesList.length > 0 && (
                      <span className="text-xs text-gray-500 ml-auto">{notesList.length} note{notesList.length > 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {/* Auto-generated Suggestions */}
                  {autoNotes?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Suggested Notes</p>
                      <div className="space-y-2">
                        {autoNotes.map((suggestion, i) => {
                          const alreadyAdded = notesList.some(n => n.text === suggestion.text);
                          return (
                            <div key={suggestion.id || i} className={`flex items-start gap-2 p-3 rounded-lg border ${suggestion.sensitive ? 'bg-amber-500/10 border-amber-500/30' : 'bg-gray-800/50 border-gray-700/50'}`}>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300">{suggestion.text}</p>
                                {suggestion.sensitive && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                                    <span className="text-xs text-amber-400">Sensitive data warning — handle with care</span>
                                  </div>
                                )}
                              </div>
                              {!alreadyAdded && (
                                <button
                                  onClick={() => handleAcceptSuggestion(suggestion)}
                                  className="shrink-0 px-2.5 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                                >
                                  Accept
                                </button>
                              )}
                              {alreadyAdded && (
                                <span className="shrink-0 text-xs text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Added
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Existing Notes */}
                  {notesList.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {notesList.map((note, i) => (
                        <div key={note.id || i} className={`p-3 rounded-lg border ${note.sensitive ? 'bg-amber-500/10 border-amber-500/30' : 'bg-gray-800/50 border-gray-700/50'}`}>
                          <textarea
                            value={note.text}
                            onChange={e => handleUpdateNote(i, e.target.value)}
                            rows={2}
                            className={`w-full bg-transparent text-sm text-gray-300 outline-none resize-none ${note.sensitive ? 'placeholder-amber-300' : ''}`}
                          />
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{note.author || 'Current User'}</span>
                              {note.timestamp && (
                                <>
                                  <span className="text-gray-600">•</span>
                                  <span className="text-xs text-gray-500">{new Date(note.timestamp).toLocaleString()}</span>
                                </>
                              )}
                            </div>
                            {note.sensitive && (
                              <span className="flex items-center gap-1 text-xs text-amber-400">
                                <AlertTriangle className="w-3 h-3" /> Sensitive
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Note */}
                  <div className="flex gap-2">
                    <textarea
                      value={newNoteText}
                      onChange={e => setNewNoteText(e.target.value)}
                      placeholder="Add investigator note..."
                      rows={2}
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 outline-none resize-none focus:border-amber-500/50 placeholder-gray-600"
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={handleAddNoteToDetail}
                        disabled={!newNoteText.trim()}
                        className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-medium hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={!notesList.length}
                        className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-800 flex gap-3">
                <button onClick={() => { onDownloadEvidence?.(showDetailModal.id || showDetailModal._id); setShowDetailModal(null); }}
                  disabled={!showDetailModal.file?.downloadUrl && !showDetailModal.file?.relativePath}
                  className="flex-1 py-3 rounded-lg bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                ><Download className="w-4 h-4" /> Download</button>
                <button onClick={() => setShowDetailModal(null)}
                  className="flex-1 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center gap-2"
                ><Eye className="w-4 h-4" /> Investigate</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EvidenceManager;
