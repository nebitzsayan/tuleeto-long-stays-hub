
import { supabase } from "@/integrations/supabase/client";

// Input sanitization functions
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>\"']/g, '') // Remove potential XSS characters
    .trim()
    .slice(0, 1000); // Limit length
};

export const sanitizeHtml = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// File validation
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { isValid: false, error: "File size exceeds 10MB limit" };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" };
  }

  // Check file signature (magic numbers)
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      const header = Array.from(arr.slice(0, 4)).map(b => b.toString(16)).join('').toUpperCase();
      
      const validSignatures = [
        'FFD8FF', // JPEG
        '89504E47', // PNG
        '47494638', // GIF
        '52494646', // WEBP (RIFF)
      ];

      const isValid = validSignatures.some(sig => header.startsWith(sig));
      if (!isValid) {
        resolve({ isValid: false, error: "Invalid file signature" });
      } else {
        resolve({ isValid: true });
      }
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  }) as Promise<{ isValid: boolean; error?: string }>;
};

// Rate limiting (simple client-side implementation)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
};

// Security event logging
export const logSecurityEvent = async (event: string, details: any) => {
  try {
    console.log(`[SECURITY] ${event}:`, details);
    // In a production app, you'd send this to a logging service
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Role checking utility
export const getUserRole = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return null;
    }

    return data?.role || null;
  } catch (error) {
    console.error('Error in getUserRole:', error);
    return null;
  }
};

// Check if user is admin
export const isAdmin = async (): Promise<boolean> => {
  const role = await getUserRole();
  return role === 'admin';
};
