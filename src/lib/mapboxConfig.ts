
// Mapbox configuration
export const MAPBOX_CONFIG = {
  // Configured Mapbox access token
  accessToken: 'pk.eyJ1Ijoic2F5YW5nYXllbiIsImEiOiJjbWR1Y2V5dHowaGs0Mmxxd2t0OGw2cDVxIn0.MTK_Fk7k7ApP20VUhBm9_g',
  
  // Map styles
  styles: {
    streets: 'mapbox://styles/mapbox/streets-v12',
    outdoors: 'mapbox://styles/mapbox/outdoors-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    satellite: 'mapbox://styles/mapbox/satellite-v9',
    satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  
  // Precise coordinates for Siliguri, West Bengal, India
  defaultCenter: {
    lat: 26.7271,
    lng: 88.4284
  },
  
  // Default zoom levels for better accuracy
  defaultZoom: 14,
  maxZoom: 18,
  minZoom: 8
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

// Helper function to reverse geocode using Mapbox Geocoding API
export const reverseGeocode = async (lat: number, lng: number) => {
  if (!MAPBOX_CONFIG.accessToken) {
    throw new Error('Mapbox access token is required');
  }
  
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_CONFIG.accessToken}`
  );
  
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};

// Helper function to forward geocode (search for address)
export const forwardGeocode = async (query: string) => {
  if (!MAPBOX_CONFIG.accessToken) {
    throw new Error('Mapbox access token is required');
  }
  
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${MAPBOX_CONFIG.defaultCenter.lng},${MAPBOX_CONFIG.defaultCenter.lat}&access_token=${MAPBOX_CONFIG.accessToken}`
  );
  
  if (!response.ok) {
    throw new Error(`Geocoding search failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data;
};
