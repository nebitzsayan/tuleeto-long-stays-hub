
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { PropertyDetailsStep } from "@/components/property/PropertyDetailsStep";
import LocationStep from "@/components/property/LocationStep";
import { FeaturesPhotosStep } from "@/components/property/FeaturesPhotosStep";
import { ContactInfoStep } from "@/components/property/ContactInfoStep";
import { uploadMultipleFiles } from "@/lib/supabaseStorage";

export const formSchema = z.object({
  propertyType: z.string().min(1, { message: "Please select a property type" }),
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  street: z.string().min(1, { message: "Street is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().min(1, { message: "ZIP code is required" }),
  price: z.string().min(1, { message: "Rent price is required" }),
  bedrooms: z.string().min(1, { message: "Number of bedrooms is required" }),
  bathrooms: z.string().min(1, { message: "Number of bathrooms is required" }),
  area: z.string().min(1, { message: "Area is required" }),
  availableFrom: z.string().min(1, { message: "Availability date is required" }),
  contactName: z.string().min(1, { message: "Name is required" }),
  contactEmail: z.string().email({ message: "Invalid email address" }),
  contactPhone: z.string().min(10, { message: "Valid phone number is required" }),
  agreeToTerms: z.boolean().refine(val => val === true, { message: "You must agree to the terms" })
});

export type FormValues = z.infer<typeof formSchema>;

export const steps = [
  { id: "property", label: "Property Details" },
  { id: "location", label: "Location" },
  { id: "features", label: "Features & Photos" },
  { id: "contact", label: "Contact Info" }
];

interface PropertyListingFormProps {
  currentStep?: number;
  onStepChange?: (step: number) => void;
}

const PropertyListingForm = ({ 
  currentStep = 0, 
  onStepChange = () => {} 
}: PropertyListingFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(currentStep);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "Pet friendly", 
    "Air conditioning", 
    "In-unit laundry"
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyType: "",
      title: "",
      description: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      area: "",
      availableFrom: "",
      contactName: user?.user_metadata?.full_name || "",
      contactEmail: user?.email || "",
      contactPhone: "",
      agreeToTerms: false
    },
    mode: "onChange"
  });

  const uploadPhotos = async () => {
    if (photos.length === 0) {
      if (photoUrls.length > 0) {
        return photoUrls;
      }
      setUploadError("Please upload at least one photo of your property");
      return [];
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    
    try {
      console.log(`Starting upload of ${photos.length} photos...`);
      toast.info(`Uploading ${photos.length} photos...`);
      
      const files = photos.map(photo => photo.file);
      
      // Generate a unique pathPrefix with timestamp
      const pathPrefix = user?.id ? `${user.id}/${Date.now()}` : `anonymous/${Date.now()}`;
      
      const urls = await uploadMultipleFiles(
        files,
        pathPrefix,
        (progress) => {
          setUploadProgress(progress);
          console.log(`Upload progress: ${progress}%`);
        }
      );
      
      if (urls.length === 0) {
        setUploadError("Failed to upload photos. Please try again.");
        toast.error("Failed to upload photos. Please try again.");
        return [];
      }
      
      if (urls.length !== files.length) {
        toast.warning(`Only ${urls.length} out of ${files.length} photos were uploaded successfully.`);
      } else {
        toast.success(`All ${urls.length} photos uploaded successfully!`);
      }
      
      setPhotoUrls(urls);
      return urls;
    } catch (error: any) {
      console.error("Error in uploadPhotos:", error);
      setUploadError(`Upload error: ${error.message || "Unknown error"}`);
      toast.error(`Upload error: ${error.message || "Unknown error"}`);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setUploadError(null);
      
      if (!user) {
        toast.error("You must be logged in to list a property");
        return;
      }
      
      // Check if we have photos to upload
      if (photos.length === 0 && photoUrls.length === 0) {
        toast.error("Please upload at least one photo of your property");
        setUploadError("Please upload at least one photo of your property");
        setIsSubmitting(false);
        return;
      }
      
      // Upload photos if needed
      let finalPhotoUrls = photoUrls;
      if (photos.length > 0) {
        finalPhotoUrls = await uploadPhotos();
        
        // Double-check we have URLs after upload
        if (finalPhotoUrls.length === 0) {
          setUploadError("Photo upload failed. Please try again.");
          toast.error("Photo upload failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
      }
      
      const location = `${data.street}, ${data.city}, ${data.state} ${data.zipCode}`;
      
      // Include contact_phone in the propertyData object
      const propertyData = {
        title: data.title,
        description: data.description,
        location: location,
        price: parseInt(data.price),
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseFloat(data.bathrooms),
        area: parseFloat(data.area),
        type: data.propertyType,
        features: selectedFeatures,
        available_from: data.availableFrom,
        images: finalPhotoUrls,
        owner_id: user.id,
        contact_phone: data.contactPhone
      };
      
      console.log("Submitting property data:", propertyData);
      
      const { data: insertedProperty, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select('id')
        .single();
      
      if (error) {
        console.error("Error inserting property:", error);
        throw error;
      }
      
      toast.success("Your property has been listed successfully!");
      
      if (insertedProperty?.id) {
        navigate(`/property/${insertedProperty.id}`);
      } else {
        navigate("/my-properties");
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(`Error listing property: ${error.message}`);
      setUploadError(`Error listing property: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const nextStep = async () => {
    let fieldsToValidate: string[] = [];
    
    switch (step) {
      case 0:
        fieldsToValidate = ["propertyType", "title", "description"];
        break;
      case 1:
        fieldsToValidate = ["street", "city", "state", "zipCode"];
        break;
      case 2:
        fieldsToValidate = ["bedrooms", "bathrooms", "area", "price", "availableFrom"];
        // Additionally check if photos are added when on this step
        if (photos.length === 0 && photoUrls.length === 0) {
          toast.warning("Please upload at least one photo before continuing");
          return;
        }
        break;
    }
    
    const stepIsValid = await form.trigger(fieldsToValidate as any);
    
    if (stepIsValid && step < steps.length - 1) {
      const newStep = step + 1;
      setStep(newStep);
      onStepChange(newStep);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    if (step > 0) {
      const newStep = step - 1;
      setStep(newStep);
      onStepChange(newStep);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && (
            <PropertyDetailsStep form={form} />
          )}
          
          {step === 1 && (
            <LocationStep form={form} />
          )}
          
          {step === 2 && (
            <FeaturesPhotosStep 
              form={form} 
              photos={photos} 
              setPhotos={setPhotos}
              selectedFeatures={selectedFeatures}
              setSelectedFeatures={setSelectedFeatures}
            />
          )}
          
          {step === 3 && (
            <ContactInfoStep form={form} />
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <p className="text-sm text-center">Uploading photos: {uploadProgress}%</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          {uploadError && (
            <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
              {uploadError}
            </div>
          )}
          
          <div className="flex justify-between pt-4 border-t border-gray-100">
            {step > 0 ? (
              <Button 
                type="button"
                variant="outline"
                className="flex items-center"
                onClick={prevStep}
                disabled={isUploading || isSubmitting}
              >
                Back
              </Button>
            ) : (
              <div></div>
            )}
            
            {step < steps.length - 1 ? (
              <Button 
                type="button"
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white flex items-center"
                onClick={nextStep}
                disabled={isUploading}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit"
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                disabled={isUploading || isSubmitting}
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const isValid = await form.trigger();
                    if (!isValid) {
                      toast.error("Please correct all form errors before submitting");
                      return;
                    }
                    
                    if (photos.length === 0 && photoUrls.length === 0) {
                      toast.error("Please add at least one photo of your property");
                      setUploadError("Please add at least one photo of your property");
                      return;
                    }
                    
                    const formValues = form.getValues();
                    onSubmit(formValues);
                  } catch (error: any) {
                    console.error("Error during submission:", error);
                    toast.error(`Submission error: ${error.message}`);
                    setUploadError(`Submission error: ${error.message}`);
                  }
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading Photos...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Listing Property...
                  </>
                ) : (
                  "List My Property"
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PropertyListingForm;
