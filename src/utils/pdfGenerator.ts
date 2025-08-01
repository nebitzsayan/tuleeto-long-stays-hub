
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

export const generatePropertyPoster = async (property: PropertyPosterData) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Main title - TO-LER in big red letters
  pdf.setFontSize(36);
  pdf.setTextColor(220, 38, 127); // Tuleeto orange/red color
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
  pdf.text(`📍 ${property.location}`, 20, yPosition);
  yPosition += 15;
  
  // Price
  pdf.setFontSize(24);
  pdf.setTextColor(220, 38, 127);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`₹${property.price.toLocaleString('en-IN')}/month`, 20, yPosition);
  yPosition += 20;
  
  // Property Details Box
  pdf.setFillColor(245, 245, 245);
  pdf.rect(20, yPosition, pageWidth - 40, 25, 'F');
  
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  
  const detailsY = yPosition + 8;
  pdf.text(`🛏️ ${property.bedrooms} Bedrooms`, 25, detailsY);
  pdf.text(`🚿 ${property.bathrooms} Bathrooms`, 80, detailsY);
  pdf.text(`📐 ${property.area} sq ft`, 140, detailsY);
  
  if (property.averageRating && property.reviewCount) {
    pdf.text(`⭐ ${property.averageRating.toFixed(1)} (${property.reviewCount} reviews)`, 25, detailsY + 12);
  }
  
  yPosition += 35;
  
  // Description
  if (property.description) {
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Description:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const descLines = pdf.splitTextToSize(property.description, pageWidth - 40);
    pdf.text(descLines, 20, yPosition);
    yPosition += descLines.length * 5 + 10;
  }
  
  // Features/Amenities
  if (property.features && property.features.length > 0) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Amenities:', 20, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    property.features.forEach((feature) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`✓ ${feature}`, 25, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
  }
  
  // Contact Information Box
  if (yPosition > pageHeight - 50) {
    pdf.addPage();
    yPosition = 20;
  }
  
  pdf.setFillColor(220, 38, 127);
  pdf.rect(20, yPosition, pageWidth - 40, 30, 'F');
  
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Contact Owner', 25, yPosition + 10);
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`📞 ${property.contactPhone}`, 25, yPosition + 20);
  pdf.text(`👤 ${property.ownerName}`, 25, yPosition + 27);
  
  // Footer
  pdf.setFontSize(10);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Generated via Tuleeto.com - Your trusted rental platform', 20, pageHeight - 10);
  
  // Save the PDF
  const fileName = `${property.title.replace(/[^a-zA-Z0-9]/g, '_')}_rental_poster.pdf`;
  pdf.save(fileName);
};
