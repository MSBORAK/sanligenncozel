import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Pill, MapPin, Phone, Navigation } from 'lucide-react-native';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { MOCK_PHARMACIES, Pharmacy } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';

/** Nöbetçi eczaneler — ana sayfa eczane / pembe tonları ile uyumlu */
const PHARM = {
  rose800: '#9f1239',
  rose700: '#be185d',
  rose500: '#ec4899',
  pink100: '#fce7f3',
  pink50: '#fdf2f8',
  red600: '#dc2626',
  red500: '#ef4444',
  iconDark: '#fda4af',
  accentDark: '#fb7185',
} as const;

const DISTRICT_FILTERS = [
  'Tümü',
  'Merkez',
  'Harran',
  'Akçakale',
  'Suruç',
  'Birecik',
  'Bozova',
  'Ceylanpınar',
  'Halfeti',
  'Hilvan',
  'Siverek',
  'Viranşehir',
] as const;

type DistrictFilter = typeof DISTRICT_FILTERS[number];

const PharmacyListScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictFilter>('Tümü');

  const handleDirections = useCallback((pharmacy: Pharmacy) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pharmacy.address)}`;
    Linking.openURL(url).catch(err => console.error('Yol tarifi açılamadı:', err));
  }, []);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(err => console.error('Arama yapılamadı:', err));
  }, []);

  const pharmacyData = useMemo(() => {
    const nöbetçi = MOCK_PHARMACIES.filter(p => p.isOnDuty);
    const diğer = MOCK_PHARMACIES.filter(p => !p.isOnDuty);
    return [...nöbetçi, ...diğer];
  }, []);

  const detectDistrict = useCallback((address: string): DistrictFilter => {
    const value = address.toLocaleLowerCase('tr-TR');
    if (value.includes('harran')) return 'Harran';
    if (value.includes('akçakale') || value.includes('akcakale')) return 'Akçakale';
    if (value.includes('suruç') || value.includes('suruc')) return 'Suruç';
    if (value.includes('birecik')) return 'Birecik';
    if (value.includes('bozova')) return 'Bozova';
    if (value.includes('ceylanpınar') || value.includes('ceylanpinar')) return 'Ceylanpınar';
    if (value.includes('halfeti') || value.includes('halefeti')) return 'Halfeti';
    if (value.includes('hilvan')) return 'Hilvan';
    if (value.includes('siverek')) return 'Siverek';
    if (value.includes('viranşehir') || value.includes('viransehir')) return 'Viranşehir';
    if (value.includes('karaköprü') || value.includes('karakopru') || value.includes('haliliye') || value.includes('eyyübiye') || value.includes('merkez')) {
      return 'Merkez';
    }
    return 'Merkez';
  }, []);

  const pharmacyDataWithDistrict = useMemo(
    () => pharmacyData.map((p) => ({ ...p, district: detectDistrict(p.address) })),
    [pharmacyData, detectDistrict]
  );

  const filteredPharmacies = useMemo(() => {
    if (selectedDistrict === 'Tümü') return pharmacyDataWithDistrict;
    return pharmacyDataWithDistrict.filter((p) => p.district === selectedDistrict);
  }, [pharmacyDataWithDistrict, selectedDistrict]);

  const renderPharmacyItem = useCallback(({ item }: { item: Pharmacy & { district: DistrictFilter } }) => (
    <TouchableOpacity
      style={[
        styles.pharmacyCard,
        isDark
          ? { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border }
          : {
              backgroundColor: DribbbleColors.cardWhite,
              borderWidth: 1,
              borderColor: 'rgba(190, 24, 93, 0.12)',
            },
      ]}
      activeOpacity={0.9}
    >
      <View
        style={[
          styles.iconContainer,
          !isDark && { backgroundColor: PHARM.pink100 },
          isDark && { backgroundColor: 'rgba(251, 113, 133, 0.12)' },
        ]}
      >
        <Pill color={isDark ? PHARM.iconDark : PHARM.red500} size={24} />
      </View>
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.pharmacyName, isDark && { color: '#f8fafc' }]}>{item.name}</Text>
          {item.isOnDuty && (
            <View
              style={[
                styles.dutyBadge,
                isDark && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
              ]}
            >
              <Text style={[styles.dutyText, isDark && { color: PHARM.iconDark }]}>Nöbetçi</Text>
            </View>
          )}
        </View>
        <View style={styles.addressRow}>
          <MapPin color={isDark ? '#94a3b8' : DribbbleColors.textSecondary} size={14} />
          <Text style={[styles.address, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
            {item.address}
          </Text>
        </View>
        <Text style={[styles.districtText, isDark && { color: PHARM.iconDark }]}>{item.district}</Text>
        <View style={styles.distanceRow}>
          <Text style={[styles.distance, isDark && { color: PHARM.accentDark }]}>{item.distance.toFixed(1)} km</Text>
          <TouchableOpacity style={styles.phoneButton} onPress={() => handleCall(item.phone)} activeOpacity={0.7}>
            <Phone color={isDark ? PHARM.iconDark : PHARM.rose700} size={16} />
            <Text style={[styles.phoneText, isDark && { color: PHARM.accentDark }]}>{item.phone}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.directionsButton,
          !isDark && { backgroundColor: PHARM.pink100 },
          isDark && { backgroundColor: 'rgba(251, 113, 133, 0.15)' },
        ]}
        onPress={() => handleDirections(item)}
        activeOpacity={0.9}
      >
        <Navigation color={isDark ? PHARM.iconDark : PHARM.rose700} size={20} />
      </TouchableOpacity>
    </TouchableOpacity>
  ), [isDark, handleCall, handleDirections]);

  const nöbetçiCount = useMemo(() => filteredPharmacies.filter(p => p.isOnDuty).length, [filteredPharmacies]);
  const listBottomPad = Math.max(insets.bottom, 20);

  return (
    <View
      style={[
        styles.container,
        isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: PHARM.pink50 },
      ]}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={isDark ? ['#500724', '#831843'] : [PHARM.rose800, PHARM.rose500]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Nöbetçi Eczaneler</Text>
        <Text style={styles.headerSubtitle}>
          {selectedDistrict === 'Tümü' ? 'Tum ilceler' : selectedDistrict} · {nöbetçiCount} nöbetçi eczane
        </Text>
      </LinearGradient>

      <FlatList
        data={filteredPharmacies}
        renderItem={renderPharmacyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {DISTRICT_FILTERS.map((district) => {
              const active = selectedDistrict === district;
              return (
                <TouchableOpacity
                  key={district}
                  style={[
                    styles.filterChip,
                    active
                      ? (isDark ? styles.filterChipActiveDark : styles.filterChipActive)
                      : (isDark ? styles.filterChipDark : styles.filterChipLight),
                  ]}
                  onPress={() => setSelectedDistrict(district)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      active
                        ? styles.filterChipTextActive
                        : (isDark ? styles.filterChipTextDark : styles.filterChipTextLight),
                    ]}
                  >
                    {district}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PHARM.pink50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  listContent: {
    padding: 20,
  },
  filterRow: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterChipLight: {
    backgroundColor: '#fff',
    borderColor: 'rgba(190, 24, 93, 0.16)',
  },
  filterChipDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(251,113,133,0.24)',
  },
  filterChipActive: {
    backgroundColor: '#fbcfe8',
    borderColor: '#ec4899',
  },
  filterChipActiveDark: {
    backgroundColor: 'rgba(251,113,133,0.22)',
    borderColor: '#fb7185',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextLight: {
    color: '#9f1239',
  },
  filterChipTextDark: {
    color: '#fda4af',
  },
  filterChipTextActive: {
    color: '#831843',
  },
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 15,
    marginBottom: 15,
    shadowColor: Platform.OS === 'android' ? 'transparent' : PHARM.rose800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.08,
    shadowRadius: Platform.OS === 'android' ? 0 : 12,
    elevation: Platform.OS === 'android' ? 0 : 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PHARM.pink100,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DribbbleColors.textPrimary,
    marginRight: 8,
    flexShrink: 1,
  },
  dutyBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dutyText: {
    fontSize: 10,
    fontWeight: '600',
    color: PHARM.red600,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    color: DribbbleColors.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  districtText: {
    marginTop: -1,
    marginBottom: 6,
    marginLeft: 18,
    fontSize: 11,
    fontWeight: '700',
    color: PHARM.rose700,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: PHARM.rose700,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    color: PHARM.rose700,
    fontWeight: '500',
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PHARM.pink100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default PharmacyListScreen;
