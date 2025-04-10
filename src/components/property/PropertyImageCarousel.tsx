
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Maximize2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PropertyImageCarouselProps {
  images: string[];
  title: string;
}

const PropertyImageCarousel = ({ images, title }: PropertyImageCarouselProps) => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (!api) return;
    
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Open fullscreen view
  const openFullscreen = (image: string) => {
    setFullscreenImage(image);
  };

  // Close fullscreen view
  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  // Use a placeholder if no images provided
  const imageList = images.length > 0 
    ? images 
    : ["https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&h=500&q=80"];

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
                  />
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white/70 hover:bg-white"
                      onClick={() => openFullscreen(image)}
                    >
                      <Maximize2 className="h-4 w-4 mr-1" /> View Full
                    </Button>
                  </div>
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

      {/* Fullscreen Image Dialog */}
      <Dialog open={fullscreenImage !== null} onOpenChange={(open) => !open && closeFullscreen()}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={closeFullscreen}
            >
              <X className="h-4 w-4" />
            </Button>
            {fullscreenImage && (
              <img 
                src={fullscreenImage} 
                alt={title} 
                className="max-h-[85vh] max-w-full object-contain mx-auto"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyImageCarousel;
