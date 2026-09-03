import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react-native';
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
import { pickLocalized } from '@/lib/localizeContent';
import { useTranslation } from 'react-i18next';

const CATEGORIES = ['Tümü', 'Konser', 'Gezi', 'Spor'];

const MONTHS_SHORT = ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'];
const WEEKDAYS_SHORT = ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'];
const MONTHS_FULL = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const WEEKDAYS_MONDAY_FIRST = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

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

function formatEventDateLabel(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const d = parseEventDate(dateStr);
  if (!d) return '';
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (isSameDay(d, now)) return `BUGÜN · ${timePart}`;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (isSameDay(d, tomorrow)) return `YARIN · ${timePart}`;
  // e.g., 18 ARA · 20:30
  const monthsShort = ['OCA','ŞUB','MAR','NİS','MAY','HAZ','TEM','AĞU','EYL','EKİ','KAS','ARA'];
  return `${d.getDate()} ${monthsShort[d.getMonth()]} · ${timePart}`;
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
  const { i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<EventScreenNavigationProp>();
  const route = useRoute();
  const initialTab = (route.params as { initialTab?: string } | undefined)?.initialTab;
  const [activeTab, setActiveTab] = useState(initialTab === 'Favorilerim' ? 'Favorilerim' : 'Tümü');
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const { favoriteEventIds, isFavoriteEvent, toggleFavorite } = useFavorites();

  const { pageBg, cardBg, cardBdr, txt1, txt2, ctaBg, ctaTxt, chipBg, accent: amber, isDark } = t;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('etkinlikler')
        .select('*');

      if (data) {
        const mapped = data.map((row: any) => ({
          ...row,
          baslik: pickLocalized(row, 'baslik', i18n.language),
          aciklama: pickLocalized(row, 'aciklama', i18n.language),
        }));
        // En yakın/bugünkü etkinlik en üstte; tarihi olmayanlar en sonda
        mapped.sort((a, b) => {
          const da = parseEventDate(a.tarih);
          const db = parseEventDate(b.tarih);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return da.getTime() - db.getTime();
        });
        setEvents(mapped);
      }
      if (error) console.log('Etkinlik hatası:', error);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [i18n.language]);

  const availableDays = useMemo(() => {
    const map = new Map<string, Date>();
    events.forEach((e) => {
      const d = parseEventDate(e.tarih);
      if (d) map.set(dayKey(d), d);
    });
    return Array.from(map.values()).sort((a, b) => a.getTime() - b.getTime());
  }, [events]);

  const eventDayKeySet = useMemo(() => new Set(availableDays.map(dayKey)), [availableDays]);

  // Takvim en yakın etkinliğin ayından açılsın — kullanıcı ekranı açar
  // açmaz zaten yaklaşan etkinlik hangi ayda ise onu görsün, boş bir ay
  // grubuyla karşılaşmasın.
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    const upcoming = availableDays.find(d => d.getTime() >= now.getTime());
    const base = upcoming ?? now;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    // Pazartesi başlangıçlı hafta (getDay(): 0=Pazar) — Türkiye takvim geleneği
    const leadingBlanks = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(leadingBlanks).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [calendarMonth]);

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

    // En yakın tarihli (yaklaşan) etkinlik listenin başına gelsin —
    // önceden sıralama yoktu, index 0 rastgele hangi etkinlikse o büyük
    // öne çıkan kart oluyordu. Geçmiş etkinlikler sona itiliyor, yaklaşanlar
    // arasında en yakın tarih öne geliyor.
    const now = Date.now();
    return [...list].sort((a, b) => {
      const da = parseEventDate(a.tarih);
      const db = parseEventDate(b.tarih);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      const aFuture = da.getTime() >= now;
      const bFuture = db.getTime() >= now;
      if (aFuture !== bFuture) return aFuture ? -1 : 1;
      return aFuture ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
    });
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
            { borderWidth: 1.5, borderColor: '#111114' },
            active ? { backgroundColor: ctaBg } : { backgroundColor: chipBg },
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

      const hoursLeft = eventDate ? Math.round((eventDate.getTime() - now.getTime()) / 3600000) : null;
      const isUrgent = isToday && hoursLeft !== null && hoursLeft > 0 && hoursLeft <= 6;

      // İlk sıradaki etkinlik büyük "öne çıkan" kart olarak gösterilir
      if (index === 0) {
        return (
          <AnimatedListItem index={index} delay={40}>
            <View style={[styles.heroEventOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
              >
                <View style={styles.heroImageWrap}>
                  <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />

                  {eventDate && (
                    <View style={[styles.heroDateTag, { backgroundColor: isToday ? amber : '#fff' }]}>
                      <Text style={[styles.heroDateTagText, { color: isToday ? '#fff' : '#111114' }]}>
                        {isToday ? 'BUGÜN' : (isTomorrow ? 'YARIN' : `${eventDate.getDate()} ${MONTHS_SHORT[eventDate.getMonth()]}`)}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.heroHeartBtn}
                    onPress={() => onToggleFavorite(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Heart
                      color={isFavoriteEvent(item.id) ? amber : '#111114'}
                      size={18}
                      strokeWidth={2}
                      fill={isFavoriteEvent(item.id) ? amber : 'transparent'}
                    />
                  </TouchableOpacity>

                  {isUrgent && (
                    <View style={[styles.heroUrgentTag, { backgroundColor: amber }]}>
                      <Text style={styles.heroUrgentTagText}>SON {hoursLeft} SAAT</Text>
                    </View>
                  )}
                </View>

                {/* Keşfet/Gezi Rotaları kartlarındaki gibi: görsel üstte,
                    başlık ve detaylar altta beyaz/kart zemininde — resmin
                    üzerine koyu gradyanla yazı basmak yerine temiz ayrım */}
                <View style={styles.heroTextBlock}>
                  <Text style={[styles.heroEventTitle, { color: txt1 }]} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.heroMetaRow}>
                    <CalendarDays color={txt2} size={13} strokeWidth={2} />
                    <Text style={[styles.heroEventMeta, { color: txt2 }]} numberOfLines={1}>
                      {formatEventDateLabel(item.date)}{item.location ? ` · ${item.location}` : ''}
                    </Text>
                  </View>
                </View>
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
              <View style={styles.rowTitleLine}>
                <Text style={[styles.rowTitle, { color: txt1, flexShrink: 1 }]} numberOfLines={2}>
                  {item.title}
                </Text>
                {isUrgent && (
                  <View style={[styles.rowUrgentTag, { backgroundColor: amber }]}>
                    <Text style={styles.rowUrgentTagText}>{hoursLeft} SAAT</Text>
                  </View>
                )}
              </View>
              <View style={styles.rowMetaLine}>
                <View style={styles.rowMetaChip}>
                  <CalendarDays color={txt2} size={12} strokeWidth={2} />
                  <Text style={[styles.rowMeta, { color: txt2 }]} numberOfLines={1}>
                    {formatEventDateLabel(item.date)}
                  </Text>
                </View>
                <View style={styles.rowMetaChip}>
                  <MapPin color={txt2} size={12} strokeWidth={2} />
                  <Text style={[styles.rowMeta, { color: txt2 }]} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              </View>
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
        <View style={styles.headerPanel}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerLabel, { color: txt2 }]}>KEŞFET</Text>
              <Text style={[styles.headerTitle, { color: txt1 }]}>Etkinlikler</Text>
              <Text style={[styles.headerSubtitle, { color: txt2 }]}>Şehirde bugün ve yakında olanlar</Text>
            </View>
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
          <View style={styles.headerStatsRow}>
            <View style={[styles.headerStatPill, { backgroundColor: chipBg }]}>
              <Text style={[styles.headerStatText, { color: txt2 }]}>{filteredEvents.length} etkinlik</Text>
            </View>
            {selectedDayKey && (
              <View style={[styles.headerStatPill, { backgroundColor: chipBg }]}>
                <Text style={[styles.headerStatText, { color: txt2 }]}>Gün filtresi açık</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={[styles.pillsRowFixed, { flexDirection: 'row', alignItems: 'center' }]}>
        <FlatList
          horizontal
          data={CATEGORIES}
          renderItem={renderCategoryTab}
          keyExtractor={item => item}
          showsHorizontalScrollIndicator={false}
          style={styles.pillsFlatList}
          contentContainerStyle={styles.pillsContainer}
        />
        {availableDays.length > 0 && (
          <TouchableOpacity
            onPress={() => setCalendarVisible(v => !v)}
            activeOpacity={0.85}
            style={[
              styles.calToggleBtn,
              { borderWidth: 1.5, borderColor: '#111114', marginRight: 20 },
              calendarVisible || selectedDayKey ? { backgroundColor: ctaBg } : { backgroundColor: chipBg },
            ]}
          >
            <CalendarDays color={calendarVisible || selectedDayKey ? ctaTxt : txt1} size={18} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {calendarVisible && availableDays.length > 0 && (
        <View style={[styles.miniCalendar, cardBorder, { backgroundColor: cardBg }]}>
          <View style={styles.calHeaderRow}>
            <TouchableOpacity
              onPress={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft color={txt1} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
            <Text style={[styles.calHeaderLabel, { color: txt1 }]}>
              {MONTHS_FULL[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
            </Text>
            <TouchableOpacity
              onPress={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronRight color={txt1} size={20} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>

          <View style={styles.calWeekdayRow}>
            {WEEKDAYS_MONDAY_FIRST.map((w, i) => (
              <Text key={i} style={[styles.calWeekdayLabel, { color: txt2 }]}>{w}</Text>
            ))}
          </View>

          <View style={styles.calGrid}>
            {calendarCells.map((d, i) => {
              if (!d) return <View key={`blank-${i}`} style={styles.calCell} />;
              const key = dayKey(d);
              const hasEvent = eventDayKeySet.has(key);
              const active = selectedDayKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={styles.calCell}
                  activeOpacity={hasEvent ? 0.7 : 1}
                  disabled={!hasEvent}
                  onPress={() => setSelectedDayKey(active ? null : key)}
                >
                  <View style={[styles.calDayCircle, active && { backgroundColor: ctaBg }]}>
                    <Text
                      style={[
                        styles.calDayNum,
                        { color: active ? ctaTxt : hasEvent ? txt1 : txt2 },
                        !hasEvent && { opacity: 0.35 },
                      ]}
                    >
                      {d.getDate()}
                    </Text>
                  </View>
                  {hasEvent && !active && <View style={[styles.calDot, { backgroundColor: amber }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
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
          <View style={[styles.emptyCard, cardBorder, { backgroundColor: chipBg }]}>
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
    paddingBottom: 10,
  },
  headerPanel: {
    paddingTop: 6,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 1.3,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 28,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    marginTop: 2,
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerStatPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerStatText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
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
    height: 50,
    flexGrow: 0,
    flexShrink: 0,
  },
  pillsFlatList: {
    flex: 1,
    height: 50,
  },
  pillsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 2,
    alignItems: 'center',
    flexGrow: 0,
  },
  calToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCalendar: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 18,
    padding: 14,
  },
  calHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calHeaderLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
  },
  calWeekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calWeekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 3,
  },
  calDayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayNum: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
  },
  calDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  tabPill: {
    paddingHorizontal: 16,
    height: 40,
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
    paddingTop: 4,
  },
  heroEventOuter: {
    marginBottom: 14,
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroImageWrap: {
    width: '100%',
    height: 180,
  },
  heroImage: {
    width: '100%',
    height: '100%',
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
    backgroundColor: '#fff',
  },
  heroTextBlock: {
    padding: 16,
  },
  heroEventTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 19,
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  heroEventMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    flexShrink: 1,
  },
  heroUrgentTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
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
    borderRadius: 16,
  },
  eventRow: {
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
    gap: 10,
  },
  skeletonCard: {
    overflow: 'hidden',
  },
  dateBadge: {
    width: 48,
    height: 48,
    borderRadius: 13,
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
    width: 64,
    height: 64,
    borderRadius: 10,
    overflow: 'hidden',
  },
  rowThumb: {
    width: '100%',
    height: '100%',
  },
  rowInfo: {
    flex: 1,
    gap: 5,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    letterSpacing: -0.2,
    lineHeight: 19,
  },
  rowUrgentTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rowUrgentTagText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 9,
    letterSpacing: 0.3,
    color: '#fff',
  },
  rowMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    maxWidth: 120,
  },
  rowMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    paddingTop: 72,
    paddingHorizontal: 24,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default EventsScreen;
