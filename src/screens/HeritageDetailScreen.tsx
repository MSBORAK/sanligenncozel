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
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Heart, Landmark } from 'lucide-react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { supabase, processImageUrl } from '@/lib/supabase';
import { MOCK_MAGAZINES } from '@/api/mockData';

type Props = StackScreenProps<RootStackParamList, 'HeritageDetail'>;

const HERO_RATIO = 0.72;
const RADIUS = 22;

const KESFET = {
  blue950: '#172554',
  blue900: '#1e3a8a',
  blue800: '#1e40af',
  blue700: '#1d4ed8',
  blue600: '#2563eb',
  blue500: '#3b82f6',
  sky50: '#f0f9ff',
  iconDark: '#93c5fd',
} as const;

const categoryLabel: Record<'historic' | 'museum' | 'nature', string> = {
  historic: 'Tarihi yer',
  museum: 'Müze',
  nature: 'Doğa & park',
};

interface KesfetRow {
  id: number;
  baslik: string;
  aciklama?: string;
  kategori?: string;
  resim_url?: string;
}

interface PlaceView {
  title: string;
  description?: string;
  category: 'historic' | 'museum' | 'nature';
  image: string | number;
}

function toPlaceFromRow(row: KesfetRow): PlaceView {
  return {
    title: row.baslik,
    description: row.aciklama,
    category: (row.kategori as PlaceView['category']) || 'historic',
    image: processImageUrl(row.resim_url, 'kesfet_resimleri') || 'https://via.placeholder.com/800x600',
  };
}

function toPlaceFromMock(id: string): PlaceView | null {
  const m = MOCK_MAGAZINES.find((x) => String(x.id) === String(id));
  if (!m) return null;
  return {
    title: m.title,
    description: m.description,
    category: m.category,
    image: typeof m.image === 'string' ? m.image : m.image,
  };
}

function resolveImageSource(image: string | number): ImageSourcePropType {
  if (typeof image === 'string') return { uri: image };
  return image;
}

const HeritageDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const { isFavoriteHeritage, toggleFavorite } = useFavorites();

  const [place, setPlace] = useState<PlaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlace = useCallback(
    async (fromRefresh = false) => {
      try {
        if (fromRefresh) setRefreshing(true);
        else setLoading(true);

        const numericId = /^\d+$/.test(id) ? parseInt(id, 10) : null;
        if (numericId != null) {
          const { data, error } = await supabase.from('kesfet').select('*').eq('id', numericId).single();
          if (!error && data) {
            setPlace(toPlaceFromRow(data as KesfetRow));
            return;
          }
        }

        const mockPlace = toPlaceFromMock(id);
        setPlace(mockPlace);
      } catch (e) {
        console.error('Keşfet detay yüklenemedi:', e);
        setPlace(toPlaceFromMock(id));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    loadPlace(false);
  }, [loadPlace]);

  const heroHeight = Dimensions.get('window').width * HERO_RATIO;
  const backButtonTop = insets.top + 10;
  const isFav = isFavoriteHeritage(id);

  if (loading && !place) {
    return (
      <View style={[styles.screen, isDark && styles.screenDark]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={KESFET.blue600} />
          <Text style={[styles.loadingLabel, isDark && styles.mutedDark]}>Yükleniyor…</Text>
        </View>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={[styles.screen, isDark && styles.screenDark]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 8 }, isDark && styles.simpleHeaderDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn} hitSlop={12}>
            <ChevronLeft color={isDark ? '#f8fafc' : DribbbleColors.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, isDark && { color: '#f8fafc' }]}>İçerik bulunamadı</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyCopy, isDark && styles.mutedDark]}>
            Bu mekân bulunamadı veya kaldırılmış olabilir.
          </Text>
        </View>
      </View>
    );
  }

  const imgSource = resolveImageSource(place.image);

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
            onRefresh={() => loadPlace(true)}
            tintColor={isDark ? '#f8fafc' : KESFET.blue600}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          <Image source={imgSource} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(59,130,246,0.26)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.15, y: 0.5 }}
            style={styles.blueSheen}
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

          <TouchableOpacity
            style={[styles.heartFab, { top: backButtonTop }]}
            onPress={() => toggleFavorite('heritage', id)}
            activeOpacity={0.85}
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
            <Heart
              color="#ffffff"
              size={20}
              strokeWidth={2}
              fill={isFav ? Colors.primaryHex : 'transparent'}
            />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{categoryLabel[place.category]}</Text>
          </View>
        </View>

        <View style={[styles.sheet, isDark && styles.sheetDark]}>
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, isDark && styles.sheetHandleDark]} />
          </View>

          <Text style={[styles.title, isDark && styles.titleDark]}>{place.title}</Text>

          <View style={[styles.bentoRow, isDark && styles.bentoRowDark]}>
            <Landmark color={KESFET.blue600} size={18} strokeWidth={2} />
            <Text style={[styles.bentoText, isDark && styles.bentoTextDark]}>
              Keşfet · {categoryLabel[place.category]}
            </Text>
          </View>

          <View style={[styles.descCard, isDark && styles.descCardDark]}>
            <LinearGradient
              colors={isDark ? ['rgba(59,130,246,0.14)', 'transparent'] : ['#eff6ff', '#f8fafc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.descLabel, isDark && { color: KESFET.iconDark }]}>Hakkında</Text>
            <Text style={[styles.description, isDark && styles.descriptionDark]}>
              {place.description?.trim() || 'Bu mekân için henüz detaylı açıklama eklenmemiş.'}
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
    backgroundColor: KESFET.sky50,
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
  blueSheen: {
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
  heartFab: {
    position: 'absolute',
    right: 18,
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
    color: KESFET.blue800,
    letterSpacing: 0.3,
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
    borderColor: 'rgba(37,99,235,0.1)',
    shadowColor: KESFET.blue900,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetDark: {
    backgroundColor: 'rgba(15,23,42,0.96)',
    borderColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0.22,
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
    marginBottom: 16,
  },
  titleDark: {
    color: '#f8fafc',
  },
  bentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(239,246,255,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.1)',
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
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.16)',
  },
  descCardDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(96,165,250,0.25)',
  },
  descLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: KESFET.blue700,
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

export default HeritageDetailScreen;
