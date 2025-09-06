
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
  details?: string;
}

export interface UploadProgress {
  total: number;
  completed: number;
  success: number;
  error: number;
  currentFile?: string;
  isUploading: boolean;
  uploadSpeed?: string;
  timeRemaining?: string;
  errorDetails?: string[];
}

// Detect if user is on mobile device
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase()) || 
         window.innerWidth <= 768;
};

// Optimized compression for faster uploads
const compressImageForMobile = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // More aggressive compression settings for speed
      const maxWidth = isMobileDevice() ? 1600 : 2048; // Reduced for faster processing
      const maxHeight = isMobileDevice() ? 900 : 1152;
      
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      // Round dimensions to even numbers for better compression
      canvas.width = Math.floor(width / 2) * 2;
      canvas.height = Math.floor(height / 2) * 2;
      
      // Use high quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        isMobileDevice() ? 0.75 : 0.85 // More aggressive compression for mobile
      );
    };
    
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

export const uploadToImageKit = async (
  file: File,
  folder?: string
): Promise<ImageKitUploadResponse | null> => {
  try {
    // Validate file before upload
    if (!file || file.size === 0) {
      console.error('Invalid file provided to uploadToImageKit');
      throw new Error('Invalid file - file is empty or undefined');
    }

    // Optimized compression for faster uploads
    let processedFile = file;
    if (isMobileDevice() || file.size > 1.5 * 1024 * 1024) { // Lower threshold for faster processing
      console.log(`Compressing ${file.name} for faster upload...`);
      processedFile = await compressImageForMobile(file);
      console.log(`Compressed from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
    }

    // Convert file to base64
    const base64Data = await fileToBase64(processedFile);
    
    console.log(`Uploading ${processedFile.name} to ImageKit (${(processedFile.size / 1024 / 1024).toFixed(2)}MB)...`);
    
    // Call the edge function with proper error handling
    const { data, error } = await supabase.functions.invoke('upload-to-imagekit', {
      body: {
        fileName: processedFile.name,
        fileData: base64Data,
        folder: folder || 'property-images'
      }
    });

    if (error) {
      console.error(`ImageKit upload error for ${processedFile.name}:`, error);
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }

    if (!data || !data.url) {
      console.error(`ImageKit upload returned no data for ${processedFile.name}`);
      throw new Error('Upload completed but no URL returned');
    }

    console.log(`ImageKit upload successful for ${processedFile.name}:`, data);
    return data;
  } catch (error: any) {
    console.error(`Error uploading ${file.name} to ImageKit:`, error);
    throw error; // Re-throw to allow proper error handling upstream
  }
};

export const uploadMultipleToImageKit = async (
  files: File[],
  folder?: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string[]> => {
  const urls: string[] = [];
  const results: UploadResult[] = [];
  const errorDetails: string[] = [];
  
  // Adjust concurrency based on device type
  const CONCURRENT_UPLOADS = isMobileDevice() ? 1 : 2; // Single upload for mobile
  const startTime = Date.now();
  
  console.log(`Starting ImageKit upload of ${files.length} files with ${CONCURRENT_UPLOADS} concurrent uploads (Mobile: ${isMobileDevice()})`);

  // Initialize progress
  const updateProgress = (current: number, currentFile?: string) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const uploadSpeed = current > 0 ? `${(current / elapsed).toFixed(1)} files/sec` : undefined;
    const remaining = files.length - current;
    const timeRemaining = current > 0 && remaining > 0 ? 
      `${Math.round((remaining * elapsed) / current)}s remaining` : undefined;

    onProgress?.({
      total: files.length,
      completed: current,
      success: results.filter(r => r.success).length,
      error: results.filter(r => !r.success).length,
      currentFile,
      isUploading: current < files.length,
      uploadSpeed,
      timeRemaining,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    });
  };

  // Process files in batches
  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);
    
    // Upload batch with proper error handling
    const batchPromises = batch.map(async (file, batchIndex) => {
      const globalIndex = i + batchIndex;
      const maxRetries = isMobileDevice() ? 2 : 3; // Fewer retries on mobile
      let attempt = 0;
      
      // Notify progress callback about current file
      updateProgress(globalIndex, file.name);
      
      while (attempt <= maxRetries) {
        try {
          console.log(`Uploading ${file.name} (${globalIndex + 1}/${files.length}) - attempt ${attempt + 1}/${maxRetries + 1}`);
          
          // Create timeout promise with longer timeout for mobile
          const timeoutDuration = isMobileDevice() ? 60000 : 45000; // 60s for mobile, 45s for desktop
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Upload timeout after ${timeoutDuration / 1000} seconds`)), timeoutDuration)
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
            // Exponential backoff with longer delays for mobile
            const baseDelay = isMobileDevice() ? 2000 : 1000;
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 8000);
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // Add detailed error information
            const errorDetail = `${file.name}: ${error.message || 'Unknown error'}`;
            errorDetails.push(errorDetail);
          }
        }
      }
      
      // All attempts failed
      console.error(`Failed to upload ${file.name} after ${maxRetries + 1} attempts`);
      return {
        success: false,
        fileName: file.name,
        error: 'Upload failed after multiple attempts',
        details: 'Network or server error - please check your connection and try again'
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
    const completedFiles = Math.min(i + batch.length, files.length);
    updateProgress(completedFiles);

    // Small delay between batches to prevent overwhelming the service (longer for mobile)
    if (i + CONCURRENT_UPLOADS < files.length) {
      const batchDelay = isMobileDevice() ? 1000 : 500;
      await new Promise(resolve => setTimeout(resolve, batchDelay));
    }
  }

  // Final progress update
  updateProgress(files.length);

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
      
      // Add timeout for large files (longer for mobile)
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new Error('File reading timeout after 30 seconds'));
      }, 30000);
      
      reader.onloadend = () => clearTimeout(timeout);
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Failed to set up file reader: ${error}`));
    }
  });
};
