
import { useState, useCallback, useEffect } from "react";

export const useImageHandling = (images: string[]) => {
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());
  const [imageLoadingStates, setImageLoadingStates] = useState<Set<number>>(new Set());
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());

  const handleImageError = useCallback((index: number) => {
    console.error(`Failed to load image at index ${index}:`, images[index]);
    setImageLoadErrors(prev => new Set(prev).add(index));
    setImageLoadingStates(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, [images]);

  const handleImageLoad = useCallback((index: number, image: string) => {
    console.log(`Successfully loaded image ${index + 1}:`, image);
    setImageLoadingStates(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
    setPreloadedImages(prev => new Set(prev).add(index));
  }, []);

  const startImageLoading = useCallback((index: number) => {
    if (!imageLoadErrors.has(index) && !preloadedImages.has(index)) {
      setImageLoadingStates(prev => new Set(prev).add(index));
    }
  }, [imageLoadErrors, preloadedImages]);

  const preloadImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length && !preloadedImages.has(index) && !imageLoadErrors.has(index)) {
      const img = new Image();
      startImageLoading(index);
      img.onload = () => handleImageLoad(index, images[index]);
      img.onerror = () => handleImageError(index);
      img.src = images[index];
    }
  }, [images, preloadedImages, imageLoadErrors, startImageLoading, handleImageLoad, handleImageError]);

  const preloadAdjacentImages = useCallback((currentIndex: number) => {
    // Preload next and previous images
    const nextIndex = (currentIndex + 1) % images.length;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    
    if (images.length > 1) {
      preloadImage(nextIndex);
      preloadImage(prevIndex);
    }
  }, [images.length, preloadImage]);

  // Filter out images that failed to load
  const validImages = images.filter((_, index) => !imageLoadErrors.has(index));

  // Use a placeholder if no valid images
  const imageList = validImages.length > 0 
    ? validImages 
    : ["https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&h=500&q=80"];

  const isImageLoading = useCallback((index: number) => {
    return imageLoadingStates.has(index);
  }, [imageLoadingStates]);

  return {
    imageLoadErrors,
    imageLoadingStates,
    preloadedImages,
    validImages,
    imageList,
    handleImageError,
    handleImageLoad,
    startImageLoading,
    preloadImage,
    preloadAdjacentImages,
    isImageLoading
  };
};
