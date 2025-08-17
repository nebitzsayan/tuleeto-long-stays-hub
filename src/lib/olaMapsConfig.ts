
// Ola Maps configuration
export const OLA_MAPS_CONFIG = {
  apiKey: '58Gg9I1pBkxNQ48r0bTmZe1u3VkO876kos1MOYe3',
  clientId: 'a0f65097-672c-444e-a106-fceb861267ca',
  clientSecret: '86a1087bfd214741b52c333fa90df360',
  projectId: 'a0f65097-672c-444e-a106-fceb861267ca',
  
  // Map styles
  styles: {
    default: 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json',
    satellite: 'https://api.olamaps.io/tiles/vector/v1/styles/satellite/style.json',
    dark: 'https://api.olamaps.io/tiles/vector/v1/styles/default-dark-standard/style.json'
  },
  
  // API endpoints
  endpoints: {
    reverseGeocode: 'https://api.olamaps.io/places/v1/reverse-geocode',
    search: 'https://api.olamaps.io/places/v1/textsearch',
    directions: 'https://api.olamaps.io/routing/v1/directions'
  },
  
  // Default coordinates for Siliguri, India (ultra-precise)
  defaultCenter: {
    lat: 26.7270661,
    lng: 88.4284210
  },
  
  // Precision settings
  precision: {
    coordinates: 10, // 10 decimal places for sub-millimeter accuracy
    zoom: {
      default: 16,
      picker: 18,
      maximum: 22
    }
  }
};

// Helper function to get precision coordinates
export const getPrecisionCoordinates = (lat: number, lng: number, precision: number = 10) => {
  const factor = Math.pow(10, precision);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor
  };
};

// Helper function to format coordinates for display
export const formatCoordinates = (lat: number, lng: number, precision: number = 8) => {
  return `${lat.toFixed(precision)}°N, ${lng.toFixed(precision)}°E`;
};
