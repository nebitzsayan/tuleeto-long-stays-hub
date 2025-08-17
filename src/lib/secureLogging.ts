
// Secure logging utility to prevent information leakage in production
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
  };
  
  const errorMessage = error?.message || '';
  return genericMessages[errorMessage] || 'An error occurred. Please try again.';
};
