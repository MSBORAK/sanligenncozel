import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Users, Camera, Clock, Star, UserCheck, UserPlus, Hourglass, MessageCircle, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase, processImageUrl, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Renk Sistemi ───────────────────────────────────────────────────────────

const AMBER = {
  vivid:  '#f59e0b',
  warm:   '#fbbf24',
  glow:   'rgba(245,158,11,0.25)',
  border: 'rgba(245,158,11,0.35)',
  text:   '#fcd34d',
  deep:   'rgba(120,53,15,0.4)',
};

const DARK = {
  bg:       '#060c1a',
  surface:  'rgba(255,255,255,0.06)',
  border:   'rgba(255,255,255,0.10)',
  text:     '#f1f5f9',
  textSub:  'rgba(241,245,249,0.55)',
};

const LIGHT = {
  bg:       '#f8fafc',
  surface:  'rgba(255,255,255,0.92)',
  border:   'rgba(148,163,184,0.18)',
  text:     '#1e293b',
  textSub:  '#64748b',
  accent:   '#60a5fa',
};

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
  const theme = isDark ? DARK : LIGHT;
  const accentColor = accent ?? (isDark ? AMBER.warm : LIGHT.accent);

  return (
    <BlurView
      intensity={isDark ? 18 : 30}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.bentoCard,
        {
          flex,
          borderColor: isDark ? AMBER.border : LIGHT.border,
          backgroundColor: isDark ? DARK.surface : LIGHT.surface,
        },
      ]}
    >
      <View style={[styles.bentoIconWrap, { backgroundColor: isDark ? AMBER.glow : `${accentColor}18` }]}>
        {icon}
      </View>
      <Text style={[styles.bentoValue, { color: accentColor }]}>{value}</Text>
      <Text style={[styles.bentoLabel, { color: theme.textSub }]}>{label}</Text>
    </BlurView>
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
    label: 'Karşılıklı Arkadaş',
    bg: 'rgba(16,185,129,0.15)',
    color: '#10b981',
    icon: <UserCheck size={11} color="#10b981" strokeWidth={2.5} />,
  },
  pending_sent: {
    label: 'Bekliyor',
    bg: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    icon: <Hourglass size={11} color="#f59e0b" strokeWidth={2.5} />,
  },
  pending_received: {
    label: 'İstek Var',
    bg: 'rgba(96,165,250,0.15)',
    color: '#60a5fa',
    icon: <UserPlus size={11} color="#60a5fa" strokeWidth={2.5} />,
  },
};

const FriendRow = ({ entry, isDark, onPress }: FriendRowProps) => {
  const theme = isDark ? DARK : LIGHT;
  const cfg = statusConfig[entry.status];
  const initial = entry.other_name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(entry)}
      style={[styles.friendRow, { borderBottomColor: theme.border }]}
    >
      {/* Avatar */}
      <View style={[styles.friendAvatar, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.15)' }]}>
        {entry.other_avatar ? (
          <Image
            source={{ uri: processImageUrl(entry.other_avatar) ?? undefined }}
            style={styles.friendAvatarImg}
          />
        ) : (
          <Text style={[styles.friendAvatarText, { color: isDark ? AMBER.warm : LIGHT.accent }]}>
            {initial}
          </Text>
        )}
      </View>

      {/* İsim + kullanıcı adı */}
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: theme.text }]}>{entry.other_name}</Text>
        <Text style={[styles.friendUsername, { color: theme.textSub }]}>@{entry.other_username}</Text>
      </View>

      {/* Durum rozeti */}
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        {cfg.icon}
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Ana Ekran ───────────────────────────────────────────────────────────────

const SosyalProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { profile, refreshProfile } = useUser();
  const theme = isDark ? DARK : LIGHT;

  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [snapCount, setSnapCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Arkadaş profil modalı
  const [selectedFriend, setSelectedFriend] = useState<FriendEntry | null>(null);
  const [friendSnapCount, setFriendSnapCount] = useState(0);
  const [friendFriendCount, setFriendFriendCount] = useState(0);
  const [friendStatsLoading, setFriendStatsLoading] = useState(false);

  const handleFriendPress = useCallback(async (entry: FriendEntry) => {
    setSelectedFriend(entry);
    setFriendStatsLoading(true);
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

  const handleAvatarPress = useCallback(() => {
    Alert.alert('Profil Fotoğrafı', 'Nasıl yüklemek istersin?', [
      {
        text: 'Galeriden Seç',
        onPress: () => pickAvatar('gallery'),
      },
      {
        text: 'Kamera ile Çek',
        onPress: () => pickAvatar('camera'),
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  }, []);

  const pickAvatar = useCallback(async (source: 'gallery' | 'camera') => {
    if (!profile?.userId) return;

    let result;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('İzin Gerekli', 'Kamera erişimine izin ver.');
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
        Alert.alert('İzin Gerekli', 'Galeri erişimine izin ver.');
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
      if (!authToken) throw new Error('Oturum bulunamadı');

      // Dosyayı yükle
      const fileName = `avatars/${profile.userId}_${Date.now()}.jpg`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/snaps/${fileName}`;

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
        throw new Error(`Yükleme hatası: ${errText}`);
      }

      // Public URL al
      const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // user_profiles tablosunu güncelle
      await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', profile.userId);

      // UserContext'i yenile
      await refreshProfile();
      Alert.alert('Başarılı', 'Profil fotoğrafın güncellendi!');
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setAvatarUploading(false);
    }
  }, [profile?.userId, refreshProfile]);

  const fetchData = useCallback(async () => {
    if (!profile?.userId) return;
    try {
      // Snap sayısı
      const { count: snaps } = await supabase
        .from('social_posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.userId);

      setSnapCount(snaps ?? 0);

      // Arkadaşlık listesi — önce raw kayıtları çek, sonra profilleri ayrı sorgula
      const { data: friendships } = await supabase
        .from('friendships')
        .select('id, sender_id, receiver_id, status')
        .or(`sender_id.eq.${profile.userId},receiver_id.eq.${profile.userId}`)
        .neq('status', 'rejected');

      if (friendships && friendships.length > 0) {
        // Karşı taraf user_id'lerini topla
        const otherIds = friendships.map((f: any) =>
          f.sender_id === profile.userId ? f.receiver_id : f.sender_id
        );

        // Profilleri tek sorguda çek
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url')
          .in('user_id', otherIds);

        const profileMap: Record<string, any> = {};
        (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p; });

        const mapped: FriendEntry[] = friendships.map((f: any) => {
          const isSender = f.sender_id === profile.userId;
          const otherId = isSender ? f.receiver_id : f.sender_id;
          const otherProfile = profileMap[otherId];

          let status: FriendEntry['status'] = 'accepted';
          if (f.status === 'pending') {
            status = isSender ? 'pending_sent' : 'pending_received';
          }

          return {
            id: f.id,
            other_user_id: otherId,
            other_name: otherProfile?.name ?? 'Kullanıcı',
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
  }, [profile?.userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const acceptedCount = friends.filter(f => f.status === 'accepted').length;
  const pendingCount = friends.filter(f => f.status !== 'accepted').length;

  const accentColor = isDark ? AMBER.warm : LIGHT.accent;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Arka plan dekoratif gradyan */}
      {isDark && (
        <LinearGradient
          colors={['rgba(120,53,15,0.18)', 'transparent', 'rgba(245,158,11,0.06)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
        />
      )}

      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={22} color={accentColor} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>ŞanlıSosyal Profilim</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
        >
          {/* Profil Kartı */}
          <BlurView
            intensity={isDark ? 20 : 35}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.profileCard,
              {
                borderColor: isDark ? AMBER.border : LIGHT.border,
                backgroundColor: isDark ? DARK.surface : LIGHT.surface,
              },
            ]}
          >
            {/* Avatar — tıklanabilir */}
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleAvatarPress}
              style={{ marginBottom: 14 }}
              disabled={avatarUploading}
            >
              <View style={[styles.avatarCircle, { borderColor: isDark ? AMBER.vivid : LIGHT.accent, marginBottom: 0 }]}>
                {avatarUploading ? (
                  <View style={[styles.avatarGradient, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                    <ActivityIndicator color={isDark ? AMBER.warm : LIGHT.accent} />
                  </View>
                ) : profile?.avatarUrl ? (
                  <Image
                    source={{ uri: processImageUrl(profile.avatarUrl) ?? undefined }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <LinearGradient
                    colors={isDark ? ['#f59e0b', '#d97706'] : ['#60a5fa', '#3b82f6']}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarInitial}>
                      {profile?.name?.charAt(0).toUpperCase() ?? 'S'}
                    </Text>
                  </LinearGradient>
                )}
              </View>
              {/* Kamera ikonu rozeti */}
              <View style={[styles.avatarCameraBtn, { backgroundColor: isDark ? AMBER.vivid : LIGHT.accent }]}>
                <Camera size={12} color="#fff" strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <Text style={[styles.profileName, { color: theme.text }]}>
              {profile?.name ?? 'Kullanıcı'}
            </Text>
            <Text style={[styles.profileUsername, { color: accentColor }]}>
              @{profile?.username ?? ''}
            </Text>

            {/* Platform rozeti */}
            <View style={[styles.platformBadge, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.12)', borderColor: isDark ? AMBER.border : 'rgba(96,165,250,0.25)' }]}>
              <Star size={11} color={accentColor} strokeWidth={2.5} fill={accentColor} />
              <Text style={[styles.platformBadgeText, { color: accentColor }]}>ŞanlıSosyal Üyesi</Text>
            </View>
          </BlurView>

          {/* Bento İstatistikler */}
          {loading ? (
            <ActivityIndicator color={accentColor} style={{ marginVertical: 24 }} />
          ) : (
            <>
              <View style={styles.bentoRow}>
                <BentoCard
                  icon={<Camera size={20} color={isDark ? AMBER.warm : LIGHT.accent} strokeWidth={2} />}
                  value={snapCount}
                  label="Kıvılcım"
                  isDark={isDark}
                />
                <View style={{ width: 10 }} />
                <BentoCard
                  icon={<Users size={20} color={isDark ? AMBER.warm : LIGHT.accent} strokeWidth={2} />}
                  value={acceptedCount}
                  label="Arkadaş"
                  isDark={isDark}
                />
              </View>

              <View style={styles.bentoRow}>
                <BentoCard
                  icon={<Clock size={20} color={isDark ? '#a78bfa' : '#8b5cf6'} strokeWidth={2} />}
                  value={pendingCount}
                  label="Bekleyen İstek"
                  isDark={isDark}
                  accent={isDark ? '#a78bfa' : '#8b5cf6'}
                />
                <View style={{ width: 10 }} />
                <BentoCard
                  icon={<Star size={20} color={isDark ? '#fb923c' : '#f97316'} strokeWidth={2} />}
                  value="Anlık"
                  label="İçerik Modu"
                  isDark={isDark}
                  accent={isDark ? '#fb923c' : '#f97316'}
                />
              </View>

              {/* Arkadaş Listesi */}
              <View style={[styles.friendListCard, { borderColor: isDark ? DARK.border : LIGHT.border, backgroundColor: isDark ? DARK.surface : LIGHT.surface }]}>
                <View style={styles.friendListHeader}>
                  <Users size={16} color={accentColor} strokeWidth={2} />
                  <Text style={[styles.friendListTitle, { color: theme.text }]}>Arkadaş Listesi</Text>
                  <View style={[styles.countPill, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.12)' }]}>
                    <Text style={[styles.countPillText, { color: accentColor }]}>{friends.length}</Text>
                  </View>
                </View>

                {friends.length === 0 ? (
                  <View style={styles.emptyFriends}>
                    <UserPlus size={32} color={theme.textSub} strokeWidth={1.5} />
                    <Text style={[styles.emptyFriendsText, { color: theme.textSub }]}>
                      Henüz arkadaş yok.{'\n'}ŞanlıSosyal'den arkadaş ekleyebilirsin.
                    </Text>
                  </View>
                ) : (
                  friends.map(entry => (
                    <FriendRow key={entry.id} entry={entry} isDark={isDark} onPress={handleFriendPress} />
                  ))
                )}
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

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
          <View style={[styles.friendModalSheet, { backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? AMBER.border : LIGHT.border }]}>
            {/* Tutma çubuğu */}
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

            {/* Kapat butonu */}
            <TouchableOpacity
              onPress={() => setSelectedFriend(null)}
              style={[styles.sheetCloseBtn, { backgroundColor: isDark ? DARK.surface : LIGHT.surface }]}
            >
              <X size={16} color={isDark ? DARK.textSub : LIGHT.textSub} strokeWidth={2.5} />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={[styles.sheetAvatar, { borderColor: isDark ? AMBER.vivid : LIGHT.accent, backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.15)' }]}>
              {selectedFriend.other_avatar ? (
                <Image
                  source={{ uri: processImageUrl(selectedFriend.other_avatar) ?? undefined }}
                  style={styles.sheetAvatarImg}
                />
              ) : (
                <LinearGradient
                  colors={isDark ? ['#f59e0b', '#d97706'] : ['#60a5fa', '#3b82f6']}
                  style={styles.sheetAvatarGradient}
                >
                  <Text style={styles.sheetAvatarInitial}>
                    {selectedFriend.other_name.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}
            </View>

            <Text style={[styles.sheetName, { color: theme.text }]}>{selectedFriend.other_name}</Text>
            <Text style={[styles.sheetUsername, { color: accentColor }]}>@{selectedFriend.other_username}</Text>

            {/* Durum rozeti */}
            <View style={[styles.statusBadge, { backgroundColor: statusConfig[selectedFriend.status].bg, marginBottom: 20 }]}>
              {statusConfig[selectedFriend.status].icon}
              <Text style={[styles.statusText, { color: statusConfig[selectedFriend.status].color }]}>
                {statusConfig[selectedFriend.status].label}
              </Text>
            </View>

            {/* Bento istatistikler */}
            {friendStatsLoading ? (
              <ActivityIndicator color={accentColor} style={{ marginVertical: 16 }} />
            ) : (
              <View style={styles.sheetBentoRow}>
                <View style={[styles.sheetBentoCard, { backgroundColor: isDark ? DARK.surface : LIGHT.surface, borderColor: isDark ? DARK.border : LIGHT.border }]}>
                  <Camera size={18} color={accentColor} strokeWidth={2} />
                  <Text style={[styles.sheetBentoValue, { color: accentColor }]}>{friendSnapCount}</Text>
                  <Text style={[styles.sheetBentoLabel, { color: isDark ? DARK.textSub : LIGHT.textSub }]}>Kıvılcım</Text>
                </View>
                <View style={[styles.sheetBentoCard, { backgroundColor: isDark ? DARK.surface : LIGHT.surface, borderColor: isDark ? DARK.border : LIGHT.border }]}>
                  <Users size={18} color={accentColor} strokeWidth={2} />
                  <Text style={[styles.sheetBentoValue, { color: accentColor }]}>{friendFriendCount}</Text>
                  <Text style={[styles.sheetBentoLabel, { color: isDark ? DARK.textSub : LIGHT.textSub }]}>Arkadaş</Text>
                </View>
              </View>
            )}

            {/* Mesaj Gönder butonu — sadece karşılıklı arkadaşsa aktif */}
            {selectedFriend.status === 'accepted' ? (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.sheetMsgBtn}
                onPress={() => {
                  setSelectedFriend(null);
                  navigation.navigate('Chat', { userId: selectedFriend.other_user_id, userName: selectedFriend.other_name });
                }}
              >
                <LinearGradient
                  colors={isDark ? ['#f59e0b', '#d97706'] : ['#60a5fa', '#818cf8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sheetMsgGradient}
                >
                  <MessageCircle size={18} color="#fff" strokeWidth={2} />
                  <Text style={styles.sheetMsgText}>Mesaj Gönder</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={[styles.sheetMsgBtn, { opacity: 0.45 }]}>
                <View style={[styles.sheetMsgGradient, { backgroundColor: isDark ? DARK.surface : LIGHT.surface, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }]}>
                  <MessageCircle size={18} color={isDark ? DARK.textSub : LIGHT.textSub} strokeWidth={2} />
                  <Text style={[styles.sheetMsgText, { color: isDark ? DARK.textSub : LIGHT.textSub }]}>
                    Mesajlaşmak için karşılıklı arkadaş olun
                  </Text>
                </View>
              </View>
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
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 14,
    overflow: 'hidden',
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

  // Bento
  bentoRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bentoCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
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
});

export default SosyalProfileScreen;
