import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { stripImageKitTransform, getPosterUrl, isImageKitUrl } from '@/lib/imagekitUrl';

interface PropertyPosterProps {
  property: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    features?: string[];
    owner_id: string;
    location: string;
    contactPhone?: string;
  };
  ownerName: string;
}

export const PropertyPosterGenerator = ({ property, ownerName }: PropertyPosterProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get optimized poster URL - strip transforms and get high quality
  const getOptimizedPosterUrl = (url: string): string => {
    if (!isImageKitUrl(url)) return url;
    const cleanUrl = stripImageKitTransform(url);
    return getPosterUrl(cleanUrl);
  };

  const generatePoster = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper function for minimal rounded corners
    const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // Helper to draw image maintaining aspect ratio (contain mode)
    const drawImageContain = (
      img: HTMLImageElement,
      slotX: number,
      slotY: number,
      slotWidth: number,
      slotHeight: number,
      borderRadius: number = 4
    ) => {
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const slotAspect = slotWidth / slotHeight;
      
      let drawWidth: number;
      let drawHeight: number;
      
      if (imgAspect > slotAspect) {
        // Image is wider than slot - fit to width
        drawWidth = slotWidth;
        drawHeight = slotWidth / imgAspect;
      } else {
        // Image is taller than slot - fit to height
        drawHeight = slotHeight;
        drawWidth = slotHeight * imgAspect;
      }
      
      // Center within slot
      const drawX = slotX + (slotWidth - drawWidth) / 2;
      const drawY = slotY + (slotHeight - drawHeight) / 2;
      
      ctx.save();
      drawRoundedRect(drawX, drawY, drawWidth, drawHeight, borderRadius);
      ctx.clip();
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();
    };

    // Set canvas size
    canvas.width = 800;
    canvas.height = 1200;

    // Pure white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const margin = 30;
      let currentY = 0;

      // 1. MINIMALIST HEADER - Clean "TO-LET" Banner
      const headerHeight = 60;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, currentY, canvas.width, headerHeight);
      
      // Thin bottom border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, currentY + headerHeight);
      ctx.lineTo(canvas.width, currentY + headerHeight);
      ctx.stroke();
      
      // TO-LET text - solid orange, bold
      ctx.fillStyle = '#ff6b35';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TO-LET', canvas.width / 2, currentY + 42);
      
      currentY += headerHeight + 20;

      // 2. CLEAN TITLE SECTION
      const titleSectionHeight = 100;
      
      // Thin border around section
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, currentY, canvas.width - margin * 2, titleSectionHeight);
      
      // Title - bold black, no gradient
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'left';
      
      // Word wrap for title
      const words = property.title.split(' ');
      const maxTitleWidth = canvas.width - margin * 2 - 40;
      let line = '';
      let lineY = currentY + 35;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxTitleWidth && i > 0) {
          ctx.fillText(line.trim(), margin + 20, lineY);
          line = words[i] + ' ';
          lineY += 32;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), margin + 20, lineY);
      
      // Location - gray text
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px Arial';
      ctx.fillText(`📍 ${property.location}`, margin + 20, currentY + 75);
      
      currentY += titleSectionHeight + 20;

      // 3. FLAT PRICE DISPLAY - No gradient, just solid orange
      const priceBoxHeight = 80;
      ctx.fillStyle = '#ff6b35';
      ctx.fillRect(margin, currentY, canvas.width - margin * 2, priceBoxHeight);
      
      // Price text - white on orange
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`₹${property.price?.toLocaleString()}`, canvas.width / 2, currentY + 42);
      ctx.font = '16px Arial';
      ctx.fillText('/month', canvas.width / 2, currentY + 62);
      
      currentY += priceBoxHeight + 30;

      // 4. CLEAN PROPERTY IMAGES
      const imagesToShow = property.images?.slice(0, 2) || [];
      
      if (imagesToShow.length > 0) {
        const imagePromises = imagesToShow.map((url) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            // Use optimized poster URL
            img.src = getOptimizedPosterUrl(url);
          });
        });

        try {
          const loadedImages = await Promise.all(imagePromises);
          
          if (loadedImages.length === 1) {
            const img = loadedImages[0];
            const slotWidth = canvas.width - margin * 2;
            const slotHeight = 350;
            const slotX = margin;
            
            // Draw white background for the slot
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(slotX - 4, currentY - 4, slotWidth + 8, slotHeight + 8);
            
            // Subtle shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;
            
            // Draw image maintaining aspect ratio
            drawImageContain(img, slotX, currentY, slotWidth, slotHeight, 6);
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;
            
            currentY += slotHeight + 30;
          } else if (loadedImages.length === 2) {
            const gap = 16;
            const slotWidth = (canvas.width - margin * 2 - gap) / 2;
            const slotHeight = 250;
            
            loadedImages.forEach((img, index) => {
              const slotX = margin + index * (slotWidth + gap);
              
              // White background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(slotX - 4, currentY - 4, slotWidth + 8, slotHeight + 8);
              
              // Subtle shadow
              ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
              ctx.shadowBlur = 8;
              ctx.shadowOffsetY = 2;
              
              // Draw image maintaining aspect ratio
              drawImageContain(img, slotX, currentY, slotWidth, slotHeight, 6);
              
              // Reset shadow
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetY = 0;
            });
            
            currentY += slotHeight + 30;
          }
        } catch (error) {
          console.error('Error loading images:', error);
        }
      }

      // 5. MINIMALIST AMENITIES SECTION
      if (property.features && property.features.length > 0) {
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Key Features', margin + 20, currentY + 5);
        
        currentY += 35;
        
        // Two-column layout, clean spacing
        const columnWidth = (canvas.width - margin * 2 - 30) / 2;
        
        property.features.slice(0, 6).forEach((feature, index) => {
          const col = index % 2;
          const row = Math.floor(index / 2);
          const x = margin + 20 + col * (columnWidth + 30);
          const y = currentY + row * 35;
          
          // Small solid orange circle bullet
          ctx.fillStyle = '#ff6b35';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Feature text
          ctx.fillStyle = '#1a1a1a';
          ctx.font = '15px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(feature, x + 15, y + 5);
        });
        
        const rows = Math.ceil(Math.min(property.features.length, 6) / 2);
        currentY += rows * 35 + 25;
      }

      // 6. CLEAN CONTACT CARD
      const contactCardHeight = 90;
      
      // Light gray flat background
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(margin, currentY, canvas.width - margin * 2, contactCardHeight);
      
      // Thin border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(margin, currentY, canvas.width - margin * 2, contactCardHeight);
      
      // Owner name - bold dark
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${ownerName || 'Property Owner'}`, canvas.width / 2, currentY + 30);
      
      // Contact - orange
      ctx.fillStyle = '#ff6b35';
      ctx.font = '18px Arial';
      const contactText = property.contactPhone || 'Contact for details';
      ctx.fillText(`📞 ${contactText}`, canvas.width / 2, currentY + 55);
      
      // Location - gray
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px Arial';
      ctx.fillText(`${property.location}`, canvas.width / 2, currentY + 75);
      
      currentY += contactCardHeight + 30;

      // 7. MINIMALIST QR CODE SECTION
      const propertyUrl = `${window.location.origin}/property/${property.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(propertyUrl, {
        width: 150,
        margin: 1,
        color: {
          dark: '#1a1a1a',
          light: '#ffffff'
        }
      });

      const qrImg = new Image();
      qrImg.onload = () => {
        const qrSize = 150;
        const qrX = (canvas.width - qrSize) / 2;
        
        // Optional thin border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(qrX - 1, currentY - 1, qrSize + 2, qrSize + 2);
        
        ctx.drawImage(qrImg, qrX, currentY, qrSize, qrSize);
        
        currentY += qrSize + 15;
        
        // Clean label text
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SCAN FOR MORE INFO', canvas.width / 2, currentY);
        
        currentY += 30;
        
        // 8. PROFESSIONAL FOOTER - Flat design
        const footerHeight = 70;
        const footerY = canvas.height - footerHeight;
        
        // Solid dark charcoal background (no gradient)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, footerY, canvas.width, footerHeight);
        
        // Brand text - orange
        ctx.fillStyle = '#ff6b35';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TULEETO.IN', canvas.width / 2, footerY + 35);
        
        // Tagline - light gray
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.fillText('Your Trusted Property Platform', canvas.width / 2, footerY + 55);
        
        setIsGenerating(false);
      };
      qrImg.src = qrCodeDataUrl;

    } catch (error) {
      console.error('Error generating poster:', error);
      toast.error('Failed to generate poster. Please try again.');
      setIsGenerating(false);
    }
  };

  const generateAndDownloadPoster = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    await generatePoster();
    
    // After generation is complete, automatically download
    setTimeout(() => {
      if (canvasRef.current) {
        const link = document.createElement('a');
        link.download = `property-poster-${property.id}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
        toast.success('Poster downloaded successfully!');
      }
    }, 500); // Small delay to ensure canvas is ready
  };

  const sharePoster = async () => {
    if (!canvasRef.current) return;

    try {
      // Check if Web Share API is supported and can handle files
      if (navigator.share && navigator.canShare) {
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `property-poster-${property.id}.png`, { type: 'image/png' });
            
            // Check if the browser can share files
            if (navigator.canShare({ files: [file] })) {
              try {
                await navigator.share({
                  title: `Property Poster - ${property.title}`,
                  text: `Check out this property: ${property.title}`,
                  files: [file]
                });
                toast.success('Poster shared successfully!');
                return;
              } catch (shareError) {
                console.error('File share failed:', shareError);
              }
            }
          }
          
          // Fallback to URL sharing if file sharing fails
          try {
            await navigator.share({
              title: `Property Poster - ${property.title}`,
              text: `Check out this property: ${property.title}`,
              url: `${window.location.origin}/property/${property.id}`
            });
            toast.success('Property link shared successfully!');
          } catch (urlShareError) {
            // Final fallback to clipboard
            fallbackToCopy();
          }
        });
      } else {
        // Fallback for browsers without Web Share API
        fallbackToCopy();
      }
    } catch (error) {
      console.error('Error sharing poster:', error);
      fallbackToCopy();
    }
  };

  const fallbackToCopy = () => {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.id}`;
      navigator.clipboard.writeText(propertyUrl);
      toast.success('Property link copied to clipboard!');
    } catch (clipboardError) {
      toast.error('Unable to share. Please copy the link manually.');
    }
  };

  return (
    <div>
      <Button 
        onClick={generateAndDownloadPoster} 
        disabled={isGenerating}
        variant="outline" 
        size="sm" 
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {isGenerating ? 'Generating Poster...' : 'Generate Poster'}
      </Button>
      
      {/* Hidden canvas for generation */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};
