
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sanitizeInput, logSecurityEvent } from '@/lib/security';

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

// Clean up auth state utility
const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Check if user has admin role
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
      }

      const isAdmin = roles?.some(r => r.role === 'admin') || false;

      if (profile) {
        console.log('Profile fetched successfully:', profile);
        setUserProfile({
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: profile.email,
          isAdmin
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
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
        
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
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
      
      console.log('Initial session check:', currentSession?.user?.email);
      
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(error => {
      console.error('Error getting session:', error);
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
      cleanupAuthState();
      
      // Sanitize input
      const sanitizedEmail = sanitizeInput(email);
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      const { error } = await supabase.auth.signInWithPassword({ 
        email: sanitizedEmail, 
        password 
      });
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      await logSecurityEvent('sign_in_failed', { email, error: error.message });
      toast.error(`Error signing in: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      cleanupAuthState();
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFullName = sanitizeInput(fullName);
      
      const { error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password,
        options: {
          data: { full_name: sanitizedFullName }
        }
      });
      
      if (error) throw error;
      await logSecurityEvent('user_signed_up', { email: sanitizedEmail });
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      await logSecurityEvent('sign_up_failed', { email, error: error.message });
      toast.error(`Error signing up: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      cleanupAuthState();
      
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out error:', error);
      await logSecurityEvent('sign_out_failed', { error: error.message });
      toast.error(`Error signing out: ${error.message}`);
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
      console.error('Reset password error:', error);
      await logSecurityEvent('password_reset_failed', { email, error: error.message });
      toast.error(`Error resetting password: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      cleanupAuthState();
      
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
      console.error('Google sign in error:', error);
      await logSecurityEvent('google_sign_in_failed', { error: error.message });
      toast.error(`Error signing in with Google: ${error.message}`);
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
