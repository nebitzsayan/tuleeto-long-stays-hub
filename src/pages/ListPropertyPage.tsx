
import { Home } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { ListingSteps } from "@/components/property/ListingSteps";
import PropertyListingForm, { steps } from "@/components/property/PropertyListingForm";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const ListPropertyPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  
  // Check storage system on load
  useEffect(() => {
    const checkStorage = async () => {
      if (user) {
        try {
          // Just check if we can list buckets (not trying to create them here)
          const { data, error } = await supabase.storage.listBuckets();
          setStorageReady(error ? false : true);
          
          if (error) {
            console.error("Storage system check failed:", error);
          } else {
            // Check specifically for property_images bucket
            const hasPropertyBucket = data.some(bucket => bucket.name === 'property_images');
            if (!hasPropertyBucket) {
              console.warn("Property images bucket doesn't exist yet");
              // We'll create it when needed, not here
            }
          }
        } catch (err) {
          console.error("Error checking storage:", err);
          setStorageReady(false);
        }
      }
    };
    
    checkStorage();
  }, [user]);
  
  const handleTestStorage = async () => {
    try {
      toast.info("Testing storage connection...");
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        throw error;
      }
      
      toast.success("Storage connection successful!");
      setStorageReady(true);
    } catch (err: any) {
      console.error("Storage test failed:", err);
      toast.error(`Storage connection failed: ${err.message}`);
      setStorageReady(false);
    }
  };
  
  return (
    <MainLayout className="pt-24 px-4 pb-16 bg-tuleeto-off-white">
      <div className="container max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Home className="h-12 w-12 text-tuleeto-orange" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">List Your Property</h1>
          <p className="text-gray-600">
            Fill out the form below to list your property for rent on Tuleeto
          </p>
        </div>
        
        {storageReady === false && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Storage system is currently unavailable. Photos may not upload correctly.
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTestStorage} 
                className="ml-2"
              >
                Test Connection
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Progress Steps */}
        <ListingSteps currentStep={currentStep} />
        
        {/* Form */}
        <PropertyListingForm
          onStepChange={setCurrentStep}
          currentStep={currentStep}
        />
      </div>
    </MainLayout>
  );
};

export default ListPropertyPage;
