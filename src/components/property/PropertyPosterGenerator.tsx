import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

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

  const generatePoster = async () => {
    if (!canvasRef.current) return;
    
    setIsGenerating(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper function to draw rounded rectangles
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

    // Set canvas size (professional poster dimensions)
    canvas.width = 800;
    canvas.height = 1200;

    // Clear canvas with light background
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // 1. GRADIENT HEADER - TO-LET BANNER
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 100);
      gradient.addColorStop(0, '#ff7043');
      gradient.addColorStop(1, '#f4511e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, 100);
      
      // Add shadow to header
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      
      // Header text with better styling
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.letterSpacing = '4px';
      ctx.fillText('TO-LET', canvas.width / 2, 65);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // 2. TITLE CARD WITH SHADOW
      let currentY = 120;
      
      // Draw white card for title
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#ffffff';
      drawRoundedRect(40, currentY, 720, 120, 12);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Property Title with gradient text effect
      const titleGradient = ctx.createLinearGradient(0, currentY + 40, 0, currentY + 80);
      titleGradient.addColorStop(0, '#1f2937');
      titleGradient.addColorStop(1, '#4b5563');
      ctx.fillStyle = titleGradient;
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      
      // Multi-line title with word wrap
      const words = property.title.split(' ');
      const maxWidth = 680;
      let line = '';
      let lineY = currentY + 50;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(line.trim(), canvas.width / 2, lineY);
          line = words[i] + ' ';
          lineY += 35;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), canvas.width / 2, lineY);

      // Location with icon symbol
      ctx.font = '18px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`📍 ${property.location}`, canvas.width / 2, lineY + 35);
      
      currentY += 150;

      // 3. PRICE HIGHLIGHT BOX
      ctx.shadowColor = 'rgba(249, 115, 22, 0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      
      const priceGradient = ctx.createLinearGradient(250, currentY, 550, currentY + 70);
      priceGradient.addColorStop(0, '#f97316');
      priceGradient.addColorStop(1, '#ea580c');
      ctx.fillStyle = priceGradient;
      drawRoundedRect(250, currentY, 300, 70, 35);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(`₹${property.price.toLocaleString()}`, canvas.width / 2, currentY + 35);
      ctx.font = '16px Arial';
      ctx.fillText('/month', canvas.width / 2, currentY + 55);
      
      currentY += 100;

      // 4. PROPERTY IMAGES WITH FRAMES
      const imagesToShow = property.images?.slice(0, 2) || [];
      
      if (imagesToShow.length > 0) {
        const imagePromises = imagesToShow.map((url) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
          });
        });

        try {
          const loadedImages = await Promise.all(imagePromises);
          
          if (loadedImages.length === 1) {
            const img = loadedImages[0];
            const maxWidth = 680;
            const maxHeight = 320;
            
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            let imgWidth = maxWidth;
            let imgHeight = imgWidth / aspectRatio;
            
            if (imgHeight > maxHeight) {
              imgHeight = maxHeight;
              imgWidth = imgHeight * aspectRatio;
            }
            
            const imgX = (canvas.width - imgWidth) / 2;
            
            // Draw white frame
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 8;
            ctx.fillStyle = '#ffffff';
            drawRoundedRect(imgX - 12, currentY - 12, imgWidth + 24, imgHeight + 24, 12);
            ctx.fill();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            // Draw image with rounded corners
            ctx.save();
            drawRoundedRect(imgX, currentY, imgWidth, imgHeight, 8);
            ctx.clip();
            ctx.drawImage(img, imgX, currentY, imgWidth, imgHeight);
            ctx.restore();
            
            currentY += imgHeight + 40;
          } else if (loadedImages.length === 2) {
            const maxWidth = 320;
            const maxHeight = 240;
            const spacing = 40;
            
            const img1 = loadedImages[0];
            const img2 = loadedImages[1];
            
            let img1AspectRatio = img1.naturalWidth / img1.naturalHeight;
            let img1Width = maxWidth;
            let img1Height = img1Width / img1AspectRatio;
            
            if (img1Height > maxHeight) {
              img1Height = maxHeight;
              img1Width = img1Height * img1AspectRatio;
            }
            
            let img2AspectRatio = img2.naturalWidth / img2.naturalHeight;
            let img2Width = maxWidth;
            let img2Height = img2Width / img2AspectRatio;
            
            if (img2Height > maxHeight) {
              img2Height = maxHeight;
              img2Width = img2Height * img2AspectRatio;
            }
            
            const finalHeight = Math.max(img1Height, img2Height);
            const totalWidth = img1Width + img2Width + spacing;
            const startX = (canvas.width - totalWidth) / 2;
            
            // Draw frames for both images
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 8;
            ctx.fillStyle = '#ffffff';
            
            // Frame 1
            drawRoundedRect(startX - 12, currentY - 12, img1Width + 24, img1Height + 24, 12);
            ctx.fill();
            
            // Frame 2
            drawRoundedRect(startX + img1Width + spacing - 12, currentY - 12, img2Width + 24, img2Height + 24, 12);
            ctx.fill();
            
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            // Draw images
            const img1Y = currentY + (finalHeight - img1Height) / 2;
            const img2Y = currentY + (finalHeight - img2Height) / 2;
            
            ctx.save();
            drawRoundedRect(startX, img1Y, img1Width, img1Height, 8);
            ctx.clip();
            ctx.drawImage(img1, startX, img1Y, img1Width, img1Height);
            ctx.restore();
            
            ctx.save();
            drawRoundedRect(startX + img1Width + spacing, img2Y, img2Width, img2Height, 8);
            ctx.clip();
            ctx.drawImage(img2, startX + img1Width + spacing, img2Y, img2Width, img2Height);
            ctx.restore();
            
            currentY += finalHeight + 40;
          }
        } catch (error) {
          console.error('Error loading images:', error);
          currentY += 50;
        }
      }

      // 5. AMENITIES SECTION WITH CARDS
      if (property.features && property.features.length > 0) {
        currentY += 20;
        
        // Section header with decorative line
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('✨ Amenities & Features', canvas.width / 2, currentY);
        
        currentY += 40;

        const amenityCardWidth = 340;
        const amenityCardHeight = 45;
        const cardsPerRow = 2;
        const horizontalSpacing = 20;
        const verticalSpacing = 15;
        
        property.features.slice(0, 8).forEach((feature, index) => {
          const col = index % cardsPerRow;
          const row = Math.floor(index / cardsPerRow);
          const x = 50 + col * (amenityCardWidth + horizontalSpacing);
          const y = currentY + row * (amenityCardHeight + verticalSpacing);
          
          // Draw amenity card with subtle shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#ffffff';
          drawRoundedRect(x, y, amenityCardWidth, amenityCardHeight, 8);
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          
          // Icon circle
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.arc(x + 25, y + 22, 12, 0, Math.PI * 2);
          ctx.fill();
          
          // Check icon
          ctx.fillStyle = '#f97316';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('✓', x + 25, y + 28);
          
          // Feature text
          ctx.fillStyle = '#1f2937';
          ctx.font = '16px Arial';
          ctx.textAlign = 'left';
          ctx.fillText(feature, x + 45, y + 28);
        });
        
        const rows = Math.ceil(Math.min(property.features.length, 8) / cardsPerRow);
        currentY += rows * (amenityCardHeight + verticalSpacing) + 30;
      }

      // 6. CONTACT CARD
      currentY += 20;
      
      ctx.shadowColor = 'rgba(249, 115, 22, 0.2)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      
      const contactGradient = ctx.createLinearGradient(60, currentY, 740, currentY + 100);
      contactGradient.addColorStop(0, '#fef3c7');
      contactGradient.addColorStop(1, '#fed7aa');
      ctx.fillStyle = contactGradient;
      drawRoundedRect(60, currentY, 680, 100, 12);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(`👤 ${ownerName}`, canvas.width / 2, currentY + 35);
      
      if (property.contactPhone) {
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#f97316';
        ctx.fillText(`📞 ${property.contactPhone}`, canvas.width / 2, currentY + 65);
      } else {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Property Owner', canvas.width / 2, currentY + 65);
      }
      
      currentY += 130;

      // 7. DECORATIVE QR CODE SECTION
      const propertyUrl = `${window.location.origin}/property/${property.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(propertyUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });

      const qrImg = new Image();
      qrImg.onload = () => {
        // QR Container with decorative border
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 6;
        
        const qrContainerSize = 160;
        const qrX = (canvas.width - qrContainerSize) / 2;
        
        // Draw decorative container
        ctx.fillStyle = '#ffffff';
        drawRoundedRect(qrX - 20, currentY - 20, qrContainerSize + 40, qrContainerSize + 60, 12);
        ctx.fill();
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Draw QR code
        const qrSize = 140;
        const qrImgX = (canvas.width - qrSize) / 2;
        ctx.drawImage(qrImg, qrImgX, currentY, qrSize, qrSize);
        
        // "Scan Me" label with icon
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#1f2937';
        ctx.textAlign = 'center';
        ctx.fillText('📱 Scan for Full Details', canvas.width / 2, currentY + qrSize + 30);
        
        currentY += qrContainerSize + 80;
        
        // 8. PROFESSIONAL FOOTER
        const footerHeight = 100;
        const footerY = canvas.height - footerHeight;
        
        // Footer gradient background
        const footerGradient = ctx.createLinearGradient(0, footerY, 0, canvas.height);
        footerGradient.addColorStop(0, '#1f2937');
        footerGradient.addColorStop(1, '#111827');
        ctx.fillStyle = footerGradient;
        ctx.fillRect(0, footerY, canvas.width, footerHeight);
        
        // Try to load and draw logo
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoSize = 50;
          const logoX = (canvas.width - logoSize) / 2;
          ctx.drawImage(logoImg, logoX, footerY + 15, logoSize, logoSize);
          
          // Brand name
          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#f97316';
          ctx.textAlign = 'center';
          ctx.fillText('TULEETO.IN', canvas.width / 2, footerY + 80);
          
          // Add decorative dots
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(canvas.width / 2 - 120, footerY + 75, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(canvas.width / 2 + 120, footerY + 75, 3, 0, Math.PI * 2);
          ctx.fill();
          
          setIsGenerating(false);
        };
        
        logoImg.onerror = () => {
          // Fallback without logo
          ctx.font = 'bold 28px Arial';
          ctx.fillStyle = '#f97316';
          ctx.textAlign = 'center';
          ctx.fillText('TULEETO.IN', canvas.width / 2, footerY + 40);
          
          ctx.font = '14px Arial';
          ctx.fillStyle = '#9ca3af';
          ctx.fillText('Your Trusted Property Partner', canvas.width / 2, footerY + 65);
          
          // Decorative line
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(250, footerY + 25);
          ctx.lineTo(550, footerY + 25);
          ctx.stroke();
          
          setIsGenerating(false);
        };
        
        logoImg.src = '/images-resources/d5b8b33e-0c09-4345-8859-4dc176bc39a3.png';
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