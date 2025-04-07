
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, Upload, Home, Loader2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
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

type FormValues = z.infer<typeof formSchema>;

const steps = [
  { id: "property", label: "Property Details" },
  { id: "location", label: "Location" },
  { id: "features", label: "Features & Photos" },
  { id: "contact", label: "Contact Info" }
];

const ListPropertyPage = () => {
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
        setTimeout(() => {
          navigate(`/property/${insertedProperty.id}`);
        }, 1500);
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

  const handleAddPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    
    if (photos.length >= 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }
    
    // Add photo preview
    const preview = URL.createObjectURL(file);
    setPhotos([...photos, { file, preview }]);
    fileInput.value = '';
  };
  
  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  const uploadPhotos = async () => {
    if (photos.length === 0) return [];
    
    setIsUploading(true);
    try {
      const urls = [];
      
      for (const photo of photos) {
        const fileExt = photo.file.name.split('.').pop();
        const filePath = `${user?.id || 'anonymous'}/${uuidv4()}.${fileExt}`;
        
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
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-24 px-4 pb-16 bg-tuleeto-off-white">
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
          
          {/* Progress Steps */}
          <div className="mb-10">
            <div className="flex justify-between">
              {steps.map((s, i) => (
                <div 
                  key={s.id} 
                  className={`flex flex-col items-center ${i > 0 && "flex-1"}`}
                >
                  <div className="relative flex items-center">
                    <div 
                      className={`h-10 w-10 rounded-full flex items-center justify-center border-2 
                      ${i === step 
                        ? "border-tuleeto-orange bg-tuleeto-orange text-white" 
                        : i < step 
                          ? "border-tuleeto-orange bg-tuleeto-orange/20 text-tuleeto-orange"
                          : "border-gray-300 bg-white text-gray-400"
                      }`}
                    >
                      {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
                    </div>
                    
                    {i < steps.length - 1 && (
                      <div 
                        className={`absolute top-5 h-0.5 w-full left-0 -z-10 
                        ${i < step ? "bg-tuleeto-orange" : "bg-gray-300"}`}
                      ></div>
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${i === step ? "text-tuleeto-orange font-medium" : "text-gray-500"}`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 0 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Property Details</h2>
                    
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Apartment">Apartment</SelectItem>
                              <SelectItem value="House">House</SelectItem>
                              <SelectItem value="Condo">Condo</SelectItem>
                              <SelectItem value="Studio">Studio</SelectItem>
                              <SelectItem value="Townhouse">Townhouse</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Modern Downtown Apartment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your property in detail..." 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Location</h2>
                    
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="NY">New York</SelectItem>
                                <SelectItem value="CA">California</SelectItem>
                                <SelectItem value="TX">Texas</SelectItem>
                                <SelectItem value="FL">Florida</SelectItem>
                                {/* Add more states as needed */}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. 10001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Features & Photos</h2>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bedrooms</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, "6+"].map((num) => (
                                  <SelectItem key={num.toString()} value={num.toString()}>
                                    {num}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bathrooms</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["1", "1.5", "2", "2.5", "3", "3.5", "4+"].map((num) => (
                                  <SelectItem key={num} value={num}>
                                    {num}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area (sq ft)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g. 1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Rent ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 2000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="availableFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="space-y-4">
                      <FormLabel>Property Photos</FormLabel>
                      <div className="flex flex-wrap gap-3">
                        {photos.map((photo, i) => (
                          <div key={i} className="relative">
                            <img 
                              src={photo.preview} 
                              alt={`Property photo ${i+1}`}
                              className="w-20 h-20 object-cover rounded-md"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                              onClick={() => handleRemovePhoto(i)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {photos.length < 5 && (
                          <div className="relative">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="w-20 h-20 flex flex-col items-center justify-center border-dashed"
                            >
                              <Upload className="h-6 w-6 mb-1" />
                              <span className="text-xs">Add</span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={handleAddPhoto}
                              disabled={photos.length >= 5}
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Upload up to 5 photos (Max 5MB each)</p>
                    </div>
                  </div>
                )}
                
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Contact Information</h2>
                    
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="e.g. john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator className="my-6" />
                    
                    <FormField
                      control={form.control}
                      name="agreeToTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="h-4 w-4 border-gray-300 rounded text-tuleeto-orange focus:ring-tuleeto-orange"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the <a href="#" className="text-tuleeto-orange hover:underline">terms and conditions</a>
                            </FormLabel>
                            <FormDescription>
                              By listing your property, you confirm that you have the right to rent this property
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
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
                      <ArrowLeft className="h-4 w-4 mr-2" /> Back
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
                      Next <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      type="button"
                      className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                      disabled={isUploading || isSubmitting}
                      onClick={async () => {
                        try {
                          if (!form.formState.isValid) {
                            form.trigger();
                            return;
                          }
                          
                          // Upload photos first
                          await uploadPhotos();
                          
                          // Submit the form
                          form.handleSubmit(onSubmit)();
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
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ListPropertyPage;
