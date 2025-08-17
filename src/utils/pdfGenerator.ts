
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

const drawGradientHeader = (pdf: jsPDF, pageWidth: number) => {
  // Create gradient effect using multiple rectangles
  const headerHeight = 50;
  const steps = 20;
  
  for (let i = 0; i < steps; i++) {
    const alpha = 1 - (i / steps) * 0.8;
    const orangeIntensity = 255 - (i / steps) * 100;
    
    pdf.setFillColor(orangeIntensity, Math.floor(102 * alpha), Math.floor(22 * alpha));
    pdf.rect(0, i * (headerHeight / steps), pageWidth, headerHeight / steps, 'F');
  }
};

const drawSection = (pdf: jsPDF, x: number, y: number, width: number, height: number, title: string, content: () => void) => {
  // Draw section background with subtle shadow
  pdf.setFillColor(250, 250, 250);
  pdf.setDrawColor(230, 230, 230);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(x, y, width, height, 8, 8, 'FD');
  
  // Add subtle inner shadow effect
  pdf.setDrawColor(240, 240, 240);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(x + 1, y + 1, width - 2, height - 2, 6, 6, 'D');
  
  // Section title
  if (title) {
    pdf.setFontSize(14);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, x + 10, y + 15);
  }
  
  content();
};

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 20;
  
  // Beautiful gradient header
  drawGradientHeader(pdf, pageWidth);
  
  // Main Header - TO-LET with modern styling
  pdf.setFontSize(42);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition + 25);
  
  // Add decorative elements
  const decorLineY = yPosition + 30;
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(2);
  pdf.line((pageWidth - headerWidth) / 2 - 20, decorLineY, (pageWidth - headerWidth) / 2 - 5, decorLineY);
  pdf.line((pageWidth + headerWidth) / 2 + 5, decorLineY, (pageWidth + headerWidth) / 2 + 20, decorLineY);
  
  // Subtitle with elegant styling
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = '✦ PREMIUM RENTAL AVAILABLE ✦';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, yPosition + 40);
  
  yPosition = 75;
  
  // Property Title with modern card design
  drawSection(pdf, margin, yPosition, usableWidth, 25, '', () => {
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(encodeText(property.title), usableWidth - 20);
    let titleY = yPosition + 15;
    titleLines.forEach((line: string) => {
      const lineWidth = pdf.getTextWidth(line);
      pdf.text(line, (pageWidth - lineWidth) / 2, titleY);
      titleY += 8;
    });
  });
  
  yPosition += 35;
  
  // Location with icon-style design
  pdf.setFontSize(12);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const locationText = `📍 ${encodeText(property.location)}`;
  const locationWidth = pdf.getTextWidth(locationText);
  pdf.text(locationText, (pageWidth - locationWidth) / 2, yPosition);
  
  yPosition += 15;
  
  // Price with premium styling
  drawSection(pdf, margin, yPosition, usableWidth, 30, '', () => {
    pdf.setFontSize(28);
    pdf.setTextColor(255, 102, 0);
    pdf.setFont('helvetica', 'bold');
    const priceText = `₹${property.price.toLocaleString('en-IN')}`;
    const priceWidth = pdf.getTextWidth(priceText);
    pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition + 20);
    
    pdf.setFontSize(12);
    pdf.setTextColor(80, 80, 80);
    pdf.setFont('helvetica', 'normal');
    const perMonthText = 'per month';
    const perMonthWidth = pdf.getTextWidth(perMonthText);
    pdf.text(perMonthText, (pageWidth - perMonthWidth) / 2, yPosition + 26);
  });
  
  yPosition += 45;
  
  // Property Images with modern layout
  if (property.images && property.images.length > 0) {
    try {
      const imagesToShow = property.images.slice(0, 3);
      const imageWidth = (usableWidth - 20) / imagesToShow.length;
      const imageHeight = 50;
      
      let imageX = margin + 10;
      
      for (const imageUrl of imagesToShow) {
        try {
          const imageData = await loadImageAsBase64(imageUrl);
          
          // Add image border with shadow effect
          pdf.setFillColor(240, 240, 240);
          pdf.roundedRect(imageX - 2, yPosition - 2, imageWidth + 4, imageHeight + 4, 5, 5, 'F');
          
          pdf.addImage(imageData.dataURL, 'JPEG', imageX, yPosition, imageWidth, imageHeight);
          
          // Add subtle border
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(imageX, yPosition, imageWidth, imageHeight, 3, 3, 'D');
          
          imageX += imageWidth + 10;
        } catch (error) {
          console.error('Error loading image:', error);
        }
      }
      
      yPosition += imageHeight + 20;
    } catch (error) {
      console.error('Error processing images:', error);
    }
  }
  
  // Property Specifications with beautiful cards
  drawSection(pdf, margin, yPosition, usableWidth, 60, 'Property Specifications', () => {
    const specs = [
      { icon: '🏠', label: 'Bedrooms', value: property.bedrooms.toString() },
      { icon: '🚿', label: 'Bathrooms', value: property.bathrooms.toString() },
      { icon: '📐', label: 'Area', value: `${property.area} sq ft` },
      { icon: '🏡', label: 'Total Rooms', value: (property.bedrooms + 1).toString() }
    ];
    
    const cardWidth = (usableWidth - 50) / 2;
    const cardHeight = 20;
    let cardX = margin + 10;
    let cardY = yPosition + 25;
    
    specs.forEach((spec, index) => {
      // Spec card background
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 4, 4, 'FD');
      
      // Icon and text
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${spec.icon} ${spec.label}:`, cardX + 5, cardY + 8);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 102, 0);
      pdf.text(spec.value, cardX + 5, cardY + 15);
      
      if (index % 2 === 1) {
        cardX = margin + 10;
        cardY += cardHeight + 5;
      } else {
        cardX += cardWidth + 10;
      }
    });
  });
  
  yPosition += 75;
  
  // Amenities with beautiful icons
  drawSection(pdf, margin, yPosition, usableWidth, 45, 'Premium Amenities', () => {
    const amenityIcons = {
      'Air Conditioning': '❄️',
      'WiFi': '📶',
      'Parking': '🚗',
      'Pet Friendly': '🐕',
      'PG (Paying Guest)': '🏠'
    };
    
    const amenityChecks = {
      'Air Conditioning': property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition')),
      'WiFi': property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet')),
      'Parking': property.features.some(f => f.toLowerCase().includes('parking')),
      'Pet Friendly': property.features.some(f => f.toLowerCase().includes('pet')),
      'PG (Paying Guest)': property.features.some(f => f.toLowerCase().includes('pg') || f.toLowerCase().includes('paying guest'))
    };
    
    const amenityWidth = (usableWidth - 40) / 3;
    let amenityX = margin + 15;
    let amenityY = yPosition + 25;
    let count = 0;
    
    Object.entries(amenityChecks).forEach(([amenity, hasAmenity]) => {
      const bgColor = hasAmenity ? [230, 255, 230] : [255, 240, 240];
      const textColor = hasAmenity ? [34, 139, 34] : [220, 20, 60];
      
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      pdf.setDrawColor(hasAmenity ? 34 : 220, hasAmenity ? 139 : 20, hasAmenity ? 34 : 60);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(amenityX, amenityY, amenityWidth, 12, 3, 3, 'FD');
      
      pdf.setFontSize(8);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.setFont('helvetica', 'bold');
      const icon = amenityIcons[amenity as keyof typeof amenityIcons] || '✓';
      const status = hasAmenity ? '✓' : '✗';
      pdf.text(`${icon} ${amenity} ${status}`, amenityX + 3, amenityY + 8);
      
      count++;
      if (count % 3 === 0) {
        amenityX = margin + 15;
        amenityY += 15;
      } else {
        amenityX += amenityWidth + 10;
      }
    });
  });
  
  yPosition += 60;
  
  // QR Codes section with modern design
  const qrSection = usableWidth / 2 - 10;
  
  // Property Details QR
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const propertyQRCode = await generateQRCode(propertyUrl);
      
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(255, 102, 0);
      pdf.setLineWidth(2);
      pdf.roundedRect(margin, yPosition, qrSection, 70, 8, 8, 'FD');
      
      pdf.addImage(propertyQRCode, 'PNG', margin + 15, yPosition + 10, 40, 40);
      
      pdf.setFontSize(10);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Scan for Details', margin + 10, yPosition + 58);
      pdf.setFont('helvetica', 'normal');
      pdf.text('View full property info', margin + 10, yPosition + 65);
      
    } catch (error) {
      console.error('Error generating property QR code:', error);
    }
  }
  
  // Payment QR
  try {
    const upiQRData = `upi://pay?pa=owner@upi&pn=${encodeURIComponent(property.ownerName)}&am=${property.price}&cu=INR`;
    const upiQRCode = await generateQRCode(upiQRData);
    
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(34, 139, 34);
    pdf.setLineWidth(2);
    pdf.roundedRect(margin + qrSection + 20, yPosition, qrSection, 70, 8, 8, 'FD');
    
    pdf.addImage(upiQRCode, 'PNG', margin + qrSection + 35, yPosition + 10, 40, 40);
    
    pdf.setFontSize(10);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Quick Payment', margin + qrSection + 25, yPosition + 58);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Scan to pay with UPI', margin + qrSection + 25, yPosition + 65);
    
  } catch (error) {
    console.error('Error generating UPI QR code:', error);
  }
  
  yPosition += 85;
  
  // Contact section with premium styling
  drawSection(pdf, margin, yPosition, usableWidth, 35, '', () => {
    // Contact header with gradient effect
    pdf.setFillColor(255, 102, 0);
    pdf.roundedRect(margin + 5, yPosition + 5, usableWidth - 10, 25, 6, 6, 'F');
    
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('📞 Contact Property Owner', margin + 15, yPosition + 15);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`👤 ${encodeText(property.ownerName)}`, margin + 15, yPosition + 22);
    pdf.text(`📱 ${property.contactPhone}`, margin + 15, yPosition + 27);
  });
  
  yPosition += 50;
  
  // Footer with Tuleeto branding
  pdf.setFillColor(40, 40, 40);
  pdf.roundedRect(margin, yPosition, usableWidth, 25, 6, 6, 'F');
  
  pdf.setFontSize(20);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const brandText = 'TULEETO';
  const brandWidth = pdf.getTextWidth(brandText);
  pdf.text(brandText, (pageWidth - brandWidth) / 2, yPosition + 12);
  
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);
  pdf.setFont('helvetica', 'italic');
  const footerText = '🏠 Find your perfect home at Tuleeto.in - India\'s trusted rental platform 🏠';
  const footerWidth = pdf.getTextWidth(footerText);
  pdf.text(footerText, (pageWidth - footerWidth) / 2, yPosition + 20);
  
  // Save PDF with beautiful filename
  const cleanLocation = encodeText(property.location).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Tuleeto_${cleanLocation}_Premium_Rental.pdf`;
  pdf.save(fileName);
};
