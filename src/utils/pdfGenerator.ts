
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
      width: 100,
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
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 25;
  
  // Header - TO-LET (Top and centered)
  pdf.setFontSize(36);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition);
  
  yPosition += 20;
  
  // Property Title (Below TO-LET)
  pdf.setFontSize(20);
  pdf.setTextColor(33, 37, 41);
  pdf.setFont('helvetica', 'bold');
  const encodedTitle = encodeText(property.title);
  const titleLines = pdf.splitTextToSize(encodedTitle, usableWidth);
  titleLines.forEach((line: string) => {
    const lineWidth = pdf.getTextWidth(line);
    pdf.text(line, (pageWidth - lineWidth) / 2, yPosition);
    yPosition += 8;
  });
  
  yPosition += 5;
  
  // Price per month (Below title, centered)
  pdf.setFontSize(24);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const priceText = `₹${property.price.toLocaleString('en-IN')}/month`;
  const priceWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition);
  yPosition += 20;
  
  // Property Images (Below price)
  if (property.images && property.images.length > 0) {
    const imagesToShow = property.images.slice(0, 3); // Take maximum 3 images
    const imageHeight = 50;
    const imageSpacing = 5;
    
    if (imagesToShow.length === 1) {
      // Single image - centered
      try {
        const imageData = await loadImageAsBase64(imagesToShow[0]);
        const aspectRatio = imageData.width / imageData.height;
        const imageWidth = Math.min(usableWidth * 0.8, imageHeight * aspectRatio);
        const imageX = (pageWidth - imageWidth) / 2;
        
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.rect(imageX, yPosition, imageWidth, imageHeight, 'S');
        pdf.addImage(imageData.dataURL, 'JPEG', imageX, yPosition, imageWidth, imageHeight);
        yPosition += imageHeight + 15;
      } catch (error) {
        console.error('Error loading single image:', error);
      }
    } else {
      // Two images side by side (for 2 or 3+ images, show only 2)
      const imageWidth = (usableWidth - imageSpacing) / 2;
      const startX = margin;
      
      try {
        // First image
        const imageData1 = await loadImageAsBase64(imagesToShow[0]);
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.rect(startX, yPosition, imageWidth, imageHeight, 'S');
        pdf.addImage(imageData1.dataURL, 'JPEG', startX, yPosition, imageWidth, imageHeight);
        
        // Second image
        const imageData2 = await loadImageAsBase64(imagesToShow[1]);
        const secondImageX = startX + imageWidth + imageSpacing;
        pdf.rect(secondImageX, yPosition, imageWidth, imageHeight, 'S');
        pdf.addImage(imageData2.dataURL, 'JPEG', secondImageX, yPosition, imageWidth, imageHeight);
        
        yPosition += imageHeight + 15;
      } catch (error) {
        console.error('Error loading images:', error);
      }
    }
  }
  
  // QR Code (After images, centered)
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const qrCodeDataUrl = await generateQRCode(propertyUrl);
      
      const qrSize = 50;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition, qrSize, qrSize);
      yPosition += qrSize + 8;
      
      // "Scan to view full details" text (Below QR code, centered)
      pdf.setFontSize(12);
      pdf.setTextColor(33, 37, 41);
      pdf.setFont('helvetica', 'normal');
      const qrText = 'Scan to view full details';
      const qrTextWidth = pdf.getTextWidth(qrText);
      pdf.text(qrText, (pageWidth - qrTextWidth) / 2, yPosition);
      yPosition += 15;
      
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Amenities (Below QR section)
  if (property.features && property.features.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(33, 37, 41);
    const amenitiesTitle = 'Amenities:';
    const amenitiesTitleWidth = pdf.getTextWidth(amenitiesTitle);
    pdf.text(amenitiesTitle, (pageWidth - amenitiesTitleWidth) / 2, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Display amenities in a compact format
    const amenitiesText = property.features.join(', ');
    const amenitiesLines = pdf.splitTextToSize(amenitiesText, usableWidth);
    amenitiesLines.forEach((line: string) => {
      const lineWidth = pdf.getTextWidth(line);
      pdf.text(line, (pageWidth - lineWidth) / 2, yPosition);
      yPosition += 5;
    });
    yPosition += 10;
  }
  
  // Contact Information (Below amenities)
  pdf.setFontSize(12);
  pdf.setTextColor(52, 58, 64);
  pdf.setFont('helvetica', 'bold');
  const contactTitle = 'Contact:';
  const contactTitleWidth = pdf.getTextWidth(contactTitle);
  pdf.text(contactTitle, (pageWidth - contactTitleWidth) / 2, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  const encodedOwnerName = encodeText(property.ownerName);
  const ownerText = `${encodedOwnerName} - ${property.contactPhone}`;
  const ownerTextWidth = pdf.getTextWidth(ownerText);
  pdf.text(ownerText, (pageWidth - ownerTextWidth) / 2, yPosition);
  yPosition += 15;
  
  // Footer with TULEETO and logo (At bottom, centered)
  try {
    const logoUrl = '/lovable-uploads/2f743f2f-28e7-4574-8f78-3b4311ec2885.png';
    const logoData = await loadImageAsBase64(logoUrl);
    
    const logoWidth = 30;
    const logoHeight = 30;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = pageHeight - 45;
    
    pdf.addImage(logoData.dataURL, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // TULEETO text below logo
    pdf.setFontSize(16);
    pdf.setTextColor(255, 102, 0);
    pdf.setFont('helvetica', 'bold');
    const tuleetoText = 'TULEETO';
    const tuleetoTextWidth = pdf.getTextWidth(tuleetoText);
    pdf.text(tuleetoText, (pageWidth - tuleetoTextWidth) / 2, logoY + logoHeight + 8);
    
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback text footer
    pdf.setFontSize(16);
    pdf.setTextColor(255, 102, 0);
    pdf.setFont('helvetica', 'bold');
    const footerText = 'TULEETO';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 20);
  }
  
  // Save PDF
  const cleanTitle = encodeText(property.title).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanTitle}_TO_LET.pdf`;
  pdf.save(fileName);
};
