
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { useImageHandling } from "@/hooks/useImageHandling";
import { useMobileDetection } from "@/hooks/useMobileDetection";

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
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number; time: number } | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  
  const imageRef = useRef<HTMLImageElement>(null);
  const { imageList, handleImageError, handleImageLoad } = useImageHandling(images);
  const { isMobile, orientation, viewportHeight } = useMobileDetection();

  useEffect(() => {
    setCurrentIndex(Math.max(0, Math.min(initialIndex, imageList.length - 1)));
  }, [initialIndex, imageList.length]);

  // Smart initial scale calculation
  const calculateOptimalScale = useCallback(() => {
    if (!imageRef.current || !imageNaturalSize) return 1;
    
    const containerWidth = window.innerWidth - (isMobile ? 16 : 32);
    const containerHeight = (viewportHeight || window.innerHeight) - (isMobile ? 120 : 160);
    
    const scaleX = containerWidth / imageNaturalSize.width;
    const scaleY = containerHeight / imageNaturalSize.height;
    const optimalScale = Math.min(scaleX, scaleY, 1);
    
    return Math.max(optimalScale, 0.3);
  }, [imageNaturalSize, isMobile, viewportHeight]);

  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setIsLoading(true);
      setImageNaturalSize(null);
      // Don't reset scale immediately, let it be calculated after image loads
    }
  }, [currentIndex, isOpen]);

  // Update scale when image dimensions are known
  useEffect(() => {
    if (imageNaturalSize && isOpen) {
      const optimalScale = calculateOptimalScale();
      setScale(optimalScale);
    }
  }, [imageNaturalSize, calculateOptimalScale, isOpen]);

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

  const zoomIn = () => setScale(prev => Math.min(prev + (isMobile ? 0.3 : 0.5), isMobile ? 2.5 : 3));
  const zoomOut = () => setScale(prev => Math.max(prev - (isMobile ? 0.3 : 0.5), 0.2));
  const resetZoom = () => {
    const optimalScale = calculateOptimalScale();
    setScale(optimalScale);
  };
  const rotateImage = () => setRotation(prev => (prev + 90) % 360);

  // Enhanced touch handling for mobile swipe and zoom gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.targetTouches.length === 1) {
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY,
        time: Date.now()
      });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const timeElapsed = touchEnd.time - touchStart.time;
    
    // Reduced swipe threshold for easier navigation
    const minSwipeDistance = 30;
    const maxSwipeTime = 300;
    
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);
    const isQuickSwipe = timeElapsed < maxSwipeTime;

    // Handle double tap for zoom
    if (Math.abs(distanceX) < 10 && Math.abs(distanceY) < 10 && isQuickSwipe) {
      if (scale === calculateOptimalScale()) {
        setScale(prev => Math.min(prev * 1.5, isMobile ? 2.5 : 3));
      } else {
        resetZoom();
      }
      return;
    }

    // Only handle horizontal swipes if they're not primarily vertical and are quick enough
    if (!isVerticalSwipe && isQuickSwipe && imageList.length > 1) {
      if (isLeftSwipe) {
        nextImage();
      } else if (isRightSwipe) {
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
      <DialogContent 
        className={`
          fixed inset-0 w-screen border-none overflow-hidden max-w-none max-h-none p-0
          ${isMobile 
            ? 'h-screen bg-black' 
            : 'h-screen bg-black/95'
          }
        `}
        style={{
          height: isMobile && viewportHeight ? `${viewportHeight}px` : '100vh'
        }}
      >
        {/* Header with controls */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-2 sm:p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <h3 className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[200px]">{title}</h3>
              {imageList.length > 1 && (
                <span className="text-xs bg-white/20 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded shrink-0">
                  {currentIndex + 1} / {imageList.length}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Zoom controls - Hide some on very small screens */}
              {!isMobile && (
                <>
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
                </>
              )}

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

        {/* Main image container - Fully optimized for mobile */}
        <div 
          className={`
            flex items-center justify-center w-full h-full overflow-hidden touch-none
            ${isMobile ? 'pt-14 pb-20 px-1' : 'pt-16 pb-20 px-4'}
          `}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none'
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            
            <img
              ref={imageRef}
              src={currentImage}
              alt={`${title} - Image ${currentIndex + 1}`}
              className={`
                transition-transform duration-200 ease-out select-none touch-none
                ${isMobile ? 'w-full h-full object-contain' : 'max-w-full max-h-full object-contain'}
              `}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                imageRendering: scale > 1 ? 'crisp-edges' : 'auto',
                transformOrigin: 'center center',
                ...(isMobile && {
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                })
              }}
              onLoad={(e) => {
                const img = e.currentTarget;
                setImageNaturalSize({
                  width: img.naturalWidth,
                  height: img.naturalHeight
                });
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
        {imageList.length > 1 && !isMobile && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 backdrop-blur-sm"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-12 h-12 backdrop-blur-sm"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Bottom controls for mobile - Enhanced */}
        {isMobile && (
          <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pb-safe">
            <div className="flex justify-center items-center space-x-3">
              {/* Mobile zoom controls with larger touch targets */}
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomOut}
                className="h-12 w-12 p-0 text-white hover:bg-white/20 rounded-full touch-manipulation"
                disabled={scale <= 0.2}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={resetZoom}
                className="h-12 px-4 text-sm text-white hover:bg-white/20 rounded-full touch-manipulation min-w-[60px]"
              >
                {Math.round(scale * 100)}%
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={zoomIn}
                className="h-12 w-12 p-0 text-white hover:bg-white/20 rounded-full touch-manipulation"
                disabled={scale >= (isMobile ? 2.5 : 3)}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>

              {imageList.length > 1 && (
                <>
                  <div className="w-px h-8 bg-white/30 mx-2"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevImage}
                    className="text-white hover:bg-white/20 flex items-center space-x-2 h-12 px-4 rounded-full touch-manipulation"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="text-sm">Prev</span>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextImage}
                    className="text-white hover:bg-white/20 flex items-center space-x-2 h-12 px-4 rounded-full touch-manipulation"
                  >
                    <span className="text-sm">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Enhanced instructions for mobile */}
            <div className="text-center mt-2 space-y-1">
              {imageList.length > 1 && (
                <p className="text-xs text-white/70">
                  Swipe or tap arrows to navigate • Double-tap to zoom
                </p>
              )}
              {imageList.length === 1 && (
                <p className="text-xs text-white/70">
                  Double-tap to zoom • Pinch to zoom (if supported)
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OptimizedImagePreview;
