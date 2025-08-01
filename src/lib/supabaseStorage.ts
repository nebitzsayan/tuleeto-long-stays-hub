import { supabase } from "@/integrations/supabase/client";
import { validateImageFile, sanitizeInput, logSecurityEvent } from "@/lib/security";

export async function uploadImage(imageFile: File, userId: string): Promise<string | null> {
  try {
    console.log(`Starting upload for user ${userId}:`, {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });

    // Validate file
    const validation = await validateImageFile(imageFile);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const timestamp = new Date().getTime();
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const sanitizedExtension = sanitizeInput(fileExtension);
    const imageName = `property_image_${timestamp}.${sanitizedExtension}`;
    const imagePath = `${userId}/${imageName}`;

    console.log(`Uploading to path: ${imagePath}`);

    const { data, error } = await supabase.storage
      .from('property_images')
      .upload(imagePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Supabase upload error:", error);
      await logSecurityEvent('image_upload_failed', { userId, error: error.message });
      
      if (error.message?.includes('Bucket not found')) {
        throw new Error("Storage system not fully configured. Photo uploads will not work until this is fixed.");
      } else if (error.message?.includes('Unauthorized')) {
        throw new Error("You need to be logged in to upload photos.");
      } else if (error.message?.includes('Invalid file type')) {
        throw new Error("This file type is not supported. Please use JPEG, PNG, or WebP images.");
      } else if (error.message?.includes('File size')) {
        throw new Error("File size too large. Please use images smaller than 10MB.");
      }
      
      throw new Error(`Upload failed: ${error.message}`);
    }

    if (!data?.path) {
      console.error("Upload succeeded but no path returned");
      throw new Error("Upload completed but file path is missing. Please try again.");
    }

    const { data: { publicUrl } } = supabase.storage
      .from('property_images')
      .getPublicUrl(imagePath);

    await logSecurityEvent('image_uploaded', { userId, imagePath });
    console.log(`Upload successful. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("Unexpected error uploading image:", error.message);
    await logSecurityEvent('image_upload_error', { userId, error: error.message });
    
    if (error.message?.startsWith('Upload failed:') || 
        error.message?.startsWith('Storage system') ||
        error.message?.startsWith('You need to be logged in') ||
        error.message?.startsWith('This file type') ||
        error.message?.startsWith('File size')) {
      throw error;
    }
    
    throw new Error("Storage system is currently unavailable. Photos may not upload correctly.");
  }
}

export async function uploadAvatar(avatarFile: File, userId: string): Promise<string | null> {
  try {
    console.log(`Starting avatar upload for user ${userId}:`, {
      fileName: avatarFile.name,
      fileSize: avatarFile.size,
      fileType: avatarFile.type
    });

    // Validate file
    const validation = await validateImageFile(avatarFile);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const fileExtension = avatarFile.name.split('.').pop() || 'jpg';
    const sanitizedExtension = sanitizeInput(fileExtension);
    const fileName = `${userId}/avatar_${userId}_${Date.now()}.${sanitizedExtension}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error("Error uploading avatar:", error);
      await logSecurityEvent('avatar_upload_failed', { userId, error: error.message });
      throw new Error(`Avatar upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      console.warn("Avatar uploaded but profile update failed");
    }

    await logSecurityEvent('avatar_uploaded', { userId });
    console.log(`Avatar upload successful. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("Unexpected error uploading avatar:", error.message);
    await logSecurityEvent('avatar_upload_error', { userId, error: error.message });
    throw error;
  }
}

export async function uploadFileToStorage(
  bucketName: string, 
  filePath: string, 
  file: File
): Promise<string | null> {
  try {
    console.log(`Uploading file to bucket ${bucketName}:`, {
      filePath,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) {
      console.error(`Bucket ${bucketName} does not exist`);
      throw new Error(`Storage bucket ${bucketName} not found. Please contact support.`);
    }

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading file:", error);
      throw new Error(`File upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log(`File upload successful. Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    console.error("Unexpected error uploading file:", error.message);
    throw error;
  }
}

export async function uploadMultipleFiles(
  files: File[],
  pathPrefix: string = 'property_images',
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  try {
    console.log(`Starting batch upload of ${files.length} files to ImageKit`);
    
    // Set initial progress
    onProgress?.(0);
    
    // Upload each file with enhanced mobile support and improved error handling
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      
      console.log(`Uploading file ${i + 1}/${files.length}:`, {
        fileName: file.name,
        size: file.size,
        type: file.type
      });
      
      // File size validation - reduced to 5MB for better mobile compatibility
      if (file.size > 5 * 1024 * 1024) {
        console.error(`File ${file.name} is too large (max 5MB)`);
        throw new Error(`File "${file.name}" exceeds the 5MB size limit`);
      }

      // Enhanced file type validation for better mobile compatibility
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
        'image/heic', 'image/heif', 'application/octet-stream'
      ];
      
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];
      
      const hasValidType = allowedTypes.includes(file.type);
      const hasValidExtension = allowedExtensions.includes(fileExtension);
      
      if (!hasValidType && !hasValidExtension) {
        console.error(`File ${file.name} has unsupported type: ${file.type} with extension: ${fileExtension}`);
        throw new Error(`File "${file.name}" has unsupported format. Please use JPEG, PNG, WebP, or GIF images.`);
      }
      
      // Upload with enhanced retry logic and better error handling
      let uploadAttempts = 0;
      const maxAttempts = 5; // Increased retry attempts
      let uploadSuccess = false;
      let lastError: any = null;
      
      while (uploadAttempts < maxAttempts && !uploadSuccess) {
        try {
          uploadAttempts++;
          console.log(`Upload attempt ${uploadAttempts}/${maxAttempts} for file ${i + 1}`);
          
          // Convert file to base64 for ImageKit upload
          const fileDataBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          // Generate unique filename
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileName = `${timestamp}_${randomString}.${fileExtension}`;
          
          // Upload to ImageKit via edge function
          const { data, error } = await supabase.functions.invoke('upload-to-imagekit', {
            body: {
              fileName,
              fileData: fileDataBase64,
              folder: pathPrefix
            }
          });
          
          if (error) {
            lastError = error;
            console.error(`Upload attempt ${uploadAttempts} failed for file ${i+1}:`, error);
            
            // If it's the last attempt, throw the error
            if (uploadAttempts === maxAttempts) {
              throw new Error(`Failed to upload "${file.name}" after ${maxAttempts} attempts: ${error.message}`);
            }
            
            // Progressive delay for retries
            const delay = Math.min(uploadAttempts * 2000, 10000); // Max 10 second delay
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          if (!data?.url) {
            lastError = new Error("Upload succeeded but no URL returned");
            console.error(`Upload attempt ${uploadAttempts} - no URL returned for file ${i+1}`);
            if (uploadAttempts === maxAttempts) {
              throw new Error(`Upload completed but file URL is missing for "${file.name}". Please try again.`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          uploadedUrls.push(data.url);
          uploadSuccess = true;
          console.log(`File ${i + 1}/${files.length} uploaded successfully on attempt ${uploadAttempts}:`, data.url);
          
        } catch (attemptError: any) {
          lastError = attemptError;
          console.error(`Upload attempt ${uploadAttempts} failed:`, attemptError);
          
          if (uploadAttempts === maxAttempts) {
            throw new Error(`Failed to upload "${file.name}" after ${maxAttempts} attempts: ${attemptError.message}`);
          }
          
          // Progressive delay for retries
          const delay = Math.min(uploadAttempts * 2000, 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Update progress
      const progress = Math.round(((i + 1) / files.length) * 100);
      onProgress?.(progress);
      
      // Small delay between uploads for mobile stability
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Batch upload completed. ${uploadedUrls.length}/${files.length} files uploaded successfully.`);
    return uploadedUrls;
  } catch (error: any) {
    console.error("Error in batch upload:", {
      error: error.message,
      uploadedCount: uploadedUrls.length,
      totalFiles: files.length
    });
    
    // Provide more specific error messages
    if (error.message?.includes('exceeded') || error.message?.includes('too large')) {
      throw new Error("File size too large. Please use images smaller than 5MB.");
    } else if (error.message?.includes('Unauthorized')) {
      throw new Error("You need to be logged in to upload photos.");
    } else if (error.message?.includes('configuration')) {
      throw new Error("Image storage not configured. Please contact support.");
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error("Network error. Please check your connection and try again.");
    }
    
    throw error;
  }
}

export async function deleteImage(imagePath: string): Promise<boolean> {
    try {
        console.log("Attempting to delete image:", imagePath);
        
        // Extract the path within the bucket from the full URL
        const pathParts = imagePath.split('/property_images/');
        if (pathParts.length < 2) {
            console.error("Invalid image path:", imagePath);
            throw new Error("Invalid image path format");
        }
        const bucketPath = pathParts[1];

        const { error } = await supabase.storage
            .from('property_images')
            .remove([bucketPath]);

        if (error) {
            console.error("Error deleting image:", error);
            throw new Error(`Failed to delete image: ${error.message}`);
        }

        console.log("Image deleted successfully:", bucketPath);
        return true;
    } catch (error: any) {
        console.error("Unexpected error deleting image:", error.message);
        throw error;
    }
}

// Review system functions
export async function fetchPropertyReviews(propertyId: string) {
  try {
    const { data, error } = await supabase
      .from('property_reviews')
      .select(`
        id,
        property_id,
        user_id,
        rating,
        comment,
        created_at,
        profiles (full_name, avatar_url),
        reactions:review_reactions(*),
        replies:review_replies(*)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching property reviews:', error);
    throw error;
  }
}

export async function submitReview(reviewData: {
  property_id: string;
  user_id: string;
  rating: number;
  comment?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('property_reviews')
      .insert(reviewData)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

export async function updateReviewReaction(
  reviewId: string,
  userId: string,
  reactionType: 'like' | 'dislike'
) {
  try {
    // Check if a reaction already exists
    const { data: existingReaction } = await supabase
      .from('review_reactions')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single();

    // If reaction exists and is the same type, remove it
    if (existingReaction && existingReaction.reaction_type === reactionType) {
      const { error } = await supabase
        .from('review_reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) throw error;
      return { action: 'removed' };
    } 
    // If reaction exists but is different type, update it
    else if (existingReaction) {
      const { error } = await supabase
        .from('review_reactions')
        .update({ reaction_type: reactionType })
        .eq('id', existingReaction.id);

      if (error) throw error;
      return { action: 'updated' };
    } 
    // If no reaction exists, create a new one
    else {
      const { error } = await supabase.from('review_reactions').insert({
        review_id: reviewId,
        user_id: userId,
        reaction_type: reactionType
      });

      if (error) throw error;
      return { action: 'added' };
    }
  } catch (error) {
    console.error('Error updating review reaction:', error);
    throw error;
  }
}

export async function submitReviewReply(replyData: {
  review_id: string;
  user_id: string;
  content: string;
}) {
  try {
    const { data, error } = await supabase
      .from('review_replies')
      .insert(replyData)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting reply:', error);
    throw error;
  }
}

export async function updatePropertyVisibility(propertyId: string, isPublic: boolean) {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ is_public: isPublic })
      .eq('id', propertyId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating property visibility:', error);
    throw error;
  }
}

export async function checkBucketExists(bucketName: string): Promise<boolean> {
  try {
    console.log(`Checking if bucket "${bucketName}" exists...`);
    
    const { data, error } = await supabase.storage.getBucket(bucketName);
    
    if (error) {
      console.log(`Bucket check error for "${bucketName}":`, error.message);
      // If error is "Bucket not found", that's expected for non-existent buckets
      if (error.message?.includes('not found')) {
        return false;
      }
      // For other errors, log but don't fail the check
      console.warn(`Unexpected error checking bucket "${bucketName}":`, error);
      return false;
    }
    
    const exists = !!data;
    console.log(`Bucket "${bucketName}" exists:`, exists);
    return exists;
  } catch (error: any) {
    console.error(`Error checking bucket "${bucketName}":`, error.message);
    return false;
  }
}
