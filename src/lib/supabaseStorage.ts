
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Checks if a bucket exists and creates it if it doesn't
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // First check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError);
      throw new Error(`Storage access error: ${bucketsError.message}`);
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Bucket ${bucketName} does not exist, attempting to create it`);
      // Try to create the bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      }
      
      console.log(`Successfully created bucket ${bucketName}`);
      
      // Set public bucket policy
      const { error: policyError } = await supabase.storage.from(bucketName).createSignedUrl('test.txt', 60);
      if (policyError && !policyError.message.includes("The resource was not found")) {
        console.error("Error setting bucket policy:", policyError);
        throw new Error(`Failed to configure bucket permissions: ${policyError.message}`);
      }
      
      return true;
    }
    
    return true;
  } catch (error: any) {
    console.error("Error checking/creating bucket:", error);
    toast.error(`Storage setup issue: ${error.message}`);
    return false;
  }
};

/**
 * Uploads a file to Supabase storage with detailed error reporting
 */
export const uploadFileToStorage = async (
  bucketName: string,
  filePath: string,
  file: File
): Promise<string | null> => {
  try {
    // First make sure the bucket exists
    const bucketReady = await ensureBucketExists(bucketName);
    
    if (!bucketReady) {
      toast.error(`Storage setup issue: The ${bucketName} storage bucket is not configured. Please try again later.`);
      return null;
    }
    
    console.log(`Uploading file ${file.name} (${file.size} bytes) to ${bucketName}/${filePath}`);
    
    // Attempt to upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Upload error for ${filePath}:`, error);
      
      // Provide more specific error messages
      if (error.message.includes('permission')) {
        toast.error("Permission denied. You don't have access to upload files.");
      } else if (error.message.includes('size')) {
        toast.error("File is too large. Maximum size is 10MB.");
      } else if (error.message.includes('bucket') || error.message.includes('not found')) {
        // Try to recreate the bucket once more as a last resort
        const recreated = await ensureBucketExists(bucketName);
        if (recreated) {
          toast.info("Storage system reconfigured. Please try uploading again.");
        } else {
          toast.error("Storage system unavailable. Please try again later.");
        }
        return null;
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }
      
      return null;
    }
    
    if (data) {
      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      console.log(`Successfully uploaded to ${filePath}, public URL:`, urlData.publicUrl);
      return urlData.publicUrl;
    }
    
    return null;
  } catch (error: any) {
    console.error("Unexpected error during file upload:", error);
    toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
    return null;
  }
};

/**
 * Uploads multiple files with progress tracking
 */
export const uploadMultipleFiles = async (
  bucketName: string,
  files: File[],
  pathPrefix: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  const totalFiles = files.length;
  
  // Verify bucket existence before attempting uploads
  const bucketReady = await ensureBucketExists(bucketName);
  if (!bucketReady) {
    toast.error(`Cannot upload files: Storage system not available`);
    return [];
  }
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileExt = file.name.split('.').pop();
    const fileName = `${pathPrefix}/${Date.now()}-${i}.${fileExt}`;
    
    const url = await uploadFileToStorage(bucketName, fileName, file);
    
    if (url) {
      urls.push(url);
    }
    
    // Update progress
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalFiles) * 100));
    }
  }
  
  return urls;
};
