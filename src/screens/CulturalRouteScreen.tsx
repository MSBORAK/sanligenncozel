import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { MOCK_WEEKEND_PLANS, WeekendPlan } from '@/api/mockData';
import { localizeWeekendPlan } from '@/data/mockLocalization';
import { useAppTheme } from '@/theme/useAppTheme';
import { RootStackParamList } from '@/types/navigation';
import { cityFallback } from '@/lib/imageFallback';
import { useTranslation } from 'react-i18next';

type Nav = StackNavigationProp<RootStackParamList>;

const CATEGORY_KEYS: Record<string, string> = {
  'tam-gün': 'culturalRoute.tamGun',
  'yarım-gün': 'culturalRoute.yarimGun',
  'akşam': 'culturalRoute.aksam',
};
const CATEGORY_PASTELS: Record<string, string> = {
  'tam-gün': '#F8F0D0',
  'yarım-gün': '#ECF3D8',
  'akşam': '#F6E4EA',
};
const ROUTE_DOTS = ['#ECA7B6', '#BEDB7A', '#F2C84B'] as const;

type DurationFilter = 'hepsi' | 'tam-gün' | 'yarım-gün' | 'akşam';

const SERIF = Platform.select<string>({ ios: 'Georgia', android: 'serif', default: 'serif' });

const HEAT_FRIENDLY_HINTS = ['müze', 'akşam', 'kafe', 'kapalı'];
const EARTH_RADIUS_KM = 6371;

const isHeatFriendly = (item: WeekendPlan): boolean => {
  const text = `${item.title} ${item.description} ${item.tips ?? ''}`.toLowerCase();
  return item.category === 'akşam' || HEAT_FRIENDLY_HINTS.some((hint) => text.includes(hint));
};

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
const getRouteDistanceKm = (plan: WeekendPlan) => {
  if (!plan.waypoints || plan.waypoints.length < 2) return 0;
  return plan.waypoints.slice(0, -1).reduce((sum, point, index) => {
    return sum + distanceKm(point, plan.waypoints[index + 1]);
  }, 0);
};

const CulturalRouteScreen = () => {
  const t = useAppTheme();
  const { t: tr, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('hepsi');

  const cardBorder = t.isDark ? cardBorderDark : cardBorderLight;
  const currentHour = new Date().getHours();
  const isHotHours = currentHour >= 11 && currentHour <= 17;

  // isHeatFriendly Türkçe anahtar kelimelerle çalışıyor, bu yüzden çeviriden ÖNCEKİ orijinal metinle hesaplanır
  const filteredPlansOriginal = useMemo(() => {
    return MOCK_WEEKEND_PLANS.filter((item) => {
      if (durationFilter !== 'hepsi' && item.category !== durationFilter) return false;
      return true;
    });
  }, [durationFilter]);

  const filteredPlans = useMemo(
    () => filteredPlansOriginal.map((plan) => localizeWeekendPlan(plan, i18n.language)),
    [filteredPlansOriginal, i18n.language]
  );

  const recommendedPlan = useMemo(() => {
    if (filteredPlansOriginal.length === 0) return null;
    let recommendedId: string;
    if (isHotHours) recommendedId = (filteredPlansOriginal.find((p) => isHeatFriendly(p)) ?? filteredPlansOriginal[0]).id;
    else if (currentHour >= 18) recommendedId = (filteredPlansOriginal.find((p) => p.category === 'akşam') ?? filteredPlansOriginal[0]).id;
    else recommendedId = filteredPlansOriginal[0].id;
    return filteredPlans.find((p) => p.id === recommendedId) ?? filteredPlans[0];
  }, [filteredPlansOriginal, filteredPlans, isHotHours, currentHour]);

  const listBottomPad = Math.max(insets.bottom, 20);

  return (
    <View style={[styles.container, { backgroundColor: t.pageBg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: listBottomPad }}
      >
      <View style={[styles.header, { backgroundColor: t.pageBg, paddingTop: insets.top + 18 }]}>
        <View style={[styles.headerPanel, cardBorder, { backgroundColor: t.cardBg }]}>
          <Text style={[styles.headerLabel, { color: t.txt2 }]}>{tr('pharmacy.kesfet')}</Text>
          <Text style={[styles.headerTitle, { color: t.txt1 }]}>{tr('culturalRoute.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: t.txt2 }]}>{tr('culturalRoute.subtitle')}</Text>
          <View style={styles.headerStatsRow}>
            <View style={[styles.headerStatPill, { backgroundColor: t.chipBg }]}>
              <Text style={[styles.headerStatText, { color: t.txt2 }]}>{tr('culturalRoute.rotaSayisi', { count: filteredPlans.length })}</Text>
            </View>
            {recommendedPlan && (
              <View style={[styles.headerStatPill, { backgroundColor: t.chipBg }]}>
                <Text style={[styles.headerStatText, { color: t.txt2 }]} numberOfLines={1}>
                  {tr('culturalRoute.onerilen')}: {recommendedPlan.title}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={[styles.filterLabel, { color: t.txt2 }]}>{tr('culturalRoute.hizliFiltre')}</Text>
        <View style={styles.filterRow}>
          {(['hepsi', 'tam-gün', 'yarım-gün', 'akşam'] as DurationFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setDurationFilter(f)}
              style={[
                styles.filterChip,
                { backgroundColor: durationFilter === f ? t.ctaBg : t.chipBg },
              ]}
            >
              <Text style={{ color: durationFilter === f ? t.ctaTxt : t.txt2, fontSize: 12, fontWeight: '700' }}>
                {f === 'hepsi' ? tr('gencKart.catAll') : tr(CATEGORY_KEYS[f])}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.listContent}>
        {recommendedPlan && (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CulturalRouteDetail', { id: recommendedPlan.id })}
            style={[styles.recommendCard, cardBorder, { backgroundColor: CATEGORY_PASTELS[recommendedPlan.category] ?? '#D8F0F0' }]}
          >
            <Text style={[styles.recommendLabel, { color: t.txt2 }]}>{tr('culturalRoute.suAnIcinOnerilen')}</Text>
            <Text style={[styles.recommendTitle, { color: t.txt1 }]}>{recommendedPlan.title}</Text>
            <Text style={[styles.recommendSub, { color: t.txt2 }]}>
              {isHotHours ? tr('culturalRoute.sicakSaatlerNotu') : tr('culturalRoute.saatineGoreNotu')}
            </Text>
          </TouchableOpacity>
        )}

        {filteredPlans.length > 0 ? (
          <View style={styles.routeGrid}>
            {filteredPlans.map((item) => {
              const categoryLabel = CATEGORY_KEYS[item.category] ? tr(CATEGORY_KEYS[item.category]) : item.category;
              const imageSource = item.image
                ? (typeof item.image === 'string' ? { uri: item.image } : item.image)
                : { uri: cityFallback(item.id) };
              const totalKm = Math.max(0.5, getRouteDistanceKm(item));
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.88}
                  onPress={() => navigation.navigate('CulturalRouteDetail', { id: item.id })}
                  style={[styles.routeMiniCard, { backgroundColor: t.cardBg, borderColor: t.cardBdr }]}
                >
                  <Image source={imageSource} style={[styles.routeMiniThumb, { borderColor: t.cardBdr }]} resizeMode="cover" />
                  <Text style={[styles.routeMiniTitle, { color: t.txt1 }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.routeMetaRow}>
                    {ROUTE_DOTS.map((dot) => (
                      <View
                        key={dot}
                        style={[styles.routeDot, { backgroundColor: dot, borderColor: t.cardBdr }]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.routeMiniMeta, { color: t.txt2 }]} numberOfLines={1}>
                    {categoryLabel} · {tr('culturalRoute.durakSayisi', { count: item.activities.length })} · {totalKm.toFixed(1)} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.infoNote, cardBorder, { backgroundColor: t.chipBg }]}>
            <Text style={[styles.infoNoteText, { color: t.txt2 }]}>
              {tr('culturalRoute.filtreSonucYok')}
            </Text>
          </View>
        )}

        <View style={[styles.infoNote, cardBorder, { backgroundColor: t.chipBg, marginTop: 12 }]}>
          <Text style={[styles.infoNoteText, { color: t.txt2 }]}>
            {tr('culturalRoute.uyariMetni')}
          </Text>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 8,
  },
  headerPanel: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 4,
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  headerStatPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  headerStatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  filterLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
  },
  recommendCard: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  recommendLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  recommendTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  recommendSub: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  infoNote: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoNoteText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  routeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  routeMiniCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 9,
  },
  routeMiniThumb: {
    width: '100%',
    height: 88,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  routeMiniTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: SERIF,
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 5,
  },
  routeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  routeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 0.8,
  },
  routeMiniMeta: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default CulturalRouteScreen;
