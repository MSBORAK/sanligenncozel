import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { MOCK_WEEKEND_PLANS, WeekendPlan } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';

/** Gezi rotası — ana sayfa “Gezi Rotası” (#6d28d9 / lavanta) ile uyumlu tek palet */
const ROUTE = {
  violet800: '#5b21b6',
  violet700: '#6d28d9',
  violet600: '#7c3aed',
  violet500: '#8b5cf6',
  lavender200: '#ddd6fe',
  lavender100: '#ede9fe',
  lavender50: '#f5f3ff',
  iconDark: '#c4b5fd',
  accentDark: '#a78bfa',
} as const;

const CulturalRouteScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tam-gün':
        return { bg: ROUTE.lavender100, text: ROUTE.violet800, label: 'Tam Gün' };
      case 'yarım-gün':
        return { bg: ROUTE.lavender200, text: ROUTE.violet700, label: 'Yarım Gün' };
      case 'akşam':
        return { bg: '#e9d5ff', text: ROUTE.violet600, label: 'Akşam' };
      default:
        return { bg: ROUTE.lavender100, text: ROUTE.violet700, label: category };
    }
  };

  const renderPlanItem = useCallback(({ item }: { item: WeekendPlan }) => {
    const categoryTheme = getCategoryColor(item.category);
    return (
      <TouchableOpacity
        style={[
          styles.planCard,
          isDark
            ? { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border }
            : {
                backgroundColor: DribbbleColors.cardWhite,
                borderWidth: 1,
                borderColor: 'rgba(109, 40, 217, 0.12)',
              },
        ]}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: categoryTheme.bg },
                isDark && { backgroundColor: 'rgba(167, 139, 250, 0.15)' },
              ]}
            >
              <Calendar color={isDark ? ROUTE.iconDark : categoryTheme.text} size={24} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.planTitle, isDark && { color: '#f8fafc' }]}>{item.title}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryTheme.bg }]}>
                  <Text style={[styles.categoryText, { color: categoryTheme.text }]}>
                    {categoryTheme.label}
                  </Text>
                </View>
                <View
                  style={[
                    styles.durationBadge,
                    !isDark && { backgroundColor: ROUTE.lavender50 },
                    isDark && { backgroundColor: 'rgba(255,255,255,0.06)' },
                  ]}
                >
                  <Clock color={isDark ? '#94a3b8' : DribbbleColors.textSecondary} size={12} />
                  <Text style={[styles.durationText, isDark && { color: '#94a3b8' }]}>{item.duration}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.description, isDark && { color: '#94a3b8' }]}>{item.description}</Text>

        <View style={styles.activitiesContainer}>
          <View style={styles.activitiesHeader}>
            <Sparkles color={isDark ? ROUTE.iconDark : ROUTE.violet700} size={16} />
            <Text style={[styles.activitiesTitle, isDark && { color: '#f8fafc' }]}>Aktiviteler</Text>
          </View>
          {item.activities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <CheckCircle2 color={isDark ? ROUTE.accentDark : ROUTE.violet600} size={16} />
              <Text style={[styles.activityText, isDark && { color: '#cbd5e1' }]}>{activity}</Text>
            </View>
          ))}
        </View>

        {item.tips && (
          <View
            style={[
              styles.tipsContainer,
              !isDark && { backgroundColor: ROUTE.lavender50, borderLeftColor: ROUTE.violet600 },
              isDark && { backgroundColor: 'rgba(167, 139, 250, 0.12)', borderLeftColor: ROUTE.accentDark },
            ]}
          >
            <Text style={[styles.tipsLabel, isDark && { color: ROUTE.accentDark }]}>İpucu</Text>
            <Text style={[styles.tipsText, isDark && { color: '#94a3b8' }]}>{item.tips}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [isDark]);

  const listBottomPad = Math.max(insets.bottom, 20);

  return (
    <View
      style={[
        styles.container,
        isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: ROUTE.lavender50 },
      ]}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={isDark ? ['#3b0764', '#5b21b6'] : [ROUTE.violet800, ROUTE.violet500]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Gezi Rotaları</Text>
        <Text style={styles.headerSubtitle}>Urfa'da yapılacaklar ve gezi onerileri</Text>
      </LinearGradient>

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
          <View style={[styles.infoNote, isDark ? styles.infoNoteDark : null]}>
            <Text style={[styles.infoNoteText, isDark ? styles.infoNoteTextDark : null]}>
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
    backgroundColor: ROUTE.lavender50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  listContent: {
    padding: 20,
  },
  infoNote: {
    marginBottom: 14,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ede9fe',
    borderWidth: 1,
    borderColor: 'rgba(109,40,217,0.18)',
  },
  infoNoteDark: {
    backgroundColor: 'rgba(124,58,237,0.14)',
    borderColor: 'rgba(167,139,250,0.28)',
  },
  infoNoteText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#5b21b6',
    fontWeight: '600',
  },
  infoNoteTextDark: {
    color: '#c4b5fd',
  },
  planCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: Platform.OS === 'android' ? 'transparent' : ROUTE.violet800,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.08,
    shadowRadius: Platform.OS === 'android' ? 0 : 12,
    elevation: Platform.OS === 'android' ? 0 : 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    color: DribbbleColors.textPrimary,
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
    color: DribbbleColors.textSecondary,
  },
  description: {
    fontSize: 14,
    color: DribbbleColors.textSecondary,
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
    color: DribbbleColors.textPrimary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingLeft: 4,
  },
  activityText: {
    fontSize: 13,
    color: DribbbleColors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  tipsContainer: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: ROUTE.violet600,
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ROUTE.violet700,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: DribbbleColors.textSecondary,
    lineHeight: 18,
  },
});

export default CulturalRouteScreen;
