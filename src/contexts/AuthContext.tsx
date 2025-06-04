
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      console.log('Fetching profile for user:', userId);
      
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // If profile doesn't exist, create one
        const currentUser = await supabase.auth.getUser();
        if (currentUser.data.user) {
          console.log('Creating new profile for user:', userId);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: currentUser.data.user.email!,
              full_name: currentUser.data.user.user_metadata?.full_name || null
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            // Grant admin role to specific email
            if (currentUser.data.user.email === 'sayangayan4976@gmail.com') {
              console.log('Granting admin role to:', currentUser.data.user.email);
              const { error: roleError } = await supabase
                .from('user_roles')
                .upsert({
                  user_id: userId,
                  role: 'admin'
                });

              if (roleError) {
                console.error('Error granting admin role:', roleError);
              }
            }
          }

          setUserProfile({
            id: userId,
            full_name: currentUser.data.user.user_metadata?.full_name || null,
            avatar_url: null,
            email: currentUser.data.user.email!,
            isAdmin: currentUser.data.user.email === 'sayangayan4976@gmail.com'
          });
        }
        return;
      }

      // Check if user is admin
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
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, currentSession?.user?.email);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user && event === 'SIGNED_IN') {
          // Defer profile fetching to avoid deadlocks
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
          toast.success('Successfully signed in!');
        } else if (event === 'SIGNED_OUT') {
          toast.info('You have been signed out');
        }
      }
    );

    // Check for existing session
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(`Error signing in: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      
      if (error) throw error;
      toast.success('Registration successful! Please check your email for verification.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(`Error signing up: ${error.message}`);
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
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(`Error signing out: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(`Error resetting password: ${error.message}`);
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
      console.error('Google sign in error:', error);
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
