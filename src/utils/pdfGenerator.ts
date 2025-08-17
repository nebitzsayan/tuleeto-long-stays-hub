
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
  
  let yPosition = 20;
  
  // Header - TO-LET
  pdf.setFillColor(255, 102, 0); // Orange background
  pdf.rect(0, yPosition, pageWidth, 35, 'F');
  
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition + 22);
  
  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'RENT AVAILABLE';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, yPosition + 30);
  
  yPosition += 50;
  
  // Property Title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(encodeText(property.title), usableWidth);
  titleLines.forEach((line: string) => {
    pdf.text(line, margin, yPosition);
    yPosition += 8;
  });
  
  yPosition += 5;
  
  // Location
  pdf.setFontSize(12);
  pdf.setTextColor(80, 80, 80);
  pdf.setFont('helvetica', 'normal');
  pdf.text(encodeText(property.location), margin, yPosition);
  
  yPosition += 15;
  
  // Price
  pdf.setFontSize(24);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const priceText = `Rs ${property.price.toLocaleString('en-IN')}/month`;
  pdf.text(priceText, margin, yPosition);
  
  yPosition += 25;
  
  // Property Images
  if (property.images && property.images.length > 0) {
    try {
      const imagesToShow = property.images.slice(0, 3);
      const imageWidth = (usableWidth - 20) / 3;
      const imageHeight = 45;
      
      let imageX = margin;
      
      for (let i = 0; i < 3; i++) {
        if (i < imagesToShow.length) {
          try {
            const imageData = await loadImageAsBase64(imagesToShow[i]);
            pdf.addImage(imageData.dataURL, 'JPEG', imageX, yPosition, imageWidth, imageHeight);
          } catch (error) {
            // Draw placeholder if image fails to load
            pdf.setFillColor(240, 240, 240);
            pdf.rect(imageX, yPosition, imageWidth, imageHeight, 'F');
            pdf.setTextColor(120, 120, 120);
            pdf.setFontSize(8);
            pdf.text('Image', imageX + imageWidth/2 - 5, yPosition + imageHeight/2);
          }
        } else {
          // Draw placeholder for missing images
          pdf.setFillColor(240, 240, 240);
          pdf.rect(imageX, yPosition, imageWidth, imageHeight, 'F');
          pdf.setTextColor(120, 120, 120);
          pdf.setFontSize(8);
          pdf.text('No Image', imageX + imageWidth/2 - 8, yPosition + imageHeight/2);
        }
        
        imageX += imageWidth + 10;
      }
      
      yPosition += imageHeight + 20;
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }
  
  // Property Specifications Table
  pdf.setDrawColor(255, 102, 0);
  pdf.setLineWidth(1);
  
  const tableStartY = yPosition;
  const tableWidth = usableWidth;
  const rowHeight = 12;
  
  // Table header
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, tableStartY, tableWidth, rowHeight, 'FD');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROPERTY SPECIFICATIONS', margin + 5, tableStartY + 8);
  
  yPosition = tableStartY + rowHeight;
  
  // Table rows
  const specs = [
    ['Bedrooms', property.bedrooms.toString()],
    ['Bathrooms', property.bathrooms.toString()],
    ['Area', `${property.area} sq ft`],
    ['Total Rooms', (property.bedrooms + 1).toString()]
  ];
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  specs.forEach(([label, value]) => {
    // Draw row border
    pdf.setDrawColor(255, 102, 0);
    pdf.rect(margin, yPosition, tableWidth, rowHeight, 'D');
    
    // Add text
    pdf.text(label, margin + 5, yPosition + 8);
    pdf.text(value, margin + tableWidth/2 + 5, yPosition + 8);
    
    yPosition += rowHeight;
  });
  
  yPosition += 15;
  
  // Amenities Table
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, yPosition, tableWidth, rowHeight, 'FD');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AMENITIES', margin + 5, yPosition + 8);
  
  yPosition += rowHeight;
  
  const amenities = [
    ['AIR CONDITIONING', property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition')) ? 'YES' : 'NO'],
    ['WIFI', property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet')) ? 'YES' : 'NO'],
    ['PARKING', property.features.some(f => f.toLowerCase().includes('parking')) ? 'YES' : 'NO'],
    ['PET FRIENDLY', property.features.some(f => f.toLowerCase().includes('pet')) ? 'YES' : 'NO']
  ];
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  amenities.forEach(([amenity, status]) => {
    pdf.setDrawColor(255, 102, 0);
    pdf.rect(margin, yPosition, tableWidth, rowHeight, 'D');
    
    pdf.text(amenity, margin + 5, yPosition + 8);
    pdf.setTextColor(status === 'YES' ? 0 : 180, status === 'YES' ? 150 : 0, 0);
    pdf.text(status, margin + tableWidth/2 + 5, yPosition + 8);
    pdf.setTextColor(0, 0, 0);
    
    yPosition += rowHeight;
  });
  
  yPosition += 20;
  
  // Contact Section
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, yPosition, tableWidth, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Owner', margin + 10, yPosition + 12);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${encodeText(property.ownerName)}`, margin + 10, yPosition + 19);
  pdf.text(`Phone: ${property.contactPhone}`, margin + 10, yPosition + 23);
  
  yPosition += 35;
  
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
      
      yPosition += qrSize + 20;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Footer
  yPosition = pageHeight - 30;
  
  pdf.setFillColor(50, 50, 50);
  pdf.rect(0, yPosition, pageWidth, 30, 'F');
  
  pdf.setTextColor(255, 102, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const brandText = 'TULEETO';
  const brandWidth = pdf.getTextWidth(brandText);
  pdf.text(brandText, (pageWidth - brandWidth) / 2, yPosition + 15);
  
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const footerText = 'Find your perfect home at Tuleeto.in';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, yPosition + 22);
  
  // Save PDF
  const cleanLocation = encodeText(property.location).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `TO_LET_${cleanLocation}.pdf`;
  pdf.save(fileName);
};
