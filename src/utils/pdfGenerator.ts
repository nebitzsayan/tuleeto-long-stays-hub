
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
      width: 120,
      margin: 2,
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

// Helper function to properly encode text for PDF
const encodeText = (text: string): string => {
  // Remove or replace problematic characters that cause encoding issues
  return text
    .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
    .replace(/'/g, "'") // Replace smart quotes with regular quotes
    .replace(/"/g, '"')
    .replace(/–/g, '-') // Replace em dash with hyphen
    .replace(/—/g, '-')
    .trim();
};

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 25;
  
  // Header with professional branding
  pdf.setFillColor(249, 115, 22); // Orange header
  pdf.rect(0, 0, pageWidth, 35, 'F');
  
  // Main title - TO-LET
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'PROPERTY FOR RENT';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (pageWidth - titleWidth) / 2, 20);
  
  // Subtitle
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'Premium Rental Listing';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, 28);
  
  yPosition = 50;
  
  // Property Title with better encoding
  pdf.setFontSize(20);
  pdf.setTextColor(44, 62, 80); // Dark blue-gray
  pdf.setFont('helvetica', 'bold');
  const encodedTitle = encodeText(property.title);
  const titleLines = pdf.splitTextToSize(encodedTitle, usableWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 8) + 5;
  
  // Location with icon representation
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const encodedLocation = encodeText(property.location);
  pdf.text(`Location: ${encodedLocation}`, margin, yPosition);
  yPosition += 10;
  
  // Price section - professional styling
  pdf.setFillColor(248, 249, 250);
  pdf.rect(margin, yPosition, usableWidth, 25, 'F');
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(1);
  pdf.rect(margin, yPosition, usableWidth, 25, 'S');
  
  pdf.setFontSize(24);
  pdf.setTextColor(249, 115, 22);
  pdf.setFont('helvetica', 'bold');
  const priceText = `Rs ${property.price.toLocaleString('en-IN')}/month`;
  const priceWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition + 18);
  yPosition += 35;
  
  // Property Image with professional border
  if (property.images && property.images.length > 0) {
    try {
      const imageUrl = property.images[0];
      const imageData = await loadImageAsBase64(imageUrl);
      
      const maxImgWidth = usableWidth - 20;
      const maxImgHeight = 80;
      
      const aspectRatio = imageData.width / imageData.height;
      let imgWidth = maxImgWidth;
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      const imgX = (pageWidth - imgWidth) / 2;
      
      // Professional image frame
      pdf.setFillColor(255, 255, 255);
      pdf.rect(imgX - 5, yPosition - 5, imgWidth + 10, imgHeight + 10, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(2);
      pdf.rect(imgX - 5, yPosition - 5, imgWidth + 10, imgHeight + 10, 'S');
      
      pdf.addImage(imageData.dataURL, 'JPEG', imgX, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 20;
    } catch (error) {
      console.error('Error loading image:', error);
      yPosition += 10;
    }
  }
  
  // Property Details in professional grid
  const boxHeight = 40;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, yPosition, usableWidth, boxHeight, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(1);
  pdf.rect(margin, yPosition, usableWidth, boxHeight, 'S');
  
  // Grid layout for property details
  pdf.setFontSize(11);
  pdf.setTextColor(44, 62, 80);
  pdf.setFont('helvetica', 'bold');
  
  const detailsStartY = yPosition + 10;
  const col1X = margin + 10;
  const col2X = margin + (usableWidth / 2) + 10;
  
  // Property specifications
  pdf.text(`Bedrooms: ${property.bedrooms}`, col1X, detailsStartY);
  pdf.text(`Bathrooms: ${property.bathrooms}`, col2X, detailsStartY);
  pdf.text(`Area: ${property.area} sq ft`, col1X, detailsStartY + 8);
  pdf.text(`Type: Residential`, col2X, detailsStartY + 8);
  
  // Features
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  if (property.features && property.features.length > 0) {
    const featuresText = `Amenities: ${property.features.slice(0, 4).map(f => encodeText(f)).join(', ')}`;
    const featureLines = pdf.splitTextToSize(featuresText, usableWidth - 20);
    pdf.text(featureLines, col1X, detailsStartY + 18);
  }
  
  yPosition += boxHeight + 15;
  
  // Contact Information - Professional card style
  const contactBoxHeight = 30;
  pdf.setFillColor(44, 62, 80);
  pdf.rect(margin, yPosition, usableWidth, contactBoxHeight, 'F');
  
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Information', margin + 15, yPosition + 12);
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const encodedOwnerName = encodeText(property.ownerName);
  pdf.text(`Owner: ${encodedOwnerName}`, margin + 15, yPosition + 20);
  pdf.text(`Phone: ${property.contactPhone}`, margin + 15, yPosition + 26);
  
  yPosition += contactBoxHeight + 20;
  
  // QR Code section - properly contained within page bounds
  const remainingSpace = pageHeight - yPosition - 40; // Leave space for footer
  
  if (property.propertyId && remainingSpace >= 55) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const qrCodeDataUrl = await generateQRCode(propertyUrl);
      
      const qrBoxHeight = 50;
      
      // QR section with professional styling
      pdf.setFillColor(248, 249, 250);
      pdf.rect(margin, yPosition, usableWidth, qrBoxHeight, 'F');
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(1);
      pdf.rect(margin, yPosition, usableWidth, qrBoxHeight, 'S');
      
      // QR Code positioning
      const qrSize = 35;
      const qrX = margin + 10;
      const qrY = yPosition + 8;
      
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // Professional text beside QR code
      pdf.setFontSize(12);
      pdf.setTextColor(44, 62, 80);
      pdf.setFont('helvetica', 'bold');
      const textX = qrX + qrSize + 15;
      pdf.text('Scan for Complete Details', textX, qrY + 8);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('View all photos and property information', textX, qrY + 16);
      pdf.text('Get accurate map location and directions', textX, qrY + 22);
      pdf.text('Contact owner directly through the app', textX, qrY + 28);
      
      yPosition += qrBoxHeight + 15;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Professional Footer with logo - positioned at bottom center
  try {
    const logoUrl = '/lovable-uploads/2f743f2f-28e7-4574-8f78-3b4311ec2885.png';
    const logoData = await loadImageAsBase64(logoUrl);
    
    const logoWidth = 20;
    const logoHeight = 20;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = pageHeight - 30;
    
    pdf.addImage(logoData.dataURL, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // Company text
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'bold');
    const logoText = 'Tuleeto.in';
    const logoTextWidth = pdf.getTextWidth(logoText);
    pdf.text(logoText, (pageWidth - logoTextWidth) / 2, logoY + logoHeight + 8);
    
    // Tagline
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    const tagline = 'Your Trusted Property Partner';
    const taglineWidth = pdf.getTextWidth(tagline);
    pdf.text(tagline, (pageWidth - taglineWidth) / 2, logoY + logoHeight + 14);
    
  } catch (error) {
    console.error('Error loading logo:', error);
    // Professional fallback footer
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'bold');
    const footerText = 'Tuleeto.in - Your Trusted Property Partner';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
  }
  
  // Save with proper filename
  const cleanTitle = encodeText(property.title).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanTitle}_Property_Listing.pdf`;
  pdf.save(fileName);
};
