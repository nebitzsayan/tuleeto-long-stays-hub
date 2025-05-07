
import { Home } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { ListingSteps } from "@/components/property/ListingSteps";
import PropertyListingForm, { steps } from "@/components/property/PropertyListingForm";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { checkBucketExists } from "@/lib/supabaseStorage";

const ListPropertyPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  
  // Check storage system on load
  useEffect(() => {
    const checkStorage = async () => {
      if (user) {
        try {
          // Check if property_images bucket exists
          const bucketExists = await checkBucketExists('property_images');
          setStorageReady(bucketExists);
          
          if (!bucketExists) {
            console.warn("Property images bucket doesn't exist yet");
            toast.warning("Storage system not properly configured. Please try again or contact support.");
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
      const bucketExists = await checkBucketExists('property_images');
      
      if (!bucketExists) {
        throw new Error("Property images bucket does not exist or you don't have access to it");
      }
      
      // If we got here, connection is working
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
            <AlertDescription className="flex items-center justify-between">
              <span>Storage system is currently unavailable. Photos may not upload correctly.</span>
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
        
        {storageReady === true && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Storage system is ready for uploads.
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
