import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getPreviewUrl, getThumbUrl } from "@/lib/imagekitUrl";

interface MobileImageViewerProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const MobileImageViewer = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title = "Image"
}: MobileImageViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset index when opened with new initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsLoading(true);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when viewer is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, currentIndex]);

  const goToNext = useCallback(() => {
    if (images.length > 1) {
      setIsLoading(true);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  }, [images.length]);

  const goToPrev = useCallback(() => {
    if (images.length > 1) {
      setIsLoading(true);
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [images.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (distance > threshold) {
      goToNext();
    } else if (distance < -threshold) {
      goToPrev();
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const currentImage = images[currentIndex];
  // Use viewport-optimized URL for full-screen viewing
  const optimizedUrl = getPreviewUrl(currentImage, window.innerWidth);

  const viewer = (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        
        {/* Spacer for centering counter */}
        <div className="w-10" />
      </div>

      {/* Image container */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Main image - object-contain to preserve aspect ratio */}
        <img
          src={optimizedUrl}
          alt={`${title} - Image ${currentIndex + 1}`}
          className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-200 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleImageLoad}
          draggable={false}
        />

        {/* Navigation arrows - hidden on very small screens */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators - only show if reasonable number of images */}
      {images.length > 1 && images.length <= 10 && (
        <div className="flex items-center justify-center gap-2 py-4 bg-black/80">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsLoading(true);
                setCurrentIndex(index);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white scale-110"
                  : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Thumbnail strip for many images */}
      {images.length > 10 && (
        <div className="flex items-center gap-1.5 px-4 py-3 bg-black/80 overflow-x-auto scrollbar-hide">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                setIsLoading(true);
                setCurrentIndex(index);
              }}
              className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden transition-all ${
                index === currentIndex
                  ? "ring-2 ring-white scale-105"
                  : "opacity-50 hover:opacity-75"
              }`}
            >
              <img
                src={getThumbUrl(img)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Use portal to render at document root for proper z-index
  return createPortal(viewer, document.body);
};

export default MobileImageViewer;
