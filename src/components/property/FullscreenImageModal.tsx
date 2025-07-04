
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface FullscreenImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: string | null;
  title: string;
  currentIndex: number;
  totalImages: number;
  onNavigate: (direction: 'prev' | 'next') => void;
  showNavigation: boolean;
}

const FullscreenImageModal = ({
  isOpen,
  onClose,
  image,
  title,
  currentIndex,
  totalImages,
  onNavigate,
  showNavigation
}: FullscreenImageModalProps) => {
  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-none w-screen h-screen p-0 border-0 bg-transparent shadow-none overflow-hidden">
        <div className="relative w-full h-full flex items-center justify-center bg-black/40 backdrop-blur-sm">
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white text-black rounded-full h-10 w-10 md:h-12 md:w-12"
            onClick={onClose}
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          
          {/* Navigation buttons */}
          {showNavigation && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white text-black rounded-full h-10 w-10 md:h-12 md:w-12"
                onClick={() => onNavigate('prev')}
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/90 hover:bg-white text-black rounded-full h-10 w-10 md:h-12 md:w-12"
                onClick={() => onNavigate('next')}
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </>
          )}
          
          {/* Image container */}
          <div className="flex items-center justify-center w-full h-full p-4">
            <img 
              src={image} 
              alt={title} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{
                maxWidth: 'calc(100vw - 8rem)',
                maxHeight: 'calc(100vh - 8rem)',
              }}
              onError={() => {
                console.error('Fullscreen image failed to load:', image);
                onClose();
              }}
              onLoad={() => console.log('Fullscreen image loaded successfully:', image)}
            />
          </div>
          
          {/* Image counter */}
          {showNavigation && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
              <div className="text-white text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
                {currentIndex + 1} / {totalImages}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenImageModal;
