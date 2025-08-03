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

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);
  
  // Header section with TO-LET title and logo
  let yPosition = 25;
  
  // Add Tuleeto Logo on the right side first
  try {
    const logoUrl = '/lovable-uploads/2f743f2f-28e7-4574-8f78-3b4311ec2885.png';
    const logoData = await loadImageAsBase64(logoUrl);
    
    // Logo dimensions - smaller to fit beside title
    const logoWidth = 18;
    const logoHeight = 18;
    const logoX = pageWidth - margin - logoWidth;
    
    pdf.addImage(logoData.dataURL, 'PNG', logoX, yPosition - 10, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error loading logo:', error);
  }
  
  // Main title - TO-LET in big orange letters (positioned to leave space for logo)
  pdf.setFontSize(32);
  pdf.setTextColor(249, 115, 22);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'TO-LET';
  const titleWidth = pdf.getTextWidth(titleText);
  // Position title to the left, leaving space for logo
  const titleX = Math.min((pageWidth - titleWidth) / 2, pageWidth - margin - 25 - titleWidth);
  pdf.text(titleText, titleX, yPosition);
  
  // Subtitle - RENT AVAILABLE
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'RENT AVAILABLE';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, yPosition + 10);
  
  yPosition = 45;
  
  // Property Title - with text wrapping
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(property.title, usableWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 6) + 3;
  
  // Location
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const locationLines = pdf.splitTextToSize(property.location, usableWidth);
  pdf.text(locationLines, margin, yPosition);
  yPosition += (locationLines.length * 5) + 5;
  
  // Price
  pdf.setFontSize(20);
  pdf.setTextColor(249, 115, 22);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Rs ${property.price.toLocaleString('en-IN')}/month`, margin, yPosition);
  yPosition += 12;
  
  // Property Images - medium size with original aspect ratio
  if (property.images && property.images.length > 0) {
    try {
      const maxImages = Math.min(property.images.length, 4); // Show up to 4 images
      const maxImgWidth = maxImages === 1 ? usableWidth * 0.8 : usableWidth / 2 - 4; // Medium size
      const maxImgHeight = 45; // Increased maximum height for medium size
      
      let currentX = margin;
      let currentY = yPosition;
      let maxRowHeight = 0;
      
      for (let i = 0; i < maxImages; i++) {
        const imageUrl = property.images[i];
        const imageData = await loadImageAsBase64(imageUrl);
        
        // Calculate aspect ratio and fit within constraints
        const aspectRatio = imageData.width / imageData.height;
        let imgWidth = maxImgWidth;
        let imgHeight = imgWidth / aspectRatio;
        
        // If height exceeds max, scale down based on height
        if (imgHeight > maxImgHeight) {
          imgHeight = maxImgHeight;
          imgWidth = imgHeight * aspectRatio;
        }
        
        // Calculate position for multiple images
        if (maxImages > 1) {
          const col = i % 2;
          const row = Math.floor(i / 2);
          
          currentX = margin + col * (usableWidth / 2);
          currentY = yPosition + row * (maxImgHeight + 4);
          
          // Center the image in its column
          const centerOffset = (usableWidth / 2 - imgWidth) / 2;
          currentX += centerOffset;
          
          maxRowHeight = Math.max(maxRowHeight, imgHeight);
        } else {
          // Center single image
          currentX = margin + (usableWidth - imgWidth) / 2;
          currentY = yPosition;
          maxRowHeight = imgHeight;
        }
        
        pdf.addImage(imageData.dataURL, 'JPEG', currentX, currentY, imgWidth, imgHeight);
      }
      
      // Adjust yPosition based on number of images and their heights
      const numRows = Math.ceil(maxImages / 2);
      yPosition += (numRows * maxImgHeight) + (numRows - 1) * 4 + 8;
    } catch (error) {
      console.error('Error loading images:', error);
      yPosition += 5; // Small space if no images
    }
  }
  
  // Property Details Box - expanded for amenities
  const boxHeight = 35; // Increased height to accommodate amenities
  pdf.setFillColor(255, 237, 213);
  pdf.rect(margin, yPosition, usableWidth, boxHeight, 'F');
  
  // Add border
  pdf.setDrawColor(249, 115, 22);
  pdf.setLineWidth(0.5);
  pdf.rect(margin, yPosition, usableWidth, boxHeight, 'S');
  
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  const detailsStartY = yPosition + 7;
  const leftColX = margin + 4;
  const rightColX = margin + (usableWidth / 2) + 4;
  
  // Left column
  pdf.text(`Bedrooms: ${property.bedrooms}`, leftColX, detailsStartY);
  pdf.text(`Bathrooms: ${property.bathrooms}`, leftColX, detailsStartY + 6);
  
  // Right column
  pdf.text(`Area: ${property.area} sq ft`, rightColX, detailsStartY);
  pdf.text(`Rooms: ${property.bedrooms + 1}`, rightColX, detailsStartY + 6);
  
  // Amenities section
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Amenities:', leftColX, detailsStartY + 14);
  
  pdf.setFont('helvetica', 'normal');
  const amenities = [];
  
  // Check for common amenities in features
  const featuresList = property.features || [];
  
  // Map features to amenity format
  if (featuresList.includes('Air conditioning') || featuresList.includes('AC')) {
    amenities.push('AIR CONDITIONING: YES');
  } else {
    amenities.push('AIR CONDITIONING: NA');
  }
  
  if (featuresList.includes('WiFi') || featuresList.includes('Internet') || featuresList.includes('Wi-Fi')) {
    amenities.push('WIFI: YES');
  } else {
    amenities.push('WIFI: NA');
  }
  
  if (featuresList.includes('Parking') || featuresList.includes('Car parking')) {
    amenities.push('PARKING: YES');
  } else {
    amenities.push('PARKING: NA');
  }
  
  if (featuresList.includes('Pet friendly')) {
    amenities.push('PET FRIENDLY: YES');
  } else {
    amenities.push('PET FRIENDLY: NA');
  }
  
  // Display amenities in two columns
  const maxAmenitiesPerLine = 2;
  for (let i = 0; i < amenities.length; i += maxAmenitiesPerLine) {
    const lineAmenities = amenities.slice(i, i + maxAmenitiesPerLine);
    const amenityLine = lineAmenities.join(', ');
    pdf.text(amenityLine, leftColX, detailsStartY + 20 + (Math.floor(i / maxAmenitiesPerLine) * 4));
  }
  
  yPosition += boxHeight + 8;
  
  // Contact Information Box - compact
  const contactBoxHeight = 22;
  pdf.setFillColor(249, 115, 22);
  pdf.rect(margin, yPosition, usableWidth, contactBoxHeight, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Owner', margin + 4, yPosition + 8);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  const contactStartY = yPosition + 14;
  const ownerNameLines = pdf.splitTextToSize(`Name: ${property.ownerName}`, usableWidth - 8);
  const phoneLines = pdf.splitTextToSize(`Phone: ${property.contactPhone}`, usableWidth - 8);
  
  pdf.text(ownerNameLines, margin + 4, contactStartY);
  pdf.text(phoneLines, margin + 4, contactStartY + 5);
  
  yPosition += contactBoxHeight + 8;
  
  // QR Code section
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const qrCodeDataUrl = await generateQRCode(propertyUrl);
      
      // QR Code dimensions
      const qrSize = 25;
      const qrX = margin + (usableWidth - qrSize) / 2;
      
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition, qrSize, qrSize);
      
      // QR Code label
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      const qrText = 'Scan to view online';
      const qrTextWidth = pdf.getTextWidth(qrText);
      pdf.text(qrText, (pageWidth - qrTextWidth) / 2, yPosition + qrSize + 5);
      
      yPosition += qrSize + 12;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Footer - updated to Tuleeto.in and positioned at bottom
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.setFont('helvetica', 'normal');
  const footerText = 'Generated via Tuleeto.in - Your trusted rental platform';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 6);
  
  // Save the PDF
  const fileName = `${property.title.replace(/[^a-zA-Z0-9]/g, '_')}_rental_poster.pdf`;
  pdf.save(fileName);
};
