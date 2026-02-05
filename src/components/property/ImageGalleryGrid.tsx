 import { useState, useEffect } from 'react';
 import { createPortal } from 'react-dom';
 import { X } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { getThumbUrl } from '@/lib/imagekitUrl';
 import ImageLightbox from './ImageLightbox';
 
 interface ImageGalleryGridProps {
   images: string[];
   isOpen: boolean;
   onClose: () => void;
   title?: string;
 }
 
 const ImageGalleryGrid = ({
   images,
   isOpen,
   onClose,
   title = 'Property',
 }: ImageGalleryGridProps) => {
   const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
 
   // Lock body scroll when open
   useEffect(() => {
     if (isOpen) {
       const originalOverflow = document.body.style.overflow;
       document.body.style.overflow = 'hidden';
       return () => {
         document.body.style.overflow = originalOverflow;
       };
     }
   }, [isOpen]);
 
   // Keyboard navigation
   useEffect(() => {
     if (!isOpen || selectedIndex !== null) return;
 
     const handleKeyDown = (e: KeyboardEvent) => {
       if (e.key === 'Escape') {
         onClose();
       }
     };
 
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, selectedIndex, onClose]);
 
   if (!isOpen) return null;
 
   const content = (
     <div
       className="fixed inset-0 z-[9998] bg-background flex flex-col"
       style={{
         paddingTop: 'env(safe-area-inset-top)',
         paddingBottom: 'env(safe-area-inset-bottom)',
         paddingLeft: 'env(safe-area-inset-left)',
         paddingRight: 'env(safe-area-inset-right)',
       }}
     >
       {/* Header */}
       <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b bg-background">
         <h2 className="font-semibold text-lg truncate">{title}</h2>
         <div className="flex items-center gap-2">
           <span className="text-muted-foreground text-sm">
             {images.length} photos
           </span>
           <Button
             variant="ghost"
             size="icon"
             className="h-10 w-10"
             onClick={onClose}
           >
             <X className="h-5 w-5" />
           </Button>
         </div>
       </div>
 
       {/* Grid */}
       <div className="flex-1 overflow-y-auto p-2 sm:p-4">
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
           {images.map((img, idx) => (
             <button
               key={idx}
               onClick={() => setSelectedIndex(idx)}
               className="aspect-[4/3] rounded-lg overflow-hidden bg-muted hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary"
             >
               <img
                 src={getThumbUrl(img)}
                 alt={`${title} - Image ${idx + 1}`}
                 className="w-full h-full object-cover"
                 loading="lazy"
               />
             </button>
           ))}
         </div>
       </div>
 
       {/* Lightbox for selected image */}
       <ImageLightbox
         images={images}
         initialIndex={selectedIndex ?? 0}
         isOpen={selectedIndex !== null}
         onClose={() => setSelectedIndex(null)}
         title={title}
       />
     </div>
   );
 
   return createPortal(content, document.body);
 };
 
 export default ImageGalleryGrid;