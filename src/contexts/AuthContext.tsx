import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Profile } from '../lib/database.types';
import { api, type AuthUser } from '../lib/api';

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const profiles = await api.listProfiles({ id: userId });
      return profiles[0] ?? null;
    } catch (error) {
      console.error('Gagal mengambil profil:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await api.getSession();
        setUser(sessionData.user);
        setProfile(sessionData.profile);
      } catch (error) {
        console.error('Gagal mengambil sesi:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const sessionData = await api.login(email, password);
      setUser(sessionData.user);
      setProfile(sessionData.profile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    try {
      const sessionData = await api.register({
        email,
        password,
        full_name: fullName,
        phone,
      });
      setUser(sessionData.user);
      setProfile(sessionData.profile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await api.logout();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
