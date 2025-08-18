
import { supabase } from '@/integrations/supabase/client';

export interface ImageKitUploadResponse {
  url: string;
  fileId: string;
  name: string;
  size: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  fileName: string;
  error?: string;
}

export const uploadToImageKit = async (
  file: File,
  folder?: string
): Promise<ImageKitUploadResponse | null> => {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    console.log(`Uploading ${file.name} to ImageKit (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
    
    // Call the edge function with timeout
    const { data, error } = await supabase.functions.invoke('upload-to-imagekit', {
      body: {
        fileName: file.name,
        fileData: base64Data,
        folder: folder || 'property-images'
      }
    });

    if (error) {
      console.error(`ImageKit upload error for ${file.name}:`, error);
      return null;
    }

    console.log(`ImageKit upload successful for ${file.name}:`, data);
    return data;
  } catch (error: any) {
    console.error(`Error uploading ${file.name} to ImageKit:`, error);
    return null;
  }
};

export const uploadMultipleToImageKit = async (
  files: File[],
  folder?: string,
  onProgress?: (progress: number, results: UploadResult[]) => void
): Promise<string[]> => {
  const urls: string[] = [];
  const results: UploadResult[] = [];
  const CONCURRENT_UPLOADS = 3; // Limit concurrent uploads
  
  console.log(`Starting ImageKit upload of ${files.length} files with ${CONCURRENT_UPLOADS} concurrent uploads`);

  // Process files in batches
  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);
    
    // Upload batch concurrently with timeout and retry
    const batchPromises = batch.map(async (file) => {
      const maxRetries = 2;
      let attempt = 0;
      
      while (attempt <= maxRetries) {
        try {
          console.log(`Uploading ${file.name} (attempt ${attempt + 1}/${maxRetries + 1})`);
          
          // Add timeout to upload
          const uploadPromise = uploadToImageKit(file, folder);
          const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 30000)
          );
          
          const result = await Promise.race([uploadPromise, timeoutPromise]);
          
          if (result?.url) {
            console.log(`Successfully uploaded ${file.name}: ${result.url}`);
            return {
              success: true,
              url: result.url,
              fileName: file.name
            } as UploadResult;
          } else {
            throw new Error('Upload failed - no URL returned');
          }
        } catch (error: any) {
          console.error(`Upload attempt ${attempt + 1} failed for ${file.name}:`, error.message);
          attempt++;
          
          if (attempt <= maxRetries) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }
      
      // All attempts failed
      console.error(`Failed to upload ${file.name} after ${maxRetries + 1} attempts`);
      return {
        success: false,
        fileName: file.name,
        error: 'Upload failed after multiple attempts'
      } as UploadResult;
    });

    // Wait for current batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Extract successful URLs
    batchResults.forEach(result => {
      if (result.success && result.url) {
        urls.push(result.url);
      }
    });
    
    // Update progress
    if (onProgress) {
      const progress = Math.round(((i + batch.length) / files.length) * 100);
      onProgress(Math.min(progress, 100), results);
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`ImageKit upload completed: ${successCount}/${files.length} successful, ${failureCount} failed`);
  
  if (failureCount > 0) {
    const failedFiles = results.filter(r => !r.success).map(r => r.fileName);
    console.warn('Failed uploads:', failedFiles);
  }
  
  return urls;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      
      reader.onerror = () => reject(new Error('File reading error'));
      reader.onabort = () => reject(new Error('File reading aborted'));
      
      // Add timeout for large files
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout'));
      }, 15000);
      
      reader.onloadend = () => clearTimeout(timeout);
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error('Failed to set up file reader'));
    }
  });
};
