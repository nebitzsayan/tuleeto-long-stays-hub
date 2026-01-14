
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
      <DialogContent className="max-w-[100vw] max-h-[100dvh] w-screen h-[100dvh] p-0 bg-black border-none rounded-none sm:max-w-[95vw] sm:max-h-[95vh] sm:rounded-lg">
        {/* Header with close and zoom buttons */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-3 sm:p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-white/90 text-sm font-medium truncate max-w-[200px] sm:max-w-none">
              {title}
            </span>
            {images.length > 1 && (
              <span className="text-white/70 text-sm">
                ({currentIndex + 1}/{images.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
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

        {/* Main image container with swipe support */}
        <div 
          className="flex items-center justify-center w-full h-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative flex items-center justify-center w-full h-full px-2 py-16 sm:px-12">
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            
            <img
              ref={imageRef}
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 touch-manipulation select-none ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
              } ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onClick={toggleZoom}
              onLoad={handleImageLoad}
              draggable={false}
            />
            
            {/* Desktop navigation arrows */}
            {images.length > 1 && !isZoomed && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 sm:w-11 sm:h-11 hidden sm:flex shadow-lg backdrop-blur-sm"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 sm:w-11 sm:h-11 hidden sm:flex shadow-lg backdrop-blur-sm"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Bottom navigation for mobile - dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center justify-center gap-2">
              {/* Mobile navigation buttons */}
              <Button
                variant="ghost"
                size="icon"
                onClick={prevImage}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 sm:hidden touch-manipulation"
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
                      className={`w-2 h-2 rounded-full transition-all touch-manipulation ${
                        index === currentIndex 
                          ? 'bg-white w-4' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
                      disabled={isZoomed}
                    />
                  ))
                ) : (
                  <span className="text-white/90 text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={nextImage}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 sm:hidden touch-manipulation"
                aria-label="Next image"
                disabled={isZoomed}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Swipe hint for mobile */}
            <p className="text-white/50 text-xs text-center mt-2 sm:hidden">
              Swipe to navigate • Tap image to zoom
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
