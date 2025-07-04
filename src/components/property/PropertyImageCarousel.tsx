
import { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [fullscreenIndex, setFullscreenIndex] = useState<number>(0);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!api) return;
    
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Handle image load errors
  const handleImageError = (index: number) => {
    console.error(`Failed to load image at index ${index}:`, images[index]);
    setImageLoadErrors(prev => new Set(prev).add(index));
  };

  // Filter out images that failed to load
  const validImages = images.filter((_, index) => !imageLoadErrors.has(index));

  // Open fullscreen view
  const openFullscreen = (image: string, index: number) => {
    console.log('Opening fullscreen for image:', image);
    setFullscreenImage(image);
    setFullscreenIndex(index);
  };

  // Close fullscreen view
  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  // Navigate between images in fullscreen mode
  const navigateFullscreen = (direction: 'prev' | 'next') => {
    if (validImages.length <= 1) return;
    
    let newIndex = fullscreenIndex;
    if (direction === 'prev') {
      newIndex = fullscreenIndex > 0 ? fullscreenIndex - 1 : validImages.length - 1;
    } else {
      newIndex = fullscreenIndex < validImages.length - 1 ? fullscreenIndex + 1 : 0;
    }
    
    setFullscreenIndex(newIndex);
    setFullscreenImage(validImages[newIndex]);
    console.log('Navigating to image:', validImages[newIndex]);
  };

  // Use a placeholder if no valid images
  const imageList = validImages.length > 0 
    ? validImages 
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
                    onError={() => handleImageError(index)}
                    onLoad={() => console.log(`Successfully loaded image ${index + 1}:`, image)}
                  />
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="bg-white/70 hover:bg-white"
                      onClick={() => openFullscreen(image, index)}
                    >
                      <Maximize2 className="h-4 w-4 mr-1" /> View Full
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
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

      {/* Fullscreen Image Dialog - Gallery Style for Mobile */}
      <Dialog open={fullscreenImage !== null} onOpenChange={(open) => !open && closeFullscreen()}>
        <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-transparent shadow-none overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center bg-black/80 backdrop-blur-sm">
            {/* Close button - Top right, safe area */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-6 right-6 z-50 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm h-10 w-10 md:h-12 md:w-12"
              onClick={closeFullscreen}
            >
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </Button>
            
            {/* Navigation buttons - Only show if multiple images */}
            {validImages.length > 1 && (
              <>
                {/* Left navigation - Safe from image overlap */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm h-10 w-10 md:h-12 md:w-12"
                  onClick={() => navigateFullscreen('prev')}
                >
                  <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
                
                {/* Right navigation - Safe from image overlap */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm h-10 w-10 md:h-12 md:w-12"
                  onClick={() => navigateFullscreen('next')}
                >
                  <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </>
            )}
            
            {/* Image container - Perfect centering with safe margins */}
            {fullscreenImage && (
              <div className="flex items-center justify-center w-full h-full p-6 md:p-8">
                <img 
                  src={fullscreenImage} 
                  alt={title} 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  style={{
                    maxWidth: 'calc(100vw - 3rem)',
                    maxHeight: 'calc(100vh - 6rem)',
                  }}
                  onError={(e) => {
                    console.error('Fullscreen image failed to load:', fullscreenImage);
                    closeFullscreen();
                  }}
                  onLoad={() => console.log('Fullscreen image loaded successfully:', fullscreenImage)}
                />
              </div>
            )}
            
            {/* Image counter - Bottom center, safe area */}
            {validImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                <div className="text-white text-sm bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                  {fullscreenIndex + 1} / {validImages.length}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PropertyImageCarousel;
