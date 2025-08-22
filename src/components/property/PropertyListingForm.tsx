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
import LocationStepWithMap from "@/components/property/LocationStepWithMap";
import { FeaturesPhotosStep } from "@/components/property/FeaturesPhotosStep";
import { ContactInfoStep } from "@/components/property/ContactInfoStep";
import { uploadMultipleFiles } from "@/lib/supabaseStorage";
import { uploadMultipleToImageKit, UploadProgress } from "@/lib/imagekitService";
import { AlertCircle } from "lucide-react";
import { EnhancedUploadProgress } from "@/components/property/EnhancedUploadProgress";

export const formSchema = z.object({
  propertyType: z.string().min(1, { message: "Please select a property type" }),
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  street: z.string().min(1, { message: "Street is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().min(1, { message: "ZIP code is required" }),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number()
  }).optional(),
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
  const [photos, setPhotos] = useState<{ file: File; preview: string; status: 'pending' | 'uploading' | 'success' | 'error'; url?: string; error?: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "Pet friendly", 
    "Air conditioning", 
    "In-unit laundry"
  ]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

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
      coordinates: undefined,
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
    const photosToUpload = photos.filter(p => p.status === 'pending' || p.status === 'error');
    
    if (photosToUpload.length === 0) {
      const successfulPhotos = photos.filter(p => p.status === 'success' && p.url);
      return successfulPhotos.map(p => p.url!);
    }
    
    setUploadError(null);
    
    // Set all pending/error photos to uploading
    setPhotos(prev => prev.map(photo => 
      photosToUpload.some(p => p.file === photo.file) 
        ? { ...photo, status: 'uploading' as const }
        : photo
    ));
    
    try {
      console.log(`Starting ImageKit upload of ${photosToUpload.length} photos...`);
      toast.info(`Uploading ${photosToUpload.length} photos...`);
      
      const files = photosToUpload.map(photo => photo.file);
      
      // Upload to ImageKit with enhanced progress tracking
      const urls = await uploadMultipleToImageKit(
        files,
        'property-images',
        (progress: UploadProgress) => {
          console.log(`Upload progress: ${progress.completed}/${progress.total}`, progress.currentFile ? `Current: ${progress.currentFile}` : '');
          
          // Update upload progress state
          setUploadProgress(progress);
          
          // Update photo statuses based on completed uploads
          setPhotos(prev => prev.map(photo => {
            const isCurrentFile = progress.currentFile === photo.file.name;
            const isCompleted = progress.completed > prev.findIndex(p => p.file.name === photo.file.name);
            
            if (isCurrentFile && progress.isUploading) {
              return { ...photo, status: 'uploading' as const };
            }
            
            return photo;
          }));
        }
      );
      
      if (urls.length === 0) {
        setUploadError("All photo uploads failed. Please check your connection and try again.");
        toast.error("All photo uploads failed. Please check your connection and try again.");
        return [];
      }
      
      // Update photos with successful uploads
      setPhotos(prev => prev.map(photo => {
        const uploadedIndex = files.findIndex(f => f.name === photo.file.name);
        if (uploadedIndex !== -1 && uploadedIndex < urls.length) {
          return {
            ...photo,
            status: 'success' as const,
            url: urls[uploadedIndex]
          };
        }
        return {
          ...photo,
          status: 'error' as const,
          error: 'Upload failed'
        };
      }));
      
      const totalPhotos = photos.length;
      const successCount = urls.length;
      const failureCount = totalPhotos - successCount;
      
      if (failureCount > 0) {
        toast.warning(`${successCount} of ${totalPhotos} photos uploaded successfully. You can retry failed uploads.`);
      } else {
        toast.success(`All ${successCount} photos uploaded successfully!`);
      }
      
      // Return all successful URLs (including previously uploaded ones)
      const allSuccessfulPhotos = photos.filter(p => p.status === 'success' && p.url);
      return [...allSuccessfulPhotos.map(p => p.url!), ...urls];
    } catch (error: any) {
      console.error("Error in uploadPhotos:", error);
      setUploadError(`Upload error: ${error.message || "Network error - please check your connection"}`);
      toast.error(`Upload error: ${error.message || "Network error - please check your connection"}`);
      
      // Set all uploading photos back to error state
      setPhotos(prev => prev.map(photo => 
        photo.status === 'uploading' 
          ? { ...photo, status: 'error' as const, error: error.message || "Upload failed - check connection" }
          : photo
      ));
      
      return [];
    } finally {
      setUploadProgress(null);
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
      
      // Check if we have photos
      const hasPhotos = photos.length > 0;
      const successfulPhotos = photos.filter(p => p.status === 'success');
      const pendingPhotos = photos.filter(p => p.status === 'pending' || p.status === 'error');
      
      if (!hasPhotos) {
        toast.error("Please upload at least one photo of your property");
        setUploadError("Please upload at least one photo of your property");
        setIsSubmitting(false);
        return;
      }
      
      // Upload any remaining photos
      let finalPhotoUrls: string[] = [];
      
      if (pendingPhotos.length > 0) {
        finalPhotoUrls = await uploadPhotos();
        
        if (finalPhotoUrls.length === 0) {
          setUploadError("Photo upload failed. Please try again.");
          toast.error("Photo upload failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
      } else {
        // Use already uploaded photos
        finalPhotoUrls = successfulPhotos.map(p => p.url!);
      }
      
      const location = `${data.street}, ${data.city}, ${data.state} ${data.zipCode}`;
      
      const propertyData = {
        title: data.title,
        description: data.description,
        location: location,
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
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
        // Check if location is selected on map
        const coordinates = form.getValues("coordinates");
        if (!coordinates) {
          toast.warning("Please mark your property location on the map");
          return;
        }
        break;
      case 2:
        fieldsToValidate = ["bedrooms", "bathrooms", "area", "price", "availableFrom"];
        if (photos.length === 0) {
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

  // Count photo upload status
  const uploadingCount = photos.filter(p => p.status === 'uploading').length;
  const errorCount = photos.filter(p => p.status === 'error').length;
  const hasUploadingPhotos = uploadingCount > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 0 && (
            <PropertyDetailsStep form={form} />
          )}
          
          {step === 1 && (
            <LocationStepWithMap form={form} />
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
          
          {/* Enhanced Upload Progress */}
          {uploadProgress && (
            <EnhancedUploadProgress
              totalFiles={uploadProgress.total}
              completedFiles={uploadProgress.completed}
              successCount={uploadProgress.success}
              errorCount={uploadProgress.error}
              currentFileName={uploadProgress.currentFile}
              isUploading={uploadProgress.isUploading}
              uploadSpeed={uploadProgress.uploadSpeed}
              timeRemaining={uploadProgress.timeRemaining}
              errorDetails={uploadProgress.errorDetails}
            />
          )}
          
          {uploadError && (
            <div className="text-red-500 text-sm p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Upload Error</span>
              </div>
              <p>{uploadError}</p>
            </div>
          )}
          
          <div className="flex justify-between pt-4 border-t border-gray-100">
            {step > 0 ? (
              <Button 
                type="button"
                variant="outline"
                className="flex items-center"
                onClick={prevStep}
                disabled={hasUploadingPhotos || isSubmitting}
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
                disabled={hasUploadingPhotos}
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit"
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                disabled={hasUploadingPhotos || isSubmitting}
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    const isValid = await form.trigger();
                    if (!isValid) {
                      toast.error("Please correct all form errors before submitting");
                      return;
                    }
                    
                    if (photos.length === 0) {
                      toast.error("Please add at least one photo of your property");
                      setUploadError("Please add at least one photo of your property");
                      return;
                    }
                    
                    if (errorCount > 0) {
                      toast.warning("Some photos failed to upload. Only successfully uploaded photos will be used.");
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
                {hasUploadingPhotos ? (
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
