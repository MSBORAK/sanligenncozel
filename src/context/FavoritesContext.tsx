import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@sanligenc_favorites';

export type FavoriteType = 'event' | 'partner' | 'heritage' | 'stop';

export type FavoritesState = {
  events: string[];
  partners: string[];
  heritage: string[];
  stops: string[];
};

const DEFAULT_FAVORITES: FavoritesState = {
  events: [],
  partners: [],
  heritage: [],
  stops: [],
};

type FavoritesContextValue = FavoritesState & {
  favoriteEventIds: string[];
  favoritePartnerIds: string[];
  favoriteHeritageIds: string[];
  favoriteStopIds: string[];
  isFavorite: (type: FavoriteType, id: string) => boolean;
  isFavoriteEvent: (id: string) => boolean;
  isFavoritePartner: (id: string) => boolean;
  isFavoriteHeritage: (id: string) => boolean;
  isFavoriteStop: (id: string) => boolean;
  toggleFavorite: (type: FavoriteType, id: string) => void;
  loadFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<FavoritesState>(DEFAULT_FAVORITES);

  const loadFavorites = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FavoritesState;
        setState({
          events: parsed.events ?? [],
          partners: parsed.partners ?? [],
          heritage: parsed.heritage ?? [],
          stops: parsed.stops ?? [],
        });
      }
    } catch (e) {
      console.warn('Favoriler yüklenemedi:', e);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const saveFavorites = useCallback(async (next: FavoritesState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Favoriler kaydedilemedi:', e);
    }
  }, []);

  const isFavorite = useCallback(
    (type: FavoriteType, id: string) => {
      const list = state[type === 'event' ? 'events' : type === 'partner' ? 'partners' : type === 'heritage' ? 'heritage' : 'stops'];
      return list.includes(id);
    },
    [state]
  );

  const toggleFavorite = useCallback(
    (type: FavoriteType, id: string) => {
      const key = type === 'event' ? 'events' : type === 'partner' ? 'partners' : type === 'heritage' ? 'heritage' : 'stops';
      setState((prev) => {
        const list = prev[key];
        const nextList = list.includes(id)
          ? list.filter((x) => x !== id)
          : [...list, id];
        const next = { ...prev, [key]: nextList };
        saveFavorites(next);
        return next;
      });
    },
    [saveFavorites]
  );

  const value: FavoritesContextValue = {
    ...state,
    favoriteEventIds: state.events,
    favoritePartnerIds: state.partners,
    favoriteHeritageIds: state.heritage,
    favoriteStopIds: state.stops,
    isFavorite,
    isFavoriteEvent: (id) => state.events.includes(id),
    isFavoritePartner: (id) => state.partners.includes(id),
    isFavoriteHeritage: (id) => state.heritage.includes(id),
    isFavoriteStop: (id) => state.stops.includes(id),
    toggleFavorite,
    loadFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return ctx;
};
