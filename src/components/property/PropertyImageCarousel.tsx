
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useImageHandling } from "@/hooks/useImageHandling";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
}

const PropertyImageCarousel = ({ images, title }: PropertyImageCarouselProps) => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const { validImages, imageList, handleImageError, handleImageLoad } = useImageHandling(images);

  useEffect(() => {
    if (!api) return;
    
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {imageList.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative h-[400px] w-full">
                <img 
                  src={image} 
                  alt={`${title} - Image ${index + 1}`} 
                  className="w-full h-full object-cover rounded-lg"
                  onError={() => handleImageError(index)}
                  onLoad={() => handleImageLoad(index, image)}
                />
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
  );
};

export default PropertyImageCarousel;
