import React, { useState, useEffect, useCallback } from 'react';
import { AppAlert } from '@/lib/alert';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  Platform,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Users, Camera, Clock, Star, UserCheck, UserPlus, Hourglass, MessageCircle, X, Check, Flame, ShieldOff, ShieldCheck, MoreHorizontal, Flag, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useUser } from '@/context/UserContext';
import { supabase, processImageUrl, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/theme/useAppTheme';
import { Editorial } from '@/theme/colors';
import { Clean } from '@/constants/Colors';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { useTranslation } from 'react-i18next';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ──────────────────────────────────────────────────────────────────

interface FriendEntry {
  id: string;
  other_user_id: string;
  other_name: string;
  other_username: string;
  other_avatar?: string;
  status: 'accepted' | 'pending_sent' | 'pending_received';
}

// ─── Bento Kart Bileşeni ────────────────────────────────────────────────────

interface BentoCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  isDark: boolean;
  accent?: string;
  flex?: number;
}

const BentoCard = ({ icon, value, label, isDark, accent, flex = 1 }: BentoCardProps) => {
  const txt1    = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2    = isDark ? Editorial.coffeeSoft : Clean.textSecondary;
  const cardBg  = isDark ? Editorial.surface : Clean.surface;
  const chipBg  = isDark ? Editorial.chip : Clean.bgSoft;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;
  const valueColor = accent ?? txt1;

  return (
    <View
      style={[
        styles.bentoCard,
        cardOuterShadow,
        cardBorder,
        { flex, backgroundColor: cardBg },
      ]}
    >
      <View style={[styles.bentoIconWrap, { backgroundColor: chipBg }]}>
        {icon}
      </View>
      <Text style={[styles.bentoValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.bentoLabel, { color: txt2 }]}>{label}</Text>
    </View>
  );
};

// ─── Arkadaş Satırı Bileşeni ─────────────────────────────────────────────────

interface FriendRowProps {
  entry: FriendEntry;
  isDark: boolean;
  onPress: (entry: FriendEntry) => void;
}

const statusConfig = {
  accepted: {
    labelKey: 'sosyalProfile.karsilikliArkadas',
    bg: 'rgba(16,185,129,0.15)',
    color: '#10b981',
    icon: <UserCheck size={11} color="#10b981" strokeWidth={2.5} />,
  },
  pending_sent: {
    labelKey: 'sosyalProfile.bekliyor',
    bg: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    icon: <Hourglass size={11} color="#f59e0b" strokeWidth={2.5} />,
  },
  pending_received: {
    labelKey: 'sosyalProfile.istekVar',
    bg: 'rgba(47,36,24,0.15)',
    color: Editorial.coffee,
    icon: <UserPlus size={11} color={Editorial.coffee} strokeWidth={2.5} />,
  },
};

const FriendRow = ({ entry, isDark, onPress }: FriendRowProps) => {
  const { t: tr } = useTranslation();
  const txt1    = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2    = isDark ? Editorial.coffeeSoft : Clean.textSecondary;
  const cardBdr = isDark ? Editorial.border : Clean.border;
  const chipBg  = isDark ? Editorial.chip : Clean.bgSoft;
  const cfg = statusConfig[entry.status];
  const initial = entry.other_name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(entry)}
      style={[styles.friendRow, { borderBottomColor: cardBdr }]}
    >
      {/* Avatar */}
      <View style={[styles.friendAvatar, { backgroundColor: chipBg }]}>
        {entry.other_avatar ? (
          <Image
            source={{ uri: processImageUrl(entry.other_avatar) ?? undefined }}
            style={styles.friendAvatarImg}
          />
        ) : (
          <Text style={[styles.friendAvatarText, { color: txt1 }]}>
            {initial}
          </Text>
        )}
      </View>

      {/* İsim + kullanıcı adı */}
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: txt1 }]}>{entry.other_name}</Text>
        <Text style={[styles.friendUsername, { color: txt2 }]}>@{entry.other_username}</Text>
      </View>

      {/* Durum rozeti */}
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        {cfg.icon}
        <Text style={[styles.statusText, { color: cfg.color }]}>{tr(cfg.labelKey)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Ana Ekran ───────────────────────────────────────────────────────────────

const SosyalProfileScreen = ({ route }: any) => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t: tr } = useTranslation();
  const t = useAppTheme();
  const isDark = t.isDark;
  const { profile: currentUserProfile, refreshProfile } = useUser();
  const pageBg  = t.pageBg;
  const cardBg  = t.cardBg;
  const cardBdr = t.cardBdr;
  const txt1    = t.txt1;
  const txt2    = t.txt2;
  const ctaBg   = t.ctaBg;
  const ctaTxt  = t.ctaTxt;
  const chipBg  = t.chipBg;
  const amber   = t.accent;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  // Route'dan gelen userId varsa onu kullan, yoksa kendi profilimiz
  const viewingUserId = route?.params?.userId || currentUserProfile?.userId;
  const isOwnProfile = viewingUserId === currentUserProfile?.userId;
  
  // Görüntülenen kullanıcının profili
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const profile = isOwnProfile ? currentUserProfile : viewedProfile;

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [snapCount, setSnapCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [reactionsEnabledSaving, setReactionsEnabledSaving] = useState(false);
  const [myRelationship, setMyRelationship] = useState<any | null>(null);
  const [relationshipActionLoading, setRelationshipActionLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const [moreMenuVisible, setMoreMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // Arkadaş profil modalı
  const [selectedFriend, setSelectedFriend] = useState<FriendEntry | null>(null);
  const [friendSnapCount, setFriendSnapCount] = useState(0);
  const [friendFriendCount, setFriendFriendCount] = useState(0);
  const [friendStatsLoading, setFriendStatsLoading] = useState(false);
  const [friendsFriends, setFriendsFriends] = useState<FriendEntry[]>([]);
  const [showFriendsFriends, setShowFriendsFriends] = useState(false);
  const [showOwnFriends, setShowOwnFriends] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);

  const handleFriendPress = useCallback(async (entry: FriendEntry) => {
    setSelectedFriend(entry);
    setFriendStatsLoading(true);
    setShowFriendsFriends(false);
    setFriendsFriends([]);
    try {
      const [{ count: snaps }, { count: friendsCount }] = await Promise.all([
        supabase
          .from('social_posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', entry.other_user_id),
        supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`sender_id.eq.${entry.other_user_id},receiver_id.eq.${entry.other_user_id}`),
      ]);
      setFriendSnapCount(snaps ?? 0);
      setFriendFriendCount(friendsCount ?? 0);
    } catch {
      // sessiz
    } finally {
      setFriendStatsLoading(false);
    }
  }, []);

  const loadFriendsFriends = useCallback(async (userId: string) => {
    setFriendStatsLoading(true);
    try {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('id, sender_id, receiver_id, status')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (friendships && friendships.length > 0) {
        const otherIds = friendships.map((f: any) =>
          f.sender_id === userId ? f.receiver_id : f.sender_id
        );

        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url')
          .in('user_id', otherIds);

        const profileMap: Record<string, any> = {};
        (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p; });

        const mapped: FriendEntry[] = friendships.map((f: any) => {
          const isSender = f.sender_id === userId;
          const otherId = isSender ? f.receiver_id : f.sender_id;
          const otherProfile = profileMap[otherId];

          return {
            id: f.id,
            other_user_id: otherId,
            other_name: otherProfile?.name ?? tr('common.kullanici'),
            other_username: otherProfile?.username ?? '',
            other_avatar: otherProfile?.avatar_url,
            status: 'accepted' as const,
          };
        });
        setFriendsFriends(mapped);
      } else {
        setFriendsFriends([]);
      }
    } catch {
      setFriendsFriends([]);
    } finally {
      setFriendStatsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!viewingUserId) return;

    try {
      // Eğer başka kullanıcının profilini görüyorsak, önce profil bilgilerini çek
      if (!isOwnProfile) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url, is_public, snap_streak_current')
          .eq('user_id', viewingUserId)
          .single();

        if (profileData) {
          setViewedProfile({
            userId: profileData.user_id,
            name: profileData.name,
            username: profileData.username,
            avatarUrl: profileData.avatar_url,
          });
          setStreakCount(profileData.snap_streak_current ?? 0);
        }
      } else {
        // Kendi profilimiz için is_public ve seri değerini çek
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('snap_streak_current, reactions_enabled')
          .eq('user_id', viewingUserId)
          .single();

        if (profileData) {
          setStreakCount(profileData.snap_streak_current ?? 0);
          setReactionsEnabled(profileData.reactions_enabled !== false);
        }
      }

      // Snap sayısı
      const { count: snaps } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', viewingUserId);

      setSnapCount(snaps ?? 0);

      // İlişki durumunu çek (eğer başkasının profiliyse)
      if (!isOwnProfile && currentUserProfile?.userId) {
        const { data: rel } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(sender_id.eq.${currentUserProfile.userId},receiver_id.eq.${viewingUserId}),and(sender_id.eq.${viewingUserId},receiver_id.eq.${currentUserProfile.userId})`)
          .neq('status', 'rejected')
          .maybeSingle();
        setMyRelationship(rel || null);

        const { data: blockRow } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', currentUserProfile.userId)
          .eq('blocked_id', viewingUserId)
          .maybeSingle();
        setIsBlocked(!!blockRow);
        const { data: blockedByRow } = await supabase
          .from('blocked_users')
          .select('id')
          .eq('blocker_id', viewingUserId)
          .eq('blocked_id', currentUserProfile.userId)
          .maybeSingle();
        setIsBlockedByThem(!!blockedByRow);
      }

      // Arkadaşlık listesi
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select('id, sender_id, receiver_id, status')
        .or(`sender_id.eq.${viewingUserId},receiver_id.eq.${viewingUserId}`)
        .neq('status', 'rejected');
      console.log('[SosyalProfile fetchData] friendships sorgusu', { viewingUserId, friendships, friendshipsError });

      if (friendships && friendships.length > 0) {
        // Karşı taraf user_id'lerini topla
        const otherIds = friendships.map((f: any) =>
          f.sender_id === viewingUserId ? f.receiver_id : f.sender_id
        );

        // Profilleri tek sorguda çek
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url')
          .in('user_id', otherIds);

        const profileMap: Record<string, any> = {};
        (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p; });

        const mapped: FriendEntry[] = friendships.map((f: any) => {
          const isSender = f.sender_id === viewingUserId;
          const otherId = isSender ? f.receiver_id : f.sender_id;
          const otherProfile = profileMap[otherId];

          let status: FriendEntry['status'] = 'accepted';
          if (f.status === 'pending') {
            status = isSender ? 'pending_sent' : 'pending_received';
          }

          return {
            id: f.id,
            other_user_id: otherId,
            other_name: otherProfile?.name ?? tr('common.kullanici'),
            other_username: otherProfile?.username ?? '',
            other_avatar: otherProfile?.avatar_url,
            status,
          };
        });
        setFriends(mapped);
      } else {
        setFriends([]);
      }
    } catch (e) {
      console.error('SosyalProfile fetchData error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [viewingUserId, isOwnProfile, currentUserProfile?.userId]);

  const handleRemoveFriend = useCallback(async (friendshipId: string, friendName: string) => {
    AppAlert.alert(
      tr('sosyalProfile.arkadasiCikar'),
      tr('sosyalProfile.arkadasiCikarOnay', { name: friendName }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('sosyalProfile.cikar'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

              if (error) throw error;

              AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalProfile.arkadasCikarildi'));
              setSelectedFriend(null);
              fetchData();
            } catch (e: any) {
              AppAlert.alert(tr('common.error'), e.message || tr('sosyalProfile.arkadasCikarilamadi'));
            }
          },
        },
      ]
    );
  }, [fetchData]);

  const handleCancelRequest = useCallback(async (friendshipId: string, friendName: string) => {
    AppAlert.alert(
      tr('sosyalProfile.istegiGeriAl'),
      tr('sosyalProfile.istegiGeriAlOnay', { name: friendName }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('sosyalProfile.geriAl'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

              if (error) throw error;

              AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalProfile.istekGeriAlindi'));
              setSelectedFriend(null);
              fetchData();
            } catch (e: any) {
              AppAlert.alert(tr('common.error'), e.message || tr('sosyalProfile.istekGeriAlinamadi'));
            }
          },
        },
      ]
    );
  }, [fetchData]);

  const handleSendFriendRequest = async () => {
    console.log('[Arkadaşlık İsteği] handleSendFriendRequest çağrıldı', {
      sender: currentUserProfile?.userId,
      receiver: viewingUserId,
    });
    if (!currentUserProfile?.userId || !viewingUserId) {
      console.warn('[Arkadaşlık İsteği] sender veya receiver eksik, işlem iptal', {
        sender: currentUserProfile?.userId,
        receiver: viewingUserId,
      });
      return;
    }
    setRelationshipActionLoading(true);
    try {
      // Aramızda 'rejected' durumunda eski bir kayıt kalmış olabilir (unique
      // kısıtlama nedeniyle yeni isteği sessizce engelleyebilir) — önce temizle.
      const { data: staleRows } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(sender_id.eq.${currentUserProfile.userId},receiver_id.eq.${viewingUserId}),and(sender_id.eq.${viewingUserId},receiver_id.eq.${currentUserProfile.userId})`)
        .eq('status', 'rejected');
      if (staleRows && staleRows.length > 0) {
        console.log('[Arkadaşlık İsteği] eski/rejected kayıt(lar) temizleniyor', staleRows);
        await supabase.from('friendships').delete().in('id', staleRows.map((r: any) => r.id));
      }

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          sender_id: currentUserProfile.userId,
          receiver_id: viewingUserId,
          status: 'pending'
        })
        .select()
        .single();
      console.log('[Arkadaşlık İsteği] insert sonucu', { data, error });
      if (error) throw error;
      setMyRelationship(data);
      
      // Alıcıya bildirim gönder
      const myName = currentUserProfile?.name || currentUserProfile?.username || tr('sosyalMain.biri');
      try {
        const { notify } = require('@/lib/notifications');
        notify.friendRequest(viewingUserId, myName).catch((err: unknown) => {
          if (__DEV__) console.warn('Arkadaşlık bildirimi gönderilemedi:', err);
        });
      } catch (err) {
        if (__DEV__) console.warn('Bildirim modülü yüklenemedi:', err);
      }

      AppAlert.alert(tr('sosyalMain.istekGonderildiUnlem') || 'İsteyiniz İletildi', tr('sosyalMain.arkadaslikIstegiGonderildi', { name: profile?.name || profile?.username }) || 'Arkadaşlık isteği gönderildi.');
    } catch (e: any) {
      console.error('[Arkadaşlık İsteği] HATA', e);
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalMain.birHataOlustu'));
    } finally {
      setRelationshipActionLoading(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!myRelationship) return;
    setRelationshipActionLoading(true);
    try {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', myRelationship.id)
        .select()
        .single();
      if (error) throw error;
      setMyRelationship(data);
      fetchData(); // Arkadaş listesini yenile
      // Kabulde sohbet oluştur ve bildirim gönder
      try {
        const myId = currentUserProfile?.userId;
        const otherId = viewingUserId;
        if (myId && otherId) {
          const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
            user1_id: myId,
            user2_id: otherId,
          });
          if (convError) console.warn('Konuşma oluştururken hata:', convError);
          const myName = currentUserProfile?.name || currentUserProfile?.username || tr('sosyalMain.biri');
          const { notify } = require('@/lib/notifications');
          notify.friendAccepted(otherId, myName).catch(() => {});
        }
      } catch (e) {
        // sessizce devam et
      }
      AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalMain.istekKabulEdildi', { name: profile?.name || profile?.username }) || 'Arkadaşlık isteği kabul edildi.');
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalMain.birHataOlustu'));
    } finally {
      setRelationshipActionLoading(false);
    }
  };

  const handleAcceptPendingById = useCallback(async (friendshipId: string) => {
    try {
      const { error, data } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('İstek güncellenemedi (satır bulunamadı veya yetki yok).');
      }
      // create conversation + notify if possible
      try {
        const myId = currentUserProfile?.userId;
        const friendRow = data && data[0];
        const otherId = friendRow && (friendRow.sender_id === myId ? friendRow.receiver_id : friendRow.sender_id);
        if (myId && otherId) {
          const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
            user1_id: myId,
            user2_id: otherId,
          });
          if (convError) console.warn('Konuşma oluştururken hata:', convError);
          const myName = currentUserProfile?.name || currentUserProfile?.username || tr('sosyalMain.biri');
          const { notify } = require('@/lib/notifications');
          notify.friendAccepted(otherId, myName).catch(() => {});
        }
      } catch (e) {
        // ignore
      }
      fetchData();
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalMain.birHataOlustu'));
    }
  }, [fetchData]);

  const handleToggleBlock = () => {
    if (!currentUserProfile?.userId || !viewingUserId) return;
    const targetName = profile?.name || profile?.username || tr('common.kullanici');

    if (isBlocked) {
      AppAlert.alert(
        tr('sosyalProfile.engeliKaldir'),
        tr('sosyalProfile.engeliKaldirOnay', { name: targetName }),
        [
          { text: tr('common.cancel'), style: 'cancel' },
          {
            text: tr('sosyalProfile.engeliKaldir'),
            onPress: async () => {
              setBlockActionLoading(true);
              try {
                const { error } = await supabase
                  .from('blocked_users')
                  .delete()
                  .eq('blocker_id', currentUserProfile.userId)
                  .eq('blocked_id', viewingUserId);
                if (error) throw error;
                setIsBlocked(false);
                AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalProfile.engelKaldirildi'));
              } catch {
                AppAlert.alert(tr('common.error'), tr('sosyalProfile.islemBasarisiz'));
              } finally {
                setBlockActionLoading(false);
              }
            },
          },
        ]
      );
      return;
    }

    AppAlert.alert(
      tr('sosyalProfile.kullaniciyiEngelle'),
      tr('sosyalProfile.kullaniciyiEngelleOnay', { name: targetName }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('sosyalProfile.engelle'),
          style: 'destructive',
          onPress: async () => {
            setBlockActionLoading(true);
            try {
              const { error } = await supabase.rpc('block_user', { p_blocked_id: viewingUserId });
              if (error) throw error;
              setIsBlocked(true);
              setMyRelationship(null);
              AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalProfile.kullaniciEngellendi', { name: targetName }));
            } catch {
              AppAlert.alert(tr('common.error'), tr('sosyalProfile.islemBasarisiz'));
            } finally {
              setBlockActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const REPORT_REASONS = [
    { key: 'spam', label: tr('sosyalProfile.sebepSpam') },
    { key: 'taciz', label: tr('sosyalProfile.sebepTaciz') },
    { key: 'uygunsuz_icerik', label: tr('sosyalProfile.sebepUygunsuzIcerik') },
    { key: 'sahte_hesap', label: tr('sosyalProfile.sebepSahteHesap') },
    { key: 'diger', label: tr('sosyalProfile.sebepDiger') },
  ];

  const handleSubmitReport = async () => {
    if (!currentUserProfile?.userId || !viewingUserId || !reportReason) return;
    setReportSubmitting(true);
    try {
      const { error } = await supabase.from('kullanici_sikayetleri').insert({
        sikayet_eden_id: currentUserProfile.userId,
        sikayet_edilen_id: viewingUserId,
        sebep: reportReason,
        aciklama: reportDetail.trim() || null,
      });
      if (error) throw error;
      setReportModalVisible(false);
      setReportReason(null);
      setReportDetail('');
      AppAlert.alert(tr('sosyalProfile.sikayetGonderildi'), tr('sosyalProfile.sikayetGonderildiMesaj'));
    } catch {
      AppAlert.alert(tr('common.error'), tr('sosyalProfile.islemBasarisiz'));
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleRemoveFriendOnProfile = async () => {
    if (!myRelationship) return;
    AppAlert.alert(
      tr('sosyalProfile.arkadasiCikar') || 'Arkadaşı Çıkar',
      tr('sosyalProfile.arkadasiCikarOnay', { name: profile?.name || profile?.username }) || 'Bu kişiyi arkadaşlarınızdan çıkarmak istediğinize emin misiniz?',
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('sosyalProfile.cikar') || 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            setRelationshipActionLoading(true);
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', myRelationship.id);
              if (error) throw error;
              setMyRelationship(null);
              fetchData();
              AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalProfile.arkadasCikarildi') || 'Arkadaş çıkarıldı.');
            } catch (e: any) {
              AppAlert.alert(tr('common.error'), e.message || tr('sosyalProfile.arkadasCikarilamadi'));
            } finally {
              setRelationshipActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelRequestOnProfile = async () => {
    if (!myRelationship) return;
    AppAlert.alert(
      tr('sosyalProfile.istegiGeriAl') || 'İsteği Geri Al',
      tr('sosyalProfile.istegiGeriAlOnay', { name: profile?.name || profile?.username }) || 'Arkadaşlık isteğini geri almak istiyor musunuz?',
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('sosyalProfile.geriAl') || 'Geri Al',
          style: 'destructive',
          onPress: async () => {
            setRelationshipActionLoading(true);
            try {
              const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', myRelationship.id);
              if (error) throw error;
              setMyRelationship(null);
              AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalProfile.istekGeriAlindi') || 'İstek geri alındı.');
            } catch (e: any) {
              AppAlert.alert(tr('common.error'), e.message || tr('sosyalProfile.istekGeriAlinamadi') || 'İstek geri alınamadı.');
            } finally {
              setRelationshipActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAvatarPress = useCallback(() => {
    AppAlert.alert(tr('sosyalProfile.profilFotografi'), tr('sosyalProfile.nasilYuklemekIstersin'), [
      {
        text: tr('sosyalProfile.galeridenSec'),
        onPress: () => pickAvatar('gallery'),
      },
      {
        text: tr('sosyalProfile.kameraIleCek'),
        onPress: () => pickAvatar('camera'),
      },
      { text: tr('common.cancel'), style: 'cancel' },
    ]);
  }, []);

  const pickAvatar = useCallback(async (source: 'gallery' | 'camera') => {
    if (!profile?.userId) return;

    let result;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        AppAlert.alert(tr('sosyalProfile.izinGerekli'), tr('sosyalProfile.kameraIzinVer'));
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        AppAlert.alert(tr('sosyalProfile.izinGerekli'), tr('sosyalProfile.galeriIzinVer'));
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const uri = result.assets[0].uri;
    setAvatarUploading(true);
    try {
      // Auth token al
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      if (!authToken) throw new Error(tr('sosyalProfile.oturumBulunamadi'));

      // Debug: Kullanıcı ID'sini kontrol et
      const currentUserId = session?.user?.id;
      console.log('Current user ID:', currentUserId);
      console.log('Profile user ID:', profile.userId);
      
      if (currentUserId !== profile.userId) {
        throw new Error(tr('sosyalProfile.idUyusmazligi'));
      }

      // Dosyayı yükle
      const fileName = `${profile.userId}/${Date.now()}.jpg`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/avatars/${fileName}`;

      const fetchResp = await fetch(uri);
      const blob = await fetchResp.blob();

      const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: blob,
      });

      if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        throw new Error(`${tr('sosyalProfile.yuklemeHatasi')}: ${errText}`);
      }

      // Public URL al
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      console.log('Avatar uploaded, URL:', publicUrl);

      // RPC function kullanarak güncelle
      const { error: rpcError } = await supabase.rpc('update_user_avatar', {
        p_user_id: profile.userId,
        p_avatar_url: publicUrl,
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(`${tr('sosyalProfile.profilGuncellenemedi')}: ${rpcError.message}`);
      }

      // UserContext'i yenile
      await refreshProfile();
      AppAlert.alert(tr('sendSnap.basarili'), tr('sosyalProfile.fotografGuncellendi'));
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalProfile.fotografYuklenemedi'));
    } finally {
      setAvatarUploading(false);
    }
  }, [profile?.userId, refreshProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const acceptedCount = friends.filter(f => f.status === 'accepted').length;
  const pendingCount = friends.filter(f => f.status !== 'accepted').length;

  const accentColor = txt1;

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: chipBg }]}>
            <ArrowLeft size={22} color={txt1} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: txt1 }]}>{tr('sosyalProfile.headerTitle')}</Text>
          {!isOwnProfile ? (
            <TouchableOpacity
              onPress={() => setMoreMenuVisible(true)}
              style={[styles.backBtn, { backgroundColor: chipBg }]}
            >
              <MoreHorizontal size={22} color={txt1} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={txt1}
            />
          }
        >
          {/* Profil Kartı */}
          <View
            style={[
              styles.profileCard,
              cardOuterShadow,
              cardBorder,
              { backgroundColor: cardBg },
            ]}
          >
            {/* Avatar — tıklanabilir */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={isOwnProfile ? handleAvatarPress : undefined}
              style={{ marginBottom: 14 }}
              disabled={avatarUploading || !isOwnProfile}
            >
              <View style={[styles.avatarCircle, { borderColor: cardBdr, marginBottom: 0 }]}>
                {avatarUploading ? (
                  <View style={[styles.avatarGradient, { backgroundColor: chipBg }]}>
                    <ActivityIndicator color={txt1} />
                  </View>
                ) : profile?.avatarUrl ? (
                  <Image
                    source={{ uri: processImageUrl(profile.avatarUrl) ?? undefined }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={[styles.avatarGradient, { backgroundColor: ctaBg }]}>
                    <Text style={[styles.avatarInitial, { color: ctaTxt }]}>
                      {profile?.name?.charAt(0).toUpperCase() ?? 'S'}
                    </Text>
                  </View>
                )}
              </View>
              {/* Kamera ikonu rozeti - sadece kendi profilinde */}
              {isOwnProfile && (
                <View style={[styles.avatarCameraBtn, { backgroundColor: ctaBg, borderColor: cardBg }]}>
                  <Camera size={12} color={ctaTxt} strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.profileName, { color: txt1 }]} numberOfLines={1}>
              {profile?.name ?? tr('common.kullanici')}
            </Text>
            <Text style={[styles.profileUsername, { color: txt2 }]} numberOfLines={1}>
              @{profile?.username ?? ''}
            </Text>

            {/* Platform rozeti */}
            <View style={[styles.platformBadge, { backgroundColor: chipBg, borderWidth: 0 }]}>
              <Star size={11} color={amber} strokeWidth={2.5} fill={amber} />
              <Text style={[styles.platformBadgeText, { color: txt1 }]}>{tr('sosyalProfile.sanliSosyalUyesi')}</Text>
            </View>

            {/* İlişki Durumu Durum Butonları (Başka kullanıcının profilindeyken) */}
            {!isOwnProfile && (
              <View style={{ width: '100%', marginTop: 16, gap: 8 }}>
                {relationshipActionLoading ? (
                  <ActivityIndicator color={txt1} style={{ paddingVertical: 12 }} />
                ) : !myRelationship ? (
                  isBlockedByThem ? (
                    <View style={[styles.sheetMsgBtn, { justifyContent: 'center', alignItems: 'center', paddingVertical: 14 }]}>
                      <Text style={{ color: txt2, fontWeight: '700' }}>{tr('sosyalProfile.seniEngelledi') || 'Bu kullanıcı seni engelledi'}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleSendFriendRequest}
                      style={styles.sheetMsgBtn}
                    >
                      <LinearGradient
                        colors={isDark ? ['#3A2A1A', '#2F2418'] : [Editorial.ink, Editorial.coffee]}
                        style={styles.sheetMsgGradient}
                      >
                        <UserPlus size={18} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.sheetMsgText}>{tr('sosyalMain.arkadasEkle') || 'Arkadaş Ekle'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )
                ) : myRelationship.status === 'accepted' ? (
                  <View style={{ gap: 8, width: '100%' }}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        navigation.navigate('Chat', {
                          userId: profile?.userId || viewingUserId,
                          userName: profile?.name,
                          userAvatar: profile?.avatarUrl || '',
                          username: profile?.username || ''
                        });
                      }}
                      style={styles.sheetMsgBtn}
                    >
                      <LinearGradient
                        colors={isDark ? ['#3A2A1A', '#2F2418'] : [Editorial.ink, Editorial.coffee]}
                        style={styles.sheetMsgGradient}
                      >
                        <MessageCircle size={18} color="#fff" strokeWidth={2.5} />
                        <Text style={styles.sheetMsgText}>{tr('sosyalProfile.mesajGonder') || 'Mesaj Gönder'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleRemoveFriendOnProfile}
                      style={[styles.sheetRemoveBtn, { 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,20,0.04)', 
                        borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#111114',
                        marginTop: 4
                      }]}
                    >
                      <X size={16} color={isDark ? '#F5F5F7' : '#111114'} strokeWidth={2.5} />
                      <Text style={[styles.sheetRemoveText, { color: isDark ? '#F5F5F7' : '#111114' }]}>{tr('sosyalProfile.arkadasiCikar') || 'Arkadaşı Çıkar'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : myRelationship.sender_id === currentUserProfile?.userId ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleCancelRequestOnProfile}
                    style={[styles.sheetRemoveBtn, { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,20,0.04)', 
                      borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#111114',
                      marginTop: 4
                    }]}
                  >
                    <X size={16} color="#fb923c" strokeWidth={2.5} />
                    <Text style={[styles.sheetRemoveText, { color: '#fb923c' }]}>{tr('sosyalProfile.istegiGeriAl') || 'İsteği Geri Al'}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8, width: '100%', marginTop: 4 }}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleAcceptFriendRequest}
                      style={{ flex: 1, height: 48, borderRadius: 16, overflow: 'hidden' }}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                      >
                        <Check color="#fff" size={16} strokeWidth={2.5} />
                        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{tr('sosyalMain.kabulEt') || 'Kabul Et'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={handleCancelRequestOnProfile}
                      style={{ 
                        flex: 1, 
                        height: 48, 
                        borderRadius: 16, 
                        borderWidth: 1, 
                        borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.18)',
                        backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 6
                      }}
                    >
                      <X color="#ef4444" size={16} strokeWidth={2.5} />
                      <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '700' }}>{tr('sosyalMain.reddet') || 'Reddet'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Gizlilik ayarı kaldırıldı — ŞanlıSosyal artık tamamen arkadaş bazlı,
              "herkese açık" seçeneği yok, bu yüzden ayrı bir gizlilik anahtarına gerek kalmadı. */}
          {isOwnProfile && (
            <>
            {/* Tepki Ayarı */}
            <View
              style={[
                styles.privacyCard,
                cardOuterShadow,
                cardBorder,
                { backgroundColor: cardBg },
              ]}
            >
              <View style={styles.privacyRow}>
                <View style={styles.privacyLeft}>
                  <MessageCircle size={20} color={txt1} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.privacyTitle, { color: txt1 }]}>
                      {reactionsEnabled ? tr('sosyalProfile.tepkilerAcik') : tr('sosyalProfile.tepkilerKapali')}
                    </Text>
                    <Text style={[styles.privacyDesc, { color: txt2 }]}>
                      {reactionsEnabled
                        ? tr('sosyalProfile.tepkiAcikAciklama')
                        : tr('sosyalProfile.tepkiKapaliAciklama')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={reactionsEnabled}
                  disabled={reactionsEnabledSaving}
                  onValueChange={async (value) => {
                    if (!currentUserProfile?.userId) return;
                    setReactionsEnabled(value);
                    setReactionsEnabledSaving(true);
                    try {
                      const { error } = await supabase
                        .from('user_profiles')
                        .update({ reactions_enabled: value })
                        .eq('user_id', currentUserProfile.userId);
                      if (error) throw error;
                    } catch {
                      setReactionsEnabled(!value);
                      AppAlert.alert(tr('common.error'), tr('sosyalProfile.islemBasarisiz'));
                    } finally {
                      setReactionsEnabledSaving(false);
                    }
                  }}
                  trackColor={{
                    false: isDark ? '#2c2c2e' : '#e2e8f0',
                    true: amber
                  }}
                  thumbColor="#fff"
                  ios_backgroundColor={isDark ? '#2c2c2e' : '#e2e8f0'}
                />
              </View>
            </View>

            {/* Engellenen Kullanıcılar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('BlockedUsers')}
              style={[
                styles.privacyCard,
                cardOuterShadow,
                cardBorder,
                { backgroundColor: cardBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
              ]}
            >
              <View style={styles.privacyLeft}>
                <ShieldOff size={20} color={txt1} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyTitle, { color: txt1 }]}>{tr('profileScreen.engellenenKullanicilar')}</Text>
                  <Text style={[styles.privacyDesc, { color: txt2 }]}>{tr('profileScreen.engellenenKullanicilarSub')}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={txt2} strokeWidth={2} />
            </TouchableOpacity>
            </>
          )}

          {/* Bento İstatistikler */}
          {loading ? (
            <ActivityIndicator color={accentColor} style={{ marginVertical: 24 }} />
          ) : (
            <>
              <View style={styles.bentoRow}>
                <BentoCard
                  icon={<Camera size={20} color={txt1} strokeWidth={2} />}
                  value={snapCount}
                  label={tr('sosyalProfile.kivilcim')}
                  isDark={isDark}
                />
                <View style={{ width: 10 }} />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setShowOwnFriends(!showOwnFriends)}
                  style={{ flex: 1 }}
                >
                  <BentoCard
                    icon={<Users size={20} color={txt1} strokeWidth={2} />}
                    value={acceptedCount}
                    label={tr('sosyalProfile.arkadas')}
                    isDark={isDark}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.bentoRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={!isOwnProfile}
                  onPress={() => setShowPendingRequests(!showPendingRequests)}
                  style={{ flex: 1 }}
                >
                  <BentoCard
                    icon={<Clock size={20} color={isDark ? '#a78bfa' : '#8b5cf6'} strokeWidth={2} />}
                    value={pendingCount}
                    label={tr('sosyalProfile.bekleyenIstek')}
                    isDark={isDark}
                    accent={isDark ? '#a78bfa' : '#8b5cf6'}
                  />
                </TouchableOpacity>
                <View style={{ width: 10 }} />
                <BentoCard
                  icon={<Flame size={20} color={isDark ? '#fb923c' : '#ea580c'} strokeWidth={2} />}
                  value={streakCount}
                  label={tr('sosyalProfile.kivilcimSerisi')}
                  isDark={isDark}
                  accent={isDark ? '#fb923c' : '#ea580c'}
                />
              </View>

              {/* Bekleyen İstekler Listesi */}
              {showPendingRequests && isOwnProfile && (
                <View style={[styles.friendsFriendsContainer, cardOuterShadow, cardBorder, { backgroundColor: cardBg, marginTop: 16 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Clock size={18} color={txt1} strokeWidth={2} />
                      <Text style={[styles.friendsFriendsTitle, { color: txt1 }]}>{tr('sosyalProfile.bekleyenIstek')}</Text>
                      <View style={[styles.countPill, { backgroundColor: chipBg }]}>
                        <Text style={[styles.countPillText, { color: txt1 }]}>{pendingCount}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setShowPendingRequests(false)}>
                      <X size={20} color={txt2} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {friends.filter(f => f.status !== 'accepted').length === 0 ? (
                    <Text style={{ color: txt2, fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                      {tr('sosyalMain.bekleyenIstekYok')}
                    </Text>
                  ) : friends.filter(f => f.status !== 'accepted').map(entry => (
                    <View key={entry.id} style={[styles.friendRow, { borderBottomColor: cardBdr }]}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setShowPendingRequests(false);
                          navigation.navigate('SosyalProfile', { userId: entry.other_user_id });
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      >
                        <View style={[styles.friendAvatar, { backgroundColor: chipBg }]}>
                          {entry.other_avatar ? (
                            <Image
                              source={{ uri: processImageUrl(entry.other_avatar) ?? undefined }}
                              style={styles.friendAvatarImg}
                            />
                          ) : (
                            <Text style={[styles.friendAvatarText, { color: txt1 }]}>
                              {entry.other_name.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.friendInfo}>
                          <Text style={[styles.friendName, { color: txt1 }]}>{entry.other_name}</Text>
                          <Text style={[styles.friendUsername, { color: txt2 }]}>
                            {entry.status === 'pending_received' ? tr('sosyalProfile.istekVar') : tr('sosyalProfile.bekliyor')}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {entry.status === 'pending_received' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleAcceptPendingById(entry.id)}
                            style={{ backgroundColor: '#10b981', borderRadius: 20, padding: 8 }}
                          >
                            <Check size={16} color="#fff" strokeWidth={2.5} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleRemoveFriend(entry.id, entry.other_name)}
                            style={{ backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 20, padding: 8 }}
                          >
                            <X size={16} color="#ef4444" strokeWidth={2.5} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleRemoveFriend(entry.id, entry.other_name)}
                          style={[styles.removeFriendBtn, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }]}
                        >
                          <X size={14} color="#ef4444" strokeWidth={2.5} />
                          <Text style={[styles.removeFriendText, { color: '#ef4444' }]}>{tr('sosyalProfile.geriAl')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Kendi Arkadaş Listesi Modal */}
              {showOwnFriends && isOwnProfile && (
                <View style={[styles.friendsFriendsContainer, cardOuterShadow, cardBorder, { backgroundColor: cardBg, marginTop: 16 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <Users size={18} color={txt1} strokeWidth={2} />
                      <Text style={[styles.friendsFriendsTitle, { color: txt1 }]}>{tr('sosyalProfile.arkadasListem')}</Text>
                      <View style={[styles.countPill, { backgroundColor: chipBg }]}>
                        <Text style={[styles.countPillText, { color: txt1 }]}>{acceptedCount}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setShowOwnFriends(false)}>
                      <X size={20} color={txt2} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                  {friends.filter(f => f.status === 'accepted').map(entry => (
                    <View key={entry.id} style={[styles.friendRow, { borderBottomColor: cardBdr }]}>
                      {/* Avatar */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setShowOwnFriends(false);
                          navigation.navigate('SosyalProfile', { userId: entry.other_user_id });
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      >
                        <View style={[styles.friendAvatar, { backgroundColor: chipBg }]}>
                          {entry.other_avatar ? (
                            <Image
                              source={{ uri: processImageUrl(entry.other_avatar) ?? undefined }}
                              style={styles.friendAvatarImg}
                            />
                          ) : (
                            <Text style={[styles.friendAvatarText, { color: txt1 }]}>
                              {entry.other_name.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.friendInfo}>
                          <Text style={[styles.friendName, { color: txt1 }]}>{entry.other_name}</Text>
                          <Text style={[styles.friendUsername, { color: txt2 }]}>@{entry.other_username}</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Çıkar Butonu */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => handleRemoveFriend(entry.id, entry.other_name)}
                        style={[styles.removeFriendBtn, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }]}
                      >
                        <X size={14} color="#ef4444" strokeWidth={2.5} />
                        <Text style={[styles.removeFriendText, { color: '#ef4444' }]}>{tr('sosyalProfile.cikar')}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ── "⋯" Daha Fazla Menüsü ── */}
      <Modal
        visible={moreMenuVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMoreMenuVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          activeOpacity={1}
          onPress={() => setMoreMenuVisible(false)}
        >
          <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingBottom: 24 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: chipBg, alignSelf: 'center', marginBottom: 12 }} />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
              onPress={() => { setMoreMenuVisible(false); setReportModalVisible(true); }}
            >
              <Flag size={20} color={txt1} strokeWidth={2} />
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: txt1 }}>{tr('sosyalProfile.sikayetEt')}</Text>
              <ChevronRight size={18} color={txt2} strokeWidth={2} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: cardBdr, marginHorizontal: 20 }} />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 }}
              disabled={blockActionLoading}
              onPress={() => { setMoreMenuVisible(false); handleToggleBlock(); }}
            >
              {isBlocked ? (
                <ShieldCheck size={20} color={txt1} strokeWidth={2} />
              ) : (
                <ShieldOff size={20} color="#e74c3c" strokeWidth={2} />
              )}
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: isBlocked ? txt1 : '#e74c3c' }}>
                {isBlocked ? tr('sosyalProfile.engeliKaldir') : tr('sosyalProfile.kullaniciyiEngelle')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 8, marginHorizontal: 20, paddingVertical: 14, borderRadius: 14, backgroundColor: chipBg, alignItems: 'center' }}
              onPress={() => setMoreMenuVisible(false)}
            >
              <Text style={{ fontSize: 15, fontWeight: '700', color: txt1 }}>{tr('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Şikayet Et Modalı ── */}
      <Modal
        visible={reportModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 32, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: txt1 }}>{tr('sosyalProfile.sikayetEt')}</Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={22} color={txt2} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', color: txt2, marginBottom: 10 }}>{tr('sosyalProfile.sikayetSebebi')}</Text>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 }}
                onPress={() => setReportReason(r.key)}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                  borderColor: reportReason === r.key ? amber : cardBdr,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {reportReason === r.key && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: amber }} />}
                </View>
                <Text style={{ fontSize: 15, color: txt1, fontWeight: reportReason === r.key ? '700' : '500' }}>{r.label}</Text>
              </TouchableOpacity>
            ))}

            <Text style={{ fontSize: 13, fontWeight: '700', color: txt2, marginTop: 8, marginBottom: 8 }}>{tr('sosyalProfile.sikayetDetayIsteğeBagli')}</Text>
            <TextInput
              value={reportDetail}
              onChangeText={setReportDetail}
              placeholder={tr('sosyalProfile.sikayetDetayPlaceholder')}
              placeholderTextColor={txt2}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1, borderColor: cardBdr, borderRadius: 14, padding: 12,
                minHeight: 80, textAlignVertical: 'top', color: txt1, fontSize: 14, marginBottom: 16,
              }}
            />

            <TouchableOpacity
              style={{
                backgroundColor: reportReason ? '#e74c3c' : chipBg,
                borderRadius: 14, paddingVertical: 15, alignItems: 'center',
              }}
              disabled={!reportReason || reportSubmitting}
              onPress={handleSubmitReport}
            >
              {reportSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: '800', color: reportReason ? '#fff' : txt2 }}>{tr('sosyalProfile.sikayetiGonder')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Arkadaş Profil Modalı ── */}
      <Modal
        visible={!!selectedFriend}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedFriend(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSelectedFriend(null)}
        />
        {selectedFriend && (
          <View style={[styles.friendModalSheet, { backgroundColor: cardBg, borderColor: cardBdr }]}>
            {/* Tutma çubuğu */}
            <View style={[styles.sheetHandle, { backgroundColor: cardBdr }]} />

            {/* Kapat butonu */}
            <TouchableOpacity
              onPress={() => setSelectedFriend(null)}
              style={[styles.sheetCloseBtn, { backgroundColor: chipBg }]}
            >
              <X size={16} color={txt2} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={[styles.sheetAvatar, { borderColor: cardBdr, backgroundColor: chipBg }]}>
              {selectedFriend.other_avatar ? (
                <Image
                  source={{ uri: processImageUrl(selectedFriend.other_avatar) ?? undefined }}
                  style={styles.sheetAvatarImg}
                />
              ) : (
                <View style={[styles.sheetAvatarGradient, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.sheetAvatarInitial, { color: ctaTxt }]}>
                    {selectedFriend.other_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.sheetName, { color: txt1 }]}>{selectedFriend.other_name}</Text>
            <Text style={[styles.sheetUsername, { color: txt2 }]}>@{selectedFriend.other_username}</Text>

            {/* Durum rozeti */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig[selectedFriend.status].bg, marginBottom: 20 }]}>
              {statusConfig[selectedFriend.status].icon}
              <Text style={[styles.statusText, { color: statusConfig[selectedFriend.status].color }]}>
                {tr(statusConfig[selectedFriend.status].labelKey)}
              </Text>
            </View>

            {/* Bento istatistikler */}
            {friendStatsLoading ? (
              <ActivityIndicator color={txt1} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.sheetBentoRow}>
                <View style={[styles.sheetBentoCard, cardBorder, { backgroundColor: chipBg }]}>
                  <Camera size={18} color={txt1} strokeWidth={2} />
                  <Text style={[styles.sheetBentoValue, { color: txt1 }]}>{friendSnapCount}</Text>
                  <Text style={[styles.sheetBentoLabel, { color: txt2 }]}>{tr('sosyalProfile.kivilcim')}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    if (!showFriendsFriends) {
                      loadFriendsFriends(selectedFriend.other_user_id);
                      setShowFriendsFriends(true);
                    } else {
                      setShowFriendsFriends(false);
                    }
                  }}
                  style={[styles.sheetBentoCard, cardBorder, { backgroundColor: chipBg }]}
                >
                  <Users size={18} color={txt1} strokeWidth={2} />
                  <Text style={[styles.sheetBentoValue, { color: txt1 }]}>{friendFriendCount}</Text>
                  <Text style={[styles.sheetBentoLabel, { color: txt2 }]}>{tr('sosyalProfile.arkadas')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Arkadaşlarının listesi */}
            {showFriendsFriends && (
              <View style={[styles.friendsFriendsContainer, cardBorder, { backgroundColor: chipBg }]}>
                <Text style={[styles.friendsFriendsTitle, { color: txt1 }]}>{tr('sosyalProfile.arkadaslariSayi', { count: friendsFriends.length })}</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {friendsFriends.map((ff) => (
                    <TouchableOpacity
                      key={ff.id}
                      onPress={() => {
                        setSelectedFriend(null);
                        setShowFriendsFriends(false);
                        navigation.navigate('SosyalProfile', { userId: ff.other_user_id });
                      }}
                      style={[styles.friendsFriendRow, { borderBottomColor: cardBdr }]}
                    >
                      <View style={[styles.friendAvatar, { backgroundColor: cardBg }]}>
                        {ff.other_avatar ? (
                          <Image source={{ uri: processImageUrl(ff.other_avatar) ?? undefined }} style={styles.friendAvatarImg} />
                        ) : (
                          <Text style={[styles.friendAvatarText, { color: txt1 }]}>{ff.other_name.charAt(0).toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.friendName, { color: txt1 }]}>{ff.other_name}</Text>
                        <Text style={[styles.friendUsername, { color: txt2 }]}>@{ff.other_username}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Mesaj Gönder butonu — sadece karşılıklı arkadaşsa aktif */}
            {selectedFriend.status === 'accepted' ? (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.sheetMsgBtn}
                onPress={() => {
                  setSelectedFriend(null);
                  navigation.navigate('Chat', {
                    userId: selectedFriend.other_user_id,
                    userName: selectedFriend.other_name,
                    userAvatar: selectedFriend.other_avatar || '',
                    username: selectedFriend.other_username || ''
                  });
                }}
              >
                <LinearGradient
                  colors={isDark ? ['#3A2A1A', '#2F2418'] : [Editorial.ink, Editorial.coffee]}
                  style={styles.sheetMsgGradient}
                >
                  <MessageCircle size={18} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.sheetMsgText}>{tr('sosyalProfile.mesajGonder')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={[styles.sheetMsgBtn, { opacity: 0.45 }]}>
                <View style={[styles.sheetMsgGradient, { backgroundColor: chipBg, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }]}>
                  <MessageCircle size={18} color={txt2} strokeWidth={2} />
                  <Text style={[styles.sheetMsgText, { color: txt2 }]}>
                    {tr('sosyalProfile.karsilikliArkadasOlun')}
                  </Text>
                </View>
              </View>
            )}

            {/* Arkadaşı Çıkar / İsteği Geri Al butonu */}
            {isOwnProfile && (
              <>
                {selectedFriend.status === 'accepted' && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[styles.sheetRemoveBtn, { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,20,0.04)', 
                      borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#111114' 
                    }]}
                    onPress={() => handleRemoveFriend(selectedFriend.id, selectedFriend.other_name)}
                  >
                    <UserPlus size={16} color={isDark ? '#F5F5F7' : '#111114'} strokeWidth={2} />
                    <Text style={[styles.sheetRemoveText, { color: isDark ? '#F5F5F7' : '#111114' }]}>{tr('sosyalProfile.arkadasiCikar')}</Text>
                  </TouchableOpacity>
                )}
                {selectedFriend.status === 'pending_sent' && (
                  <TouchableOpacity
                    activeOpacity={0.88}
                    style={[styles.sheetRemoveBtn, { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,17,20,0.04)', 
                      borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#111114' 
                    }]}
                    onPress={() => handleCancelRequest(selectedFriend.id, selectedFriend.other_name)}
                  >
                    <X size={16} color={isDark ? '#F5F5F7' : '#111114'} strokeWidth={2.5} />
                    <Text style={[styles.sheetRemoveText, { color: isDark ? '#F5F5F7' : '#111114' }]}>{tr('sosyalProfile.istegiGeriAl')}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <View style={{ height: Platform.OS === 'ios' ? 24 : 16 }} />
          </View>
        )}
      </Modal>
    </View>
  );
};

// ─── Stiller ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // Profil kartı
  profileCard: {
    borderRadius: 24,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.5,
    overflow: 'hidden',
  },
  avatarCameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 12,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  platformBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Gizlilik Kartı
  privacyCard: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  privacyDesc: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Bento
  bentoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bentoCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'center',
  },
  bentoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  bentoValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  bentoLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Arkadaş listesi kartı
  friendListCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 4,
  },
  friendListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  friendListTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Arkadaş satırı
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  friendAvatarImg: { width: '100%', height: '100%' },
  friendAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  friendInfo: { flex: 1 },
  friendName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  emptyFriends: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyFriendsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Arkadaş Profil Modalı ─────────────────────────────────────────────────
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  friendModalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  sheetCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sheetAvatarImg: { width: '100%', height: '100%' },
  sheetAvatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarInitial: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },
  sheetName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  sheetUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  sheetBentoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  sheetBentoCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  sheetBentoValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sheetBentoLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  sheetMsgBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  sheetMsgGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  sheetMsgText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  sheetRemoveBtn: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sheetRemoveText: {
    fontSize: 14,
    fontWeight: '700',
  },
  friendsFriendsContainer: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  friendsFriendsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  friendsFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  removeFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  removeFriendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default SosyalProfileScreen;
