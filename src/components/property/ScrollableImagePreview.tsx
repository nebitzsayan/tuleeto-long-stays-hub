import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ZoomIn } from "lucide-react";
import ImagePreviewModal from "./ImagePreviewModal";

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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] max-h-[90vh] w-full h-full p-0 bg-background border-none rounded-xl">
          {/* Header with close button */}
          <div className="sticky top-0 z-10 bg-background border-b p-3 sm:p-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-foreground truncate pr-2">
              {title} - All Photos ({images.length})
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 touch-manipulation"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Scrollable image grid */}
          <div className="overflow-y-auto flex-1 p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-3xl mx-auto">
              {images.map((image, index) => (
                <div 
                  key={index}
                  onClick={() => handleImageClick(index)}
                  className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md border border-border 
                             cursor-pointer group touch-manipulation active:scale-[0.98] transition-all duration-200
                             hover:shadow-lg hover:border-primary/30"
                >
                  <img
                    src={image}
                    alt={`${title} - Image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading={index < 4 ? "eager" : "lazy"}
                  />
                  
                  {/* Overlay with zoom hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 
                                  flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200
                                    bg-black/60 backdrop-blur-sm px-3 py-2 rounded-full flex items-center gap-2">
                      <ZoomIn className="h-4 w-4 text-white" />
                      <span className="text-white text-sm font-medium">View</span>
                    </div>
                  </div>
                  
                  {/* Image counter badge */}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                    {index + 1} / {images.length}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Tap hint for mobile */}
            <p className="text-center text-muted-foreground text-xs mt-4 sm:hidden">
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
