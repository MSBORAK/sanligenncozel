import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, MapPin, Wifi, Heart } from 'lucide-react-native';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import { MOCK_USER, MOCK_PARTNERS } from '@/api/mockData';
import { DiscountPartner } from '@/types';
import { UrfaIcon_Balik, UrfaIcon_Gobeklitepe, UrfaIcon_Harran } from '@/components/icons/Custom/UrfaIcons';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '@/types/navigation';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useUser } from '@/context/UserContext';
import { BlurView } from 'expo-blur';

type Nav = StackNavigationProp<RootStackParamList>;

type Category = 'Tümü' | 'Kafe' | 'Sinema' | 'Giyim';

const CATEGORIES: Category[] = ['Tümü', 'Kafe', 'Sinema', 'Giyim'];

/** CustomTabBar ile aynı: yüzen tab yüksekliği + alt offset (içerik tabın altında kalmaması için) */
const TAB_BAR_HEIGHT = 72;
const TAB_BAR_BOTTOM_MARGIN = 24;

const GencKartScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { isFavoritePartner, toggleFavorite } = useFavorites();
  const { profile } = useUser();
  const [selectedCategory, setSelectedCategory] = useState<Category>('Tümü');

  const filteredPartners = useMemo(() => {
    if (selectedCategory === 'Tümü') {
      return MOCK_PARTNERS;
    }
    return MOCK_PARTNERS.filter(partner => partner.category === selectedCategory);
  }, [selectedCategory]);

  const renderCategoryChip = useCallback(
    (category: Category) => {
      const active = selectedCategory === category;
      return (
        <TouchableOpacity
          key={category}
          onPress={() => setSelectedCategory(category)}
          activeOpacity={0.88}
          style={[
            styles.filterChip,
            isDark && styles.filterChipDarkOutline,
            !isDark && !active && styles.filterChipInactiveLight,
          ]}
        >
          {active && (
            <LinearGradient
              colors={['#f59e0b', '#fbbf24', '#f59e0b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {!active && isDark && <View style={[StyleSheet.absoluteFill, styles.filterChipInactiveDarkFill]} />}
          {!active && !isDark && (
            <>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={45} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.92)' : '#ffffff',
                    borderRadius: 22,
                  },
                ]}
              />
            </>
          )}
          <Text
            style={[
              styles.filterChipText,
              !active && !isDark && { color: DribbbleColors.textSecondary },
              !active && isDark && { color: '#94a3b8' },
              active && { color: '#ffffff' },
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      );
    },
    [isDark, selectedCategory]
  );

  const renderPartnerItem = (item: DiscountPartner) => {
    const Icon = item.icon;
    const isFav = isFavoritePartner(item.id);
    return (
      <TouchableOpacity
        style={[styles.venueCard, isDark && styles.venueCardDark]}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('PartnerDetail', { partnerId: item.id })}
      >
        <TouchableOpacity
          style={styles.venueHeartBtn}
          onPress={() => toggleFavorite('partner', item.id)}
          hitSlop={10}
        >
          <Heart
            color={isFav ? (isDark ? Colors.dark.accent : Colors.primaryHex) : isDark ? 'rgba(248,250,252,0.45)' : '#94a3b8'}
            size={18}
            strokeWidth={2}
            fill={isFav ? (isDark ? Colors.dark.accent : Colors.primaryHex) : 'transparent'}
          />
        </TouchableOpacity>

        <View style={[styles.venueIconWrap, { backgroundColor: item.bgColor }]}>
          <Icon color={item.iconColor} size={24} strokeWidth={2} />
        </View>

        <View style={styles.venueTextCol}>
          <Text style={[styles.venueName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={[styles.venueOfferPill, isDark && styles.venueOfferPillDark]}>
            <Text style={[styles.venueOfferPillText, isDark && { color: Colors.dark.highlight }]}>{item.offer}</Text>
          </View>
          <Text style={[styles.venueDesc, isDark && { color: '#94a3b8' }]} numberOfLines={2}>
            {item.description}
          </Text>
        </View>

        <ArrowUpRight
          color={isDark ? 'rgba(248,250,252,0.35)' : 'rgba(15,23,42,0.2)'}
          size={20}
          strokeWidth={2.2}
        />
      </TouchableOpacity>
    );
  };

  const tabBarLift = Math.max(TAB_BAR_BOTTOM_MARGIN, insets.bottom + 8);
  const scrollBottomPadding = tabBarLift + TAB_BAR_HEIGHT + 24;

  return (
    <SafeAreaView
      style={[styles.container, isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: DribbbleColors.background }]}
      edges={['top']}
    >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
        >
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Şanlı Genç Kart</Text>
                <Text style={[styles.headerSubtitle, isDark && { color: '#94a3b8' }]}>Şehrin anahtarı cebinde!</Text>
            </View>

            {/* Genç Kart */}
            <LinearGradient
                colors={['#f59e0b', '#fbbf24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gencKart}
            >
                {/* Urfa Pattern Overlay — gece/gündüz aynı amber kart */}
                <View style={styles.patternContainer}>
                    {/* Arka plan büyük elemanlar */}
                    <UrfaIcon_Gobeklitepe color={Colors.white} size={85} opacity={0.45} style={{ position: 'absolute', top: 50, right: 15, transform: [{ rotate: '-15deg' }] }} />
                    <UrfaIcon_Harran color={Colors.white} size={75} opacity={0.4} style={{ position: 'absolute', bottom: 5, left: 10, transform: [{ rotate: '10deg' }] }} />

                    {/* Orta katman elemanlar */}
                    <UrfaIcon_Balik color={Colors.white} size={60} opacity={0.5} style={{ position: 'absolute', top: 15, left: 20, transform: [{ rotate: '25deg' }] }} />
                    <UrfaIcon_Balik color={Colors.white} size={50} opacity={0.45} style={{ position: 'absolute', bottom: 25, right: -10, transform: [{ rotate: '-20deg' }] }} />

                    {/* Küçük dolgu elemanları */}
                    <UrfaIcon_Gobeklitepe color={Colors.white} size={40} opacity={0.35} style={{ position: 'absolute', bottom: 85, left: 95, transform: [{ rotate: '20deg' }] }} />
                    <UrfaIcon_Balik color={Colors.white} size={35} opacity={0.4} style={{ position: 'absolute', top: 10, right: 100, transform: [{ rotate: '-5deg' }] }} />
                    <UrfaIcon_Harran color={Colors.white} size={45} opacity={0.38} style={{ position: 'absolute', bottom: 10, right: 130, transform: [{ rotate: '45deg' }] }} />

                    <UrfaIcon_Harran color={Colors.white} size={35} opacity={0.3} style={{ position: 'absolute', top: 90, left: 15, transform: [{ rotate: '-10deg' }] }} />
                    <UrfaIcon_Balik color={Colors.white} size={25} opacity={0.32} style={{ position: 'absolute', bottom: 60, right: 80, transform: [{ rotate: '30deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={Colors.white} size={30} opacity={0.32} style={{ position: 'absolute', top: 5, left: 120, transform: [{ rotate: '15deg' }] }} />
                    <UrfaIcon_Balik color={Colors.white} size={30} opacity={0.28} style={{ position: 'absolute', top: 120, right: 100, transform: [{ rotate: '-30deg' }] }} />
                    <UrfaIcon_Harran color={Colors.white} size={25} opacity={0.3} style={{ position: 'absolute', top: 140, left: 50, transform: [{ rotate: '15deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={Colors.white} size={20} opacity={0.35} style={{ position: 'absolute', bottom: 5, right: 70, transform: [{ rotate: '-5deg' }] }} />

                    <UrfaIcon_Balik color={Colors.white} size={22} opacity={0.38} style={{ position: 'absolute', top: 80, right: 90, transform: [{ rotate: '180deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={Colors.white} size={28} opacity={0.3} style={{ position: 'absolute', bottom: 60, left: 30, transform: [{ rotate: '-25deg' }] }} />
                    <UrfaIcon_Harran color={Colors.white} size={33} opacity={0.33} style={{ position: 'absolute', top: 40, left: 150, transform: [{ rotate: '35deg' }] }} />

                    <UrfaIcon_Gobeklitepe color={Colors.white} size={25} opacity={0.25} style={{ position: 'absolute', top: 130, left: 140, transform: [{ rotate: '-10deg' }] }} />
                    <UrfaIcon_Balik color={Colors.white} size={20} opacity={0.28} style={{ position: 'absolute', bottom: 45, left: 160, transform: [{ rotate: '10deg' }] }} />
                    <UrfaIcon_Harran color={Colors.white} size={20} opacity={0.3} style={{ position: 'absolute', top: 160, right: 40, transform: [{ rotate: '-40deg' }] }} />
                    <UrfaIcon_Balik color={Colors.white} size={28} opacity={0.35} style={{ position: 'absolute', top: 60, left: 60, transform: [{ rotate: '60deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={Colors.white} size={26} opacity={0.28} style={{ position: 'absolute', bottom: 90, right: 140, transform: [{ rotate: '5deg' }] }} />
                </View>

                <View style={styles.cardTop}>
                    <View>
                        <View style={styles.cardLogoContainer}>
                           <MapPin color={Colors.white} size={16}/>
                           <Text style={styles.cardLogoText}>ŞANLIGENÇ</Text>
                        </View>
                        <Text style={styles.cardAgeText}>◎ 16-30 YAŞ</Text>
                    </View>
                    <View style={styles.contactlessContainer}>
                        <Wifi color="rgba(255,255,255,0.6)" size={24} style={{ transform: [{ rotate: '90deg' }] }} />
                        <Text style={styles.cardYear}>2026</Text>
                    </View>
                </View>

                <View style={styles.cardBottom}>
                    <View>
                        <Text style={styles.cardHolderLabel}>KART SAHİBİ</Text>
                        <Text style={styles.cardHolderName}>{(profile?.name || MOCK_USER.name).toUpperCase()}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Anlaşmalı mekanlar — kartın altı (Genç Kart bloğu yukarıda aynı) */}
            <View style={styles.venuesSection}>
              <View style={styles.venuesSectionTop}>
                <View style={styles.venuesTitleRow}>
                  <Text style={[styles.venuesSectionTitle, isDark && { color: '#f8fafc' }]}>Anlaşmalı Mekanlar</Text>
                  <View style={[styles.venuesAccent, isDark && styles.venuesAccentDark]} />
                </View>
                <View style={styles.venuesCountPill}>
                  <Text style={[styles.venuesCountText, isDark && { color: '#fde68a' }]}>
                    {filteredPartners.length} fırsat
                  </Text>
                </View>
              </View>
              <Text style={[styles.venuesSubtitle, isDark && { color: '#94a3b8' }]}>
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

            <View style={styles.venuesList}>
                {filteredPartners.map((item, index) => (
                    <AnimatedListItem key={item.id} index={index} delay={60}>
                        {renderPartnerItem(item)}
                    </AnimatedListItem>
                ))}
            </View>
        </ScrollView>
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
      paddingTop: 14,
      paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.darkGray,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
      fontSize: 15,
      color: '#92400e',
      marginTop: 3,
      fontWeight: '500',
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
      fontSize: 16,
      fontWeight: 'bold',
      marginLeft: 5,
  },
  cardAgeText: {
      color: '#9ca3af',
      fontSize: 12,
      marginLeft: 22,
      marginTop: 2
  },
  contactlessContainer: {
      alignItems: 'flex-end',
      gap: 5
  },
  cardYear: {
      color: Colors.white,
      backgroundColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: 'hidden',
      fontSize: 12,
      fontWeight: 'bold'
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
    color: DribbbleColors.textPrimary,
  },
  venuesAccent: {
    marginTop: 10,
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(245,158,11,0.55)',
  },
  venuesAccentDark: {
    backgroundColor: 'rgba(251,191,36,0.5)',
  },
  venuesCountPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: 'rgba(245,158,11,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.28)',
  },
  venuesCountText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#b45309',
    letterSpacing: 0.2,
  },
  venuesSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: DribbbleColors.textSecondary,
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
  filterChipDarkOutline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  filterChipInactiveLight: {
    borderWidth: 1,
    borderColor: DribbbleColors.borderLight,
  },
  filterChipInactiveDarkFill: {
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderRadius: 22,
  },
  filterChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    zIndex: 1,
  },
  venuesList: {
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  venueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 14,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.14)',
    shadowColor: '#92400e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  venueCardDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(251,191,36,0.18)',
    shadowOpacity: 0.15,
  },
  venueHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 44,
    zIndex: 2,
    padding: 6,
  },
  venueIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  venueTextCol: {
    flex: 1,
    marginLeft: 14,
    marginRight: 4,
    paddingRight: 6,
  },
  venueName: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    letterSpacing: -0.2,
    color: DribbbleColors.textPrimary,
  },
  venueOfferPill: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.28)',
  },
  venueOfferPillDark: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(251,191,36,0.25)',
  },
  venueOfferPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    color: '#b45309',
  },
  venueDesc: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: DribbbleColors.textSecondary,
    marginTop: 8,
    lineHeight: 17,
  },
});

export default GencKartScreen;
