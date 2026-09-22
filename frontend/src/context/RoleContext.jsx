import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const RoleContext = createContext(null);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
};

// Role-specific configurations - ALL INVESTIGATORS, different depth/limits
const roleConfigs = {
  student: {
    theme: 'student',
    colorPrimary: '#06b6d4',
    colorSecondary: '#0891b2',
    colorAccent: '#22d3ee',
    bgGradient: 'from-slate-950 via-cyan-950/30 to-slate-950',
    dashboardPath: '/dashboard/student',
    displayName: 'Restricted Field Interface',
    displaySubtitle: 'Limited Depth • Fast Credit Burn • System Warnings',
    icon: '🎓',
    animationStyle: 'fast', // fast, light, sharp
    outputDepth: 'restricted',
    correlationLayers: 1,
    creditMultiplier: 1.5, // Higher cost
    features: {
      allTools: true,
      limitedDepth: true,
      frequentWarnings: true,
      compactPanels: true
    }
  },
  user: {
    theme: 'user',
    colorPrimary: '#f59e0b',
    colorSecondary: '#d97706',
    colorAccent: '#fbbf24',
    bgGradient: 'from-stone-950 via-amber-950/20 to-stone-950',
    dashboardPath: '/dashboard/user',
    displayName: 'Open Investigation Workspace',
    displaySubtitle: 'Standard Depth • Flexible Layout • Full Correlation',
    icon: '👤',
    animationStyle: 'balanced', // balanced, fluid
    outputDepth: 'standard',
    correlationLayers: 3,
    creditMultiplier: 1.0,
    features: {
      allTools: true,
      freeformWorkspace: true,
      caseManagement: true,
      evidenceLocker: true,
      reportGeneration: true,
      dragAndDrop: true
    }
  }
};

// All tools available to all roles
const allTools = [
  {
    id: 'start-investigation',
    name: 'Start Investigation',
    description: 'Initiate a new OSINT investigation with automated target profiling and data collection across multiple sources.',
    shortDesc: 'Begin automated OSINT investigation',
    category: 'analysis',
    creditCost: { student: 5, user: 3 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'target (IP, domain, email, etc.)'
  },
  {
    id: 'case-management',
    name: 'Case Management',
    description: 'Organize and manage investigation cases with evidence tracking, notes, and team collaboration.',
    shortDesc: 'Organize investigation cases',
    category: 'analysis',
    creditCost: { student: 2, user: 1 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'case details'
  },
  {
    id: 'request-information',
    name: 'Request Information',
    description: 'Submit data requests to partner agencies and collaborate on cross-jurisdiction investigations.',
    shortDesc: 'Submit intelligence requests',
    category: 'analysis',
    creditCost: { student: 3, user: 2 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'request parameters'
  },
  {
    id: 'osint-library',
    name: 'OSINT Library',
    description: 'Browse a curated library of OSINT resources, techniques, and reference materials for investigations.',
    shortDesc: 'Browse OSINT resources',
    category: 'analysis',
    creditCost: { student: 1, user: 0 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'search query'
  },
  {
    id: 'dork-generator',
    name: 'Dork Generator',
    description: 'Generate advanced Google dork queries for targeted information gathering and reconnaissance.',
    shortDesc: 'Generate search dork queries',
    category: 'analysis',
    creditCost: { student: 3, user: 2 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'search parameters'
  },
  {
    id: 'bulk-ip-tracer',
    name: 'Bulk IP Tracer',
    description: 'Trace and geolocate multiple IP addresses simultaneously with network intelligence data.',
    shortDesc: 'Trace multiple IP addresses',
    category: 'network',
    creditCost: { student: 8, user: 5 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'IP addresses (one per line)'
  },
  {
    id: 'location-tracker',
    name: 'Location Tracker',
    description: 'Track and map geographic locations from IP addresses, coordinates, or device data.',
    shortDesc: 'Track geographic locations',
    category: 'network',
    creditCost: { student: 5, user: 3 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'IP or coordinates'
  },
  {
    id: 'coord-lookup',
    name: 'Coordinate Lookup',
    description: 'Reverse geocode coordinates to addresses and identify points of interest in the area.',
    shortDesc: 'Reverse geocode coordinates',
    category: 'network',
    creditCost: { student: 3, user: 2 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'latitude, longitude'
  },
  {
    id: 'malware-scan',
    name: 'Malware Scan',
    description: 'Analyze files and URLs for malware, viruses, and other security threats using multiple engines.',
    shortDesc: 'Scan for malware threats',
    category: 'forensics',
    creditCost: { student: 10, user: 5 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 2, user: 4 },
    inputType: 'file hash or URL'
  },
  {
    id: 'comm-sandbox',
    name: 'Communication Sandbox',
    description: 'Safely analyze suspicious communications and attachments in an isolated sandbox environment.',
    shortDesc: 'Analyze communications safely',
    category: 'forensics',
    creditCost: { student: 8, user: 4 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'communication data'
  },
  {
    id: 'ipdr-enrichment',
    name: 'IPDR Enrichment',
    description: 'Enrich IP Detail Records with geolocation, network info, and threat intelligence context.',
    shortDesc: 'Enrich IP detail records',
    category: 'network',
    creditCost: { student: 5, user: 3 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'IPDR data'
  },
  {
    id: 'audio-analysis',
    name: 'Audio Analysis',
    description: 'Analyze audio files for metadata, spectrogram patterns, and embedded information.',
    shortDesc: 'Analyze audio files',
    category: 'forensics',
    creditCost: { student: 7, user: 4 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'audio file URL'
  },
  {
    id: 'device-permissions',
    name: 'Device Permissions',
    description: 'Audit device permissions and identify potential data access vulnerabilities.',
    shortDesc: 'Audit device permissions',
    category: 'forensics',
    creditCost: { student: 4, user: 2 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'device data'
  },
  {
    id: 'evidence-locker',
    name: 'Evidence Locker',
    description: 'Securely store, tag, and manage digital evidence with chain of custody tracking.',
    shortDesc: 'Store and manage evidence',
    category: 'forensics',
    creditCost: { student: 2, user: 1 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 3 },
    inputType: 'evidence description'
  },
  {
    id: 'report-generator',
    name: 'Report Generator',
    description: 'Generate professional investigation reports in PDF, DOCX, or HTML format with all findings.',
    shortDesc: 'Generate investigation reports',
    category: 'analysis',
    creditCost: { student: 5, user: 3 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'case ID or data'
  },
  {
    id: 'team-directory',
    name: 'Team Directory',
    description: 'Browse and manage investigation team members, their roles, and contact information.',
    shortDesc: 'Manage team members',
    category: 'social',
    creditCost: { student: 1, user: 0 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'search query'
  },
  {
    id: 'audit-logs',
    name: 'Audit Logs',
    description: 'Review detailed audit logs of all investigation activities, tool usage, and data access.',
    shortDesc: 'Review investigation audit logs',
    category: 'analysis',
    creditCost: { student: 2, user: 1 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'filter parameters'
  },
  {
    id: 'police-directory',
    name: 'Police Directory',
    description: 'Access law enforcement agency directory with jurisdictional information and contact details.',
    shortDesc: 'Law enforcement directory',
    category: 'social',
    creditCost: { student: 3, user: 1 },
    outputDepth: { student: 'restricted', user: 'standard' },
    correlationLayers: { student: 1, user: 2 },
    inputType: 'agency name or location'
  }
];

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();

  const roleData = useMemo(() => {
    const role = user?.role || 'student';
    const config = roleConfigs[role] || roleConfigs.student;

    return {
      currentRole: role,
      roleConfig: config,
      config: config, // Alias for backward compatibility
      tools: allTools, // Export tools list
      // All roles can access all tools
      canAccessTool: () => true,
      getAllTools: () => allTools,
      hasFeature: (feature) => config.features[feature] || false,
      getOutputDepth: () => config.outputDepth,
      getCorrelationLayers: () => config.correlationLayers,
      getCreditMultiplier: () => config.creditMultiplier,
      getAnimationStyle: () => config.animationStyle,
      getThemeClasses: () => ({
        bg: `bg-gradient-to-br ${config.bgGradient}`,
        text: `text-${config.theme}-primary`,
        border: `border-${config.theme}-primary/30`,
        glow: `glow-${config.theme}`,
        glass: `glass-${config.theme}`,
        grid: config.theme === 'student' ? 'investigation-grid' : 
              'investigation-grid-user'
      }),
      isStudent: role === 'student',
      isUser: role === 'user'
    };
  }, [user?.role]);

  return (
    <RoleContext.Provider value={roleData}>
      {children}
    </RoleContext.Provider>
  );
};

export default RoleContext;
