import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Heart } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import { Event } from '@/types';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';

const CATEGORIES = ['Tümü', 'Favorilerim', 'Konser', 'Gezi', 'Spor'];

const CARD_RADIUS = 20;

/** Ana sayfa Hızlı Erişim — Etkinlik kutusu (#EDE7F6) ile aynı hat */
const EVENTS_LIGHT = {
  pageBg: '#EDE7F6',
  tabActive: ['#6d28d9', '#7c3aed', '#8b5cf6'] as const,
  accent: '#7c3aed',
  imageGlow: ['rgba(124,58,237,0.28)', 'transparent'] as const,
};

interface EventData {
  id: number;
  baslik: string;
  aciklama?: string;
  tarih: string;
  konum: string;
  kategori: string;
  resim_url?: string;
}

type EventScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Events'>;

const EventsScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<EventScreenNavigationProp>();
  const route = useRoute();
  const initialTab = (route.params as { initialTab?: string } | undefined)?.initialTab;
  const [activeTab, setActiveTab] = useState(initialTab === 'Favorilerim' ? 'Favorilerim' : 'Tümü');
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteEventIds, isFavoriteEvent, toggleFavorite } = useFavorites();

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('etkinlikler')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setEvents(data);
      if (error) console.log('Etkinlik hatası:', error);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    if (activeTab === 'Tümü') return events;
    if (activeTab === 'Favorilerim') return events.filter(e => favoriteEventIds.includes(e.id.toString()));
    return events.filter(e => e.kategori === activeTab);
  }, [events, activeTab, favoriteEventIds]);

  const formatEvent = useCallback(
    (event: EventData): Event => ({
      id: event.id.toString(),
      title: event.baslik,
      date: event.tarih,
      location: event.konum,
      category: (event.kategori as 'Konser' | 'Gezi' | 'Spor') || 'Gezi',
      image: processImageUrl(event.resim_url, 'etkinlik_resimleri') || cityFallback(event.id),
    }),
    []
  );

  const listData = useMemo(() => filteredEvents.map(formatEvent), [filteredEvents, formatEvent]);
  const onToggleFavorite = useCallback((eventId: string) => toggleFavorite('event', eventId), [toggleFavorite]);
  const hasFavorites = favoriteEventIds.length > 0;

  const renderCategoryTab = useCallback(
    ({ item }: { item: string }) => {
      const active = activeTab === item;
      return (
        <TouchableOpacity
          onPress={() => setActiveTab(item)}
          activeOpacity={0.88}
          style={[
            styles.tabPill,
            isDark && styles.tabPillDark,
            !isDark && !active && styles.tabPillInactiveLight,
            isDark && !active && styles.tabPillInactiveDark,
          ]}
        >
          {!isDark && active && (
            <LinearGradient
              colors={[...EVENTS_LIGHT.tabActive]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {isDark && active && (
            <LinearGradient
              colors={['#075985', '#0369a1', '#0ea5e9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {!isDark && !active && (
            <>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={50} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.88)' : '#ffffff',
                    borderRadius: 22,
                  },
                ]}
              />
            </>
          )}
          {isDark && !active && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e293b', borderRadius: 22 }]} />}
          <Text
            style={[
              styles.tabPillText,
              !isDark && !active && { color: DribbbleColors.textSecondary },
              isDark && !active && { color: '#94a3b8' },
              active && { color: '#ffffff' },
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeTab, isDark]
  );

  const renderEventItem = useCallback(
    ({ item, index }: { item: Event; index: number }) => (
      <AnimatedListItem index={index} delay={60}>
        <TouchableOpacity
          style={[styles.eventCard, isDark && styles.eventCardDark]}
          activeOpacity={0.92}
          onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        >
          <View style={[styles.imageSection, isDark && styles.imageSectionDark]}>
            <Image source={{ uri: item.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <LinearGradient
              colors={isDark ? ['rgba(245,158,11,0.22)', 'transparent'] : [...EVENTS_LIGHT.imageGlow]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0.2, y: 0.45 }}
              style={styles.amberGlow}
              pointerEvents="none"
            />
            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{item.category}</Text>
            </View>
            <TouchableOpacity
              style={styles.heartFab}
              onPress={() => onToggleFavorite(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {Platform.OS === 'ios' ? (
                <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)' },
                ]}
              />
              <Heart
                color={isDark ? '#f8fafc' : DribbbleColors.textPrimary}
                size={18}
                strokeWidth={2}
                fill={
                  isFavoriteEvent(item.id)
                    ? isDark
                      ? Colors.dark.accent
                      : EVENTS_LIGHT.accent
                    : 'transparent'
                }
              />
            </TouchableOpacity>
          </View>

          {isDark ? (
            <View style={styles.infoSectionDark}>
              <Text style={styles.eventTitleDark} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.eventMetaDark} numberOfLines={2}>
                {`${item.date} · ${item.location}`}
              </Text>
            </View>
          ) : (
            <View style={styles.infoSectionLight}>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={65} tint="light" style={StyleSheet.absoluteFill} />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.78)' : '#ffffff',
                  },
                ]}
              />
              <View style={styles.infoInner}>
                <Text style={styles.eventTitleLight} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.eventMetaLight} numberOfLines={2}>
                  {`${item.date} · ${item.location}`}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </AnimatedListItem>
    ),
    [isFavoriteEvent, isDark, navigation, onToggleFavorite]
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: EVENTS_LIGHT.pageBg },
      ]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]}>Etkinlikler</Text>
        <TouchableOpacity
          onPress={() => setActiveTab('Favorilerim')}
          activeOpacity={0.85}
          style={[
            styles.favBadgeOuter,
            isDark && styles.favBadgeOuterDark,
            !isDark && { borderColor: 'rgba(124,58,237,0.2)' },
          ]}
        >
          {!isDark && Platform.OS === 'ios' ? (
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          ) : null}
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor:
                  !isDark
                    ? Platform.OS === 'ios'
                      ? 'rgba(255,255,255,0.82)'
                      : '#ffffff'
                    : 'rgba(255,255,255,0.08)',
                borderRadius: 22,
              },
            ]}
          />
          <Heart
            color={isDark ? '#f8fafc' : DribbbleColors.textPrimary}
            size={18}
            strokeWidth={2}
            fill={
              activeTab === 'Favorilerim'
                ? isDark
                  ? Colors.dark.accent
                  : EVENTS_LIGHT.accent
                : 'transparent'
            }
          />
          {(hasFavorites || activeTab === 'Favorilerim') && (
            <View
              style={[
                styles.favDot,
                !isDark && { backgroundColor: EVENTS_LIGHT.accent },
                isDark && { backgroundColor: Colors.dark.accent },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.pillsRowFixed}>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={renderCategoryTab}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          style={styles.pillsFlatList}
          contentContainerStyle={styles.pillsContainer}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.eventCard, styles.skeletonCard, isDark && styles.eventCardDark]}>
              <Skeleton width="100%" height={200} borderRadius={0} isDark={isDark} />
              <View style={{ padding: 16, gap: 8 }}>
                <Skeleton width="72%" height={18} borderRadius={6} isDark={isDark} />
                <Skeleton width="55%" height={14} borderRadius={6} isDark={isDark} />
              </View>
            </View>
          ))}
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, isDark && { color: '#94a3b8' }]}>
            {activeTab === 'Tümü'
              ? 'Henüz etkinlik bulunmuyor.'
              : activeTab === 'Favorilerim'
                ? 'Henüz favori etkinliğiniz bulunmuyor.'
                : `${activeTab} kategorisinde etkinlik bulunmuyor.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
          initialNumToRender={6}
          maxToRenderPerBatch={4}
          windowSize={6}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DribbbleColors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 26,
    letterSpacing: -0.4,
    color: DribbbleColors.textPrimary,
  },
  headerTitleDark: {
    color: '#f8fafc',
    fontFamily: FontFamily.semiBold,
  },
  favBadgeOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  favBadgeOuterDark: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  favDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  pillsRowFixed: {
    height: 52,
    flexGrow: 0,
    flexShrink: 0,
  },
  pillsFlatList: {
    flexGrow: 0,
    height: 52,
  },
  pillsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    alignItems: 'center',
    flexGrow: 0,
  },
  tabPill: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  tabPillDark: {
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabPillInactiveLight: {
    borderWidth: 1,
    borderColor: DribbbleColors.borderLight,
  },
  tabPillInactiveDark: {
    backgroundColor: 'transparent',
  },
  tabPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    zIndex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  eventCard: {
    marginBottom: 20,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: Platform.OS === 'android' ? 'transparent' : '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.08,
    shadowRadius: Platform.OS === 'android' ? 0 : 20,
    elevation: Platform.OS === 'android' ? 0 : 6,
  },
  eventCardDark: {
    backgroundColor: Platform.OS === 'android' ? '#111827' : 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.2,
  },
  skeletonCard: {
    overflow: 'hidden',
  },
  imageSection: {
    width: '100%',
    height: 220,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  imageSectionDark: {
    backgroundColor: '#1e293b',
  },
  amberGlow: {
    ...StyleSheet.absoluteFillObject,
    borderTopRightRadius: CARD_RADIUS,
  },
  categoryPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  categoryPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: DribbbleColors.textPrimary,
    letterSpacing: 0.3,
  },
  heartFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  infoSectionLight: {
    minHeight: 112,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: CARD_RADIUS,
    borderBottomRightRadius: CARD_RADIUS,
    justifyContent: 'center',
  },
  infoInner: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    zIndex: 1,
  },
  eventTitleLight: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: DribbbleColors.textPrimary,
    lineHeight: 22,
  },
  eventMetaLight: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: DribbbleColors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  infoSectionDark: {
    minHeight: 112,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  eventTitleDark: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    color: '#f8fafc',
    lineHeight: 22,
  },
  eventMetaDark: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default EventsScreen;
