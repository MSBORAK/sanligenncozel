import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, TicketPercent, CalendarDays } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { MOCK_NOTIFICATIONS } from '@/api/mockData';
import type { NotificationItem } from '@/types';
import { useThemeMode } from '@/context/ThemeContext';

const getIconForType = (type: NotificationItem['type']) => {
  switch (type) {
    case 'discount':
      return <TicketPercent size={22} color={Colors.primary.indigo} />;
    case 'event':
    default:
      return <CalendarDays size={22} color={Colors.primary.indigo} />;
  }
};

const NotificationsScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  return (
    <SafeAreaView
      style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}
      edges={['top']}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirimler</Text>
        <View style={styles.headerIcon}>
          <Bell size={20} color={Colors.primary.indigo} />
        </View>
      </View>

      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={6}
        windowSize={8}
        removeClippedSubviews
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.card, !item.isRead && styles.unreadCard]}
          >
            <View style={styles.iconWrapper}>{getIconForType(item.type)}</View>
            <View style={styles.textWrapper}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.date}>{item.createdAt}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Bell size={40} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Henüz bildirimin yok</Text>
            <Text style={styles.emptyText}>
              Yeni indirimler ve etkinliklerden haberdar olmak için takipte kal.
            </Text>
          </View>
        }
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
    paddingTop: 10,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: Colors.white,
    marginBottom: 12,
  },
  unreadCard: {
    backgroundColor: '#EEF2FF',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary.indigo,
    marginLeft: 10,
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
  },
});

export default NotificationsScreen;


