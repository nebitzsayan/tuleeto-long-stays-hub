
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
      <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 bg-white border-none shadow-none overflow-hidden">
        {/* Close button */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full shadow-lg md:top-6 md:right-6"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </DialogClose>

        <div className="flex flex-col h-full">
          {/* Main image container */}
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-white">
            <div className="relative max-w-4xl max-h-full flex items-center justify-center">
              <img
                src={images[currentIndex]}
                alt={`${title} - Image ${currentIndex + 1}`}
                className="max-w-full max-h-[70vh] md:max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
              
              {/* Navigation arrows - only show if multiple images */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPrevious}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg border md:-left-16"
                  >
                    <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNext}
                    className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-lg border md:-right-16"
                  >
                    <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Thumbnail gallery */}
          {images.length > 1 && (
            <div className="bg-gray-50 border-t p-4 md:p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
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
                <div className="text-center mt-3">
                  <span className="text-sm text-gray-600 font-medium">
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
