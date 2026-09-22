// Comprehensive geographic data with hierarchy: Region -> Country -> State -> City
export const GEOGRAPHIC_REGIONS = {
  'North America': {
    color: '#6366f1',
    countries: {
      'United States': {
        bounds: { lat: [24, 50], lng: [-125, -66] },
        threatLevel: 0.85,
        states: {
          'California': {
            bounds: { lat: [32.5, 42], lng: [-124, -114.1] },
            cities: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento'],
            threatLevel: 0.82,
            infrastructure: 'Tech Hub, Entertainment, Finance',
          },
          'New York': {
            bounds: { lat: [40.5, 45], lng: [-79.8, -71.9] },
            cities: ['New York', 'Buffalo'],
            threatLevel: 0.92,
            infrastructure: 'Financial Hub, Tech Infrastructure',
          },
          'Illinois': {
            bounds: { lat: [36.9, 42.5], lng: [-91.5, -87.1] },
            cities: ['Chicago'],
            threatLevel: 0.78,
            infrastructure: 'Transportation Hub, Finance',
          },
          'Texas': {
            bounds: { lat: [25.8, 36.5], lng: [-106.6, -93.5] },
            cities: ['Houston', 'Dallas'],
            threatLevel: 0.75,
            infrastructure: 'Energy Sector, Tech',
          },
        },
      },
      'Canada': {
        bounds: { lat: [41.7, 83.1], lng: [-141, -52.6] },
        threatLevel: 0.65,
        states: {
          'Ontario': {
            bounds: { lat: [41.7, 56.9], lng: [-95.3, -74.3] },
            cities: ['Toronto', 'Ottawa'],
            threatLevel: 0.68,
            infrastructure: 'Tech, Finance, Government',
          },
        },
      },
    },
  },
  'Europe': {
    color: '#ec4899',
    countries: {
      'United Kingdom': {
        bounds: { lat: [50, 59], lng: [-8, 2] },
        threatLevel: 0.78,
        cities: ['London', 'Manchester'],
        infrastructure: 'Financial Hub, Government',
      },
      'Germany': {
        bounds: { lat: [47.3, 55.9], lng: [5.9, 15.9] },
        threatLevel: 0.72,
        cities: ['Berlin', 'Frankfurt'],
        infrastructure: 'Tech Hub, Finance, Manufacturing',
      },
      'France': {
        bounds: { lat: [41.4, 51.1], lng: [-5.3, 8.4] },
        threatLevel: 0.68,
        cities: ['Paris', 'Lyon'],
        infrastructure: 'Government, Culture, Tech',
      },
      'Netherlands': {
        bounds: { lat: [50.8, 53.6], lng: [3.4, 7.2] },
        threatLevel: 0.65,
        cities: ['Amsterdam'],
        infrastructure: 'Data Centers, Finance',
      },
    },
  },
  'Asia-Pacific': {
    color: '#f97316',
    countries: {
      'China': {
        bounds: { lat: [18, 53], lng: [73, 135] },
        threatLevel: 0.88,
        cities: ['Beijing', 'Shanghai'],
        infrastructure: 'Tech, Manufacturing, Finance',
      },
      'Japan': {
        bounds: { lat: [24, 45], lng: [130, 145] },
        threatLevel: 0.82,
        cities: ['Tokyo'],
        infrastructure: 'Tech Infrastructure, Finance',
      },
      'India': {
        bounds: { lat: [8, 35], lng: [68, 97] },
        threatLevel: 0.75,
        cities: ['Mumbai', 'Bangalore'],
        infrastructure: 'Tech Outsourcing, Finance',
      },
      'Singapore': {
        bounds: { lat: [1.3, 1.4], lng: [103.6, 104.1] },
        threatLevel: 0.72,
        cities: ['Singapore'],
        infrastructure: 'Data Hub, Finance',
      },
      'Australia': {
        bounds: { lat: [-43.7, -10.7], lng: [113.3, 154] },
        threatLevel: 0.62,
        cities: ['Sydney'],
        infrastructure: 'Government, Tech',
      },
      'South Korea': {
        bounds: { lat: [34.4, 38.6], lng: [125.1, 131.9] },
        threatLevel: 0.77,
        cities: ['Seoul'],
        infrastructure: 'Tech Infrastructure',
      },
      'Hong Kong': {
        bounds: { lat: [22.2, 22.5], lng: [113.8, 114.4] },
        threatLevel: 0.80,
        cities: ['Hong Kong'],
        infrastructure: 'Financial Hub, Asia Gateway',
      },
    },
  },
  'Middle East': {
    color: '#f59e0b',
    countries: {
      'United Arab Emirates': {
        bounds: { lat: [22.6, 26.2], lng: [51.6, 56.4] },
        threatLevel: 0.68,
        cities: ['Dubai'],
        infrastructure: 'Financial Hub, Tech',
      },
      'Israel': {
        bounds: { lat: [29.2, 33.3], lng: [34.3, 35.9] },
        threatLevel: 0.74,
        cities: ['Tel Aviv'],
        infrastructure: 'Cyber Defense, Tech',
      },
    },
  },
  'South America': {
    color: '#10b981',
    countries: {
      'Brazil': {
        bounds: { lat: [-33.8, 5.2], lng: [-73.9, -34.8] },
        threatLevel: 0.65,
        cities: ['São Paulo'],
        infrastructure: 'Finance, Tech Hub',
      },
    },
  },
  'Russia & Central Asia': {
    color: '#8b5cf6',
    countries: {
      'Russia': {
        bounds: { lat: [41.2, 81.9], lng: [19.6, 169.4] },
        threatLevel: 0.82,
        cities: ['Moscow'],
        infrastructure: 'APT Origin, Government',
      },
    },
  },
};

// Major cities with detailed information
export const DETAILED_CITIES = {
  'New York': {
    lat: 40.7128,
    lng: -74.0060,
    country: 'United States',
    state: 'New York',
    region: 'North America',
    population: '8.3M',
    timezone: 'EST',
    infrastructure: ['Finance', 'Tech', 'Media'],
    threatVectors: ['Financial Malware', 'APT', 'Nation-State'],
    criticalAssets: 12,
  },
  'London': {
    lat: 51.5074,
    lng: -0.1278,
    country: 'United Kingdom',
    region: 'Europe',
    population: '9.0M',
    timezone: 'GMT',
    infrastructure: ['Finance', 'Government', 'Tech'],
    threatVectors: ['Espionage', 'APT', 'Hacking'],
    criticalAssets: 8,
  },
  'Tokyo': {
    lat: 35.6762,
    lng: 139.6503,
    country: 'Japan',
    state: 'Tokyo',
    region: 'Asia-Pacific',
    population: '37.4M',
    timezone: 'JST',
    infrastructure: ['Tech', 'Finance', 'Trading'],
    threatVectors: ['Ransomware', 'State Actor', 'Supply Chain'],
    criticalAssets: 15,
  },
  'Beijing': {
    lat: 39.9042,
    lng: 116.4074,
    country: 'China',
    state: 'Beijing',
    region: 'Asia-Pacific',
    population: '21.5M',
    timezone: 'CST',
    infrastructure: ['Government', 'Tech', 'Finance'],
    threatVectors: ['State Actor', 'APT', 'Development'],
    criticalAssets: 20,
  },
  'Mumbai': {
    lat: 19.0760,
    lng: 72.8777,
    country: 'India',
    state: 'Maharashtra',
    region: 'Asia-Pacific',
    population: '20.9M',
    timezone: 'IST',
    infrastructure: ['Finance', 'Tech Outsourcing', 'Services'],
    threatVectors: ['Ransomware', 'Phishing', 'Insider Threats'],
    criticalAssets: 9,
  },
  'Sydney': {
    lat: -33.8688,
    lng: 151.2093,
    country: 'Australia',
    state: 'New South Wales',
    region: 'Asia-Pacific',
    population: '5.3M',
    timezone: 'AEST',
    infrastructure: ['Government', 'Finance', 'Tech'],
    threatVectors: ['Nation-State', 'APT', 'Criminal Groups'],
    criticalAssets: 6,
  },
  'Dubai': {
    lat: 25.2048,
    lng: 55.2708,
    country: 'United Arab Emirates',
    region: 'Middle East',
    population: '3.6M',
    timezone: 'GST',
    infrastructure: ['Finance', 'Trade', 'Tech'],
    threatVectors: ['Money Laundering', 'Sanctions Evasion', 'Fraud'],
    criticalAssets: 7,
  },
  'Singapore': {
    lat: 1.3521,
    lng: 103.8198,
    country: 'Singapore',
    region: 'Asia-Pacific',
    population: '5.9M',
    timezone: 'SGT',
    infrastructure: ['Data Centers', 'Finance', 'Port'],
    threatVectors: ['Espionage', 'APT', 'Transshipment'],
    criticalAssets: 11,
  },
  'São Paulo': {
    lat: -23.5505,
    lng: -46.6333,
    country: 'Brazil',
    state: 'São Paulo',
    region: 'South America',
    population: '12.2M',
    timezone: 'BRT',
    infrastructure: ['Finance', 'Tech', 'Manufacturing'],
    threatVectors: ['Ransomware', 'Criminal Groups', 'Organized Crime'],
    criticalAssets: 8,
  },
  'Moscow': {
    lat: 55.7558,
    lng: 37.6173,
    country: 'Russia',
    region: 'Russia & Central Asia',
    population: '12.5M',
    timezone: 'MSK',
    infrastructure: ['Government', 'Energy', 'Tech'],
    threatVectors: ['APT', 'State Actor', 'Espionage'],
    criticalAssets: 18,
  },
  'Los Angeles': {
    lat: 34.0522,
    lng: -118.2437,
    country: 'United States',
    state: 'California',
    region: 'North America',
    population: '3.9M',
    timezone: 'PST',
    infrastructure: ['Entertainment', 'Tech', 'Media'],
    threatVectors: ['IP Theft', 'Ransomware', 'Smuggling'],
    criticalAssets: 10,
  },
  'Berlin': {
    lat: 52.5200,
    lng: 13.4050,
    country: 'Germany',
    region: 'Europe',
    population: '3.6M',
    timezone: 'CET',
    infrastructure: ['Government', 'Tech', 'Media'],
    threatVectors: ['Espionage', 'Political Hacking', 'APT'],
    criticalAssets: 7,
  },
  'Seoul': {
    lat: 37.5665,
    lng: 126.9780,
    country: 'South Korea',
    state: 'Seoul',
    region: 'Asia-Pacific',
    population: '9.7M',
    timezone: 'KST',
    infrastructure: ['Tech', 'Finance', 'Manufacturing'],
    threatVectors: ['North Korean Actors', 'APT', 'Sanctions Evasion'],
    criticalAssets: 14,
  },
  'Toronto': {
    lat: 43.6532,
    lng: -79.3832,
    country: 'Canada',
    state: 'Ontario',
    region: 'North America',
    population: '2.9M',
    timezone: 'EST',
    infrastructure: ['Finance', 'Tech', 'Media'],
    threatVectors: ['Ransomware', 'Hacking', 'Financial Fraud'],
    criticalAssets: 6,
  },
  'Paris': {
    lat: 48.8566,
    lng: 2.3522,
    country: 'France',
    region: 'Europe',
    population: '2.1M',
    timezone: 'CET',
    infrastructure: ['Government', 'Culture', 'Tech'],
    threatVectors: ['Espionage', 'Political Hacking', 'Terrorism'],
    criticalAssets: 8,
  },
  'Hong Kong': {
    lat: 22.3193,
    lng: 114.1694,
    country: 'Hong Kong',
    region: 'Asia-Pacific',
    population: '7.5M',
    timezone: 'HKT',
    infrastructure: ['Finance', 'Trade', 'Tech'],
    threatVectors: ['State Actor', 'Espionage', 'Financial Fraud'],
    criticalAssets: 12,
  },
  'Tel Aviv': {
    lat: 32.0853,
    lng: 34.7818,
    country: 'Israel',
    region: 'Middle East',
    population: '0.47M',
    timezone: 'IST',
    infrastructure: ['Cyber Defense', 'Tech', 'Government'],
    threatVectors: ['Regional Actors', 'APT', 'Terrorism'],
    criticalAssets: 13,
  },
  'Amsterdam': {
    lat: 52.3676,
    lng: 4.9041,
    country: 'Netherlands',
    region: 'Europe',
    population: '2.4M',
    timezone: 'CET',
    infrastructure: ['Data Centers', 'Finance', 'Tech'],
    threatVectors: ['Cybercrime', 'Phishing', 'Ransomware'],
    criticalAssets: 9,
  },
  'Bangalore': {
    lat: 12.9716,
    lng: 77.5946,
    country: 'India',
    state: 'Karnataka',
    region: 'Asia-Pacific',
    population: '8.4M',
    timezone: 'IST',
    infrastructure: ['Tech Outsourcing', 'Software', 'Services'],
    threatVectors: ['Social Engineering', 'Insider Threats', 'APT'],
    criticalAssets: 10,
  },
  'Shanghai': {
    lat: 31.2304,
    lng: 121.4737,
    country: 'China',
    state: 'Shanghai',
    region: 'Asia-Pacific',
    population: '27.7M',
    timezone: 'CST',
    infrastructure: ['Finance', 'Tech', 'Trade'],
    threatVectors: ['State Actor', 'APT', 'Industrial Espionage'],
    criticalAssets: 16,
  },
};

// Country/State border segments (simplified for performance)
export const GEOGRAPHIC_BORDERS = [
  // North America - US borders
  { start: { lat: 24, lng: -81 }, end: { lat: 49, lng: -81 }, type: 'country', region: 'North America' },
  { start: { lat: 49, lng: -81 }, end: { lat: 49, lng: -125 }, type: 'country', region: 'North America' },
  { start: { lat: 49, lng: -125 }, end: { lat: 24, lng: -125 }, type: 'country', region: 'North America' },
  // Europe
  { start: { lat: 50, lng: -10 }, end: { lat: 55, lng: -10 }, type: 'country', region: 'Europe' },
  { start: { lat: 55, lng: -10 }, end: { lat: 55, lng: 15 }, type: 'country', region: 'Europe' },
  // Asia
  { start: { lat: 18, lng: 73 }, end: { lat: 53, lng: 73 }, type: 'country', region: 'Asia-Pacific' },
  { start: { lat: 53, lng: 73 }, end: { lat: 53, lng: 135 }, type: 'country', region: 'Asia-Pacific' },
];

export const getThreatLevelColor = (threatLevel) => {
  if (threatLevel >= 0.8) return '#ff2e63'; // Red - Critical
  if (threatLevel >= 0.7) return '#ff6b35'; // Orange - High
  if (threatLevel >= 0.6) return '#f7b801'; // Yellow - Elevated
  if (threatLevel >= 0.5) return '#4ecdc4'; // Cyan - Moderate
  return '#2ecc71'; // Green - Low
};

export const getDetailLevel = (zoom) => {
  if (zoom < 1.2) return 'global';
  if (zoom < 1.5) return 'regional';
  if (zoom < 1.8) return 'country';
  if (zoom < 2.2) return 'state';
  return 'city';
};
