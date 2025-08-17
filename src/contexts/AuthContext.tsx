
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeInput, logSecurityEvent, validatePasswordStrength, checkRateLimit } from '@/lib/security';
import { secureLog, sanitizeErrorMessage } from '@/lib/secureLogging';

type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  isAdmin: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      secureLog.info('Fetching user profile');
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        secureLog.error('Error fetching profile', profileError);
        return;
      }

      // Use the secure function to check admin status
      const { data: isAdminResult, error: adminError } = await supabase
        .rpc('is_current_user_admin');

      if (adminError) {
        secureLog.error('Error checking admin status', adminError);
      }

      const isAdmin = isAdminResult || false;

      if (profile) {
        secureLog.info('Profile fetched successfully');
        setUserProfile({
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: profile.email,
          isAdmin
        });
      }
    } catch (error) {
      secureLog.error('Error in fetchUserProfile', error);
      await logSecurityEvent('profile_fetch_error', { userId, error }, 'medium');
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        secureLog.info('Auth state changed', { event });
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            if (mounted) {
              fetchUserProfile(currentSession.user.id);
            }
          }, 100);
        } else {
          setUserProfile(null);
        }
        
        if (mounted) {
          setIsLoading(false);
        }
        
        if (event === 'SIGNED_IN') {
          await logSecurityEvent('user_signed_in', { userId: currentSession?.user?.id }, 'low');
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          await logSecurityEvent('user_signed_out', {}, 'low');
          toast.info('You have been signed out');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      
      secureLog.info('Initial session check');
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(error => {
      secureLog.error('Error getting session', error);
      if (mounted) {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const sanitizedEmail = sanitizeInput(email);
      
      // Rate limiting for sign-in attempts
      const rateLimitKey = `signin_${sanitizedEmail}`;
      if (!checkRateLimit(rateLimitKey, 5, 300000)) { // 5 attempts per 5 minutes
        await logSecurityEvent('signin_rate_limit_exceeded', { email: sanitizedEmail }, 'high');
        throw new Error('Too many sign-in attempts. Please try again later.');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: sanitizedEmail, 
        password 
      });
      
      if (error) {
        await logSecurityEvent('sign_in_failed', { email: sanitizedEmail, error: error.message }, 'medium');
        throw error;
      }
      
      secureLog.info('Sign in successful');
      await logSecurityEvent('sign_in_success', { email: sanitizedEmail }, 'low');
    } catch (error: any) {
      secureLog.error('Sign in error', error);
      toast.error(`Error signing in: ${sanitizeErrorMessage(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFullName = sanitizeInput(fullName);
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        toast.error(`Password requirements: ${passwordValidation.errors.join(', ')}`);
        return;
      }
      
      // Rate limiting for sign-up attempts
      const rateLimitKey = `signup_${sanitizedEmail}`;
      if (!checkRateLimit(rateLimitKey, 3, 600000)) { // 3 attempts per 10 minutes
        await logSecurityEvent('signup_rate_limit_exceeded', { email: sanitizedEmail }, 'high');
        throw new Error('Too many sign-up attempts. Please try again later.');
      }
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: { full_name: sanitizedFullName },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        await logSecurityEvent('sign_up_failed', { email: sanitizedEmail, error: error.message }, 'medium');
        throw error;
      }
      
      await logSecurityEvent('user_signed_up', { email: sanitizedEmail }, 'low');
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      secureLog.error('Sign up error', error);
      toast.error(`Error signing up: ${sanitizeErrorMessage(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all local state
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      window.location.href = '/';
    } catch (error: any) {
      secureLog.error('Sign out error', error);
      await logSecurityEvent('sign_out_failed', { error: error.message }, 'medium');
      toast.error(`Error signing out: ${sanitizeErrorMessage(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const sanitizedEmail = sanitizeInput(email);
      
      // Rate limiting for password reset
      const rateLimitKey = `reset_${sanitizedEmail}`;
      if (!checkRateLimit(rateLimitKey, 3, 300000)) { // 3 attempts per 5 minutes
        await logSecurityEvent('password_reset_rate_limit_exceeded', { email: sanitizedEmail }, 'high');
        throw new Error('Too many password reset attempts. Please try again later.');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      
      await logSecurityEvent('password_reset_requested', { email: sanitizedEmail }, 'low');
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      secureLog.error('Reset password error', error);
      await logSecurityEvent('password_reset_failed', { email, error: error.message }, 'medium');
      toast.error(`Error resetting password: ${sanitizeErrorMessage(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.hostname === 'localhost' 
            ? `${window.location.origin}/auth` 
            : 'https://tuleetotest.netlify.app/auth'
        }
      });
      if (error) {
        throw error;
      }
    } catch (error: any) {
      secureLog.error('Google sign in error', error);
      await logSecurityEvent('google_sign_in_failed', { error: error.message }, 'medium');
      toast.error(`Error signing in with Google: ${sanitizeErrorMessage(error)}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userProfile,
      isLoading, 
      signIn, 
      signUp, 
      signOut,
      resetPassword,
      signInWithGoogle,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
