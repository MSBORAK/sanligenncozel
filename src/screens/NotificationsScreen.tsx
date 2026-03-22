import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, TicketPercent, CalendarDays, UserPlus, Check, X } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

interface FriendRequest {
  id: string;
  sender_id: string;
  created_at: string;
  sender_profile?: { name: string; username: string };
}

const NotificationsScreen = () => {
  const { mode } = useThemeMode();
  const { profile } = useUser();
  const isDark = mode === 'dark';

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!profile?.userId) return;
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, sender_id, created_at')
        .eq('receiver_id', profile.userId)
        .eq('status', 'pending');

      if (error || !data) return;

      // Profilleri tek sorguda çek (N+1 önleme)
      const senderIds = data.map((r: any) => r.sender_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name, username')
        .in('user_id', senderIds);

      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p; });

      const withProfiles = data.map((req: any) => ({
        ...req,
        sender_profile: profileMap[req.sender_id] ?? null,
      }));

      setFriendRequests(withProfiles);
    } catch {
      // sessiz hata
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleAccept = async (req: FriendRequest) => {
    if (!profile?.userId) return;
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', req.id);
      if (error) throw error;

      await supabase.rpc('get_or_create_conversation', {
        user1_id: profile.userId,
        user2_id: req.sender_id,
      });

      Alert.alert(
        'Arkadaş Eklendi!',
        `${req.sender_profile?.name ?? 'Kullanıcı'} ile artık mesajlaşabilirsiniz.`
      );
      await fetchRequests();
    } catch {
      Alert.alert('Hata', 'İstek kabul edilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', reqId);
      if (error) throw error;
      await fetchRequests();
    } catch {
      Alert.alert('Hata', 'İstek reddedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const bg = isDark ? '#0f172a' : Colors.lightGray;
  const cardBg = isDark ? '#1e293b' : Colors.white;
  const textColor = isDark ? '#f1f5f9' : Colors.darkGray;
  const subColor = isDark ? '#94a3b8' : '#6b7280';
  const accentColor = isDark ? '#f59e0b' : Colors.primary.indigo;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Bildirimler</Text>
        <View style={[styles.headerIcon, { backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#EEF2FF' }]}>
          <Bell size={20} color={accentColor} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (
        <FlatList
          data={friendRequests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
          ListHeaderComponent={
            friendRequests.length > 0 ? (
              <Text style={[styles.sectionTitle, { color: accentColor }]}>
                Arkadaşlık İstekleri ({friendRequests.length})
              </Text>
            ) : null
          }
          renderItem={({ item: req }) => (
            <View
              style={[
                styles.card,
                styles.friendReqCard,
                {
                  backgroundColor: cardBg,
                  borderColor: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)',
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.1)' },
                ]}
              >
                <UserPlus size={22} color={accentColor} />
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.title, { color: textColor }]}>
                  {req.sender_profile?.name ?? 'Kullanıcı'}
                </Text>
                <Text style={[styles.message, { color: subColor }]}>
                  @{req.sender_profile?.username} seni arkadaş olarak eklemek istiyor
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleAccept(req)}
                  style={{ backgroundColor: isDark ? '#f59e0b' : '#10b981', borderRadius: 18, padding: 7 }}
                >
                  <Check color="#fff" size={16} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleReject(req.id)}
                  style={{ backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 18, padding: 7 }}
                >
                  <X color={subColor} size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={40} color="#d1d5db" />
              <Text style={[styles.emptyTitle, { color: textColor }]}>Henüz bildirimin yok</Text>
              <Text style={[styles.emptyText, { color: subColor }]}>
                Arkadaşlık isteklerini burada göreceksin.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  friendReqCard: {
    borderWidth: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrapper: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    marginBottom: 2,
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
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
