import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface SimpleMobileImagePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex: number;
  title: string;
}

const SimpleMobileImagePreview = ({ 
  isOpen, 
  onClose, 
  images, 
  initialIndex, 
  title 
}: SimpleMobileImagePreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
  }, [initialIndex, images.length]);

  const nextImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (!isOpen || !images.length) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <h3 className="text-white text-sm font-medium truncate">{title}</h3>
          {images.length > 1 && (
            <span className="text-white/80 text-xs bg-white/20 px-2 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-full"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <img
          src={images[currentIndex]}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
          style={{
            width: 'auto',
            height: 'auto',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
          onError={(e) => {
            console.error('Image failed to load:', images[currentIndex]);
            e.currentTarget.src = "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=800&h=500&q=80";
          }}
        />
      </div>

      {/* Navigation */}
      {images.length > 1 && (
        <div className="flex items-center justify-center space-x-4 p-4 bg-black/80">
          <button
            onClick={prevImage}
            className="text-white hover:bg-white/20 p-3 rounded-full flex items-center space-x-2"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Previous</span>
          </button>
          
          <button
            onClick={nextImage}
            className="text-white hover:bg-white/20 p-3 rounded-full flex items-center space-x-2"
          >
            <span className="text-sm">Next</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleMobileImagePreview;