import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Library, MapPin, Clock, Navigation } from 'lucide-react-native';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { MOCK_LIBRARIES, Library as LibraryType } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';

/** Kütüphane ekranı — tek palet (ana sayfadaki mint / kütüphane hızlı erişim ile uyumlu) */
const LIB = {
  green700: '#15803d',
  green500: '#22c55e',
  mint100: '#dcfce7',
  mint50: '#f0fdf4',
  iconLight: '#15803d',
  iconDark: '#86efac',
  accentDark: '#6ee7b7',
} as const;

const LibraryListScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();

  const handleDirections = useCallback((library: LibraryType) => {
    // Adres string'i ile yönlendirme (koordinat gerekmez)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(library.address)}`;
    Linking.openURL(url).catch(err => console.error('Yol tarifi açılamadı:', err));
  }, []);

  const renderLibraryItem = useCallback(({ item }: { item: LibraryType }) => (
      <TouchableOpacity
        style={[
          styles.libraryCard,
          isDark
            ? { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border }
            : {
                backgroundColor: DribbbleColors.cardWhite,
                borderWidth: 1,
                borderColor: 'rgba(22, 101, 52, 0.12)',
              },
        ]}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.iconContainer,
            !isDark && { backgroundColor: LIB.mint100 },
            isDark && { backgroundColor: 'rgba(52, 211, 153, 0.12)' },
          ]}
        >
          <Library color={isDark ? LIB.iconDark : LIB.iconLight} size={24} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.libraryName, isDark && { color: '#f8fafc' }]}>{item.name}</Text>
          <View style={styles.addressRow}>
            <MapPin color={isDark ? '#94a3b8' : '#64748b'} size={14} />
            <Text style={[styles.address, isDark && { color: '#94a3b8' }]} numberOfLines={1}>{item.address}</Text>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Clock color={isDark ? '#94a3b8' : '#64748b'} size={14} />
              <Text style={[styles.detailText, isDark && { color: '#94a3b8' }]}>{item.workingHours}</Text>
            </View>
            <Text style={[styles.distance, isDark && { color: LIB.accentDark }]}>{item.distance.toFixed(1)} km</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.directionsButton,
            !isDark && { backgroundColor: LIB.mint100 },
            isDark && { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
          ]}
          onPress={() => handleDirections(item)}
          activeOpacity={0.9}
        >
          <Navigation color={isDark ? LIB.iconDark : LIB.green700} size={20} />
        </TouchableOpacity>
      </TouchableOpacity>
  ), [isDark, handleDirections]);

  const listBottomPad = Math.max(insets.bottom, 20);

  return (
    <View
      style={[
        styles.container,
        isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: LIB.mint50 },
      ]}
    >
      {/* Durum çubuğu (saat/pil) alanı gradient ile aynı yeşil — SafeAreaView top kullanmıyoruz */}
      <StatusBar style="light" />
      <LinearGradient
        colors={isDark ? ['#052e16', '#064e3b'] : [LIB.green700, LIB.green500]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Kütüphaneler</Text>
        <Text style={styles.headerSubtitle}>{MOCK_LIBRARIES.length} kütüphane bulundu</Text>
      </LinearGradient>

      <FlatList
        data={MOCK_LIBRARIES}
        renderItem={renderLibraryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DribbbleColors.background,
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
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 15,
    marginBottom: 15,
    shadowColor: Platform.OS === 'android' ? 'transparent' : '#15803d',
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
    backgroundColor: LIB.mint100,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  libraryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DribbbleColors.textPrimary,
    marginBottom: 4,
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
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: DribbbleColors.textSecondary,
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: LIB.green700,
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LIB.mint100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default LibraryListScreen;

