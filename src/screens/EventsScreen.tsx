import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import { Event } from '@/types';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';

const CATEGORIES = ['Tümü', 'Favorilerim', 'Konser', 'Gezi', 'Spor'];

const MONTHS_SHORT = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
const WEEKDAYS_SHORT = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'];

function parseEventDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

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
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<EventScreenNavigationProp>();
  const route = useRoute();
  const initialTab = (route.params as { initialTab?: string } | undefined)?.initialTab;
  const [activeTab, setActiveTab] = useState(initialTab === 'Favorilerim' ? 'Favorilerim' : 'Tümü');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteEventIds, isFavoriteEvent, toggleFavorite } = useFavorites();

  const { pageBg, cardBg, cardBdr, txt1, txt2, ctaBg, ctaTxt, chipBg, accent: amber, isDark } = t;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

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

  const availableDays = useMemo(() => {
    const map = new Map<string, Date>();
    events.forEach((e) => {
      const d = parseEventDate(e.tarih);
      if (d) map.set(dayKey(d), d);
    });
    return Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime());
  }, [events]);

  const filteredEvents = useMemo(() => {
    let list = events;
    if (activeTab === 'Favorilerim') list = list.filter(e => favoriteEventIds.includes(e.id.toString()));
    else if (activeTab !== 'Tümü') list = list.filter(e => e.kategori === activeTab);

    if (selectedDayKey) {
      list = list.filter(e => {
        const d = parseEventDate(e.tarih);
        return d ? dayKey(d) === selectedDayKey : false;
      });
    }
    return list;
  }, [events, activeTab, favoriteEventIds, selectedDayKey]);

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
            active ? { backgroundColor: ctaBg } : { backgroundColor: chipBg, borderWidth: 1, borderColor: cardBdr },
          ]}
        >
          <Text style={[styles.tabPillText, { color: active ? ctaTxt : txt2 }]}>
            {item}
          </Text>
        </TouchableOpacity>
      );
    },
    [activeTab, ctaBg, ctaTxt, chipBg, cardBdr, txt2]
  );

  const renderEventItem = useCallback(
    ({ item, index }: { item: Event; index: number }) => {
      const eventDate = parseEventDate(item.date);
      const now = new Date();
      const isToday = eventDate ? isSameDay(eventDate, now) : false;
      const isTomorrow = eventDate
        ? isSameDay(eventDate, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))
        : false;

      // İlk sıradaki etkinlik büyük "öne çıkan" kart olarak gösterilir
      if (index === 0) {
        const hoursLeft = eventDate ? Math.round((eventDate.getTime() - now.getTime()) / 3600000) : null;
        const isUrgent = isToday && hoursLeft !== null && hoursLeft > 0 && hoursLeft <= 6;

        return (
          <AnimatedListItem index={index} delay={40}>
            <View style={[styles.heroEventOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <TouchableOpacity
                style={[styles.heroEventCard, cardInnerClip]}
                activeOpacity={0.92}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              >
                <ImageBackground
                  source={{ uri: item.image }}
                  style={styles.heroEventImageBg}
                  imageStyle={styles.heroEventImageRadius}
                  resizeMode="cover"
                >
                <View style={styles.heroEventOverlay} pointerEvents="none" />

                {eventDate && (isToday || isTomorrow) && (
                  <View style={[styles.heroDateTag, { backgroundColor: isToday ? amber : cardBg }]}>
                    <Text style={[styles.heroDateTagText, { color: isToday ? '#fff' : txt1 }]}>
                      {isToday ? 'BUGÜN' : 'YARIN'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.heroHeartBtn, { backgroundColor: cardBg }]}
                  onPress={() => onToggleFavorite(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Heart
                    color={isFavoriteEvent(item.id) ? amber : txt1}
                    size={18}
                    strokeWidth={2}
                    fill={isFavoriteEvent(item.id) ? amber : 'transparent'}
                  />
                </TouchableOpacity>

                <View style={styles.heroTextBlock}>
                  <Text style={styles.heroEventTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.heroEventMeta} numberOfLines={1}>{item.location}</Text>
                </View>

                {isUrgent && (
                  <View style={[styles.heroUrgentTag, { backgroundColor: amber }]}>
                    <Text style={styles.heroUrgentTagText}>SON {hoursLeft} SAAT</Text>
                  </View>
                )}
                </ImageBackground>
              </TouchableOpacity>
            </View>
          </AnimatedListItem>
        );
      }

      return (
      <AnimatedListItem index={index} delay={40}>
        <View style={[styles.eventRowOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
          <TouchableOpacity
            style={[styles.eventRow, cardInnerClip]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
          >
            {eventDate ? (
              <View style={[styles.dateBadge, { backgroundColor: isToday ? amber : chipBg }]}>
                {(isToday || isTomorrow) && (
                  <Text style={[styles.dateBadgeTag, { color: isToday ? 'rgba(255,255,255,0.9)' : txt2 }]}>
                    {isToday ? 'BUGÜN' : 'YARIN'}
                  </Text>
                )}
                <Text style={[styles.dateBadgeDay, { color: isToday ? '#fff' : txt1 }]}>{eventDate.getDate()}</Text>
                <Text style={[styles.dateBadgeMonth, { color: isToday ? 'rgba(255,255,255,0.85)' : txt2 }]}>
                  {MONTHS_SHORT[eventDate.getMonth()]}
                </Text>
              </View>
            ) : (
              <View style={[styles.dateBadge, { backgroundColor: chipBg }]} />
            )}

            <View style={styles.rowThumbWrap}>
              <Image source={{ uri: item.image }} style={styles.rowThumb} resizeMode="cover" />
            </View>

            <View style={styles.rowInfo}>
              <Text style={[styles.rowTitle, { color: txt1 }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.rowMeta, { color: txt2 }]} numberOfLines={1}>
                {item.location}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.rowHeartBtn}
              onPress={() => onToggleFavorite(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Heart
                color={isFavoriteEvent(item.id) ? amber : txt2}
                size={18}
                strokeWidth={2}
                fill={isFavoriteEvent(item.id) ? amber : 'transparent'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </AnimatedListItem>
      );
    },
    [isFavoriteEvent, navigation, onToggleFavorite, cardBg, cardBdr, txt1, txt2, amber, chipBg]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: pageBg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: txt1 }]}>Etkinlikler</Text>
        <TouchableOpacity
          onPress={() => setActiveTab('Favorilerim')}
          activeOpacity={0.85}
          style={[styles.favBadgeOuter, { backgroundColor: chipBg }]}
        >
          <Heart
            color={activeTab === 'Favorilerim' ? amber : txt1}
            size={18}
            strokeWidth={2}
            fill={activeTab === 'Favorilerim' ? amber : 'transparent'}
          />
          {(hasFavorites || activeTab === 'Favorilerim') && (
            <View style={[styles.favDot, { backgroundColor: amber, borderColor: chipBg }]} />
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

      {availableDays.length > 0 && (
        <View style={styles.dayStripRow}>
          <FlatList
            horizontal
            data={availableDays}
            keyExtractor={(d) => dayKey(d)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayStripContent}
            renderItem={({ item: d }) => {
              const key = dayKey(d);
              const active = selectedDayKey === key;
              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedDayKey(active ? null : key)}
                  style={[
                    styles.dayChip,
                    active ? { backgroundColor: ctaBg } : { backgroundColor: chipBg, borderWidth: 1, borderColor: cardBdr },
                  ]}
                >
                  <Text style={[styles.dayChipWeekday, { color: active ? ctaTxt : txt2 }]}>
                    {WEEKDAYS_SHORT[d.getDay()]}
                  </Text>
                  <Text style={[styles.dayChipNum, { color: active ? ctaTxt : txt1 }]}>{d.getDate()}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          {[1, 2, 3].map(i => (
            <View key={i} style={[styles.eventRowOuter, styles.skeletonCard, { backgroundColor: cardBg, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 12 }]}>
              <Skeleton width={52} height={52} borderRadius={14} isDark={isDark} />
              <Skeleton width={56} height={56} borderRadius={12} isDark={isDark} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="80%" height={16} borderRadius={6} isDark={isDark} />
                <Skeleton width="55%" height={12} borderRadius={6} isDark={isDark} />
              </View>
            </View>
          ))}
        </View>
      ) : filteredEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: txt2 }]}>
            {selectedDayKey
              ? 'Seçili günde etkinlik bulunmuyor.'
              : activeTab === 'Tümü'
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
  },
  favBadgeOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
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
  dayStripRow: {
    marginBottom: 10,
  },
  dayStripContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayChip: {
    width: 48,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
  },
  dayChipWeekday: {
    fontFamily: FontFamily.semiBold,
    fontSize: 9,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  dayChipNum: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
  },
  tabPill: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  tabPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  heroEventOuter: {
    marginBottom: 20,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroEventCard: {
    width: '100%',
    borderRadius: 22,
    height: 260,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroEventImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroEventImageRadius: {
    borderRadius: 22,
  },
  heroEventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  heroDateTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroDateTagText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
  heroHeartBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    padding: 18,
    paddingBottom: 16,
  },
  heroEventTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: '#fff',
    lineHeight: 25,
  },
  heroEventMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  heroUrgentTag: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroUrgentTagText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 10,
    letterSpacing: 0.4,
    color: '#fff',
  },
  eventRowOuter: {
    marginBottom: 12,
    borderRadius: 18,
  },
  eventRow: {
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
  },
  skeletonCard: {
    overflow: 'hidden',
  },
  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeTag: {
    fontFamily: FontFamily.semiBold,
    fontSize: 7,
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  dateBadgeDay: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  dateBadgeMonth: {
    fontFamily: FontFamily.semiBold,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  rowThumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rowThumb: {
    width: '100%',
    height: '100%',
  },
  rowInfo: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  rowMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  rowHeartBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
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
    textAlign: 'center',
  },
});

export default EventsScreen;
