import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, CalendarDays, Tag } from 'lucide-react-native';
import { RootStackParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/useAppTheme';
import { FontFamily } from '@/constants/Typography';
import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';

const HERO_RATIO = 0.62;
const RADIUS = 22;
const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W - 32;
const HERO_H = HERO_W * HERO_RATIO;

interface EventData {
  id: string;
  baslik: string;
  aciklama?: string;
  tarih: string;
  konum: string;
  kategori: string;
  resim_url?: string;
  saat?: string;
}

type EventDetailScreenProps = StackScreenProps<RootStackParamList, 'EventDetail'>;

const EventDetailScreen: React.FC<EventDetailScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const t = useAppTheme();
  const { isDark, pageBg, cardBg, cardBdr, chipBg, txt1, txt2, ctaBg, ctaTxt } = t;
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEventDetails = useCallback(
    async (fromRefresh = false) => {
      try {
        if (fromRefresh) setRefreshing(true);
        else setLoading(true);

        const { data, error } = await supabase
          .from('etkinlikler')
          .select('*')
          .eq('id', eventId)
          .single();

        if (error) {
          console.error('Etkinlik detayları çekilirken hata:', error);
          setEvent(null);
        } else if (data) {
          setEvent(data as EventData);
        }
      } catch (e) {
        console.error('Etkinlik detayları beklenmedik hata:', e);
        setEvent(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    fetchEventDetails(false);
  }, [fetchEventDetails]);


  if (loading && !event) {
    return (
      <View style={[styles.screen, { backgroundColor: pageBg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={txt1} />
          <Text style={[styles.loadingLabel, { color: txt2 }]}>Etkinlik yükleniyor…</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.screen, { backgroundColor: pageBg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 8, borderBottomColor: cardBdr }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn} hitSlop={12}>
            <ChevronLeft color={txt1} size={28} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, { color: txt1 }]}>Etkinlik bulunamadı</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyCopy, { color: txt2 }]}>
            Bu etkinlik bulunamadı veya bir hata oluştu.
          </Text>
        </View>
      </View>
    );
  }

  const imageUri = processImageUrl(event.resim_url, 'etkinlik_resimleri') || cityFallback(event.id);

  return (
    <View style={[styles.screen, { backgroundColor: pageBg }]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEventDetails(true)}
            tintColor={txt2}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.hero, { height: HERO_H, marginTop: insets.top + 8, backgroundColor: chipBg }]}>
          <ImageBackground
            source={{ uri: imageUri }}
            style={styles.heroImageBg}
            imageStyle={styles.heroImageRadius}
            resizeMode="cover"
          >
          <LinearGradient
            colors={isDark ? ['rgba(47,36,24,0.22)', 'transparent'] : ['rgba(47,36,24,0.18)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.15, y: 0.5 }}
            style={styles.amberSheen}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backFab, { top: 14 }]}
            activeOpacity={0.88}
            hitSlop={8}
          >
            {Platform.OS === 'ios' ? (
              <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFill} />
            ) : null}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.45)' },
              ]}
            />
            <ChevronLeft color="#ffffff" size={26} strokeWidth={2.2} />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{event.kategori}</Text>
          </View>
          </ImageBackground>
        </View>

        <View style={[styles.sheet, { backgroundColor: cardBg, borderColor: cardBdr }]}>
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, { backgroundColor: cardBdr }]} />
          </View>

          <Text style={[styles.title, { color: txt1 }]}>{event.baslik}</Text>

          <View style={[styles.bentoRow, { backgroundColor: chipBg, borderColor: t.border }]}>
            <CalendarDays color={t.accent} size={18} strokeWidth={2} />
            <Text style={[styles.bentoText, { color: txt1 }]}>
              {event.tarih}
              {event.saat ? ` · ${event.saat}` : ''}
            </Text>
          </View>
          <View style={[styles.bentoRow, { backgroundColor: chipBg, borderColor: t.border }]}>
            <MapPin color={t.accent} size={18} strokeWidth={2} />
            <Text style={[styles.bentoText, { color: txt1 }]}>{event.konum}</Text>
          </View>
          <View style={[styles.bentoRow, { backgroundColor: chipBg, borderColor: t.border }]}>
            <Tag color={t.accent} size={18} strokeWidth={2} />
            <Text style={[styles.bentoText, { color: txt1 }]}>{event.kategori}</Text>
          </View>

          <View style={[styles.descCard, { backgroundColor: cardBg, borderColor: t.border }]}>
            <LinearGradient
              colors={isDark ? ['rgba(56,189,248,0.12)', 'transparent'] : ['rgba(241,227,203,0.84)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.descLabel, { color: txt2 }]}>Detay</Text>
            <Text style={[styles.description, { color: txt2 }]}>
              {event.aciklama?.trim() || 'Bu etkinlik için detaylı açıklama bulunmamaktadır.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingLabel: {
    marginTop: 14,
    fontFamily: FontFamily.medium,
    fontSize: 15,
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backIconBtn: {
    marginRight: 4,
    padding: 4,
  },
  simpleHeaderTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
  },
  emptyBody: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyCopy: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  hero: {
    width: HERO_W,
    alignSelf: 'center',
    position: 'relative',
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  heroImageBg: {
    width: '100%',
    height: '100%',
  },
  heroImageRadius: {
    borderRadius: RADIUS,
  },
  amberSheen: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  backFab: {
    position: 'absolute',
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,248,234,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(58,42,26,0.18)',
  },
  heroBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#111114',
    letterSpacing: 0.4,
  },
  sheet: {
    marginTop: -RADIUS,
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    letterSpacing: -0.35,
    lineHeight: 30,
    marginBottom: 18,
  },
  bentoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  bentoText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  descCard: {
    marginTop: 8,
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  descLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 26,
  },
});

export default EventDetailScreen;
