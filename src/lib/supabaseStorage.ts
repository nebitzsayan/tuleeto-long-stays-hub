
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

// Reviews API
export const fetchPropertyReviews = async (propertyId: string) => {
  try {
    const { data, error } = await supabase
      .from('property_reviews')
      .select(`
        *,
        profiles:user_id(full_name, avatar_url)
      `)
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching property reviews:", error);
    throw error;
  }
};

export const submitReview = async (reviewData: {
  property_id: string;
  user_id: string;
  rating: number;
  comment: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('property_reviews')
      .insert([reviewData])
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
};

export const updateReviewReaction = async (
  reviewId: string,
  userId: string,
  reactionType: 'like' | 'dislike'
) => {
  try {
    // Check if reaction already exists
    const { data: existingReaction } = await supabase
      .from('review_reactions')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .single();
    
    if (existingReaction) {
      // Update existing reaction
      if (existingReaction.reaction_type === reactionType) {
        // Remove reaction if clicking the same button
        const { error } = await supabase
          .from('review_reactions')
          .delete()
          .eq('id', existingReaction.id);
        
        if (error) throw error;
      } else {
        // Change reaction type
        const { error } = await supabase
          .from('review_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.id);
        
        if (error) throw error;
      }
    } else {
      // Create new reaction
      const { error } = await supabase
        .from('review_reactions')
        .insert([{
          review_id: reviewId,
          user_id: userId,
          reaction_type: reactionType
        }]);
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error updating review reaction:", error);
    throw error;
  }
};

export const submitReviewReply = async (replyData: {
  review_id: string;
  user_id: string;
  content: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('review_replies')
      .insert([replyData])
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error submitting review reply:", error);
    throw error;
  }
};

export const updatePropertyVisibility = async (propertyId: string, isPublic: boolean) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ is_public: isPublic })
      .eq('id', propertyId)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating property visibility:", error);
    throw error;
  }
};
