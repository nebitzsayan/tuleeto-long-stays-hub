
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, IndianRupee, Wifi, AirVent } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormValues } from "./PropertyListingForm";

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
  const handleAddPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    if (!fileInput.files || fileInput.files.length === 0) return;
    
    const file = fileInput.files[0];
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }
    
    if (photos.length >= 5) {
      alert("Maximum 5 photos allowed");
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

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const availableFeatures = [
    { id: "pet-friendly", label: "Pet friendly" },
    { id: "wifi", label: "Wifi", icon: <Wifi className="h-4 w-4 mr-2" /> },
    { id: "air-conditioning", label: "Air conditioning", icon: <AirVent className="h-4 w-4 mr-2" /> },
    { id: "in-unit-laundry", label: "In-unit laundry" }
  ];
  
  return (
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
  );
};
