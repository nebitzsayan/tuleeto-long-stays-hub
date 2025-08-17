
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
  pdf.setFontSize(48);
  pdf.setTextColor(255, 102, 0); // Orange color
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition);
  
  yPosition += 15;
  
  // Subtitle - RENT AVAILABLE (Below TO-LET, centered)
  pdf.setFontSize(14);
  pdf.setTextColor(128, 128, 128); // Gray color
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'RENT AVAILABLE';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, yPosition);
  
  yPosition += 20;
  
  // Property Location (Smaller, Gray)
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const encodedLocation = encodeText(property.location);
  const locationLines = pdf.splitTextToSize(encodedLocation, usableWidth);
  locationLines.forEach((line: string) => {
    const lineWidth = pdf.getTextWidth(line);
    pdf.text(line, (pageWidth - lineWidth) / 2, yPosition);
    yPosition += 6;
  });
  
  yPosition += 10;
  
  // Price (Bold Orange)
  pdf.setFontSize(32);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const priceText = `Rs ${property.price.toLocaleString('en-IN')}/month`;
  const priceWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition);
  
  yPosition += 25;
  
  // Property Images Section
  if (property.images && property.images.length > 0) {
    try {
      const imagesToShow = property.images.slice(0, 2); // Maximum 2 images
      const imageWidth = usableWidth / imagesToShow.length - 5;
      const imageHeight = 60;
      
      let imageX = margin;
      
      for (const imageUrl of imagesToShow) {
        try {
          const imageData = await loadImageAsBase64(imageUrl);
          pdf.addImage(imageData.dataURL, 'JPEG', imageX, yPosition, imageWidth, imageHeight);
          imageX += imageWidth + 10;
        } catch (error) {
          console.error('Error loading image:', error);
        }
      }
      
      yPosition += imageHeight + 15;
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }
  
  // QR Code for Property Details (Centered)
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const propertyQRCode = await generateQRCode(propertyUrl);
      
      const qrSize = 60;
      const qrX = (pageWidth - qrSize) / 2;
      
      // Background for QR code
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      pdf.roundedRect(qrX - 5, yPosition - 5, qrSize + 10, qrSize + 10, 3, 3, 'FD');
      
      pdf.addImage(propertyQRCode, 'PNG', qrX, yPosition, qrSize, qrSize);
      yPosition += qrSize + 10;
      
      // QR Label
      pdf.setFontSize(12);
      pdf.setTextColor(50, 50, 50);
      pdf.setFont('helvetica', 'bold');
      const qrText = 'Scan to View Full Details';
      const qrTextWidth = pdf.getTextWidth(qrText);
      pdf.text(qrText, (pageWidth - qrTextWidth) / 2, yPosition);
      yPosition += 20;
      
    } catch (error) {
      console.error('Error generating property QR code:', error);
    }
  }
  
  // Property Specifications Section
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const specsTitle = 'Property Specifications';
  const specsTitleWidth = pdf.getTextWidth(specsTitle);
  pdf.text(specsTitle, (pageWidth - specsTitleWidth) / 2, yPosition);
  yPosition += 15;
  
  // Specifications Table
  const tableY = yPosition;
  const tableHeight = 50;
  
  // Table background
  pdf.setFillColor(250, 250, 250);
  pdf.setDrawColor(255, 102, 0);
  pdf.setLineWidth(2);
  pdf.roundedRect(margin, tableY, usableWidth, tableHeight, 5, 5, 'FD');
  
  // Table content
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  let tableRowY = tableY + 12;
  const leftColX = margin + 10;
  const rightColX = margin + (usableWidth / 2) + 10;
  
  // Left column
  pdf.text(`Bedrooms: ${property.bedrooms}`, leftColX, tableRowY);
  tableRowY += 10;
  pdf.text(`Bathrooms: ${property.bathrooms}`, leftColX, tableRowY);
  
  // Right column
  tableRowY = tableY + 12;
  pdf.text(`Area: ${property.area} sq ft`, rightColX, tableRowY);
  tableRowY += 10;
  pdf.text(`Total Rooms: ${property.bedrooms + 1}`, rightColX, tableRowY);
  
  yPosition = tableY + tableHeight + 20;
  
  // Amenities Section
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const amenitiesTitle = 'Amenities';
  const amenitiesTitleWidth = pdf.getTextWidth(amenitiesTitle);
  pdf.text(amenitiesTitle, (pageWidth - amenitiesTitleWidth) / 2, yPosition);
  yPosition += 15;
  
  // Amenities boxes
  const amenityChecks = {
    'Air Conditioning': property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition')),
    'WiFi': property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet')),
    'Parking': property.features.some(f => f.toLowerCase().includes('parking')),
    'Pet Friendly': property.features.some(f => f.toLowerCase().includes('pet')),
    'PG (Paying Guest)': property.features.some(f => f.toLowerCase().includes('pg') || f.toLowerCase().includes('paying guest'))
  };
  
  const boxWidth = (usableWidth - 20) / 2;
  const boxHeight = 12;
  let boxX = margin;
  let boxY = yPosition;
  let amenityCount = 0;
  
  Object.entries(amenityChecks).forEach(([amenity, hasAmenity]) => {
    // Box background
    const bgColor = hasAmenity ? [200, 255, 200] : [255, 200, 200]; // Light green for YES, light red for NO
    pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');
    
    // Text
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    const status = hasAmenity ? 'YES' : 'NO';
    const amenityText = `${amenity}: ${status}`;
    pdf.text(amenityText, boxX + 3, boxY + 8);
    
    amenityCount++;
    if (amenityCount % 2 === 0) {
      boxX = margin;
      boxY += boxHeight + 5;
    } else {
      boxX += boxWidth + 10;
    }
  });
  
  yPosition = boxY + (amenityCount % 2 === 0 ? 0 : boxHeight) + 20;
  
  // UPI Payment QR Code Section
  try {
    const upiQRData = `upi://pay?pa=owner@upi&pn=${encodeURIComponent(property.ownerName)}&am=${property.price}&cu=INR`;
    const upiQRCode = await generateQRCode(upiQRData);
    
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    const upiTitle = 'Quick Payment';
    const upiTitleWidth = pdf.getTextWidth(upiTitle);
    pdf.text(upiTitle, (pageWidth - upiTitleWidth) / 2, yPosition);
    yPosition += 15;
    
    const qrSize = 50;
    const qrX = (pageWidth - qrSize) / 2;
    
    // Background for QR code
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(255, 102, 0);
    pdf.setLineWidth(2);
    pdf.roundedRect(qrX - 5, yPosition - 5, qrSize + 10, qrSize + 10, 3, 3, 'FD');
    
    pdf.addImage(upiQRCode, 'PNG', qrX, yPosition, qrSize, qrSize);
    yPosition += qrSize + 10;
    
    // UPI QR Label
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont('helvetica', 'normal');
    const upiText = 'Scan to pay with any UPI app';
    const upiTextWidth = pdf.getTextWidth(upiText);
    pdf.text(upiText, (pageWidth - upiTextWidth) / 2, yPosition);
    yPosition += 20;
    
  } catch (error) {
    console.error('Error generating UPI QR code:', error);
  }
  
  // Contact Owner Section (Orange highlighted box)
  const contactBoxHeight = 25;
  pdf.setFillColor(255, 102, 0); // Orange background
  pdf.roundedRect(margin, yPosition, usableWidth, contactBoxHeight, 5, 5, 'F');
  
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255); // White text
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Owner', margin + 5, yPosition + 8);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${encodeText(property.ownerName)}`, margin + 5, yPosition + 16);
  pdf.text(`Phone: ${property.contactPhone}`, margin + 5, yPosition + 22);
  
  yPosition += contactBoxHeight + 25;
  
  // Tuleeto Branding Section
  pdf.setFontSize(20);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const brandText = 'TULEETO';
  const brandWidth = pdf.getTextWidth(brandText);
  pdf.text(brandText, (pageWidth - brandWidth) / 2, yPosition);
  
  yPosition += 10;
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.setFont('helvetica', 'italic');
  const footerText = 'Find your perfect home at Tuleeto.in - India\'s trusted rental platform';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, yPosition);
  
  // Save PDF
  const cleanLocation = encodeText(property.location).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanLocation}_TO_LET_Flyer.pdf`;
  pdf.save(fileName);
};
