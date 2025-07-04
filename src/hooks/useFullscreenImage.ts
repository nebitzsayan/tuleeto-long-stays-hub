
import { useState } from "react";

export const useFullscreenImage = (validImages: string[]) => {
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenIndex, setFullscreenIndex] = useState<number>(0);

  const openFullscreen = (image: string, index: number) => {
    console.log('Opening fullscreen for image:', image);
    setFullscreenImage(image);
    setFullscreenIndex(index);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const navigateFullscreen = (direction: 'prev' | 'next') => {
    if (validImages.length <= 1) return;
    
    let newIndex = fullscreenIndex;
    if (direction === 'prev') {
      newIndex = fullscreenIndex > 0 ? fullscreenIndex - 1 : validImages.length - 1;
    } else {
      newIndex = fullscreenIndex < validImages.length - 1 ? fullscreenIndex + 1 : 0;
    }
    
    setFullscreenIndex(newIndex);
    setFullscreenImage(validImages[newIndex]);
    console.log('Navigating to image:', validImages[newIndex]);
  };

  return {
    fullscreenImage,
    fullscreenIndex,
    openFullscreen,
    closeFullscreen,
    navigateFullscreen
  };
};
