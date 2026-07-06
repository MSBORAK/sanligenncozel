import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar, ImageBackground } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Wifi, Heart } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, DribbbleColors, Clean } from '@/constants/Colors';
import { cardOuterShadow, cardInnerClip } from '@/constants/Shadows';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import { MOCK_USER, MOCK_PARTNERS } from '@/api/mockData';
import { DiscountPartner } from '@/types';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useUser } from '@/context/UserContext';

type Nav = StackNavigationProp<RootStackParamList>;

type Category = 'Tümü' | 'Favoriler' | 'Kafe' | 'Sinema' | 'Giyim';

const CATEGORIES: Category[] = ['Tümü', 'Favoriler', 'Kafe', 'Sinema', 'Giyim'];

/** CustomTabBar ile aynı: yüzen tab yüksekliği + alt offset (içerik tabın altında kalmaması için) */
const TAB_BAR_HEIGHT = 72;
const TAB_BAR_BOTTOM_MARGIN = 24;

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

/** Anlaşmalı mekan — bilet siluetli kart (ikili grid) */
function VenueTicketCard({
  item, isFav, onPress, onToggleFav, cardBg, chipBg, amber, txt1, txt2, ctaBg, ctaTxt, isDark,
}: {
  item: DiscountPartner; isFav: boolean; onPress: () => void; onToggleFav: () => void;
  cardBg: string; chipBg: string; amber: string; txt1: string; txt2: string; ctaBg: string; ctaTxt: string; isDark: boolean;
}) {
  const [size, setSize] = useState({ width: 160, height: 210 });
  const [notchY, setNotchY] = useState(96);
  const Icon = item.icon;
  const pctMatch = item.offer.match(/%\s*(\d+)/);
  const discountNum = pctMatch ? pctMatch[1] : null;

  return (
    <View
      style={styles.ticketWrap}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
        <Path
          d={buildTicketPath(size.width, size.height, TICKET_RADIUS, notchY, TICKET_NOTCH_RADIUS)}
          fill={cardBg}
          stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,20,0.14)'}
          strokeWidth={1.5}
        />
      </Svg>

      <TouchableOpacity
        style={styles.ticketHeartBtn}
        onPress={onToggleFav}
        hitSlop={10}
      >
        <Heart color={isFav ? amber : txt2} size={17} strokeWidth={2} fill={isFav ? amber : 'transparent'} />
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: size.width }}>
        <View style={styles.ticketCard}>
          {/* ÜST: indirim/ikram kahraman — ortalı */}
          <View style={styles.ticketHero}>
            <View style={[styles.ticketIconWrap, { backgroundColor: chipBg }]}>
              <Icon color={txt1} size={20} strokeWidth={2} />
            </View>
            {discountNum ? (
              <>
                <Text style={[styles.ticketBigPct, { color: txt1 }]}>%{discountNum}</Text>
                <Text style={[styles.ticketBigLabel, { color: txt2 }]}>İNDİRİM</Text>
              </>
            ) : (
              <Text style={[styles.ticketOfferText, { color: txt1 }]} numberOfLines={2}>{item.offer}</Text>
            )}
          </View>

          {/* Kesik çizgi — çentik kartın silüetinde */}
          <View style={styles.ticketTearRow} onLayout={(e) => setNotchY(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)}>
            <View style={styles.ticketDashRow}>
              {Array.from({ length: 9 }).map((_, di) => (
                <View key={di} style={[styles.ticketDashSeg, { backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(17,17,20,0.22)' }]} />
              ))}
            </View>
          </View>

          {/* ALT: marka + kategori + CTA */}
          <Text style={[styles.ticketName, { color: txt1 }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.ticketKat, { color: txt2 }]} numberOfLines={1}>{item.category}</Text>
          <View style={[styles.ticketCta, { backgroundColor: ctaBg }]}>
            <Text style={[styles.ticketCtaTxt, { color: ctaTxt }]}>Kuponu Kullan →</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const GencKartScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { isFavoritePartner, toggleFavorite, favoritePartnerIds } = useFavorites();
  const { profile } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Tümü');

  // Home ekranıyla birebir aynı tema (Clean) — mavi/amber Material Design kaldırıldı
  const pageBg  = isDark ? '#0C0C0E' : Clean.bgSoft;
  const cardBg  = isDark ? '#18181B' : Clean.surface;
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : Clean.border;
  const txt1    = isDark ? '#F5F5F7' : Clean.textPrimary;
  const txt2    = isDark ? 'rgba(245,245,247,0.55)' : Clean.textSecondary;
  const ctaBg   = isDark ? '#F5F5F7' : Clean.ctaBg;
  const ctaTxt  = isDark ? '#111114' : Clean.ctaText;
  const chipBg  = isDark ? '#1F1F23' : Clean.chipBg;
  const amber   = Clean.accent;

  const filteredPartners = useMemo(() => {
    if (selectedCategory === 'Tümü') {
      return MOCK_PARTNERS;
    }
    if (selectedCategory === 'Favoriler') {
      return MOCK_PARTNERS.filter(partner => favoritePartnerIds.includes(partner.id));
    }
    return MOCK_PARTNERS.filter(partner => partner.category === selectedCategory);
  }, [selectedCategory, favoritePartnerIds]);

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
            { backgroundColor: active ? ctaBg : chipBg, borderWidth: active ? 0 : 1, borderColor: cardBdr },
          ]}
        >
          <Text style={[styles.filterChipText, { color: labelColor, fontWeight: active ? '700' : '500' }]}>
            {category}
          </Text>
        </TouchableOpacity>
      );
    },
    [isDark, selectedCategory]
  );

  const tabBarLift = Math.max(TAB_BAR_BOTTOM_MARGIN, insets.bottom + 8);
  const scrollBottomPadding = tabBarLift + TAB_BAR_HEIGHT + 24;

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      {/* ── HERO — Home ekranındaki sade, düz zeminli başlık dili ── */}
      <View style={[styles.hero, { paddingTop: insets.top + 18, backgroundColor: pageBg }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel,{color:txt2}]}>ŞANLI GENÇ KART</Text>
            <Text style={[styles.heroTitle,{color:txt1}]}>Şehrin anahtarı{'\n'}cebinde!</Text>
          </View>
          <View style={[styles.heroIconWrap,{backgroundColor:chipBg}]}>
            <Wifi color={txt1} size={22} strokeWidth={1.8} />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
      >

            {/* Genç Kart — arka plan görseli ChatGPT/DALL-E ile üretildi, yazılar üstüne bindiriliyor */}
            <View style={[cardOuterShadow, { marginHorizontal: 20, borderRadius: 25, backgroundColor: '#f59e0b' }]}>
            <ImageBackground
                source={require('@/assets/images/genckart-bg.png')}
                resizeMode="cover"
                style={[styles.gencKart, cardInnerClip, { marginHorizontal: 0 }]}
            >
                <View style={styles.cardTop}>
                    <View>
                        <View style={styles.cardLogoContainer}>
                           <MapPin color={Colors.white} size={16}/>
                           <Text style={styles.cardLogoText}>ŞANLIGENÇ</Text>
                        </View>
                        <Text style={styles.cardAgeText}>16-30 YAŞ</Text>
                    </View>
                    <View style={styles.contactlessContainer}>
                        <Wifi color="rgba(255,255,255,0.85)" size={20} />
                        <View style={styles.cardYearPill}>
                          <Text style={styles.cardYear}>2026</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardBottom}>
                    <View>
                        <Text style={styles.cardHolderLabel}>KART SAHİBİ</Text>
                        <Text style={styles.cardHolderName}>{(profile?.name || MOCK_USER.name).toUpperCase()}</Text>
                    </View>
                </View>
            </ImageBackground>
            </View>

            {/* Anlaşmalı mekanlar — kartın altı (Genç Kart bloğu yukarıda aynı) */}
            <View style={styles.venuesSection}>
              <View style={styles.venuesSectionTop}>
                <View style={styles.venuesTitleRow}>
                  <Text style={[styles.venuesSectionTitle, {color:txt1}]}>Anlaşmalı Mekanlar</Text>
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

            {selectedCategory === 'Favoriler' && filteredPartners.length === 0 ? (
              <View style={styles.emptyFav}>
                <View style={[styles.emptyFavIcon, { backgroundColor: chipBg }]}>
                  <Heart color={txt2} size={26} strokeWidth={2} />
                </View>
                <Text style={[styles.emptyFavTitle, { color: txt1 }]}>Henüz favorin yok</Text>
                <Text style={[styles.emptyFavDesc, { color: txt2 }]}>
                  Beğendiğin mekanların kalbine dokun, buradan kolayca ulaş.
                </Text>
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
                          cardBg={cardBg}
                          chipBg={chipBg}
                          amber={amber}
                          txt1={txt1}
                          txt2={txt2}
                          ctaBg={ctaBg}
                          ctaTxt={ctaTxt}
                          isDark={isDark}
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
    backgroundColor: DribbbleColors.background,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gencKart: {
    borderRadius: 25,
    marginHorizontal: 20,
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
    paddingHorizontal: 20,
    marginTop: 28,
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
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    letterSpacing: -0.35,
  },
  venuesCountPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
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
    paddingHorizontal: 20,
    alignItems: 'center',
    flexGrow: 0,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  filterChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
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
    fontFamily: FontFamily.semiBold,
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
    paddingHorizontal: 20,
    paddingTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  venuesGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  // ── Bilet siluetli mekan kartı ──
  ticketWrap: {
    borderRadius: TICKET_RADIUS,
    backgroundColor: 'transparent',
    ...cardOuterShadow,
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
    borderRadius: 12,
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
    fontWeight: '800',
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
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  ticketKat: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 1,
    marginBottom: 10,
    textAlign: 'center',
  },
  ticketCta: {
    alignSelf: 'stretch',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  ticketCtaTxt: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default GencKartScreen;
