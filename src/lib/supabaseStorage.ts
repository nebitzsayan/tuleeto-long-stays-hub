
import { supabase } from '@/integrations/supabase/client';
import { validateImageFile, logSecurityEvent } from '@/lib/security';

export const checkBucketExists = async (bucketId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketId);
    return !error && !!data;
  } catch (error) {
    console.error(`Error checking bucket ${bucketId}:`, error);
    return false;
  }
};

export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  const validation = validateImageFile(file);
  
  if (!validation.isValid) {
    console.error('File validation failed:', validation.errors);
    await logSecurityEvent('avatar_upload_validation_failed', { 
      userId, 
      errors: validation.errors 
    });
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    console.log('Uploading avatar to:', filePath);

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Avatar upload error:', error);
      await logSecurityEvent('avatar_upload_failed', { 
        userId, 
        error: error.message 
      });
      return null;
    }

    console.log('Avatar uploaded successfully:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;
    console.log('Avatar public URL:', avatarUrl);

    // Update the user's profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating avatar URL in profile:', updateError);
      await logSecurityEvent('avatar_profile_update_failed', { 
        userId, 
        error: updateError.message 
      });
      return null;
    }

    await logSecurityEvent('avatar_upload_successful', { 
      userId, 
      avatarUrl 
    });

    return avatarUrl;
  } catch (error: any) {
    console.error('Unexpected avatar upload error:', error);
    await logSecurityEvent('avatar_upload_error', { 
      userId, 
      error: error.message 
    });
    return null;
  }
};

export const uploadPropertyImage = async (file: File, propertyId: string): Promise<string | null> => {
  const validation = validateImageFile(file);
  
  if (!validation.isValid) {
    console.error('File validation failed:', validation.errors);
    await logSecurityEvent('property_image_upload_validation_failed', { 
      propertyId, 
      errors: validation.errors 
    });
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${propertyId}-${Date.now()}.${fileExt}`;
    const filePath = `property-images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Property image upload error:', error);
      await logSecurityEvent('property_image_upload_failed', { 
        propertyId, 
        error: error.message 
      });
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath);

    await logSecurityEvent('property_image_upload_successful', { 
      propertyId, 
      imageUrl: urlData.publicUrl 
    });

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Unexpected property image upload error:', error);
    await logSecurityEvent('property_image_upload_error', { 
      propertyId, 
      error: error.message 
    });
    return null;
  }
};
