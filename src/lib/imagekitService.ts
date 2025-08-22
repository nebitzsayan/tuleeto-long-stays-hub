
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
    // Validate file before upload
    if (!file || file.size === 0) {
      console.error('Invalid file provided to uploadToImageKit');
      return null;
    }

    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    console.log(`Uploading ${file.name} to ImageKit (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
    
    // Call the edge function with proper error handling
    const { data, error } = await supabase.functions.invoke('upload-to-imagekit', {
      body: {
        fileName: file.name,
        fileData: base64Data,
        folder: folder || 'property-images'
      }
    });

    if (error) {
      console.error(`ImageKit upload error for ${file.name}:`, error);
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }

    if (!data || !data.url) {
      console.error(`ImageKit upload returned no data for ${file.name}`);
      throw new Error('Upload completed but no URL returned');
    }

    console.log(`ImageKit upload successful for ${file.name}:`, data);
    return data;
  } catch (error: any) {
    console.error(`Error uploading ${file.name} to ImageKit:`, error);
    throw error; // Re-throw to allow proper error handling upstream
  }
};

export const uploadMultipleToImageKit = async (
  files: File[],
  folder?: string,
  onProgress?: (progress: number, results: UploadResult[]) => void
): Promise<string[]> => {
  const urls: string[] = [];
  const results: UploadResult[] = [];
  const CONCURRENT_UPLOADS = 2; // Reduced for better reliability
  
  console.log(`Starting ImageKit upload of ${files.length} files with ${CONCURRENT_UPLOADS} concurrent uploads`);

  // Process files in batches
  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);
    
    // Upload batch with proper error handling
    const batchPromises = batch.map(async (file, batchIndex) => {
      const globalIndex = i + batchIndex;
      const maxRetries = 3; // Increased retries
      let attempt = 0;
      
      while (attempt <= maxRetries) {
        try {
          console.log(`Uploading ${file.name} (${globalIndex + 1}/${files.length}) - attempt ${attempt + 1}/${maxRetries + 1}`);
          
          // Create timeout promise
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout after 45 seconds')), 45000)
          );
          
          // Race upload against timeout
          const result = await Promise.race([
            uploadToImageKit(file, folder),
            timeoutPromise
          ]);
          
          if (result?.url) {
            console.log(`Successfully uploaded ${file.name}: ${result.url}`);
            return {
              success: true,
              url: result.url,
              fileName: file.name
            } as UploadResult;
          } else {
            throw new Error('Upload returned no URL');
          }
        } catch (error: any) {
          console.error(`Upload attempt ${attempt + 1} failed for ${file.name}:`, error.message);
          attempt++;
          
          if (attempt <= maxRetries) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
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
    
    // Update progress after each batch
    if (onProgress) {
      const completedFiles = Math.min(i + batch.length, files.length);
      const progress = Math.round((completedFiles / files.length) * 100);
      onProgress(progress, [...results]);
    }

    // Small delay between batches to prevent overwhelming the service
    if (i + CONCURRENT_UPLOADS < files.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
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
      if (!file || file.size === 0) {
        reject(new Error('Invalid file provided'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        if (result && result.includes(',')) {
          resolve(result);
        } else {
          reject(new Error('Failed to convert file to base64 - invalid result'));
        }
      };
      
      reader.onerror = () => reject(new Error(`File reading error: ${reader.error?.message || 'Unknown error'}`));
      reader.onabort = () => reject(new Error('File reading was aborted'));
      
      // Add timeout for large files
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout after 20 seconds'));
      }, 20000);
      
      reader.onloadend = () => clearTimeout(timeout);
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Failed to set up file reader: ${error}`));
    }
  });
};
