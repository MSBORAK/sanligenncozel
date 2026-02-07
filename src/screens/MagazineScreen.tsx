import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import { MOCK_MAGAZINES } from '@/api/mockData';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase, processImageUrl } from '@/lib/supabase';

type Nav = StackNavigationProp<RootStackParamList>;

// Supabase Magazine Veri Tipi
interface MagazineData {
  id: number;
  baslik: string;
  aciklama?: string;
  kategori?: string;
  resim_url?: string;
}

const MagazineScreen = () => {
  const navigation = useNavigation<Nav>();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { isFavoriteHeritage, toggleFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'historic' | 'museum' | 'nature'>('all');
  const [magazines, setMagazines] = useState<MagazineData[]>([]);
  const [loading, setLoading] = useState(true);

  // Supabase'den keşfet verilerini çek
  const fetchMagazines = async () => {
    try {
      const { data, error } = await supabase
        .from('kesfet')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setMagazines(data);
      if (error) console.log("Keşfet hatası:", error);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagazines();
  }, []);

  // Magazine verisini UI'a uygun formata çevir (useMemo - gereksiz re-map önler)
  const formattedMagazines = useMemo(() => magazines.map((mag) => ({
    id: mag.id.toString(),
    title: mag.baslik,
    description: mag.aciklama,
    category: (mag.kategori as 'historic' | 'museum' | 'nature') || 'historic',
    image: processImageUrl(mag.resim_url, 'kesfet_resimleri') || 'https://via.placeholder.com/400x300',
  })), [magazines]);

  const filteredMagazines = useMemo(
    () =>
      selectedCategory === 'all'
        ? formattedMagazines
        : formattedMagazines.filter((item) => item.category === selectedCategory),
    [selectedCategory, formattedMagazines]
  );

  return (
    <SafeAreaView
      style={[styles.container, isDark && { backgroundColor: '#020617' }]}
      edges={['top']}
    >
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Keşfet</Text>
        </View>

        {/* Tarihi Mirasımız / Şanlıurfa Keşfet */}
        <Text style={styles.sectionTitle}>Tarihi Mirasımız</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <TouchableOpacity
            style={[
                styles.categoryChip, 
                isDark && { backgroundColor: '#334155', borderColor: '#475569' },
                selectedCategory === 'all' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('all')}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.categoryChipText,
                isDark && { color: '#e2e8f0' },
                selectedCategory === 'all' && styles.categoryChipTextActive,
              ]}
            >
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
                styles.categoryChip, 
                isDark && { backgroundColor: '#334155', borderColor: '#475569' },
                selectedCategory === 'historic' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('historic')}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.categoryChipText,
                isDark && { color: '#e2e8f0' },
                selectedCategory === 'historic' && styles.categoryChipTextActive,
              ]}
            >
              Tarihi Yerler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
                styles.categoryChip, 
                isDark && { backgroundColor: '#334155', borderColor: '#475569' },
                selectedCategory === 'museum' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('museum')}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.categoryChipText,
                isDark && { color: '#e2e8f0' },
                selectedCategory === 'museum' && styles.categoryChipTextActive,
              ]}
            >
              Müzeler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
                styles.categoryChip, 
                isDark && { backgroundColor: '#334155', borderColor: '#475569' },
                selectedCategory === 'nature' && styles.categoryChipActive
            ]}
            onPress={() => setSelectedCategory('nature')}
            activeOpacity={0.9}
          >
            <Text
              style={[
                styles.categoryChipText,
                isDark && { color: '#e2e8f0' },
                selectedCategory === 'nature' && styles.categoryChipTextActive,
              ]}
            >
              Doğa &amp; Parklar
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.heritageCard, isDark && { backgroundColor: '#1e293b' }]}>
                <Skeleton width="100%" height="100%" borderRadius={20} isDark={isDark} />
              </View>
            ))}
          </ScrollView>
        ) : filteredMagazines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, isDark && { color: '#94a3b8' }]}>
              {selectedCategory === 'all' ? 'Henüz içerik bulunmuyor.' : 'Bu kategoride içerik bulunmuyor.'}
            </Text>
          </View>
        ) : (
          <FlatList
            horizontal
            data={filteredMagazines}
            renderItem={({ item, index }) => {
              const imageSource = typeof item.image === 'string'
                ? { uri: item.image }
                : item.image;

              const isFav = isFavoriteHeritage(item.id);
              return (
                <AnimatedListItem index={index} delay={70}>
                <TouchableOpacity
                  style={[styles.heritageCard, isDark && { backgroundColor: '#1e293b' }]}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('HeritageDetail', { id: item.id })}
                >
                  <TouchableOpacity
                    style={styles.heritageHeartButton}
                    onPress={(e) => { e.stopPropagation(); toggleFavorite('heritage', item.id); }}
                    activeOpacity={0.8}
                  >
                    <Heart color={isFav ? Colors.primary.violet : 'rgba(255,255,255,0.9)'} size={18} fill={isFav ? Colors.primary.violet : 'transparent'} />
                  </TouchableOpacity>
                  <Image source={imageSource} style={styles.heritageImage} />
                  <View style={styles.heritageOverlay} />
                  <View style={styles.heritageTextContainer}>
                    <Text style={styles.heritageTitle}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
                </AnimatedListItem>
              );
            }}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            initialNumToRender={4}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews
          />
        )}

      </ScrollView>
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
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9ca3af',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  horizontalList: {
    paddingLeft: 20,
  },
  heritageHeartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  heritageCard: {
    width: 220,
    height: 160,
    marginRight: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  heritageImage: {
    width: '100%',
    height: '100%',
  },
  heritageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heritageTextContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
  },
  heritageTitle: {
    fontWeight: '700',
    color: Colors.white,
    fontSize: 16,
  },
  categoryRow: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#f9fafb',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary.indigo,
    borderColor: Colors.primary.indigo,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default MagazineScreen;
