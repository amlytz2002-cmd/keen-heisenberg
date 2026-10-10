import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { api } from '../lib/api';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  primary_role: UserRole;
  roles: UserRole[];
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInDemo: (role: 'student' | 'instructor') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  activeRole: 'student',
  setActiveRole: () => {},
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
  signInDemo: async () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      const res = await api.auth.getProfile();
      if (res.success && res.data) {
        const raw: any = res.data;
        const u = raw.user || raw;
        const p = u.profile || raw.profile || {};
        
        const roles: UserRole[] = Array.isArray(u.roles) && u.roles.length > 0
          ? u.roles
          : (Array.isArray(raw.roles) ? raw.roles : ['student']);
          
        const primaryRole: UserRole = roles.includes('instructor')
          ? 'instructor'
          : (u.primary_role || raw.primary_role || 'student');

        const normalizedProfile: UserProfile = {
          id: u.id || currentUser.id,
          email: u.email || currentUser.email || '',
          full_name: p.display_name || u.full_name || raw.full_name || currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          avatar_url: p.avatar_path || u.avatar_url || raw.avatar_url,
          primary_role: primaryRole,
          roles,
        };

        setProfile(normalizedProfile);
        setActiveRole(primaryRole);
      } else {
        const defaultProfile: UserProfile = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
          primary_role: 'student',
          roles: ['student'],
        };
        setProfile(defaultProfile);
        setActiveRole('student');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      const fallbackProfile: UserProfile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User',
        primary_role: 'student',
        roles: ['student'],
      };
      setProfile(fallbackProfile);
      setActiveRole('student');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setActiveRole('student');
  };

  const signInDemo = async (role: 'student' | 'instructor'): Promise<boolean> => {
    setLoading(true);
    try {
      const email = role === 'instructor' ? 'instructor.demo@cenna.live' : 'pilot.student@biruni.edu.tr';
      const password = 'CennaLive2026!Demo';

      const signInRes = await supabase.auth.signInWithPassword({ email, password });
      let authUser = signInRes.data?.user ?? null;
      let authSession = signInRes.data?.session ?? null;

      if (signInRes.error || !authUser) {
        // If demo user does not exist, create it
        const signUpRes = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: role === 'instructor' ? 'Dr. Cenan Demir (Lead Instructor)' : 'Biruni Pilot Learner',
              role,
            },
          },
        });
        if (signUpRes.error) {
          console.warn('Demo sign up error:', signUpRes.error);
          return false;
        }
        authUser = signUpRes.data.user;
        authSession = signUpRes.data.session;
      }

      if (authUser) {
        setUser(authUser);
        setSession(authSession);
        await api.auth.updateProfile({
          full_name: role === 'instructor' ? 'Dr. Cenan Demir' : 'Biruni Pilot Learner',
          primary_role: role,
        });
        await fetchProfile(authUser);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Demo login exception:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        activeRole,
        setActiveRole,
        loading,
        signOut,
        refreshProfile,
        signInDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
