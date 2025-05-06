import { supabase } from "@/integrations/supabase/client";

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
        return false;
      }
      
      console.log(`Successfully created bucket ${bucketName} with public access`);
      
      // Add a small delay to ensure bucket creation is registered
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    }
    
    console.log(`Bucket ${bucketName} already exists`);
    return true;
  } catch (error: any) {
    console.error("Error in storage setup:", error);
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
    // Create bucket if needed
    const bucketCreated = await ensureBucketExists(bucketName);
    if (!bucketCreated) {
      console.error(`Failed to ensure bucket ${bucketName} exists`);
      return null;
    }
    
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
      return null;
    }
    
    if (!data) {
      console.error("No data returned from upload");
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
  
  // No toasts, just return the URLs
  return urls;
};
