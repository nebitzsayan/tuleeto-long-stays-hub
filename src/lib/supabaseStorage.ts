
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
      try {
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,  // Make bucket public by default
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (createError) {
          console.error(`Error creating bucket ${bucketName}:`, createError);
          // Try one more time with a delay - sometimes Supabase needs a moment
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { error: retryError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760,
          });
          
          if (retryError) {
            console.error(`Retry failed for bucket ${bucketName}:`, retryError);
            return false;
          }
        }
        
        console.log(`Successfully created bucket ${bucketName} with public access`);
        
        // Add a small delay to ensure bucket creation is registered
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      } catch (error) {
        console.error(`Exception when creating bucket ${bucketName}:`, error);
        return false;
      }
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
    // For avatars bucket, we'll assume it exists (should be created in Supabase console)
    // For other buckets, try to ensure they exist first
    let bucketExists = true;
    if (bucketName !== "avatars") {
      // Only try to create the bucket if it's not the avatars bucket
      bucketExists = await ensureBucketExists(bucketName);
    }
    
    if (!bucketExists) {
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
  
  // For avatars bucket, assume it exists
  let bucketCreated = true;
  if (bucketName !== "avatars") {
    // Only try to create the bucket if it's not the avatars bucket
    bucketCreated = await ensureBucketExists(bucketName);
  }
  
  if (!bucketCreated) {
    // Try one more time with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    const secondAttempt = await ensureBucketExists(bucketName);
    if (!secondAttempt) {
      console.error(`Failed to create bucket ${bucketName} after multiple attempts`);
      return [];
    }
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
  
  console.log(`Uploaded ${successCount}/${totalFiles} files successfully`);
  return urls;
};
