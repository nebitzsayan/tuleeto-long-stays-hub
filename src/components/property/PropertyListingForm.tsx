
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
    }
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
      
      // Prepare the location string
      const location = `${data.street}, ${data.city}, ${data.state} ${data.zipCode}`;
      
      // Create features array
      const features = ["Pet friendly", "Air conditioning", "In-unit laundry"];
      
      // Prepare property data
      const propertyData = {
        title: data.title,
        description: data.description,
        location: location,
        price: parseInt(data.price),
        bedrooms: parseInt(data.bedrooms),
        bathrooms: parseFloat(data.bathrooms),
        area: parseFloat(data.area),
        type: data.propertyType,
        features: features,
        available_from: data.availableFrom,
        images: photoUrls,
        owner_id: user.id
      };
      
      // Insert property into Supabase
      const { data: insertedProperty, error } = await supabase
        .from('properties')
        .insert(propertyData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast.success("Your property has been listed!");
      
      // Navigate to the property detail page
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
  
  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const uploadPhotos = async () => {
    if (photos.length === 0) return [];
    
    setIsUploading(true);
    try {
      const urls = [];
      
      for (const photo of photos) {
        const fileExt = photo.file.name.split('.').pop();
        const filePath = `${user?.id || 'anonymous'}/${crypto.randomUUID()}.${fileExt}`;
        
        const { error } = await supabase.storage
          .from('property_images')
          .upload(filePath, photo.file);
        
        if (error) throw error;
        
        const { data } = supabase.storage
          .from('property_images')
          .getPublicUrl(filePath);
        
        urls.push(data.publicUrl);
      }
      
      setPhotoUrls(urls);
      return urls;
    } catch (error: any) {
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
            />
          )}
          
          {step === 3 && (
            <ContactInfoStep form={form} />
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
                  e.preventDefault(); // Prevent default form submission
                  try {
                    // First validate all form fields
                    const isValid = await form.trigger();
                    if (!isValid) {
                      toast.error("Please correct all form errors before submitting");
                      return;
                    }
                    
                    // Upload photos first
                    await uploadPhotos();
                    
                    // Submit the form with form data
                    const formValues = form.getValues();
                    onSubmit(formValues);
                  } catch (error) {
                    console.error("Error during submission:", error);
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
