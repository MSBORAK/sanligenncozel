import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { Colors, Gradients } from '@/constants/Colors';
import { MOCK_WEEKEND_PLANS, WeekendPlan } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';

const CulturalRouteScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tam-gün':
        return { bg: '#fef3c7', text: '#f59e0b', label: 'Tam Gün' };
      case 'yarım-gün':
        return { bg: '#e0e7ff', text: '#6366f1', label: 'Yarım Gün' };
      case 'akşam':
        return { bg: '#fce7f3', text: '#ec4899', label: 'Akşam' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: category };
    }
  };

  const renderPlanItem = useCallback(({ item }: { item: WeekendPlan }) => {
    const categoryTheme = getCategoryColor(item.category);
    return (
      <TouchableOpacity
        style={[styles.planCard, isDark && { backgroundColor: Colors.dark.card, borderWidth: 1, borderColor: Colors.dark.border }]}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={[styles.iconContainer, { backgroundColor: categoryTheme.bg }, isDark && { backgroundColor: '#334155' }]}>
              <Calendar color={isDark ? '#cbd5e1' : categoryTheme.text} size={24} />
            </View>
            <View style={styles.titleContainer}>
              <Text style={[styles.planTitle, isDark && { color: '#f8fafc' }]}>{item.title}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.categoryBadge, { backgroundColor: categoryTheme.bg }]}>
                  <Text style={[styles.categoryText, { color: categoryTheme.text }]}>
                    {categoryTheme.label}
                  </Text>
                </View>
                <View style={styles.durationBadge}>
                  <Clock color={isDark ? '#94a3b8' : '#6b7280'} size={12} />
                  <Text style={[styles.durationText, isDark && { color: '#94a3b8' }]}>{item.duration}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.description, isDark && { color: '#94a3b8' }]}>{item.description}</Text>

        <View style={styles.activitiesContainer}>
          <View style={styles.activitiesHeader}>
            <Sparkles color={Colors.primary.indigo} size={16} />
            <Text style={[styles.activitiesTitle, isDark && { color: '#f8fafc' }]}>Aktiviteler</Text>
          </View>
          {item.activities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <CheckCircle2 color={Colors.primary.indigo} size={16} />
              <Text style={[styles.activityText, isDark && { color: '#cbd5e1' }]}>{activity}</Text>
            </View>
          ))}
        </View>

        {item.tips && (
          <View style={[styles.tipsContainer, isDark && { backgroundColor: '#334155' }]}>
            <Text style={[styles.tipsLabel, isDark && { color: '#818cf8' }]}>💡 İpucu</Text>
            <Text style={[styles.tipsText, isDark && { color: '#94a3b8' }]}>{item.tips}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [isDark]);

  return (
    <SafeAreaView
      style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}
      edges={['top']}
    >
      <LinearGradient
        colors={isDark ? Gradients.dark : Gradients.hero}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Gezi Rotaları</Text>
        <Text style={styles.headerSubtitle}>Urfa'da yapılacaklar ve gezi önerileri</Text>
      </LinearGradient>

      <FlatList
        data={MOCK_WEEKEND_PLANS}
        renderItem={renderPlanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={4}
        windowSize={6}
        removeClippedSubviews
      />
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
    paddingTop: 20,
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
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#171717',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
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
    color: Colors.darkGray,
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
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
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
    color: Colors.darkGray,
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
    color: '#6b7280',
    flex: 1,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.indigo,
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary.indigo,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
});

export default CulturalRouteScreen;

