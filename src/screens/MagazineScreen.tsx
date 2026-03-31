import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Heart } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase, processImageUrl } from '@/lib/supabase';

type Nav = StackNavigationProp<RootStackParamList>;
type CatKey = 'all' | 'favorites' | 'historic' | 'museum' | 'nature';

const CATEGORIES: { key: CatKey; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'favorites', label: 'Favorilerim' },
  { key: 'historic', label: 'Tarihi Yerler' },
  { key: 'museum', label: 'Müzeler' },
  { key: 'nature', label: 'Doğa & Parklar' },
];

/** Ana sayfa Keşfet (#1d4ed8 / bentoLightBlue) ile uyumlu */
const KESFET = {
  blue950: '#172554',
  blue900: '#1e3a8a',
  blue800: '#1e40af',
  blue700: '#1d4ed8',
  blue600: '#2563eb',
  blue500: '#3b82f6',
  sky100: '#e0f2fe',
  sky50: '#f0f9ff',
  iconDark: '#93c5fd',
} as const;

const CARD_RADIUS = 20;
const IMAGE_H = 200;

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
  category: 'historic' | 'museum' | 'nature';
  image: string;
}

const categoryLabel: Record<'historic' | 'museum' | 'nature', string> = {
  historic: 'Tarihi',
  museum: 'Müze',
  nature: 'Doğa',
};

const MagazineScreen = () => {
  const navigation = useNavigation<Nav>();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const { favoriteHeritageIds, isFavoriteHeritage, toggleFavorite } = useFavorites();
  const [selectedCategory, setSelectedCategory] = useState<CatKey>('all');
  const [magazines, setMagazines] = useState<MagazineData[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formattedMagazines = useMemo(
    () =>
      magazines.map((mag) => ({
        id: mag.id.toString(),
        title: mag.baslik,
        description: mag.aciklama,
        category: (mag.kategori as 'historic' | 'museum' | 'nature') || 'historic',
        image: processImageUrl(mag.resim_url, 'kesfet_resimleri') || 'https://via.placeholder.com/400x300',
      })),
    [magazines]
  );

  const filteredMagazines = useMemo(() => {
    const baseList =
      selectedCategory === 'all' || selectedCategory === 'favorites'
        ? formattedMagazines
        : formattedMagazines.filter((item) => item.category === selectedCategory);
    if (selectedCategory !== 'favorites') return baseList;
    return baseList.filter((item) => favoriteHeritageIds.includes(item.id));
  }, [selectedCategory, formattedMagazines, favoriteHeritageIds]);

  const renderChip = useCallback(
    (item: (typeof CATEGORIES)[number]) => {
      const active = selectedCategory === item.key;
      return (
        <TouchableOpacity
          onPress={() => setSelectedCategory(item.key)}
          activeOpacity={0.88}
          style={[
            styles.chip,
            isDark && styles.chipDarkBase,
            !isDark && !active && styles.chipInactiveLight,
            isDark && !active && styles.chipInactiveDark,
          ]}
        >
          {!isDark && active && (
            <LinearGradient
              colors={[KESFET.blue800, KESFET.blue500]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {isDark && active && (
            <LinearGradient
              colors={[KESFET.blue900, KESFET.blue600]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          {!isDark && !active && (
            <>
              {Platform.OS === 'ios' ? (
                <BlurView intensity={48} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 22 }]} />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.9)' : '#ffffff',
                    borderRadius: 22,
                  },
                ]}
              />
            </>
          )}
          {isDark && !active && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e293b', borderRadius: 22 }]} />
          )}
          <Text
            style={[
              styles.chipText,
              !isDark && !active && { color: DribbbleColors.textSecondary },
              isDark && !active && { color: '#94a3b8' },
              active && { color: '#ffffff' },
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [isDark, selectedCategory]
  );

  const ListHeader = useCallback(
    () => (
      <>
        <LinearGradient
          colors={isDark ? [KESFET.blue950, KESFET.blue900] : [KESFET.blue800, KESFET.blue500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroTitle}>Keşfet</Text>
            <TouchableOpacity
              onPress={() =>
                setSelectedCategory((prev) => (prev === 'favorites' ? 'all' : 'favorites'))
              }
              activeOpacity={0.85}
              style={[
                styles.favBadgeOuter,
                isDark && styles.favBadgeOuterDark,
                !isDark && { borderColor: 'rgba(29,78,216,0.22)' },
              ]}
            >
              {!isDark && Platform.OS === 'ios' ? (
                <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
              ) : null}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor:
                      !isDark
                        ? Platform.OS === 'ios'
                          ? 'rgba(255,255,255,0.82)'
                          : '#ffffff'
                        : 'rgba(255,255,255,0.08)',
                    borderRadius: 22,
                  },
                ]}
              />
              <Heart
                color={isDark ? '#f8fafc' : DribbbleColors.textPrimary}
                size={18}
                strokeWidth={2}
                fill={selectedCategory === 'favorites' ? KESFET.blue500 : 'transparent'}
              />
              {(favoriteHeritageIds.length > 0 || selectedCategory === 'favorites') && (
                <View style={[styles.favDot, { backgroundColor: isDark ? KESFET.iconDark : KESFET.blue500 }]} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSubtitle}>Şanlıurfa'nın tarihi ve kültürel hazineleri</Text>
        </LinearGradient>

        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, isDark && { color: KESFET.iconDark }]}>Tarihi mirasımız</Text>
            <View style={styles.sectionAccent} />
          </View>
          <View style={styles.chipsRowFixed}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsScroll}
              contentContainerStyle={styles.chipsContent}
            >
              {CATEGORIES.map((c) => (
                <React.Fragment key={c.key}>{renderChip(c)}</React.Fragment>
              ))}
            </ScrollView>
          </View>
        </View>
      </>
    ),
    [favoriteHeritageIds.length, insets.top, isDark, renderChip, selectedCategory]
  );

  const renderItem: ListRenderItem<FormattedMag> = useCallback(
    ({ item, index }) => {
      const isFav = isFavoriteHeritage(item.id);
      const imageSource = { uri: item.image };

      return (
        <AnimatedListItem index={index} delay={60}>
          <TouchableOpacity
            style={[styles.card, isDark && styles.cardDark]}
            activeOpacity={0.92}
            onPress={() => navigation.navigate('HeritageDetail', { id: item.id })}
          >
            <View style={[styles.imageBlock, isDark && styles.imageBlockDark]}>
              <Image source={imageSource} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <LinearGradient
                colors={['rgba(59,130,246,0.2)', 'transparent']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0.2, y: 0.45 }}
                style={styles.blueSheen}
                pointerEvents="none"
              />
              <View style={styles.catPill}>
                <Text style={styles.catPillText}>{categoryLabel[item.category]}</Text>
              </View>
              <TouchableOpacity
                style={styles.heartFab}
                onPress={() => toggleFavorite('heritage', item.id)}
                hitSlop={10}
              >
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
                ) : null}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)',
                    },
                  ]}
                />
                <Heart
                  color={isDark ? '#f8fafc' : DribbbleColors.textPrimary}
                  size={18}
                  strokeWidth={2}
                  fill={isFav ? Colors.primaryHex : 'transparent'}
                />
              </TouchableOpacity>
            </View>

            {isDark ? (
              <View style={styles.infoDark}>
                <Text style={styles.cardTitleDark} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={styles.cardDescDark} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.infoLight}>
                {Platform.OS === 'ios' ? (
                  <BlurView intensity={62} tint="light" style={StyleSheet.absoluteFill} />
                ) : null}
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.82)' : '#ffffff',
                    },
                  ]}
                />
                <View style={styles.infoInner}>
                  <Text style={styles.cardTitleLight} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.description ? (
                    <Text style={styles.cardDescLight} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </TouchableOpacity>
        </AnimatedListItem>
      );
    },
    [isDark, isFavoriteHeritage, navigation, toggleFavorite]
  );

  const ListEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.skeletonStack}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, styles.skeletonCard, isDark && styles.cardDark]}>
              <Skeleton width="100%" height={IMAGE_H} borderRadius={0} isDark={isDark} />
              <View style={{ padding: 16, gap: 8 }}>
                <Skeleton width="70%" height={18} borderRadius={6} isDark={isDark} />
                <Skeleton width="90%" height={14} borderRadius={6} isDark={isDark} />
              </View>
            </View>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, isDark && { color: '#94a3b8' }]}>
          {selectedCategory === 'favorites'
            ? 'Henüz favori keşfet içeriğiniz bulunmuyor.'
            : selectedCategory === 'all'
              ? 'Henüz içerik bulunmuyor.'
              : 'Bu kategoride içerik bulunmuyor.'}
        </Text>
      </View>
    );
  }, [loading, isDark, selectedCategory]);

  const bottomPad = Math.max(insets.bottom, 24);

  return (
    <View style={[styles.screen, isDark && styles.screenDark]}>
      <StatusBar style="light" />
      <FlatList
        data={loading ? [] : filteredMagazines}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomPad }]}
        initialNumToRender={5}
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
    backgroundColor: KESFET.sky50,
  },
  screenDark: {
    backgroundColor: Colors.dark.background,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  heroHeader: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 28,
    letterSpacing: -0.5,
    color: '#ffffff',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favBadgeOuter: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadgeOuterDark: {
    borderColor: 'rgba(255,255,255,0.12)',
  },
  favDot: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  heroSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 6,
    lineHeight: 20,
  },
  sectionBlock: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: KESFET.blue700,
    textTransform: 'uppercase',
  },
  sectionAccent: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(245,158,11,0.45)',
    maxWidth: 56,
  },
  chipsRowFixed: {
    height: 52,
    flexGrow: 0,
  },
  chipsScroll: {
    flexGrow: 0,
    height: 52,
  },
  chipsContent: {
    alignItems: 'center',
    paddingVertical: 4,
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  chipDarkBase: {
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipInactiveLight: {
    borderWidth: 1,
    borderColor: DribbbleColors.borderLight,
  },
  chipInactiveDark: {
    backgroundColor: 'transparent',
  },
  chipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 12,
    zIndex: 1,
  },
  card: {
    marginBottom: 20,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.12)',
    shadowColor: Platform.OS === 'android' ? 'transparent' : KESFET.blue900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.1,
    shadowRadius: Platform.OS === 'android' ? 0 : 20,
    elevation: Platform.OS === 'android' ? 0 : 6,
  },
  cardDark: {
    backgroundColor: Platform.OS === 'android' ? '#111827' : 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  skeletonCard: {
    overflow: 'hidden',
  },
  imageBlock: {
    width: '100%',
    height: IMAGE_H,
    backgroundColor: '#e2e8f0',
    position: 'relative',
  },
  imageBlockDark: {
    backgroundColor: '#1e293b',
  },
  blueSheen: {
    ...StyleSheet.absoluteFillObject,
    borderTopRightRadius: CARD_RADIUS,
  },
  catPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  catPillText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    color: KESFET.blue800,
    letterSpacing: 0.2,
  },
  heartFab: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  infoLight: {
    minHeight: 100,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  infoInner: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    zIndex: 1,
  },
  cardTitleLight: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: DribbbleColors.textPrimary,
    lineHeight: 22,
  },
  cardDescLight: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: DribbbleColors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  infoDark: {
    minHeight: 100,
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  cardTitleDark: {
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
    color: '#f8fafc',
    lineHeight: 22,
  },
  cardDescDark: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 18,
  },
  skeletonStack: {
    gap: 20,
    paddingTop: 4,
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
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MagazineScreen;
