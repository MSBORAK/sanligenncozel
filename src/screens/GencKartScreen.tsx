import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Wifi, Heart, Coffee, Utensils, Film, Shirt, Smartphone, Tag } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { GencKartCardTheme } from '@/theme/colors';
import { cardOuterShadow, cardInnerClip } from '@/constants/Shadows';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import { MOCK_USER } from '@/api/mockData';
import { DiscountPartner } from '@/types';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFavorites } from '@/context/FavoritesContext';
import { useUser } from '@/context/UserContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { pickLocalized } from '@/lib/localizeContent';

/** Kategoriye/isme göre uygun ikon seçer (PartnerDetailScreen ile aynı mantık) */
function getCategoryIcon(kategori: string, name?: string): React.ComponentType<any> {
  const nm = (name || '').toLowerCase();
  if (nm.includes('kahve') || nm.includes('kafe') || nm.includes('çay')) return Coffee;
  if (nm.includes('restoran') || nm.includes('lokanta') || nm.includes('kebap') || nm.includes('yemek')) return Utensils;
  if (nm.includes('sinema') || nm.includes('film')) return Film;
  if (nm.includes('giyim') || nm.includes('moda') || nm.includes('mağaza')) return Shirt;
  if (nm.includes('teknoloji') || nm.includes('telefon')) return Smartphone;
  const k = (kategori || '').toLowerCase();
  if (k.includes('yiyecek') || k.includes('içecek') || k.includes('icecek') || k.includes('kafe') || k.includes('kahve')) return Coffee;
  if (k.includes('giyim') || k.includes('moda')) return Shirt;
  if (k.includes('teknoloji') || k.includes('elektronik')) return Smartphone;
  if (k.includes('sinema') || k.includes('film')) return Film;
  return Tag;
}

type Nav = StackNavigationProp<RootStackParamList>;

type Category = 'Tümü' | 'Favoriler' | 'Kafe' | 'Sinema' | 'Giyim';

const CATEGORIES: Category[] = ['Tümü', 'Favoriler', 'Kafe', 'Sinema', 'Giyim'];

const CATEGORY_KEYS: Record<Category, string> = {
  'Tümü': 'gencKart.catAll',
  'Favoriler': 'gencKart.catFavorites',
  'Kafe': 'gencKart.catCafe',
  'Sinema': 'gencKart.catCinema',
  'Giyim': 'gencKart.catClothing',
};

const categoryLabel = (category: Category, tr: (key: string) => string) => tr(CATEGORY_KEYS[category]);

/** CustomTabBar ile aynı: yüzen tab yüksekliği + alt offset (içerik tabın altında kalmaması için) */
const TAB_BAR_HEIGHT = 72;
const TAB_BAR_BOTTOM_MARGIN = 24;
const SERIF = Platform.select<string>({
  ios: 'Georgia',
  android: FontFamily.semiBold, // Android "serif" iOS Georgia'dan fazla sapıyor
  default: 'serif',
});

/**
 * Gerçek bilet siluetini çizen path — yarım daire çentikler kartın
 * kendi şeklinden kesiliyor (HomeScreen'deki FirsatTicketCard ile aynı dil).
 */
const buildTicketPath = (w: number, h: number, r: number, notchY: number, nr: number) => [
  `M ${r} 0`,
  `L ${w - r} 0`,
  `Q ${w} 0 ${w} ${r}`,
  `L ${w} ${notchY - nr}`,
  `A ${nr} ${nr} 0 0 0 ${w} ${notchY + nr}`,
  `L ${w} ${h - r}`,
  `Q ${w} ${h} ${w - r} ${h}`,
  `L ${r} ${h}`,
  `Q 0 ${h} 0 ${h - r}`,
  `L 0 ${notchY + nr}`,
  `A ${nr} ${nr} 0 0 0 0 ${notchY - nr}`,
  `L 0 ${r}`,
  `Q 0 0 ${r} 0`,
  `Z`,
].join(' ');

const TICKET_RADIUS = 20;
const TICKET_NOTCH_RADIUS = 8;

/** Keşfet paletinin soft pastelleri — ticket gövdesi */
const DEAL_ACCENTS = ['#F6E4EA', '#ECF3D8', '#F8F0D0', '#D8F0F0'] as const;

/** Anlaşmalı mekan — bilet siluetli kart (ikili grid) */
function VenueTicketCard({
  item, isFav, onPress, onToggleFav, amber, ctaBg, ctaTxt, isDark, accent,
}: {
  item: DiscountPartner; isFav: boolean; onPress: () => void; onToggleFav: () => void;
  amber: string; ctaBg: string; ctaTxt: string; isDark: boolean;
  accent: string;
}) {
  const { t: tr } = useTranslation();
  const [size, setSize] = useState({ width: 160, height: 210 });
  const [notchY, setNotchY] = useState(96);
  const Icon = item.icon;
  const pctMatch = item.offer.match(/%\s*(\d+)/);
  const discountNum = pctMatch ? pctMatch[1] : null;
  const ink = '#111114';
  const inkMuted = 'rgba(17,17,20,0.62)';

  return (
    <View
      style={styles.ticketWrap}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
        <Path
          d={buildTicketPath(size.width, size.height, TICKET_RADIUS, notchY, TICKET_NOTCH_RADIUS)}
          fill={accent}
          stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(58,42,26,0.28)'}
          strokeWidth={1}
        />
      </Svg>

      <TouchableOpacity
        style={styles.ticketHeartBtn}
        onPress={onToggleFav}
        hitSlop={10}
      >
        <Heart color={isFav ? amber : inkMuted} size={17} strokeWidth={2} fill={isFav ? amber : 'transparent'} />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: size.width }}>
        <View style={styles.ticketCard}>
          <View style={styles.ticketHero}>
            <View style={[styles.ticketIconWrap, { backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: 'rgba(17,17,20,0.18)' }]}>
              <Icon color={ink} size={20} strokeWidth={2} />
            </View>
            {discountNum ? (
              <>
                <Text style={[styles.ticketBigPct, { color: ink }]}>%{discountNum}</Text>
                <Text style={[styles.ticketBigLabel, { color: inkMuted }]}>{tr('home.indirim')}</Text>
              </>
            ) : (
              <Text style={[styles.ticketOfferText, { color: ink }]} numberOfLines={2}>{item.offer}</Text>
            )}
          </View>

          <View style={styles.ticketTearRow} onLayout={(e) => setNotchY(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)}>
            <View style={styles.ticketDashRow}>
              {Array.from({ length: 9 }).map((_, di) => (
                <View key={di} style={[styles.ticketDashSeg, { backgroundColor: 'rgba(17,17,20,0.28)' }]} />
              ))}
            </View>
          </View>

          <Text style={[styles.ticketName, { color: ink }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.ticketKat, { color: inkMuted }]} numberOfLines={1}>{item.category}</Text>
          <View style={[styles.ticketCta, { backgroundColor: ctaBg }]}>
            <Text style={[styles.ticketCtaTxt, { color: ctaTxt }]}>{tr('home.kuponuKullan')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const GencKartScreen = () => {
  const navigation = useNavigation<Nav>();
  const { t: tr, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isDark, pageBg, cardBg, cardBdr, txt1, txt2, ctaBg, ctaTxt, chipBg, accent } = useAppTheme();
  const { mode } = useThemeMode();
  const { isFavoritePartner, toggleFavorite, favoritePartnerIds } = useFavorites();
  const { profile, isGuest } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Tümü');
  const [partners, setPartners] = useState<DiscountPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const isInverse = mode === 'inverse';
  const cardTheme =
    mode === 'light'
      ? GencKartCardTheme.clean
      : mode === 'inverse'
        ? GencKartCardTheme.inverse
        : GencKartCardTheme.editorial;
  const amber = accent;

  useEffect(() => {
    let isMounted = true;
    const fetchFirsatlar = async () => {
      try {
        const { data, error } = await supabase
          .from('firsatlar')
          .select('*')
          .order('created_at', { ascending: false });
        if (!isMounted) return;
        if (!error && data) {
          const mapped: DiscountPartner[] = data.map((row: any) => {
            const name = pickLocalized(row, 'baslik', i18n.language) || row.baslik || '';
            const offer = (pickLocalized(row, 'aciklama', i18n.language) || row.aciklama || '').trim();
            return {
              id: String(row.id),
              name,
              icon: getCategoryIcon(row.kategori, name),
              iconColor: '#111114',
              bgColor: 'transparent',
              offer: offer || row.kategori || '',
              description: offer || row.kategori || '',
              imageUrl: row.resim_url || undefined,
              url: '',
              category: row.kategori || undefined,
            };
          });
          setPartners(mapped);
        }
      } catch (e) {
        if (__DEV__) console.log('Fırsatlar yüklenemedi:', e);
      } finally {
        if (isMounted) setLoadingPartners(false);
      }
    };
    fetchFirsatlar();
    return () => { isMounted = false; };
  }, [i18n.language]);

  const filteredPartners = useMemo(() => {
    if (selectedCategory === 'Tümü') {
      return partners;
    }
    if (selectedCategory === 'Favoriler') {
      return partners.filter(partner => favoritePartnerIds.includes(partner.id));
    }
    return partners.filter(partner => partner.category === selectedCategory);
  }, [selectedCategory, favoritePartnerIds, partners]);

  const renderCategoryChip = useCallback(
    (category: Category) => {
      const active = selectedCategory === category;
      const labelColor = active ? ctaTxt : txt2;
      return (
        <TouchableOpacity
          key={category}
          onPress={() => setSelectedCategory(category)}
          activeOpacity={0.88}
          style={[
            styles.filterChip,
            { backgroundColor: active ? ctaBg : chipBg, borderWidth: 1, borderColor: active ? ctaBg : cardBdr },
          ]}
        >
          <Text style={[styles.filterChipText, { color: labelColor, fontWeight: active ? '900' : '700' }]}>
            {categoryLabel(category, tr)}
          </Text>
        </TouchableOpacity>
      );
    },
    [isDark, selectedCategory, tr]
  );

  const tabBarLift = Math.max(TAB_BAR_BOTTOM_MARGIN, insets.bottom + 8);
  const scrollBottomPadding = tabBarLift + TAB_BAR_HEIGHT + 24;

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      {/* ── HERO — Home ekranındaki sade, düz zeminli başlık dili ── */}
      <View style={[styles.hero, { paddingTop: insets.top + 18, backgroundColor: pageBg }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel,{color:txt2}]}>{tr('gencKart.heroLabel')}</Text>
            <Text style={[styles.heroTitle,{color:txt1}]}>{tr('gencKart.heroTitle')}</Text>
          </View>
          <View style={[styles.heroIconWrap,{backgroundColor:chipBg, borderColor:cardBdr}]}>
            <Wifi color={txt1} size={22} strokeWidth={1.8} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      >

            <View style={[cardOuterShadow, { marginHorizontal: 18, borderRadius: 25, backgroundColor: cardTheme.shadow }]}>
            <ImageBackground
                source={cardTheme.bgImage}
                resizeMode="cover"
                style={[styles.gencKart, { marginHorizontal: 0 }]}
            >
                <View style={styles.cardTop}>
                    <View>
                        <View style={styles.cardLogoContainer}>
                           <MapPin color={Colors.white} size={16}/>
                           <Text style={styles.cardLogoText}>{tr('hizliErisim.eyebrow')}</Text>
                        </View>
                        <Text style={styles.cardAgeText}>16-30 YAŞ</Text>
                    </View>
                    <View style={styles.contactlessContainer}>
                        <Wifi color="rgba(255,255,255,0.85)" size={20} />
                        <View style={[styles.cardYearPill, { borderColor: cardTheme.yearBorder }]}>
                          <Text style={styles.cardYear}>2026</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardBottom}>
                    <View>
                        <Text style={[styles.cardHolderLabel, { color: cardTheme.holderLabel }]}>{tr('gencKart.cardHolder')}</Text>
                        <Text style={styles.cardHolderName}>{(profile?.name || (isGuest ? tr('common.misafir') : MOCK_USER.name)).toUpperCase()}</Text>
                    </View>
                </View>
            </ImageBackground>
            </View>

            {/* Anlaşmalı mekanlar — kartın altı (Genç Kart bloğu yukarıda aynı) */}
            <View style={styles.venuesSection}>
              <View style={styles.venuesSectionTop}>
                <View style={styles.venuesTitleRow}>
                  <Text style={[styles.venuesSectionTitle, {color:txt1}]}>{tr('gencKart.anlasmaliMekanlar')}</Text>
                </View>
                <View style={[styles.venuesCountPill, {backgroundColor:chipBg}]}>
                  <Text style={[styles.venuesCountText, {color:txt1}]}>
                    {filteredPartners.length} fırsat
                  </Text>
                </View>
              </View>
              <Text style={[styles.venuesSubtitle, {color:txt2}]}>
                Genç Kart ile indirim ve ayrıcalıklar
              </Text>
            </View>

            <View style={styles.filterRowFixed}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterScrollContent}
              >
                {CATEGORIES.map((c) => renderCategoryChip(c))}
              </ScrollView>
            </View>

            {loadingPartners ? (
              <View style={styles.emptyFav}>
                <ActivityIndicator size="large" color={txt2} />
              </View>
            ) : selectedCategory === 'Favoriler' && filteredPartners.length === 0 ? (
              <View style={styles.emptyFav}>
                <View style={[styles.emptyFavIcon, { backgroundColor: chipBg }]}>
                  <Heart color={txt2} size={26} strokeWidth={2} />
                </View>
                <Text style={[styles.emptyFavTitle, { color: txt1 }]}>{tr('gencKart.henuzFavorinYok')}</Text>
                <Text style={[styles.emptyFavDesc, { color: txt2 }]}>
                  Beğendiğin mekanların kalbine dokun, buradan kolayca ulaş.
                </Text>
              </View>
            ) : filteredPartners.length === 0 ? (
              <View style={styles.emptyFav}>
                <View style={[styles.emptyFavIcon, { backgroundColor: chipBg }]}>
                  <Tag color={txt2} size={26} strokeWidth={2} />
                </View>
                <Text style={[styles.emptyFavTitle, { color: txt1 }]}>{tr('gencKart.henuzFirsatYok')}</Text>
              </View>
            ) : (
            <View style={styles.venuesGrid}>
                {filteredPartners.map((item, index) => (
                    <AnimatedListItem key={item.id} index={index} delay={60} style={styles.venuesGridItem}>
                        <VenueTicketCard
                          item={item}
                          isFav={isFavoritePartner(item.id)}
                          onPress={() => navigation.navigate('PartnerDetail', { partnerId: item.id })}
                          onToggleFav={() => toggleFavorite('partner', item.id)}
                          amber={amber}
                          ctaBg={ctaBg}
                          ctaTxt={ctaTxt}
                          isDark={isDark}
                          accent={DEAL_ACCENTS[index % DEAL_ACCENTS.length]}
                        />
                    </AnimatedListItem>
                ))}
            </View>
            )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 12,
    borderBottomWidth: 0,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: '500',
    fontFamily: SERIF,
    letterSpacing: -0.35,
    lineHeight: 30,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
  },
  gencKart: {
    borderRadius: 25,
    marginHorizontal: 0,
    padding: 20,
    height: 210,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
  cardGroundHill: {
    position: 'absolute',
    bottom: -20,
    right: -10,
    width: 150,
    height: 46,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  cardWave: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      zIndex: 1,
  },
  cardLogoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  cardLogoText: {
      color: Colors.white,
      fontSize: 19,
      fontWeight: '800',
      letterSpacing: 0.3,
      marginLeft: 6,
  },
  cardAgeText: {
      color: 'rgba(255,255,255,0.65)',
      fontSize: 13,
      fontWeight: '600',
      marginLeft: 22,
      marginTop: 2
  },
  contactlessContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
  },
  cardYearPill: {
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.6)',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 5,
  },
  cardYear: {
      color: Colors.white,
      fontSize: 13,
      fontWeight: '700',
  },
  cardBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      zIndex: 1,
  },
  cardHolderLabel: {
      color: '#9ca3af',
      fontSize: 12,
  },
  cardHolderName: {
      color: Colors.white,
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 2
  },
  cardId: {
      color: '#9ca3af',
      fontSize: 12,
      marginTop: 2
  },
  venuesSection: {
    paddingHorizontal: 18,
    marginTop: 26,
    marginBottom: 6,
  },
  venuesSectionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  venuesTitleRow: {
    flex: 1,
    minWidth: 0,
  },
  venuesSectionTitle: {
    fontFamily: SERIF,
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.35,
  },
  venuesCountPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(58,42,26,0.18)',
  },
  venuesCountText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
  venuesSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  filterRowFixed: {
    height: 52,
    marginBottom: 8,
    flexGrow: 0,
  },
  filterScroll: {
    flexGrow: 0,
    height: 52,
  },
  filterScrollContent: {
    paddingHorizontal: 18,
    alignItems: 'center',
    flexGrow: 0,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 999,
    marginRight: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  filterChipText: {
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
  emptyFav: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 12,
  },
  emptyFavIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyFavTitle: {
    fontFamily: SERIF,
    fontWeight: '500',
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  emptyFavDesc: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  venuesGrid: {
    paddingHorizontal: 18,
    paddingTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  venuesGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  venuesList: {
    paddingHorizontal: 18,
    paddingTop: 8,
    gap: 12,
  },
  venuesListItem: {
    width: '100%',
  },
  dealListCard: {
    minHeight: 96,
    borderRadius: 20,
    borderWidth: 1.2,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#3A2A1A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  dealListHeart: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 4,
  },
  dealListIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(58,42,26,0.14)',
  },
  dealListBody: {
    flex: 1,
    paddingRight: 4,
  },
  dealListName: {
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '500',
    fontFamily: SERIF,
    letterSpacing: -0.2,
  },
  dealListOffer: {
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  dealListCategory: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 5,
  },
  dealListDivider: {
    height: 54,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },
  dealListRight: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 2,
  },
  dealListPct: {
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  dealListPctLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dealListMore: {
    fontSize: 12,
    fontWeight: '900',
  },
  // ── Bilet siluetli mekan kartı ──
  ticketWrap: {
    borderRadius: TICKET_RADIUS,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  ticketHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 4,
  },
  ticketCard: {
    height: 224,
    borderRadius: TICKET_RADIUS,
    paddingHorizontal: 13,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  ticketHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  ticketIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketBigPct: {
    fontSize: 32,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  ticketBigLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: -1,
  },
  ticketOfferText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
    paddingHorizontal: 4,
  },
  ticketTearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
    marginVertical: 10,
    marginHorizontal: -13,
  },
  ticketDashRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
  },
  ticketDashSeg: {
    width: 6,
    height: 2,
    borderRadius: 1,
  },
  ticketName: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: SERIF,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  ticketKat: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    marginTop: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  ticketCta: {
    alignSelf: 'stretch',
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  ticketCtaTxt: {
    fontSize: 11,
    fontWeight: '900',
  },
});

export default GencKartScreen;
