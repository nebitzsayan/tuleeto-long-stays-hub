
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/types";
import { secureLog } from "@/lib/secureLogging";

export const getPropertyById = async (id: string): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      profiles!properties_owner_id_fkey (
        full_name
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Property not found');
  }

  // Enhanced coordinate parsing with better validation
  let coordinates: { lat: number; lng: number } | undefined;
  
  secureLog.debug('Processing property coordinates');
  
  if (data.coordinates) {
    try {
      let coords: any;
      
      // Handle different coordinate formats
      if (typeof data.coordinates === 'string') {
        coords = JSON.parse(data.coordinates);
      } else if (typeof data.coordinates === 'object') {
        coords = data.coordinates;
      }
      
      // Validate and convert coordinates
      if (coords && typeof coords === 'object') {
        const lat = Number(coords.lat);
        const lng = Number(coords.lng);
        
        // Check if coordinates are valid numbers and not zero
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          coordinates = { lat, lng };
          secureLog.debug('Coordinates parsed successfully');
        } else {
          secureLog.warn('Invalid coordinates detected');
        }
      }
    } catch (parseError) {
      secureLog.error('Error parsing coordinates', parseError);
    }
  }

  // Handle profile data - it could be null or an object
  const profileData = data.profiles as any;
  const ownerName = profileData?.full_name || 'Unknown';
  const ownerEmail = ''; // Email no longer accessible through public API for security

  // Transform the data to match the Property interface
  const property: Property = {
    id: data.id,
    title: data.title,
    description: data.description,
    location: data.location,
    price: data.price,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    area: data.area,
    propertyType: data.type,
    features: data.features || [],
    availableFrom: data.available_from,
    images: data.images || [],
    coordinates,
    ownerId: data.owner_id,
    ownerName,
    ownerEmail,
    contactPhone: data.contact_phone || '',
    createdAt: data.created_at,
    updatedAt: data.created_at
  };

  secureLog.debug('Property data processed successfully');
  return property;
};

export const getAllProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      profiles!properties_owner_id_fkey (
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }

  return data.map(item => {
    // Enhanced coordinate parsing for listing view
    let coordinates: { lat: number; lng: number } | undefined;
    
    if (item.coordinates) {
      try {
        let coords: any;
        
        if (typeof item.coordinates === 'string') {
          coords = JSON.parse(item.coordinates);
        } else if (typeof item.coordinates === 'object') {
          coords = item.coordinates;
        }
        
        if (coords && typeof coords === 'object') {
          const lat = Number(coords.lat);
          const lng = Number(coords.lng);
          
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            coordinates = { lat, lng };
          }
        }
      } catch (parseError) {
        secureLog.error('Error parsing coordinates for property', parseError);
      }
    }

    // Handle profile data - it could be null or an object
    const profileData = item.profiles as any;
    const ownerName = profileData?.full_name || 'Unknown';
    const ownerEmail = ''; // Email no longer accessible through public API for security

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      location: item.location,
      price: item.price,
      bedrooms: item.bedrooms,
      bathrooms: item.bathrooms,
      area: item.area,
      propertyType: item.type,
      features: item.features || [],
      availableFrom: item.available_from,
      images: item.images || [],
      coordinates,
      ownerId: item.owner_id,
      ownerName,
      ownerEmail,
      contactPhone: item.contact_phone || '',
      createdAt: item.created_at,
      updatedAt: item.created_at
    };
  });
};
