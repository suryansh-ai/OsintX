import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { sanitizeResultData, sanitizeString, sanitizeToolName, stringifySanitized } from '../utils/resultSanitizer';

const EvidenceContext = createContext(null);

export const useEvidence = () => {
  const context = useContext(EvidenceContext);
  if (!context) {
    throw new Error('useEvidence must be used within EvidenceProvider');
  }
  return context;
};

// Storage key for persistence
const STORAGE_KEY = 'osintx_evidence';

const stringifyEvidenceData = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return sanitizeString(value);
  return stringifySanitized(value);
};

export const EvidenceProvider = ({ children }) => {
  const { user } = useAuth();
  const [evidence, setEvidence] = useState([]);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load evidence from storage on mount
  useEffect(() => {
    const loadEvidence = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setEvidence(JSON.parse(stored));
        } catch {
          setEvidence([]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        }
      } else {
        setEvidence([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
      setIsLoading(false);
    };
    loadEvidence();
  }, []);

  // Persist evidence to storage
  const persistEvidence = useCallback((newEvidence) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEvidence));
  }, []);

  // Generate unique evidence ID
  const generateEvidenceId = useCallback(() => {
    const count = evidence.length + 1;
    return `EVD-${count.toString().padStart(3, '0')}`;
  }, [evidence]);

  // Create new evidence
  const createEvidence = useCallback((evidenceData) => {
    const newEvidence = {
      id: evidenceData.id || generateEvidenceId(),
      type: evidenceData.type || 'document',
      title: sanitizeString(evidenceData.title),
      data: stringifyEvidenceData(sanitizeResultData(evidenceData.data)),
      case: evidenceData.case || evidenceData.caseId || null,
      caseId: evidenceData.caseId || evidenceData.case || null,
      collected: evidenceData.collected || evidenceData.addedAt || new Date().toISOString(),
      correlations: 0,
      notes: sanitizeString(evidenceData.notes || ''),
      tags: Array.isArray(evidenceData.tags) ? evidenceData.tags.map(sanitizeString).filter(Boolean) : [],
      source: sanitizeToolName(evidenceData.source || evidenceData.tool || 'Manual Entry'),
      verified: Boolean(evidenceData.verified),
      collectedBy: evidenceData.addedBy || evidenceData.savedBy || user?.name || 'Anonymous'
    };

    const updatedEvidence = [newEvidence, ...evidence];
    setEvidence(updatedEvidence);
    persistEvidence(updatedEvidence);

    return { success: true, evidence: newEvidence };
  }, [evidence, generateEvidenceId, persistEvidence, user]);

  // Update evidence
  const updateEvidence = useCallback((evidenceId, updates) => {
    const updatedList = evidence.map(e => {
      if (e.id === evidenceId) {
        return { ...e, ...updates };
      }
      return e;
    });

    setEvidence(updatedList);
    persistEvidence(updatedList);

    if (selectedEvidence?.id === evidenceId) {
      setSelectedEvidence(updatedList.find(e => e.id === evidenceId));
    }

    return { success: true };
  }, [evidence, persistEvidence, selectedEvidence]);

  // Delete evidence
  const deleteEvidence = useCallback((evidenceId) => {
    const updatedList = evidence.filter(e => e.id !== evidenceId);
    setEvidence(updatedList);
    persistEvidence(updatedList);

    if (selectedEvidence?.id === evidenceId) {
      setSelectedEvidence(null);
    }

    return { success: true };
  }, [evidence, persistEvidence, selectedEvidence]);

  // Add correlation between evidence items
  const addCorrelation = useCallback((evidenceId1, evidenceId2) => {
    const updatedList = evidence.map(e => {
      if (e.id === evidenceId1 || e.id === evidenceId2) {
        return { ...e, correlations: e.correlations + 1 };
      }
      return e;
    });

    setEvidence(updatedList);
    persistEvidence(updatedList);

    return { success: true };
  }, [evidence, persistEvidence]);

  // Verify evidence
  const verifyEvidence = useCallback((evidenceId) => {
    return updateEvidence(evidenceId, { verified: true });
  }, [updateEvidence]);

  // Link evidence to case
  const linkToCase = useCallback((evidenceId, caseId) => {
    return updateEvidence(evidenceId, { case: caseId });
  }, [updateEvidence]);

  // Unlink evidence from case
  const unlinkFromCase = useCallback((evidenceId) => {
    return updateEvidence(evidenceId, { case: null });
  }, [updateEvidence]);

  // Add tag to evidence
  const addTag = useCallback((evidenceId, tag) => {
    const item = evidence.find(e => e.id === evidenceId);
    if (!item) return { success: false, error: 'Evidence not found' };

    if (item.tags.includes(tag)) {
      return { success: false, error: 'Tag already exists' };
    }

    return updateEvidence(evidenceId, { tags: [...item.tags, tag] });
  }, [evidence, updateEvidence]);

  // Remove tag from evidence
  const removeTag = useCallback((evidenceId, tag) => {
    const item = evidence.find(e => e.id === evidenceId);
    if (!item) return { success: false, error: 'Evidence not found' };

    return updateEvidence(evidenceId, { tags: item.tags.filter(t => t !== tag) });
  }, [evidence, updateEvidence]);

  // Get evidence by ID
  const getEvidenceById = useCallback((evidenceId) => {
    return evidence.find(e => e.id === evidenceId);
  }, [evidence]);

  // Get evidence by case
  const getEvidenceByCase = useCallback((caseId) => {
    return evidence.filter(e => e.case === caseId);
  }, [evidence]);

  // Get evidence by type
  const getEvidenceByType = useCallback((type) => {
    if (type === 'all') return evidence;
    return evidence.filter(e => e.type === type);
  }, [evidence]);

  // Search evidence
  const searchEvidence = useCallback((query) => {
    const lowerQuery = query.toLowerCase();
    return evidence.filter(e =>
      (e.title || '').toLowerCase().includes(lowerQuery) ||
      stringifyEvidenceData(e.data).toLowerCase().includes(lowerQuery) ||
      (e.notes || '').toLowerCase().includes(lowerQuery) ||
      e.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }, [evidence]);

  // Get evidence statistics
  const getStatistics = useCallback(() => {
    const types = [...new Set(evidence.map(e => e.type))];
    const typeBreakdown = types.reduce((acc, type) => {
      acc[type] = evidence.filter(e => e.type === type).length;
      return acc;
    }, {});

    return {
      total: evidence.length,
      verified: evidence.filter(e => e.verified).length,
      unverified: evidence.filter(e => !e.verified).length,
      linked: evidence.filter(e => e.case).length,
      unlinked: evidence.filter(e => !e.case).length,
      totalCorrelations: evidence.reduce((sum, e) => sum + e.correlations, 0),
      types: typeBreakdown,
      uniqueCases: [...new Set(evidence.filter(e => e.case).map(e => e.case))].length
    };
  }, [evidence]);

  // Get all unique tags
  const getAllTags = useCallback(() => {
    const allTags = evidence.flatMap(e => e.tags);
    return [...new Set(allTags)];
  }, [evidence]);

  const value = {
    evidence,
    selectedEvidence,
    setSelectedEvidence,
    isLoading,
    createEvidence,
    updateEvidence,
    deleteEvidence,
    addCorrelation,
    verifyEvidence,
    linkToCase,
    unlinkFromCase,
    addTag,
    removeTag,
    getEvidenceById,
    getEvidenceByCase,
    getEvidenceByType,
    searchEvidence,
    getStatistics,
    getAllTags
  };

  return (
    <EvidenceContext.Provider value={value}>
      {children}
    </EvidenceContext.Provider>
  );
};

export default EvidenceContext;
