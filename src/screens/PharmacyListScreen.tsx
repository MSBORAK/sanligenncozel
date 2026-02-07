import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Pill, MapPin, Phone, Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { MOCK_PHARMACIES, Pharmacy } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';

const PharmacyListScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const handleDirections = useCallback((pharmacy: Pharmacy) => {
    // Adres string'i ile yönlendirme (koordinat gerekmez)
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

  const renderPharmacyItem = useCallback(({ item }: { item: Pharmacy }) => (
      <TouchableOpacity
        style={[styles.pharmacyCard, isDark && { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]}
        activeOpacity={0.9}
      >
        <View style={[styles.iconContainer, { backgroundColor: '#fef2f2' }, isDark && { backgroundColor: '#334155' }]}>
          <Pill color={isDark ? '#fca5a5' : '#ef4444'} size={24} />
        </View>
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={[styles.pharmacyName, isDark && { color: '#f8fafc' }]}>{item.name}</Text>
            {item.isOnDuty && (
              <View style={styles.dutyBadge}>
                <Text style={styles.dutyText}>Nöbetçi</Text>
              </View>
            )}
          </View>
          <View style={styles.addressRow}>
            <MapPin color={isDark ? '#94a3b8' : '#6b7280'} size={14} />
            <Text style={[styles.address, isDark && { color: '#94a3b8' }]} numberOfLines={1}>{item.address}</Text>
          </View>
          <View style={styles.distanceRow}>
            <Text style={[styles.distance, isDark && { color: '#818cf8' }]}>{item.distance.toFixed(1)} km</Text>
            <TouchableOpacity
              style={styles.phoneButton}
              onPress={() => handleCall(item.phone)}
              activeOpacity={0.7}
            >
              <Phone color={Colors.primary.indigo} size={16} />
              <Text style={styles.phoneText}>{item.phone}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.directionsButton, isDark && { backgroundColor: '#334155' }]}
          onPress={() => handleDirections(item)}
          activeOpacity={0.9}
        >
          <Navigation color={Colors.primary.indigo} size={20} />
        </TouchableOpacity>
      </TouchableOpacity>
  ), [isDark, handleCall, handleDirections]);

  const nöbetçiCount = useMemo(() => pharmacyData.filter(p => p.isOnDuty).length, [pharmacyData]);

  return (
    <SafeAreaView
      style={[styles.container, isDark && { backgroundColor: '#020617' }]}
      edges={['top']}
    >
      <LinearGradient
        colors={isDark ? ['#020617', '#1f2937'] : [Colors.primary.violet, Colors.primary.indigo]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Nöbetçi Eczaneler</Text>
        <Text style={styles.headerSubtitle}>{nöbetçiCount} nöbetçi eczane bulundu</Text>
      </LinearGradient>

      <FlatList
        data={pharmacyData}
        renderItem={renderPharmacyItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#171717',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginRight: 8,
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
    color: '#ef4444',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.indigo,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneText: {
    fontSize: 12,
    color: Colors.primary.indigo,
    fontWeight: '500',
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default PharmacyListScreen;

