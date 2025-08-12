
import { supabase } from "@/integrations/supabase/client";

export const cleanupAuthState = () => {
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const performCleanLogin = async (email: string, password: string) => {
  try {
    // Clean up existing state first
    cleanupAuthState();
    
    // Attempt global sign out to clear any existing sessions
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continue even if this fails
      console.log('Cleanup signout attempt:', err);
    }
    
    // Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Sign in with email/password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      // Handle specific error cases
      if (error.message.includes('captcha') || error.message.includes('hCaptcha')) {
        throw new Error('Login temporarily unavailable. Please try again in a few minutes.');
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      throw error;
    }
    
    if (data.user) {
      // Force page reload for clean state
      window.location.href = '/';
      return data;
    }
    
    return data;
  } catch (error: any) {
    console.error('Login error:', error);
    throw error;
  }
};

export const performCleanSignUp = async (email: string, password: string, fullName?: string) => {
  try {
    // Clean up existing state first
    cleanupAuthState();
    
    // Attempt global sign out
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.log('Cleanup signout attempt:', err);
    }
    
    // Wait a moment for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Sign up with email/password
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        }
      }
    });
    
    if (error) {
      if (error.message.includes('captcha') || error.message.includes('hCaptcha')) {
        throw new Error('Registration temporarily unavailable. Please try again in a few minutes.');
      }
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const performCleanSignOut = async () => {
  try {
    // Clean up auth state first
    cleanupAuthState();
    
    // Attempt global sign out
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.log('Sign out attempt:', err);
    }
    
    // Force page reload for clean state
    window.location.href = '/auth';
  } catch (error: any) {
    console.error('Sign out error:', error);
    // Force navigation even if signout fails
    window.location.href = '/auth';
  }
};
