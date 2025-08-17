
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
    directions: 'https://api.olamaps.io/routing/v1/directions',
    staticMap: 'https://api.olamaps.io/places/v1/staticmap'
  },
  
  // Default coordinates for Siliguri, India
  defaultCenter: {
    lat: 26.7270661,
    lng: 88.4284210
  },
  
  // Precision settings
  precision: {
    coordinates: 8,
    zoom: {
      default: 16,
      picker: 15,
      maximum: 18
    }
  }
};

// Helper function to get precision coordinates
export const getPrecisionCoordinates = (lat: number, lng: number, precision: number = 8) => {
  const factor = Math.pow(10, precision);
  return {
    lat: Math.round(lat * factor) / factor,
    lng: Math.round(lng * factor) / factor
  };
};

// Helper function to format coordinates for display
export const formatCoordinates = (lat: number, lng: number, precision: number = 6) => {
  return `${lat.toFixed(precision)}°N, ${lng.toFixed(precision)}°E`;
};

// Helper function to generate static map URL with better error handling
export const generateStaticMapUrl = (
  center: { lat: number; lng: number },
  zoom: number = 15,
  width: number = 800,
  height: number = 400,
  markers?: Array<{ lat: number; lng: number; color?: string }>
) => {
  try {
    let url = `${OLA_MAPS_CONFIG.endpoints.staticMap}`;
    url += `?center=${center.lat},${center.lng}`;
    url += `&zoom=${Math.min(zoom, 18)}`;
    url += `&size=${width}x${height}`;
    
    if (markers && markers.length > 0) {
      // Simplified marker format for Ola Maps
      markers.forEach(marker => {
        url += `&markers=${marker.lat},${marker.lng}`;
      });
    }
    
    url += `&api_key=${OLA_MAPS_CONFIG.apiKey}`;
    
    console.log('Generated static map URL:', url);
    return url;
  } catch (error) {
    console.error('Error generating static map URL:', error);
    return '';
  }
};
