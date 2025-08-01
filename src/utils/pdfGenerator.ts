
import jsPDF from 'jspdf';

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
}

const loadImageAsBase64 = (url: string): Promise<string> => {
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
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const usableWidth = pageWidth - (margin * 2);
  
  // Main title - TO-LET in big orange letters
  pdf.setFontSize(32);
  pdf.setTextColor(249, 115, 22);
  pdf.setFont('helvetica', 'bold');
  const titleText = 'TO-LET';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (pageWidth - titleWidth) / 2, 25);
  
  // Subtitle - RENT AVAILABLE
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'RENT AVAILABLE';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, 35);
  
  let yPosition = 45;
  
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
  
  // Property Images - smaller and multiple images support
  if (property.images && property.images.length > 0) {
    try {
      const maxImages = Math.min(property.images.length, 4); // Show up to 4 images
      const imgWidth = maxImages === 1 ? usableWidth * 0.8 : usableWidth / 2 - 2; // Medium-small size
      const imgHeight = 35; // Reduced height
      
      let currentX = margin;
      let currentY = yPosition;
      
      for (let i = 0; i < maxImages; i++) {
        const imageUrl = property.images[i];
        const base64Image = await loadImageAsBase64(imageUrl);
        
        // Calculate position for multiple images
        if (maxImages > 1) {
          currentX = margin + (i % 2) * (imgWidth + 4);
          if (i >= 2) {
            currentY = yPosition + imgHeight + 4;
          }
        } else {
          currentX = margin + (usableWidth - imgWidth) / 2; // Center single image
        }
        
        pdf.addImage(base64Image, 'JPEG', currentX, currentY, imgWidth, imgHeight);
      }
      
      // Adjust yPosition based on number of images
      yPosition = maxImages > 2 ? currentY + imgHeight + 8 : yPosition + imgHeight + 8;
    } catch (error) {
      console.error('Error loading images:', error);
      yPosition += 5; // Small space if no images
    }
  }
  
  // Property Details Box - compact
  const boxHeight = 25;
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
  
  // Footer - updated to Tuleeto.in
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
