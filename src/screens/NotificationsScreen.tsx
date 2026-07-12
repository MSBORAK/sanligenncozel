import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, UserPlus, Check, X, MessageSquare, Sparkles, Calendar, Percent, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { cardOuterShadow, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/useAppTheme';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { pickLocalized } from '@/lib/localizeContent';
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
  const t = useAppTheme();
  const { i18n, t: tr } = useTranslation();
  const { profile } = useUser();

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
            title: p?.name ?? tr('common.kullanici'),
            message: `@${p?.username ?? ''} ${tr('sosyalMain.seniEklemekIstiyor')}`,
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
            senderMap[p.user_id] = p.name ?? tr('common.kullanici');
          });

          msgData.forEach((m: any) => {
            const senderName = senderMap[m.sender_id] ?? tr('common.kullanici');
            merged.push({
              id: `msg-${m.id}`,
              type: 'message',
              created_at: m.created_at,
              title: senderName,
              message: m.content?.trim() ? m.content : tr('notifications.yeniMesajGonderdi'),
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
            friendMap[p.user_id] = p.name ?? tr('notifications.arkadasin');
          });

          snapData.forEach((s: any) => {
            merged.push({
              id: `snap-${s.id}`,
              type: 'snap',
              created_at: s.created_at,
              title: tr('notifications.yeniKivilcim'),
              message: tr('notifications.yeniKivilcimPaylasti', { name: friendMap[s.user_id] ?? tr('notifications.arkadasin') }),
            });
          });
        }
      }

      // 4) Yeni etkinlikler (son 7 gün)
      const eventSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: eventsData } = await supabase
        .from('etkinlikler')
        .select('id, baslik, baslik_en, baslik_de, baslik_es, baslik_fr, baslik_ar, tarih, created_at')
        .gte('created_at', eventSince)
        .order('created_at', { ascending: false })
        .limit(15);

      (eventsData ?? []).forEach((e: any) => {
        merged.push({
          id: `event-${e.id}`,
          type: 'event',
          created_at: e.created_at,
          title: tr('notifications.yeniEtkinlikYayinda'),
          message: `${pickLocalized(e, 'baslik', i18n.language) || tr('notifications.etkinlik')}${e.tarih ? ` - ${e.tarih}` : ''}`,
        });
      });

      // 5) Yeni indirimler/firsatlar (son 7 gün)
      const { data: discountsData } = await supabase
        .from('firsatlar')
        .select('id, baslik, baslik_en, baslik_de, baslik_es, baslik_fr, baslik_ar, kategori, created_at')
        .gte('created_at', eventSince)
        .order('created_at', { ascending: false })
        .limit(15);

      (discountsData ?? []).forEach((d: any) => {
        merged.push({
          id: `discount-${d.id}`,
          type: 'discount',
          created_at: d.created_at,
          title: tr('notifications.yeniIndirimEklendi'),
          message: `${pickLocalized(d, 'baslik', i18n.language) || tr('notifications.firsat')}${d.kategori ? ` - ${d.kategori}` : ''}`,
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

      Alert.alert(tr('sosyalMain.arkadasEklendi'), tr('notifications.ileArtikMesajlasabilirsiniz', { name: req.sender_profile?.name ?? tr('common.kullanici') }));
      await fetchNotifications();
    } catch {
      Alert.alert(tr('common.error'), tr('notifications.istekKabulEdilemedi'));
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      const { error } = await supabase.from('friendships').update({ status: 'rejected' }).eq('id', reqId);
      if (error) throw error;
      await fetchNotifications();
    } catch {
      Alert.alert(tr('common.error'), tr('notifications.istekReddedilemedi'));
    }
  };

  const insets = useSafeAreaInsets();
  const { isDark, pageBg, cardBg, cardBdr, txt1, txt2, chipBg } = t;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const iconForType = (type: NotificationItem['type']) => {
    switch (type) {
      case 'friend_request': return UserPlus;
      case 'message': return MessageSquare;
      case 'snap': return Sparkles;
      case 'event': return Calendar;
      case 'discount': return Percent;
      default: return Bell;
    }
  };

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
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      {/* ── HERO — Home ekranındaki sade, düz zeminli başlık dili ── */}
      <View style={[styles.hero, { paddingTop: insets.top + 18, backgroundColor: pageBg }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: chipBg }]} hitSlop={10}>
            <ChevronLeft color={txt1} size={22} strokeWidth={2.2} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroLabel, { color: txt2 }]}>{tr('notifications.guncel')}</Text>
            <Text style={[styles.heroTitle, { color: txt1 }]}>{tr('hizliErisim.bildirimler')}</Text>
          </View>
          <View style={[styles.heroIconWrap, { backgroundColor: txt1 }]}>
            <Bell color={pageBg} size={20} strokeWidth={1.8} />
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={txt1} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={txt2} />}
          ListHeaderComponent={
            items.length > 0 ? (
              <Text style={[styles.sectionTitle, { color: txt2 }]}>
                {tr('notifications.sonBildirimler', { count: items.length })}
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const Icon = iconForType(item.type);
            return (
              <TouchableOpacity
                style={[styles.card, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}
                onPress={() => handleItemPress(item)}
                activeOpacity={item.type === 'event' || item.type === 'discount' || item.type === 'message' || item.type === 'snap' ? 0.82 : 1}
              >
                <View style={[styles.iconWrapper, { backgroundColor: chipBg }]}>
                  <Icon size={20} color={txt1} strokeWidth={2} />
                </View>
                <View style={styles.textWrapper}>
                  <Text style={[styles.title, { color: txt1 }]} numberOfLines={1}>{item.title}</Text>
                  <Text style={[styles.message, { color: txt2 }]} numberOfLines={2}>{item.message}</Text>
                </View>
                {item.type === 'friend_request' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleAccept(item.request)}
                      style={[styles.actionBtn, { backgroundColor: txt1 }]}
                    >
                      <Check color={pageBg} size={16} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(item.request.id)}
                      style={[styles.actionBtn, { backgroundColor: chipBg }]}
                    >
                      <X color={txt2} size={16} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: chipBg }]}>
                <Bell size={28} color={txt2} strokeWidth={1.8} />
              </View>
              <Text style={[styles.emptyTitle, { color: txt1 }]}>{tr('notifications.henuzBildirimYok')}</Text>
              <Text style={[styles.emptyText, { color: txt2 }]}>
                {tr('notifications.emptyDesc')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrapper: { flex: 1, paddingRight: 8 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 3,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
