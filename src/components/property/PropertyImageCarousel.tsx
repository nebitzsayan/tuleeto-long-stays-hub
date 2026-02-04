import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useImageHandling } from "@/hooks/useImageHandling";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import ImageGalleryPopup from "./ImageGalleryPopup";
import MobileImageViewer from "./MobileImageViewer";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
  className?: string;
}

const PropertyImageCarousel = ({ images, title, className = "" }: PropertyImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  
  const { 
    imageList, 
    handleImageError, 
    handleImageLoad, 
    startImageLoading, 
    preloadAdjacentImages, 
    isImageLoading 
  } = useImageHandling(images);
  const isMobile = useMobileDetection();

  // Keyboard navigation and preloading
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (showGallery || showViewer) return;
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showGallery, showViewer]);

  // Preload adjacent images when current image changes
  useEffect(() => {
    if (imageList.length > 1) {
      preloadAdjacentImages(currentImageIndex);
    }
  }, [currentImageIndex, imageList.length, preloadAdjacentImages]);

  if (!imageList.length) {
    return (
      <Card className={`aspect-[4/3] bg-muted flex items-center justify-center ${className}`}>
        <p className="text-muted-foreground">No images available</p>
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
    if (isMobile) {
      setShowViewer(true);
    } else {
      setShowGallery(true);
    }
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
      <Card className={`relative overflow-hidden bg-muted sm:rounded-xl rounded-none ${className}`}>
        <div 
          className="aspect-[4/3] sm:aspect-[16/10] relative group cursor-pointer" 
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
          
          {/* Overlay with expand icon - hidden on mobile for cleaner look */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 hidden sm:flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
          </div>

          {/* Navigation arrows - Larger on mobile for better touch targets */}
          {imageList.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 transition-all duration-300 z-10 shadow-lg
                  ${isMobile 
                    ? 'opacity-80 h-12 w-12 rounded-full bg-white/90 hover:bg-white' 
                    : 'opacity-0 group-hover:opacity-100 h-10 w-10'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                disabled={isTransitioning}
              >
                <ChevronLeft className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 transition-all duration-300 z-10 shadow-lg
                  ${isMobile 
                    ? 'opacity-80 h-12 w-12 rounded-full bg-white/90 hover:bg-white' 
                    : 'opacity-0 group-hover:opacity-100 h-10 w-10'
                  }`}
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                disabled={isTransitioning}
              >
                <ChevronRight className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
              </Button>
            </>
          )}

          {/* Image counter - Better positioned for mobile */}
          {imageList.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs sm:text-sm px-2.5 py-1.5 rounded-full backdrop-blur-sm font-medium">
              {currentImageIndex + 1} / {imageList.length}
            </div>
          )}

          {/* Tap to view hint on mobile */}
          {isMobile && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-full backdrop-blur-sm">
              Tap to view
            </div>
          )}

          {/* Transition loading indicator */}
          {(isTransitioning || isImageLoading(currentImageIndex)) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Thumbnail dots - Better touch targets on mobile */}
        {imageList.length > 1 && imageList.length <= 5 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-1">
            {imageList.map((_, index) => (
              <button
                key={index}
                className={`rounded-full transition-all touch-manipulation
                  ${isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2'}
                  ${index === currentImageIndex 
                    ? 'bg-white scale-110' 
                    : 'bg-white/50 hover:bg-white/75'
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

      {/* Image Gallery Popup - for desktop */}
      <ImageGalleryPopup
        images={imageList}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        title={title}
      />

      {/* Full-screen viewer - for mobile direct view */}
      <MobileImageViewer
        images={imageList}
        initialIndex={currentImageIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        title={title}
      />
    </>
  );
};

export default PropertyImageCarousel;
