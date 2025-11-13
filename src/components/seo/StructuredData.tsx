import { Helmet } from "react-helmet-async";

// Organization Schema - Primary entity for brand authority
export const OrganizationSchema = ({
  name = "Tuleeto",
  url = "https://tuleeto.space",
  logo = "https://tuleeto.space/images-resources/8f53d3f9-c672-4dbc-8077-05b6cbfc2723.png"
}: {
  name?: string;
  url?: string;
  logo?: string;
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness"],
    "name": "Tuleeto",
    "url": "https://tuleeto.space",
    "alternateName": ["Tuleeto Official", "Tuleeto Rentals", "Tuleeto India"],
    "logo": logo,
    "description": "Tuleeto is a modern rental platform connecting tenants and property owners through a secure, AI-ready web application. Discover apartments, houses, and commercial spaces across India with verified listings and direct owner contact.",
    "foundingDate": "2025-01-01",
    "founder": {
      "@type": "Person",
      "name": "Sayan Kumar Gayen"
    },
    "sameAs": [
      "https://facebook.com/tuleeto",
      "https://twitter.com/tuleeto",
      "https://linkedin.com/company/tuleeto",
      "https://instagram.com/tuleeto"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN",
      "addressRegion": "India"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    },
    "slogan": "Find Your Perfect Rental Home"
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

// WebSite Schema for sitelinks search box
export const WebSiteSchema = ({
  url = "https://tuleeto.space",
  name = "Tuleeto"
}: {
  url?: string;
  name?: string;
}) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": name,
    "url": url,
    "description": "Tuleeto is a digital rental marketplace to discover, book, and list properties across India.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://tuleeto.space/listings?search={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface RealEstateAgentSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
}

export const RealEstateAgentSchema = ({
  name = "Tuleeto",
  url = "https://tuleeto.space",
  logo = "https://tuleeto.space/images-resources/8f53d3f9-c672-4dbc-8077-05b6cbfc2723.png"
}: RealEstateAgentSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "name": name,
    "description": "Find perfect long-term rental properties in India. Browse apartments, houses, and flats for rent with verified owners.",
    "url": url,
    "logo": logo,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "Country",
      "name": "India"
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface ProductSchemaProps {
  property: any;
}

export const ProductSchema = ({ property }: ProductSchemaProps) => {
  if (!property) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": property.title || `${property.bedrooms} BHK ${property.type} in ${property.location}`,
    "description": property.description || `Rental property with ${property.bedrooms} bedrooms and ${property.bathrooms} bathrooms`,
    "image": property.images || [],
    "brand": {
      "@type": "Brand",
      "name": "Tuleeto"
    },
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "url": `https://tuleeto.space/property/${property.id}`,
      "priceValidUntil": new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
    }
  };

  // Add aggregate rating if reviews exist
  if (property.reviews && property.reviews.length > 0) {
    const avgRating = property.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / property.reviews.length;
    schema["aggregateRating"] = {
      "@type": "AggregateRating",
      "ratingValue": avgRating.toFixed(1),
      "reviewCount": property.reviews.length,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface BreadcrumbSchemaProps {
  items: Array<{
    name: string;
    url?: string;
  }>;
}

export const BreadcrumbSchema = ({ items }: BreadcrumbSchemaProps) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      ...(item.url && { "item": item.url })
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};

interface ItemListSchemaProps {
  properties: any[];
  location?: string;
}

export const ItemListSchema = ({ properties, location }: ItemListSchemaProps) => {
  if (!properties || properties.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": location ? `Rental Properties in ${location}` : "Rental Properties",
    "description": location ? `Browse rental houses and apartments in ${location}` : "Browse rental properties",
    "numberOfItems": properties.length,
    "itemListElement": properties.slice(0, 10).map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": property.title || `${property.bedrooms} BHK ${property.type}`,
        "url": `https://tuleeto.space/property/${property.id}`,
        "image": property.images?.[0] || "",
        "offers": {
          "@type": "Offer",
          "price": property.price,
          "priceCurrency": "INR"
        }
      }
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
};
