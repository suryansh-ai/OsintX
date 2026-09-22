// Case Service — REST API client for /api/cases
import api from './api';

const EP = '/cases';

export const caseService = {
  // ── Cases ──────────────────────────────────────────────────────────
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`${EP}${qs ? `?${qs}` : ''}`);
  },

  getById: (id) => api.get(`${EP}/${id}`),

  create: (data) => api.post(EP, data),

  update: (id, updates) => api.put(`${EP}/${id}`, updates),

  delete: (id) => api.delete(`${EP}/${id}`),

  updateStatus: (id, status) => api.put(`${EP}/${id}`, { status }),

  getStatistics: () => api.get(`${EP}/statistics`),

  search: (query) => caseService.getAll({ search: query }),

  // ── Evidence ───────────────────────────────────────────────────────
  addEvidence: (caseId, evidenceData) => api.post(`${EP}/${caseId}/evidence`, evidenceData),

  removeEvidence: (caseId, evidenceId) => api.delete(`${EP}/${caseId}/evidence/${evidenceId}`),

  // ── Notes ──────────────────────────────────────────────────────────
  addNote: (caseId, content) => api.post(`${EP}/${caseId}/notes`, { content }),

  deleteNote: (caseId, noteId) => api.delete(`${EP}/${caseId}/notes/${noteId}`),

  // ── Team ───────────────────────────────────────────────────────────
  addTeamMember: (caseId, memberData) => api.post(`${EP}/${caseId}/team`, memberData),

  removeTeamMember: (caseId, memberId) => api.delete(`${EP}/${caseId}/team/${memberId}`),

  updateTeamMemberRole: (caseId, memberId, role) => api.patch(`${EP}/${caseId}/team/${memberId}`, { role }),

  // ── Timeline ───────────────────────────────────────────────────────
  addTimelineEvent: (caseId, event, type = 'action') => api.post(`${EP}/${caseId}/timeline`, { event, type }),

  // ── Watchlist ──────────────────────────────────────────────────────
  addToWatchlist: (caseId, item) => api.post(`${EP}/${caseId}/watchlist`, item),

  removeFromWatchlist: (caseId, itemId) => api.delete(`${EP}/${caseId}/watchlist/${itemId}`),

  // ── Checklist ──────────────────────────────────────────────────────
  toggleChecklistItem: (caseId, itemId) => api.patch(`${EP}/${caseId}/checklist/${itemId}`),

  // ── Entities ───────────────────────────────────────────────────────
  getEntities: (caseId) => api.get(`${EP}/${caseId}/entities`),

  updateEntityVerification: (caseId, entityId, verificationStatus) =>
    api.patch(`${EP}/${caseId}/entities/${entityId}`, { verificationStatus }),

  // ── Leads ──────────────────────────────────────────────────────────
  getLeads: (caseId) => api.get(`${EP}/${caseId}/leads`),

  updateLead: (caseId, leadId, updates) => api.patch(`${EP}/${caseId}/leads/${leadId}`, updates),

  // ── Tasks / Checklist ──────────────────────────────────────────────
  getTasks: (caseId) => api.get(`${EP}/${caseId}/tasks`),

  addTask: (caseId, taskData) => api.post(`${EP}/${caseId}/tasks`, taskData),

  updateTask: (caseId, taskId, updates) => api.patch(`${EP}/${caseId}/tasks/${taskId}`, updates),

  // ── Audit ──────────────────────────────────────────────────────────
  getAuditLog: (caseId) => api.get(`${EP}/${caseId}/audit`),

  // ── Search ─────────────────────────────────────────────────────────
  searchCase: (caseId, query) => api.get(`${EP}/${caseId}/search?q=${encodeURIComponent(query)}`),

  // ── Gallery ────────────────────────────────────────────────────────
  getGallery: (caseId) => api.get(`${EP}/${caseId}/gallery`),

  // ── Review ─────────────────────────────────────────────────────────
  getReviewDashboard: (caseId) => api.get(`${EP}/${caseId}/review`),

  // ── Export ─────────────────────────────────────────────────────────
  exportCase: (caseId, format) => api.post(`${EP}/${caseId}/export`, { format }),

  // ── Evidence Review ────────────────────────────────────────────────
  updateEvidenceReview: (caseId, evidenceId, reviewStatus, notes) =>
    api.patch(`${EP}/${caseId}/evidence/${evidenceId}/review`, { reviewStatus, notes }),

  // ── Investigation Branches ─────────────────────────────────────────
  getBranches: (caseId) => api.get(`${EP}/${caseId}/branches`),

  createBranch: (caseId, data) => api.post(`${EP}/${caseId}/branches`, data),

  transitionBranch: (caseId, branchId, toState, reason) =>
    api.patch(`${EP}/${caseId}/branches/${branchId}/transition`, { toState, reason }),

  addBranchFinding: (caseId, branchId, finding) =>
    api.post(`${EP}/${caseId}/branches/${branchId}/findings`, { finding }),

  // ── Change Detection ───────────────────────────────────────────────
  detectChanges: (caseId, snapshots) =>
    api.post(`${EP}/${caseId}/change-detection`, snapshots),

  // ── Deduplication ──────────────────────────────────────────────────
  deduplicate: (caseId) => api.post(`${EP}/${caseId}/deduplicate`),

  // ── Templates ──────────────────────────────────────────────────────
  getTemplates: (caseId) => api.get(`${EP}/${caseId}/templates`),

  applyTemplate: (caseId, templateId) =>
    api.post(`${EP}/${caseId}/templates/apply`, { templateId }),

  createTemplate: (caseId, templateData) =>
    api.post(`${EP}/${caseId}/templates/create`, templateData),

  // ── Lead Queue ─────────────────────────────────────────────────────
  generateLeads: (caseId) => api.post(`${EP}/${caseId}/leads/generate`),

  bulkUpdateLeads: (caseId, { leadIds, status, priority }) =>
    api.post(`${EP}/${caseId}/leads/bulk`, { leadIds, status, priority }),

  // ── Change Detection ───────────────────────────────────────────────
  captureSnapshot: (caseId) => api.post(`${EP}/${caseId}/snapshots`),

  // ── Case Compare ──────────────────────────────────────────────────
  compareCases: (caseA, caseB) => api.post(`${EP}/compare`, { caseA, caseB }),

  // ── Watchtower ────────────────────────────────────────────────────
  getWatchedEntities: (caseId) => api.get(`${EP}/${caseId}/watchtower`),

  addWatchItem: (caseId, data) => api.post(`${EP}/${caseId}/watchtower`, data),

  updateWatchItem: (caseId, watchId, data) =>
    api.patch(`${EP}/${caseId}/watchtower/${watchId}`, data),

  removeWatchItem: (caseId, watchId) =>
    api.delete(`${EP}/${caseId}/watchtower/${watchId}`),

  checkWatchItem: (caseId, watchId) =>
    api.post(`${EP}/${caseId}/watchtower/${watchId}/check`),

  acknowledgeWatchChange: (caseId, watchId, changeIndex) =>
    api.post(`${EP}/${caseId}/watchtower/${watchId}/acknowledge`, { changeIndex }),
};

export default caseService;
