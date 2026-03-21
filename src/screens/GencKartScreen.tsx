import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, MapPin, Wifi, Heart } from 'lucide-react-native';
import { Colors, Gradients, DribbbleColors } from '@/constants/Colors';
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

const GencKartScreen = () => {
  const navigation = useNavigation<Nav>();
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

  const renderPartnerItem = (item: DiscountPartner) => {
    const Icon = item.icon;
    const isFav = isFavoritePartner(item.id);
    return (
        <TouchableOpacity
            style={styles.partnerCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('PartnerDetail', { partnerId: item.id })}
        >
            {/* Glass blur layer */}
            <BlurView
                intensity={isDark ? 55 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            />
            {/* Glass tint overlay */}
            <View style={[
                StyleSheet.absoluteFill,
                styles.partnerCardTint,
                isDark ? styles.partnerCardTintDark : styles.partnerCardTintLight,
            ]} />

            <TouchableOpacity
              style={styles.partnerHeartButton}
              onPress={(e) => { e.stopPropagation(); toggleFavorite('partner', item.id); }}
              activeOpacity={0.8}
            >
              <Heart
                color={isFav ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.2)')}
                size={20}
                fill={isFav ? '#f59e0b' : 'transparent'}
              />
            </TouchableOpacity>

            {/* Icon container — glass pill */}
            <View style={[
                styles.partnerIconContainer,
                isDark ? styles.partnerIconContainerDark : styles.partnerIconContainerLight,
            ]}>
                <Icon
                    color={isDark ? '#f1f5f9' : '#1e293b'}
                    size={26}
                    strokeWidth={1.8}
                />
            </View>

            <View style={styles.partnerInfo}>
                <Text style={[styles.partnerName, isDark && { color: '#f8fafc' }]}>{item.name}</Text>
                <Text style={[styles.partnerOffer, isDark && { color: '#fbbf24' }]}>{item.offer}</Text>
                <Text style={[styles.partnerDesc, isDark && { color: 'rgba(255,255,255,0.45)' }]}>{item.description}</Text>
            </View>

            <ArrowUpRight
                color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}
                size={22}
                strokeWidth={2}
            />
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: DribbbleColors.background }]}
      edges={['top']}
    >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.header}>
                <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Şanlı Genç Kart</Text>
                <Text style={[styles.headerSubtitle, isDark && { color: '#94a3b8' }]}>Şehrin anahtarı cebinde!</Text>
            </View>

            {/* Genç Kart */}
            <LinearGradient
                colors={isDark ? Gradients.hero : ['#f59e0b', '#fbbf24']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gencKart}
            >
                {/* Urfa Pattern Overlay */}
                <View style={styles.patternContainer}>
                    {/* Arka plan büyük elemanlar */}
                    <UrfaIcon_Gobeklitepe color={isDark ? Colors.primaryHex : Colors.white} size={85} opacity={isDark ? 0.15 : 0.45} style={{ position: 'absolute', top: 50, right: 15, transform: [{ rotate: '-15deg' }] }} />
                    <UrfaIcon_Harran color={isDark ? Colors.primaryHex : Colors.white} size={75} opacity={isDark ? 0.12 : 0.4} style={{ position: 'absolute', bottom: 5, left: 10, transform: [{ rotate: '10deg' }] }} />

                    {/* Orta katman elemanlar */}
                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={60} opacity={isDark ? 0.2 : 0.5} style={{ position: 'absolute', top: 15, left: 20, transform: [{ rotate: '25deg' }] }} />
                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={50} opacity={isDark ? 0.18 : 0.45} style={{ position: 'absolute', bottom: 25, right: -10, transform: [{ rotate: '-20deg' }] }} />

                    {/* Küçük dolgu elemanları */}
                    <UrfaIcon_Gobeklitepe color={isDark ? Colors.primaryHex : Colors.white} size={40} opacity={isDark ? 0.1 : 0.35} style={{ position: 'absolute', bottom: 85, left: 95, transform: [{ rotate: '20deg' }] }} />
                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={35} opacity={isDark ? 0.15 : 0.4} style={{ position: 'absolute', top: 10, right: 100, transform: [{ rotate: '-5deg' }] }} />
                    <UrfaIcon_Harran color={isDark ? Colors.primaryHex : Colors.white} size={45} opacity={isDark ? 0.12 : 0.38} style={{ position: 'absolute', bottom: 10, right: 130, transform: [{ rotate: '45deg' }] }} />

                    <UrfaIcon_Harran color={isDark ? Colors.primaryHex : Colors.white} size={35} opacity={isDark ? 0.08 : 0.3} style={{ position: 'absolute', top: 90, left: 15, transform: [{ rotate: '-10deg' }] }} />
                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={25} opacity={isDark ? 0.1 : 0.32} style={{ position: 'absolute', bottom: 60, right: 80, transform: [{ rotate: '30deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={isDark ? Colors.primaryHex : Colors.white} size={30} opacity={isDark ? 0.1 : 0.32} style={{ position: 'absolute', top: 5, left: 120, transform: [{ rotate: '15deg' }] }} />
                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={30} opacity={isDark ? 0.07 : 0.28} style={{ position: 'absolute', top: 120, right: 100, transform: [{ rotate: '-30deg' }] }} />
                    <UrfaIcon_Harran color={isDark ? Colors.primaryHex : Colors.white} size={25} opacity={isDark ? 0.09 : 0.3} style={{ position: 'absolute', top: 140, left: 50, transform: [{ rotate: '15deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={isDark ? Colors.primaryHex : Colors.white} size={20} opacity={isDark ? 0.12 : 0.35} style={{ position: 'absolute', bottom: 5, right: 70, transform: [{ rotate: '-5deg' }] }} />

                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={22} opacity={isDark ? 0.15 : 0.38} style={{ position: 'absolute', top: 80, right: 90, transform: [{ rotate: '180deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={isDark ? Colors.primaryHex : Colors.white} size={28} opacity={isDark ? 0.1 : 0.3} style={{ position: 'absolute', bottom: 60, left: 30, transform: [{ rotate: '-25deg' }] }} />
                    <UrfaIcon_Harran color={isDark ? Colors.primaryHex : Colors.white} size={33} opacity={isDark ? 0.11 : 0.33} style={{ position: 'absolute', top: 40, left: 150, transform: [{ rotate: '35deg' }] }} />

                    <UrfaIcon_Gobeklitepe color={isDark ? Colors.primaryHex : Colors.white} size={25} opacity={isDark ? 0.06 : 0.25} style={{ position: 'absolute', top: 130, left: 140, transform: [{ rotate: '-10deg' }] }} />
                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={20} opacity={isDark ? 0.08 : 0.28} style={{ position: 'absolute', bottom: 45, left: 160, transform: [{ rotate: '10deg' }] }} />
                    <UrfaIcon_Harran color={isDark ? Colors.primaryHex : Colors.white} size={20} opacity={isDark ? 0.1 : 0.3} style={{ position: 'absolute', top: 160, right: 40, transform: [{ rotate: '-40deg' }] }} />
                    <UrfaIcon_Balik color={isDark ? Colors.primaryHex : Colors.white} size={28} opacity={isDark ? 0.12 : 0.35} style={{ position: 'absolute', top: 60, left: 60, transform: [{ rotate: '60deg' }] }} />
                    <UrfaIcon_Gobeklitepe color={isDark ? Colors.primaryHex : Colors.white} size={26} opacity={isDark ? 0.09 : 0.28} style={{ position: 'absolute', bottom: 90, right: 140, transform: [{ rotate: '5deg' }] }} />
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

            {/* Partner List */}
            <View style={styles.listHeader}>
                <Text style={[styles.sectionTitle, isDark && { color: '#f8fafc' }]}>Anlaşmalı Mekanlar</Text>
                <Text style={[styles.firsatCount, isDark && { color: '#94a3b8' }]}>{filteredPartners.length} Fırsat</Text>
            </View>

            {/* Category Filter — Premium Glass Segmented Bar */}
            <View style={styles.chipBarWrapper}>
                <BlurView
                    intensity={35}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.chipBar}
                >
                    <View style={[StyleSheet.absoluteFill, styles.chipBarTint, isDark ? styles.chipBarTintDark : styles.chipBarTintLight]} />
                    {CATEGORIES.map((category) => {
                        const isSelected = selectedCategory === category;
                        return (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.chip,
                                    isDark
                                        ? (isSelected ? styles.chipActiveDark : styles.chipInactiveDark)
                                        : (isSelected ? styles.chipActiveLight : styles.chipInactiveLight),
                                ]}
                                onPress={() => setSelectedCategory(category)}
                                activeOpacity={0.75}
                            >
                                <Text style={[
                                    styles.chipText,
                                    isSelected ? styles.chipTextActive : (isDark ? { color: '#94a3b8' } : { color: '#78716c' }),
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </BlurView>
            </View>

            <View style={styles.listContainer}>
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
  listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginTop: 32,
      marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1917',
    letterSpacing: -0.3,
  },
  firsatCount: {
      color: '#92400e',
      fontWeight: '700',
      fontSize: 13,
      backgroundColor: 'rgba(245,158,11,0.15)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  partnerHeartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 6,
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 6,
  },
  partnerCardTint: {
    borderRadius: 24,
  },
  partnerCardTintLight: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  partnerCardTintDark: {
    backgroundColor: 'rgba(15,26,46,0.55)',
  },
  partnerIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  partnerIconContainerLight: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,1)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  partnerIconContainerDark: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  partnerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1c1917',
    letterSpacing: -0.3,
  },
  partnerOffer: {
    color: '#b45309',
    fontWeight: '800',
    fontSize: 15,
    marginTop: 3,
  },
  partnerDesc: {
    color: '#78716c',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  // Glass Segmented Bar
  chipBarWrapper: {
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  chipBar: {
    flexDirection: 'row',
    padding: 5,
    borderRadius: 28,
    overflow: 'hidden',
  },
  chipBarTint: {
    borderRadius: 28,
  },
  chipBarTintLight: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  chipBarTintDark: {
    backgroundColor: 'rgba(15,26,46,0.5)',
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipActiveLight: {
    backgroundColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
  chipInactiveLight: {
    backgroundColor: 'transparent',
  },
  chipActiveDark: {
    backgroundColor: Colors.primary.indigo,
    shadowColor: Colors.primary.indigo,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  chipInactiveDark: {
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
    textAlign: 'center',
  },
  chipTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
});

export default GencKartScreen;
