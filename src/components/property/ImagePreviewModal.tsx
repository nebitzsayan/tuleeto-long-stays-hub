
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
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 bg-white border-none shadow-none overflow-hidden">
        {/* Close button */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 text-gray-700 rounded-full shadow-lg border"
          >
            <X className="h-6 w-6" />
          </Button>
        </DialogClose>

        <div className="flex flex-col h-full bg-white">
          {/* Main image container - takes most of the space */}
          <div className="flex-1 flex items-center justify-center p-4 bg-white">
            <div className="w-full h-full max-w-6xl max-h-full flex items-center justify-center">
              <img
                src={images[currentIndex]}
                alt={`${title} - Image ${currentIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
              />
            </div>
          </div>

          {/* Thumbnail gallery - only show if multiple images */}
          {images.length > 1 && (
            <div className="bg-gray-50 border-t p-3 md:p-4">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300'
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
                  <span className="text-xs md:text-sm text-gray-600 font-medium">
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
