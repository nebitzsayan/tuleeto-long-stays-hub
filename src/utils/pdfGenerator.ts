
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
  
  // Main title - TO-LET in big orange letters
  pdf.setFontSize(36);
  pdf.setTextColor(249, 115, 22); // Orange color
  pdf.setFont('helvetica', 'bold');
  const titleText = 'TO-LET';
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.text(titleText, (pageWidth - titleWidth) / 2, 30);
  
  // Subtitle - RENT AVAILABLE
  pdf.setFontSize(18);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  const subtitleText = 'RENT AVAILABLE';
  const subtitleWidth = pdf.getTextWidth(subtitleText);
  pdf.text(subtitleText, (pageWidth - subtitleWidth) / 2, 45);
  
  let yPosition = 65;
  
  // Property Title
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  const lines = pdf.splitTextToSize(property.title, pageWidth - 40);
  pdf.text(lines, 20, yPosition);
  yPosition += lines.length * 8 + 10;
  
  // Location
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  pdf.setFont('helvetica', 'normal');
  pdf.text(property.location, 20, yPosition);
  yPosition += 15;
  
  // Price
  pdf.setFontSize(24);
  pdf.setTextColor(249, 115, 22); // Orange color
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Rs ${property.price.toLocaleString('en-IN')}/month`, 20, yPosition);
  yPosition += 25;
  
  // Property Images
  if (property.images && property.images.length > 0) {
    try {
      const imageUrl = property.images[0]; // Use the first image
      const base64Image = await loadImageAsBase64(imageUrl);
      
      const imgWidth = pageWidth - 40;
      const imgHeight = 80;
      
      pdf.addImage(base64Image, 'JPEG', 20, yPosition, imgWidth, imgHeight);
      yPosition += imgHeight + 15;
    } catch (error) {
      console.error('Error loading image:', error);
      // Continue without image if loading fails
    }
  }
  
  // Property Details Box
  pdf.setFillColor(255, 237, 213); // Light orange background
  pdf.rect(20, yPosition, pageWidth - 40, 35, 'F');
  
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  
  const detailsY = yPosition + 12;
  pdf.text(`Bedrooms: ${property.bedrooms}`, 25, detailsY);
  pdf.text(`Bathrooms: ${property.bathrooms}`, 25, detailsY + 8);
  pdf.text(`Area: ${property.area} sq ft`, 25, detailsY + 16);
  pdf.text(`Rooms: ${property.bedrooms + 1}`, 25, detailsY + 24);
  
  yPosition += 45;
  
  // Contact Information Box
  if (yPosition > pageHeight - 50) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFillColor(249, 115, 22); // Orange background
  pdf.rect(20, yPosition, pageWidth - 40, 30, 'F');
  
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Owner', 25, yPosition + 12);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Phone: ${property.contactPhone}`, 25, yPosition + 20);
  pdf.text(`Name: ${property.ownerName}`, 25, yPosition + 26);
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Generated via Tuleeto.com - Your trusted rental platform', 20, pageHeight - 10);
  
  // Save the PDF
  const fileName = `${property.title.replace(/[^a-zA-Z0-9]/g, '_')}_rental_poster.pdf`;
  pdf.save(fileName);
};
