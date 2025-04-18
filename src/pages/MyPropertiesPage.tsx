
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Pencil, Edit } from "lucide-react";
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
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ExtendedPropertyType extends PropertyType {
  description?: string;
  features?: string[];
}

const MyPropertiesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<ExtendedPropertyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPropertyId, setDeletingPropertyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit property state
  const [isEditing, setIsEditing] = useState(false);
  const [editingProperty, setEditingProperty] = useState<ExtendedPropertyType | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editBedrooms, setEditBedrooms] = useState("");
  const [editBathrooms, setEditBathrooms] = useState("");
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const availableFeatures = [
    "Pet friendly", 
    "Wifi", 
    "Air conditioning", 
    "In-unit laundry"
  ];

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
            description: prop.description,
            location: prop.location,
            price: prop.price,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            image: prop.images[0] || "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=500&h=300&q=80",
            type: prop.type,
            features: prop.features
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
    } catch (error: any) {
      console.error(`Error deleting property: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setDeletingPropertyId(null);
    }
  };

  const showDeleteConfirmation = (id: string) => {
    setDeletingPropertyId(id);
  };

  const handleEditProperty = (property: ExtendedPropertyType) => {
    setEditingProperty(property);
    setEditTitle(property.title);
    setEditDescription(property.description || "");
    setEditPrice(property.price.toString());
    setEditBedrooms(property.bedrooms.toString());
    setEditBathrooms(property.bathrooms.toString());
    setEditFeatures(property.features || []);
    setIsEditing(true);
  };

  const handleSaveChanges = async () => {
    if (!editingProperty) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          title: editTitle,
          description: editDescription,
          price: parseInt(editPrice),
          bedrooms: parseInt(editBedrooms),
          bathrooms: parseFloat(editBathrooms),
          features: editFeatures
        })
        .eq('id', editingProperty.id);

      if (error) {
        throw error;
      }

      // Update the property in the local state
      setProperties(properties.map(prop => 
        prop.id === editingProperty.id 
          ? {
              ...prop,
              title: editTitle,
              description: editDescription,
              price: parseInt(editPrice),
              bedrooms: parseInt(editBedrooms),
              bathrooms: parseFloat(editBathrooms),
              features: editFeatures
            }
          : prop
      ));

      setIsEditing(false);
    } catch (error: any) {
      console.error(`Error updating property: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setEditFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
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
                <div key={property.id} className="relative">
                  <PropertyListingCard 
                    property={property} 
                    showDeleteButton={true}
                    onDelete={showDeleteConfirmation}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="absolute top-2 right-12 bg-white hover:bg-gray-100"
                    onClick={() => handleEditProperty(property)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>
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

      {/* Property Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update your property details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Monthly Rent</Label>
                <Input
                  id="price"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Select 
                  value={editBedrooms}
                  onValueChange={setEditBedrooms}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="bathrooms">Bathrooms</Label>
              <Select 
                value={editBathrooms}
                onValueChange={setEditBathrooms}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {["1", "1.5", "2", "2.5", "3", "3.5", "4"].map((num) => (
                    <SelectItem key={num} value={num}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2">
                {availableFeatures.map(feature => (
                  <div key={feature} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`feature-${feature}`}
                      checked={editFeatures.includes(feature)}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                    />
                    <label 
                      htmlFor={`feature-${feature}`}
                      className="text-sm font-medium leading-none"
                    >
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
