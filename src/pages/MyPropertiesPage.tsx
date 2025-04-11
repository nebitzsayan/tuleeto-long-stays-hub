
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PropertyListingCard, { PropertyType } from "@/components/property/PropertyListingCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const MyPropertiesPage = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchUserProperties = async () => {
      try {
        if (!user) return;
        
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user.id);
        
        if (error) {
          throw error;
        }
        
        if (data) {
          // Format the data to match the PropertyType with string id
          const formattedProperties = data.map(prop => ({
            id: prop.id,
            title: prop.title,
            location: prop.location,
            price: prop.price,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            image: prop.images[0] || "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
            type: prop.type
          }));
          
          setProperties(formattedProperties);
        }
      } catch (error: any) {
        toast.error(`Error fetching properties: ${error.message}`);
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
      toast.error(`Error deleting property: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setDeletingPropertyId(null);
    }
  };

  const showDeleteConfirmation = (id: string) => {
    setDeletingPropertyId(id);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 bg-tuleeto-off-white">
        <div className="container max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold">My Properties</h1>
            <Link to="/list-property">
              <Button className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark">
                <Plus className="mr-2 h-4 w-4" /> List New Property
              </Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {properties.map((property) => (
                <PropertyListingCard 
                  key={property.id} 
                  property={property} 
                  showDeleteButton={true}
                  onDelete={showDeleteConfirmation}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow">
              <h3 className="text-2xl font-semibold mb-2">You haven't listed any properties yet</h3>
              <p className="text-gray-500 mb-6">Start earning by listing your property on Tuleeto</p>
              <Link to="/list-property">
                <Button className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark">
                  <Plus className="mr-2 h-4 w-4" /> List Your Property
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      
      <Footer />

      {/* Confirmation Dialog */}
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
