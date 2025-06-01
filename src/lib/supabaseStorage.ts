
import { supabase } from "@/integrations/supabase/client";

export async function uploadImage(imageFile: File, userId: string): Promise<string | null> {
  try {
    const timestamp = new Date().getTime();
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const imageName = `property_image_${timestamp}.${fileExtension}`;
    const imagePath = `${userId}/${imageName}`;

    const { data, error } = await supabase.storage
      .from('property_images')
      .upload(imagePath, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('property_images')
      .getPublicUrl(imagePath);

    return publicUrl;
  } catch (error: any) {
    console.error("Unexpected error uploading image:", error.message);
    return null;
  }
}

export async function uploadAvatar(avatarFile: File, userId: string): Promise<string | null> {
  try {
    const fileExtension = avatarFile.name.split('.').pop() || 'jpg';
    const fileName = `avatar_${userId}_${Date.now()}.${fileExtension}`;
    
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error("Error uploading avatar:", error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return null;
    }

    return publicUrl;
  } catch (error: any) {
    console.error("Unexpected error uploading avatar:", error.message);
    return null;
  }
}

export async function uploadFileToStorage(
  bucketName: string, 
  filePath: string, 
  file: File
): Promise<string | null> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading file:", error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error: any) {
    console.error("Unexpected error uploading file:", error.message);
    return null;
  }
}

export async function uploadMultipleFiles(
  bucketName: string,
  files: File[],
  pathPrefix: string = '',
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  try {
    // Set initial progress
    onProgress?.(0);
    
    // Upload each file sequentially
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${i}.${fileExtension}`;
      const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error(`File ${file.name} is too large (max 10MB)`);
        continue;
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        console.error(`File ${file.name} has unsupported type: ${file.type}`);
        continue;
      }
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error(`Error uploading file ${i+1}/${files.length}:`, error);
        continue;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);
      
      uploadedUrls.push(publicUrl);
      
      // Update progress
      const progress = Math.round(((i + 1) / files.length) * 100);
      onProgress?.(progress);
    }
    
    return uploadedUrls;
  } catch (error: any) {
    console.error("Error in batch upload:", error.message);
    // Return whatever URLs were successfully uploaded
    return uploadedUrls;
  }
}

export async function deleteImage(imagePath: string): Promise<boolean> {
    try {
        // Extract the path within the bucket from the full URL
        const pathParts = imagePath.split('/property_images/');
        if (pathParts.length < 2) {
            console.error("Invalid image path:", imagePath);
            return false;
        }
        const bucketPath = pathParts[1];

        const { error } = await supabase.storage
            .from('property_images')
            .remove([bucketPath]);

        if (error) {
            console.error("Error deleting image:", error);
            return false;
        }

        return true;
    } catch (error: any) {
        console.error("Unexpected error deleting image:", error.message);
        return false;
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

export async function checkBucketExists(bucketName: string) {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      console.error(`Error checking bucket ${bucketName}:`, error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error(`Error checking bucket ${bucketName}:`, error);
    return false;
  }
}
