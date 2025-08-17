
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { MapPin, Shield, User, Phone } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { getPropertyById } from "@/api/propertyService";
import { Property } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyMapDisplay } from "@/components/property/PropertyMapDisplay";
import PropertyImageCarousel from "@/components/property/PropertyImageCarousel";
import PropertyAmenitiesDisplay from "@/components/property/PropertyAmenitiesDisplay";
import PropertyReviewSystem from "@/components/property/PropertyReviewSystem";
import OwnerAvatar from "@/components/profile/OwnerAvatar";

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (id) {
          const fetchedProperty = await getPropertyById(id);
          console.log('Fetched property with coordinates:', fetchedProperty.coordinates);
          setProperty(fetchedProperty);
        } else {
          setError("Invalid property ID");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load property");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handlePhoneCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  if (isLoading) {
    return (
      <MainLayout className="pt-24 pb-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <p>Loading property details...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout className="pt-24 pb-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <p>Error: {error}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout className="pt-24 pb-16 bg-gray-50">
      <div className="container max-w-6xl mx-auto px-4">
        {property && (
          <div className="space-y-8">
            {/* Image Carousel */}
            <PropertyImageCarousel images={property.images} title={property.title} />

            {/* Title and Location Section */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{property.title}</h1>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{property.location}</span>
              </div>
            </div>
            
            {/* Property Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Property Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-500 block text-sm">Price</span>
                      <span className="font-medium">Rs {property.price.toLocaleString('en-IN')}/month</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-sm">Bedrooms</span>
                      <span className="font-medium">{property.bedrooms}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-sm">Bathrooms</span>
                      <span className="font-medium">{property.bathrooms}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-sm">Area</span>
                      <span className="font-medium">{property.area} sq ft</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-sm">Property Type</span>
                      <span className="font-medium">{property.propertyType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-sm">Available From</span>
                      <span className="font-medium">{property.availableFrom}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{property.description}</p>
                  </CardContent>
                </Card>
                
                {/* Amenities Section */}
                {property.features && property.features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-tuleeto-orange" />
                        Amenities & Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PropertyAmenitiesDisplay features={property.features} />
                    </CardContent>
                  </Card>
                )}

                {/* Map Section - Simplified Logic */}
                <PropertyMapDisplay
                  coordinates={property.coordinates || { lat: 26.727066, lng: 88.428421 }}
                  title={property.title}
                  location={property.location}
                  showMarker={!!property.coordinates}
                />

                {/* Reviews Section */}
                <PropertyReviewSystem 
                  propertyId={property.id}
                  ownerId={property.ownerId}
                />
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Contact Owner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <OwnerAvatar 
                        ownerId={property.ownerId} 
                        ownerName={property.ownerName}
                        size="md"
                        withLink={true}
                      />
                      <div>
                        <Link 
                          to={`/owner/${property.ownerId}`}
                          className="text-sm font-medium hover:text-tuleeto-orange transition-colors"
                        >
                          {property.ownerName}
                        </Link>
                        <p className="text-xs text-gray-500">Property Owner</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Email: {property.ownerEmail}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">Phone: {property.contactPhone}</p>
                        <Button 
                          onClick={() => handlePhoneCall(property.contactPhone)}
                          size="sm"
                          variant="outline"
                          className="p-1 h-8 w-8"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handlePhoneCall(property.contactPhone)}
                      className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange/90"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PropertyDetailPage;
