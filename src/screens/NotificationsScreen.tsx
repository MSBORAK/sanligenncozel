import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, UserPlus, Check, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Colors } from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { RootStackParamList } from '@/types/navigation';

interface FriendRequest {
  id: string;
  sender_id: string;
  created_at: string;
  sender_profile?: { name: string; username: string };
}

type NotificationItem =
  | { id: string; type: 'friend_request'; created_at: string; title: string; message: string; request: FriendRequest }
  | { id: string; type: 'message'; created_at: string; title: string; message: string; targetUserId: string; targetUserName: string }
  | { id: string; type: 'snap'; created_at: string; title: string; message: string }
  | { id: string; type: 'event'; created_at: string; title: string; message: string }
  | { id: string; type: 'discount'; created_at: string; title: string; message: string };

const NotificationsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { mode } = useThemeMode();
  const { profile } = useUser();
  const isDark = mode === 'dark';

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.userId) return;
    try {
      const userId = profile.userId;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const merged: NotificationItem[] = [];

      const { data: reqData, error: reqErr } = await supabase
        .from('friendships')
        .select('id, sender_id, created_at')
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (!reqErr && reqData && reqData.length > 0) {
        const senderIds = reqData.map((r: any) => r.sender_id);
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name, username')
          .in('user_id', senderIds);

        const profileMap: Record<string, any> = {};
        (profiles ?? []).forEach((p: any) => {
          profileMap[p.user_id] = p;
        });

        reqData.forEach((req: any) => {
          const p = profileMap[req.sender_id];
          const request: FriendRequest = { ...req, sender_profile: p ?? null };
          merged.push({
            id: `friend-${req.id}`,
            type: 'friend_request',
            created_at: req.created_at,
            title: p?.name ?? 'Kullanıcı',
            message: `@${p?.username ?? ''} seni arkadaş olarak eklemek istiyor`,
            request,
          });
        });
      }

      const { data: cp } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      const conversationIds = (cp ?? []).map((row: any) => row.conversation_id);
      if (conversationIds.length > 0) {
        const { data: msgData } = await supabase
          .from('messages')
          .select('id, sender_id, content, created_at')
          .in('conversation_id', conversationIds)
          .neq('sender_id', userId)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20);

        if (msgData && msgData.length > 0) {
          const senderIds = [...new Set(msgData.map((m: any) => m.sender_id))];
          const { data: senderProfiles } = await supabase
            .from('user_profiles')
            .select('user_id, name')
            .in('user_id', senderIds);

          const senderMap: Record<string, string> = {};
          (senderProfiles ?? []).forEach((p: any) => {
            senderMap[p.user_id] = p.name ?? 'Kullanıcı';
          });

          msgData.forEach((m: any) => {
            const senderName = senderMap[m.sender_id] ?? 'Kullanıcı';
            merged.push({
              id: `msg-${m.id}`,
              type: 'message',
              created_at: m.created_at,
              title: senderName,
              message: m.content?.trim() ? m.content : 'Yeni bir mesaj gönderdi.',
              targetUserId: m.sender_id,
              targetUserName: senderName,
            });
          });
        }
      }

      const { data: friendships } = await supabase
        .from('friendships')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      const friendIds = (friendships ?? []).map((f: any) => (f.sender_id === userId ? f.receiver_id : f.sender_id));
      if (friendIds.length > 0) {
        const { data: snapData } = await supabase
          .from('social_posts')
          .select('id, user_id, created_at')
          .in('user_id', friendIds)
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(20);

        if (snapData && snapData.length > 0) {
          const { data: friendProfiles } = await supabase
            .from('user_profiles')
            .select('user_id, name')
            .in('user_id', friendIds);

          const friendMap: Record<string, string> = {};
          (friendProfiles ?? []).forEach((p: any) => {
            friendMap[p.user_id] = p.name ?? 'Arkadaşın';
          });

          snapData.forEach((s: any) => {
            merged.push({
              id: `snap-${s.id}`,
              type: 'snap',
              created_at: s.created_at,
              title: 'Yeni kıvılcım',
              message: `${friendMap[s.user_id] ?? 'Arkadaşın'} yeni bir kıvılcım paylaştı.`,
            });
          });
        }
      }

      // 4) Yeni etkinlikler (son 7 gün)
      const eventSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: eventsData } = await supabase
        .from('etkinlikler')
        .select('id, baslik, tarih, created_at')
        .gte('created_at', eventSince)
        .order('created_at', { ascending: false })
        .limit(15);

      (eventsData ?? []).forEach((e: any) => {
        merged.push({
          id: `event-${e.id}`,
          type: 'event',
          created_at: e.created_at,
          title: 'Yeni etkinlik yayinda',
          message: `${e.baslik ?? 'Etkinlik'}${e.tarih ? ` - ${e.tarih}` : ''}`,
        });
      });

      // 5) Yeni indirimler/firsatlar (son 7 gün)
      const { data: discountsData } = await supabase
        .from('firsatlar')
        .select('id, baslik, kategori, created_at')
        .gte('created_at', eventSince)
        .order('created_at', { ascending: false })
        .limit(15);

      (discountsData ?? []).forEach((d: any) => {
        merged.push({
          id: `discount-${d.id}`,
          type: 'discount',
          created_at: d.created_at,
          title: 'Yeni indirim eklendi',
          message: `${d.baslik ?? 'Firsat'}${d.kategori ? ` - ${d.kategori}` : ''}`,
        });
      });

      merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(merged);
    } catch {
      // sessiz hata
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleAccept = async (req: FriendRequest) => {
    if (!profile?.userId) return;
    try {
      const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', req.id);
      if (error) throw error;

      await supabase.rpc('get_or_create_conversation', {
        user1_id: profile.userId,
        user2_id: req.sender_id,
      });

      Alert.alert('Arkadaş Eklendi!', `${req.sender_profile?.name ?? 'Kullanıcı'} ile artık mesajlaşabilirsiniz.`);
      await fetchNotifications();
    } catch {
      Alert.alert('Hata', 'İstek kabul edilemedi. Lütfen tekrar deneyin.');
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      const { error } = await supabase.from('friendships').update({ status: 'rejected' }).eq('id', reqId);
      if (error) throw error;
      await fetchNotifications();
    } catch {
      Alert.alert('Hata', 'İstek reddedilemedi. Lütfen tekrar deneyin.');
    }
  };

  const bg = isDark ? '#0f172a' : Colors.lightGray;
  const cardBg = isDark ? '#1e293b' : Colors.white;
  const textColor = isDark ? '#f1f5f9' : Colors.darkGray;
  const subColor = isDark ? '#94a3b8' : '#6b7280';
  const accentColor = isDark ? Colors.dark.accent : Colors.primary.indigo;

  const handleItemPress = (item: NotificationItem) => {
    if (item.type === 'message') {
      navigation.navigate('Chat', {
        userId: item.targetUserId,
        userName: item.targetUserName,
      });
      return;
    }
    if (item.type === 'event') {
      navigation.navigate('Events');
      return;
    }
    if (item.type === 'discount') {
      navigation.navigate('Main', { screen: 'GencKart' });
      return;
    }
    if (item.type === 'snap') {
      navigation.navigate('Sosyal');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Bildirimler</Text>
        <View style={[styles.headerIcon, { backgroundColor: isDark ? 'rgba(56,189,248,0.14)' : '#EEF2FF' }]}>
          <Bell size={20} color={accentColor} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
          ListHeaderComponent={
            items.length > 0 ? (
              <Text style={[styles.sectionTitle, { color: accentColor }]}>
                Son Bildirimler ({items.length})
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                item.type === 'friend_request' ? styles.friendReqCard : null,
                {
                  backgroundColor: cardBg,
                  borderColor: isDark ? 'rgba(56,189,248,0.22)' : 'rgba(99,102,241,0.2)',
                },
              ]}
              onPress={() => handleItemPress(item)}
              activeOpacity={item.type === 'event' || item.type === 'discount' || item.type === 'message' || item.type === 'snap' ? 0.82 : 1}
            >
              <View
                style={[
                  styles.iconWrapper,
                  { backgroundColor: isDark ? 'rgba(56,189,248,0.16)' : 'rgba(99,102,241,0.1)' },
                ]}
              >
                {item.type === 'friend_request' ? <UserPlus size={22} color={accentColor} /> : <Bell size={22} color={accentColor} />}
              </View>
              <View style={styles.textWrapper}>
                <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
                <Text style={[styles.message, { color: subColor }]}>{item.message}</Text>
              </View>
              {item.type === 'friend_request' && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => handleAccept(item.request)}
                    style={{ backgroundColor: isDark ? Colors.dark.accent : '#10b981', borderRadius: 18, padding: 7 }}
                  >
                    <Check color="#fff" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReject(item.request.id)}
                    style={{ backgroundColor: isDark ? '#334155' : '#f3f4f6', borderRadius: 18, padding: 7 }}
                  >
                    <X color={subColor} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bell size={40} color="#d1d5db" />
              <Text style={[styles.emptyTitle, { color: textColor }]}>Henüz bildirimin yok</Text>
              <Text style={[styles.emptyText, { color: subColor }]}>
                Arkadaşlık, mesaj, kıvılcım, etkinlik ve indirim bildirimlerini burada göreceksin.
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
