import { useState, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, IndianRupee, Wifi, AirVent, Wind, Utensils, Loader2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormValues } from "./PropertyListingForm";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FeaturesPhotosStepProps {
  form: UseFormReturn<FormValues>;
  photos: { file: File; preview: string }[];
  setPhotos: React.Dispatch<React.SetStateAction<{ file: File; preview: string }[]>>;
  selectedFeatures: string[];
  setSelectedFeatures: React.Dispatch<React.SetStateAction<string[]>>;
}

export const FeaturesPhotosStep = ({ 
  form, 
  photos, 
  setPhotos, 
  selectedFeatures = [], 
  setSelectedFeatures 
}: FeaturesPhotosStepProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAddPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    setUploading(true);
    setUploadError(null);
    
    try {
      console.log(`Processing photo: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
      
      // Validate file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        const errorMessage = "File size exceeds 10MB limit. Please choose a smaller image.";
        setUploadError(errorMessage);
        toast.error(errorMessage);
        setUploading(false);
        fileInput.value = '';
        return;
      }
      
      // Check photo count limit
      if (photos.length >= 5) {
        const errorMessage = "Maximum 5 photos allowed";
        setUploadError(errorMessage);
        toast.warning(errorMessage);
        setUploading(false);
        fileInput.value = '';
        return;
      }
      
      // Validate image type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        const errorMessage = `Invalid file type: ${file.type}. Please upload a JPEG, PNG, GIF, or WEBP image.`;
        setUploadError(errorMessage);
        toast.error(errorMessage);
        setUploading(false);
        fileInput.value = '';
        return;
      }
      
      // Create preview using FileReader
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          const preview = e.target.result.toString();
          setPhotos(prevPhotos => [...prevPhotos, { file, preview }]);
          toast.success(`Photo "${file.name}" added successfully`);
          console.log(`Photo preview generated successfully for ${file.name}`);
          setUploadError(null);
        }
        setUploading(false);
      };
      
      reader.onerror = () => {
        const errorMessage = "Failed to preview image. Please try another file.";
        console.error("FileReader error:", reader.error);
        setUploadError(errorMessage);
        toast.error(errorMessage);
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error adding photo:", error);
      const errorMessage = `Failed to add photo: ${error.message}`;
      setUploadError(errorMessage);
      toast.error(errorMessage);
      setUploading(false);
    } finally {
      fileInput.value = '';
    }
  };
  
  const handleRemovePhoto = (index: number) => {
    try {
      const newPhotos = [...photos];
      console.log(`Removing photo at index ${index}:`, newPhotos[index].file.name);
      
      // Clean up object URL to prevent memory leaks
      if (newPhotos[index].preview.startsWith('blob:')) {
        URL.revokeObjectURL(newPhotos[index].preview);
      }
      
      newPhotos.splice(index, 1);
      setPhotos(newPhotos);
      toast.info("Photo removed");
      setUploadError(null);
    } catch (error: any) {
      console.error("Error removing photo:", error);
      const errorMessage = `Error removing photo: ${error.message}`;
      setUploadError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const availableFeatures = [
    { id: "pet-friendly", label: "Pet friendly", icon: <Wind className="h-4 w-4 mr-2" /> },
    { id: "wifi", label: "Wifi", icon: <Wifi className="h-4 w-4 mr-2" /> },
    { id: "air-conditioning", label: "Air conditioning", icon: <AirVent className="h-4 w-4 mr-2" /> },
    { id: "in-unit-laundry", label: "In-unit laundry", icon: <Utensils className="h-4 w-4 mr-2" /> }
  ];
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Features & Photos</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <FormLabel className="flex items-center">
              Monthly Rent (₹)
              <IndianRupee className="h-4 w-4 ml-1 text-gray-500" />
            </FormLabel>
            <FormControl>
              <Input type="number" placeholder="e.g. 25000" {...field} />
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

      <div className="space-y-2">
        <FormLabel>Amenities</FormLabel>
        <div className="grid grid-cols-2 gap-2">
          {availableFeatures.map(feature => (
            <div key={feature.id} className="flex items-center space-x-2">
              <Checkbox 
                id={feature.id}
                checked={selectedFeatures.includes(feature.label)}
                onCheckedChange={() => handleFeatureToggle(feature.label)}
              />
              <label 
                htmlFor={feature.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
              >
                {feature.icon}
                {feature.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <FormLabel>Property Photos (Required)</FormLabel>
        
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-wrap gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative group">
              <div className="w-24 h-24 overflow-hidden rounded-md border border-gray-300">
                <img 
                  src={photo.preview} 
                  alt={`Property photo ${i+1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-90"
                onClick={() => handleRemovePhoto(i)}
              >
                <X className="h-3 w-3" />
              </Button>
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-1 py-0.5 text-center truncate">
                {(photo.file.size / (1024 * 1024)).toFixed(1)}MB
              </span>
            </div>
          ))}
          {photos.length < 5 && (
            <div className="relative">
              <Button 
                type="button" 
                variant="outline" 
                className="w-24 h-24 flex flex-col items-center justify-center border-dashed border-2 border-gray-300"
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin mb-1" />
                ) : (
                  <Upload className="h-6 w-6 mb-1" />
                )}
                <span className="text-xs">{uploading ? 'Processing...' : 'Add'}</span>
              </Button>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleAddPhoto}
                disabled={photos.length >= 5 || uploading}
              />
            </div>
          )}
        </div>
        <div className="text-xs space-y-1">
          <p className="text-gray-500">Upload up to 5 photos (Max 10MB each)</p>
          <p className="text-amber-600 font-medium">At least one photo is required to list your property.</p>
          {uploadError && (
            <p className="text-red-600 font-medium">
              Upload issue detected. Please resolve before continuing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
