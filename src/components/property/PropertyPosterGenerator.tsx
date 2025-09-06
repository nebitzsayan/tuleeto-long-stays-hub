import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Share2, Image as ImageIcon } from 'lucide-react';
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
  const [posterGenerated, setPosterGenerated] = useState(false);

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

      // Property Title
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 28px Arial';
      const titleY = 130;
      const words = property.title.split(' ');
      const maxWidth = canvas.width - 60;
      let line = '';
      let lineY = titleY;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line, canvas.width / 2, lineY);
          line = words[i] + ' ';
          lineY += 35;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, lineY);

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
          
          setPosterGenerated(true);
          setIsGenerating(false);
          toast.success('Property poster generated successfully!');
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
          
          setPosterGenerated(true);
          setIsGenerating(false);
          toast.success('Property poster generated successfully!');
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

  const downloadPoster = () => {
    if (!canvasRef.current || !posterGenerated) return;
    
    const link = document.createElement('a');
    link.download = `property-poster-${property.id}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    toast.success('Poster downloaded successfully!');
  };

  const sharePoster = async () => {
    if (!canvasRef.current || !posterGenerated) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob && navigator.share) {
          const file = new File([blob], `property-poster-${property.id}.png`, { type: 'image/png' });
          await navigator.share({
            title: `Property Poster - ${property.title}`,
            text: `Check out this property: ${property.title}`,
            files: [file]
          });
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(`${window.location.origin}/property/${property.id}`);
          toast.success('Property link copied to clipboard!');
        }
      });
    } catch (error) {
      console.error('Error sharing poster:', error);
      toast.error('Failed to share poster');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ImageIcon className="h-4 w-4" />
          Generate Poster
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[95vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-4 py-3 border-b shrink-0">
            <DialogTitle className="text-center text-lg">Property Poster Generator</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Generate a professional poster for your property listing with Tuleeto branding
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Button controls - Mobile optimized */}
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <Button 
                  onClick={generatePoster} 
                  disabled={isGenerating}
                  className="gap-2 min-w-[120px]"
                  size="sm"
                >
                  {isGenerating ? 'Generating...' : 'Generate Poster'}
                </Button>
                
                {posterGenerated && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={downloadPoster}
                      variant="outline"
                      className="gap-2 min-w-[100px]"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">Download</span>
                    </Button>
                    
                    <Button 
                      onClick={sharePoster}
                      variant="outline"
                      className="gap-2 min-w-[80px]"
                      size="sm"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">Share</span>
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Canvas container - Mobile optimized */}
              <div className="flex justify-center w-full">
                <div className="w-full max-w-md sm:max-w-lg">
                  <canvas
                    ref={canvasRef}
                    className="border border-border rounded-lg shadow shadow-muted w-full h-auto"
                    style={{ 
                      maxWidth: '100%',
                      height: 'auto',
                      aspectRatio: '2/3'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};