import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
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
import { useThemeMode } from '@/context/ThemeContext';
import { Colors, DribbbleColors, Gradients } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { supabase, processImageUrl } from '@/lib/supabase';

const HERO_RATIO = 0.72;
const RADIUS = 22;

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
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
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

  const heroHeight = Dimensions.get('window').width * HERO_RATIO;
  const imageUri = event
    ? processImageUrl(event.resim_url, 'etkinlik_resimleri') || 'https://via.placeholder.com/800x600'
    : '';

  const backButtonTop = insets.top + 10;

  if (loading && !event) {
    return (
      <View style={[styles.screen, isDark && styles.screenDark]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primaryHex} />
          <Text style={[styles.loadingLabel, isDark && styles.mutedDark]}>Etkinlik yükleniyor…</Text>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.screen, isDark && styles.screenDark]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 8 }, isDark && styles.simpleHeaderDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn} hitSlop={12}>
            <ChevronLeft color={isDark ? '#f8fafc' : DribbbleColors.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, isDark && { color: '#f8fafc' }]}>Etkinlik bulunamadı</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyCopy, isDark && styles.mutedDark]}>
            Bu etkinlik bulunamadı veya bir hata oluştu.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, isDark && styles.screenDark]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEventDetails(true)}
            tintColor={isDark ? '#f8fafc' : Colors.primaryHex}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <LinearGradient
            colors={isDark ? ['rgba(56,189,248,0.22)', 'transparent'] : ['rgba(245,158,11,0.28)', 'transparent']}
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
            style={[styles.backFab, { top: backButtonTop }]}
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
        </View>

        <View style={[styles.sheet, isDark && styles.sheetDark]}>
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, isDark && styles.sheetHandleDark]} />
          </View>

          <Text style={[styles.title, isDark && styles.titleDark]}>{event.baslik}</Text>

          <View style={[styles.bentoRow, isDark && styles.bentoRowDark]}>
            <CalendarDays color={isDark ? Colors.dark.accent : Colors.primaryHex} size={18} strokeWidth={2} />
            <Text style={[styles.bentoText, isDark && styles.bentoTextDark]}>
              {event.tarih}
              {event.saat ? ` · ${event.saat}` : ''}
            </Text>
          </View>
          <View style={[styles.bentoRow, isDark && styles.bentoRowDark]}>
            <MapPin color={isDark ? Colors.dark.accent : Colors.primaryHex} size={18} strokeWidth={2} />
            <Text style={[styles.bentoText, isDark && styles.bentoTextDark]}>{event.konum}</Text>
          </View>
          <View style={[styles.bentoRow, isDark && styles.bentoRowDark]}>
            <Tag color={isDark ? Colors.dark.accent : Colors.primaryHex} size={18} strokeWidth={2} />
            <Text style={[styles.bentoText, isDark && styles.bentoTextDark]}>{event.kategori}</Text>
          </View>

          <View style={[styles.descCard, isDark && styles.descCardDark]}>
            <LinearGradient
              colors={isDark ? ['rgba(56,189,248,0.12)', 'transparent'] : [...Gradients.meshBuff]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.descLabel, isDark && { color: Colors.dark.highlight }]}>Detay</Text>
            <Text style={[styles.description, isDark && styles.descriptionDark]}>
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
    backgroundColor: DribbbleColors.background,
  },
  screenDark: {
    backgroundColor: Colors.dark.background,
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
    color: DribbbleColors.textSecondary,
  },
  mutedDark: {
    color: '#94a3b8',
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  simpleHeaderDark: {
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backIconBtn: {
    marginRight: 4,
    padding: 4,
  },
  simpleHeaderTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    color: DribbbleColors.textPrimary,
  },
  emptyBody: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyCopy: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: DribbbleColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  hero: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#e2e8f0',
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
  },
  heroBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: DribbbleColors.textPrimary,
    letterSpacing: 0.4,
  },
  sheet: {
    marginTop: -RADIUS,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetDark: {
    backgroundColor: 'rgba(15,23,42,0.96)',
    borderColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0.25,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  sheetHandleDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    letterSpacing: -0.35,
    lineHeight: 30,
    color: DribbbleColors.textPrimary,
    marginBottom: 18,
  },
  titleDark: {
    color: '#f8fafc',
  },
  bentoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(248,250,252,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bentoRowDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bentoText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    color: DribbbleColors.textPrimary,
  },
  bentoTextDark: {
    color: '#e2e8f0',
  },
  descCard: {
    marginTop: 8,
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
  },
  descCardDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(251,191,36,0.2)',
  },
  descLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: Colors.primaryHex,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 26,
    color: DribbbleColors.textSecondary,
  },
  descriptionDark: {
    color: '#94a3b8',
  },
});

export default EventDetailScreen;
