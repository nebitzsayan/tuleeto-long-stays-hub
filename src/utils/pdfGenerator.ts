import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { OLA_MAPS_CONFIG } from '@/lib/olaMapsConfig';

interface PropertyForPDF {
  propertyId: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  description: string;
  features: string[];
  images: string[];
  ownerName: string;
  contactPhone: string;
  coordinates?: { lat: number; lng: number };
}

interface Base64Data {
  dataURL: string;
  format: string;
}

const loadImageAsBase64 = (url: string): Promise<Base64Data> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      const dataParts = dataURL.split(';base64,');
      const format = dataParts[0].split(':')[1];
      const data = dataParts[1];
      resolve({ dataURL, format });
    };
    img.onerror = (error) => reject(error);
    img.src = url;
  });
};

const encodeText = (text: string): string => {
  return text.replace(/[\u00A0-\uFFFF]/g, (char) => `&#${char.charCodeAt(0)};`);
};

export const generatePropertyPDF = async (property: PropertyForPDF) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const usableWidth = pageWidth - (margin * 2);
  
  let yPosition = 0; // Start at the very top
  
  // Header - TO-LET with Logo
  pdf.setFillColor(255, 102, 0);
  pdf.rect(0, yPosition, pageWidth, 35, 'F');
  
  // Add logo on the left side of header
  try {
    const logoData = await loadImageAsBase64('/images-resources/d5b8b33e-0c09-4345-8859-4dc176bc39a3.png');
    const logoSize = 25;
    pdf.addImage(logoData.dataURL, 'PNG', 10, yPosition + 5, logoSize, logoSize);
  } catch (error) {
    console.log('Logo not loaded, continuing without it');
  }
  
  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  const text = 'TO-LET';
  const textWidth = pdf.getTextWidth(text);
  pdf.text(text, (pageWidth - textWidth) / 2, yPosition + 22);
  
  yPosition += 45;
  
  // Location - Fixed overlapping text
  pdf.setFillColor(240, 240, 240);
  const locationHeight = 25; // Increased height to prevent overlapping
  pdf.rect(margin, yPosition, usableWidth, locationHeight, 'F');
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('LOCATION:', margin + 5, yPosition + 8);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const locationText = encodeText(property.location);
  const maxLocationWidth = usableWidth - 10;
  const locationLines = pdf.splitTextToSize(locationText, maxLocationWidth);
  
  // Position location text properly to avoid overlap
  let locationY = yPosition + 15; // Start below the LOCATION: label
  locationLines.forEach((line: string, index: number) => {
    if (index < 2) { // Limit to 2 lines to prevent overflow
      pdf.text(line, margin + 5, locationY);
      locationY += 5;
    }
  });
  
  yPosition += locationHeight + 10;
  
  // Price
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, yPosition, usableWidth, 20, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const priceText = `₹${property.price.toLocaleString('en-IN')}/month`;
  const priceWidth = pdf.getTextWidth(priceText);
  pdf.text(priceText, (pageWidth - priceWidth) / 2, yPosition + 13);
  
  yPosition += 30;
  
  // Property Images
  if (property.images && property.images.length > 0) {
    const imagesToShow = property.images.slice(0, 2);
    const imageWidth = imagesToShow.length === 1 ? usableWidth : (usableWidth - 5) / 2;
    const imageHeight = 60;
    
    for (let i = 0; i < imagesToShow.length; i++) {
      try {
        const imageData = await loadImageAsBase64(imagesToShow[i]);
        const xPos = margin + (i * (imageWidth + 5));
        pdf.addImage(imageData.dataURL, imageData.format, xPos, yPosition, imageWidth, imageHeight);
      } catch (error) {
        console.error(`Error loading image ${i + 1}:`, error);
      }
    }
    
    yPosition += imageHeight + 15;
  }
  
  // Amenities Section (clean, non-boxy design)
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, yPosition, usableWidth, 12, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AMENITIES', margin + 5, yPosition + 8);
  
  yPosition += 20;
  
  const amenities = [
    ['• Air Conditioning', property.features.some(f => f.toLowerCase().includes('ac') || f.toLowerCase().includes('air condition')) ? 'YES' : 'NO'],
    ['• WiFi', property.features.some(f => f.toLowerCase().includes('wifi') || f.toLowerCase().includes('internet')) ? 'YES' : 'NO'],
    ['• Parking', property.features.some(f => f.toLowerCase().includes('parking')) ? 'YES' : 'NO'],
    ['• Pet Friendly', property.features.some(f => f.toLowerCase().includes('pet')) ? 'YES' : 'NO']
  ];
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  amenities.forEach(([amenity, status]) => {
    pdf.text(amenity, margin + 5, yPosition);
    pdf.setTextColor(status === 'YES' ? 0 : 180, status === 'YES' ? 150 : 0, 0);
    pdf.text(status, margin + usableWidth - 20, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 8;
  });
  
  yPosition += 15;
  
  // Ola Maps Static Map (replacing Mapbox)
  if (property.coordinates && property.coordinates.lat && property.coordinates.lng) {
    try {
      // Use Ola Maps static map API instead of Mapbox
      const mapUrl = `https://api.olamaps.io/places/v1/staticmap?center=${property.coordinates.lat},${property.coordinates.lng}&zoom=16&size=400x200&markers=color:red|${property.coordinates.lat},${property.coordinates.lng}&api_key=${OLA_MAPS_CONFIG.apiKey}`;
      
      const mapData = await loadImageAsBase64(mapUrl);
      const mapWidth = usableWidth * 0.8;
      const mapHeight = 40;
      const mapX = margin + (usableWidth - mapWidth) / 2;
      
      pdf.addImage(mapData.dataURL, 'PNG', mapX, yPosition, mapWidth, mapHeight);
      yPosition += mapHeight + 10;
      
      // Map caption with Ola Maps branding
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const mapCaption = 'Powered by Ola Maps';
      const captionWidth = pdf.getTextWidth(mapCaption);
      pdf.text(mapCaption, (pageWidth - captionWidth) / 2, yPosition);
      yPosition += 15;
    } catch (error) {
      console.error('Error loading Ola Maps static map:', error);
      // Fallback: Show coordinates instead
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const coordText = `Location: ${property.coordinates.lat.toFixed(6)}, ${property.coordinates.lng.toFixed(6)}`;
      const coordWidth = pdf.getTextWidth(coordText);
      pdf.text(coordText, (pageWidth - coordWidth) / 2, yPosition);
      yPosition += 15;
    }
  }
  
  // QR Code Section
  if (property.propertyId) {
    try {
      const propertyUrl = `${window.location.origin}/property/${property.propertyId}`;
      const qrCodeDataURL = await QRCode.toDataURL(propertyUrl, {
        width: 80,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
      
      const qrSize = 30;
      const qrX = (pageWidth - qrSize) / 2;
      pdf.addImage(qrCodeDataURL, 'PNG', qrX, yPosition, qrSize, qrSize);
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const qrText = 'Scan to view online';
      const qrTextWidth = pdf.getTextWidth(qrText);
      pdf.text(qrText, (pageWidth - qrTextWidth) / 2, yPosition + qrSize + 8);
      
      yPosition += qrSize + 25;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Contact Section
  pdf.setFillColor(255, 102, 0);
  pdf.rect(margin, yPosition, usableWidth, 25, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CONTACT INFORMATION', margin + 10, yPosition + 8);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Name: ${encodeText(property.ownerName)}`, margin + 10, yPosition + 19);
  pdf.text(`Phone: ${property.contactPhone}`, margin + 10, yPosition + 23);
  
  // Save PDF (no footer section)
  const cleanLocation = encodeText(property.location).replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `TO_LET_${cleanLocation}.pdf`;
  pdf.save(fileName);
};
