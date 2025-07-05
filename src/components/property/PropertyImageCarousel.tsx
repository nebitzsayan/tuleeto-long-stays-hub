
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Expand } from "lucide-react";
import { useImageHandling } from "@/hooks/useImageHandling";
import { useImagePreview } from "@/hooks/useImagePreview";
import ImagePreviewModal from "./ImagePreviewModal";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
}

const PropertyImageCarousel = ({ images, title }: PropertyImageCarouselProps) => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const { validImages, imageList, handleImageError, handleImageLoad } = useImageHandling(images);
  const { isPreviewOpen, previewIndex, openPreview, closePreview } = useImagePreview();

  useEffect(() => {
    if (!api) return;
    
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <>
      <div className="relative overflow-hidden rounded-lg">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {imageList.map((image, index) => (
              <CarouselItem key={index}>
                <div className="relative h-[400px] w-full group">
                  <img 
                    src={image} 
                    alt={`${title} - Image ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                    onError={() => handleImageError(index)}
                    onLoad={() => handleImageLoad(index, image)}
                    onClick={() => openPreview(index)}
                  />
                  
                  {/* Expand button - only visible on hover */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openPreview(index)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Expand className="h-4 w-4" />
                  </Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation controls */}
          {imageList.length > 1 && (
            <>
              <CarouselPrevious 
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white"
              />
              <CarouselNext 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white"
              />
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-sm px-2 py-1 rounded">
                {current} / {count}
              </div>
            </>
          )}
        </Carousel>
      </div>

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        images={validImages}
        initialIndex={previewIndex}
        title={title}
      />
    </>
  );
};

export default PropertyImageCarousel;
