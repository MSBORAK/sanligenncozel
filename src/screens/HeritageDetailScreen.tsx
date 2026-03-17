import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { MOCK_MAGAZINES } from '@/api/mockData';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';

type Props = StackScreenProps<RootStackParamList, 'HeritageDetail'>;

const HeritageDetailScreen: React.FC<Props> = ({ route }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { isFavoriteHeritage, toggleFavorite } = useFavorites();
  const { id } = route.params;
  const place = MOCK_MAGAZINES.find(m => m.id === id);

  if (!place) {
    return (
      <SafeAreaView
        style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Keşfet</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.fallbackText}>Bu içerik bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const imageSource = typeof place.image === 'string' ? { uri: place.image } : place.image;

  return (
    <SafeAreaView
      style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}
      edges={['top']}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>{place.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite('heritage', id)} style={styles.favoriteButton} activeOpacity={0.8}>
            <Heart color={isFavoriteHeritage(id) ? Colors.primary.violet : (isDark ? '#94a3b8' : '#6b7280')} size={24} fill={isFavoriteHeritage(id) ? Colors.primary.violet : 'transparent'} />
          </TouchableOpacity>
        </View>

        <View style={styles.imageCard}>
          <Image source={imageSource} style={styles.image} />
        </View>

        <View style={styles.content}>
          {place.description && (
            <Text style={styles.description}>{place.description}</Text>
          )}
        </View>
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
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  favoriteButton: {
    padding: 8,
  },
  imageCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: 220,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  fallbackText: {
    fontSize: 16,
    color: '#6b7280',
  },
});

export default HeritageDetailScreen;

