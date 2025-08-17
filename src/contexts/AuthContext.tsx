
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeInput, logSecurityEvent } from '@/lib/security';
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
      await logSecurityEvent('profile_fetch_error', { userId, error });
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
          await logSecurityEvent('user_signed_in', { userId: currentSession?.user?.id });
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          await logSecurityEvent('user_signed_out', {});
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
      
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: sanitizedEmail, 
        password 
      });
      
      if (error) throw error;
      secureLog.info('Sign in successful');
    } catch (error: any) {
      secureLog.error('Sign in error', error);
      await logSecurityEvent('sign_in_failed', { email, error: error.message });
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
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: { full_name: sanitizedFullName },
          emailRedirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) throw error;
      await logSecurityEvent('user_signed_up', { email: sanitizedEmail });
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      secureLog.error('Sign up error', error);
      await logSecurityEvent('sign_up_failed', { email, error: error.message });
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
      
      window.location.href = '/';
    } catch (error: any) {
      secureLog.error('Sign out error', error);
      await logSecurityEvent('sign_out_failed', { error: error.message });
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
      
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      
      await logSecurityEvent('password_reset_requested', { email: sanitizedEmail });
    } catch (error: any) {
      secureLog.error('Reset password error', error);
      await logSecurityEvent('password_reset_failed', { email, error: error.message });
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
      await logSecurityEvent('google_sign_in_failed', { error: error.message });
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
