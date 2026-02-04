import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import { useImageHandling } from "@/hooks/useImageHandling";
import ImageGalleryPopup from "./ImageGalleryPopup";
import MobileImageViewer from "./MobileImageViewer";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface PropertyImageCollageProps {
  images: string[];
  title: string;
}

const PropertyImageCollage = ({ images, title }: PropertyImageCollageProps) => {
  const { validImages, imageList, handleImageError, handleImageLoad } = useImageHandling(images);
  const [showGallery, setShowGallery] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const isMobile = useMobileDetection();

  const openPreview = (index: number = 0) => {
    setViewerStartIndex(index);
    if (isMobile) {
      setShowViewer(true);
    } else {
      setShowGallery(true);
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-xl shadow-sm">
        {/* Mobile: Single large image with counter */}
        <div className="block md:hidden">
          <div 
            className="relative h-64 w-full group cursor-pointer"
            onClick={() => openPreview(0)}
          >
            <img 
              src={imageList[0]} 
              alt={`${title} - Main`} 
              className="w-full h-full object-cover"
              onError={() => handleImageError(0)}
              onLoad={() => handleImageLoad(0, imageList[0])}
            />
            
            {/* Image count overlay */}
            {validImages.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                1 / {validImages.length}
              </div>
            )}
            
            {/* View all button */}
            <div className="absolute bottom-3 right-3">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-800 rounded-lg px-3 py-1 text-sm font-medium backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  openPreview(0);
                }}
              >
                <Expand className="h-4 w-4 mr-1" />
                View all
              </Button>
            </div>
          </div>
        </div>

        {/* Desktop: Airbnb-style collage */}
        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-xl overflow-hidden">
          {/* Large main image - spans 2 columns and 2 rows */}
          <div 
            className="col-span-2 row-span-2 relative group cursor-pointer"
            onClick={() => openPreview(0)}
          >
            <img 
              src={imageList[0]} 
              alt={`${title} - Main`} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => handleImageError(0)}
              onLoad={() => handleImageLoad(0, imageList[0])}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {/* Four smaller images in 2x2 grid on the right */}
          {[1, 2, 3, 4].map((index) => (
            <div 
              key={index}
              className="relative group cursor-pointer overflow-hidden"
              onClick={() => openPreview(index)}
            >
              {imageList[index] ? (
                <>
                  <img 
                    src={imageList[index]} 
                    alt={`${title} - Image ${index + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => handleImageError(index)}
                    onLoad={() => handleImageLoad(index, imageList[index])}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  
                  {/* Show "View all" button on last image if there are more */}
                  {index === 4 && validImages.length > 5 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        className="text-white hover:text-white hover:bg-black/20 text-lg font-semibold"
                        onClick={(e) => {
                          e.stopPropagation();
                          openPreview(0);
                        }}
                      >
                        <Expand className="h-5 w-5 mr-2" />
                        +{validImages.length - 5} more
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No image</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View all photos button - only on desktop */}
        <div className="hidden md:block absolute bottom-4 right-4">
          <Button
            onClick={() => openPreview(0)}
            variant="ghost"
            size="sm"
            className="bg-white/90 hover:bg-white text-gray-800 rounded-lg px-4 py-2 font-medium backdrop-blur-sm shadow-sm border border-gray-200/50"
          >
            <Expand className="h-4 w-4 mr-2" />
            Show all {validImages.length} photos
          </Button>
        </div>
      </div>

      {/* Image Gallery Popup - for desktop */}
      <ImageGalleryPopup
        images={validImages}
        isOpen={showGallery}
        onClose={() => setShowGallery(false)}
        title={title}
      />

      {/* Full-screen viewer - for mobile */}
      <MobileImageViewer
        images={validImages}
        initialIndex={viewerStartIndex}
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        title={title}
      />
    </>
  );
};

export default PropertyImageCollage;
