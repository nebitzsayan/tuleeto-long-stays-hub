
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

// Enhanced input validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
export const validateImageFile = (file: File): Promise<{ isValid: boolean; error?: string }> => {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return Promise.resolve({ isValid: false, error: "File size exceeds 10MB limit" });
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return Promise.resolve({ isValid: false, error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed" });
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
  });
};

// Enhanced rate limiting (simple client-side implementation)
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

// Security event logging with enhanced sanitization
export const logSecurityEvent = async (event: string, details: any) => {
  try {
    // Sanitize the details to prevent logging sensitive information
    const sanitizedDetails = sanitizeLogDetails(details);
    
    // In development, log to console
    if (import.meta.env.DEV) {
      console.log(`[SECURITY] ${event}:`, sanitizedDetails);
    }
    
    // In production, you would send this to a proper logging service
    // For now, we'll store in a separate security_logs table if it exists
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Sanitize log details to prevent sensitive data leakage
const sanitizeLogDetails = (details: any): any => {
  if (!details || typeof details !== 'object') {
    return details;
  }
  
  const sanitized = { ...details };
  
  // Remove or mask sensitive fields
  const sensitiveFields = ['password', 'token', 'email', 'phone', 'credit_card', 'ssn'];
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      if (field === 'email') {
        // Partially mask email
        const email = sanitized[field];
        if (typeof email === 'string' && email.includes('@')) {
          const [local, domain] = email.split('@');
          sanitized[field] = `${local.substring(0, 2)}***@${domain}`;
        }
      } else {
        sanitized[field] = '[REDACTED]';
      }
    }
  }
  
  return sanitized;
};

// Role checking utility (using the secure function)
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

// Check if user is admin using the secure function
export const isAdmin = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_current_user_admin');
    
    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
};

// Content Security Policy helper
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Safe HTML rendering helper (to replace dangerouslySetInnerHTML)
export const createSafeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};
