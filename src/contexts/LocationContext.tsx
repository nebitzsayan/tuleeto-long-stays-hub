import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LocationState {
  coordinates: { lat: number; lng: number } | null;
  city: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
  isLoading: boolean;
  error: string | null;
}

interface LocationContextType extends LocationState {
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LocationState>({
    coordinates: null,
    city: null,
    permissionStatus: 'prompt',
    isLoading: false,
    error: null,
  });

  // Check if geolocation is supported and auto-request on every page load
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState(prev => ({ ...prev, permissionStatus: 'unsupported' }));
    } else {
      // Auto-request location on every page load/refresh
      requestLocation();
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw&types=place`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        return data.features[0].text; // City name
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  const requestLocation = async () => {
    if (!('geolocation' in navigator)) {
      setState(prev => ({ ...prev, permissionStatus: 'unsupported' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        });
      });

      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Get city name
      const city = await reverseGeocode(coords.lat, coords.lng);

      setState({
        coordinates: coords,
        city,
        permissionStatus: 'granted',
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Geolocation error:', error);
      
      const permissionStatus = error.code === 1 ? 'denied' : 'prompt';
      
      setState({
        coordinates: null,
        city: null,
        permissionStatus,
        isLoading: false,
        error: error.message || 'Unable to get location',
      });
    }
  };

  const clearLocation = () => {
    setState({
      coordinates: null,
      city: null,
      permissionStatus: 'prompt',
      isLoading: false,
      error: null,
    });
  };

  return (
    <LocationContext.Provider value={{ ...state, requestLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationContext must be used within LocationProvider');
  }
  return context;
};
