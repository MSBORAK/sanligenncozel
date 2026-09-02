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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, CalendarDays, Tag } from 'lucide-react-native';
import { RootStackParamList } from '@/types/navigation';
import { Clean } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';
import { pickLocalized } from '@/lib/localizeContent';
import { useTranslation } from 'react-i18next';

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
  const { t: tr, i18n } = useTranslation();
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
          setEvent({
            ...(data as EventData),
            baslik: pickLocalized(data, 'baslik', i18n.language),
            aciklama: pickLocalized(data, 'aciklama', i18n.language),
          });
        }
      } catch (e) {
        console.error('Etkinlik detayları beklenmedik hata:', e);
        setEvent(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId, i18n.language]
  );

  useEffect(() => {
    fetchEventDetails(false);
  }, [fetchEventDetails]);


  if (loading && !event) {
    return (
      <View style={[styles.screen, { backgroundColor: Clean.bg }]}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Clean.textPrimary} />
          <Text style={[styles.loadingLabel, { color: Clean.textSecondary }]}>{tr('eventDetail.yukleniyor')}</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.screen, { backgroundColor: Clean.bg }]}>
        <StatusBar style="dark" />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 8, borderBottomColor: Clean.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn} hitSlop={12}>
            <ChevronLeft color={Clean.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, { color: Clean.textPrimary }]}>{tr('eventDetail.bulunamadi')}</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyCopy, { color: Clean.textSecondary }]}>
            {tr('eventDetail.hataMetni')}
          </Text>
        </View>
      </View>
    );
  }

  const imageUri = processImageUrl(event.resim_url, 'etkinlik_resimleri') || cityFallback(event.id);
  const openInMaps = async () => {
    const query = encodeURIComponent(`${event.konum} Şanlıurfa`);
    const googleAppUrl = `comgooglemaps://?q=${query}`;
    const appleMapsUrl = `http://maps.apple.com/?q=${query}`;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
    try {
      const canOpenGoogle = await Linking.canOpenURL(googleAppUrl);
      if (canOpenGoogle) {
        await Linking.openURL(googleAppUrl);
        return;
      }
      const canOpenApple = await Linking.canOpenURL(appleMapsUrl);
      await Linking.openURL(canOpenApple ? appleMapsUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: Clean.bg }]}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEventDetails(true)}
            tintColor={Clean.textSecondary}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.heroOuter, { marginTop: insets.top + 8, backgroundColor: Clean.bg, borderColor: '#111114' }]}>
        <View style={[styles.hero, { height: HERO_H, backgroundColor: Clean.surfaceSoft }]}>
          <ImageBackground
            source={{ uri: imageUri }}
            style={styles.heroImageBg}
            imageStyle={styles.heroImageRadius}
            resizeMode="cover"
          >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />

          <View style={[styles.heroBadge, { backgroundColor: Clean.bg, borderColor: '#111114' }]}>
            <Text style={styles.heroBadgeText}>{event.kategori}</Text>
          </View>
          </ImageBackground>
        </View>
        </View>

        <View style={[styles.sheet, { backgroundColor: Clean.bg }]}>
          <Text style={[styles.eyebrow, { color: Clean.textSecondary }]}>{tr('eventDetail.detay')}</Text>
          <Text style={[styles.title, { color: Clean.textPrimary }]} numberOfLines={3}>{event.baslik}</Text>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryPill, { backgroundColor: Clean.surface, borderColor: '#111114' }]}>
              <Tag color={Clean.accent} size={14} strokeWidth={2} />
              <Text style={[styles.summaryPillText, { color: Clean.textPrimary }]}>{event.kategori}</Text>
            </View>
            {event.saat ? (
              <View style={[styles.summaryPill, { backgroundColor: Clean.surface, borderColor: '#111114' }]}>
                <CalendarDays color={Clean.accent} size={14} strokeWidth={2} />
                <Text style={[styles.summaryPillText, { color: Clean.textPrimary }]}>{event.saat}</Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.bentoRow, { backgroundColor: Clean.surface, borderColor: '#111114' }]}>
            <CalendarDays color={Clean.accent} size={18} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bentoLabel, { color: Clean.textSecondary }]}>{tr('eventDetail.tarih')}</Text>
              <Text style={[styles.bentoText, { color: Clean.textPrimary }]}>{event.tarih}</Text>
            </View>
          </View>
          <View style={[styles.bentoRow, { backgroundColor: Clean.surface, borderColor: '#111114' }]}>
            <MapPin color={Clean.accent} size={18} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.bentoLabel, { color: Clean.textSecondary }]}>{tr('eventDetail.konum')}</Text>
              <Text style={[styles.bentoText, { color: Clean.textPrimary }]}>{event.konum}</Text>
            </View>
          </View>

          <View style={[styles.descCard, { backgroundColor: Clean.surface, borderColor: '#111114' }]}>
            <Text style={[styles.descLabel, { color: Clean.textSecondary }]}>{tr('eventDetail.aciklamaBaslik')}</Text>
            <Text style={[styles.description, { color: Clean.textSecondary }]}>
              {event.aciklama?.trim() || tr('eventDetail.aciklamaYok')}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openInMaps}
            style={[styles.mapCta, { backgroundColor: Clean.ctaBg }]}
          >
            <MapPin color={Clean.ctaText} size={16} strokeWidth={2} />
            <Text style={[styles.mapCtaText, { color: Clean.ctaText }]}>{tr('eventDetail.haritadaAc')}</Text>
          </TouchableOpacity>
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
  heroOuter: {
    width: HERO_W,
    alignSelf: 'center',
    borderRadius: RADIUS + 8,
    borderWidth: 1.5,
    padding: 8,
  },
  hero: {
    width: '100%',
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
  heroBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#111114',
    letterSpacing: 0.4,
  },
  sheet: {
    marginTop: 16,
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 0,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  eyebrow: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 6,
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
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  summaryPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
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
  bentoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    marginBottom: 2,
  },
  bentoText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14.5,
    lineHeight: 21,
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
  mapCta: {
    marginTop: 14,
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapCtaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14.5,
    letterSpacing: 0.1,
  },
});

export default EventDetailScreen;
