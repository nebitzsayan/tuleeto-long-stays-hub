import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Grid3X3, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFullscreenUrl, getThumbUrl } from '@/lib/imagekitUrl';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onOpenGrid?: () => void;
}

const ZOOM_LEVELS = [1, 1.5, 2, 3];

const ImageLightbox = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title = 'Property',
  onOpenGrid,
}: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  
  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionStart = useRef({ x: 0, y: 0 });
  
  // Touch/swipe refs
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const lastTapTime = useRef<number>(0);
  const pinchStartDistance = useRef<number>(0);
  const pinchStartZoom = useRef<number>(1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Update viewport size
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, []);

  // Reset zoom when changing images
  const resetZoom = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Reset index and zoom when images or initialIndex changes
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsLoading(true);
      resetZoom();
    }
  }, [isOpen, initialIndex, resetZoom]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (zoom > 1) {
            resetZoom();
          } else {
            onClose();
          }
          break;
        case 'ArrowLeft':
          if (zoom === 1) goToPrevious();
          break;
        case 'ArrowRight':
          if (zoom === 1) goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        case '0':
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length, zoom]);

  const goToNext = useCallback(() => {
    if (images.length <= 1 || zoom > 1) return;
    setIsLoading(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  }, [images.length, zoom, resetZoom]);

  const goToPrevious = useCallback(() => {
    if (images.length <= 1 || zoom > 1) return;
    setIsLoading(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  }, [images.length, zoom, resetZoom]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const currentIdx = ZOOM_LEVELS.indexOf(prev);
      if (currentIdx < ZOOM_LEVELS.length - 1) {
        return ZOOM_LEVELS[currentIdx + 1];
      }
      return prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const currentIdx = ZOOM_LEVELS.indexOf(prev);
      if (currentIdx > 0) {
        const newZoom = ZOOM_LEVELS[currentIdx - 1];
        if (newZoom === 1) {
          setPosition({ x: 0, y: 0 });
        }
        return newZoom;
      }
      return prev;
    });
  }, []);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers for swipe and pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      pinchStartDistance.current = getTouchDistance(e.touches);
      pinchStartZoom.current = zoom;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.targetTouches[0].clientX;
      touchEndX.current = e.targetTouches[0].clientX;
      
      if (zoom > 1) {
        // Start panning
        setIsDragging(true);
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        positionStart.current = { ...position };
      }
      
      // Check for double-tap
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        // Double-tap detected
        if (zoom > 1) {
          resetZoom();
        } else {
          setZoom(2);
        }
      }
      lastTapTime.current = now;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / pinchStartDistance.current;
      let newZoom = pinchStartZoom.current * scale;
      
      // Clamp zoom
      newZoom = Math.max(1, Math.min(3, newZoom));
      setZoom(newZoom);
      
      if (newZoom === 1) {
        setPosition({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1) {
      touchEndX.current = e.targetTouches[0].clientX;
      
      if (zoom > 1 && isDragging) {
        // Pan when zoomed
        const dx = e.touches[0].clientX - dragStart.current.x;
        const dy = e.touches[0].clientY - dragStart.current.y;
        
        // Limit panning based on zoom level
        const maxPan = (zoom - 1) * 150;
        setPosition({
          x: Math.max(-maxPan, Math.min(maxPan, positionStart.current.x + dx)),
          y: Math.max(-maxPan, Math.min(maxPan, positionStart.current.y + dy)),
        });
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (zoom === 1) {
      const threshold = 50;
      const distance = touchStartX.current - touchEndX.current;

      if (distance > threshold) {
        goToNext();
      } else if (distance < -threshold) {
        goToPrevious();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Mouse handlers for desktop panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      positionStart.current = { ...position };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      
      const maxPan = (zoom - 1) * 150;
      setPosition({
        x: Math.max(-maxPan, Math.min(maxPan, positionStart.current.x + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, positionStart.current.y + dy)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    if (zoom > 1) {
      resetZoom();
    } else {
      setZoom(2);
    }
  };

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen || images.length <= 1) return;

    const preloadIndices = [
      (currentIndex + 1) % images.length,
      (currentIndex - 1 + images.length) % images.length,
    ];

    preloadIndices.forEach((idx) => {
      const img = new Image();
      img.src = getFullscreenUrl(images[idx], viewportSize.width, viewportSize.height);
    });
  }, [currentIndex, images, isOpen, viewportSize]);

  if (!isOpen) return null;

  const currentImageUrl = getFullscreenUrl(
    images[currentIndex],
    viewportSize.width,
    viewportSize.height
  );

  const content = (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 bg-black/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10"
          onClick={onClose}
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
            onClick={handleZoomOut}
            disabled={zoom === 1}
          >
            <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          
          <span className="text-white text-xs sm:text-sm font-medium min-w-[2.5rem] text-center">
            {zoom === 1 ? '1x' : `${zoom}x`}
          </span>
          
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
            onClick={handleZoomIn}
            disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
          >
            <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {zoom > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-8 w-8 sm:h-9 sm:w-9"
              onClick={resetZoom}
            >
              <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-xs sm:text-sm">
            {currentIndex + 1} / {images.length}
          </span>

          {onOpenGrid && images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10"
              onClick={() => {
                onClose();
                onOpenGrid();
              }}
            >
              <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main image area */}
      <div
        ref={imageRef}
        className={`flex-1 min-h-0 relative flex items-center justify-center overflow-hidden ${
          zoom > 1 ? 'cursor-grab' : 'cursor-default'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
          </div>
        )}

        {/* The image - key prop forces re-render on index change */}
        <img
          key={currentIndex}
          src={currentImageUrl}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="w-full h-full object-contain select-none transition-transform duration-100"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          draggable={false}
        />

        {/* Navigation arrows - hidden on very small screens or when zoomed */}
        {images.length > 1 && zoom === 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full hidden sm:flex"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 sm:h-12 sm:w-12 rounded-full hidden sm:flex"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
            </Button>
          </>
        )}

        {/* Zoom hint on mobile */}
        {zoom === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:hidden">
            <span className="text-white/60 text-xs bg-black/40 px-3 py-1.5 rounded-full">
              Double-tap or pinch to zoom
            </span>
          </div>
        )}
      </div>

      {/* Thumbnail filmstrip - hidden on very small screens or when zoomed */}
      {images.length > 1 && zoom === 1 && (
        <div className="flex-shrink-0 py-2 sm:py-3 px-2 bg-black/80 backdrop-blur-sm hidden sm:block">
          <div className="flex gap-2 justify-center overflow-x-auto max-w-full">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsLoading(true);
                  setCurrentIndex(idx);
                  resetZoom();
                }}
                className={`flex-shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded-md overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? 'border-white opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={getThumbUrl(img)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile dot indicators - only when not zoomed */}
      {images.length > 1 && images.length <= 10 && zoom === 1 && (
        <div className="flex-shrink-0 py-3 sm:hidden">
          <div className="flex gap-1.5 justify-center">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsLoading(true);
                  setCurrentIndex(idx);
                  resetZoom();
                }}
                className={`rounded-full transition-all ${
                  idx === currentIndex
                    ? 'w-2.5 h-2.5 bg-white'
                    : 'w-2 h-2 bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};

export default ImageLightbox;
