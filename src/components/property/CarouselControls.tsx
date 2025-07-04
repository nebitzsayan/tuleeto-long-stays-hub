
import { Button } from "@/components/ui/button";
import { CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Maximize2 } from "lucide-react";

interface CarouselControlsProps {
  showNavigation: boolean;
  current: number;
  count: number;
  onViewFull: () => void;
}

const CarouselControls = ({ showNavigation, current, count, onViewFull }: CarouselControlsProps) => {
  return (
    <>
      {/* View Full button */}
      <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="secondary" 
          size="sm" 
          className="bg-white/70 hover:bg-white"
          onClick={onViewFull}
        >
          <Maximize2 className="h-4 w-4 mr-1" /> View Full
        </Button>
      </div>

      {/* Navigation controls */}
      {showNavigation && (
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
    </>
  );
};

export default CarouselControls;
