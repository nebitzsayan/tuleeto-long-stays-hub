
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

interface FeaturesPhotosStepProps {
  form: UseFormReturn<FormValues>;
  photos: { file: File; preview: string }[];
  setPhotos: React.Dispatch<React.SetStateAction<{ file: File; preview: string }[]>>;
  selectedFeatures: string[];
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
}

const features = [
  "PG (Paying Guest)",
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

        // File size validation - 5MB limit
        if (file.size > 5 * 1024 * 1024) {
          continue;
        }

        // File type validation
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
          continue;
        }

        // Create preview
        try {
          const preview = await createImagePreview(file);
          newPhotos.push({ file, preview });
        } catch (error) {
          console.error('Error creating preview for file:', file.name, error);
        }
      }

      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
      }

    } catch (error: any) {
      console.error('Error processing photos:', error);
    } finally {
      setIsUploading(false);
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
            reject(new Error('Failed to read file'));
          }
        };
        
        reader.onerror = (error) => {
          reject(new Error('Error reading file'));
        };
        
        reader.onabort = () => {
          reject(new Error('File reading was aborted'));
        };
        
        const timeout = setTimeout(() => {
          reader.abort();
          reject(new Error('File reading timed out'));
        }, 10000);
        
        reader.onloadend = () => {
          clearTimeout(timeout);
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        reject(new Error('Failed to set up file reader'));
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index]?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return updated;
    });
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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold mb-3">Property Details & Photos</h2>
      
      {/* Property Details - Compact Grid */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Bedrooms</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9">
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
              <FormLabel className="text-sm">Bathrooms</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9">
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
      
      <div className="grid grid-cols-2 gap-3">
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Area (sq ft)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 1200" className="h-9" {...field} />
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
              <FormLabel className="text-sm">Monthly Rent (₹)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 25000" className="h-9" {...field} />
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
            <FormLabel className="text-sm">Available From</FormLabel>
            <FormControl>
              <Input type="date" className="h-9" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Features Selection - Compact Layout */}
      <div className="space-y-3">
        <FormLabel className="text-sm">Property Features</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center space-x-2 p-1">
              <Checkbox
                id={feature}
                checked={selectedFeatures.includes(feature)}
                onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                className="h-4 w-4"
              />
              <label htmlFor={feature} className="text-xs font-medium leading-none cursor-pointer">
                {feature}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Photo Upload Section - Compact */}
      <div className="space-y-3">
        <FormLabel className="text-sm">Property Photos</FormLabel>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        {/* Photo Preview Grid - Smaller Cards */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={photo.preview}
                      alt={`Property photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 p-0"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-2 w-2" />
                    </Button>
                    {index === 0 && (
                      <div className="absolute bottom-1 left-1 bg-black text-white text-xs px-1 py-0.5 rounded">
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
                      className="h-full w-full flex flex-col items-center gap-1 p-2"
                    >
                      <Plus className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Add</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Upload button when no photos */}
        {photos.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Button
              type="button"
              onClick={triggerFileInput}
              disabled={isUploading}
              size="sm"
              className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Processing...' : 'Choose Photos'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

