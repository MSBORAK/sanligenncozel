import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, Clock, MapPin, Sparkles, Navigation } from 'lucide-react-native';
import { RootStackParamList } from '@/types/navigation';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { MOCK_WEEKEND_PLANS } from '@/api/mockData';
import { localizeWeekendPlan } from '@/data/mockLocalization';
import { cityFallback } from '@/lib/imageFallback';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W - 32;
const HERO_H = HERO_W * 0.55;
const HERO_RADIUS = 22;

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  'tam-gün': 'culturalRoute.tamGun',
  'yarım-gün': 'culturalRoute.yarimGun',
  'akşam': 'culturalRoute.aksam',
};
const CATEGORY_PASTELS: Record<string, { bg: string; soft: string; strong: string }> = {
  'tam-gün': { bg: '#F8F0D0', soft: 'rgba(248,240,208,0.7)', strong: '#B45309' },
  'yarım-gün': { bg: '#ECF3D8', soft: 'rgba(236,243,216,0.7)', strong: '#15803D' },
  'akşam': { bg: '#F6E4EA', soft: 'rgba(246,228,234,0.72)', strong: '#BE185D' },
};
const EARTH_RADIUS_KM = 6371;
const toRad = (value: number) => (value * Math.PI) / 180;
const distanceKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
};

type Nav = StackNavigationProp<RootStackParamList>;

const CulturalRouteDetailScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const t = useAppTheme();
  const { t: tr, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const cardBorder = t.isDark ? cardBorderDark : cardBorderLight;

  const plan = useMemo(() => {
    const found = MOCK_WEEKEND_PLANS.find((p) => p.id === id);
    return found ? localizeWeekendPlan(found, i18n.language) : found;
  }, [id, i18n.language]);
  const heroSource = useMemo(() => {
    if (plan?.image) {
      return typeof plan.image === 'string' ? { uri: plan.image } : plan.image;
    }
    return { uri: cityFallback(id) };
  }, [plan, id]);

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: t.pageBg, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: t.txt2 }}>{tr('culturalRouteDetail.rotaBulunamadi')}</Text>
      </View>
    );
  }

  const categoryLabel = CATEGORY_LABEL_KEYS[plan.category] ? tr(CATEGORY_LABEL_KEYS[plan.category]) : plan.category;
  const categoryTheme = CATEGORY_PASTELS[plan.category] ?? {
    bg: '#D8F0F0',
    soft: 'rgba(216,240,240,0.72)',
    strong: '#0F766E',
  };
  const segmentDistances = useMemo(() => {
    if (!plan.waypoints || plan.waypoints.length < 2) return [] as number[];
    return plan.waypoints.slice(0, -1).map((point, index) => distanceKm(point, plan.waypoints[index + 1]));
  }, [plan.waypoints]);
  const totalDistanceKm = useMemo(() => {
    if (segmentDistances.length === 0) return 0;
    return segmentDistances.reduce((sum, value) => sum + value, 0);
  }, [segmentDistances]);

  const openDirectionsTo = async (lat: number, lon: number, label: string) => {
    const encodedLabel = encodeURIComponent(label);
    // Özel uygulama şemaları (comgooglemaps:// vb.) Expo Go'da whitelist'e
    // eklenemediği için canOpenURL güvenilir değil (hep false/hata dönebiliyor).
    // Bunun yerine her platformun kendi https universal link'ini doğrudan açıyoruz —
    // bu, ilgili harita uygulaması kuruluysa onu, değilse tarayıcıyı açar.
    const url = Platform.select({
      ios: `https://maps.apple.com/?daddr=${lat},${lon}&q=${encodedLabel}`,
      android: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`,
    })!;
    try {
      await Linking.openURL(url);
    } catch {
      await Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`);
    }
  };

  const openDirections = () => openDirectionsTo(plan.coordinates.lat, plan.coordinates.lon, plan.title);

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
            <Text style={styles.heroTitle} numberOfLines={2}>{plan.title}</Text>
          </View>
          </ImageBackground>
        </View>

        <View style={styles.body}>
          <View style={styles.summaryRow}>
            <View style={[styles.badge, { backgroundColor: categoryTheme.soft }]}>
              <Text style={[styles.badgeText, { color: categoryTheme.strong }]}>{categoryLabel}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: t.chipBg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <Clock color={t.txt2} size={12} />
              <Text style={[styles.badgeText, { color: t.txt2 }]}>{plan.duration}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: t.chipBg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <MapPin color={t.txt2} size={12} />
              <Text style={[styles.badgeText, { color: t.txt2 }]}>{tr('culturalRoute.durakSayisi', { count: plan.activities.length })}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: t.chipBg }]}>
              <Text style={[styles.badgeText, { color: t.txt2 }]}>{Math.max(0.5, totalDistanceKm).toFixed(1)} km</Text>
            </View>
          </View>

          <Text style={[styles.description, { color: t.txt2 }]}>{plan.description}</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={openDirections}
            style={[styles.mapCta, { backgroundColor: t.ctaBg }]}
          >
            <MapPin color={t.ctaTxt} size={16} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapCtaTitle, { color: t.ctaTxt }]}>{tr('culturalRouteDetail.yolTarifiAl')}</Text>
              <Text style={[styles.mapCtaSub, { color: t.ctaTxt }]}>{tr('culturalRouteDetail.haritadaRotayiAc')}</Text>
            </View>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: t.txt1 }]}>{tr('culturalRouteDetail.rota')}</Text>
          <View style={[styles.timelineOuter, cardOuterShadow, cardBorder, { backgroundColor: t.cardBg }]}>
            <View style={[styles.timelineCard, cardInnerClip]}>
              {plan.activities.map((activity, index) => {
                const isLast = index === plan.activities.length - 1;
                return (
                  <View key={index} style={styles.stepRow}>
                    <View style={styles.stepTrack}>
                      <View style={[styles.stepNumberCircle, { backgroundColor: isLast ? categoryTheme.strong : categoryTheme.soft }]}>
                        <Text style={[styles.stepNumberText, { color: isLast ? '#fff' : categoryTheme.strong }]}>{index + 1}</Text>
                      </View>
                      {!isLast && <View style={[styles.stepLine, { backgroundColor: categoryTheme.soft }]} />}
                    </View>
                    <View style={[styles.stepTextWrap, isLast && { paddingBottom: 0 }]}>
                      <View style={styles.stepTextRow}>
                        <Text style={[styles.stepText, { color: t.txt1, flex: 1 }]}>{activity}</Text>
                        {plan.waypoints?.[index] && !plan.waypoints[index].isBreak && (
                          <TouchableOpacity
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            onPress={() =>
                              openDirectionsTo(plan.waypoints[index].lat, plan.waypoints[index].lon, plan.waypoints[index].name)
                            }
                          >
                            <Navigation color={categoryTheme.strong} size={15} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {!!plan.waypoints?.[index]?.note && (
                        <Text style={[styles.stepNote, { color: t.txt2 }]}>{plan.waypoints[index].note}</Text>
                      )}
                      {!isLast && segmentDistances[index] != null && (
                        <Text style={[styles.stepMeta, { color: t.txt2 }]}>
                          {tr('culturalRouteDetail.sonrakiDurak')}: {segmentDistances[index].toFixed(1)} km
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {plan.tips && (
            <View style={[styles.tipsContainer, { backgroundColor: categoryTheme.soft, borderLeftColor: categoryTheme.strong }]}>
              <View style={styles.tipsHeader}>
                <Sparkles color={categoryTheme.strong} size={14} />
                <Text style={[styles.tipsLabel, { color: t.txt1 }]}>{tr('culturalRouteDetail.ipucu')}</Text>
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
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
    marginBottom: 14,
  },
  mapCta: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapCtaTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  mapCtaSub: {
    fontSize: 11.5,
    fontWeight: '600',
    opacity: 0.9,
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
  stepTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  stepNote: {
    marginTop: 3,
    fontSize: 12.5,
    lineHeight: 17,
  },
  stepMeta: {
    marginTop: 4,
    fontSize: 11.5,
    fontWeight: '600',
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
