
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import FullscreenImageModal from "./FullscreenImageModal";
import CarouselControls from "./CarouselControls";
import { useImageHandling } from "@/hooks/useImageHandling";
import { useFullscreenImage } from "@/hooks/useFullscreenImage";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
}

const PropertyImageCarousel = ({ images, title }: PropertyImageCarouselProps) => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const { validImages, imageList, handleImageError, handleImageLoad } = useImageHandling(images);
  const { 
    fullscreenImage, 
    fullscreenIndex, 
    openFullscreen, 
    closeFullscreen, 
    navigateFullscreen 
  } = useFullscreenImage(validImages);

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
                    className="w-full h-full object-cover rounded-lg"
                    onError={() => handleImageError(index)}
                    onLoad={() => handleImageLoad(index, image)}
                  />
                  <CarouselControls
                    showNavigation={imageList.length > 1}
                    current={current}
                    count={count}
                    onViewFull={() => openFullscreen(image, index)}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <FullscreenImageModal
        isOpen={fullscreenImage !== null}
        onClose={closeFullscreen}
        image={fullscreenImage}
        title={title}
        currentIndex={fullscreenIndex}
        totalImages={validImages.length}
        onNavigate={navigateFullscreen}
        showNavigation={validImages.length > 1}
      />
    </>
  );
};

export default PropertyImageCarousel;
