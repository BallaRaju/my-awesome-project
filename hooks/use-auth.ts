// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { getUserProfile, type Profile } from './use-post';

// Initialize the Supabase client
const supabase = createClient();

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Get the initial session
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setAuthState(prev => ({
            ...prev,
            error: sessionError.message,
            isLoading: false
          }));
          return;
        }

        setAuthState(prev => ({ 
          ...prev, 
          session,
          user: session?.user || null,
        }));

        // If we have a user, get their profile
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error: unknown) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
          ...prev,
          error: 'Failed to initialize authentication',
          isLoading: false
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        setAuthState(prev => ({ 
          ...prev, 
          session, 
          user: session?.user || null
        }));

        // On sign in, get profile
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchUserProfile(session.user.id);
        }
        
        // On sign out, clear profile
        if (event === 'SIGNED_OUT') {
          setAuthState(prev => ({ 
            ...prev, 
            profile: null,
            isLoading: false 
          }));
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserProfile(userId: string) {
    try {
      const profile = await getUserProfile(userId);
      
      setAuthState(prev => ({ 
        ...prev, 
        profile,
        isLoading: false,
        error: null
      }));
      
      return profile;
    } catch (error: unknown) {
      console.error('Error fetching user profile:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Failed to fetch user profile',
        isLoading: false
      }));
      return null;
    }
  }

  async function signOut() {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      // State will be updated by the onAuthStateChange listener
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Something went wrong'
      }));
    }
  }

  async function signInWithGoogle() {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }

      // State will be updated by redirect and onAuthStateChange listener
    } catch (error: unknown) {
      console.error('Error signing in with Google:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Something went wrong'
      }));
    }
  }

  async function updateUserProfile(profileData: Partial<Profile>) {
    if (!authState.user) {
      toast.error('You must be logged in to update your profile');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh profile data
      await refreshProfile();
      
      return data;
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      return null;
    }
  }

  // Refresh profile data (call this after updating profile)
  async function refreshProfile() {
    if (authState.user) {
      return await fetchUserProfile(authState.user.id);
    }
    return null;
  }

  return {
    session: authState.session,
    user: authState.user,
    profile: authState.profile,
    isLoading: authState.isLoading,
    error: authState.error,
    signInWithGoogle,
    signOut,
    updateUserProfile,
    refreshProfile,
  };
}