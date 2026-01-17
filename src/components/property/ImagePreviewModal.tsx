
import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex: number;
  title: string;
}

const ImagePreviewModal = ({ isOpen, onClose, images, initialIndex, title }: ImagePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  // Minimum swipe distance for navigation (in pixels)
  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsZoomed(false);
    setIsLoading(true);
  }, [initialIndex, isOpen]);

  const nextImage = useCallback(() => {
    if (!isZoomed) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsLoading(true);
    }
  }, [images.length, isZoomed]);

  const prevImage = useCallback(() => {
    if (!isZoomed) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
      setIsLoading(true);
    }
  }, [images.length, isZoomed]);

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => !prev);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowRight':
          nextImage();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          toggleZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextImage, prevImage, onClose, toggleZoom]);

  // Touch handlers for swipe gestures
  const onTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || isZoomed) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    
    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!images.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100dvh] w-screen h-[100dvh] p-0 bg-black border-none rounded-none fixed inset-0">
        {/* Header with close and zoom buttons */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent safe-area-top">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-white/90 text-sm font-medium truncate">
              {title}
            </span>
            {images.length > 1 && (
              <span className="text-white/70 text-sm whitespace-nowrap">
                ({currentIndex + 1}/{images.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleZoom}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 touch-manipulation"
              aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            >
              {isZoomed ? (
                <ZoomOut className="h-5 w-5" />
              ) : (
                <ZoomIn className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 touch-manipulation"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main image container with swipe support - full height with proper padding */}
        <div 
          className="absolute inset-0 flex items-center justify-center pt-16 pb-24 sm:pb-16"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
          
          {/* Image container - properly centered with max dimensions */}
          <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-12">
            <img
              ref={imageRef}
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className={`max-w-full max-h-full w-auto h-auto object-contain transition-transform duration-300 touch-manipulation select-none ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              style={{
                maxWidth: 'calc(100vw - 2rem)',
                maxHeight: 'calc(100dvh - 10rem)',
              }}
              onClick={toggleZoom}
              onLoad={handleImageLoad}
              draggable={false}
            />
          </div>
          
          {/* Desktop navigation arrows */}
          {images.length > 1 && !isZoomed && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-11 h-11 hidden sm:flex shadow-lg backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-11 h-11 hidden sm:flex shadow-lg backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}
        </div>

        {/* Bottom navigation for mobile - dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent safe-area-bottom">
            <div className="flex items-center justify-center gap-3">
              {/* Mobile navigation buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="bg-white/15 hover:bg-white/25 text-white rounded-full w-11 h-11 sm:hidden touch-manipulation active:scale-95 transition-transform"
                aria-label="Previous image"
                disabled={isZoomed}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              
              {/* Dots indicator */}
              <div className="flex items-center gap-1.5 px-3">
                {images.length <= 10 ? (
                  images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isZoomed) {
                          setCurrentIndex(index);
                          setIsLoading(true);
                        }
                      }}
                      className={`w-2.5 h-2.5 rounded-full transition-all touch-manipulation ${
                        index === currentIndex 
                          ? 'bg-white w-5' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                      disabled={isZoomed}
                    />
                  ))
                ) : (
                  <span className="text-white/90 text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="bg-white/15 hover:bg-white/25 text-white rounded-full w-11 h-11 sm:hidden touch-manipulation active:scale-95 transition-transform"
                aria-label="Next image"
                disabled={isZoomed}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Swipe hint for mobile */}
            <p className="text-white/50 text-xs text-center mt-3 sm:hidden">
              Swipe to navigate • Tap image to zoom
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
