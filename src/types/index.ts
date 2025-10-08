
export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  propertyType: string;
  features: string[];
  availableFrom: string;
  images: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  contactPhone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface PropertyFilter {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
}

export interface Tenant {
  id: string;
  property_id: string;
  name: string;
  email?: string;
  phone: string;
  room_number?: string;
  move_in_date: string;
  move_out_date?: string;
  monthly_rent: number;
  security_deposit: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  tenant_id: string;
  month: number;
  year: number;
  rent_paid: boolean;
  rent_amount: number;
  rent_paid_date?: string;
  electricity_paid: boolean;
  electricity_amount: number;
  electricity_paid_date?: string;
  water_paid: boolean;
  water_amount: number;
  water_paid_date?: string;
  other_charges: number;
  other_charges_description?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}
