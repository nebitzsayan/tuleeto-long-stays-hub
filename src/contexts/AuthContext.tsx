import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { sanitizeInput, validatePasswordStrength, checkRateLimit } from "@/lib/security";
import { logSecurityEvent, sanitizeErrorMessage } from "@/lib/secureLogging";

interface AuthContextProps {
  user: any;
  userProfile: any;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword?: (email: string) => Promise<void>;
  signInWithGoogle?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST (before checking session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    }).catch(async (error) => {
      console.error("Authentication error:", error);
      await logSecurityEvent('auth_context_error', { error });
      if (mounted) {
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Clear OAuth hash from URL AFTER session is confirmed
  useEffect(() => {
    if (session && window.location.hash.includes('access_token')) {
      // Defer clearing to ensure OAuth flow is complete
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 100);
    }
  }, [session]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setUserProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user profile:", error);
          await logSecurityEvent('profile_fetch_error', { 
            userId: user.id,
            error: error.message 
          });
        }

        setUserProfile(data);
      } catch (error: any) {
        console.error("Unexpected error fetching profile:", error);
        await logSecurityEvent('profile_fetch_error', { 
          userId: user.id,
          error: error.message 
        });
      }
    };

    fetchProfile();
  }, [user]);

  const refreshProfile = async () => {
    if (!user?.id) {
      setUserProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error refreshing user profile:", error);
        await logSecurityEvent('profile_refresh_error', { 
          userId: user.id,
          error: error.message 
        });
      }

      setUserProfile(data);
    } catch (error: any) {
      console.error("Unexpected error refreshing profile:", error);
      await logSecurityEvent('profile_refresh_error', { 
        userId: user.id,
        error: error.message 
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!checkRateLimit('signIn', 5, 60000)) {
      const message = 'Too many sign-in requests. Please try again later.';
      console.warn(message);
      alert(sanitizeErrorMessage({ message }));
      await logSecurityEvent('rate_limit_exceeded', { action: 'signIn', email });
      return;
    }

    try {
      const sanitizedEmail = sanitizeInput(email);
      const { error } = await supabase.auth.signInWithPassword({ 
        email: sanitizedEmail,
        password: password
      });

      if (error) {
        console.error("Sign-in error:", error);
        const errorMessage = sanitizeErrorMessage(error);
        alert(errorMessage);
        await logSecurityEvent('sign_in_failed', { email: sanitizedEmail, error: error.message });
      } else {
        await logSecurityEvent('sign_in_successful', { email: sanitizedEmail });
        navigate('/');
      }
    } catch (error: any) {
      console.error("Unexpected sign-in error:", error);
      const errorMessage = sanitizeErrorMessage(error);
      alert(errorMessage);
      await logSecurityEvent('sign_in_failed', { email, error: error.message });
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    if (!checkRateLimit('signUp', 3, 60000)) {
      const message = 'Too many sign-up requests. Please try again later.';
      console.warn(message);
      alert(sanitizeErrorMessage({ message }));
      await logSecurityEvent('rate_limit_exceeded', { action: 'signUp', email });
      return;
    }

    try {
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFullName = sanitizeInput(fullName);
      const passwordStrength = validatePasswordStrength(password);

      if (!passwordStrength.isValid) {
        alert(passwordStrength.errors.join('\n'));
        await logSecurityEvent('sign_up_failed', { 
          email: sanitizedEmail, 
          error: 'Weak password',
          validationErrors: passwordStrength.errors
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: sanitizedFullName,
            phone: phone,
          },
        },
      });

      if (error) {
        console.error("Sign-up error:", error);
        const errorMessage = sanitizeErrorMessage(error);
        alert(errorMessage);
        await logSecurityEvent('sign_up_failed', { email: sanitizedEmail, error: error.message });
      } else {
        alert('Sign-up successful! Check your email to confirm your account.');
        await logSecurityEvent('sign_up_successful', { email: sanitizedEmail });
        if (data.user) {
          // Only insert fields that exist in the profiles table
          await supabase
            .from('profiles')
            .insert([{ 
              id: data.user.id, 
              full_name: sanitizedFullName,
              email: sanitizedEmail
            }]);
        }
      }
    } catch (error: any) {
      console.error("Unexpected sign-up error:", error);
      const errorMessage = sanitizeErrorMessage(error);
      alert(errorMessage);
      await logSecurityEvent('sign_up_failed', { email, error: error.message });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign-out error:", error);
        await logSecurityEvent('sign_out_failed', { error: error.message });
      } else {
        console.log("User signed out successfully");
        await logSecurityEvent('sign_out_successful', { userId: user?.id });
        navigate('/auth');
      }
    } catch (error: any) {
      console.error("Unexpected sign-out error:", error);
      await logSecurityEvent('sign_out_failed', { error: error.message });
    }
  };

  const updateUser = async (data: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) {
        console.error("Update user error:", error);
        await logSecurityEvent('profile_update_failed', { 
          userId: user.id, 
          updateData: data, 
          error: error.message 
        });
      } else {
        console.log("User profile updated successfully");
        setUserProfile({ ...userProfile, ...data });
        await logSecurityEvent('profile_update_successful', { 
          userId: user.id, 
          updateData: data 
        });
      }
    } catch (error: any) {
      console.error("Unexpected update user error:", error);
      await logSecurityEvent('profile_update_failed', { 
        userId: user.id, 
        updateData: data, 
        error: error.message 
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      if (error) {
        console.error("Reset password error:", error);
        await logSecurityEvent('password_reset_failed', { email, error: error.message });
        throw error;
      } else {
        await logSecurityEvent('password_reset_requested', { email });
      }
    } catch (error: any) {
      console.error("Unexpected reset password error:", error);
      await logSecurityEvent('password_reset_failed', { email, error: error.message });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) {
        console.error("Google sign-in error:", error);
        await logSecurityEvent('google_signin_failed', { error: error.message });
      } else {
        await logSecurityEvent('google_signin_requested', {});
      }
    } catch (error: any) {
      console.error("Unexpected Google sign-in error:", error);
      await logSecurityEvent('google_signin_failed', { error: error.message });
    }
  };

  const value: AuthContextProps = {
    user,
    userProfile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateUser,
    refreshProfile,
    resetPassword,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
