
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

// Enhanced text cleaning function
const cleanText = (text: string): string => {
  return text
    .replace(/[^\x00-\x7F]/g, (char) => {
      const charMap: { [key: string]: string } = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ñ': 'n', 'ç': 'c',
        'lsquo': "'", 'rsquo': "'", 'ldquo': '"', 'rdquo': '"',
        '–': '-', '—': '-', '…': '...',
        '₹': 'Rs.'
      };
      return charMap[char] || '';
    })
    .replace(/\s+/g, ' ')
    .trim();
};

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 25;
  
  // Header - TO-LET (Professional styling)
  pdf.setFontSize(32);
  pdf.setTextColor(220, 38, 127); // Professional pink/magenta
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition);
  
  yPosition += 20;
  
  // Property Title (Clean and prominent)
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const cleanTitle = cleanText(property.title);
  const titleLines = pdf.splitTextToSize(cleanTitle, usableWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 7) + 8;
  
  // Rent (Highlighted prominently)
  pdf.setFontSize(24);
  pdf.setTextColor(220, 38, 127);
  pdf.setFont('helvetica', 'bold');
  const rentText = `Rs. ${property.price.toLocaleString('en-IN')}/month`;
  const rentWidth = pdf.getTextWidth(rentText);
  pdf.text(rentText, (pageWidth - rentWidth) / 2, yPosition);
  yPosition += 15;
  
  // Address (Clean formatting)
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  const cleanLocation = cleanText(property.location);
  const addressText = `Address: ${cleanLocation}`;
  const addressLines = pdf.splitTextToSize(addressText, usableWidth);
  pdf.text(addressLines, margin, yPosition);
  yPosition += (addressLines.length * 5) + 8;
  
  // Contact Details (Professional layout)
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Details:', margin, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  const cleanOwnerName = cleanText(property.ownerName);
  pdf.text(`Owner: ${cleanOwnerName}`, margin, yPosition);
  yPosition += 5;
  pdf.text(`Phone: ${property.contactPhone}`, margin, yPosition);
  yPosition += 10;
  
  // Property Details (Compact format)
  pdf.setFont('helvetica', 'bold');
  pdf.text('Property Details:', margin, yPosition);
  yPosition += 6;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${property.bedrooms} BHK | ${property.bathrooms} Bath | ${property.area} sq ft`, margin, yPosition);
  yPosition += 12;
  
  // Amenities (Essential info only)
  if (property.features && property.features.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amenities:', margin, yPosition);
    yPosition += 6;
    
    pdf.setFont('helvetica', 'normal');
    const hasWifi = property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet'));
    const hasAC = property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition'));
    const petsAllowed = property.features.some(f => f.toLowerCase().includes('pet'));
    
    pdf.text(`Wi-Fi: ${hasWifi ? 'Yes' : 'No'} | AC: ${hasAC ? 'Yes' : 'No'} | Pets: ${petsAllowed ? 'Yes' : 'No'}`, margin, yPosition);
    yPosition += 15;
  }
  
  // Images and QR Code section (Side by side, max 2 images)
  if (property.images && property.images.length > 0) {
    try {
      const imageWidth = usableWidth * 0.65;
      const qrWidth = usableWidth * 0.3;
      const maxImageHeight = 70;
      
      const imagesToShow = property.images.slice(0, 2);
      const imageHeight = maxImageHeight / Math.max(imagesToShow.length, 1);
      
      for (let i = 0; i < imagesToShow.length; i++) {
        try {
          const imageData = await loadImageAsBase64(imagesToShow[i]);
          
          const aspectRatio = imageData.width / imageData.height;
          let imgWidth = imageWidth;
          let imgHeight = imgWidth / aspectRatio;
          
          if (imgHeight > imageHeight) {
            imgHeight = imageHeight;
            imgWidth = imgHeight * aspectRatio;
          }
          
          const imgY = yPosition + (i * (imageHeight + 2));
          
          // Clean image border
          pdf.setDrawColor(180, 180, 180);
          pdf.setLineWidth(0.3);
          pdf.rect(margin, imgY, imgWidth, imgHeight, 'S');
          
          pdf.addImage(imageData.dataURL, 'JPEG', margin, imgY, imgWidth, imgHeight);
        } catch (error) {
          console.error(`Error loading image ${i + 1}:`, error);
        }
      }
      
      // QR Code (Right side)
      if (property.propertyId) {
        try {
          const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
          const qrCodeDataUrl = await generateQRCode(propertyUrl);
          
          const qrSize = 60;
          const qrX = margin + imageWidth + 15;
          const qrY = yPosition + (maxImageHeight - qrSize) / 2;
          
          // QR Code instruction text
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          const qrText = 'Scan below to get';
          const qrText2 = 'full details';
          const qrTextWidth = pdf.getTextWidth(qrText);
          const qrText2Width = pdf.getTextWidth(qrText2);
          
          pdf.text(qrText, qrX + (qrSize - qrTextWidth) / 2, qrY - 8);
          pdf.text(qrText2, qrX + (qrSize - qrText2Width) / 2, qrY - 3);
          
          pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
      
      yPosition += maxImageHeight + 20;
    } catch (error) {
      console.error('Error in image section:', error);
      yPosition += 15;
    }
  }
  
  // Footer with logo (Professional placement)
  try {
    const logoUrl = '/lovable-uploads/2f743f2f-28e7-4574-8f78-3b4311ec2885.png';
    const logoData = await loadImageAsBase64(logoUrl);
    
    const logoSize = 25;
    const logoX = (pageWidth - logoSize) / 2;
    const logoY = pageHeight - 40;
    
    pdf.addImage(logoData.dataURL, 'PNG', logoX, logoY, logoSize, logoSize);
    
    pdf.setFontSize(12);
    pdf.setTextColor(220, 38, 127);
    pdf.setFont('helvetica', 'bold');
    const brandText = 'Tuleeto.in';
    const brandWidth = pdf.getTextWidth(brandText);
    pdf.text(brandText, (pageWidth - brandWidth) / 2, logoY + logoSize + 8);
    
  } catch (error) {
    console.error('Error loading logo:', error);
    pdf.setFontSize(12);
    pdf.setTextColor(220, 38, 127);
    pdf.setFont('helvetica', 'bold');
    const footerText = 'Tuleeto.in';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 20);
  }
  
  // Save PDF with clean filename
  const cleanTitleForFile = cleanText(property.title).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanTitleForFile}_TO_LET.pdf`;
  pdf.save(fileName);
};
