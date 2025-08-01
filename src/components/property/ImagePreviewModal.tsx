
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex: number;
  title: string;
}

const ImagePreviewModal = ({ isOpen, onClose, images, initialIndex, title }: ImagePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!images.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/90 border-none">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 md:w-8 md:h-8"
        >
          <X className="h-6 w-6 md:h-4 md:w-4" />
        </Button>

        {/* Main image container - mobile optimized */}
        <div className="flex items-center justify-center w-full h-full p-4 md:p-6">
          <div className="relative flex items-center justify-center max-w-[85vw] max-h-[80vh] md:max-w-[90vw] md:max-h-[85vh]">
            <img
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Navigation arrows - only show if multiple images */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevImage}
                  className="absolute left-[-60px] top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 md:w-10 md:h-10 hidden sm:flex"
                >
                  <ChevronLeft className="h-6 w-6 md:h-5 md:w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextImage}
                  className="absolute right-[-60px] top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 md:w-10 md:h-10 hidden sm:flex"
                >
                  <ChevronRight className="h-6 w-6 md:h-5 md:w-5" />
                </Button>

                {/* Mobile navigation - tap areas */}
                <div
                  className="absolute left-0 top-0 w-1/3 h-full sm:hidden"
                  onClick={prevImage}
                />
                <div
                  className="absolute right-0 top-0 w-1/3 h-full sm:hidden"
                  onClick={nextImage}
                />
              </>
            )}
          </div>
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
