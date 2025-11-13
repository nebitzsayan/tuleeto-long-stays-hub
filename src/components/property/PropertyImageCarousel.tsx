
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useImageHandling } from "@/hooks/useImageHandling";
import { useImagePreview } from "@/hooks/useImagePreview";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import OptimizedImagePreview from "./OptimizedImagePreview";
import SimpleMobileImagePreview from "./SimpleMobileImagePreview";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
  className?: string;
}

const PropertyImageCarousel = ({ images, title, className = "" }: PropertyImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const imageRef = useRef<HTMLDivElement>(null);
  
  const { 
    imageList, 
    handleImageError, 
    handleImageLoad, 
    startImageLoading, 
    preloadAdjacentImages, 
    isImageLoading 
  } = useImageHandling(images);
  const { isPreviewOpen, previewIndex, openPreview, closePreview } = useImagePreview();
  const isMobile = useMobileDetection();

  // Keyboard navigation and preloading
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Preload adjacent images when current image changes
  useEffect(() => {
    if (imageList.length > 1) {
      preloadAdjacentImages(currentImageIndex);
    }
  }, [currentImageIndex, imageList.length, preloadAdjacentImages]);

  if (!imageList.length) {
    return (
      <Card className={`aspect-[4/3] bg-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">No images available</p>
      </Card>
    );
  }

  const nextImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const nextIndex = (currentImageIndex + 1) % imageList.length;
    setCurrentImageIndex(nextIndex);
    startImageLoading(nextIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    const prevIndex = (currentImageIndex - 1 + imageList.length) % imageList.length;
    setCurrentImageIndex(prevIndex);
    startImageLoading(prevIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleImageClick = () => {
    openPreview(currentImageIndex);
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && imageList.length > 1) {
      nextImage();
    }
    if (isRightSwipe && imageList.length > 1) {
      prevImage();
    }
  };

  return (
    <>
      <Card className={`relative overflow-hidden bg-gray-100 ${className}`}>
        <div 
          ref={imageRef}
          className="aspect-[4/3] relative group cursor-pointer" 
          onClick={handleImageClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {isImageLoading(currentImageIndex) ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Skeleton className="w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          ) : (
            <img
              src={imageList[currentImageIndex]}
              alt={`${title} - Image ${currentImageIndex + 1} - Rental property on Tuleeto`}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                isTransitioning ? 'opacity-80 scale-95' : 'opacity-100 scale-100'
              }`}
              loading="lazy"
              decoding="async"
              width="800"
              height="600"
              onLoad={() => handleImageLoad(currentImageIndex, imageList[currentImageIndex])}
              onError={() => handleImageError(currentImageIndex)}
            />
          )}
          
          {/* Overlay with expand icon */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
          </div>

          {/* Navigation arrows */}
          {imageList.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className={`absolute left-2 top-1/2 -translate-y-1/2 transition-opacity duration-300 h-10 w-10 z-10 ${
                  isMobile ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                disabled={isTransitioning}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                className={`absolute right-2 top-1/2 -translate-y-1/2 transition-opacity duration-300 h-10 w-10 z-10 ${
                  isMobile ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                disabled={isTransitioning}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {imageList.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
              {currentImageIndex + 1} / {imageList.length}
            </div>
          )}

          {/* Transition loading indicator */}
          {(isTransitioning || isImageLoading(currentImageIndex)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Thumbnail dots */}
        {imageList.length > 1 && imageList.length <= 5 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
            {imageList.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isTransitioning) {
                    setIsTransitioning(true);
                    setCurrentImageIndex(index);
                    startImageLoading(index);
                    setTimeout(() => setIsTransitioning(false), 300);
                  }
                }}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Image Preview Modal - Use simple version for mobile, optimized for desktop */}
      {isMobile ? (
        <SimpleMobileImagePreview
          isOpen={isPreviewOpen}
          onClose={closePreview}
          images={imageList}
          initialIndex={previewIndex}
          title={title}
        />
      ) : (
        <OptimizedImagePreview
          isOpen={isPreviewOpen}
          onClose={closePreview}
          images={imageList}
          initialIndex={previewIndex}
          title={title}
        />
      )}
    </>
  );
};

export default PropertyImageCarousel;
