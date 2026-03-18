import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Library, MapPin, Clock, Navigation } from 'lucide-react-native';
import { Colors, Gradients, DribbbleColors } from '@/constants/Colors';
import { MOCK_LIBRARIES, Library as LibraryType } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';

const LibraryListScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const handleDirections = useCallback((library: LibraryType) => {
    // Adres string'i ile yönlendirme (koordinat gerekmez)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(library.address)}`;
    Linking.openURL(url).catch(err => console.error('Yol tarifi açılamadı:', err));
  }, []);

  const renderLibraryItem = useCallback(({ item }: { item: LibraryType }) => (
      <TouchableOpacity
        style={[styles.libraryCard, isDark ? { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border } : { backgroundColor: '#E6F4EA' }]}
        activeOpacity={0.9}
      >
        {!isDark && <LinearGradient colors={['#D9F0E0', '#E6F4EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
        <View style={[styles.iconContainer, !isDark && { backgroundColor: 'rgba(255,255,255,0.6)' }, isDark && { backgroundColor: Colors.dark.border }]}>
          <Library color={isDark ? '#86efac' : '#22c55e'} size={24} />
        </View>
        <View style={styles.infoContainer}>
          <Text style={[styles.libraryName, isDark && { color: '#f8fafc' }]}>{item.name}</Text>
          <View style={styles.addressRow}>
            <MapPin color={isDark ? '#94a3b8' : '#6b7280'} size={14} />
            <Text style={[styles.address, isDark && { color: '#94a3b8' }]} numberOfLines={1}>{item.address}</Text>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Clock color={isDark ? '#94a3b8' : '#6b7280'} size={14} />
              <Text style={[styles.detailText, isDark && { color: '#94a3b8' }]}>{item.workingHours}</Text>
            </View>
            <Text style={[styles.distance, isDark && { color: '#818cf8' }]}>{item.distance.toFixed(1)} km</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.directionsButton, isDark && { backgroundColor: Colors.dark.border }]}
          onPress={() => handleDirections(item)}
          activeOpacity={0.9}
        >
          <Navigation color={Colors.primary.indigo} size={20} />
        </TouchableOpacity>
      </TouchableOpacity>
  ), [isDark, handleDirections]);

  return (
    <SafeAreaView
      style={[styles.container, isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: DribbbleColors.background }]}
      edges={['top']}
    >
      <LinearGradient
        colors={isDark ? Gradients.dark : [DribbbleColors.progressBlue, '#60a5fa']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Kütüphaneler</Text>
        <Text style={styles.headerSubtitle}>{MOCK_LIBRARIES.length} kütüphane bulundu</Text>
      </LinearGradient>

      <FlatList
        data={MOCK_LIBRARIES}
        renderItem={renderLibraryItem}
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
    backgroundColor: DribbbleColors.background,
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
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 15,
    marginBottom: 15,
    shadowColor: '#34d399',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  libraryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
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
    color: '#6b7280',
  },
  distance: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.indigo,
  },
  directionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default LibraryListScreen;

