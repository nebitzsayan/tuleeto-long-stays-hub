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

    // Set canvas size (A4-like ratio, optimized for mobile)
    canvas.width = 800;
    canvas.height = 1200;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      // Header - TO-LET banner
      ctx.fillStyle = '#f97316'; // Orange background
      ctx.fillRect(0, 0, canvas.width, 80);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TO-LET', canvas.width / 2, 55);

      // Property Title with better wrapping
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 26px Arial';
      const titleY = 130;
      const words = property.title.split(' ');
      const maxWidth = canvas.width - 80; // More padding
      let line = '';
      let lineY = titleY;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line.trim(), canvas.width / 2, lineY);
          line = words[i] + ' ';
          lineY += 32;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), canvas.width / 2, lineY);

      // Rent Price
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`₹${property.price.toLocaleString()}/month`, canvas.width / 2, lineY + 60);

      // Property Images Section (max 2 images)
      const imagesToShow = property.images?.slice(0, 2) || [];
      let currentY = lineY + 120;
      
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
            // Single image - full width
            const img = loadedImages[0];
            const imgWidth = 700;
            const imgHeight = 300;
            const imgX = (canvas.width - imgWidth) / 2;
            ctx.drawImage(img, imgX, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 20;
          } else if (loadedImages.length === 2) {
            // Two images side by side
            const imgWidth = 340;
            const imgHeight = 250;
            const spacing = 20;
            const totalWidth = imgWidth * 2 + spacing;
            const startX = (canvas.width - totalWidth) / 2;
            
            ctx.drawImage(loadedImages[0], startX, currentY, imgWidth, imgHeight);
            ctx.drawImage(loadedImages[1], startX + imgWidth + spacing, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 20;
          }
        } catch (error) {
          console.error('Error loading images:', error);
          // Show placeholder text if images fail to load
          ctx.fillStyle = '#6b7280';
          ctx.font = '18px Arial';
          ctx.fillText('Property Images', canvas.width / 2, currentY + 50);
          currentY += 100;
        }
      }

      // Amenities Section
      if (property.features && property.features.length > 0) {
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 22px Arial';
        ctx.fillText('Amenities', canvas.width / 2, currentY + 40);
        currentY += 70;

        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const amenitiesPerRow = 2;
        const amenityHeight = 25;
        const amenityWidth = 350;
        
        property.features.slice(0, 8).forEach((feature, index) => {
          const col = index % amenitiesPerRow;
          const row = Math.floor(index / amenitiesPerRow);
          const x = 50 + col * amenityWidth;
          const y = currentY + row * amenityHeight;
          
          // Add bullet point
          ctx.fillStyle = '#f97316';
          ctx.fillText('•', x, y);
          ctx.fillStyle = '#1f2937';
          ctx.fillText(feature, x + 20, y);
        });
        
        currentY += Math.ceil(Math.min(property.features.length, 8) / amenitiesPerRow) * amenityHeight + 30;
      }

      // Owner Info Section with border box
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      const ownerBoxY = currentY + 20;
      const ownerBoxHeight = property.contactPhone ? 100 : 80;
      ctx.strokeRect(50, ownerBoxY, canvas.width - 100, ownerBoxHeight);
      
      ctx.textAlign = 'center';
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Property Owner: ${ownerName}`, canvas.width / 2, ownerBoxY + 30);
      
      // Add contact phone if available
      if (property.contactPhone) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#f97316';
        ctx.fillText(`Contact: ${property.contactPhone}`, canvas.width / 2, ownerBoxY + 55);
      }
      
      currentY += ownerBoxHeight + 40;

      // Location text
      ctx.font = '18px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`Location: ${property.location}`, canvas.width / 2, currentY);
      currentY += 50;

      // QR Code Section
      const propertyUrl = `${window.location.origin}/property/${property.id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(propertyUrl, {
        width: 150,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });

      const qrImg = new Image();
      qrImg.onload = () => {
        const qrSize = 120;
        const qrX = (canvas.width - qrSize) / 2;
        ctx.drawImage(qrImg, qrX, currentY, qrSize, qrSize);
        
        // QR Code label
        ctx.font = '14px Arial';
        ctx.fillStyle = '#1f2937';
        ctx.fillText('Scan QR Code for Property Details', canvas.width / 2, currentY + qrSize + 20);
        
        currentY += qrSize + 40;
        
        // Add Tuleeto logo and branding at the bottom
        const logoImg = new Image();
        logoImg.onload = () => {
          const logoSize = 40;
          const logoX = (canvas.width - logoSize) / 2;
          ctx.drawImage(logoImg, logoX, currentY, logoSize, logoSize);
          
          // Tuleeto branding text
          ctx.font = 'bold 18px Arial';
          ctx.fillStyle = '#f97316';
          ctx.textAlign = 'center';
          ctx.fillText('TULEETO.IN', canvas.width / 2, currentY + logoSize + 25);
          
          // Add subtitle
          ctx.font = '12px Arial';
          ctx.fillStyle = '#6b7280';
          ctx.fillText('Your Trusted Property Partner', canvas.width / 2, currentY + logoSize + 45);
          
          setIsGenerating(false);
        };
        logoImg.onerror = () => {
          // Fallback without logo
          ctx.font = 'bold 20px Arial';
          ctx.fillStyle = '#f97316';
          ctx.textAlign = 'center';
          ctx.fillText('TULEETO.IN', canvas.width / 2, currentY + 25);
          
          ctx.font = '14px Arial';
          ctx.fillStyle = '#6b7280';
          ctx.fillText('Your Trusted Property Partner', canvas.width / 2, currentY + 50);
          
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
        {isGenerating ? 'Generating PDF...' : 'Generate PDF'}
      </Button>
      
      {/* Hidden canvas for generation */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};