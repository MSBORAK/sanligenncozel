import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill, MapPin, Phone, Navigation } from 'lucide-react-native';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { MOCK_PHARMACIES, Pharmacy } from '@/api/mockData';
import { useAppTheme } from '@/theme/useAppTheme';

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
  const t = useAppTheme();
  const { isDark, pageBg, cardBg, cardBdr, txt1, txt2, ctaBg, ctaTxt, chipBg, accent: amber } = t;
  const insets = useSafeAreaInsets();
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictFilter>('Tümü');
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

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
    <View style={[styles.pharmacyCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
      <TouchableOpacity
        style={[styles.pharmacyCard, cardInnerClip]}
        activeOpacity={0.9}
      >
        <View style={[styles.iconContainer, { backgroundColor: chipBg }]}>
          <Pill color={txt1} size={24} />
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.pharmacyName, { color: txt1 }]}>{item.name}</Text>
            {item.isOnDuty && (
              <View style={styles.dutyBadge}>
                <Text style={styles.dutyText}>Nöbetçi</Text>
              </View>
            )}
          </View>
          <View style={styles.addressRow}>
            <MapPin color={txt2} size={14} />
            <Text style={[styles.address, { color: txt2 }]} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
          <Text style={[styles.districtText, { color: txt2 }]}>{item.district}</Text>
          <View style={styles.distanceRow}>
            <Text style={[styles.distance, { color: txt1 }]}>{item.distance.toFixed(1)} km</Text>
            <TouchableOpacity style={styles.phoneButton} onPress={() => handleCall(item.phone)} activeOpacity={0.7}>
              <Phone color={txt1} size={16} />
              <Text style={[styles.phoneText, { color: txt1 }]}>{item.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.directionsButton, { backgroundColor: chipBg }]}
          onPress={() => handleDirections(item)}
          activeOpacity={0.9}
        >
          <Navigation color={txt1} size={20} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  ), [cardBg, cardBdr, chipBg, txt1, txt2, amber, handleCall, handleDirections]);

  const nöbetçiCount = useMemo(() => filteredPharmacies.filter(p => p.isOnDuty).length, [filteredPharmacies]);
  const listBottomPad = Math.max(insets.bottom, 20);

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <View style={[styles.header, { backgroundColor: pageBg, paddingTop: insets.top + 18 }]}>
        <Text style={[styles.headerLabel, { color: txt2 }]}>KEŞFET</Text>
        <Text style={[styles.headerTitle, { color: txt1 }]}>Nöbetçi Eczaneler</Text>
        <Text style={[styles.headerSubtitle, { color: txt2 }]}>
          {selectedDistrict === 'Tümü' ? 'Tüm ilçeler' : selectedDistrict} · {nöbetçiCount} nöbetçi eczane
        </Text>
      </View>

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
                    active ? { backgroundColor: ctaBg } : { backgroundColor: chipBg, borderColor: cardBdr, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedDistrict(district)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.filterChipText, { color: active ? ctaTxt : txt2, fontWeight: active ? '700' : '500' }]}>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
  },
  filterRow: {
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterChipText: {
    fontSize: 12,
  },
  pharmacyCardOuter: {
    borderRadius: 20,
    marginBottom: 15,
  },
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#dc2626',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    marginLeft: 4,
    flex: 1,
  },
  districtText: {
    marginTop: -1,
    marginBottom: 6,
    marginLeft: 18,
    fontSize: 11,
    fontWeight: '700',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '500',
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default PharmacyListScreen;
