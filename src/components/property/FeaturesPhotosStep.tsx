import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Upload } from "lucide-react";
import { FormValues } from "./PropertyListingForm";
import { toast } from "sonner";

interface FeaturesPhotosStepProps {
  form: UseFormReturn<FormValues>;
  photos: { file: File; preview: string }[];
  setPhotos: React.Dispatch<React.SetStateAction<{ file: File; preview: string }[]>>;
  selectedFeatures: string[];
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
}

const features = [
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

export const FeaturesPhotosStep = ({ 
  form, 
  photos, 
  setPhotos, 
  selectedFeatures, 
  setSelectedFeatures 
}: FeaturesPhotosStepProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const newPhotos: { file: File; preview: string }[] = [];
      
      for (let i = 0; i < Math.min(files.length, 10 - photos.length); i++) {
        const file = files[i];
        
        console.log('Processing file:', {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        });

        // File size validation - 5MB limit for better mobile compatibility
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File "${file.name}" is too large. Maximum size is 5MB.`);
          continue;
        }

        // Enhanced file type validation with better mobile support
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
          'image/heic', 'image/heif', 'application/octet-stream'
        ];
        
        const fileName = file.name.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
        const fileExtension = fileName.split('.').pop() || '';
        
        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExtension = allowedExtensions.includes(fileExtension);
        
        if (!hasValidType && !hasValidExtension) {
          console.error(`Invalid file type: ${file.type}, extension: ${fileExtension}`);
          toast.error(`File "${file.name}" has unsupported format. Please use JPEG, PNG, WebP, or GIF images.`);
          continue;
        }

        // Create preview with enhanced error handling
        try {
          const preview = await createImagePreview(file);
          newPhotos.push({ file, preview });
          console.log(`Successfully processed file ${i + 1}/${files.length}: ${file.name}`);
        } catch (error) {
          console.error('Error creating preview for file:', file.name, error);
          toast.error(`Could not process "${file.name}". Please try with a different image.`);
        }
      }

      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
        toast.success(`Successfully added ${newPhotos.length} photo(s)`);
      } else {
        toast.error("No photos could be processed. Please try with different images.");
      }

      if (files.length > (10 - photos.length)) {
        toast.warning(`Only ${10 - photos.length} photos could be added. Maximum is 10 photos.`);
      }

    } catch (error: any) {
      console.error('Error processing photos:', error);
      toast.error('Failed to process photos. Please try again with different images.');
    } finally {
      setIsUploading(false);
      // Reset the input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file - no result'));
          }
        };
        
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('Error reading file'));
        };
        
        reader.onabort = () => {
          reject(new Error('File reading was aborted'));
        };
        
        // Add timeout for mobile devices
        const timeout = setTimeout(() => {
          reader.abort();
          reject(new Error('File reading timed out'));
        }, 10000); // 10 second timeout
        
        reader.onloadend = () => {
          clearTimeout(timeout);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error setting up FileReader:', error);
        reject(new Error('Failed to set up file reader'));
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Revoke the object URL to free memory
      if (prev[index]?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return updated;
    });
    toast.success("Photo removed");
  };

  const handleFeatureChange = (feature: string, checked: boolean) => {
    if (checked) {
      setSelectedFeatures(prev => [...prev, feature]);
    } else {
      setSelectedFeatures(prev => prev.filter(f => f !== feature));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Property Details & Photos</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bedrooms</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 Bedroom</SelectItem>
                  <SelectItem value="2">2 Bedrooms</SelectItem>
                  <SelectItem value="3">3 Bedrooms</SelectItem>
                  <SelectItem value="4">4 Bedrooms</SelectItem>
                  <SelectItem value="5">5+ Bedrooms</SelectItem>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1 Bathroom</SelectItem>
                  <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                  <SelectItem value="2">2 Bathrooms</SelectItem>
                  <SelectItem value="2.5">2.5 Bathrooms</SelectItem>
                  <SelectItem value="3">3 Bathrooms</SelectItem>
                  <SelectItem value="3.5">3.5 Bathrooms</SelectItem>
                  <SelectItem value="4">4+ Bathrooms</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area (sq ft)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 1200" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Rent (₹)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 25000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
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
      
      {/* Features Selection */}
      <div className="space-y-4">
        <FormLabel>Property Features</FormLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center space-x-2">
              <Checkbox
                id={feature}
                checked={selectedFeatures.includes(feature)}
                onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
              />
              <label htmlFor={feature} className="text-sm font-medium">
                {feature}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Photo Upload Section - Single upload option only */}
      <div className="space-y-4">
        <FormLabel>Property Photos (Required)</FormLabel>
        <p className="text-sm text-gray-600">
          Upload up to 10 photos from your gallery. The first photo will be used as the main image.
        </p>
        
        {/* Single file input for gallery only */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        {/* Photo Preview Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={photo.preview}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('Image preview error for photo', index, e);
                      }}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {index === 0 && (
                      <div className="absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
                        Main
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {photos.length < 10 && (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-0">
                  <div className="aspect-square flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                      className="h-full w-full flex flex-col items-center gap-2"
                    >
                      <Plus className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-500">Add More</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Single upload button when no photos */}
        {photos.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <Button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Processing...' : 'Choose Photos from Gallery'}
              </Button>
              <p className="text-sm text-gray-500">
                Add photos to showcase your property
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <p className="text-sm text-blue-600 text-center animate-pulse">Processing photos...</p>
        )}
      </div>
    </div>
  );
};
