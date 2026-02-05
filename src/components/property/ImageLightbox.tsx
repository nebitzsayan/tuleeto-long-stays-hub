 import { useState, useEffect, useRef, useCallback } from 'react';
 import { createPortal } from 'react-dom';
 import { X, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { getFullscreenUrl, getThumbUrl } from '@/lib/imagekitUrl';
 
 interface ImageLightboxProps {
   images: string[];
   initialIndex?: number;
   isOpen: boolean;
   onClose: () => void;
   title?: string;
   onOpenGrid?: () => void;
 }
 
 const ImageLightbox = ({
   images,
   initialIndex = 0,
   isOpen,
   onClose,
   title = 'Property',
   onOpenGrid,
 }: ImageLightboxProps) => {
   const [currentIndex, setCurrentIndex] = useState(initialIndex);
   const [isLoading, setIsLoading] = useState(true);
   const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
   const touchStartX = useRef<number>(0);
   const touchEndX = useRef<number>(0);
   const containerRef = useRef<HTMLDivElement>(null);
 
   // Update viewport size
   useEffect(() => {
     const updateSize = () => {
       setViewportSize({
         width: window.innerWidth,
         height: window.innerHeight,
       });
     };
     updateSize();
     window.addEventListener('resize', updateSize);
     window.addEventListener('orientationchange', updateSize);
     return () => {
       window.removeEventListener('resize', updateSize);
       window.removeEventListener('orientationchange', updateSize);
     };
   }, []);
 
   // Reset index when images or initialIndex changes
   useEffect(() => {
     if (isOpen) {
       setCurrentIndex(initialIndex);
       setIsLoading(true);
     }
   }, [isOpen, initialIndex]);
 
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
     if (!isOpen) return;
 
     const handleKeyDown = (e: KeyboardEvent) => {
       switch (e.key) {
         case 'Escape':
           onClose();
           break;
         case 'ArrowLeft':
           goToPrevious();
           break;
         case 'ArrowRight':
           goToNext();
           break;
       }
     };
 
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, currentIndex, images.length]);
 
   const goToNext = useCallback(() => {
     if (images.length <= 1) return;
     setIsLoading(true);
     setCurrentIndex((prev) => (prev + 1) % images.length);
   }, [images.length]);
 
   const goToPrevious = useCallback(() => {
     if (images.length <= 1) return;
     setIsLoading(true);
     setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
   }, [images.length]);
 
   // Touch handlers for swipe
   const handleTouchStart = (e: React.TouchEvent) => {
     touchStartX.current = e.targetTouches[0].clientX;
     touchEndX.current = e.targetTouches[0].clientX;
   };
 
   const handleTouchMove = (e: React.TouchEvent) => {
     touchEndX.current = e.targetTouches[0].clientX;
   };
 
   const handleTouchEnd = () => {
     const threshold = 50;
     const distance = touchStartX.current - touchEndX.current;
 
     if (distance > threshold) {
       goToNext();
     } else if (distance < -threshold) {
       goToPrevious();
     }
 
     touchStartX.current = 0;
     touchEndX.current = 0;
   };
 
   // Preload adjacent images
   useEffect(() => {
     if (!isOpen || images.length <= 1) return;
 
     const preloadIndices = [
       (currentIndex + 1) % images.length,
       (currentIndex - 1 + images.length) % images.length,
     ];
 
     preloadIndices.forEach((idx) => {
       const img = new Image();
       img.src = getFullscreenUrl(images[idx], viewportSize.width, viewportSize.height);
     });
   }, [currentIndex, images, isOpen, viewportSize]);
 
   if (!isOpen) return null;
 
   const currentImageUrl = getFullscreenUrl(
     images[currentIndex],
     viewportSize.width,
     viewportSize.height
   );
 
   const content = (
     <div
       ref={containerRef}
       className="fixed inset-0 z-[9999] bg-black flex flex-col"
       style={{
         paddingTop: 'env(safe-area-inset-top)',
         paddingBottom: 'env(safe-area-inset-bottom)',
         paddingLeft: 'env(safe-area-inset-left)',
         paddingRight: 'env(safe-area-inset-right)',
       }}
     >
       {/* Header */}
       <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
         <Button
           variant="ghost"
           size="icon"
           className="text-white hover:bg-white/20 h-10 w-10"
           onClick={onClose}
         >
           <X className="h-6 w-6" />
         </Button>
 
         <span className="text-white font-medium text-sm">
           {currentIndex + 1} / {images.length}
         </span>
 
         {onOpenGrid && images.length > 1 && (
           <Button
             variant="ghost"
             size="icon"
             className="text-white hover:bg-white/20 h-10 w-10"
             onClick={() => {
               onClose();
               onOpenGrid();
             }}
           >
             <Grid3X3 className="h-5 w-5" />
           </Button>
         )}
         {!onOpenGrid && <div className="w-10" />}
       </div>
 
       {/* Main image area */}
       <div
         className="flex-1 min-h-0 relative flex items-center justify-center"
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
         onTouchEnd={handleTouchEnd}
       >
         {/* Loading spinner */}
         {isLoading && (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
           </div>
         )}
 
         {/* The image - key prop forces re-render on index change */}
         <img
           key={currentIndex}
           src={currentImageUrl}
           alt={`${title} - Image ${currentIndex + 1}`}
           className="w-full h-full object-contain"
           onLoad={() => setIsLoading(false)}
           onError={() => setIsLoading(false)}
           draggable={false}
         />
 
         {/* Navigation arrows - hidden on very small screens, visible on larger */}
         {images.length > 1 && (
           <>
             <Button
               variant="ghost"
               size="icon"
               className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full hidden sm:flex"
               onClick={goToPrevious}
             >
               <ChevronLeft className="h-8 w-8" />
             </Button>
             <Button
               variant="ghost"
               size="icon"
               className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 rounded-full hidden sm:flex"
               onClick={goToNext}
             >
               <ChevronRight className="h-8 w-8" />
             </Button>
           </>
         )}
       </div>
 
       {/* Thumbnail filmstrip - hidden on very small screens */}
       {images.length > 1 && (
         <div className="flex-shrink-0 py-3 px-2 bg-black/80 backdrop-blur-sm hidden sm:block">
           <div className="flex gap-2 justify-center overflow-x-auto max-w-full">
             {images.map((img, idx) => (
               <button
                 key={idx}
                 onClick={() => {
                   setIsLoading(true);
                   setCurrentIndex(idx);
                 }}
                 className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${
                   idx === currentIndex
                     ? 'border-white opacity-100'
                     : 'border-transparent opacity-60 hover:opacity-100'
                 }`}
               >
                 <img
                   src={getThumbUrl(img)}
                   alt=""
                   className="w-full h-full object-cover"
                 />
               </button>
             ))}
           </div>
         </div>
       )}
 
       {/* Mobile dot indicators */}
       {images.length > 1 && images.length <= 10 && (
         <div className="flex-shrink-0 py-4 sm:hidden">
           <div className="flex gap-1.5 justify-center">
             {images.map((_, idx) => (
               <button
                 key={idx}
                 onClick={() => {
                   setIsLoading(true);
                   setCurrentIndex(idx);
                 }}
                 className={`rounded-full transition-all ${
                   idx === currentIndex
                     ? 'w-2.5 h-2.5 bg-white'
                     : 'w-2 h-2 bg-white/50'
                 }`}
               />
             ))}
           </div>
         </div>
       )}
     </div>
   );
 
   return createPortal(content, document.body);
 };
 
 export default ImageLightbox;