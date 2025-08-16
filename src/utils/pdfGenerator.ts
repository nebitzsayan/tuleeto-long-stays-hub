
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
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 20;
  
  // Header - TO-LET
  pdf.setFontSize(32);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition);
  
  yPosition += 15;
  
  // Property Title
  pdf.setFontSize(18);
  pdf.setTextColor(33, 37, 41);
  pdf.setFont('helvetica', 'bold');
  const encodedTitle = encodeText(property.title);
  const titleLines = pdf.splitTextToSize(encodedTitle, usableWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 7) + 8;
  
  // Price - Prominent display
  pdf.setFontSize(22);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const priceText = `₹${property.price.toLocaleString('en-IN')}/month`;
  const priceWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition);
  yPosition += 12;
  
  // Address
  pdf.setFontSize(12);
  pdf.setTextColor(52, 58, 64);
  pdf.setFont('helvetica', 'normal');
  const encodedLocation = encodeText(property.location);
  const locationLines = pdf.splitTextToSize(`Address: ${encodedLocation}`, usableWidth);
  pdf.text(locationLines, margin, yPosition);
  yPosition += (locationLines.length * 5) + 8;
  
  // Contact Details
  pdf.setFontSize(12);
  pdf.setTextColor(52, 58, 64);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Details:', margin, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  const encodedOwnerName = encodeText(property.ownerName);
  pdf.text(`Owner: ${encodedOwnerName}`, margin, yPosition);
  yPosition += 5;
  pdf.text(`Phone: ${property.contactPhone}`, margin, yPosition);
  yPosition += 10;
  
  // Property Details in compact format
  pdf.setFontSize(11);
  pdf.setTextColor(33, 37, 41);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Property Details:', margin, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  const details = [
    `${property.bedrooms} Bedrooms | ${property.bathrooms} Bathrooms | ${property.area} sq ft`
  ];
  
  details.forEach(detail => {
    pdf.text(detail, margin, yPosition);
    yPosition += 5;
  });
  yPosition += 5;
  
  // Amenities
  if (property.features && property.features.length > 0) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amenities:', margin, yPosition);
    yPosition += 6;
    
    pdf.setFont('helvetica', 'normal');
    // Check for specific amenities
    const hasWifi = property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet'));
    const hasAC = property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition'));
    const petsAllowed = property.features.some(f => f.toLowerCase().includes('pet'));
    
    const amenityList = [
      `Wi-Fi: ${hasWifi ? 'Yes' : 'No'}`,
      `AC: ${hasAC ? 'Yes' : 'No'}`,
      `Pets Allowed: ${petsAllowed ? 'Yes' : 'No'}`
    ];
    
    amenityList.forEach(amenity => {
      pdf.text(`• ${amenity}`, margin, yPosition);
      yPosition += 4;
    });
    yPosition += 8;
  }
  
  // Property Image - maintain aspect ratio
  if (property.images && property.images.length > 0) {
    try {
      const imageUrl = property.images[0];
      const imageData = await loadImageAsBase64(imageUrl);
      
      const maxImgWidth = usableWidth;
      const maxImgHeight = 80;
      
      const aspectRatio = imageData.width / imageData.height;
      let imgWidth = maxImgWidth;
      let imgHeight = imgWidth / aspectRatio;
      
      if (imgHeight > maxImgHeight) {
        imgHeight = maxImgHeight;
        imgWidth = imgHeight * aspectRatio;
      }
      
      const imgX = (pageWidth - imgWidth) / 2;
      
      // Clean border
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(imgX, yPosition, imgWidth, imgHeight, 'S');
      
      pdf.addImage(imageData.dataURL, 'JPEG', imgX, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    } catch (error) {
      console.error('Error loading image:', error);
    }
  }
  
  // QR Code Section
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const qrCodeDataUrl = await generateQRCode(propertyUrl);
      
      // QR Code text
      pdf.setFontSize(11);
      pdf.setTextColor(33, 37, 41);
      pdf.setFont('helvetica', 'bold');
      const qrText = 'Scan below to get full details of the property';
      const qrTextWidth = pdf.getTextWidth(qrText);
      pdf.text(qrText, (pageWidth - qrTextWidth) / 2, yPosition);
      yPosition += 8;
      
      // QR Code
      const qrSize = 40;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrCodeDataUrl, 'PNG', qrX, yPosition, qrSize, qrSize);
      yPosition += qrSize + 15;
      
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Footer with logo - centered at bottom
  try {
    const logoUrl = '/lovable-uploads/2f743f2f-28e7-4574-8f78-3b4311ec2885.png';
    const logoData = await loadImageAsBase64(logoUrl);
    
    const logoWidth = 25;
    const logoHeight = 25;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = pageHeight - 35;
    
    pdf.addImage(logoData.dataURL, 'PNG', logoX, logoY, logoWidth, logoHeight);
    
    // Company text
    pdf.setFontSize(12);
    pdf.setTextColor(255, 102, 0);
    pdf.setFont('helvetica', 'bold');
    const logoText = 'Tuleeto.in';
    const logoTextWidth = pdf.getTextWidth(logoText);
    pdf.text(logoText, (pageWidth - logoTextWidth) / 2, logoY + logoHeight + 8);
    
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback text footer
    pdf.setFontSize(12);
    pdf.setTextColor(255, 102, 0);
    pdf.setFont('helvetica', 'bold');
    const footerText = 'Tuleeto.in';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
  }
  
  // Save PDF
  const cleanTitle = encodeText(property.title).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanTitle}_TO_LET.pdf`;
  pdf.save(fileName);
};
