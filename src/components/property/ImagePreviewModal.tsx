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
  title,
}: ImagePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft" && images.length > 1) {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }
    if (e.key === "ArrowRight" && images.length > 1) {
      setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }
    if (e.key === "Escape") onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, images.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-0 flex flex-col max-w-none max-h-none w-screen h-screen p-0 m-0 bg-white/80 backdrop-blur-sm border-none shadow-none overflow-hidden animate-fade-in">

        {/* Close button */}
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg border border-gray-200 h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />
          </Button>
        </DialogClose>

        {/* Image container - grows but respects thumbnail height */}
        <div className="flex-grow min-h-0 flex items-center justify-center w-full p-2 sm:p-4">
          <img
            src={images[currentIndex]}
            alt={`${title} - Image ${currentIndex + 1}`}
            className="object-contain rounded-lg shadow-lg max-w-full max-h-full"
            style={{
              maxWidth: "95%",
              minHeight: "200px",
            }}
          />
        </div>

        {/* Thumbnail gallery - always at bottom in flex flow */}
        {images.length > 1 && (
          <div className="w-full flex-shrink-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-2 sm:p-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-gray-300 hover:border-gray-400"
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

            <div className="text-center mt-1 sm:mt-2">
              <span className="text-xs sm:text-sm text-gray-700 font-medium bg-white/80 px-2 py-1 rounded">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;


