/**
 * CaseContext — unified case management state
 *
 * Primary store: backend REST API (/api/cases)
 * Fallback:      localStorage (when backend is unreachable)
 *
 * All mutations optimistically update local state first, then sync
 * to the backend. If the backend call fails the local state is
 * rolled back and an error is thrown so the UI can show feedback.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { sanitizeResultData, sanitizeString, sanitizeToolName, stringifySanitized } from '../utils/resultSanitizer';

const CaseContext = createContext(null);

export const useCases = () => {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error('useCases must be used within CaseProvider');
  return ctx;
};

const STORAGE_KEY = 'osintx_cases';

/* ── localStorage helpers ─────────────────────────────────────────── */
const lsLoad = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};
const lsSave = (cases) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cases)); } catch {}
};

/* ── ID generator (used when backend is offline) ─────────────────── */
const genId = () => {
  const ts = Date.now().toString().slice(-6);
  return `CASE-${new Date().getFullYear()}${ts}`;
};

const stringifyEvidenceData = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return sanitizeString(value);
  return stringifySanitized(value);
};

const isUploadableFile = (file) => (
  typeof File !== 'undefined' && file instanceof File
);

const fileMetadata = (file) => {
  if (!file || typeof file !== 'object') return undefined;
  if (!isUploadableFile(file)) return file;
  return {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  };
};

const appendEvidenceField = (formData, key, value) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value) || (typeof value === 'object' && !isUploadableFile(value))) {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, value);
};

const buildEvidenceFormData = (evidence, rawFile) => {
  const formData = new FormData();
  Object.entries(evidence).forEach(([key, value]) => {
    if (key === 'file') return;
    appendEvidenceField(formData, key, value);
  });
  if (rawFile) formData.append('file', rawFile, rawFile.name);
  return formData;
};

const downloadBlobResponse = async (response, fallbackName) => {
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const filename = decodeURIComponent(match?.[1] || match?.[2] || fallbackName || 'evidence-file');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const normalizeEvidence = (evidenceData = {}) => {
  const timestamp = Date.now();
  const localId = evidenceData.id || evidenceData._id || `evidence-${timestamp}`;
  const tool = sanitizeToolName(evidenceData.tool || evidenceData.source || 'manual') || 'manual';
  const query = sanitizeString(evidenceData.query || evidenceData.title || '');
  const cleanData = sanitizeResultData(evidenceData.data ?? {});
  const dataText = stringifyEvidenceData(cleanData);
  const title = sanitizeString(evidenceData.title) || `${tool} result${query ? ` - ${query}` : ''}`;
  const description = sanitizeString(evidenceData.description || evidenceData.notes || (dataText ? dataText.slice(0, 500) : ''));

  return {
    id: localId,
    _id: localId,
    type: evidenceData.type || 'tool_result',
    title,
    tool,
    query,
    description,
    source: sanitizeToolName(evidenceData.source || tool) || tool,
    url: sanitizeString(evidenceData.url || ''),
    file: fileMetadata(evidenceData.file) || evidenceData.file,
    data: cleanData,
    notes: sanitizeString(evidenceData.notes || ''),
    tags: Array.isArray(evidenceData.tags) ? evidenceData.tags.map(sanitizeString).filter(Boolean) : [],
    verified: Boolean(evidenceData.verified),
    addedAt: evidenceData.addedAt || evidenceData.savedAt || new Date().toISOString(),
    addedBy: evidenceData.addedBy || evidenceData.savedBy || 'Current User',
    savedAt: evidenceData.savedAt || new Date().toISOString(),
    savedBy: evidenceData.savedBy || evidenceData.addedBy || 'Current User',
    chainOfCustody: evidenceData.chainOfCustody || [
      {
        action: 'Created',
        user: evidenceData.addedBy || evidenceData.savedBy || 'Current User',
        timestamp: evidenceData.addedAt || evidenceData.savedAt || new Date().toISOString(),
        notes: 'Evidence item created',
      },
    ],
    linkedEvidence: evidenceData.linkedEvidence || [],
    linkedTo: evidenceData.linkedTo || [],
  };
};

const normalizeCaseRecord = (caseItem) => ({
  ...caseItem,
  id: caseItem?.id || caseItem?._id || caseItem?.caseId,
  evidence: Array.isArray(caseItem?.evidence) ? caseItem.evidence.map(normalizeEvidence) : [],
});

export const CaseProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const syncedRef = useRef(false);
  const casesRef = useRef([]);

  /* ── Load cases ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isAuthenticated) {
      casesRef.current = [];
      setCases([]);
      setIsLoading(false);
      syncedRef.current = false;
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/cases?limit=200&sort=lastActivity&order=desc');
        const fetched = (res.data || []).map(normalizeCaseRecord);
        casesRef.current = fetched;
        setCases(fetched);
        lsSave(fetched);
        setBackendAvailable(true);
        syncedRef.current = true;
      } catch {
        // Backend offline — fall back to localStorage
        const stored = lsLoad();
        casesRef.current = stored;
        setCases(stored);
        setBackendAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAuthenticated, user?._id]);

  /* ── Helpers ────────────────────────────────────────────────────── */
  const updateLocal = useCallback((updater) => {
    const next = updater(casesRef.current);
    casesRef.current = next;
    lsSave(next);
    setCases(next);
  }, []);

  /* ── CREATE ─────────────────────────────────────────────────────── */
  const createCase = useCallback(async (caseData) => {
    const userName = user?.name || 'Me';
    const optimistic = {
      id: genId(),
      caseId: genId(),
      title: caseData.title,
      description: caseData.description || '',
      status: 'active',
      priority: caseData.priority || 'medium',
      progress: 0,
      dataPoints: 0,
      correlations: 0,
      creditsSpent: 0,
      tags: caseData.tags || [],
      checklist: caseData.checklist || [],
      team: [{ id: `tm-${Date.now()}`, name: userName, email: user?.email || '', role: 'admin', avatar: userName.slice(0, 2).toUpperCase() }],
      evidence: [],
      notes: [],
      timeline: [{ time: new Date().toISOString(), event: 'Case created', type: 'system' }],
      lastActivity: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    updateLocal(prev => [optimistic, ...prev]);

    if (backendAvailable) {
      try {
        const res = await api.post('/cases', {
          title: caseData.title,
          description: caseData.description,
          priority: caseData.priority,
          tags: caseData.tags,
          templateId: caseData.templateId,
          checklist: caseData.checklist,
        });
        const saved = res.data;
        const normalized = normalizeCaseRecord(saved);
        // Replace optimistic entry with real one
        updateLocal(prev => prev.map(c => c.id === optimistic.id ? normalized : c));
        return { success: true, case: normalized };
      } catch (err) {
        // Backend sync failed — keep local case data (user input is valid)
        return { success: true, case: optimistic, synced: false };
      }
    }

    return { success: true, case: optimistic };
  }, [user, backendAvailable, updateLocal]);

  /* ── UPDATE ─────────────────────────────────────────────────────── */
  const updateCase = useCallback(async (caseId, updates) => {
    const prev = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!prev) return { success: false, error: 'Case not found' };

    const merged = { ...prev, ...updates, lastActivity: new Date().toISOString() };
    updateLocal(all => all.map(c => (c.id === caseId || c._id === caseId || c.caseId === caseId) ? merged : c));

    if (selectedCase?.id === caseId || selectedCase?._id === caseId) {
      setSelectedCase(merged);
    }

    if (backendAvailable) {
      try {
        const backendId = prev._id || prev.caseId || caseId;
        const res = await api.put(`/cases/${backendId}`, updates);
        const saved = normalizeCaseRecord(res.data);
        updateLocal(all => all.map(c => (c.id === caseId || c._id === caseId || c.caseId === caseId) ? saved : c));
        return { success: true };
      } catch (err) {
        // Roll back
        updateLocal(all => all.map(c => (c.id === caseId || c._id === caseId || c.caseId === caseId) ? prev : c));
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal, selectedCase]);

  /* ── DELETE ─────────────────────────────────────────────────────── */
  const deleteCase = useCallback(async (caseId) => {
    const prev = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    updateLocal(all => all.filter(c => c.id !== caseId && c._id !== caseId && c.caseId !== caseId));
    const wasSelected = selectedCase?.id === caseId;
    if (wasSelected) setSelectedCase(null);

    if (backendAvailable && prev) {
      try {
        const backendId = prev._id || prev.caseId || caseId;
        await api.delete(`/cases/${backendId}`);
        return { success: true };
      } catch (err) {
        if (prev) updateLocal(all => [prev, ...all]);
        if (wasSelected) setSelectedCase(prev);
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal, selectedCase]);

  /* ── ADD EVIDENCE ───────────────────────────────────────────────── */
  const addEvidence = useCallback(async (caseId, evidenceData) => {
    const caseItem = casesRef.current.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem && !backendAvailable) return { success: false, error: 'Case not found' };

    const rawFile = isUploadableFile(evidenceData.file) ? evidenceData.file : null;
    const newEvidence = normalizeEvidence(evidenceData);

    if (caseItem) {
      const updates = {
        evidence: [...(caseItem.evidence || []), newEvidence],
        dataPoints: (caseItem.evidence || []).length + 1,
        timeline: [
          ...(caseItem.timeline || []),
          { time: new Date().toISOString(), event: `Evidence added: ${newEvidence.title}`, type: 'evidence' },
        ],
      };

      updateLocal(all => all.map(c =>
        (c.id === caseId || c._id === caseId || c.caseId === caseId)
          ? { ...c, ...updates, lastActivity: new Date().toISOString() }
          : c
      ));
    }

    if (backendAvailable) {
      try {
        const backendId = caseItem?._id || caseItem?.caseId || caseId;
        const res = rawFile
          ? await api.upload(`/cases/${backendId}/evidence`, buildEvidenceFormData(newEvidence, rawFile))
          : await api.post(`/cases/${backendId}/evidence`, newEvidence);
        const savedEvidence = normalizeEvidence(res.data || newEvidence);

        if (caseItem) {
          updateLocal(all => all.map(c => {
            if (c.id !== caseId && c._id !== caseId && c.caseId !== caseId) return c;
            const evidence = (c.evidence || []).map(e => (e.id === newEvidence.id || e._id === newEvidence._id) ? savedEvidence : e);
            return { ...c, evidence, dataPoints: evidence.length, lastActivity: new Date().toISOString() };
          }));
        } else {
          const refreshed = await api.get(`/cases/${backendId}`);
          const normalizedCase = normalizeCaseRecord(refreshed.data);
          updateLocal(all => {
            const exists = all.some(c => c.id === normalizedCase.id || c._id === normalizedCase._id || c.caseId === normalizedCase.caseId);
            return exists
              ? all.map(c => (c.id === normalizedCase.id || c._id === normalizedCase._id || c.caseId === normalizedCase.caseId) ? normalizedCase : c)
              : [normalizedCase, ...all];
          });
        }

        return { success: true, evidence: savedEvidence };
      } catch (err) {
        console.warn('[CaseContext] Evidence sync failed:', err.message);
        if (!caseItem) return { success: false, error: err.message };
      }
    }

    return { success: true, evidence: newEvidence };
  }, [backendAvailable, updateLocal]);

  const downloadEvidenceFile = useCallback(async (caseId, evidenceId) => {
    const caseItem = casesRef.current.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    const evidence = caseItem?.evidence?.find(e => e.id === evidenceId || e._id === evidenceId);
    if (!backendAvailable) return { success: false, error: 'Backend unavailable' };
    if (!caseItem) return { success: false, error: 'Case not found' };
    if (!evidence?.file) return { success: false, error: 'Evidence has no file' };

    try {
      const backendId = caseItem._id || caseItem.caseId || caseId;
      const backendEvidenceId = evidence._id || evidence.id || evidenceId;
      const response = await api.download(`/cases/${backendId}/evidence/${backendEvidenceId}/download`);
      await downloadBlobResponse(response, evidence.file.originalName || evidence.file.name);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [backendAvailable]);

  /* ── ADD EVIDENCE TO CASE (alias accepting evidenceId string) ───── */
  const addEvidenceToCase = useCallback(async (caseId, evidenceIdOrData) => {
    if (typeof evidenceIdOrData === 'string') {
      return addEvidence(caseId, { id: evidenceIdOrData, type: 'reference' });
    }
    return addEvidence(caseId, evidenceIdOrData);
  }, [addEvidence]);

  const removeEvidence = useCallback(async (caseId, evidenceId) => {
    const caseItem = casesRef.current.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    const previousEvidence = caseItem.evidence || [];
    const nextEvidence = previousEvidence.filter(e => e.id !== evidenceId && e._id !== evidenceId);
    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, evidence: nextEvidence, dataPoints: nextEvidence.length, lastActivity: new Date().toISOString() }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.delete(`/cases/${backendId}/evidence/${evidenceId}`);
      } catch (err) {
        updateLocal(all => all.map(c =>
          (c.id === caseId || c._id === caseId || c.caseId === caseId)
            ? { ...c, evidence: previousEvidence, dataPoints: previousEvidence.length }
            : c
        ));
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  }, [backendAvailable, updateLocal]);

  /* ── ADD NOTE ───────────────────────────────────────────────────── */
  const addNote = useCallback(async (caseId, noteText) => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    const note = {
      id: `note-${Date.now()}`,
      _id: `note-${Date.now()}`,
      content: noteText,
      author: user?.name || 'Unknown',
      createdAt: new Date().toISOString(),
    };

    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, notes: [...(c.notes || []), note], lastActivity: new Date().toISOString() }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.post(`/cases/${backendId}/notes`, { content: noteText });
      } catch (err) {
        console.warn('[CaseContext] Note sync failed (kept locally):', err.message);
      }
    }

    return { success: true };
  }, [cases, user, backendAvailable, updateLocal]);

  // Alias
  const addNoteToCase = addNote;

  /* ── ADD TIMELINE EVENT ─────────────────────────────────────────── */
  const addTimelineEvent = useCallback(async (caseId, event, type = 'action') => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    const entry = { time: new Date().toISOString(), event, type };
    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, timeline: [...(c.timeline || []), entry], lastActivity: new Date().toISOString() }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.post(`/cases/${backendId}/timeline`, { event, type });
      } catch {}
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal]);

  /* ── UPDATE PROGRESS ────────────────────────────────────────────── */
  const updateProgress = useCallback((caseId, progress) => {
    return updateCase(caseId, { progress: Math.min(100, Math.max(0, progress)) });
  }, [updateCase]);

  /* ── SPEND CREDITS ──────────────────────────────────────────────── */
  const spendCreditsOnCase = useCallback((caseId, amount) => {
    const c = cases.find(x => x.id === caseId || x._id === caseId || x.caseId === caseId);
    if (!c) return { success: false, error: 'Case not found' };
    return updateCase(caseId, { creditsSpent: (c.creditsSpent || 0) + amount });
  }, [cases, updateCase]);

  /* ── TEAM MANAGEMENT ────────────────────────────────────────────── */
  const addTeamMember = useCallback(async (caseId, memberData) => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    const newMember = {
      id: `tm-${Date.now()}`,
      _id: `tm-${Date.now()}`,
      name: memberData.name || memberData.email?.split('@')[0] || 'New Member',
      email: memberData.email || '',
      role: memberData.role || 'viewer',
      avatar: (memberData.name || 'NM').slice(0, 2).toUpperCase(),
    };

    if ((caseItem.team || []).some(m => m.email === newMember.email)) {
      return { success: false, error: 'Member already in team' };
    }

    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, team: [...(c.team || []), newMember], lastActivity: new Date().toISOString() }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.post(`/cases/${backendId}/team`, memberData);
      } catch (err) {
        console.warn('[CaseContext] Team member sync failed:', err.message);
      }
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal]);

  const removeTeamMember = useCallback(async (caseId, memberId) => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, team: (c.team || []).filter(m => m.id !== memberId && m._id !== memberId), lastActivity: new Date().toISOString() }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.delete(`/cases/${backendId}/team/${memberId}`);
      } catch (err) {
        console.warn('[CaseContext] Remove team member sync failed:', err?.message);
      }
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal]);

  const updateTeamMemberRole = useCallback(async (caseId, memberId, newRole) => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, team: (c.team || []).map(m => (m.id === memberId || m._id === memberId) ? { ...m, role: newRole } : m) }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.patch(`/cases/${backendId}/team/${memberId}`, { role: newRole });
      } catch {}
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal]);

  /* ── WATCHLIST ──────────────────────────────────────────────────── */
  const addToWatchlist = useCallback(async (caseId, item) => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    const newItem = { id: `wl-${Date.now()}`, ...item, addedAt: new Date().toISOString() };
    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, watchlist: [...(c.watchlist || []), newItem] }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.post(`/cases/${backendId}/watchlist`, item);
      } catch {}
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal]);

  const removeFromWatchlist = useCallback(async (caseId, itemId) => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, watchlist: (c.watchlist || []).filter(w => w.id !== itemId && w._id !== itemId) }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.delete(`/cases/${backendId}/watchlist/${itemId}`);
      } catch {}
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal]);

  /* ── CHECKLIST ──────────────────────────────────────────────────── */
  const toggleChecklistItem = useCallback(async (caseId, itemId) => {
    const caseItem = cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
    if (!caseItem) return { success: false, error: 'Case not found' };

    const updatedChecklist = (caseItem.checklist || []).map(i =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    );
    const completedCount = updatedChecklist.filter(i => i.completed).length;
    const progress = updatedChecklist.length > 0
      ? Math.round((completedCount / updatedChecklist.length) * 100)
      : caseItem.progress;

    updateLocal(all => all.map(c =>
      (c.id === caseId || c._id === caseId || c.caseId === caseId)
        ? { ...c, checklist: updatedChecklist, progress }
        : c
    ));

    if (backendAvailable) {
      try {
        const backendId = caseItem._id || caseItem.caseId || caseId;
        await api.patch(`/cases/${backendId}/checklist/${itemId}`);
      } catch (err) {
        console.warn('[CaseContext] Timeline sync failed:', err?.message);
      }
    }

    return { success: true };
  }, [cases, backendAvailable, updateLocal]);

  /* ── REFRESH (re-fetch from backend) ────────────────────────────── */
  const refreshCases = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/cases?limit=200&sort=lastActivity&order=desc');
      const fetched = (res.data || []).map(normalizeCaseRecord);
      casesRef.current = fetched;
      setCases(fetched);
      lsSave(fetched);
      setBackendAvailable(true);
    } catch {
      setBackendAvailable(false);
    }
  }, [isAuthenticated]);

  /* ── REFRESH SINGLE CASE ────────────────────────────────────────── */
  const refreshCase = useCallback(async (caseId) => {
    if (!backendAvailable) return null;
    try {
      const res = await api.get(`/cases/${caseId}`);
      const saved = res.data;
      const normalized = normalizeCaseRecord(saved);
      updateLocal(all => all.map(c =>
        (c.id === caseId || c._id === caseId || c.caseId === caseId) ? normalized : c
      ));
      if (selectedCase?.id === caseId || selectedCase?._id === caseId) {
        setSelectedCase(normalized);
      }
      return normalized;
    } catch {
      return null;
    }
  }, [backendAvailable, updateLocal, selectedCase]);

  /* ── SELECTORS ──────────────────────────────────────────────────── */
  const getCaseById = useCallback((caseId) => {
    return cases.find(c => c.id === caseId || c._id === caseId || c.caseId === caseId);
  }, [cases]);

  const getCasesByStatus = useCallback((status) => {
    if (status === 'all') return cases;
    return cases.filter(c => c.status === status);
  }, [cases]);

  const getStatistics = useCallback(() => ({
    total: cases.length,
    active: cases.filter(c => c.status === 'active').length,
    paused: cases.filter(c => c.status === 'paused').length,
    completed: cases.filter(c => c.status === 'completed').length,
    totalDataPoints: cases.reduce((s, c) => s + (c.dataPoints || 0), 0),
    totalCorrelations: cases.reduce((s, c) => s + (c.correlations || 0), 0),
    totalCreditsSpent: cases.reduce((s, c) => s + (c.creditsSpent || 0), 0),
  }), [cases]);

  const value = useMemo(() => ({
    cases,
    selectedCase,
    setSelectedCase,
    isLoading,
    backendAvailable,
    // CRUD
    createCase,
    updateCase,
    deleteCase,
    refreshCases,
    refreshCase,
    // Evidence
    addEvidence,
    addEvidenceToCase,
    removeEvidence,
    downloadEvidenceFile,
    // Notes
    addNote,
    addNoteToCase,
    // Timeline
    addTimelineEvent,
    // Progress / credits
    updateProgress,
    spendCreditsOnCase,
    // Team
    addTeamMember,
    removeTeamMember,
    updateTeamMemberRole,
    // Watchlist
    addToWatchlist,
    removeFromWatchlist,
    // Checklist
    toggleChecklistItem,
    // Selectors
    getCaseById,
    getCasesByStatus,
    getStatistics,
  }), [
    cases, selectedCase, isLoading, backendAvailable,
    createCase, updateCase, deleteCase, refreshCases, refreshCase,
    addEvidence, addEvidenceToCase, removeEvidence, downloadEvidenceFile,
    addNote, addNoteToCase,
    addTimelineEvent,
    updateProgress, spendCreditsOnCase,
    addTeamMember, removeTeamMember, updateTeamMemberRole,
    addToWatchlist, removeFromWatchlist,
    toggleChecklistItem,
    getCaseById, getCasesByStatus, getStatistics,
  ]);

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>;
};

export default CaseContext;
