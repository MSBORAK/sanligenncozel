import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ListRenderItem,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Search, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Clean } from '@/constants/Colors';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';
import { MOCK_MAGAZINES } from '@/api/mockData';
import type { HeritageCategory } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W - 40;

type Nav = StackNavigationProp<RootStackParamList>;
type Category = HeritageCategory;

interface MagazineData {
  id: number;
  baslik: string;
  aciklama?: string;
  kategori?: string;
  resim_url?: string;
}

interface FormattedMag {
  id: string;
  title: string;
  description?: string;
  category: Category;
  image: any;
}

const COLLECTION_META: { key: Category; label: string }[] = [
  { key: 'historic', label: 'Tarihi Yerler' },
  { key: 'faith', label: 'İnanç ve Kültür' },
  { key: 'nature', label: 'Doğa & Manzara' },
  { key: 'museum', label: 'Müzeler' },
  { key: 'bazaar', label: 'Tarihi Çarşılar & Hanlar' },
];

const MagazineScreen = () => {
  const navigation = useNavigation<Nav>();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const { favoriteHeritageIds, isFavoriteHeritage, toggleFavorite } = useFavorites();
  const [magazines, setMagazines] = useState<MagazineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const pageBg  = isDark ? '#0C0C0E' : Clean.bgSoft;
  const cardBg  = isDark ? '#18181B' : Clean.surface;
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : Clean.border;
  const txt1    = isDark ? '#F5F5F7' : Clean.textPrimary;
  const txt2    = isDark ? 'rgba(245,245,247,0.55)' : Clean.textSecondary;
  const chipBg  = isDark ? '#1F1F23' : Clean.chipBg;
  const amber   = Clean.accent;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const fetchMagazines = async () => {
    try {
      const { data, error } = await supabase.from('kesfet').select('*').order('created_at', { ascending: false });
      if (data) setMagazines(data);
      if (error) console.log('Keşfet hatası:', error);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMagazines();
  }, []);

  const formattedMagazines = useMemo(() => {
    const fromSupabase: FormattedMag[] = magazines
      .filter((mag) => !!mag.baslik?.trim() && !mag.aciklama?.includes('düzenle diyerek giriniz'))
      .map((mag) => ({
        id: mag.id.toString(),
        title: mag.baslik,
        description: mag.aciklama,
        category: (mag.kategori as Category) || 'historic',
        image: processImageUrl(mag.resim_url, 'kesfet_resimleri') || cityFallback(mag.id),
      }));
    const fromMock: FormattedMag[] = MOCK_MAGAZINES.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      category: (m.category as Category) || 'historic',
      image: m.image,
    }));
    return [...fromSupabase, ...fromMock];
  }, [magazines]);

  // Kürasyonlu, sabit öne çıkanlar: Göbeklitepe, Balıklıgöl, Urfa Kalesi, Harran, Haleplibahçe Mozaik Müzesi
  const CURATED_HERO_IDS = ['m1', 'm2', 'm3', 'm4', 'm11'];
  const heroItems = useMemo(() => {
    if (showFavoritesOnly) return [];
    const curated = CURATED_HERO_IDS
      .map((id) => formattedMagazines.find((m) => m.id === id))
      .filter((m): m is FormattedMag => !!m);
    return curated.length > 0 ? curated : formattedMagazines.slice(0, Math.min(5, formattedMagazines.length));
  }, [formattedMagazines, showFavoritesOnly]);
  const popularItems = useMemo(() => {
    if (showFavoritesOnly) return formattedMagazines.filter((m) => favoriteHeritageIds.includes(m.id));
    return [];
  }, [formattedMagazines, showFavoritesOnly, favoriteHeritageIds]);

  const collections = useMemo(() => {
    if (showFavoritesOnly) return [];
    return COLLECTION_META.map((c) => {
      const itemsInCat = formattedMagazines.filter((m) => m.category === c.key);
      return { ...c, count: itemsInCat.length, image: itemsInCat[0]?.image ?? cityFallback(c.key) };
    }).filter((c) => c.count > 0);
  }, [formattedMagazines, showFavoritesOnly]);

  const ListHeader = useCallback(
    () => (
      <>
        <View style={[styles.header, { backgroundColor: pageBg, paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.headerTitle, { color: txt1 }]}>Keşfet</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: chipBg }]}
                activeOpacity={0.85}
                onPress={() => setShowFavoritesOnly((v) => !v)}
              >
                <Heart
                  color={txt1}
                  size={18}
                  strokeWidth={2}
                  fill={showFavoritesOnly ? txt1 : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: chipBg }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('GlobalSearch')}
              >
                <Search color={txt1} size={18} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.headerBigTitle, { color: txt1 }]}>Şanlıurfa'yı Keşfet</Text>
          <Text style={[styles.headerSubtitle, { color: txt2 }]}>Tarihi, kültürü ve hikayesiyle kadim şehir.</Text>
        </View>

        {heroItems.length > 0 && (
          <View style={styles.heroSection}>
            <FlatList
              data={heroItems}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              snapToInterval={HERO_W + 12}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 20 }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (HERO_W + 12));
                setHeroIndex(idx);
              }}
              renderItem={({ item }) => (
                <View style={[styles.heroCardOuter, cardOuterShadow, cardBorder, { width: HERO_W, backgroundColor: cardBg }]}>
                  <TouchableOpacity
                    style={[styles.heroCard, cardInnerClip]}
                    activeOpacity={0.92}
                    onPress={() => navigation.navigate('HeritageDetail', { id: item.id })}
                  >
                    <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']}
                      locations={[0, 0.5, 1]}
                      style={StyleSheet.absoluteFillObject}
                      pointerEvents="none"
                    />
                    <View style={styles.heroTextRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.heroCardTitle} numberOfLines={1}>{item.title}</Text>
                        {!!item.description && (
                          <Text style={styles.heroCardDesc} numberOfLines={1}>{item.description}</Text>
                        )}
                      </View>
                      <View style={[styles.heroArrowBtn, { backgroundColor: cardBg }]}>
                        <ArrowRight color={txt1} size={18} strokeWidth={2.2} />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            />
            {heroItems.length > 1 && (
              <View style={styles.heroDotsRow}>
                {heroItems.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.heroDot,
                      { backgroundColor: i === heroIndex ? amber : chipBg },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {collections.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: txt1 }]}>Koleksiyonlar</Text>
            <FlatList
              data={collections}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              renderItem={({ item }) => (
                <View style={[styles.collectionOuter, styles.collectionShadow, cardBorder, { backgroundColor: cardBg }]}>
                  <TouchableOpacity
                    style={[styles.collectionCard, cardInnerClip]}
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('HeritageCollection', { category: item.key })}
                  >
                    <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.collectionImage} resizeMode="cover" />
                    <View style={styles.collectionTextWrap}>
                      <Text style={[styles.collectionLabel, { color: txt1 }]} numberOfLines={1}>{item.label}</Text>
                      <Text style={[styles.collectionCount, { color: txt2 }]}>{item.count} Mekan</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {showFavoritesOnly && popularItems.length > 0 && (
          <View style={[styles.sectionBlock, { marginBottom: 4 }]}>
            <Text style={[styles.sectionTitle, { color: txt1 }]}>Favorilerim</Text>
          </View>
        )}
      </>
    ),
    [pageBg, insets.top, txt1, txt2, chipBg, cardBg, cardBorder, heroItems, heroIndex, amber, collections, popularItems.length, navigation, showFavoritesOnly]
  );

  const renderItem: ListRenderItem<FormattedMag> = useCallback(
    ({ item, index }) => {
      const isFav = isFavoriteHeritage(item.id);
      return (
        <AnimatedListItem index={index} delay={40}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.rowOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}
            onPress={() => navigation.navigate('HeritageDetail', { id: item.id })}
          >
            <View style={[cardInnerClip, { borderRadius: 26 }]}>
              <View style={styles.rowImageWrap}>
                <Image
                  source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                  style={styles.rowImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.rowHeartBtn}
                  onPress={() => toggleFavorite('heritage', item.id)}
                  hitSlop={10}
                >
                  <Heart color="#111114" size={16} strokeWidth={2.2} fill={isFav ? '#111114' : 'transparent'} />
                </TouchableOpacity>
              </View>
              <View style={styles.rowBody}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: txt1 }]} numberOfLines={1}>{item.title}</Text>
                  {!!item.description && (
                    <Text style={[styles.rowDesc, { color: txt2 }]} numberOfLines={2}>{item.description}</Text>
                  )}
                </View>
                <View style={[styles.rowArrowBtn, { backgroundColor: '#111114' }]}>
                  <ArrowRight color="#fff" size={17} strokeWidth={2.2} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </AnimatedListItem>
      );
    },
    [isFavoriteHeritage, navigation, toggleFavorite, cardBg, cardBdr, txt1, txt2, amber]
  );

  const ListEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.skeletonStack}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.rowOuter, styles.skeletonRow, { backgroundColor: cardBg }]}>
              <Skeleton width={64} height={64} borderRadius={12} isDark={isDark} />
              <View style={{ flex: 1, gap: 8, marginLeft: 12 }}>
                <Skeleton width="70%" height={16} borderRadius={6} isDark={isDark} />
                <Skeleton width="90%" height={12} borderRadius={6} isDark={isDark} />
              </View>
            </View>
          ))}
        </View>
      );
    }
    if (!showFavoritesOnly) return null;
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, { color: txt2 }]}>Henüz favori mekanınız bulunmuyor.</Text>
      </View>
    );
  }, [loading, isDark, cardBg, txt2, showFavoritesOnly]);

  const bottomPad = Math.max(insets.bottom, 24);

  return (
    <View style={[styles.screen, { backgroundColor: pageBg }]}>
      <FlatList
        data={loading ? [] : popularItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBigTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 26,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  headerSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  heroSection: {
    marginBottom: 24,
  },
  heroCardOuter: {
    borderRadius: 22,
  },
  heroCard: {
    borderRadius: 22,
    height: 200,
    justifyContent: 'flex-end',
  },
  heroTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
  },
  heroCardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: '#fff',
  },
  heroCardDesc: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
  },
  heroArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  collectionOuter: {
    width: 148,
    borderRadius: 18,
  },
  collectionShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  collectionCard: {
    borderRadius: 18,
  },
  collectionImage: {
    width: '100%',
    height: 100,
  },
  collectionTextWrap: {
    padding: 12,
  },
  collectionLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  collectionCount: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    marginTop: 3,
  },
  rowOuter: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 26,
  },
  rowImageWrap: {
    padding: 10,
  },
  rowImage: {
    width: '100%',
    height: 150,
    borderRadius: 18,
  },
  rowHeartBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    padding: 16,
    paddingTop: 12,
  },
  rowTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  rowDesc: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 4,
  },
  rowArrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeletonStack: {
    gap: 12,
    paddingHorizontal: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 0,
  },
  emptyWrap: {
    minHeight: 200,
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MagazineScreen;
