
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a bucket exists without trying to create it
 */
export const checkBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking if bucket ${bucketName} exists...`);
    
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error checking buckets:", bucketsError);
      throw bucketsError;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    console.log(`Bucket ${bucketName} exists: ${bucketExists}`);
    return bucketExists || false;
  } catch (error: any) {
    console.error("Error checking bucket:", error);
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
    // Check if bucket exists first
    const bucketExists = await checkBucketExists(bucketName);
    
    if (!bucketExists) {
      console.error(`Bucket ${bucketName} does not exist`);
      throw new Error(`Storage bucket '${bucketName}' does not exist or you don't have access to it.`);
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
      throw error;
    }
    
    if (!data) {
      console.error("No data returned from upload");
      throw new Error("Upload failed - no data returned");
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
    
    console.log(`Upload successful! URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error("Unexpected upload error:", error);
    throw error;
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
  
  // Check if bucket exists
  const bucketExists = await checkBucketExists(bucketName);
  
  if (!bucketExists) {
    throw new Error(`Storage bucket '${bucketName}' does not exist or you don't have access to it.`);
  }
  
  for (let i = 0; i < files.length; i++) {
    try {
      const file = files[i];
      const fileExt = file.name.split('.').pop() || 'jpg';
      // Ensure unique filenames with timestamp and index
      const fileName = `${pathPrefix}/${Date.now()}-${i}.${fileExt}`;
      
      const url = await uploadFileToStorage(bucketName, fileName, file);
      
      if (url) {
        urls.push(url);
        successCount++;
        
        // Update progress after each successful upload
        if (onProgress) {
          onProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
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
