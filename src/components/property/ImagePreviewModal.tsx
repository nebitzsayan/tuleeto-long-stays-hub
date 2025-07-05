
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex: number;
  title: string;
}

const ImagePreviewModal = ({ 
  isOpen, 
  onClose, 
  images, 
  initialIndex, 
  title 
}: ImagePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 bg-transparent border-none shadow-none overflow-hidden">
        {/* Transparent backdrop - click to close */}
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <div className="relative w-full h-full flex items-center justify-center z-10">
          {/* Close button */}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white text-black rounded-full shadow-lg md:top-6 md:right-6"
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
          </DialogClose>

          {/* Main image container */}
          <div 
            className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ maxWidth: '95vw', maxHeight: '90vh' }}
            />
          </div>

          {/* Navigation buttons - only show if multiple images */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full shadow-lg md:left-4 z-50"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full shadow-lg md:right-4 z-50"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-black text-sm font-medium px-4 py-2 rounded-full shadow-lg md:bottom-6">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
