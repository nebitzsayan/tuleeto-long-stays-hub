
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ScrollableImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  title: string;
}

const ScrollableImagePreview = ({ isOpen, onClose, images, title }: ScrollableImagePreviewProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!images.length) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full p-0 bg-white border-none">
        {/* Header with close button */}
        <div className="sticky top-0 z-10 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title} - All Images</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Scrollable image grid */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
            {images.map((image, index) => (
              <div 
                key={index}
                className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-sm border"
              >
                <img
                  src={image}
                  alt={`${title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index < 3 ? "eager" : "lazy"}
                />
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1} / {images.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScrollableImagePreview;
