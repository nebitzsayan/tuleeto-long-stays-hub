
import { supabase } from '@/integrations/supabase/client';

export interface ImageKitUploadResponse {
  url: string;
  fileId: string;
  name: string;
  size: number;
}

export const uploadToImageKit = async (
  file: File,
  folder?: string
): Promise<ImageKitUploadResponse | null> => {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    console.log(`Uploading ${file.name} to ImageKit...`);
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('upload-to-imagekit', {
      body: {
        fileName: file.name,
        fileData: base64Data,
        folder: folder || 'property-images'
      }
    });

    if (error) {
      console.error('ImageKit upload error:', error);
      return null;
    }

    console.log('ImageKit upload successful:', data);
    return data;
  } catch (error: any) {
    console.error('Error uploading to ImageKit:', error);
    return null;
  }
};

export const uploadMultipleToImageKit = async (
  files: File[],
  folder?: string,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  let completed = 0;

  console.log(`Starting ImageKit upload of ${files.length} files`);

  for (const file of files) {
    try {
      const result = await uploadToImageKit(file, folder);
      
      if (result?.url) {
        urls.push(result.url);
        console.log(`Successfully uploaded ${file.name} to ImageKit:`, result.url);
      } else {
        console.error(`Failed to upload ${file.name} to ImageKit`);
      }
    } catch (error) {
      console.error(`Error uploading ${file.name} to ImageKit:`, error);
    }

    completed++;
    if (onProgress) {
      const progress = Math.round((completed / files.length) * 100);
      onProgress(progress);
    }
  }

  console.log(`ImageKit upload completed: ${urls.length}/${files.length} successful`);
  return urls;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
