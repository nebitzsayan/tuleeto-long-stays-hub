/**
 * Phone number formatting utilities
 */

/**
 * Format phone number with partial masking for privacy
 * Shows: +91 XXXxxxxxxx (country code + first 3 digits, rest masked)
 */
export const formatPhonePartialMask = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");
  
  // Handle various lengths
  if (digits.length >= 10) {
    // Get last 10 digits (the actual phone number)
    const lastTen = digits.slice(-10);
    const first3 = lastTen.slice(0, 3);
    return `+91 ${first3}${"x".repeat(7)}`;
  }
  
  // If less than 10 digits, just mask partially
  if (digits.length >= 3) {
    const visible = digits.slice(0, 3);
    const masked = "x".repeat(digits.length - 3);
    return `+91 ${visible}${masked}`;
  }
  
  // Return original if too short
  return phone;
};

/**
 * Format phone number for display (no masking)
 * Adds proper spacing for Indian numbers
 */
export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length >= 10) {
    const lastTen = digits.slice(-10);
    // Format as: +91 XXXXX XXXXX
    return `+91 ${lastTen.slice(0, 5)} ${lastTen.slice(5)}`;
  }
  
  return phone;
};

/**
 * Get raw phone number for calling (with country code)
 */
export const getPhoneForCall = (phone: string | null | undefined): string => {
  if (!phone) return "";
  
  const digits = phone.replace(/\D/g, "");
  
  if (digits.length >= 10) {
    const lastTen = digits.slice(-10);
    return `+91${lastTen}`;
  }
  
  return phone;
};
