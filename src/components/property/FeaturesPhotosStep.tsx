import { useState, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { FormValues } from "./PropertyListingForm";
import { PhotoUploadStatus, PhotoStatus } from "./PhotoUploadStatus";
import { toast } from "sonner";

interface FeaturesPhotosStepProps {
  form: UseFormReturn<FormValues>;
  photos: PhotoStatus[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoStatus[]>>;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // File size validation - 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return { isValid: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB allowed.` };
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
      return { isValid: false, error: `Invalid file type. Supported: ${allowedExtensions.join(', ')}` };
    }

    return { isValid: true };
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setUploadProgress(0);
    
    try {
      const newPhotos: PhotoStatus[] = [];
      const rejectedFiles: string[] = [];
      const maxPhotos = 10;
      const availableSlots = maxPhotos - photos.length;
      
      console.log(`Processing ${files.length} files, ${availableSlots} slots available`);
      
      for (let i = 0; i < Math.min(files.length, availableSlots); i++) {
        const file = files[i];
        
        console.log(`Processing file ${i + 1}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          console.warn(`File validation failed for ${file.name}:`, validation.error);
          rejectedFiles.push(`${file.name}: ${validation.error}`);
          continue;
        }

        // Create preview
        try {
          const preview = await createImagePreview(file);
          newPhotos.push({
            file,
            preview,
            status: 'pending'
          });
          console.log(`Created preview for ${file.name}`);
        } catch (error) {
          console.error('Error creating preview for file:', file.name, error);
          rejectedFiles.push(`${file.name}: Failed to create preview - ${error}`);
        }
      }

      if (newPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newPhotos]);
        toast.success(`${newPhotos.length} photo${newPhotos.length > 1 ? 's' : ''} added successfully`);
        console.log(`Added ${newPhotos.length} photos to upload queue`);
      }

      if (rejectedFiles.length > 0) {
        console.warn('Rejected files:', rejectedFiles);
        toast.error(`${rejectedFiles.length} file${rejectedFiles.length > 1 ? 's' : ''} rejected`, {
          description: "Check file size (max 5MB) and format (JPG, PNG, WebP, GIF, HEIC)"
        });
      }

      if (files.length > availableSlots) {
        toast.warning(`Only ${availableSlots} photo${availableSlots !== 1 ? 's' : ''} could be added`, {
          description: `Maximum ${maxPhotos} photos allowed per property`
        });
      }

    } catch (error: any) {
      console.error('Error processing photos:', error);
      toast.error('Error processing photos', {
        description: error.message || 'Please try again with different images'
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        if (!file) {
          reject(new Error('No file provided'));
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result as string);
          } else {
            reject(new Error('Failed to read file - no result'));
          }
        };
        
        reader.onerror = () => reject(new Error(`Error reading file: ${reader.error?.message || 'Unknown error'}`));
        reader.onabort = () => reject(new Error('File reading was aborted'));
        
        // Longer timeout for larger files
        const timeout = setTimeout(() => {
          reader.abort();
          reject(new Error('File reading timed out after 15 seconds'));
        }, 15000);
        
        reader.onloadend = () => clearTimeout(timeout);
        reader.readAsDataURL(file);
      } catch (error) {
        reject(new Error(`Failed to set up file reader: ${error}`));
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const photoToRemove = prev[index];
      const updated = prev.filter((_, i) => i !== index);
      
      // Clean up blob URL if it's a local preview
      if (photoToRemove?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(photoToRemove.preview);
      }
      
      console.log(`Removed photo at index ${index}`);
      return updated;
    });
    
    toast.info('Photo removed');
  };

  const retryPhoto = (index: number) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, status: 'pending' as const, error: undefined } : photo
    ));
    
    console.log(`Retrying upload for photo at index ${index}`);
    toast.info('Photo queued for retry');
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

  // Count photo statuses
  const successCount = photos.filter(p => p.status === 'success').length;
  const errorCount = photos.filter(p => p.status === 'error').length;
  const uploadingCount = photos.filter(p => p.status === 'uploading').length;
  const pendingCount = photos.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4">Property Details & Photos</h2>
      
      {/* Property Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="bedrooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Bedrooms</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select bedrooms" />
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
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select bathrooms" />
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="area"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Area (sq ft)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 1200" className="h-10" {...field} />
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
                <Input placeholder="e.g. 25000" className="h-10" {...field} />
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
              <Input type="date" className="h-10" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Features Selection */}
      <div className="space-y-4">
        <FormLabel className="text-sm font-medium">Property Features</FormLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
              <Checkbox
                id={feature}
                checked={selectedFeatures.includes(feature)}
                onCheckedChange={(checked) => handleFeatureChange(feature, checked as boolean)}
                className="h-4 w-4"
              />
              <label htmlFor={feature} className="text-sm font-medium leading-5 cursor-pointer flex-1">
                {feature}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Photo Upload Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <FormLabel className="text-sm font-medium">Property Photos</FormLabel>
          {photos.length > 0 && (
            <div className="text-xs text-gray-500 flex items-center gap-3">
              {successCount > 0 && <span className="text-green-600 font-medium">{successCount} uploaded</span>}
              {pendingCount > 0 && <span className="text-yellow-600 font-medium">{pendingCount} pending</span>}
              {uploadingCount > 0 && <span className="text-blue-600 font-medium">{uploadingCount} uploading</span>}
              {errorCount > 0 && <span className="text-red-600 font-medium">{errorCount} failed</span>}
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />
        
        {/* Photo Preview Grid with Status */}
        {photos.length > 0 && (
          <div className="space-y-4">
            <PhotoUploadStatus
              photos={photos}
              onRemove={removePhoto}
              onRetry={retryPhoto}
            />
            
            {photos.length < 10 && (
              <Card className="border-dashed border-2 border-gray-300 hover:border-tuleeto-orange transition-colors">
                <CardContent className="p-6 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={triggerFileInput}
                    disabled={isProcessing}
                    className="flex items-center gap-2 text-tuleeto-orange hover:text-tuleeto-orange-dark"
                  >
                    <Plus className="h-4 w-4" />
                    Add More Photos ({photos.length}/10)
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Click to add more property photos
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {/* Upload button when no photos */}
        {photos.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-tuleeto-orange transition-colors">
            <div className="space-y-4">
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <Button
                  type="button"
                  onClick={triggerFileInput}
                  disabled={isProcessing}
                  className="bg-tuleeto-orange hover:bg-tuleeto-orange/90 text-white"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Property Photos
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-3">
                  Upload up to 10 high-quality photos (Max 5MB each)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported formats: JPG, PNG, WebP, GIF, HEIC
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Enhanced Error Summary */}
        {errorCount > 0 && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                Upload Issues ({errorCount} photo{errorCount > 1 ? 's' : ''})
              </h4>
              <p className="text-sm text-red-700 mb-2">
                Some photos failed to upload. You can retry individual photos or remove them.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  // Retry all failed photos
                  setPhotos(prev => prev.map(photo => 
                    photo.status === 'error' ? { ...photo, status: 'pending' as const, error: undefined } : photo
                  ));
                  toast.info('All failed photos queued for retry');
                }}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Retry All Failed
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
