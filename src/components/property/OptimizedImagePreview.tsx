
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useImageHandling } from "@/hooks/useImageHandling";

interface OptimizedImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex: number;
  title: string;
}

const OptimizedImagePreview = ({ 
  isOpen, 
  onClose, 
  images, 
  initialIndex, 
  title 
}: OptimizedImagePreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const { imageList, handleImageError, handleImageLoad } = useImageHandling(images);

  useEffect(() => {
    setCurrentIndex(Math.max(0, Math.min(initialIndex, imageList.length - 1)));
  }, [initialIndex, imageList.length]);

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setIsLoading(true);
    }
  }, [currentIndex, isOpen]);

  const nextImage = useCallback(() => {
    if (imageList.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % imageList.length);
    }
  }, [imageList.length]);

  const prevImage = useCallback(() => {
    if (imageList.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    }
  }, [imageList.length]);

  const zoomIn = () => setScale(prev => Math.min(prev + 0.5, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.5, 0.5));
  const resetZoom = () => setScale(1);
  const rotateImage = () => setRotation(prev => (prev + 90) % 360);

  // Touch handling for mobile swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > 50;
    const isRightSwipe = distanceX < -50;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Only handle horizontal swipes if they're not primarily vertical
    if (!isVerticalSwipe) {
      if (isLeftSwipe && imageList.length > 1) {
        nextImage();
      }
      if (isRightSwipe && imageList.length > 1) {
        prevImage();
      }
    }
  };

  // Keyboard navigation
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
        case '=':
        case '+':
          zoomIn();
          break;
        case '-':
          zoomOut();
          break;
        case '0':
          resetZoom();
          break;
        case 'r':
        case 'R':
          rotateImage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextImage, prevImage]);

  if (!imageList.length) return null;

  const currentImage = imageList[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 border-none overflow-hidden">
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium truncate max-w-[200px]">{title}</h3>
              {imageList.length > 1 && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                  {currentIndex + 1} / {imageList.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Zoom controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="h-8 px-2 text-xs text-white hover:bg-white/20"
              >
                {Math.round(scale * 100)}%
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {/* Rotate button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={rotateImage}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <RotateCw className="h-4 w-4" />
              </Button>

              {/* Close button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main image container */}
        <div 
          className="flex items-center justify-center w-full h-full p-4 pt-16 pb-20 touch-pan-x touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative max-w-full max-h-full overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            
            <img
              src={currentImage}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out select-none"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                imageRendering: scale > 1 ? 'crisp-edges' : 'auto'
              }}
              onLoad={() => {
                setIsLoading(false);
                handleImageLoad(currentIndex, currentImage);
              }}
              onError={() => {
                setIsLoading(false);
                handleImageError(currentIndex);
              }}
              draggable={false}
            />
          </div>
        </div>

        {/* Navigation arrows - desktop only */}
        {imageList.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 hidden md:flex backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 hidden md:flex backdrop-blur-sm"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Bottom controls for mobile */}
        <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-4 md:hidden">
          <div className="flex justify-center space-x-4">
            {imageList.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevImage}
                  className="text-white hover:bg-white/20 flex items-center space-x-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="text-xs">Previous</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextImage}
                  className="text-white hover:bg-white/20 flex items-center space-x-1"
                >
                  <span className="text-xs">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          {/* Swipe hint for mobile */}
          {imageList.length > 1 && (
            <p className="text-center text-xs text-white/70 mt-2">
              Swipe left or right to navigate
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OptimizedImagePreview;
