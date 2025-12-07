/**
 * Utility functions for optimizing image delivery
 */

/**
 * Get optimized Supabase storage image URL with resize parameters
 * Supabase supports image transformations via query params
 */
export const getOptimizedImageUrl = (
  url: string,
  width: number,
  height?: number,
  quality: number = 80
): string => {
  // Only transform Supabase storage URLs
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }

  // Replace /object/public/ with /render/image/public/ for transformations
  const transformUrl = url.replace(
    '/storage/v1/object/public/',
    '/storage/v1/render/image/public/'
  );

  const params = new URLSearchParams();
  params.set('width', width.toString());
  if (height) {
    params.set('height', height.toString());
  }
  params.set('quality', quality.toString());
  params.set('resize', 'cover');

  return `${transformUrl}?${params.toString()}`;
};

/**
 * Get srcset for responsive images from Supabase
 */
export const getSupabaseSrcSet = (
  url: string,
  sizes: number[] = [320, 640, 960, 1280]
): string => {
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return '';
  }

  return sizes
    .map(size => `${getOptimizedImageUrl(url, size)} ${size}w`)
    .join(', ');
};
