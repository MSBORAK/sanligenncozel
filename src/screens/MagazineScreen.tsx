import React, { useState, useMemo, useCallback, memo } from 'react';
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
import { Heart, Search, ArrowRight, Star } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFavorites } from '@/context/FavoritesContext';
import { cityFallback } from '@/lib/imageFallback';
import { MOCK_MAGAZINES } from '@/api/mockData';
import { localizeHeritageItem } from '@/data/mockLocalization';
import type { HeritageCategory } from '@/types';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W - 40;
const HERO_GAP = 12;
const HERO_IMAGE_H = 196;
const HERO_IMAGE_RADIUS = 28;

type Category = HeritageCategory;

const CATEGORY_LABEL: Record<Category, string> = {
  historic: 'Tarihi Yer',
  faith: 'İnanç ve Kültür',
  nature: 'Doğa & Manzara',
  museum: 'Müze',
  bazaar: 'Tarihi Çarşı',
};

type Nav = StackNavigationProp<RootStackParamList>;

interface FormattedMag {
  id: string;
  title: string;
  description?: string;
  category: Category;
  image: any;
  featured?: boolean;
}

const COLLECTION_META: { key: Category; label: string }[] = [
  { key: 'historic', label: 'Tarihi Yerler' },
  { key: 'faith', label: 'İnanç ve Kültür' },
  { key: 'nature', label: 'Doğa & Manzara' },
  { key: 'museum', label: 'Müzeler' },
  { key: 'bazaar', label: 'Tarihi Çarşılar & Hanlar' },
];

/** Koleksiyon kapak görseli — kategori başlığı için sabit, temsili mekân */
const COLLECTION_COVER_ID: Partial<Record<Category, string>> = {
  historic: 'm1', // Göbeklitepe
};

interface HeroCarouselProps {
  items: FormattedMag[];
  cardBg: string;
  cardBorder: object;
  txt1: string;
  txt2: string;
  chipBg: string;
  ctaBg: string;
  ctaTxt: string;
  isDark: boolean;
  isFavoriteHeritage: (id: string) => boolean;
  toggleFavorite: (type: 'heritage', id: string) => void;
  onPressItem: (id: string) => void;
}

const HeroCarousel = memo(function HeroCarousel({
  items,
  cardBg,
  cardBorder,
  txt1,
  txt2,
  chipBg,
  ctaBg,
  ctaTxt,
  isDark,
  isFavoriteHeritage,
  toggleFavorite,
  onPressItem,
}: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const snapOffsets = useMemo(
    () => items.map((_, i) => i * (HERO_W + HERO_GAP)),
    [items]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: HERO_W + HERO_GAP,
      offset: (HERO_W + HERO_GAP) * index,
      index,
    }),
    []
  );

  const frameBorderColor = isDark ? 'rgba(58,42,26,0.48)' : '#111114';

  return (
    <View style={styles.heroSection}>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        snapToOffsets={snapOffsets}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        contentContainerStyle={{ paddingHorizontal: 20 }}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (HERO_W + HERO_GAP));
          setActiveIndex(Math.min(Math.max(idx, 0), items.length - 1));
        }}
        renderItem={({ item, index }) => {
          const isFav = isFavoriteHeritage(item.id);
          const isLast = index === items.length - 1;
          return (
            <View
              style={[
                styles.heroCardOuter,
                cardBorder,
                { width: HERO_W, backgroundColor: cardBg, marginRight: isLast ? 0 : HERO_GAP },
              ]}
            >
              <TouchableOpacity
                style={styles.heroCard}
                activeOpacity={0.92}
                onPress={() => onPressItem(item.id)}
              >
                <View style={[styles.heroImageFrame, { borderColor: frameBorderColor }]}>
                  <Image
                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.heroHeartBtn}
                    activeOpacity={0.85}
                    onPress={() => toggleFavorite('heritage', item.id)}
                    hitSlop={8}
                  >
                    <Heart
                      color="#111114"
                      size={17}
                      strokeWidth={2.2}
                      fill={isFav ? '#111114' : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.heroBody}>
                  <Text style={[styles.heroCardTitle, { color: txt1 }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.heroCardMeta, { color: txt2 }]} numberOfLines={1}>
                    {CATEGORY_LABEL[item.category]} • Şanlıurfa
                  </Text>
                  <View style={styles.heroFooterRow}>
                    <View style={styles.heroRatingRow}>
                      <Star color="#EAB308" fill="#EAB308" size={14} strokeWidth={0} />
                      <Text style={[styles.heroRatingText, { color: txt1 }]}>Öne çıkan</Text>
                    </View>
                    <View style={[styles.heroCtaCircle, { backgroundColor: ctaBg }]}>
                      <ArrowRight color={ctaTxt} size={20} strokeWidth={2.2} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          );
        }}
      />
      {items.length > 1 && (
        <View style={styles.heroDotsRow}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.heroDot,
                { backgroundColor: i === activeIndex ? '#111114' : chipBg },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const MagazineScreen = () => {
  const navigation = useNavigation<Nav>();
  const { i18n } = useTranslation();
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const { favoriteHeritageIds, isFavoriteHeritage, toggleFavorite } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const { pageBg, cardBg, cardBdr, txt1, txt2, chipBg, accent: amber, isDark } = t;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const formattedMagazines = useMemo(() => {
    // Sadece MOCK_MAGAZINES kullan
    const fromMock: FormattedMag[] = MOCK_MAGAZINES.map((raw) => {
      const m = localizeHeritageItem(raw, i18n.language);
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        category: (m.category as Category) || 'historic',
        image: m.image,
      };
    });
    return fromMock;
  }, [i18n.language]);

  const CURATED_HERO_IDS = ['m1', 'm2', 'm3', 'm4', 'm11'];
  const heroItems = useMemo(() => {
    if (showFavoritesOnly) return [];
    const curated = CURATED_HERO_IDS
      .map((heroId) => formattedMagazines.find((m) => m.id === heroId))
      .filter((m): m is FormattedMag => !!m);
    return curated.length > 0 ? curated : formattedMagazines.slice(0, Math.min(5, formattedMagazines.length));
  }, [formattedMagazines, showFavoritesOnly]);
  const popularItems = useMemo(() => {
    // Sadece favoriler modunda kullanılacak
    if (showFavoritesOnly) return formattedMagazines.filter((m) => favoriteHeritageIds.includes(m.id));
    return [];
  }, [formattedMagazines, showFavoritesOnly, favoriteHeritageIds]);

  const collections = useMemo(() => {
    if (showFavoritesOnly) return [];
    const cols = COLLECTION_META.map((c) => {
      const itemsInCat = formattedMagazines.filter((m) => m.category === c.key);
      const coverId = COLLECTION_COVER_ID[c.key];
      const coverItem = coverId
        ? formattedMagazines.find((m) => m.id === coverId)
        : itemsInCat[0];
      return {
        ...c,
        count: itemsInCat.length,
        image: coverItem?.image ?? itemsInCat[0]?.image ?? cityFallback(c.key),
      };
    }).filter((c) => c.count > 0);
    
    return cols;
  }, [formattedMagazines, showFavoritesOnly]);

  const handleHeroPress = useCallback(
    (id: string) => navigation.push('HeritageDetail', { id }),
    [navigation]
  );

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
                onPress={() => navigation.navigate('GlobalSearch', { filterType: 'heritage' })}
              >
                <Search color={txt1} size={18} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.headerBigTitle, { color: txt1 }]}>Şanlıurfa'yı Keşfet</Text>
          <Text style={[styles.headerSubtitle, { color: txt2 }]}>Tarihi, kültürü ve hikayesiyle kadim şehir.</Text>
        </View>

        {heroItems.length > 0 && (
          <HeroCarousel
            items={heroItems}
            cardBg={cardBg}
            cardBorder={cardBorder}
            txt1={txt1}
            txt2={txt2}
            chipBg={chipBg}
            ctaBg={t.ctaBg}
            ctaTxt={t.ctaTxt}
            isDark={t.isDark}
            isFavoriteHeritage={isFavoriteHeritage}
            toggleFavorite={toggleFavorite}
            onPressItem={handleHeroPress}
          />
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
                    <View style={styles.collectionImageWrap}>
                      <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.collectionImage} resizeMode="cover" />
                    </View>
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
    [pageBg, insets.top, txt1, txt2, chipBg, cardBg, cardBorder, heroItems, collections, popularItems.length, navigation, showFavoritesOnly, isFavoriteHeritage, toggleFavorite, handleHeroPress, t.ctaBg, t.ctaTxt, t.isDark]
  );

  const renderItem: ListRenderItem<FormattedMag> = useCallback(
    ({ item, index }) => {
      const isFav = isFavoriteHeritage(item.id);
      return (
        <AnimatedListItem index={index} delay={40}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.rowOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}
            onPress={() => navigation.push('HeritageDetail', { id: item.id })}
          >
            <View style={[cardInnerClip, { borderRadius: 26 }]}>
              <View style={styles.rowImageWrap}>
                <View style={styles.rowImageClip}>
                  <Image
                    source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                    style={styles.rowImage}
                    resizeMode="cover"
                  />
                </View>
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
                <View style={[styles.rowArrowBtn, { backgroundColor: t.ctaBg }]}>
                  <ArrowRight color={t.ctaTxt} size={17} strokeWidth={2.2} />
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
    if (showFavoritesOnly && popularItems.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: txt2 }]}>Henüz favori mekanınız bulunmuyor.</Text>
        </View>
      );
    }
    return null;
  }, [txt2, showFavoritesOnly, popularItems.length]);

  const bottomPad = Math.max(insets.bottom, 24);

  return (
    <View style={[styles.screen, { backgroundColor: pageBg }]}>
      <FlatList
        data={popularItems}
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
    borderRadius: 24,
  },
  heroCard: {
    width: '100%',
    borderRadius: 24,
    padding: 14,
    paddingBottom: 16,
  },
  heroImageFrame: {
    width: '100%',
    height: HERO_IMAGE_H,
    borderRadius: HERO_IMAGE_RADIUS,
    overflow: 'hidden',
    borderWidth: 1.2,
    position: 'relative',
    backgroundColor: '#F4F4F5',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroHeartBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#111114',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    paddingHorizontal: 2,
    paddingTop: 12,
    gap: 4,
  },
  heroCardTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
  heroCardMeta: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    letterSpacing: -0.1,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  heroRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  heroRatingText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
  },
  heroCtaCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#111114',
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
    overflow: 'hidden',
  },
  collectionImageWrap: {
    width: '100%',
    height: 100,
    overflow: 'hidden',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
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
  rowImageClip: {
    width: '100%',
    height: 168,
    borderRadius: 18,
    overflow: 'hidden',
  },
  rowImage: {
    width: '100%',
    height: '100%',
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
