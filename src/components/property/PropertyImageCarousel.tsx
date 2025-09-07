
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useImageHandling } from "@/hooks/useImageHandling";
import { useImagePreview } from "@/hooks/useImagePreview";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import OptimizedImagePreview from "./OptimizedImagePreview";
import SimpleMobileImagePreview from "./SimpleMobileImagePreview";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
  className?: string;
}

const PropertyImageCarousel = ({ images, title, className = "" }: PropertyImageCarouselProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { imageList, handleImageError, handleImageLoad } = useImageHandling(images);
  const { isPreviewOpen, previewIndex, openPreview, closePreview } = useImagePreview();
  const isMobile = useMobileDetection();

  if (!imageList.length) {
    return (
      <Card className={`aspect-[4/3] bg-gray-200 flex items-center justify-center ${className}`}>
        <p className="text-gray-500">No images available</p>
      </Card>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const handleImageClick = () => {
    openPreview(currentImageIndex);
  };

  return (
    <>
      <Card className={`relative overflow-hidden bg-gray-100 ${className}`}>
        <div className="aspect-[4/3] relative group cursor-pointer" onClick={handleImageClick}>
          <img
            src={imageList[currentImageIndex]}
            alt={`${title} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => handleImageLoad(currentImageIndex, imageList[currentImageIndex])}
            onError={() => handleImageError(currentImageIndex)}
          />
          
          {/* Overlay with expand icon */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <Button
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
          </div>

          {/* Navigation arrows */}
          {imageList.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Image counter */}
          {imageList.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
              {currentImageIndex + 1} / {imageList.length}
            </div>
          )}
        </div>

        {/* Thumbnail dots */}
        {imageList.length > 1 && imageList.length <= 5 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
            {imageList.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Image Preview Modal - Use simple version for mobile, optimized for desktop */}
      {isMobile ? (
        <SimpleMobileImagePreview
          isOpen={isPreviewOpen}
          onClose={closePreview}
          images={imageList}
          initialIndex={previewIndex}
          title={title}
        />
      ) : (
        <OptimizedImagePreview
          isOpen={isPreviewOpen}
          onClose={closePreview}
          images={imageList}
          initialIndex={previewIndex}
          title={title}
        />
      )}
    </>
  );
};

export default PropertyImageCarousel;
