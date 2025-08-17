// Enhanced secure logging utility with security event logging
const isDevelopment = import.meta.env.DEV;

export const secureLog = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      // In production, log to a proper logging service
      // For now, we'll just log sanitized errors
      console.error(`[ERROR] ${message}`);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

// Enhanced security event logging - simplified version that doesn't use database
export const logSecurityEvent = async (
  eventType: string, 
  details: Record<string, any> = {}
) => {
  try {
    // Get user agent and other client info safely
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
    
    // Sanitize details to prevent sensitive data logging
    const sanitizedDetails = {
      ...details,
      // Remove any potentially sensitive fields
      password: undefined,
      token: undefined,
      email: details.email ? '[REDACTED]' : undefined,
      // Keep only safe data
      timestamp: new Date().toISOString(),
      userAgent: userAgent.slice(0, 200) // Limit length
    };

    // For now, just log to console in development
    // In production, this could be sent to an external logging service
    if (isDevelopment) {
      secureLog.info(`Security Event: ${eventType}`, sanitizedDetails);
    }
  } catch (error) {
    // Fail silently to avoid blocking user operations
    if (isDevelopment) {
      secureLog.error('Security logging error:', error);
    }
  }
};

// Sanitize error messages for production
export const sanitizeErrorMessage = (error: any): string => {
  if (isDevelopment) {
    return error?.message || 'An error occurred';
  }
  
  // In production, return generic messages for security
  const genericMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid login credentials',
    'User not found': 'Invalid login credentials',
    'Email not confirmed': 'Please check your email and confirm your account',
    'Password too weak': 'Password does not meet requirements',
    'Too many requests': 'Too many requests. Please try again later.',
  };
  
  const errorMessage = error?.message || '';
  return genericMessages[errorMessage] || 'An error occurred. Please try again.';
};

// Input sanitization utility
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
};
