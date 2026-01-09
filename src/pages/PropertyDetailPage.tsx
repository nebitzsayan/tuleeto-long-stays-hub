
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { MapPin, Shield, User, Phone, Share2, Copy, Check, Calendar, Flag } from "lucide-react";
import { format } from "date-fns";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import PropertyContactInfo from "@/components/property/PropertyContactInfo";
import { PropertyPosterGenerator } from "@/components/property/PropertyPosterGenerator";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/seo/SEO";
import { ProductSchema, BreadcrumbSchema } from "@/components/seo/StructuredData";
import { generatePropertySEO } from "@/lib/seo";
import { PropertyLoader } from "@/components/ui/property-loader";
import { toast } from "sonner";

const PropertyDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const reportReasons = [
    "Fraudulent listing",
    "Incorrect information", 
    "Already rented/unavailable",
    "Inappropriate content",
    "Spam/duplicate listing",
    "Other"
  ];

  const handleReportProperty = async () => {
    if (!user || !property || !reportReason) return;
    
    setIsReporting(true);
    try {
      const { error } = await supabase
        .from("property_reports")
        .insert({
          property_id: property.id,
          reporter_id: user.id,
          reason: reportReason,
          description: reportDescription || null
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("You have already reported this property");
        } else {
          throw error;
        }
      } else {
        toast.success("Property reported successfully. Our team will review it.");
        setShowReportDialog(false);
        setReportReason("");
        setReportDescription("");
      }
    } catch (err: any) {
      toast.error("Failed to report property");
    } finally {
      setIsReporting(false);
    }
  };

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

  const handleShare = async () => {
    if (!property) return;

    const shareData = {
      title: property.title,
      text: `Check out this property: ${property.title} - Rs ${property.price.toLocaleString('en-IN')}/month in ${property.location}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } else {
        // Fallback to copy link
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        toast.success("Link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // Fallback to copy link if share fails
        try {
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          toast.success("Link copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Failed to share");
        }
      }
    }
  };

  if (isLoading) {
    return (
      <MainLayout className="pt-24 pb-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4 flex items-center justify-center min-h-[50vh]">
          <PropertyLoader size="lg" text="Loading property details..." />
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
      {property && (
        <>
          <SEO {...generatePropertySEO(property)} />
          <ProductSchema property={property} />
          <BreadcrumbSchema items={[
            { name: 'Home', url: 'https://tuleeto.space/' },
            { name: 'Listings', url: 'https://tuleeto.space/listings' },
            { name: property.location, url: `https://tuleeto.space/listings?location=${encodeURIComponent(property.location)}` },
            { name: property.title }
          ]} />
        </>
      )}
      <div className="container max-w-6xl mx-auto px-4">
        {property && (
          <div className="space-y-8">
            {/* Image Carousel */}
            <PropertyImageCarousel images={property.images} title={property.title} />

            {/* Title and Location Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-3xl font-bold">{property.title}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{property.location}</span>
                  </div>
                </div>
                  <div className="flex items-center gap-2">
                  {/* Share Button - Enhanced UX */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-full
                      border-2 transition-all duration-300 ease-out
                      ${copied 
                        ? 'bg-green-50 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400' 
                        : 'border-primary/30 hover:border-primary hover:bg-primary/5 hover:shadow-md active:scale-95'
                      }
                    `}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 animate-scale-in" />
                        <span className="font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
                        <span className="font-medium">Share</span>
                      </>
                    )}
                  </Button>
                  {/* Property Poster Generator - Only for property owners */}
                  {user && user.id === property.ownerId && (
                    <PropertyPosterGenerator 
                      property={{
                        id: property.id,
                        title: property.title,
                        price: property.price,
                        images: property.images,
                        features: property.features,
                        owner_id: property.ownerId,
                        location: property.location,
                        contactPhone: property.contactPhone
                      }}
                      ownerName={property.ownerName}
                    />
                  )}
                  
                  {/* Report Button - Only for logged in users who don't own the property */}
                  {user && user.id !== property.ownerId && (
                    <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 text-destructive hover:bg-destructive/10 border-destructive/30"
                        >
                          <Flag className="h-4 w-4" />
                          <span className="hidden sm:inline">Report</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Report Property</AlertDialogTitle>
                          <AlertDialogDescription>
                            Help us keep our platform safe. Select a reason for reporting this property.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-4">
                          <Select value={reportReason} onValueChange={setReportReason}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a reason" />
                            </SelectTrigger>
                            <SelectContent>
                              {reportReasons.map((reason) => (
                                <SelectItem key={reason} value={reason}>
                                  {reason}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Textarea
                            placeholder="Additional details (optional)"
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleReportProperty}
                            disabled={!reportReason || isReporting}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {isReporting ? "Reporting..." : "Submit Report"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
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
                    <div>
                      <span className="text-gray-500 block text-sm">Listed On</span>
                      <span className="font-medium">
                        {property.createdAt 
                          ? format(new Date(property.createdAt), 'dd MMM yyyy')
                          : 'N/A'}
                      </span>
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
                    
                    {/* Secure contact info display */}
                    {user ? (
                      <div className="space-y-3">
                        {property.contactPhone && (
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
                        )}
                        {property.contactPhone && (
                          <Button 
                            onClick={() => handlePhoneCall(property.contactPhone)}
                            className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange/90"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            Call Now
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Please login to view contact details</p>
                        <Button 
                          onClick={() => window.location.href = '/auth'}
                          className="w-full bg-tuleeto-orange hover:bg-tuleeto-orange/90"
                        >
                          Login to Contact Owner
                        </Button>
                      </div>
                    )}
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
