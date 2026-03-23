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
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
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
        setIsLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <UserContext.Provider value={{ profile, isLoading, refreshProfile: fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
};
