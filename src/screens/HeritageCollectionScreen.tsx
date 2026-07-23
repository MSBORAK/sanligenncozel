import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '@/types/navigation';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { useAppTheme } from '@/theme/useAppTheme';
import { MOCK_MAGAZINES } from '@/api/mockData';
import type { HeritageCategory } from '@/types';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_PAD = 20;
const GRID_GAP = 14;
const CARD_W = (SCREEN_W - GRID_PAD * 2 - GRID_GAP) / 2;

const CATEGORY_META_KEYS: Record<HeritageCategory, { titleKey: string; subtitleKey: string }> = {
  historic: { titleKey: 'heritageCollection.historicTitle', subtitleKey: 'heritageCollection.historicSubtitle' },
  faith: { titleKey: 'heritageCollection.faithTitle', subtitleKey: 'heritageCollection.faithSubtitle' },
  nature: { titleKey: 'heritageCollection.natureTitle', subtitleKey: 'heritageCollection.natureSubtitle' },
  museum: { titleKey: 'heritageCollection.museumTitle', subtitleKey: 'heritageCollection.museumSubtitle' },
  bazaar: { titleKey: 'heritageCollection.bazaarTitle', subtitleKey: 'heritageCollection.bazaarSubtitle' },
};

type Nav = StackNavigationProp<RootStackParamList>;

const HeritageCollectionScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { category } = route.params as { category: HeritageCategory };
  const t = useAppTheme();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();

  const cardBorder = t.isDark ? cardBorderDark : cardBorderLight;

  const formatted = useMemo(() => {
    // Sadece MOCK_MAGAZINES kullan
    const fromMock = MOCK_MAGAZINES.filter((m) => m.category === category).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      image: m.image,
    }));
    return fromMock;
  }, [category]);

  const metaKeys = CATEGORY_META_KEYS[category];
  const meta = metaKeys
    ? { title: tr(metaKeys.titleKey), subtitle: tr(metaKeys.subtitleKey) }
    : { title: tr('heritageCollection.defaultTitle'), subtitle: '' };

  return (
    <View style={[styles.container, { backgroundColor: t.pageBg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: t.chipBg }]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <ArrowLeft color={t.txt1} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 20 }}>
        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: t.txt2 }]}>{tr('heritageCollection.eyebrow')}</Text>
          <Text style={[styles.title, { color: t.txt1 }]}>{meta.title}</Text>
          {!!meta.subtitle && <Text style={[styles.subtitle, { color: t.txt2 }]}>{meta.subtitle}</Text>}
          <Text style={[styles.count, { color: t.txt2 }]}>{tr('heritageCollection.mekanSayisi', { count: formatted.length })}</Text>
        </View>

        <View style={styles.grid}>
          {formatted.map((item, index) => (
              <View key={item.id} style={[styles.cardOuter, cardOuterShadow, cardBorder, { width: CARD_W, backgroundColor: t.cardBg }]}>
                <TouchableOpacity
                  style={[styles.card, cardInnerClip]}
                  activeOpacity={0.9}
                  onPress={() => navigation.push('HeritageDetail', { id: item.id })}
                >
                  <View style={[styles.cardImageWrap, { width: CARD_W, height: CARD_W }]}>
                    <Image
                      source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                      style={styles.cardImage}
                      resizeMode="cover"
                    />
                    <View style={[styles.numberBadge, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                      <Text style={styles.numberBadgeText}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: t.txt1 }]} numberOfLines={1}>{item.title}</Text>
                    {!!item.description && (
                      <Text style={[styles.cardDesc, { color: t.txt2 }]} numberOfLines={2}>{item.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  grid: {
    paddingHorizontal: GRID_PAD,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  cardOuter: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  card: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  cardImageWrap: {
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  numberBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  numberBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardInfo: {
    padding: 10,
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
});

export default HeritageCollectionScreen;
