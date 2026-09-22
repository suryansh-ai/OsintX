/**
 * Save to Case Modal
 * Allows saving tool results to an existing or new case
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderPlus, X, Folder, Plus, Check, Search, 
  AlertTriangle, Clock, ChevronRight, FileText,
  CheckCircle, Zap
} from 'lucide-react';
import { useCases } from '../../context/CaseContext';
import { useEvidence } from '../../context/EvidenceContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../common/Toast';
import { sanitizeResultData, sanitizeToolName, stringifySanitized } from '../../utils/resultSanitizer';

const stringifyData = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
};

const summarizeData = (value) => {
  if (!value || typeof value !== 'object') return stringifyData(value).slice(0, 500);
  return value.summary
    || value.message
    || value.description
    || value.result?.summary
    || value.analysis?.summary
    || stringifyData(value).slice(0, 500);
};

const firstAvailable = (...values) => values.find(value => {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
});

const extractKeySignals = (value) => {
  const clean = sanitizeResultData(value);
  const text = stringifySanitized(clean);
  const signals = [];

  const addSignal = (label, match) => {
    if (!match) return;
    const valueText = Array.isArray(match) ? match[0] : match;
    if (!valueText) return;
    signals.push(`${label}: ${String(valueText).trim()}`);
  };

  if (clean && typeof clean === 'object' && !Array.isArray(clean)) {
    addSignal('Risk', firstAvailable(clean.risk, clean.riskScore, clean.score, clean.severity));
    addSignal('Status', firstAvailable(clean.status, clean.verdict, clean.result?.status, clean.analysis?.status));
    addSignal('Source', firstAvailable(clean.source, clean.provider, clean.origin));
    addSignal('Location', firstAvailable(clean.country, clean.city, clean.location, clean.geo?.country));
    addSignal('Organization', firstAvailable(clean.organization, clean.org, clean.asn, clean.company));
  }

  addSignal('Email', text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i));
  addSignal('IP', text.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/));
  addSignal('Domain', text.match(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/i));
  addSignal('Hash', text.match(/\b(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64})\b/i));

  return [...new Set(signals)].slice(0, 4);
};

const buildAutofillDescription = ({ toolName, query, data }) => {
  const cleanToolName = sanitizeToolName(toolName) || 'Selected tool';
  const cleanQuery = sanitizeResultData(query || '');
  const cleanData = sanitizeResultData(data);
  const evidenceType = inferEvidenceType(cleanToolName, cleanQuery);
  const summary = sanitizeResultData(summarizeData(cleanData));
  const keySignals = extractKeySignals(cleanData);
  const targetText = cleanQuery ? ` for "${cleanQuery}"` : '';
  const typeText = evidenceType.replace(/_/g, ' ');

  const lines = [
    `This case was opened from ${cleanToolName}${targetText}. The saved evidence is classified as ${typeText} evidence and should be reviewed as part of the investigation record.`,
  ];

  if (summary && String(summary).trim()) {
    lines.push(`Initial finding: ${String(summary).replace(/\s+/g, ' ').trim().slice(0, 320)}`);
  }

  if (keySignals.length) {
    lines.push(`Key signals identified: ${keySignals.join('; ')}.`);
  }

  lines.push('The description was auto-filled from the saved result and can be edited before saving.');
  return sanitizeResultData(lines.join('\n\n'));
};

const inferEvidenceType = (toolName, query) => {
  const queryText = String(query || '');
  const text = `${toolName || ''} ${queryText}`.toLowerCase();
  if (text.includes('email') || queryText.includes('@')) return 'email';
  if (text.includes('phone')) return 'phone';
  if (text.includes('domain')) return 'domain';
  if (text.includes('ip')) return 'ip';
  if (text.includes('image')) return 'image';
  if (text.includes('hash') || text.includes('password')) return 'hash';
  return 'tool_result';
};

const getEvidenceQualityGate = (value) => {
  const clean = sanitizeResultData(value);
  const status = String(clean?.status || clean?.toolStatus || '').toLowerCase();
  const successFalse = clean?.success === false;
  const evidenceReady = clean?.evidenceReady;
  const hasVerifiedFindings = Array.isArray(clean?.verifiedFindings) && clean.verifiedFindings.length > 0;
  const errors = Array.isArray(clean?.errors) ? clean.errors : (clean?.error ? [clean.error] : []);

  if (status === 'failed' || status === 'unavailable' || (successFalse && evidenceReady === false)) {
    return {
      canSave: false,
      severity: 'blocked',
      label: status === 'unavailable' ? 'Source unavailable' : 'Tool failed',
      message: 'This result is not evidence-ready. Add analyst notes to save it as an investigation note instead of evidence.',
      errors,
    };
  }

  if (status === 'partial' || evidenceReady === false || !hasVerifiedFindings) {
    return {
      canSave: true,
      severity: 'partial',
      label: 'Partial result',
      message: 'This result contains limited or unverified findings. It will be marked as partial evidence.',
      errors,
    };
  }

  return {
    canSave: true,
    severity: 'ready',
    label: 'Evidence ready',
    message: 'Verified findings are available for case evidence.',
    errors,
  };
};

const imageUrlPattern = /^https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:[?#].*)?$/i;
const dataImagePattern = /^data:image\/[a-z0-9.+-]+;base64,/i;
const imageFieldPattern = /(image|photo|avatar|thumbnail|screenshot|picture|profilephoto|ogimage)/i;

const extractImageArtifacts = (value, context = {}, depth = 0, found = []) => {
  if (value == null || depth > 5) return found;
  if (typeof value === 'string') {
    const clean = value.trim().replace(/[),.;]+$/g, '');
    if (imageUrlPattern.test(clean) || dataImagePattern.test(clean)) {
      found.push({
        url: clean,
        label: context.label || 'Image artifact',
        fieldPath: context.path || 'data',
        kind: dataImagePattern.test(clean) ? 'Embedded image data' : 'Remote image URL',
      });
    }
    (value.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif|bmp|tiff?)(?:[?#][^\s"'<>]*)?/gi) || []).forEach(url => {
      found.push({
        url: url.replace(/[),.;]+$/g, ''),
        label: context.label || 'Image reference',
        fieldPath: context.path || 'text',
        kind: 'Referenced image URL',
      });
    });
    return found;
  }
  if (Array.isArray(value)) {
    value.slice(0, 80).forEach((entry, index) => extractImageArtifacts(entry, { ...context, path: `${context.path || 'data'}[${index}]` }, depth + 1, found));
    return found;
  }
  if (typeof value === 'object') {
    Object.entries(value).slice(0, 160).forEach(([key, entry]) => {
      extractImageArtifacts(entry, {
        ...context,
        label: imageFieldPattern.test(key) ? key : context.label,
        path: context.path ? `${context.path}.${key}` : key,
      }, depth + 1, found);
    });
  }
  return found;
};

const uniqueImageArtifacts = (items = [], limit = 25) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  }).slice(0, limit);
};

const SaveToCaseModal = ({ isOpen, onClose, data, toolName = 'Tool', query = '' }) => {
  const { isDark } = useTheme();
  const { cases, createCase, addEvidence } = useCases();
  const { createEvidence } = useEvidence();
  const toast = useToast();
  
  const [selectedCase, setSelectedCase] = useState(null);
  const [createNew, setCreateNew] = useState(false);
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCaseDescription, setNewCaseDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notes, setNotes] = useState('');
  const descriptionEditedRef = useRef(false);

  const suggestedCaseDescription = useMemo(() => (
    buildAutofillDescription({ toolName, query, data })
  ), [toolName, query, data]);
  const evidenceQuality = useMemo(() => getEvidenceQualityGate(data), [data]);

  useEffect(() => {
    if (!isOpen) {
      descriptionEditedRef.current = false;
      return;
    }

    if (createNew && !descriptionEditedRef.current) {
      setNewCaseDescription(suggestedCaseDescription);
    }
  }, [isOpen, createNew, suggestedCaseDescription]);

  // Filter active cases
  const activeCases = cases.filter(c => c.status !== 'completed');
  const filteredCases = activeCases.filter(c => 
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.id || c.caseId || c._id || '').toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const priorityColors = {
    high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };

  const handleSaveToCase = async () => {
    if (!selectedCase && !createNew) {
      toast.error('Please select a case or create a new one');
      return;
    }

    setIsSaving(true);

    try {
      let targetCaseId = selectedCase?._id || selectedCase?.caseId || selectedCase?.id;

      // Create new case if needed
      if (createNew) {
        if (!newCaseTitle.trim()) {
          toast.error('Please enter a case title');
          setIsSaving(false);
          return;
        }

        const result = await createCase({
          title: newCaseTitle,
          description: newCaseDescription || suggestedCaseDescription || `Investigation started with ${toolName}`,
          priority: 'medium',
        });

        if (result.success) {
          targetCaseId = result.case._id || result.case.caseId || result.case.id;
          toast.success(`Case "${newCaseTitle}" created`);
        } else {
          throw new Error(result.error || 'Failed to create case');
        }
      }

      if (!targetCaseId) throw new Error('No case selected');

      const cleanToolName = sanitizeToolName(toolName) || 'Tool';
      const cleanData = sanitizeResultData(data);
      const qualityGate = getEvidenceQualityGate(cleanData);
      const savingAsManualNote = !qualityGate.canSave && notes.trim().length > 0;
      if (!qualityGate.canSave && !savingAsManualNote) {
        toast.error('This tool result is not evidence-ready. Add analyst notes to save it as an investigation note.');
        setIsSaving(false);
        return;
      }
      const evidenceType = inferEvidenceType(cleanToolName, query);
      const dataText = stringifySanitized(cleanData);
      const dataSummary = notes || summarizeData(cleanData);
      const evidencePayload = {
        type: savingAsManualNote ? 'investigation_note' : evidenceType,
        title: `${savingAsManualNote ? 'Tool status note' : `${cleanToolName} result`}${query ? ` - ${query}` : ''}`,
        tool: cleanToolName,
        query,
        description: savingAsManualNote ? `Manual analyst note for a non-evidence-ready tool result. ${dataSummary}` : dataSummary,
        source: cleanToolName,
        data: cleanData,
        notes,
        tags: ['tool-result', evidenceType, cleanData.status, savingAsManualNote ? 'manual-error-note' : null].filter(Boolean),
        addedAt: new Date().toISOString(),
        addedBy: 'Current User',
        verified: Boolean(cleanData.evidenceReady && cleanData.verifiedFindings?.length),
      };

      // Add evidence via context (syncs to backend automatically)
      const evidenceResult = await addEvidence(targetCaseId, evidencePayload);
      if (!evidenceResult?.success) {
        throw new Error(evidenceResult?.error || 'Failed to add evidence to case');
      }

      const extractedImages = cleanData.evidenceReady === false
        ? []
        : uniqueImageArtifacts(extractImageArtifacts(cleanData));
      for (const [index, artifact] of extractedImages.entries()) {
        const imagePayload = {
          type: 'image',
          title: `${cleanToolName} image artifact ${index + 1}`,
          tool: cleanToolName,
          query,
          description: `Image artifact extracted from ${cleanToolName} result. Source field: ${artifact.fieldPath}.`,
          source: cleanToolName,
          url: artifact.url,
          data: {
            imageUrl: artifact.url,
            label: artifact.label,
            kind: artifact.kind,
            fieldPath: artifact.fieldPath,
            sourceEvidenceId: evidenceResult.evidence?.id || evidenceResult.evidence?._id,
            generatedFromToolResult: true,
          },
          notes: 'Automatically preserved as image evidence from saved tool output.',
          tags: ['image', 'visual-evidence', 'tool-extracted'],
          addedAt: new Date().toISOString(),
          addedBy: 'Current User',
          linkedTo: [evidenceResult.evidence?.id || evidenceResult.evidence?._id].filter(Boolean),
        };
        const imageResult = await addEvidence(targetCaseId, imagePayload);
        if (imageResult?.success) {
          createEvidence({
            ...imagePayload,
            id: imageResult.evidence?.id || imageResult.evidence?._id,
            case: targetCaseId,
            caseId: targetCaseId,
            data: artifact.url,
          });
        }
      }

      createEvidence({
        ...evidencePayload,
        id: evidenceResult.evidence?.id || evidenceResult.evidence?._id,
        case: targetCaseId,
        caseId: targetCaseId,
        data: dataText || evidencePayload.title,
      });

      setSaveSuccess(true);
      toast.success(`Results saved to case${extractedImages.length ? ` with ${extractedImages.length} image artifact(s)` : ''}`);
      
      setTimeout(() => {
        onClose();
        setSaveSuccess(false);
      }, 1500);

    } catch (error) {
      console.error('Save to case failed:', error);
      toast.error(error.message || 'Failed to save to case');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className={`w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border ${
              isDark 
                ? 'bg-slate-900 border-white/10' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className={`p-6 border-b ${isDark ? 'border-white/10 bg-gradient-to-r from-violet-500/10 to-cyan-500/10' : 'border-gray-200 bg-gradient-to-r from-violet-50 to-cyan-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-lg">
                    <FolderPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Save to Case
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {toolName} {query && `- "${query}"`}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
                >
                  <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </motion.button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Create New Toggle */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCreateNew(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                    !createNew
                      ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white'
                      : isDark
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Folder className="w-5 h-5" />
                  Existing Case
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCreateNew(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                    createNew
                      ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white'
                      : isDark
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  New Case
                </motion.button>
              </div>

              {/* Existing Case Selection */}
              {!createNew && (
                <>
                  {/* Search */}
                  <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cases..."
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                      } outline-none`}
                    />
                  </div>

                  {/* Cases List */}
                  <div className="max-h-[250px] overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredCases.length > 0 ? (
                      filteredCases.map(caseItem => (
                        <motion.button
                          key={caseItem.id || caseItem.caseId || caseItem._id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => setSelectedCase(caseItem)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            (selectedCase?.id || selectedCase?.caseId || selectedCase?._id) === (caseItem.id || caseItem.caseId || caseItem._id)
                              ? 'border-violet-500 bg-violet-500/10'
                              : isDark
                                ? 'border-white/10 bg-white/5 hover:border-white/20'
                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {caseItem.title}
                                </span>
                                {selectedCase?.id === caseItem.id && (
                                  <CheckCircle className="w-4 h-4 text-violet-400" />
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {caseItem.caseId || caseItem.id || caseItem._id}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${priorityColors[caseItem.priority]}`}>
                              {caseItem.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3 text-xs">
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatTimeAgo(caseItem.lastActivity)}
                            </span>
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                              {caseItem.dataPoints} data points
                            </span>
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                              {caseItem.progress}% complete
                            </span>
                          </div>
                        </motion.button>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Folder className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                        <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          {searchQuery ? 'No cases match your search' : 'No active cases found'}
                        </p>
                        <button
                          onClick={() => setCreateNew(true)}
                          className="mt-3 text-sm text-violet-400 hover:text-violet-300"
                        >
                          Create a new case
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* New Case Form */}
              {createNew && (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Case Title *
                    </label>
                    <input
                      type="text"
                      value={newCaseTitle}
                      onChange={(e) => setNewCaseTitle(e.target.value)}
                      placeholder="Enter case title..."
                      className={`w-full px-4 py-3 rounded-xl border transition-all ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                      } outline-none`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      value={newCaseDescription}
                      onChange={(e) => {
                        descriptionEditedRef.current = true;
                        setNewCaseDescription(e.target.value);
                      }}
                      placeholder="Brief description of the investigation..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                        isDark 
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50' 
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                      } outline-none`}
                    />
                    {suggestedCaseDescription && (
                      <div className={`mt-2 rounded-xl border px-3 py-2 text-xs ${
                        isDark
                          ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200'
                          : 'border-cyan-200 bg-cyan-50 text-cyan-700'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                            <span>Auto-filled from the selected evidence. You can edit it manually before saving.</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              descriptionEditedRef.current = false;
                              setNewCaseDescription(suggestedCaseDescription);
                            }}
                            className={`shrink-0 font-semibold ${
                              isDark ? 'text-cyan-100 hover:text-white' : 'text-cyan-700 hover:text-cyan-900'
                            }`}
                          >
                            Use suggested
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FileText className="w-4 h-4 inline mr-1" />
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this evidence..."
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border transition-all resize-none ${
                    isDark 
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-violet-500/50' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-violet-500'
                  } outline-none`}
                />
              </div>

              {evidenceQuality.severity !== 'ready' && (
                <div className={`rounded-xl border p-3 text-xs ${
                  evidenceQuality.severity === 'blocked'
                    ? isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-100' : 'border-rose-200 bg-rose-50 text-rose-700'
                    : isDark ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">{evidenceQuality.label}</p>
                      <p className="mt-1">{evidenceQuality.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-emerald-400"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Saved successfully!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={onClose}
                    className={`px-4 py-2 rounded-xl text-sm ${isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveToCase}
                    disabled={isSaving || (!selectedCase && !createNew) || (createNew && !newCaseTitle.trim())}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-medium transition-all ${
                      isSaving || (!selectedCase && !createNew) || (createNew && !newCaseTitle.trim())
                        ? 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90'
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Zap className="w-4 h-4" />
                        </motion.div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4" />
                        Save to Case
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SaveToCaseModal;
