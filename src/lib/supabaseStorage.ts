
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Creates a bucket if it doesn't exist with public access
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking if bucket ${bucketName} exists...`);
    
    // First check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError);
      // Don't throw error, just log and continue
      toast.error("Storage service unavailable. Trying to reconnect...");
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} does not exist, creating it with public access`);
      
      // Create the bucket with public access
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,  // Make bucket public by default
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        toast.error("Could not create storage area. Please try again.");
        return false;
      }
      
      console.log(`Successfully created bucket ${bucketName} with public access`);
      return true;
    }
    
    console.log(`Bucket ${bucketName} already exists`);
    return true;
  } catch (error: any) {
    console.error("Error in storage setup:", error);
    toast.error("Storage setup failed. Please refresh the page and try again.");
    return false;
  }
};

/**
 * Simple direct upload of a file to storage with better error handling
 */
export const uploadFileToStorage = async (
  bucketName: string,
  filePath: string,
  file: File
): Promise<string | null> => {
  try {
    // Create bucket if needed, but don't block on failure
    await ensureBucketExists(bucketName);
    
    console.log(`Uploading file ${file.name} (${file.size} bytes) to ${bucketName}/${filePath}`);
    
    // Direct upload attempt
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Upload error:`, error);
      
      // Simplified error messaging
      if (error.message.includes('permission') || error.message.includes('401')) {
        toast.error("Upload permission denied. Please log in again.");
      } else if (error.message.includes('size')) {
        toast.error("File is too large (max 10MB).");
      } else if (error.message.includes('bucket') || error.message.includes('not found')) {
        toast.error("Storage not ready. Try again in a moment.");
        // Try to fix the bucket once more
        await ensureBucketExists(bucketName);
      } else {
        toast.error("Upload failed. Please try a smaller image.");
      }
      
      return null;
    }
    
    if (!data) {
      console.error("No data returned from upload");
      toast.error("Upload failed. Please try again.");
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`Upload successful! URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Unexpected upload error:", error);
    toast.error("Upload failed. Please try again with a smaller image.");
    return null;
  }
};

/**
 * Simplified multiple files upload with better error handling
 */
export const uploadMultipleFiles = async (
  bucketName: string,
  files: File[],
  pathPrefix: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  if (files.length === 0) {
    return [];
  }
  
  const urls: string[] = [];
  const totalFiles = files.length;
  let successCount = 0;
  
  // Simple bucket check - one time only
  const bucketCreated = await ensureBucketExists(bucketName);
  if (!bucketCreated) {
    // Try one more time
    await ensureBucketExists(bucketName);
  }
  
  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const fileExt = file.name.split('.').pop() || 'jpg';
      // Simplified path with user ID and timestamp
      const fileName = `${pathPrefix}/${Date.now()}-${i}.${fileExt}`;
      
      const url = await uploadFileToStorage(bucketName, fileName, file);
      
      if (url) {
        urls.push(url);
        successCount++;
      }
      
      // Update progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      // Continue with other files even if one fails
      continue;
    }
  }
  
  // Give feedback on completion
  if (successCount === 0 && files.length > 0) {
    toast.error(`Failed to upload any photos. Please try smaller images.`);
  } else if (successCount < files.length) {
    toast.warning(`Uploaded ${successCount} out of ${files.length} photos.`);
  } else {
    toast.success(`Successfully uploaded ${successCount} photos!`);
  }
  
  return urls;
};
