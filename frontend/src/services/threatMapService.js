/**
 * Threat Map Service
 * API service for global cyber threat intelligence and real-time attack monitoring
 */

import { api } from './api';

// ==================== DATA MODELS ====================

/**
 * @typedef {Object} City
 * @property {string} id - Unique city identifier
 * @property {string} name - City name
 * @property {string} country - Country name
 * @property {[number, number]} coords - [longitude, latitude] coordinates
 * @property {'critical'|'high'|'medium'|'low'} threat - Threat level
 * @property {number} attacks - Total attack count
 * @property {string} type - City type (e.g., 'Tech Hub', 'Financial Hub', 'APT Origin')
 */

/**
 * @typedef {Object} ThreatIntel
 * @property {string} id - Unique threat ID
 * @property {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} severity - Threat severity
 * @property {string} source - Intelligence source (e.g., 'NSA', 'CISA', 'Mandiant')
 * @property {string} title - Threat description
 * @property {string} region - Affected region
 * @property {string} ioc - Indicator of Compromise
 * @property {number} timestamp - Unix timestamp
 * @property {string[]} [tags] - Related tags
 * @property {string} [malwareFamily] - Associated malware family
 * @property {string} [threatActor] - Known threat actor
 */

/**
 * @typedef {Object} AttackLine
 * @property {string} id - Unique attack ID
 * @property {City} source - Source city of the attack
 * @property {City} target - Target city of the attack
 * @property {string} type - Attack type (DDoS, Ransomware, APT, etc.)
 * @property {number} packets - Number of packets/requests
 * @property {number} timestamp - Attack timestamp
 * @property {string} [protocol] - Network protocol used
 * @property {number} [severity] - Attack severity score (1-10)
 */

/**
 * @typedef {Object} GlobalStats
 * @property {number} attacksPerSec - Current attacks per second
 * @property {number} activeThreats - Number of active threats
 * @property {number} blockedIPs - Total blocked IP addresses
 * @property {number} dataExfiltrated - Data exfiltrated in TB
 * @property {number} botnets - Active botnets detected
 * @property {number} compromised - Compromised systems count
 * @property {number} [malwareDetected] - Malware samples detected today
 * @property {number} [phishingCampaigns] - Active phishing campaigns
 */

/**
 * @typedef {Object} ThreatLevel
 * @property {number} level - Current threat level (0-100)
 * @property {'DEFCON1'|'DEFCON2'|'DEFCON3'|'DEFCON4'|'DEFCON5'} defcon - DEFCON status
 * @property {string} status - Human-readable status
 * @property {string} trend - 'increasing' | 'decreasing' | 'stable'
 */

/**
 * @typedef {Object} RegionStats
 * @property {string} region - Region name
 * @property {number} attackCount - Number of attacks
 * @property {number} threatLevel - Regional threat level
 * @property {string[]} topThreats - Top threat types
 * @property {City[]} hotspots - Critical cities
 */

/**
 * @typedef {Object} AttackType
 * @property {string} type - Attack type name
 * @property {number} count - Number of occurrences
 * @property {number} percentage - Percentage of total attacks
 * @property {string} trend - 'up' | 'down' | 'stable'
 */

/**
 * @typedef {Object} ThreatActor
 * @property {string} id - Actor identifier
 * @property {string} name - Actor name (e.g., 'APT41', 'Lazarus Group')
 * @property {string} origin - Country of origin
 * @property {string[]} targets - Target sectors
 * @property {string[]} ttps - Tactics, Techniques, and Procedures
 * @property {'active'|'dormant'|'unknown'} status - Current status
 * @property {number} threatScore - Threat score (1-100)
 */

/**
 * @typedef {Object} CVE
 * @property {string} id - CVE ID (e.g., 'CVE-2025-0001')
 * @property {string} description - Vulnerability description
 * @property {number} cvssScore - CVSS score
 * @property {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} severity - Severity rating
 * @property {boolean} exploitedInWild - Whether actively exploited
 * @property {string[]} affectedProducts - Affected products
 * @property {string} [patch] - Patch information
 */

// ==================== API ENDPOINTS ====================

const ENDPOINTS = {
  // Real-time data
  CITIES: '/threat-map/cities',
  LIVE_ATTACKS: '/threat-map/attacks/live',
  GLOBAL_STATS: '/threat-map/stats/global',
  THREAT_LEVEL: '/threat-map/threat-level',
  
  // Threat intelligence
  THREAT_INTEL: '/threat-map/intel',
  THREAT_ACTORS: '/threat-map/actors',
  CVE_FEED: '/threat-map/cve',
  IOC_FEED: '/threat-map/ioc',
  
  // Regional data
  REGIONS: '/threat-map/regions',
  REGION_STATS: '/threat-map/regions/:region/stats',
  
  // Historical data
  ATTACK_HISTORY: '/threat-map/attacks/history',
  STATS_HISTORY: '/threat-map/stats/history',
  
  // Alerts
  ALERTS: '/threat-map/alerts',
  ALERT_SUBSCRIBE: '/threat-map/alerts/subscribe',
  
  // Search & Filter
  SEARCH: '/threat-map/search',
  FILTER_ATTACKS: '/threat-map/attacks/filter',
};

// ==================== SERVICE METHODS ====================

const threatMapService = {
  // ==================== CITIES & LOCATIONS ====================
  
  /**
   * Get all monitored cities with threat data
   * @param {Object} [params] - Query parameters
   * @param {string} [params.threatLevel] - Filter by threat level
   * @param {string} [params.region] - Filter by region
   * @returns {Promise<City[]>}
   */
  getCities: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${ENDPOINTS.CITIES}?${queryString}` : ENDPOINTS.CITIES;
    return api.get(endpoint);
  },

  /**
   * Get city details by ID
   * @param {string} cityId - City identifier
   * @returns {Promise<City>}
   */
  getCityById: async (cityId) => {
    return api.get(`${ENDPOINTS.CITIES}/${cityId}`);
  },

  /**
   * Get cities by threat level
   * @param {'critical'|'high'|'medium'|'low'} level - Threat level
   * @returns {Promise<City[]>}
   */
  getCitiesByThreatLevel: async (level) => {
    return api.get(`${ENDPOINTS.CITIES}?threatLevel=${level}`);
  },

  // ==================== LIVE ATTACKS ====================

  /**
   * Get real-time attack feed
   * @param {Object} [params] - Query parameters
   * @param {number} [params.limit=10] - Number of attacks to return
   * @param {string} [params.type] - Filter by attack type
   * @returns {Promise<AttackLine[]>}
   */
  getLiveAttacks: async (params = { limit: 10 }) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`${ENDPOINTS.LIVE_ATTACKS}?${queryString}`);
  },

  /**
   * Get attacks by type
   * @param {string} attackType - Attack type (DDoS, Ransomware, APT, etc.)
   * @returns {Promise<AttackLine[]>}
   */
  getAttacksByType: async (attackType) => {
    return api.get(`${ENDPOINTS.LIVE_ATTACKS}?type=${attackType}`);
  },

  /**
   * Get attacks targeting specific city
   * @param {string} cityId - Target city ID
   * @returns {Promise<AttackLine[]>}
   */
  getAttacksTargetingCity: async (cityId) => {
    return api.get(`${ENDPOINTS.LIVE_ATTACKS}?targetCity=${cityId}`);
  },

  /**
   * Get attacks originating from specific city
   * @param {string} cityId - Source city ID
   * @returns {Promise<AttackLine[]>}
   */
  getAttacksFromCity: async (cityId) => {
    return api.get(`${ENDPOINTS.LIVE_ATTACKS}?sourceCity=${cityId}`);
  },

  // ==================== GLOBAL STATISTICS ====================

  /**
   * Get current global statistics
   * @returns {Promise<GlobalStats>}
   */
  getGlobalStats: async () => {
    return api.get(ENDPOINTS.GLOBAL_STATS);
  },

  /**
   * Get current threat level
   * @returns {Promise<ThreatLevel>}
   */
  getThreatLevel: async () => {
    return api.get(ENDPOINTS.THREAT_LEVEL);
  },

  /**
   * Get attack type breakdown
   * @returns {Promise<AttackType[]>}
   */
  getAttackTypeBreakdown: async () => {
    return api.get(`${ENDPOINTS.GLOBAL_STATS}/attack-types`);
  },

  // ==================== THREAT INTELLIGENCE ====================

  /**
   * Get threat intelligence feed
   * @param {Object} [params] - Query parameters
   * @param {string} [params.severity] - Filter by severity
   * @param {string} [params.region] - Filter by region
   * @param {number} [params.limit=20] - Number of results
   * @returns {Promise<ThreatIntel[]>}
   */
  getThreatIntel: async (params = { limit: 20 }) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`${ENDPOINTS.THREAT_INTEL}?${queryString}`);
  },

  /**
   * Get threat intel by severity
   * @param {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} severity - Severity level
   * @returns {Promise<ThreatIntel[]>}
   */
  getThreatIntelBySeverity: async (severity) => {
    return api.get(`${ENDPOINTS.THREAT_INTEL}?severity=${severity}`);
  },

  /**
   * Get known threat actors
   * @param {Object} [params] - Query parameters
   * @param {string} [params.origin] - Filter by country of origin
   * @param {string} [params.status] - Filter by status
   * @returns {Promise<ThreatActor[]>}
   */
  getThreatActors: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${ENDPOINTS.THREAT_ACTORS}?${queryString}` : ENDPOINTS.THREAT_ACTORS;
    return api.get(endpoint);
  },

  /**
   * Get threat actor details
   * @param {string} actorId - Threat actor identifier
   * @returns {Promise<ThreatActor>}
   */
  getThreatActorById: async (actorId) => {
    return api.get(`${ENDPOINTS.THREAT_ACTORS}/${actorId}`);
  },

  /**
   * Get CVE/vulnerability feed
   * @param {Object} [params] - Query parameters
   * @param {boolean} [params.exploitedOnly=false] - Only actively exploited
   * @param {string} [params.severity] - Filter by severity
   * @returns {Promise<CVE[]>}
   */
  getCVEFeed: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${ENDPOINTS.CVE_FEED}?${queryString}` : ENDPOINTS.CVE_FEED;
    return api.get(endpoint);
  },

  /**
   * Get indicators of compromise (IOCs)
   * @param {Object} [params] - Query parameters
   * @param {string} [params.type] - IOC type (ip, domain, hash, etc.)
   * @param {number} [params.limit=100] - Number of results
   * @returns {Promise<Object[]>}
   */
  getIOCFeed: async (params = { limit: 100 }) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`${ENDPOINTS.IOC_FEED}?${queryString}`);
  },

  // ==================== REGIONAL DATA ====================

  /**
   * Get all regions
   * @returns {Promise<string[]>}
   */
  getRegions: async () => {
    return api.get(ENDPOINTS.REGIONS);
  },

  /**
   * Get statistics for a specific region
   * @param {string} region - Region name
   * @returns {Promise<RegionStats>}
   */
  getRegionStats: async (region) => {
    return api.get(ENDPOINTS.REGION_STATS.replace(':region', region));
  },

  // ==================== HISTORICAL DATA ====================

  /**
   * Get attack history
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date (ISO string)
   * @param {string} params.endDate - End date (ISO string)
   * @param {string} [params.interval='hour'] - Data interval (minute, hour, day)
   * @returns {Promise<Object[]>}
   */
  getAttackHistory: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`${ENDPOINTS.ATTACK_HISTORY}?${queryString}`);
  },

  /**
   * Get historical statistics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date
   * @param {string} params.endDate - End date
   * @param {string} [params.metric] - Specific metric to fetch
   * @returns {Promise<Object[]>}
   */
  getStatsHistory: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`${ENDPOINTS.STATS_HISTORY}?${queryString}`);
  },

  // ==================== ALERTS ====================

  /**
   * Get active alerts
   * @param {Object} [params] - Query parameters
   * @param {string} [params.severity] - Filter by severity
   * @param {boolean} [params.unreadOnly=false] - Only unread alerts
   * @returns {Promise<Object[]>}
   */
  getAlerts: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${ENDPOINTS.ALERTS}?${queryString}` : ENDPOINTS.ALERTS;
    return api.get(endpoint);
  },

  /**
   * Mark alert as read
   * @param {string} alertId - Alert identifier
   * @returns {Promise<Object>}
   */
  markAlertRead: async (alertId) => {
    return api.patch(`${ENDPOINTS.ALERTS}/${alertId}`, { read: true });
  },

  /**
   * Subscribe to threat alerts
   * @param {Object} subscription - Subscription config
   * @param {string[]} subscription.regions - Regions to monitor
   * @param {string[]} subscription.severities - Severity levels
   * @param {string[]} subscription.attackTypes - Attack types to watch
   * @returns {Promise<Object>}
   */
  subscribeToAlerts: async (subscription) => {
    return api.post(ENDPOINTS.ALERT_SUBSCRIBE, subscription);
  },

  // ==================== SEARCH & FILTER ====================

  /**
   * Search threat data
   * @param {string} query - Search query
   * @param {Object} [options] - Search options
   * @param {string[]} [options.types] - Types to search (cities, threats, actors)
   * @returns {Promise<Object>}
   */
  search: async (query, options = {}) => {
    return api.post(ENDPOINTS.SEARCH, { query, ...options });
  },

  /**
   * Filter attacks with advanced criteria
   * @param {Object} filters - Filter criteria
   * @param {string[]} [filters.types] - Attack types
   * @param {string[]} [filters.sources] - Source cities
   * @param {string[]} [filters.targets] - Target cities
   * @param {string} [filters.startDate] - Start date
   * @param {string} [filters.endDate] - End date
   * @param {number} [filters.minSeverity] - Minimum severity
   * @returns {Promise<AttackLine[]>}
   */
  filterAttacks: async (filters) => {
    return api.post(ENDPOINTS.FILTER_ATTACKS, filters);
  },

  // ==================== WEBSOCKET / REAL-TIME ====================

  /**
   * Create WebSocket connection for real-time updates
   * @param {Object} handlers - Event handlers
   * @param {Function} handlers.onAttack - Called when new attack detected
   * @param {Function} handlers.onThreat - Called when new threat intel arrives
   * @param {Function} handlers.onStats - Called when stats update
   * @param {Function} handlers.onAlert - Called when alert triggered
   * @returns {WebSocket}
   */
  createLiveConnection: (handlers) => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000/ws/threat-map';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[ThreatMap] WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'ATTACK':
            handlers.onAttack?.(data.payload);
            break;
          case 'THREAT_INTEL':
            handlers.onThreat?.(data.payload);
            break;
          case 'STATS_UPDATE':
            handlers.onStats?.(data.payload);
            break;
          case 'ALERT':
            handlers.onAlert?.(data.payload);
            break;
          default:
            console.log('[ThreatMap] Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('[ThreatMap] WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[ThreatMap] WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('[ThreatMap] WebSocket disconnected');
    };

    return ws;
  },

  // ==================== UTILITY METHODS ====================

  /**
   * Get DEFCON level from threat score
   * @param {number} threatLevel - Threat level (0-100)
   * @returns {string}
   */
  getDefconLevel: (threatLevel) => {
    if (threatLevel > 80) return 'DEFCON1';
    if (threatLevel > 65) return 'DEFCON2';
    if (threatLevel > 50) return 'DEFCON3';
    if (threatLevel > 35) return 'DEFCON4';
    return 'DEFCON5';
  },

  /**
   * Get threat color based on level
   * @param {'critical'|'high'|'medium'|'low'} threat - Threat level
   * @returns {Object}
   */
  getThreatColors: (threat) => {
    const colors = {
      critical: { fill: '#ef4444', stroke: '#dc2626', glow: 'drop-shadow(0 0 8px #ef4444)' },
      high: { fill: '#f97316', stroke: '#ea580c', glow: 'drop-shadow(0 0 6px #f97316)' },
      medium: { fill: '#eab308', stroke: '#ca8a04', glow: 'drop-shadow(0 0 4px #eab308)' },
      low: { fill: '#22c55e', stroke: '#16a34a', glow: 'drop-shadow(0 0 3px #22c55e)' }
    };
    return colors[threat] || colors.medium;
  },

  /**
   * Get severity CSS classes
   * @param {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} severity - Severity level
   * @returns {string}
   */
  getSeverityClasses: (severity) => {
    const classes = {
      CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
      HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
      MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
      LOW: 'bg-green-500/20 text-green-400 border-green-500/40'
    };
    return classes[severity] || classes.MEDIUM;
  },

  /**
   * Format time difference for display
   * @param {number} timestamp - Unix timestamp
   * @returns {string}
   */
  formatTimeDiff: (timestamp) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  },

  /**
   * Format large numbers for display
   * @param {number} num - Number to format
   * @returns {string}
   */
  formatNumber: (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  },
};

export default threatMapService;

// Named exports for convenience
export const {
  getCities,
  getCityById,
  getCitiesByThreatLevel,
  getLiveAttacks,
  getAttacksByType,
  getAttacksTargetingCity,
  getAttacksFromCity,
  getGlobalStats,
  getThreatLevel,
  getAttackTypeBreakdown,
  getThreatIntel,
  getThreatIntelBySeverity,
  getThreatActors,
  getThreatActorById,
  getCVEFeed,
  getIOCFeed,
  getRegions,
  getRegionStats,
  getAttackHistory,
  getStatsHistory,
  getAlerts,
  markAlertRead,
  subscribeToAlerts,
  search,
  filterAttacks,
  createLiveConnection,
  getDefconLevel,
  getThreatColors,
  getSeverityClasses,
  formatTimeDiff,
  formatNumber,
} = threatMapService;
