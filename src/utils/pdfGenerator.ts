
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

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);
  
  // Header section with TO-LET title
  let yPosition = 25;
  
  // Main title - TO-LET in big orange letters
  pdf.setFontSize(32);
  pdf.setTextColor(249, 115, 22);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'TO-LET';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (pageWidth - titleWidth) / 2, yPosition);
  
  // Subtitle - RENT AVAILABLE
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'RENT AVAILABLE';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, yPosition + 10);
  
  yPosition = 50;
  
  // Property Title
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(property.title, usableWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 7) + 5;
  
  // Location
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const locationLines = pdf.splitTextToSize(property.location, usableWidth);
  pdf.text(locationLines, margin, yPosition);
  yPosition += (locationLines.length * 5) + 8;
  
  // Price - prominent display
  pdf.setFontSize(24);
  pdf.setTextColor(249, 115, 22);
  pdf.setFont('helvetica', 'bold');
  const priceText = `Rs ${property.price.toLocaleString('en-IN')}/month`;
  const priceWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition);
  yPosition += 15;
  
  // Single Property Image - centered with border
  if (property.images && property.images.length > 0) {
    try {
      const imageUrl = property.images[0]; // Only show the first image
      const imageData = await loadImageAsBase64(imageUrl);
      
      const maxImgWidth = usableWidth * 0.8;
      const maxImgHeight = 70;
      
      // Calculate aspect ratio and fit within constraints
      const aspectRatio = imageData.width / imageData.height;
      let imgWidth = maxImgWidth;
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      const imgX = (pageWidth - imgWidth) / 2;
      
      // Add border around image
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      pdf.rect(imgX - 2, yPosition - 2, imgWidth + 4, imgHeight + 4, 'S');
      
      pdf.addImage(imageData.dataURL, 'JPEG', imgX, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 12;
    } catch (error) {
      console.error('Error loading image:', error);
      yPosition += 5;
    }
  }
  
  // Property Details Box
  const boxHeight = 35;
  pdf.setFillColor(255, 237, 213);
  pdf.rect(margin, yPosition, usableWidth, boxHeight, 'F');
  pdf.setDrawColor(249, 115, 22);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPosition, usableWidth, boxHeight, 'S');
  
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  const detailsStartY = yPosition + 8;
  const leftColX = margin + 6;
  const rightColX = margin + (usableWidth / 2) + 6;
  
  // Property details in two columns
  pdf.text(`🏠 Bedrooms: ${property.bedrooms}`, leftColX, detailsStartY);
  pdf.text(`🚿 Bathrooms: ${property.bathrooms}`, leftColX, detailsStartY + 6);
  pdf.text(`📐 Area: ${property.area} sq ft`, rightColX, detailsStartY);
  pdf.text(`🏡 Total Rooms: ${property.bedrooms + 1}`, rightColX, detailsStartY + 6);
  
  // Amenities
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const amenitiesText = `✓ ${property.features.slice(0, 3).join(' ✓ ')}`;
  pdf.text(amenitiesText, leftColX, detailsStartY + 14);
  
  yPosition += boxHeight + 12;
  
  // Contact Information Box
  const contactBoxHeight = 25;
  pdf.setFillColor(249, 115, 22);
  pdf.rect(margin, yPosition, usableWidth, contactBoxHeight, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📞 Contact Owner', margin + 6, yPosition + 8);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${property.ownerName}`, margin + 6, yPosition + 15);
  pdf.text(`Phone: ${property.contactPhone}`, margin + 6, yPosition + 20);
  
  yPosition += contactBoxHeight + 15;
  
  // QR Code section - properly positioned and contained
  if (property.propertyId && yPosition + 60 < pageHeight - 30) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const qrCodeDataUrl = await generateQRCode(propertyUrl);
      
      const qrBoxHeight = 50;
      const qrBoxY = Math.min(yPosition, pageHeight - 80); // Ensure it fits on page
      
      // QR section background
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, qrBoxY, usableWidth, qrBoxHeight, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, qrBoxY, usableWidth, qrBoxHeight, 'S');
      
      // QR Code positioning
      const qrSize = 35;
      const qrX = margin + 8;
      const qrY = qrBoxY + 8;
      
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      
      // Text content beside QR code
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      const textX = qrX + qrSize + 10;
      pdf.text('Scan for More Details', textX, qrY + 8);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      pdf.text('📱 View all photos & get directions', textX, qrY + 14);
      pdf.text('🏠 See detailed property information', textX, qrY + 18);
      pdf.text('📞 Contact owner directly', textX, qrY + 22);
      pdf.text('🗺️  Get accurate map location', textX, qrY + 26);
      
      yPosition = qrBoxY + qrBoxHeight + 8;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Footer with Tuleeto logo at bottom center
  try {
    const logoUrl = '/lovable-uploads/2f743f2f-28e7-4574-8f78-3b4311ec2885.png';
    const logoData = await loadImageAsBase64(logoUrl);
    
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = pageHeight - 25;
    
    pdf.addImage(logoData.dataURL, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // Tuleeto text below logo
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'bold');
    const logoText = 'Tuleeto.in';
    const logoTextWidth = pdf.getTextWidth(logoText);
    pdf.text(logoText, (pageWidth - logoTextWidth) / 2, logoY + logoHeight + 5);
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback text footer
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.setFont('helvetica', 'italic');
    const footerText = 'Find your perfect home at Tuleeto.in';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 8);
  }
  
  // Save the PDF
  const fileName = `${property.title.replace(/[^a-zA-Z0-9]/g, '_')}_rental_poster.pdf`;
  pdf.save(fileName);
};
