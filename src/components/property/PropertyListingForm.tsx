import { useState } from "react";
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
import { ListingSteps } from "@/components/property/ListingSteps";
import { PropertyDetailsStep } from "@/components/property/PropertyDetailsStep";
import { LocationStep } from "@/components/property/LocationStep";
import { FeaturesPhotosStep } from "@/components/property/FeaturesPhotosStep";
import { ContactInfoStep } from "@/components/property/ContactInfoStep";

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

const PropertyListingForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
      contactName: "",
      contactEmail: user?.email || "",
      contactPhone: "",
      agreeToTerms: false
    },
    mode: "onChange"
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      if (!user) {
        toast.error("You must be logged in to list a property");
        return;
      }
      
      if (photoUrls.length === 0) {
        toast.error("Please upload at least one photo of your property");
        return;
      }
      
      const location = `${data.street}, ${data.city}, ${data.state} ${data.zipCode}`;
      
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
        images: photoUrls,
        owner_id: user.id
      };
      
      const { data: insertedProperty, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast.success("Your property has been listed!");
      
      if (insertedProperty?.id) {
        navigate(`/property/${insertedProperty.id}`);
      } else {
        navigate("/my-properties");
      }
    } catch (error: any) {
      toast.error(`Error listing property: ${error.message}`);
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
        break;
    }
    
    const stepIsValid = await form.trigger(fieldsToValidate as any);
    
    if (stepIsValid && step < steps.length - 1) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) return [];
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const urls = [];
      const totalPhotos = photos.length;
      
      const { data: bucketExists } = await supabase
        .storage
        .getBucket('property_images');

      if (!bucketExists) {
        const { error: createBucketError } = await supabase.storage.createBucket('property_images', {
          public: true
        });
        if (createBucketError) {
          console.error("Error creating bucket:", createBucketError);
          throw createBucketError;
        }
      }
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const fileExt = photo.file.name.split('.').pop();
        const fileName = `${user?.id || 'anonymous'}-${Date.now()}-${i}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`;
        
        const { error } = await supabase.storage
          .from('property_images')
          .upload(filePath, photo.file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error(`Error uploading photo ${i+1}:`, error);
          throw error;
        }
        
        const { data } = supabase.storage
          .from('property_images')
          .getPublicUrl(filePath);
        
        urls.push(data.publicUrl);
        
        setUploadProgress(Math.round(((i + 1) / totalPhotos) * 100));
      }
      
      setPhotoUrls(urls);
      return urls;
    } catch (error: any) {
      console.error("Error in uploadPhotos:", error);
      toast.error(`Error uploading photos: ${error.message}`);
      throw error;
    } finally {
      setIsUploading(false);
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
                    
                    if (photos.length === 0) {
                      toast.error("Please add at least one photo of your property");
                      return;
                    }
                    
                    await uploadPhotos();
                    
                    const formValues = form.getValues();
                    onSubmit(formValues);
                  } catch (error: any) {
                    console.error("Error during submission:", error);
                    toast.error(`Submission error: ${error.message}`);
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
