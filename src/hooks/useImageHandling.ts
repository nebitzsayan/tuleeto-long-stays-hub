
import { useState } from "react";

export const useImageHandling = (images: string[]) => {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    console.error(`Failed to load image at index ${index}:`, images[index]);
    setImageLoadErrors(prev => new Set(prev).add(index));
  };

  const handleImageLoad = (index: number, image: string) => {
    console.log(`Successfully loaded image ${index + 1}:`, image);
  };

  // Filter out images that failed to load
  const validImages = images.filter((_, index) => !imageLoadErrors.has(index));

  // Use a placeholder if no valid images
  const imageList = validImages.length > 0 
    ? validImages 
    : ["https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&h=500&q=80"];

  return {
    imageLoadErrors,
    validImages,
    imageList,
    handleImageError,
    handleImageLoad
  };
};
