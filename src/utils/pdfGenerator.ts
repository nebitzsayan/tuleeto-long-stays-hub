
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface PropertyPosterData {
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  features: string[];
  ownerName: string;
  contactPhone: string;
  images: string[];
  averageRating?: number;
  reviewCount?: number;
  propertyId?: string;
}

const loadImageAsBase64 = (url: string): Promise<{dataURL: string, width: number, height: number}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx?.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve({
          dataURL,
          width: img.width,
          height: img.height
        });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

const generateQRCode = async (url: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(url, {
      width: 80,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};

const encodeText = (text: string): string => {
  return text
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .trim();
};

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 0; // Start at the very top
  
  // Header - TO-LET with Logo
  pdf.setFillColor(255, 102, 0);
  pdf.rect(0, yPosition, pageWidth, 35, 'F');
  
  // Add logo on the left side of header
  try {
    const logoData = await loadImageAsBase64('/images-resources/d5b8b33e-0c09-4345-8859-4dc176bc39a3.png');
    const logoSize = 25;
    pdf.addImage(logoData.dataURL, 'PNG', 10, yPosition + 5, logoSize, logoSize);
  } catch (error) {
    console.log('Logo not loaded, continuing without it');
  }
  
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition + 22);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'RENT AVAILABLE';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, yPosition + 30);
  
  yPosition += 50;
  
  // Location (Address only - no title)
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  const locationLines = pdf.splitTextToSize(encodeText(property.location), usableWidth);
  locationLines.forEach((line: string) => {
    pdf.text(line, margin, yPosition);
    yPosition += 7;
  });
  
  yPosition += 10;
  
  // Price
  pdf.setFontSize(24);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const priceText = `Rs ${property.price.toLocaleString('en-IN')}/month`;
  pdf.text(priceText, margin, yPosition);
  
  yPosition += 25;
  
  // Property Images with proper aspect ratio
  if (property.images && property.images.length > 0) {
    try {
      const imagesToShow = property.images.slice(0, 2); // Max 2 images
      const maxImageWidth = 65; // Medium size
      const imageSpacing = 10;
      
      if (imagesToShow.length === 1) {
        // Single image - centered
        try {
          const imageData = await loadImageAsBase64(imagesToShow[0]);
          const aspectRatio = imageData.height / imageData.width;
          const imageWidth = maxImageWidth;
          const imageHeight = imageWidth * aspectRatio;
          const imageX = (pageWidth - imageWidth) / 2;
          
          pdf.addImage(imageData.dataURL, 'JPEG', imageX, yPosition, imageWidth, imageHeight);
          yPosition += imageHeight + 15;
        } catch (error) {
          // Single placeholder
          const imageHeight = 45;
          const imageX = (pageWidth - maxImageWidth) / 2;
          pdf.setFillColor(240, 240, 240);
          pdf.rect(imageX, yPosition, maxImageWidth, imageHeight, 'F');
          pdf.setTextColor(120, 120, 120);
          pdf.setFontSize(8);
          pdf.text('No Image', imageX + maxImageWidth/2 - 10, yPosition + imageHeight/2);
          yPosition += imageHeight + 15;
        }
      } else if (imagesToShow.length >= 2) {
        // Two images side by side
        const imageWidth = (usableWidth - imageSpacing) / 2;
        let maxImageHeight = 0;
        
        for (let i = 0; i < 2; i++) {
          const imageX = margin + i * (imageWidth + imageSpacing);
          
          try {
            const imageData = await loadImageAsBase64(imagesToShow[i]);
            const aspectRatio = imageData.height / imageData.width;
            const adjustedImageWidth = Math.min(imageWidth, maxImageWidth);
            const imageHeight = adjustedImageWidth * aspectRatio;
            maxImageHeight = Math.max(maxImageHeight, imageHeight);
            
            pdf.addImage(imageData.dataURL, 'JPEG', imageX, yPosition, adjustedImageWidth, imageHeight);
          } catch (error) {
            // Placeholder for failed image
            const imageHeight = 45;
            maxImageHeight = Math.max(maxImageHeight, imageHeight);
            pdf.setFillColor(240, 240, 240);
            pdf.rect(imageX, yPosition, imageWidth, imageHeight, 'F');
            pdf.setTextColor(120, 120, 120);
            pdf.setFontSize(8);
            pdf.text('No Image', imageX + imageWidth/2 - 10, yPosition + imageHeight/2);
          }
        }
        
        yPosition += maxImageHeight + 15;
      }
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }
  
  // Amenities Section (clean, non-boxy design)
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, yPosition, usableWidth, 12, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AMENITIES', margin + 5, yPosition + 8);
  
  yPosition += 20;
  
  const amenities = [
    ['• Air Conditioning', property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition')) ? 'YES' : 'NO'],
    ['• WiFi', property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet')) ? 'YES' : 'NO'],
    ['• Parking', property.features.some(f => f.toLowerCase().includes('parking')) ? 'YES' : 'NO'],
    ['• Pet Friendly', property.features.some(f => f.toLowerCase().includes('pet')) ? 'YES' : 'NO']
  ];
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  amenities.forEach(([amenity, status]) => {
    pdf.text(amenity, margin + 5, yPosition);
    pdf.setTextColor(status === 'YES' ? 0 : 180, status === 'YES' ? 150 : 0, 0);
    pdf.text(status, margin + usableWidth - 20, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;
  });
  
  yPosition += 15;
  
  // QR Code Section
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const qrCode = await generateQRCode(propertyUrl);
      
      const qrSize = 60;
      const qrX = (pageWidth - qrSize) / 2;
      
      pdf.addImage(qrCode, 'PNG', qrX, yPosition, qrSize, qrSize);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const qrText = 'Scan to view online';
      const qrTextWidth = pdf.getTextWidth(qrText);
      pdf.text(qrText, (pageWidth - qrTextWidth) / 2, yPosition + qrSize + 8);
      
      yPosition += qrSize + 25;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Contact Section
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, yPosition, usableWidth, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Owner', margin + 10, yPosition + 12);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${encodeText(property.ownerName)}`, margin + 10, yPosition + 19);
  pdf.text(`Phone: ${property.contactPhone}`, margin + 10, yPosition + 23);
  
  // Save PDF (no footer section)
  const cleanLocation = encodeText(property.location).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `TO_LET_${cleanLocation}.pdf`;
  pdf.save(fileName);
};
