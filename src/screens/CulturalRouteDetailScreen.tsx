import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, Clock, MapPin, Sparkles } from 'lucide-react-native';
import { RootStackParamList } from '@/types/navigation';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { MOCK_WEEKEND_PLANS } from '@/api/mockData';
import { cityFallback } from '@/lib/imageFallback';
import { useAppTheme } from '@/theme/useAppTheme';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W - 32;
const HERO_H = HERO_W * 0.55;
const HERO_RADIUS = 22;

const CATEGORY_LABELS: Record<string, string> = {
  'tam-gün': 'Tam Gün',
  'yarım-gün': 'Yarım Gün',
  'akşam': 'Akşam',
};

type Nav = StackNavigationProp<RootStackParamList>;

const CulturalRouteDetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const t = useAppTheme();
  const insets = useSafeAreaInsets();

  const cardBorder = t.isDark ? cardBorderDark : cardBorderLight;

  const plan = useMemo(() => MOCK_WEEKEND_PLANS.find((p) => p.id === id), [id]);
  const heroSource = useMemo(() => {
    if (plan?.image) {
      return typeof plan.image === 'string' ? { uri: plan.image } : plan.image;
    }
    return { uri: cityFallback(id) };
  }, [plan, id]);

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: t.pageBg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: t.txt2 }}>Rota bulunamadı.</Text>
      </View>
    );
  }

  const categoryLabel = CATEGORY_LABELS[plan.category] ?? plan.category;

  return (
    <View style={[styles.container, { backgroundColor: t.pageBg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 20 }}>
        <View style={[styles.heroWrap, { marginTop: insets.top + 8 }]}>
          <ImageBackground
            source={heroSource}
            style={styles.heroImageBg}
            imageStyle={styles.heroImageRadius}
            resizeMode="cover"
          >
          <View style={styles.heroOverlay} pointerEvents="none" />
          <TouchableOpacity
            style={[styles.backBtn, { top: 14, backgroundColor: 'rgba(0,0,0,0.4)' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <ArrowLeft color="#fff" size={20} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={styles.heroTextBlock}>
            <Text style={styles.heroTitle}>{plan.title}</Text>
          </View>
          </ImageBackground>
        </View>

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: t.chipBg }]}>
              <Text style={[styles.badgeText, { color: t.txt2 }]}>{categoryLabel}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: t.chipBg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <Clock color={t.txt2} size={12} />
              <Text style={[styles.badgeText, { color: t.txt2 }]}>{plan.duration}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: t.chipBg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <MapPin color={t.txt2} size={12} />
              <Text style={[styles.badgeText, { color: t.txt2 }]}>{plan.activities.length} durak</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: t.txt2 }]}>{plan.description}</Text>

          <Text style={[styles.sectionTitle, { color: t.txt1 }]}>Rota</Text>
          <View style={[styles.timelineOuter, cardOuterShadow, cardBorder, { backgroundColor: t.cardBg }]}>
            <View style={[styles.timelineCard, cardInnerClip]}>
              {plan.activities.map((activity, index) => {
                const isLast = index === plan.activities.length - 1;
                return (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepTrack}>
                      <View style={[styles.stepNumberCircle, { backgroundColor: isLast ? t.accent : t.chipBg }]}>
                        <Text style={[styles.stepNumberText, { color: isLast ? '#fff' : t.txt1 }]}>{index + 1}</Text>
                      </View>
                      {!isLast && <View style={[styles.stepLine, { backgroundColor: t.chipBg }]} />}
                    </View>
                    <View style={[styles.stepTextWrap, isLast && { paddingBottom: 0 }]}>
                      <Text style={[styles.stepText, { color: t.txt1 }]}>{activity}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {plan.tips && (
            <View style={[styles.tipsContainer, { backgroundColor: t.chipBg, borderLeftColor: t.accent }]}>
              <View style={styles.tipsHeader}>
                <Sparkles color={t.accent} size={14} />
                <Text style={[styles.tipsLabel, { color: t.txt1 }]}>İpucu</Text>
              </View>
              <Text style={[styles.tipsText, { color: t.txt2 }]}>{plan.tips}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroWrap: {
    width: HERO_W,
    height: HERO_H,
    alignSelf: 'center',
    borderRadius: HERO_RADIUS,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  heroImageRadius: {
    borderRadius: HERO_RADIUS,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextBlock: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 18,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.4,
    lineHeight: 29,
  },
  body: {
    padding: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  timelineOuter: {
    borderRadius: 20,
    marginBottom: 20,
  },
  timelineCard: {
    borderRadius: 20,
    padding: 18,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepTrack: {
    alignItems: 'center',
    width: 30,
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginVertical: 4,
  },
  stepTextWrap: {
    flex: 1,
    paddingBottom: 20,
    paddingTop: 4,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  tipsContainer: {
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 3,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default CulturalRouteDetailScreen;
