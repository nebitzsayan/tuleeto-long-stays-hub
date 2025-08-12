
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

// Clean text encoding function to handle special characters
const cleanText = (text: string): string => {
  return text
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Map common special characters
      const charMap: { [key: string]: string } = {
        'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
        'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
        'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
        'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
        'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
        'ñ': 'n', 'ç': 'c',
        ''': "'", ''': "'", '"': '"', '"': '"',
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
  const margin = 10;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 20;
  
  // Header - TO-LET
  pdf.setFontSize(28);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const headerText = 'TO-LET';
  const headerWidth = pdf.getTextWidth(headerText);
  pdf.text(headerText, (pageWidth - headerWidth) / 2, yPosition);
  
  yPosition += 15;
  
  // Property Title
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const cleanTitle = cleanText(property.title);
  const titleLines = pdf.splitTextToSize(cleanTitle, usableWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 6) + 5;
  
  // Price - Prominent display
  pdf.setFontSize(20);
  pdf.setTextColor(255, 102, 0);
  pdf.setFont('helvetica', 'bold');
  const priceText = `Rs. ${property.price.toLocaleString('en-IN')}/month`;
  const priceWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition);
  yPosition += 12;
  
  // Address
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  const cleanLocation = cleanText(property.location);
  const locationText = `Address: ${cleanLocation}`;
  const locationLines = pdf.splitTextToSize(locationText, usableWidth);
  pdf.text(locationLines, margin, yPosition);
  yPosition += (locationLines.length * 5) + 5;
  
  // Contact Details
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact:', margin, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'normal');
  const cleanOwnerName = cleanText(property.ownerName);
  pdf.text(`Owner: ${cleanOwnerName}`, margin, yPosition);
  yPosition += 4;
  pdf.text(`Phone: ${property.contactPhone}`, margin, yPosition);
  yPosition += 8;
  
  // Property Details
  pdf.setFont('helvetica', 'bold');
  pdf.text('Details:', margin, yPosition);
  yPosition += 5;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${property.bedrooms} BHK | ${property.bathrooms} Bath | ${property.area} sq ft`, margin, yPosition);
  yPosition += 8;
  
  // Amenities
  if (property.features && property.features.length > 0) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amenities:', margin, yPosition);
    yPosition += 5;
    
    pdf.setFont('helvetica', 'normal');
    const hasWifi = property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet'));
    const hasAC = property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition'));
    const petsAllowed = property.features.some(f => f.toLowerCase().includes('pet'));
    
    pdf.text(`Wi-Fi: ${hasWifi ? 'Yes' : 'No'} | AC: ${hasAC ? 'Yes' : 'No'} | Pets: ${petsAllowed ? 'Yes' : 'No'}`, margin, yPosition);
    yPosition += 10;
  }
  
  // Images and QR Code Section - Side by side layout
  if (property.images && property.images.length > 0) {
    try {
      // Calculate dimensions for side-by-side layout
      const imageWidth = usableWidth * 0.65; // 65% for images
      const qrWidth = usableWidth * 0.3; // 30% for QR code
      const maxImgHeight = 60;
      
      // Load and display first two images
      const imagesToShow = property.images.slice(0, 2);
      const imageHeight = maxImgHeight / imagesToShow.length;
      
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
          
          const imgY = yPosition + (i * imageHeight);
          
          // Border for images
          pdf.setDrawColor(200, 200, 200);
          pdf.setLineWidth(0.5);
          pdf.rect(margin, imgY, imgWidth, imgHeight, 'S');
          
          pdf.addImage(imageData.dataURL, 'JPEG', margin, imgY, imgWidth, imgHeight);
        } catch (error) {
          console.error(`Error loading image ${i + 1}:`, error);
        }
      }
      
      // QR Code on the right side
      if (property.propertyId) {
        try {
          const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
          const qrCodeDataUrl = await generateQRCode(propertyUrl);
          
          const qrSize = 50;
          const qrX = margin + imageWidth + 10;
          const qrY = yPosition + (maxImgHeight - qrSize) / 2;
          
          // QR Code text above
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          const qrText = 'Scan for full details';
          const qrTextWidth = pdf.getTextWidth(qrText);
          pdf.text(qrText, qrX + (qrSize - qrTextWidth) / 2, qrY - 5);
          
          // QR Code
          pdf.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
      
      yPosition += maxImgHeight + 15;
    } catch (error) {
      console.error('Error in image section:', error);
      yPosition += 10;
    }
  }
  
  // Footer with logo
  try {
    const logoUrl = '/lovable-uploads/2f743f2f-28e7-4574-8f78-3b4311ec2885.png';
    const logoData = await loadImageAsBase64(logoUrl);
    
    const logoSize = 20;
    const logoX = (pageWidth - logoSize) / 2;
    const logoY = pageHeight - 30;
    
    pdf.addImage(logoData.dataURL, 'PNG', logoX, logoY, logoSize, logoSize);
    
    // Company text
    pdf.setFontSize(10);
    pdf.setTextColor(255, 102, 0);
    pdf.setFont('helvetica', 'bold');
    const logoText = 'Tuleeto.in';
    const logoTextWidth = pdf.getTextWidth(logoText);
    pdf.text(logoText, (pageWidth - logoTextWidth) / 2, logoY + logoSize + 5);
    
  } catch (error) {
    console.error('Error loading logo:', error);
    // Fallback text footer
    pdf.setFontSize(10);
    pdf.setTextColor(255, 102, 0);
    pdf.setFont('helvetica', 'bold');
    const footerText = 'Tuleeto.in';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 15);
  }
  
  // Save PDF
  const cleanTitleForFile = cleanText(property.title).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${cleanTitleForFile}_TO_LET.pdf`;
  pdf.save(fileName);
};
