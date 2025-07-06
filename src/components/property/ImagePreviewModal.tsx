
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && images.length > 1) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
    if (e.key === 'ArrowRight' && images.length > 1) {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, images.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 bg-white/70 backdrop-blur-sm border-none shadow-none overflow-hidden animate-fade-in">
        {/* Close button - always visible and accessible */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 right-4 z-50 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg border border-gray-200 h-10 w-10"
          >
            <X className="h-5 w-5 text-gray-900" />
          </Button>
        </DialogClose>

        {/* Main layout container */}
        <div className="relative w-full h-full flex flex-col">
          {/* Image container - takes available space above thumbnails */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <img
              src={images[currentIndex]}
              alt={`${title} - Image ${currentIndex + 1}`}
              className="max-w-[90%] max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-lg"
              style={{ 
                maxWidth: '90%', 
                maxHeight: images.length > 1 ? 'calc(90vh - 120px)' : '90vh'
              }}
            />
          </div>

          {/* Thumbnail gallery - pinned to bottom */}
          {images.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 p-3 md:p-4 z-10">
              <div className="max-w-full mx-auto">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {index === currentIndex && (
                        <div className="absolute inset-0 bg-blue-500/20" />
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Image counter */}
                <div className="text-center mt-2">
                  <span className="text-xs md:text-sm text-gray-700 font-medium bg-white/80 px-2 py-1 rounded">
                    {currentIndex + 1} / {images.length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
