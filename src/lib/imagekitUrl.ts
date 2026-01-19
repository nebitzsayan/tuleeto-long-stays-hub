/**
 * ImageKit URL helpers for optimized image loading
 */

const IMAGEKIT_BASE = 'https://ik.imagekit.io/tuleeto';

/**
 * Check if a URL is an ImageKit URL
 */
export const isImageKitUrl = (url: string): boolean => {
  return url?.includes('ik.imagekit.io/tuleeto') || false;
};

/**
 * Strip existing ImageKit transformations from a URL to get the original
 */
export const stripImageKitTransform = (url: string): string => {
  if (!url || !isImageKitUrl(url)) return url;
  
  // Remove any existing tr:... segment from the URL
  // Pattern: https://ik.imagekit.io/tuleeto/tr:w-480,q-60/path/to/image.jpg
  // Result: https://ik.imagekit.io/tuleeto/path/to/image.jpg
  return url.replace(/\/tr:[^/]+/, '');
};

/**
 * Add ImageKit transformations to a URL
 */
export const withImageKitTransform = (url: string, transform: string): string => {
  if (!url) return url;
  
  // Strip any existing transforms first
  const cleanUrl = stripImageKitTransform(url);
  
  if (!isImageKitUrl(cleanUrl)) return cleanUrl;
  
  // Insert transform after the base URL
  // https://ik.imagekit.io/tuleeto/path -> https://ik.imagekit.io/tuleeto/tr:w-480/path
  return cleanUrl.replace(IMAGEKIT_BASE, `${IMAGEKIT_BASE}/tr:${transform}`);
};

/**
 * Get thumbnail URL for grids/cards (small, fast loading)
 */
export const getThumbUrl = (url: string): string => {
  if (!isImageKitUrl(url)) return url;
  return withImageKitTransform(url, 'w-480,q-60,fo-auto');
};

/**
 * Get preview URL for full-screen modal (high quality based on viewport)
 */
export const getPreviewUrl = (url: string, viewportWidth?: number): string => {
  if (!isImageKitUrl(url)) return url;
  
  // Use viewport width or default to 1200
  const width = Math.min((viewportWidth || 1200) * 2, 2000);
  return withImageKitTransform(url, `w-${width},q-85,fo-auto`);
};

/**
 * Get poster URL for poster generation (high quality, larger size)
 */
export const getPosterUrl = (url: string): string => {
  if (!isImageKitUrl(url)) return url;
  return withImageKitTransform(url, 'w-1600,q-90,fo-auto');
};

/**
 * Get medium quality URL for property cards/listings
 */
export const getMediumUrl = (url: string): string => {
  if (!isImageKitUrl(url)) return url;
  return withImageKitTransform(url, 'w-800,q-75,fo-auto');
};
