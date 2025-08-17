
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
  
  // Property Name (Bold, Black)
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const encodedTitle = encodeText(property.title);
  const titleWidth = pdf.getTextWidth(encodedTitle);
  pdf.text(encodedTitle, (pageWidth - titleWidth) / 2, yPosition);
  
  yPosition += 15;
  
  // Full Address (Smaller, Gray)
  pdf.setFontSize(12);
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
  
  // QR Code for UPI Payment (Centered)
  try {
    const upiQRData = `upi://pay?pa=owner@upi&pn=${encodeURIComponent(property.ownerName)}&am=${property.price}&cu=INR`;
    const upiQRCode = await generateQRCode(upiQRData);
    
    const qrSize = 60;
    const qrX = (pageWidth - qrSize) / 2;
    
    // Background for QR code
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
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
  
  // Property Specifications Table
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  const tableY = yPosition;
  const tableHeight = 40;
  const leftColWidth = usableWidth / 2;
  const rightColWidth = usableWidth / 2;
  
  // Table background
  pdf.setFillColor(250, 250, 250);
  pdf.setDrawColor(255, 102, 0);
  pdf.setLineWidth(2);
  pdf.roundedRect(margin, tableY, usableWidth, tableHeight, 5, 5, 'FD');
  
  // Table content
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  let tableRowY = tableY + 8;
  
  // Left column
  pdf.text(`Bedrooms: ${property.bedrooms}`, margin + 5, tableRowY);
  tableRowY += 8;
  pdf.text(`Bathrooms: ${property.bathrooms}`, margin + 5, tableRowY);
  
  // Right column
  tableRowY = tableY + 8;
  pdf.text(`Area: ${property.area} sq ft`, margin + leftColWidth + 5, tableRowY);
  tableRowY += 8;
  pdf.text(`Rooms: ${property.bedrooms + 1}`, margin + leftColWidth + 5, tableRowY);
  
  yPosition = tableY + tableHeight + 10;
  
  // Amenities Section
  if (property.features && property.features.length > 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amenities:', margin + 5, yPosition);
    yPosition += 8;
    
    // Convert features to YES/NO format
    const amenityChecks = {
      'AIR CONDITIONING': property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition')),
      'WIFI': property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet')),
      'PARKING': property.features.some(f => f.toLowerCase().includes('parking')),
      'PET FRIENDLY': property.features.some(f => f.toLowerCase().includes('pet'))
    };
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    Object.entries(amenityChecks).forEach(([amenity, hasAmenity]) => {
      const status = hasAmenity ? 'YES' : 'NO';
      const color = hasAmenity ? [0, 150, 0] : [150, 0, 0]; // Green for YES, Red for NO
      
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${amenity}: `, margin + 5, yPosition);
      pdf.setTextColor(...color);
      pdf.text(status, margin + 5 + pdf.getTextWidth(`${amenity}: `), yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
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
  
  yPosition += contactBoxHeight + 20;
  
  // Property Details QR Code
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const propertyQRCode = await generateQRCode(propertyUrl);
      
      // QR Code section background
      pdf.setFillColor(245, 245, 245);
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(1);
      const qrSectionHeight = 50;
      pdf.roundedRect(margin, yPosition, usableWidth, qrSectionHeight, 5, 5, 'FD');
      
      // QR Code
      const detailQRSize = 40;
      pdf.addImage(propertyQRCode, 'PNG', margin + 10, yPosition + 5, detailQRSize, detailQRSize);
      
      // QR Code details text
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text('View More Photos & Details Online', margin + detailQRSize + 20, yPosition + 12);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      
      const details = [
        '• View all property images in full resolution',
        '• See detailed property information',
        '• Contact owner directly',
        '• Get directions to the property'
      ];
      
      let detailY = yPosition + 18;
      details.forEach(detail => {
        pdf.text(detail, margin + detailQRSize + 20, detailY);
        detailY += 5;
      });
      
      yPosition += qrSectionHeight + 15;
    } catch (error) {
      console.error('Error generating property QR code:', error);
    }
  }
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(128, 128, 128);
  pdf.setFont('helvetica', 'italic');
  const footerText = 'Find your perfect home at Tuleeto.in - India\'s trusted rental platform';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
  
  // Save PDF
  const cleanLocation = encodeText(property.location).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanLocation}_TO_LET_Flyer.pdf`;
  pdf.save(fileName);
};
