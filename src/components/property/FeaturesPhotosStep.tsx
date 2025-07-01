
import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Camera, Upload } from "lucide-react";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

        // Enhanced file validation for mobile
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }

        // More comprehensive file type checking for mobile
        const allowedTypes = [
          'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
          'image/heic', 'image/heif', // iOS formats
          'application/octet-stream' // Some mobile browsers send this
        ];
        
        const fileName = file.name.toLowerCase();
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
        const fileExtension = fileName.split('.').pop() || '';
        
        const hasValidType = allowedTypes.includes(file.type);
        const hasValidExtension = allowedExtensions.includes(fileExtension);
        
        if (!hasValidType && !hasValidExtension) {
          toast.error(`File "${file.name}" has unsupported format. Please use JPEG, PNG, WebP, GIF, or HEIC images.`);
          continue;
        }

        // Create preview with error handling
        try {
          const preview = await createImagePreview(file);
          newPhotos.push({ file, preview });
        } catch (error) {
          console.error('Error creating preview for file:', file.name, error);
          toast.error(`Could not process "${file.name}". Please try again.`);
        }
      }

      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
        toast.success(`Added ${newPhotos.length} photo(s)`);
      }

    } catch (error: any) {
      console.error('Error processing photos:', error);
      toast.error('Failed to process photos. Please try again.');
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
      // Use FileReader for broader compatibility
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = prev.filter((_, i) => i !== index);
      // Revoke the object URL to free memory
      URL.revokeObjectURL(prev[index].preview);
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
    fileInputRef.current?.click();
  };

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
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
      
      {/* Photo Upload Section */}
      <div className="space-y-4">
        <FormLabel>Property Photos (Required)</FormLabel>
        <p className="text-sm text-gray-600">
          Upload up to 10 photos of your property. The first photo will be used as the main image.
        </p>
        
        {/* Hidden file inputs with improved mobile support */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        {/* Upload buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={triggerCameraInput}
            disabled={isUploading || photos.length >= 10}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Take Photo
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            disabled={isUploading || photos.length >= 10}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Choose from Gallery
          </Button>
        </div>
        
        {isUploading && (
          <p className="text-sm text-gray-600">Processing photos...</p>
        )}
        
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
                        console.error('Image preview error:', e);
                        // Fallback to a placeholder or remove the photo
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
        
        {photos.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <Button
                  type="button"
                  onClick={triggerCameraInput}
                  disabled={isUploading}
                  className="bg-tuleeto-orange hover:bg-tuleeto-orange-dark text-white"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={triggerFileInput}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Add photos to showcase your property
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
