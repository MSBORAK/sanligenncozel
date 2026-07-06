import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Clock, Sparkles } from 'lucide-react-native';
import { Clean } from '@/constants/Colors';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { MOCK_WEEKEND_PLANS, WeekendPlan } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';
import { RootStackParamList } from '@/types/navigation';
import { cityFallback } from '@/lib/imageFallback';

type Nav = StackNavigationProp<RootStackParamList>;

const CATEGORY_LABELS: Record<string, string> = {
  'tam-gün': 'Tam Gün',
  'yarım-gün': 'Yarım Gün',
  'akşam': 'Akşam',
};

const CulturalRouteScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const pageBg  = isDark ? '#0C0C0E' : Clean.bgSoft;
  const cardBg  = isDark ? '#18181B' : Clean.surface;
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : Clean.border;
  const txt1    = isDark ? '#F5F5F7' : Clean.textPrimary;
  const txt2    = isDark ? 'rgba(245,245,247,0.55)' : Clean.textSecondary;
  const chipBg  = isDark ? '#1F1F23' : Clean.chipBg;
  const amber   = Clean.accent;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const renderPlanItem = useCallback(({ item }: { item: WeekendPlan }) => {
    const categoryLabel = CATEGORY_LABELS[item.category] ?? item.category;
    const imageSource = item.image
      ? (typeof item.image === 'string' ? { uri: item.image } : item.image)
      : { uri: cityFallback(item.id) };
    return (
      <View style={[styles.planCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
        <TouchableOpacity
          style={[styles.planCard, cardInnerClip]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('CulturalRouteDetail', { id: item.id })}
        >
          <View style={styles.cardHeader}>
            <View style={styles.titleRow}>
              <Image source={imageSource} style={styles.iconContainer} resizeMode="cover" />
              <View style={styles.titleContainer}>
                <Text style={[styles.planTitle, { color: txt1 }]}>{item.title}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.categoryBadge, { backgroundColor: chipBg }]}>
                    <Text style={[styles.categoryText, { color: txt2 }]}>
                      {categoryLabel}
                    </Text>
                  </View>
                  <View style={[styles.durationBadge, { backgroundColor: chipBg }]}>
                    <Clock color={txt2} size={12} />
                    <Text style={[styles.durationText, { color: txt2 }]}>{item.duration}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.stopCountBadge, { backgroundColor: chipBg }]}>
                <Text style={[styles.stopCountNumber, { color: txt1 }]}>{item.activities.length}</Text>
                <Text style={[styles.stopCountLabel, { color: txt2 }]}>durak</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.description, { color: txt2 }]}>{item.description}</Text>

          <View style={styles.activitiesContainer}>
            <View style={styles.activitiesHeader}>
              <Sparkles color={amber} size={16} />
              <Text style={[styles.activitiesTitle, { color: txt1 }]}>Aktiviteler</Text>
            </View>
            {item.activities.map((activity, index) => {
              const isLast = index === item.activities.length - 1;
              return (
                <View key={index} style={styles.timelineRow}>
                  <View style={styles.timelineTrack}>
                    <View style={[styles.timelineDot, { backgroundColor: amber }]} />
                    {!isLast && <View style={[styles.timelineLine, { backgroundColor: chipBg }]} />}
                  </View>
                  <Text style={[styles.activityText, { color: txt2 }]}>{activity}</Text>
                </View>
              );
            })}
          </View>

          {item.tips && (
            <View style={[styles.tipsContainer, { backgroundColor: chipBg, borderLeftColor: amber }]}>
              <Text style={[styles.tipsLabel, { color: txt1 }]}>İpucu</Text>
              <Text style={[styles.tipsText, { color: txt2 }]}>{item.tips}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [cardBg, cardBdr, chipBg, txt1, txt2, amber, navigation]);

  const listBottomPad = Math.max(insets.bottom, 20);

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <View style={[styles.header, { backgroundColor: pageBg, paddingTop: insets.top + 18 }]}>
        <Text style={[styles.headerLabel, { color: txt2 }]}>KEŞFET</Text>
        <Text style={[styles.headerTitle, { color: txt1 }]}>Gezi Rotaları</Text>
        <Text style={[styles.headerSubtitle, { color: txt2 }]}>Urfa'da yapılacaklar ve gezi önerileri</Text>
      </View>

      <FlatList
        data={MOCK_WEEKEND_PLANS}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={6}
        removeClippedSubviews
        ListHeaderComponent={
          <View style={[styles.infoNote, cardBorder, { backgroundColor: chipBg }]}>
            <Text style={[styles.infoNoteText, { color: txt2 }]}>
              Rotalar öneridir. İşletme/açılış saatleri ve ulaşım bilgilerini gitmeden önce doğrulayın.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
  },
  infoNote: {
    marginBottom: 14,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoNoteText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  planCardOuter: {
    borderRadius: 20,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 20,
    padding: 18,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stopCountBadge: {
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 48,
  },
  stopCountNumber: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stopCountLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: -2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  activitiesContainer: {
    marginBottom: 12,
  },
  activitiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: 4,
  },
  timelineTrack: {
    alignItems: 'center',
    width: 10,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    marginVertical: 2,
  },
  activityText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
    paddingBottom: 12,
  },
  tipsContainer: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 3,
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default CulturalRouteScreen;
