// Alpha_X Service — Direct API calls (bypasses circuit breaker)
// Alpha_X operations are independent and shouldn't be blocked by
// other service failures tripping the shared circuit breaker.

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const ENDPOINT = `${API_BASE}/telegram`;

/** Direct fetch helper — no circuit breaker, includes auth token if available */
const tgFetch = async (path, options = {}) => {
  const token = localStorage.getItem('osintx_token');
  const url = `${ENDPOINT}${path}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  const res = await fetch(url, config);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

const tgGet = (path) => tgFetch(path, { method: 'GET' });
const tgPost = (path, body) => tgFetch(path, { method: 'POST', body: JSON.stringify(body) });

export const telegramService = {
  // ─── Login Flow ────────────────────────────────────────────────

  /** Request OTP code for a phone number */
  sendCode: async (phone) => {
    return tgPost(`/send-code`, { phone });
  },

  /** Verify OTP code */
  verifyCode: async (phone, code) => {
    return tgPost(`/verify-code`, { phone, code });
  },

  /** Complete 2FA with cloud password */
  verify2FA: async (phone, password) => {
    return tgPost(`/verify-2fa`, { phone, password });
  },

  // ─── Session Management ────────────────────────────────────────

  /** Get current Alpha_X session status */
  getStatus: async () => {
    return tgGet(`/status`);
  },

  /** Revoke/logout Alpha_X session */
  revokeSession: async () => {
    return tgPost(`/revoke`);
  },

  // ─── Bot Interaction ───────────────────────────────────────────

  /** Send a raw command to the Alpha_X provider */
  sendBotCommand: async (botUsername, command, timeout = 30000) => {
    return tgPost(`/bot/command`, { botUsername, command, timeout });
  },

  /** Execute a registered tool by name (generic) */
  executeTool: async (toolName, input) => {
    return tgPost(`/bot/tool`, { toolName, input });
  },

  /** Get list of available tools */
  getTools: async () => {
    return tgGet(`/tools`);
  },

  // ─── Individual Tool Endpoints ─────────────────────────────────

  /** Email OSINT search */
  searchEmail: async (input) => {
    return tgPost(`/tools/email`, { input });
  },

  /** Phone OSINT search */
  searchPhone: async (input) => {
    return tgPost(`/tools/phone`, { input });
  },

  /** Name/nick OSINT search */
  searchName: async (input) => {
    return tgPost(`/tools/name`, { input });
  },

  /** IP address OSINT search */
  searchIP: async (input) => {
    return tgPost(`/tools/ip`, { input });
  },

  /** Password breach search */
  searchPassword: async (input) => {
    return tgPost(`/tools/password`, { input });
  },

  /** Domain OSINT search */
  searchDomain: async (input) => {
    return tgPost(`/tools/domain`, { input });
  },

  /** Alpha_X account search */
  searchTelegram: async (input) => {
    return tgPost(`/tools/telegram`, { input });
  },

  /** VIN vehicle search */
  searchVIN: async (input) => {
    return tgPost(`/tools/vin`, { input });
  },

  /** Composite multi-query search */
  searchComposite: async (input) => {
    return tgPost(`/tools/composite`, { input });
  },
};

export default telegramService;
