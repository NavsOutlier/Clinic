import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'gestor' | 'medico' | 'secretaria' | 'super-admin';

interface UserProfile {
  id: string;
  clinic_id: string;
  role: UserRole;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  clinicName: string;
  userRole: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState('');

  useEffect(() => {
    let ignore = false;

    // Safety timeout - if nothing happens in 5 seconds, stop loading
    const safetyTimeout = setTimeout(() => {
      if (!ignore) {
        console.warn('AuthContext: Safety timeout reached, forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    // 1. Check for existing session first
    supabase.auth.getSession().then(async ({ data: { session: currentSession }, error }) => {
      if (ignore) return;
      console.log('AuthContext: getSession result:', currentSession?.user?.email ?? 'no session', error);
      
      if (error) {
        console.error('AuthContext: getSession error:', error);
        clearTimeout(safetyTimeout);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
      
      clearTimeout(safetyTimeout);
    });

    // 2. Listen for future auth changes (login, logout, token refresh)
    // IMPORTANT: callback must NOT be async to avoid deadlock with Supabase client.
    // The client needs the callback to return before finalizing auth state,
    // but an async callback that awaits a Supabase query creates a circular wait.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (ignore) return;
      console.log('AuthContext: Auth event received:', event, 'Has session:', !!newSession);
      
      if (event === 'INITIAL_SESSION') {
        console.log('AuthContext: Skipping INITIAL_SESSION event');
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
      console.log('AuthContext: Updated user state to:', newSession?.user?.email ?? 'null');

      if (newSession?.user) {
        // Defer profile fetch to next tick so onAuthStateChange callback returns
        // immediately, allowing Supabase to finalize the session first
        const userId = newSession.user.id;
        setTimeout(() => fetchProfile(userId), 0);
      } else {
        console.log('AuthContext: No session, clearing profile');
        setProfile(null);
        setClinicName('');
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    console.log('AuthContext: Fetching profile for:', userId);
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('AuthContext: User fetch error:', userError);
        setLoading(false);
        return;
      }

      if (userData) {
        console.log('AuthContext: Profile loaded successfully:', userData.email, 'Role:', userData.role);
        setProfile({
          id: userData.id,
          clinic_id: userData.clinic_id,
          role: userData.role as UserRole,
          full_name: userData.full_name
        });

        const { data: clinicData } = await supabase
          .from('clinics')
          .select('name')
          .eq('id', userData.clinic_id)
          .maybeSingle();

        if (clinicData?.name) {
          setClinicName(clinicData.name);
        }
      } else {
        console.warn('AuthContext: No profile found in users table');
      }
    } catch (error) {
      console.error('AuthContext: Profile error:', error);
    } finally {
      console.log('AuthContext: Done loading');
      setLoading(false);
    }
  }

  const signOut = async () => {
    try {
      console.log('AuthContext: Attempting to sign out...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Sign out error from Supabase:', error);
      } else {
        console.log('AuthContext: Sign out successful');
      }
    } catch (error) {
      console.error('AuthContext: Sign out unexpected exception:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      clinicName,
      userRole: profile?.role || 'secretaria',
      loading,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
