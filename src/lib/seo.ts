export interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  noindex?: boolean;
}

export const defaultSEO: SEOProps = {
  title: "Tuleeto | Official Rental Platform for Modern Homes and Properties in India",
  description: "Tuleeto is a digital rental marketplace to discover, book, and list properties across India. Find apartments, houses, shops, and commercial spaces. Direct owner contact, verified listings, no brokerage.",
  keywords: "Tuleeto, Tuleeto India, rental house India, long term rental, apartment for rent, flat for rent, house for rent, rent property, PG, hostel, commercial property, shop for rent, showroom, office space",
  ogImage: "/images-resources/8f53d3f9-c672-4dbc-8077-05b6cbfc2723.png",
  ogType: "website",
};

export const generatePropertySEO = (property: any): SEOProps => {
  const bhk = property.bedrooms ? `${property.bedrooms} BHK ` : '';
  const location = property.location || 'India';
  const price = property.price ? `₹${property.price.toLocaleString()}/month` : '';
  
  const title = `${property.title || `${bhk}${property.type}`} in ${location} | ${price} - Tuleeto`;
  
  const features = property.features?.slice(0, 3).join(', ') || 'modern amenities';
  const description = `Rent this ${property.type?.toLowerCase() || 'property'} with ${property.bedrooms} bedroom${property.bedrooms > 1 ? 's' : ''}, ${property.bathrooms} bathroom${property.bathrooms > 1 ? 's' : ''} in ${location} for ${price}. Features ${features}. ${property.description?.substring(0, 100) || 'Contact owner to book now'}.`;
  
  return {
    title,
    description: description.substring(0, 160),
    keywords: `${bhk}for rent ${location}, ${property.type} rental ${location}, rent ${property.type} ${location}, long term rental ${location}, Tuleeto ${location}`,
    ogImage: property.images?.[0] || defaultSEO.ogImage,
    ogType: "product.rental",
    canonicalUrl: `https://tuleeto.space/property/${property.id}`,
  };
};

export const generateListingsSEO = (searchParams: URLSearchParams): SEOProps => {
  const location = searchParams.get('search') || searchParams.get('location');
  const type = searchParams.get('type');
  const bedrooms = searchParams.get('bedrooms');
  
  let title = "Rental Properties in India - Tuleeto";
  let description = "Browse thousands of verified rental properties across India. Find apartments, houses, flats, and PG accommodations for long-term stay.";
  let keywords = "rental properties India, houses for rent, apartments for rent";
  
  if (location) {
    title = `Rental Houses & Apartments in ${location} - Tuleeto`;
    description = `Find the perfect rental property in ${location}. Browse verified apartments, houses, and flats for rent. Contact owners directly. Long-term rentals available.`;
    keywords = `rent in ${location}, rental house ${location}, apartment for rent ${location}, flat for rent ${location}`;
  }
  
  if (bedrooms) {
    const bhkText = `${bedrooms} BHK`;
    title = `${bhkText} ${type || 'Properties'} for Rent${location ? ` in ${location}` : ''} - Tuleeto`;
    description = `Find ${bhkText} ${type?.toLowerCase() || 'properties'} for rent${location ? ` in ${location}` : ''}. Verified listings with photos, prices, and owner contact details.`;
    keywords = `${bhkText} for rent${location ? ` ${location}` : ''}, ${bhkText} ${type || 'property'}${location ? ` ${location}` : ''}`;
  }
  
  return {
    title,
    description: description.substring(0, 160),
    keywords,
    ogType: "website",
  };
};
