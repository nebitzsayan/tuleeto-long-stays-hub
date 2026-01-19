import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn } from "lucide-react";
import ImagePreviewModal from "./ImagePreviewModal";
import { getThumbUrl, isImageKitUrl } from "@/lib/imagekitUrl";

interface ScrollableImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  title: string;
}

const ScrollableImagePreview = ({ isOpen, onClose, images, title }: ScrollableImagePreviewProps) => {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || fullscreenIndex !== null) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, fullscreenIndex]);

  // Reset fullscreen when popup closes
  useEffect(() => {
    if (!isOpen) {
      setFullscreenIndex(null);
    }
  }, [isOpen]);

  if (!images.length) return null;

  const handleImageClick = (index: number) => {
    setFullscreenIndex(index);
  };

  const handleFullscreenClose = () => {
    setFullscreenIndex(null);
  };

  // Get optimized thumbnail URL
  const getThumbnail = (url: string) => {
    return isImageKitUrl(url) ? getThumbUrl(url) : url;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="fixed inset-0 w-screen h-[100dvh] max-w-none max-h-none p-0 bg-background border-none rounded-none sm:inset-auto sm:w-[90vw] sm:h-auto sm:max-w-3xl sm:max-h-[90vh] sm:rounded-xl sm:border">
          {/* Header with close button */}
          <div className="sticky top-0 z-10 bg-background border-b p-3 sm:p-4 flex items-center justify-between safe-area-top">
            <h2 className="text-base sm:text-lg font-semibold text-foreground truncate pr-2">
              {title}
            </h2>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm text-muted-foreground">{images.length} photos</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10 touch-manipulation"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Scrollable image grid */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 min-h-0" style={{ maxHeight: 'calc(100dvh - 60px)' }}>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-3xl mx-auto pb-safe">
              {images.map((image, index) => (
                <div 
                  key={index}
                  onClick={() => handleImageClick(index)}
                  className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-sm border border-border 
                             cursor-pointer group touch-manipulation active:scale-[0.98] transition-all duration-150
                             hover:shadow-md hover:border-primary/30"
                >
                  <img
                    src={getThumbnail(image)}
                    alt={`${title} - Image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    loading={index < 6 ? "eager" : "lazy"}
                  />
                  
                  {/* Overlay with zoom hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 group-active:bg-black/20 transition-colors duration-150 
                                  flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-150
                                    bg-black/60 backdrop-blur-sm px-2 py-1.5 rounded-full flex items-center gap-1.5">
                      <ZoomIn className="h-3.5 w-3.5 text-white" />
                      <span className="text-white text-xs font-medium">View</span>
                    </div>
                  </div>
                  
                  {/* Image counter badge */}
                  <div className="absolute top-1.5 right-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Tap hint for mobile */}
            <p className="text-center text-muted-foreground text-xs mt-4 pb-4 sm:hidden">
              Tap any image to view full screen
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen image preview modal */}
      <ImagePreviewModal
        isOpen={fullscreenIndex !== null}
        onClose={handleFullscreenClose}
        images={images}
        initialIndex={fullscreenIndex ?? 0}
        title={title}
      />
    </>
  );
};

export default ScrollableImagePreview;
