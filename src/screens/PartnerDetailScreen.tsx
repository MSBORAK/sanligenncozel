import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Heart,
  Tag,
  Coffee,
  Shirt,
  Smartphone,
  Ticket,
  GraduationCap,
  Gift,
  Megaphone,
  Film,
  Utensils,
  ExternalLink,
  Calendar,
  Sparkles,
  LucideIcon,
} from 'lucide-react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Colors, DribbbleColors, Gradients } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { supabase, processImageUrl } from '@/lib/supabase';
import { MOCK_PARTNERS } from '@/api/mockData';

type Props = StackScreenProps<RootStackParamList, 'PartnerDetail'>;

const HERO_RATIO = 0.68;
const RADIUS = 22;

interface FirsatRow {
  id: number;
  baslik: string;
  aciklama?: string;
  tarih?: string;
  kategori: string;
  resim_url?: string;
}

interface PartnerView {
  title: string;
  description: string;
  category: string;
  offer?: string;
  imageUrl?: string | null;
  date?: string;
  externalUrl?: string;
}

type CategoryTheme = { icon: LucideIcon; color: string; bg: string };

function getCategoryTheme(kategori: string): CategoryTheme {
  const k = (kategori || '').toLowerCase();
  if (k.includes('yiyecek') || k.includes('içecek') || k.includes('icecek') || k === 'kafe' || k.includes('kahve'))
    return { icon: Coffee, color: '#ea580c', bg: '#fff7ed' };
  if (k.includes('giyim') || k.includes('moda')) return { icon: Shirt, color: '#9333ea', bg: '#faf5ff' };
  if (k.includes('teknoloji') || k.includes('elektronik')) return { icon: Smartphone, color: '#2563eb', bg: '#eff6ff' };
  if (k.includes('bilet') || k.includes('etkinlik') || k.includes('sinema') || k.includes('film'))
    return { icon: Ticket, color: '#dc2626', bg: '#fef2f2' };
  if (k.includes('öğrenci') || k.includes('ogrenci')) return { icon: GraduationCap, color: '#16a34a', bg: '#f0fdf4' };
  if (k.includes('indirim')) return { icon: Tag, color: '#e11d48', bg: '#fff1f2' };
  if (k.includes('kampanya')) return { icon: Megaphone, color: '#d97706', bg: '#fffbeb' };
  if (k.includes('sinema')) return { icon: Film, color: '#4f46e5', bg: '#eef2ff' };
  if (k.includes('restoran') || k.includes('yemek')) return { icon: Utensils, color: '#c2410c', bg: '#fff7ed' };
  return { icon: Gift, color: Colors.primaryHex, bg: '#fffbeb' };
}

function fromSupabase(row: FirsatRow): PartnerView {
  return {
    title: row.baslik,
    description: row.aciklama?.trim() || 'Bu fırsat için açıklama eklenmemiş.',
    category: row.kategori,
    imageUrl: processImageUrl(row.resim_url, 'firsat_resimleri'),
    date: row.tarih,
  };
}

function fromMock(id: string): PartnerView | null {
  const m = MOCK_PARTNERS.find((p) => p.id === id);
  if (!m) return null;
  return {
    title: m.name,
    description: m.description,
    category: m.category || 'Diğer',
    offer: m.offer,
    imageUrl: m.imageUrl || null,
    externalUrl: m.url,
  };
}

const PartnerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { partnerId } = route.params;
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const { isFavoritePartner, toggleFavorite } = useFavorites();

  const [partner, setPartner] = useState<PartnerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPartner = useCallback(
    async (fromRefresh = false) => {
      try {
        if (fromRefresh) setRefreshing(true);
        else setLoading(true);

        const numId = parseInt(partnerId, 10);
        if (!Number.isNaN(numId)) {
          const { data, error } = await supabase.from('firsatlar').select('*').eq('id', numId).single();
          if (!error && data) {
            setPartner(fromSupabase(data as FirsatRow));
            return;
          }
        }

        const mock = fromMock(partnerId);
        setPartner(mock);
      } catch (e) {
        console.error('Fırsat detay:', e);
        setPartner(fromMock(partnerId));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [partnerId]
  );

  useEffect(() => {
    loadPartner(false);
  }, [loadPartner]);

  const heroHeight = Dimensions.get('window').width * HERO_RATIO;
  const backTop = insets.top + 10;
  const theme = partner ? getCategoryTheme(partner.category) : getCategoryTheme('');
  const Icon = theme.icon;
  const isFav = isFavoritePartner(partnerId);
  const rawUrl = partner?.externalUrl?.trim();
  const canOpenLink = Boolean(
    rawUrl && rawUrl !== '#' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
  );

  if (loading && !partner) {
    return (
      <View style={[styles.screen, isDark && styles.screenDark]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primaryHex} />
          <Text style={[styles.loadingLabel, isDark && styles.mutedDark]}>Fırsat yükleniyor…</Text>
        </View>
      </View>
    );
  }

  if (!partner) {
    return (
      <View style={[styles.screen, isDark && styles.screenDark]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 8 }, isDark && styles.simpleHeaderDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn} hitSlop={12}>
            <ChevronLeft color={isDark ? '#f8fafc' : DribbbleColors.textPrimary} size={28} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, isDark && { color: '#f8fafc' }]}>Fırsat bulunamadı</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyCopy, isDark && styles.mutedDark]}>
            Bu fırsat kaldırılmış veya artık geçerli olmayabilir.
          </Text>
        </View>
      </View>
    );
  }

  const hasImage = Boolean(partner.imageUrl && partner.imageUrl.length > 0);

  return (
    <View style={[styles.screen, isDark && styles.screenDark]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPartner(true)}
            tintColor={isDark ? '#f8fafc' : Colors.primaryHex}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.hero, { height: heroHeight }]}>
          {hasImage ? (
            <Image source={{ uri: partner.imageUrl! }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[theme.bg, `${theme.bg}dd`, '#fef3c7']} style={StyleSheet.absoluteFillObject}>
              <View style={styles.heroIconCenter}>
                <View style={[styles.heroIconRing, { borderColor: theme.color + '44' }]}>
                  <Icon color={theme.color} size={48} strokeWidth={1.8} />
                </View>
              </View>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['rgba(245,158,11,0.2)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.2, y: 0.45 }}
            style={styles.amberSheen}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.42)']}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.roundFab, { top: backTop, left: 18 }]}
            activeOpacity={0.88}
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
            <ChevronLeft color="#fff" size={26} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite('partner', partnerId)}
            style={[styles.roundFab, { top: backTop, right: 18 }]}
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
            <Heart color="#fff" size={20} strokeWidth={2} fill={isFav ? Colors.primaryHex : 'transparent'} />
          </TouchableOpacity>

          <View style={styles.heroBadge}>
            <Text style={[styles.heroBadgeText, { color: theme.color }]}>{partner.category}</Text>
          </View>
        </View>

        <View style={[styles.sheet, isDark && styles.sheetDark]}>
          <View style={styles.handleWrap}>
            <View style={[styles.handle, isDark && styles.handleDark]} />
          </View>

          <Text style={[styles.title, isDark && styles.titleDark]}>{partner.title}</Text>

          {partner.offer ? (
            <View style={[styles.offerPill, isDark && styles.offerPillDark]}>
              <Sparkles color={Colors.primaryHex} size={16} strokeWidth={2} />
              <Text style={[styles.offerPillText, isDark && { color: '#fde68a' }]}>{partner.offer}</Text>
            </View>
          ) : null}

          <View style={[styles.bentoRow, isDark && styles.bentoRowDark]}>
            <Tag color={Colors.primaryHex} size={18} strokeWidth={2} />
            <Text style={[styles.bentoMain, isDark && styles.bentoMainDark]}>Genç Kart anlaşmalı · {partner.category}</Text>
          </View>

          {partner.date ? (
            <View style={[styles.bentoRow, isDark && styles.bentoRowDark]}>
              <Calendar color={theme.color} size={18} strokeWidth={2} />
              <Text style={[styles.bentoText, isDark && styles.bentoTextDark]}>Geçerlilik: {partner.date}</Text>
            </View>
          ) : null}

          <View style={[styles.descCard, isDark && styles.descCardDark]}>
            <LinearGradient
              colors={isDark ? ['rgba(56,189,248,0.1)', 'transparent'] : [...Gradients.meshBuff]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.descLabel, isDark && { color: Colors.dark.highlight }]}>Fırsat detayı</Text>
            <Text style={[styles.description, isDark && styles.descriptionDark]}>{partner.description}</Text>
          </View>

          {canOpenLink ? (
            <TouchableOpacity
              style={[styles.cta, isDark && styles.ctaDark]}
              activeOpacity={0.9}
              onPress={() => {
                const u = partner.externalUrl!.trim();
                Linking.openURL(u).catch(() => {});
              }}
            >
              <LinearGradient
                colors={isDark ? ['#0369a1', '#0ea5e9'] : [Colors.primaryHex, '#f59e0b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <ExternalLink color="#fff" size={18} strokeWidth={2} />
              <Text style={styles.ctaText}>Mekânı / siteyi aç</Text>
            </TouchableOpacity>
          ) : null}
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
  mutedDark: { color: '#94a3b8' },
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
  backIconBtn: { marginRight: 4, padding: 4 },
  simpleHeaderTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    color: DribbbleColors.textPrimary,
  },
  emptyBody: { flex: 1, justifyContent: 'center', padding: 32 },
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
  heroIconCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  amberSheen: {
    ...StyleSheet.absoluteFillObject,
    borderTopRightRadius: 0,
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  roundFab: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.98)',
  },
  heroBadgeText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  sheet: {
    marginTop: -RADIUS,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 10,
  },
  sheetDark: {
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderColor: 'rgba(251,191,36,0.2)',
    shadowOpacity: 0.25,
  },
  handleWrap: { alignItems: 'center', marginBottom: 10 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  handleDark: { backgroundColor: 'rgba(255,255,255,0.15)' },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    letterSpacing: -0.35,
    lineHeight: 30,
    color: DribbbleColors.textPrimary,
    marginBottom: 12,
  },
  titleDark: { color: '#f8fafc' },
  offerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    marginBottom: 14,
  },
  offerPillDark: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: 'rgba(251,191,36,0.35)',
  },
  offerPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    color: '#b45309',
  },
  bentoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(248,250,252,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  bentoRowDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bentoMain: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    color: DribbbleColors.textPrimary,
  },
  bentoMainDark: { color: '#e2e8f0' },
  bentoText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
    color: DribbbleColors.textSecondary,
  },
  bentoTextDark: { color: '#94a3b8' },
  descCard: {
    marginTop: 6,
    borderRadius: 18,
    padding: 18,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
  },
  descCardDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(251,191,36,0.22)',
  },
  descLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
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
  descriptionDark: { color: '#94a3b8' },
  cta: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  ctaDark: {
    borderColor: 'rgba(251,191,36,0.4)',
  },
  ctaText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: '#ffffff',
  },
});

export default PartnerDetailScreen;
