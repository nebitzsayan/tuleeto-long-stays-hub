
import { supabase } from "@/integrations/supabase/client";
import { Property } from "@/types";

export const getPropertyById = async (id: string): Promise<Property> => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      profiles!properties_owner_id_fkey (
        full_name,
        email
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

  // Parse coordinates if they exist
  let coordinates: { lat: number; lng: number } | undefined;
  if (data.coordinates && typeof data.coordinates === 'object') {
    const coords = data.coordinates as any;
    if (coords.lat && coords.lng) {
      coordinates = {
        lat: Number(coords.lat),
        lng: Number(coords.lng)
      };
    }
  }

  // Handle profile data - it could be null or an object
  const profileData = data.profiles as any;
  const ownerName = profileData?.full_name || 'Unknown';
  const ownerEmail = profileData?.email || '';

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
    updatedAt: data.created_at // Using created_at as fallback since updated_at doesn't exist
  };

  return property;
};

export const getAllProperties = async (): Promise<Property[]> => {
  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      profiles!properties_owner_id_fkey (
        full_name,
        email
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
    // Parse coordinates if they exist
    let coordinates: { lat: number; lng: number } | undefined;
    if (item.coordinates && typeof item.coordinates === 'object') {
      const coords = item.coordinates as any;
      if (coords.lat && coords.lng) {
        coordinates = {
          lat: Number(coords.lat),
          lng: Number(coords.lng)
        };
      }
    }

    // Handle profile data - it could be null or an object
    const profileData = item.profiles as any;
    const ownerName = profileData?.full_name || 'Unknown';
    const ownerEmail = profileData?.email || '';

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
      updatedAt: item.created_at // Using created_at as fallback since updated_at doesn't exist
    };
  });
};
