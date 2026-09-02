import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

interface UserProfile {
  userId: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
}

interface UserContextValue {
  profile: UserProfile | null;
  isGuest: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  setGuestMode: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setIsGuest(false);
        return;
      }
      const { data } = await supabase
        .from('user_profiles')
        .select('name, username, avatar_url')
        .eq('user_id', user.id)
        .single();

      const profile: UserProfile = {
        userId: user.id,
        name: data?.name || user.email?.split('@')[0] || 'Kullanıcı',
        username: data?.username || '',
        email: user.email || '',
        avatarUrl: data?.avatar_url,
      };
      setProfile(profile);
      setIsGuest(false);

      // Push token'ı arka planda kaydet (hata olsa da devam et)
      registerForPushNotificationsAsync(user.id).catch(() => {});
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile();
      } else {
        setProfile(null);
        setIsGuest(false);
        setIsLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  const setGuestMode = useCallback(() => {
    setProfile(null);
    setIsGuest(true);
    setIsLoading(false);
  }, []);

  return (
    <UserContext.Provider value={{ profile, isGuest, isLoading, refreshProfile: fetchProfile, setGuestMode }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
};
