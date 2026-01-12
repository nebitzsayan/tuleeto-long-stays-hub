
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
    <MainLayout className="pt-20 sm:pt-24 pb-16 bg-gray-50">
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
      <div className="container max-w-6xl mx-auto px-3 sm:px-4">
        {property && (
          <div className="space-y-6 sm:space-y-8">
            {/* Image Carousel - Full width on mobile */}
            <div className="-mx-3 sm:mx-0">
              <PropertyImageCarousel images={property.images} title={property.title} />
            </div>

            {/* Title and Location Section - Mobile optimized */}
            <div className="space-y-3">
              <div className="flex flex-col gap-3">
                {/* Title and location */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight line-clamp-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1.5">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base truncate">{property.location}</span>
                  </div>
                </div>
                
                {/* Action buttons - row on all sizes */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Share Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className={`
                      flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full h-10
                      border-2 transition-all duration-300 ease-out touch-manipulation
                      ${copied 
                        ? 'bg-green-50 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400' 
                        : 'border-primary/30 hover:border-primary hover:bg-primary/5 hover:shadow-md active:scale-95'
                      }
                    `}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span className="font-medium text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4" />
                        <span className="font-medium text-sm">Share</span>
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
                          className="flex items-center gap-2 text-destructive hover:bg-destructive/10 border-destructive/30 h-10 px-3 touch-manipulation"
                        >
                          <Flag className="h-4 w-4" />
                          <span className="hidden sm:inline text-sm">Report</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                        <AlertDialogHeader className="text-left space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                              <Flag className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                              <AlertDialogTitle className="text-lg font-semibold">Report Property</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm text-muted-foreground mt-0.5">
                                Help keep our platform safe
                              </AlertDialogDescription>
                            </div>
                          </div>
                        </AlertDialogHeader>
                        <div className="space-y-4 py-2">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Reason for report</label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                              <SelectTrigger className="h-12 text-base touch-manipulation">
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[50vh]">
                                {reportReasons.map((reason) => (
                                  <SelectItem key={reason} value={reason} className="py-3.5 text-base">
                                    {reason}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Additional details (optional)</label>
                            <Textarea
                              placeholder="Describe the issue..."
                              value={reportDescription}
                              onChange={(e) => setReportDescription(e.target.value)}
                              rows={3}
                              className="text-base resize-none"
                            />
                          </div>
                        </div>
                        <AlertDialogFooter className="flex-col gap-2 sm:flex-row pt-2">
                          <AlertDialogCancel className="w-full sm:w-auto h-12 text-base order-2 sm:order-1 mt-0">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleReportProperty}
                            disabled={!reportReason || isReporting}
                            className="w-full sm:w-auto h-12 text-base bg-destructive hover:bg-destructive/90 order-1 sm:order-2"
                          >
                            {isReporting ? "Submitting..." : "Submit Report"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
            
            {/* Property Details Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Property Info Card - Mobile optimized grid */}
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl">Property Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-muted-foreground block text-xs sm:text-sm">Price</span>
                      <span className="font-semibold text-sm sm:text-base text-primary">
                        Rs {property.price.toLocaleString('en-IN')}/mo
                      </span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-muted-foreground block text-xs sm:text-sm">Bedrooms</span>
                      <span className="font-semibold text-sm sm:text-base">{property.bedrooms}</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-muted-foreground block text-xs sm:text-sm">Bathrooms</span>
                      <span className="font-semibold text-sm sm:text-base">{property.bathrooms}</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-muted-foreground block text-xs sm:text-sm">Area</span>
                      <span className="font-semibold text-sm sm:text-base">{property.area} sq ft</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-muted-foreground block text-xs sm:text-sm">Property Type</span>
                      <span className="font-semibold text-sm sm:text-base">{property.propertyType}</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <span className="text-muted-foreground block text-xs sm:text-sm">Available From</span>
                      <span className="font-semibold text-sm sm:text-base">{property.availableFrom}</span>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground block text-xs sm:text-sm">Listed On</span>
                      <span className="font-semibold text-sm sm:text-base">
                        {property.createdAt 
                          ? format(new Date(property.createdAt), 'dd MMM yyyy')
                          : 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Description - Mobile optimized */}
                <Card>
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
                
                {/* Amenities Section */}
                {property.features && property.features.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Shield className="h-5 w-5 text-tuleeto-orange" />
                        Amenities & Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PropertyAmenitiesDisplay features={property.features} />
                    </CardContent>
                  </Card>
                )}

                {/* Map Section */}
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

              {/* Sidebar - Sticky on desktop, full width card on mobile */}
              <div className="lg:col-span-1">
                <Card className="lg:sticky lg:top-24">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-lg sm:text-xl">Contact Owner</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b">
                      <OwnerAvatar 
                        ownerId={property.ownerId} 
                        ownerName={property.ownerName}
                        size="md"
                        withLink={true}
                      />
                      <div className="min-w-0 flex-1">
                        <Link 
                          to={`/owner/${property.ownerId}`}
                          className="text-sm font-medium hover:text-tuleeto-orange transition-colors truncate block"
                        >
                          {property.ownerName}
                        </Link>
                        <p className="text-xs text-muted-foreground">Property Owner</p>
                      </div>
                    </div>
                    
                    {/* Secure contact info display */}
                    {user ? (
                      <div className="space-y-3">
                        {property.contactPhone && (
                          <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg p-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Phone</p>
                              <p className="text-sm font-medium truncate">{property.contactPhone}</p>
                            </div>
                            <Button 
                              onClick={() => handlePhoneCall(property.contactPhone)}
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 flex-shrink-0"
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {property.contactPhone && (
                          <Button 
                            onClick={() => handlePhoneCall(property.contactPhone)}
                            className="w-full h-12 bg-tuleeto-orange hover:bg-tuleeto-orange/90 text-base font-medium touch-manipulation"
                          >
                            <Phone className="h-5 w-5 mr-2" />
                            Call Now
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <User className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Please login to view contact details
                          </p>
                        </div>
                        <Button 
                          onClick={() => window.location.href = '/auth'}
                          className="w-full h-12 bg-tuleeto-orange hover:bg-tuleeto-orange/90 text-base font-medium touch-manipulation"
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