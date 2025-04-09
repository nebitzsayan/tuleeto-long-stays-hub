
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
}

const PropertyImageCarousel = ({ images, title }: PropertyImageCarouselProps) => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Use a placeholder if no images provided
  const imageList = images.length > 0 
    ? images 
    : ["https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&h=500&q=80"];

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
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {images.length > 1 && (
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
