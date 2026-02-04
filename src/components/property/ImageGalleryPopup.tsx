import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Grid } from "lucide-react";
import { getThumbUrl } from "@/lib/imagekitUrl";
import MobileImageViewer from "./MobileImageViewer";

interface ImageGalleryPopupProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const ImageGalleryPopup = ({
  images,
  isOpen,
  onClose,
  title = "Photos"
}: ImageGalleryPopupProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Handle keyboard
  useEffect(() => {
    if (!isOpen || selectedImageIndex !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, selectedImageIndex, onClose]);

  const openViewer = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeViewer = () => {
    setSelectedImageIndex(null);
  };

  if (!isOpen) return null;

  const popup = (
    <div
      className="fixed inset-0 z-[9998] bg-background flex flex-col"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-muted-foreground" />
          <span className="font-semibold text-foreground">
            {images.length} Photos
          </span>
        </div>
        
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Close gallery"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Image Grid */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => openViewer(index)}
              className="relative aspect-square rounded-lg overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <img
                src={getThumbUrl(image)}
                alt={`${title} - Photo ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              
              {/* Image number badge */}
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                {index + 1}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen image viewer */}
      <MobileImageViewer
        images={images}
        initialIndex={selectedImageIndex ?? 0}
        isOpen={selectedImageIndex !== null}
        onClose={closeViewer}
        title={title}
      />
    </div>
  );

  return createPortal(popup, document.body);
};

export default ImageGalleryPopup;
