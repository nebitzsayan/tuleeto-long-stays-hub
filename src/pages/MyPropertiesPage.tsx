
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PropertyListingCard, { PropertyType } from "@/components/property/PropertyListingCard";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExtendedPropertyType extends PropertyType {
  description?: string;
  features?: string[];
  is_public?: boolean;
}

const MyPropertiesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<ExtendedPropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchUserProperties = async () => {
      try {
        if (!user) return;
        
        // Use a simpler query first to avoid the parser error
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id);
        
        if (error) {
          throw error;
        }
        
        // Then fetch review data separately if needed
        if (data) {
          const formattedProperties = await Promise.all(data.map(async (prop) => {
            // Optionally fetch review data for each property
            const { data: reviewData, error: reviewError } = await supabase
              .from('property_reviews')
              .select('rating')
              .eq('property_id', prop.id);
            
            let averageRating;
            if (reviewData && reviewData.length > 0) {
              const sum = reviewData.reduce((total: number, review: any) => total + review.rating, 0);
              averageRating = sum / reviewData.length;
            }
            
            return {
              id: prop.id,
              title: prop.title,
              description: prop.description,
              location: prop.location,
              price: prop.price,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              area: prop.area,
              image: prop.images[0] || "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
              type: prop.type,
              features: prop.features,
              contact_phone: prop.contact_phone || "",
              is_public: prop.is_public !== false, // Default to true if not set
              average_rating: averageRating,
              review_count: reviewData?.length || 0
            };
          }));
          
          setProperties(formattedProperties);
        }
      } catch (error: any) {
        console.error(`Error fetching properties: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProperties();
  }, [user]);

  const handleDeleteConfirm = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Remove the property from the local state
      setProperties(properties.filter(property => property.id !== id));
      toast.success("Property deleted successfully");
    } catch (error: any) {
      console.error(`Error deleting property: ${error.message}`);
      toast.error(`Error deleting property: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setDeletingPropertyId(null);
    }
  };

  const showDeleteConfirmation = (id: string) => {
    setDeletingPropertyId(id);
  };

  const handleEditProperty = (propertyId: string) => {
    navigate(`/edit-property/${propertyId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-16 md:pt-24 px-2 md:px-4 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-3 md:mb-6">
            <h1 className="text-xl md:text-4xl font-bold">My Properties</h1>
            <Link to="/list-property">
              <Button 
                size={isMobile ? "mobile" : "default"}
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
              >
                <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> 
                {isMobile ? "Add" : "List New Property"}
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="loading-container">
              <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
              <p className="mt-2 text-gray-500">Loading your properties...</p>
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-8">
              {properties.map((property) => (
                <div key={property.id} className="relative">
                  <PropertyListingCard 
                    property={property} 
                    showDeleteButton={true}
                    onDelete={showDeleteConfirmation}
                    showOwnerControls={false}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-2 left-2 bg-white hover:bg-gray-100 h-8 w-8 p-0 z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProperty(property.id);
                    }}
                  >
                    <Edit className="h-3 w-3 md:h-4 md:w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 md:py-16 bg-white rounded-lg shadow">
              <h3 className="text-lg md:text-2xl font-semibold mb-2">You haven't listed any properties yet</h3>
              <p className="text-gray-500 mb-4 md:mb-6">Start earning by listing your property on Tuleeto</p>
              <Link to="/list-property">
                <Button 
                  size={isMobile ? "mobile" : "default"}
                  className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
                >
                  <Plus className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" /> List Your Property
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPropertyId} onOpenChange={(isOpen) => !isOpen && setDeletingPropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your property listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingPropertyId && handleDeleteConfirm(deletingPropertyId)}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Property'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPropertiesPage;
