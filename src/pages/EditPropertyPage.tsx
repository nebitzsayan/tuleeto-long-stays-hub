
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface PropertyData {
  id: string;
  title: string;
  description: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  features: string[];
  is_public: boolean;
}

const availableFeatures = [
  "Pet friendly",
  "Air conditioning", 
  "In-unit laundry",
  "Parking",
  "Balcony",
  "Garden",
  "Furnished",
  "WiFi included",
  "Gym access",
  "Swimming pool",
  "24/7 security",
  "Elevator",
  "Near public transport",
  "Shopping nearby",
  "Quiet neighborhood"
];

const EditPropertyPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editBedrooms, setEditBedrooms] = useState("");
  const [editBathrooms, setEditBathrooms] = useState("");
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editIsPublic, setEditIsPublic] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setProperty(data);
          setEditTitle(data.title);
          setEditDescription(data.description || "");
          setEditPrice(data.price.toString());
          setEditBedrooms(data.bedrooms.toString());
          setEditBathrooms(data.bathrooms.toString());
          setEditFeatures(data.features || []);
          setEditIsPublic(data.is_public !== false);
        }
      } catch (error: any) {
        console.error('Error fetching property:', error);
        toast.error('Failed to load property details');
        navigate('/my-properties');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [id, user, navigate]);

  const handleSaveChanges = async () => {
    if (!property) return;
    
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
          features: editFeatures,
          is_public: editIsPublic
        })
        .eq('id', property.id);

      if (error) {
        throw error;
      }

      toast.success("Property updated successfully");
      navigate('/my-properties');
    } catch (error: any) {
      console.error('Error updating property:', error);
      toast.error('Failed to update property');
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow pt-16 md:pt-24 px-4 bg-tuleeto-off-white">
          <div className="container max-w-4xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-tuleeto-orange" />
              <p className="ml-3 text-gray-600">Loading property details...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-16 md:pt-24 px-4 bg-tuleeto-off-white">
        <div className="container max-w-4xl mx-auto">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/my-properties')}
              className="flex items-center gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to My Properties
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Property</h1>
            <p className="text-gray-600 mt-2">Update your property details</p>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Property Title</Label>
                  <Input
                    id="title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Property title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Property description"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Monthly Rent (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Bedrooms</Label>
                    <Select value={editBedrooms} onValueChange={setEditBedrooms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} Bedroom{num > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Bathrooms</Label>
                    <Select value={editBathrooms} onValueChange={setEditBathrooms}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["1", "1.5", "2", "2.5", "3", "3.5", "4"].map((num) => (
                          <SelectItem key={num} value={num}>
                            {num} Bathroom{parseFloat(num) > 1 ? 's' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Listing Visibility */}
            <Card>
              <CardHeader>
                <CardTitle>Listing Visibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Public Listing</Label>
                    <p className="text-sm text-gray-600">
                      {editIsPublic 
                        ? 'Your property is visible to everyone searching for rentals' 
                        : 'Your property is hidden from listings and search results'}
                    </p>
                  </div>
                  <Switch 
                    checked={editIsPublic} 
                    onCheckedChange={setEditIsPublic}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableFeatures.map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`feature-${feature}`}
                        checked={editFeatures.includes(feature)}
                        onCheckedChange={() => handleFeatureToggle(feature)}
                      />
                      <label 
                        htmlFor={`feature-${feature}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {feature}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4 pb-8">
              <Button 
                variant="outline" 
                onClick={() => navigate('/my-properties')}
                disabled={isSaving}
              >
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
                    Saving Changes...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EditPropertyPage;
