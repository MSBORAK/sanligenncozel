/**
 * ŞanlıSosyal — Ana Ekran İskeleti
 *
 * Felsefe: Anlık · Doğal · Geçici
 *  - Galeri erişimi YOK, sadece kamera
 *  - Her snap 4 saat sonra otomatik silinir
 *  - İki katmanlı deneyim: Arkadaş Akışı + Şehir Radarı (heatmap)
 *  - Anonim şehir verisi, kişisel arkadaş bağı
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Camera,
  Radio,
  Users,
  MapPin,
  Clock,
  Flame,
  UserPlus,
  Bell,
  Plus,
  MessageCircle,
  Search,
  Check,
  X as XIcon,
} from 'lucide-react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Heatmap } from 'react-native-maps';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { processImageUrl } from '@/lib/supabase';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface SnapPost {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatarColor: string; // Renk kodu — gerçek avatar yokken kullanılır
  };
  imageUri: string; // Kameradan gelen anlık fotoğraf URI
  location: {
    lat: number;
    lng: number;
    label?: string; // "Kapalıçarşı bölgesi" gibi anonim bölge adı
  };
  created_at: Date;
  expires_at: Date; // created_at + 4 saat — kesin kural
  seen: boolean;
}

export interface HeatPoint {
  latitude: number;
  longitude: number;
  weight: number; // 0-1 arası yoğunluk
}

// Mesajlaşma tipleri
interface UserProfile {
  user_id: string;
  name: string;
  username: string;
  avatar_url?: string;
}

interface Conversation {
  conversation_id: string;
  other_user: UserProfile;
  last_message: {
    content: string;
    created_at: string;
    sender_id: string;
    is_snap?: boolean;
  } | null;
  unread_count: number;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_profile?: UserProfile;
}

// ─────────────────────────────────────────────
// MOCK DATA — Gerçek backend entegrasyonuna kadar
// ─────────────────────────────────────────────

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const hoursLater = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

export const MOCK_SNAPS: SnapPost[] = [
  {
    id: '1',
    user: { id: 'u1', name: 'Merve S.', username: 'mervesudo', avatarColor: '#f59e0b' },
    imageUri: 'https://picsum.photos/seed/urfa1/400/500',
    location: { lat: 37.1591, lng: 38.7969, label: 'Tarihi Çarşı' },
    created_at: hoursAgo(1),
    expires_at: hoursLater(3),
    seen: false,
  },
  {
    id: '2',
    user: { id: 'u2', name: 'Ahmet K.', username: 'ahmetk', avatarColor: '#10b981' },
    imageUri: 'https://picsum.photos/seed/urfa2/400/500',
    location: { lat: 37.1678, lng: 38.7945, label: 'Balıklıgöl' },
    created_at: hoursAgo(2),
    expires_at: hoursLater(2),
    seen: false,
  },
  {
    id: '3',
    user: { id: 'u3', name: 'Zeynep A.', username: 'zeynepа', avatarColor: '#f472b6' },
    imageUri: 'https://picsum.photos/seed/urfa3/400/500',
    location: { lat: 37.1550, lng: 38.8001, label: 'Kapalıçarşı' },
    created_at: hoursAgo(0.5),
    expires_at: hoursLater(3.5),
    seen: true,
  },
  {
    id: '4',
    user: { id: 'u4', name: 'Yusuf D.', username: 'yusufd', avatarColor: '#8b5cf6' },
    imageUri: 'https://picsum.photos/seed/urfa4/400/500',
    location: { lat: 37.1620, lng: 38.7900, label: 'Atatürk Caddesi' },
    created_at: hoursAgo(1.5),
    expires_at: hoursLater(2.5),
    seen: true,
  },
];

// Şehir Radarı için anonim ısı noktaları (Şanlıurfa merkezi)
export const MOCK_HEAT_POINTS: HeatPoint[] = [
  { latitude: 37.1591, longitude: 38.7969, weight: 1.0 },   // Tarihi Çarşı — çok yoğun
  { latitude: 37.1678, longitude: 38.7945, weight: 0.85 },  // Balıklıgöl
  { latitude: 37.1550, longitude: 38.8001, weight: 0.7 },   // Kapalıçarşı
  { latitude: 37.1620, longitude: 38.7900, weight: 0.6 },
  { latitude: 37.1700, longitude: 38.8050, weight: 0.45 },
  { latitude: 37.1480, longitude: 38.7850, weight: 0.3 },
  { latitude: 37.1730, longitude: 38.7800, weight: 0.55 },
  { latitude: 37.1600, longitude: 38.8100, weight: 0.4 },
  { latitude: 37.1560, longitude: 38.7920, weight: 0.8 },
  { latitude: 37.1650, longitude: 38.8000, weight: 0.65 },
];

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SNAP_EXPIRES_MS = 4 * 60 * 60 * 1000; // 4 saat

// Amber sistem paleti — ŞanlıSosyal'in renk kimliği
const AMBER = {
  vivid:   '#f59e0b',
  warm:    '#fbbf24',
  glow:    'rgba(245,158,11,0.25)',
  border:  'rgba(245,158,11,0.35)',
  text:    '#fcd34d',
  light:   'rgba(252,211,77,0.12)',
  deep:    'rgba(120,53,15,0.4)',
};

const DARK = {
  bg:        '#060c1a',
  surface:   'rgba(255,255,255,0.05)',
  surfaceHi: 'rgba(255,255,255,0.09)',
  border:    'rgba(255,255,255,0.10)',
  text:      '#f1f5f9',
  textSub:   'rgba(241,245,249,0.55)',
  glass:     'rgba(6, 12, 26, 0.65)',
  tabBg:     'rgba(255,255,255,0.06)',
  tabActiveBg:'rgba(245,158,11,0.16)',
  accentSoft: 'rgba(245,158,11,0.10)',
};

const LIGHT = {
  bg: '#f8fafc',
  surface: 'rgba(255,255,255,0.92)',
  surfaceHi: '#ffffff',
  border: 'rgba(148,163,184,0.18)',
  text: '#1e293b',
  textSub: '#64748b',
  glass: 'rgba(255,255,255,0.72)',
  card: '#ffffff',
  amberSoft: 'rgba(96,165,250,0.10)',
  amberBorder: 'rgba(96,165,250,0.16)',
  accent: '#60a5fa',
  accentSoft: 'rgba(96,165,250,0.10)',
  tabBg: 'rgba(255,255,255,0.92)',
  tabActiveBg: '#ffffff',
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** 4h süresinin ne kadarının geçtiğini 0-1 arasında döndürür */
function getExpiryProgress(snap: SnapPost, referenceTime: Date = new Date()): number {
  const total = SNAP_EXPIRES_MS;
  const elapsed = referenceTime.getTime() - snap.created_at.getTime();
  return Math.min(1, Math.max(0, elapsed / total));
}

/** Kalan süreyi "3s 42d" formatında gösterir */
function formatTimeLeft(snap: SnapPost, referenceTime: Date = new Date()): string {
  const msLeft = snap.expires_at.getTime() - referenceTime.getTime();
  if (msLeft <= 0) return 'Süre doldu';
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h > 0) return `${h}s ${m}d`;
  return `${m}d`;
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: CountdownRing
// Snap'in kalan ömrünü dairesel çember olarak gösterir
// ─────────────────────────────────────────────

interface CountdownRingProps {
  progress: number; // 0 (yeni) → 1 (süresi dolmuş)
  size?: number;
  strokeWidth?: number;
  seen?: boolean;
}

function CountdownRing({ progress, size = 58, strokeWidth = 2.5, seen = false }: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = circumference * (1 - progress);

  // Renk: yeni → amber, eski → soluk
  const ringColor = seen
    ? DARK.textSub
    : progress < 0.5
    ? AMBER.warm
    : progress < 0.75
    ? '#f97316'   // turuncu — az kaldı
    : '#ef4444';  // kırmızı — kritik

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* SVG benzeri çember — RN'de gerçek SVG için react-native-svg gerekir;
          bu iskelet versiyonda dairesel border simüle edilir */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: seen ? DARK.border : ringColor,
          alignItems: 'center',
          justifyContent: 'center',
          borderStyle: 'solid',
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: SnapCard
// Arkadaş akışındaki her bir snap kartı
// ─────────────────────────────────────────────

interface SnapCardProps {
  snap: SnapPost;
  onPress: (snap: SnapPost) => void;
  isDark: boolean;
}

function SnapCard({ snap, onPress, isDark }: SnapCardProps) {
  const progress = getExpiryProgress(snap);
  const timeLeft = formatTimeLeft(snap);
  const theme = isDark ? DARK : LIGHT;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPress(snap)}
      style={styles.snapCardOuter}
    >
      <View style={styles.snapCardBlur}>
        {/* Amber iç border glow */}
        <View style={[
          styles.snapCardInner,
          !snap.seen && [
            styles.snapCardUnseen,
            !isDark && styles.snapCardUnseenLight,
          ],
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}>
          {/* Fotoğraf Alanı */}
          <View style={[styles.snapImageContainer, { backgroundColor: isDark ? '#1a1f2e' : '#eef2ff' }]}>
            <Image
              source={{ uri: snap.imageUri }}
              style={styles.snapImage}
              resizeMode="cover"
            />
            {/* Kalan süre etiketi */}
            <View style={[styles.snapTimeTag, { backgroundColor: isDark ? 'rgba(6,12,26,0.7)' : 'rgba(255,255,255,0.86)', borderColor: isDark ? AMBER.border : LIGHT.border }]}>
              <Clock color={isDark ? AMBER.warm : LIGHT.accent} size={10} strokeWidth={2.5} />
              <Text style={[styles.snapTimeText, { color: isDark ? AMBER.warm : LIGHT.accent }]}>{timeLeft}</Text>
            </View>
            {/* Alt gradient overlay */}
            <LinearGradient
              colors={isDark ? ['transparent', 'rgba(6,12,26,0.78)'] : ['transparent', 'rgba(248,250,252,0.22)']}
              style={styles.snapImageOverlay}
            />
          </View>

          {/* Kullanıcı Bilgisi */}
            <View style={[styles.snapFooter, { backgroundColor: theme.surface }]}>
            {/* Avatar + Countdown Ring */}
            <View style={styles.snapAvatarWrapper}>
              <CountdownRing progress={progress} size={46} seen={snap.seen} />
              <View style={[styles.snapAvatar, { backgroundColor: snap.user.avatarColor + '33' }]}>
                <Text style={[styles.snapAvatarText, { color: snap.user.avatarColor }]}>
                  {snap.user.name.charAt(0)}
                </Text>
              </View>
            </View>
            {/* İsim + Lokasyon */}
            <View style={styles.snapUserInfo}>
              <Text style={[styles.snapUserName, { color: theme.text }]}>{snap.user.name}</Text>
              <View style={styles.snapLocationRow}>
                <MapPin color={isDark ? AMBER.vivid : LIGHT.accent} size={10} strokeWidth={2.5} />
                <Text style={[styles.snapLocationText, { color: theme.textSub }]}>{snap.location.label}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: FeedView
// Arkadaş akışı — sadece arkadaşlar görünür
// ─────────────────────────────────────────────

// ─── Kompakt Radar Kartı (Akış içinde) ──────────────────────────────────────

function RadarCompactCard({ isDark, onPress }: { isDark: boolean; onPress: () => void }) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? AMBER.warm : LIGHT.accent;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.radarCardOuter}>
      <BlurView
        intensity={isDark ? 22 : 30}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.radarCardBlur, { borderColor: isDark ? AMBER.border : 'rgba(96,165,250,0.22)', backgroundColor: isDark ? DARK.surface : LIGHT.surface }]}
      >
        {/* Sol: ikon + pulse */}
        <View style={styles.radarCardLeft}>
          <Animated.View style={[styles.radarPulseRing, { transform: [{ scale: pulseAnim }], backgroundColor: isDark ? 'rgba(245,158,11,0.10)' : 'rgba(96,165,250,0.10)' }]} />
          <View style={[styles.radarIconCircle, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.15)' }]}>
            <Radio size={18} color={accentColor} strokeWidth={2} />
          </View>
        </View>

        {/* Orta: metin */}
        <View style={styles.radarCardBody}>
          <View style={styles.radarCardTitleRow}>
            <Text style={[styles.radarCardTitle, { color: theme.text }]}>Şehir Radarı</Text>
            <View style={styles.radarLiveDot} />
            <Text style={[styles.radarLiveText, { color: isDark ? '#ef4444' : '#f97316' }]}>CANLI</Text>
          </View>
          <Text style={[styles.radarCardSub, { color: theme.textSub }]}>
            Son 4 saatte {MOCK_HEAT_POINTS.length} aktif bölge
          </Text>
        </View>

        {/* Sağ: mini ısı çubuğu */}
        <View style={styles.radarCardRight}>
          <LinearGradient
            colors={isDark ? ['#22c55e', '#f59e0b', '#ef4444'] : ['#86efac', '#fbbf24', '#fb7185']}
            style={styles.radarMiniBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={[styles.radarCardArrow, { color: accentColor }]}>›</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

function FeedView({
  snaps,
  isDark,
  refreshTick,
  onSnapPress,
  onAddFriendPress,
  friends,
  onOpenRadar,
  loading,
}: {
  snaps: SnapPost[];
  isDark: boolean;
  refreshTick: number;
  onSnapPress: (snap: SnapPost) => void;
  onAddFriendPress: () => void;
  friends: UserProfile[];
  onOpenRadar: () => void;
  loading?: boolean;
}) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? AMBER.warm : LIGHT.accent;

  const renderSnap = useCallback(({ item }: { item: SnapPost }) => (
    <SnapCard snap={item} onPress={onSnapPress} isDark={isDark} />
  ), [onSnapPress, isDark]);

  return (
    <FlatList
      data={snaps}
      renderItem={renderSnap}
      keyExtractor={(item) => item.id}
      extraData={refreshTick}
      numColumns={2}
      columnWrapperStyle={styles.feedRow}
      contentContainerStyle={styles.feedContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <FeedHeader isDark={isDark} friends={friends} onAddFriendPress={onAddFriendPress} />
          <RadarCompactCard isDark={isDark} onPress={onOpenRadar} />
          {loading && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 6 }}>Snap'ler yükleniyor...</Text>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        loading ? null : <FeedEmpty isDark={isDark} onAddFriendPress={onAddFriendPress} />
      }
    />
  );
}

function FeedHeader({ isDark, friends, onAddFriendPress }: { isDark: boolean; friends: UserProfile[]; onAddFriendPress: () => void }) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? AMBER.warm : LIGHT.accent;
  return (
    <View style={styles.feedHeaderContainer}>
      <Text style={[styles.feedHeaderTitle, { color: theme.text }]}>Akış</Text>
      <Text style={[styles.feedHeaderSub, { color: theme.textSub }]}>
        Arkadaşlarının son 4 saati
      </Text>
      {friends.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', gap: 12, paddingRight: 8 }}>
            {friends.map((f) => (
              <View key={f.user_id} style={{ alignItems: 'center', gap: 4 }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(96,165,250,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: accentColor }}>
                  {f.avatar_url ? (
                    <Image source={{ uri: f.avatar_url }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                  ) : (
                    <Text style={{ color: accentColor, fontSize: 18, fontWeight: '700' }}>{f.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <Text style={{ color: theme.textSub, fontSize: 11, fontWeight: '500', maxWidth: 52 }} numberOfLines={1}>
                  {f.username || f.name}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function FeedEmpty({ isDark, onAddFriendPress }: { isDark: boolean; onAddFriendPress: () => void }) {
  const theme = isDark ? DARK : LIGHT;
  return (
    <View style={styles.emptyContainer}>
      <Users color={isDark ? AMBER.text : LIGHT.accent} size={40} strokeWidth={1.5} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz snap yok</Text>
      <Text style={[styles.emptySub, { color: theme.textSub }]}>
        Arkadaşlarını ekle ve anlık paylaşımlarını gör.
      </Text>
      <TouchableOpacity style={styles.emptyAddBtn} activeOpacity={0.85} onPress={onAddFriendPress}>
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.emptyAddBlur}>
          <UserPlus color={isDark ? AMBER.warm : LIGHT.accent} size={16} strokeWidth={2} />
          <Text style={[styles.emptyAddText, { color: isDark ? AMBER.warm : LIGHT.accent }]}>Arkadaş Ekle</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: RadarView
// Şehir Radarı — anonim heatmap katmanı
// ─────────────────────────────────────────────
// SUB-COMPONENT: MessagesView
// Senin amber/glass tasarımında mesajlaşma listesi
// ─────────────────────────────────────────────

interface MessagesViewProps {
  isDark: boolean;
  theme: typeof DARK | typeof LIGHT;
  conversations: Conversation[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching: boolean;
  searchResults: UserProfile[];
  loading: boolean;
  currentUserId: string | null;
  formatMsgTime: (t: string) => string;
  onNavigateChat: (userId: string, userName: string, userAvatar: string, username: string) => void;
  incomingRequests: FriendRequest[];
  onShowRequests: () => void;
}

function MessagesView({
  isDark, theme, conversations, searchQuery, setSearchQuery,
  isSearching, searchResults, loading, currentUserId, formatMsgTime, onNavigateChat,
  incomingRequests, onShowRequests,
}: MessagesViewProps) {
  const accentColor = isDark ? AMBER.warm : LIGHT.accent;

  const renderUserItem = (user: UserProfile) => (
    <TouchableOpacity
      key={user.user_id}
      style={[styles.msgItem, { borderBottomColor: theme.border }]}
      activeOpacity={0.75}
      onPress={() => Alert.alert(
        user.name,
        `@${user.username} ile mesajlaşmak için önce arkadaşlık isteği göndermelisin.`,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'İstek Gönder', onPress: () => onNavigateChat(user.user_id, user.name, '', user.username) },
        ]
      )}
    >
      <View style={[styles.msgAvatar, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.15)' }]}>
        {user.avatar_url ? (
          <Image source={{ uri: processImageUrl(user.avatar_url) ?? undefined }} style={styles.msgAvatarImg} />
        ) : (
          <Text style={[styles.msgAvatarText, { color: accentColor }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.msgInfo}>
        <Text style={[styles.msgName, { color: theme.text }]}>{user.name}</Text>
        <Text style={[styles.msgSub, { color: theme.textSub }]}>@{user.username}</Text>
      </View>
      <UserPlus color={accentColor} size={18} strokeWidth={2} />
    </TouchableOpacity>
  );

  const renderConvItem = (conv: Conversation) => (
    <TouchableOpacity
      key={conv.conversation_id}
      style={[styles.msgItem, { borderBottomColor: theme.border }]}
      activeOpacity={0.75}
      onPress={() => onNavigateChat(
        conv.other_user.user_id, conv.other_user.name,
        processImageUrl(conv.other_user.avatar_url) ?? 'https://i.pravatar.cc/150',
        conv.other_user.username,
      )}
    >
      <View style={[styles.msgAvatar, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.15)' }]}>
        {conv.other_user.avatar_url ? (
          <Image source={{ uri: processImageUrl(conv.other_user.avatar_url) ?? undefined }} style={styles.msgAvatarImg} />
        ) : (
          <Text style={[styles.msgAvatarText, { color: accentColor }]}>
            {conv.other_user.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.msgInfo}>
        <Text style={[styles.msgName, { color: theme.text }]}>{conv.other_user.name}</Text>
        <Text style={[styles.msgSub, { color: theme.textSub }]} numberOfLines={1}>
          {conv.last_message?.sender_id === currentUserId ? 'Sen: ' : ''}
          {conv.last_message?.content || 'Henüz mesaj yok'}
        </Text>
      </View>
      <View style={styles.msgMeta}>
        {conv.last_message && (
          <Text style={[styles.msgTime, { color: theme.textSub }]}>
            {formatMsgTime(conv.last_message.created_at)}
          </Text>
        )}
        {conv.unread_count > 0 && (
          <View style={[styles.msgUnread, { backgroundColor: accentColor }]}>
            <Text style={styles.msgUnreadText}>{conv.unread_count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.msgsRoot}>
      {/* Gelen istekler banner */}
      {incomingRequests.length > 0 && (
        <TouchableOpacity
          onPress={onShowRequests}
          activeOpacity={0.85}
          style={[styles.requestsBanner, { backgroundColor: isDark ? 'rgba(251,191,36,0.15)' : 'rgba(96,165,250,0.12)', borderColor: isDark ? AMBER.warm : LIGHT.accent }]}
        >
          <View style={[styles.requestsBadge, { backgroundColor: isDark ? AMBER.vivid : LIGHT.accent }]}>
            <Text style={styles.requestsBadgeText}>{incomingRequests.length}</Text>
          </View>
          <Text style={[styles.requestsBannerText, { color: isDark ? AMBER.warm : LIGHT.accent }]}>
            Arkadaşlık İsteği
          </Text>
          <Text style={[styles.requestsBannerSub, { color: theme.textSub }]}>
            {incomingRequests[0]?.sender_profile?.name} {incomingRequests.length > 1 ? `ve ${incomingRequests.length - 1} kişi daha` : ''} seni eklemek istiyor
          </Text>
        </TouchableOpacity>
      )}

      {/* Arama çubuğu */}
      <BlurView
        intensity={18}
        tint={isDark ? 'dark' : 'light'}
        style={[styles.msgsSearchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <Search color={theme.textSub} size={16} strokeWidth={2} />
        <TextInput
          style={[styles.msgsSearchInput, { color: theme.text }]}
          placeholder="Kullanıcı ara..."
          placeholderTextColor={theme.textSub}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: theme.textSub, fontSize: 14, paddingHorizontal: 4 }}>✕</Text>
          </TouchableOpacity>
        )}
      </BlurView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <ActivityIndicator color={accentColor} style={{ marginTop: 40 }} />
        ) : isSearching ? (
          <>
            <Text style={[styles.msgsSectionTitle, { color: theme.textSub }]}>
              {searchResults.length} kullanıcı
            </Text>
            {searchResults.length > 0
              ? searchResults.map(renderUserItem)
              : (
                <View style={styles.msgsEmpty}>
                  <Search color={theme.textSub} size={36} strokeWidth={1.5} />
                  <Text style={[styles.msgsEmptyText, { color: theme.textSub }]}>Kullanıcı bulunamadı</Text>
                </View>
              )
            }
          </>
        ) : conversations.length > 0 ? (
          <>
            <Text style={[styles.msgsSectionTitle, { color: theme.textSub }]}>MESAJLAR</Text>
            {conversations.map(renderConvItem)}
          </>
        ) : (
          <View style={styles.msgsEmpty}>
            <MessageCircle color={theme.textSub} size={44} strokeWidth={1.5} />
            <Text style={[styles.msgsEmptyText, { color: theme.textSub }]}>Henüz mesaj yok</Text>
            <Text style={[styles.msgsEmptyHint, { color: theme.textSub }]}>
              Arkadaşlarını aramak için yukarıdaki arama çubuğunu kullan
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────

function RadarView() {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const theme = isDark ? DARK : LIGHT;
  const URFA_CENTER = {
    latitude: 37.1591,
    longitude: 38.7969,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.radarContainer}>
      <MapView
        style={styles.radarMap}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={URFA_CENTER}
        customMapStyle={Platform.OS === 'android' ? (isDark ? darkMapStyle : lightMapStyle) : []}
        showsUserLocation
        showsCompass={false}
        showsScale={false}
      >
        {/* Isı haritası katmanı — Google Maps heatmap
            NOT: Bu bileşen sadece Android PROVIDER_GOOGLE ile çalışır.
            iOS'ta özel overlay ile simüle edilmesi gerekir. */}
        {Platform.OS === 'android' && (
          <Heatmap
            points={MOCK_HEAT_POINTS}
            radius={40}
            opacity={0.85}
            gradient={{
              colors: isDark ? ['#22c55e', '#f59e0b', '#ef4444'] : ['#86efac', '#fbbf24', '#fb7185'],
              startPoints: [0.1, 0.5, 1.0],
              colorMapSize: 256,
            }}
          />
        )}
      </MapView>
      {Platform.OS !== 'android' && (
        <View pointerEvents="none" style={styles.radarIosFallback}>
          <LinearGradient
            colors={isDark ? ['rgba(34,197,94,0.16)', 'rgba(245,158,11,0.14)', 'rgba(239,68,68,0.10)'] : ['rgba(134,239,172,0.14)', 'rgba(251,191,36,0.10)', 'rgba(251,113,133,0.08)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Üst Radar Başlığı — blur overlay */}
      <View style={styles.radarHeaderOverlay}>
        <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={styles.radarHeaderBlur}>
          <Radio color={isDark ? AMBER.warm : LIGHT.accent} size={16} strokeWidth={2} />
          <Text style={[styles.radarHeaderText, { color: theme.text }]}>Şehir Radarı</Text>
          <View style={styles.radarLiveDot} />
          <Text style={styles.radarLiveText}>CANLI</Text>
        </BlurView>
      </View>

      {/* Alt açıklama kartı */}
      <View style={styles.radarLegendOuter}>
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.radarLegendBlur}>
          <Text style={[styles.radarLegendTitle, { color: theme.text }]}>Son 4 saatteki hareketlilik</Text>
          <View style={styles.radarLegendBar}>
            <LinearGradient
              colors={isDark ? ['#22c55e', '#f59e0b', '#ef4444'] : ['#86efac', '#fbbf24', '#fb7185']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.radarLegendGradient}
            />
            <View style={styles.radarLegendLabels}>
              <Text style={[styles.radarLegendLabel, { color: theme.textSub }]}>Sakin</Text>
              <Text style={[styles.radarLegendLabel, { color: theme.textSub }]}>Orta</Text>
              <Text style={[styles.radarLegendLabel, { color: theme.textSub }]}>Yoğun</Text>
            </View>
          </View>
          <Text style={[styles.radarLegendNote, { color: theme.textSub }]}>
            Bireyler değil, bölgeler gösteriliyor. Kimlik bilgisi paylaşılmaz.
          </Text>
        </BlurView>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// MAIN: SosyalScreen
// ─────────────────────────────────────────────

type Tab = 'feed' | 'messages';

export default function SosyalScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { mode } = useThemeMode();
  const { profile } = useUser();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const theme = isDark ? DARK : LIGHT;
  const [snaps, setSnaps] = useState<SnapPost[]>([]);
  const [snapsLoading, setSnapsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState<SnapPost | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [friendPhone, setFriendPhone] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const cameraScale = useRef(new Animated.Value(1)).current;

  // Zoom state
  const [cameraZoom, setCameraZoom] = useState(0);
  const lastZoomRef = useRef(0);

  const handlePinchGesture = useCallback((event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const velocity = event.nativeEvent.velocity / 20;
      const scale = event.nativeEvent.scale;
      let newZoom: number;
      if (velocity > 0) {
        newZoom = lastZoomRef.current + scale * velocity * (Platform.OS === 'ios' ? 0.008 : 20);
      } else {
        newZoom = lastZoomRef.current - scale * Math.abs(velocity) * (Platform.OS === 'ios' ? 0.012 : 35);
      }
      newZoom = Math.min(0.6, Math.max(0, newZoom));
      lastZoomRef.current = newZoom;
      setCameraZoom(newZoom);
    }
  }, []);

  // Mesajlaşma state'leri
  const currentUserId = profile?.userId ?? null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Arkadaşlık istekleri state'leri
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setClockTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  // Kullanıcı hazır olunca mesajlaşma verilerini yükle
  useEffect(() => {
    if (currentUserId) {
      fetchConversations(currentUserId);
      fetchIncomingRequests(currentUserId);
      fetchFriends(currentUserId);
    }
  }, [currentUserId]);

  // Mesajlar sekmesi açıldığında yenile
  useEffect(() => {
    if (activeTab === 'messages' && currentUserId) {
      fetchConversations(currentUserId);
      fetchIncomingRequests(currentUserId);
    }
  }, [activeTab, currentUserId]);

  // Radar modal state
  const [radarModalVisible, setRadarModalVisible] = useState(false);

  // Kullanıcı arama — server-side ilike sorgusu
  useEffect(() => {
    if (!currentUserId) return;
    const query = searchQuery.trim();
    if (query.length === 0) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url')
          .neq('user_id', currentUserId)
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .limit(20);
        setSearchResults(data ?? []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUserId]);

  const fetchIncomingRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('receiver_id', userId)
        .eq('status', 'pending');
      if (error || !data) return;

      const withProfiles = await Promise.all(data.map(async (req: any) => {
        const { data: senderProfile } = await supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url')
          .eq('user_id', req.sender_id)
          .single();
        return { ...req, sender_profile: senderProfile };
      }));
      setIncomingRequests(withProfiles);
    } catch {
      // sessiz hata
    }
  };

  const fetchFriends = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('sender_id, receiver_id')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      if (error || !data) return;

      const friendIds = data.map((f: any) =>
        f.sender_id === userId ? f.receiver_id : f.sender_id
      );
      setFriendCount(friendIds.length);

      if (friendIds.length === 0) { setFriends([]); return; }

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', friendIds);
      if (profiles) {
        setFriends(profiles);
        // Arkadaşların snap'lerini de çek
        await fetchFriendSnaps([userId, ...friendIds]);
      }
    } catch {
      // sessiz hata
    }
  };

  const fetchFriendSnaps = async (userIds: string[]) => {
    setSnapsLoading(true);
    try {
      const expiryThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          id,
          user_id,
          image_url,
          created_at,
          user_profiles!social_posts_user_id_fkey(name, username, avatar_url)
        `)
        .in('user_id', userIds)
        .gte('created_at', expiryThreshold)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !data || data.length === 0) {
        setSnaps([]);
        return;
      }

      const mapped: SnapPost[] = data.map((post: any) => {
        const createdAt = new Date(post.created_at);
        const expiresAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
        const userProf = post.user_profiles;
        return {
          id: post.id,
          user: {
            id: post.user_id,
            name: userProf?.name ?? 'Kullanıcı',
            username: userProf?.username ?? '',
            avatarColor: '#f59e0b',
          },
          imageUri: post.image_url ?? '',
          location: { lat: 37.1591, lng: 38.7969, label: 'Şanlıurfa' },
          created_at: createdAt,
          expires_at: expiresAt,
          seen: false,
        };
      });
      setSnaps(mapped);
    } catch {
      setSnaps([]);
    } finally {
      setSnapsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!currentUserId) return;
    try {
      await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      // Kabul edince sohbet oluştur
      await supabase.rpc('get_or_create_conversation', {
        user1_id: currentUserId,
        user2_id: senderId,
      });

      await fetchIncomingRequests(currentUserId);
      await fetchConversations(currentUserId);
      await fetchFriends(currentUserId);
      Alert.alert('Arkadaş Eklendi! 🎉', 'Artık mesajlaşabilir ve snap atabilirsiniz.');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!currentUserId) return;
    try {
      await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      await fetchIncomingRequests(currentUserId);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const fetchConversations = async (userId: string) => {
    setMessagesLoading(true);
    try {
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);
      if (error || !participantData) { setMessagesLoading(false); return; }

      const convIds = participantData.map((p: any) => p.conversation_id);
      if (convIds.length === 0) { setConversations([]); setMessagesLoading(false); return; }

      const convPromises = convIds.map(async (convId: string) => {
        try {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId)
            .neq('user_id', userId)
            .single();

          if (!otherParticipant) return null;

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('user_id, name, username, avatar_url')
            .eq('user_id', otherParticipant.user_id)
            .single();

          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('content, created_at, sender_id, is_snap')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .neq('sender_id', userId)
            .eq('is_read', false);

          return {
            conversation_id: convId,
            other_user: profile || { user_id: otherParticipant.user_id, name: 'Kullanıcı', username: '' },
            last_message: lastMsgData || null,
            unread_count: unreadCount || 0,
          } as Conversation;
        } catch { return null; }
      });

      const results = (await Promise.all(convPromises)).filter(Boolean) as Conversation[];
      results.sort((a, b) => {
        const aTime = a.last_message?.created_at || '';
        const bTime = b.last_message?.created_at || '';
        return bTime.localeCompare(aTime);
      });
      setConversations(results);
    } catch {
      // sessiz hata
    } finally {
      setMessagesLoading(false);
    }
  };

  const formatMsgTime = (timestamp: string) => {
    const now = new Date();
    const d = new Date(timestamp);
    const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}d`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH}s`;
    return `${Math.floor(diffH / 24)}g`;
  };

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    const toValue = tab === 'feed' ? 0 : 1;
    Animated.spring(tabAnim, {
      toValue,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [tabAnim]);

  const createLocalSnap = useCallback((uri: string): SnapPost => ({
    id: `local-${Date.now()}`,
    user: {
      id: profile?.userId ?? 'me',
      name: profile?.name ?? 'Sen',
      username: profile?.username ?? 'me',
      avatarColor: isDark ? '#f59e0b' : '#60a5fa',
    },
    imageUri: uri,
    location: { lat: 37.1591, lng: 38.7969, label: 'Şanlıurfa' },
    created_at: new Date(),
    expires_at: new Date(Date.now() + SNAP_EXPIRES_MS),
    seen: false,
  }), [isDark, profile]);

  const handleCameraPress = useCallback(async () => {
    Animated.sequence([
      Animated.spring(cameraScale, { toValue: 0.92, useNativeDriver: true, damping: 8 }),
      Animated.spring(cameraScale, { toValue: 1, useNativeDriver: true, damping: 8 }),
    ]).start();

    const perm = cameraPermission ?? await requestCameraPermission();
    if (!perm?.granted) {
      setCameraVisible(true);
      return;
    }
    setCameraVisible(true);
  }, [cameraScale, cameraPermission, requestCameraPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (!cameraRef.current || cameraBusy) return;
    try {
      setCameraBusy(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
        exif: false,
        base64: false,
        imageType: 'jpg',
        shutterSound: false,
      });
      if (photo?.uri) {
        setCapturedPhotoUri(photo.uri);
      }
    } finally {
      setCameraBusy(false);
    }
  }, [cameraBusy, createLocalSnap]);

  const handleConfirmPhoto = useCallback(async () => {
    if (!capturedPhotoUri) {
      Alert.alert('Hata', 'Fotoğraf bulunamadı.');
      return;
    }
    if (!profile?.userId) {
      Alert.alert(
        'Giriş Gerekiyor',
        'Snap paylaşmak için ŞanlıSosyal hesabınla giriş yapman gerekiyor. Misafir olarak paylaşım yapamazsın.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }

    // URI'yi local değişkene al — state sıfırlanmadan önce kullanmak için
    const photoUri = capturedPhotoUri;
    const userId = profile.userId;

    // Önce local snap ile UI'ı anında güncelle (optimistic)
    const localSnap = createLocalSnap(photoUri);
    setSnaps(prev => [localSnap, ...prev]);
    setSelectedSnap(localSnap);
    setCapturedPhotoUri(null);
    setCameraVisible(false);

    // Arka planda Supabase'e yükle
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const response = await fetch(photoUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('snaps')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

      if (uploadError) return;

      const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      await supabase.from('social_posts').insert({
        user_id: userId,
        content: '',
        image_url: publicUrl,
      });

      // Local snap'in URI'sini gerçek URL ile güncelle
      setSnaps(prev =>
        prev.map(s => s.id === localSnap.id ? { ...s, imageUri: publicUrl } : s)
      );
    } catch {
      // Upload başarısız olsa bile local snap görünmeye devam eder
    }
  }, [capturedPhotoUri, createLocalSnap, profile?.userId]);

  const handleRetakePhoto = useCallback(() => {
    setCapturedPhotoUri(null);
  }, []);

  const handleSnapPress = useCallback((snap: SnapPost) => {
    setSnaps(prev => prev.map(item => (item.id === snap.id ? { ...item, seen: true } : item)));
    setSelectedSnap(snap);
  }, []);

  const handleAddFriendPress = useCallback(() => {
    setFriendModalVisible(true);
  }, []);

  const handleSubmitFriend = useCallback(async () => {
    if (friendPhone.trim().length === 0) return;
    try {
      const cleanInput = friendPhone.trim().toLowerCase().replace('@', '');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, name, username')
        .ilike('username', `%${cleanInput}%`)
        .limit(1)
        .single();

      if (error || !data) {
        Alert.alert('Bulunamadı', `"${cleanInput}" kullanıcı adıyla kayıtlı kimse bulunamadı.`);
        return;
      }

      if (!currentUserId) return;

      if (data.user_id === currentUserId) {
        Alert.alert('Hata', 'Kendine istek gönderemezsin.');
        return;
      }

      // Zaten arkadaş veya istek var mı kontrol et
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${data.user_id}),and(sender_id.eq.${data.user_id},receiver_id.eq.${currentUserId})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          Alert.alert('Zaten Arkadaşsınız', `@${data.username} ile zaten arkadaşsınız.`);
        } else if (existing.status === 'pending') {
          Alert.alert('İstek Gönderildi', `@${data.username} kullanıcısına zaten istek gönderilmiş, onay bekleniyor.`);
        }
        setFriendPhone('');
        setFriendModalVisible(false);
        return;
      }

      // Arkadaşlık isteği gönder
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({ sender_id: currentUserId, receiver_id: data.user_id, status: 'pending' });

      if (insertError) throw insertError;

      setFriendPhone('');
      setFriendModalVisible(false);
      Alert.alert('İstek Gönderildi! 🎉', `@${data.username} kullanıcısına arkadaşlık isteği gönderildi. Kabul edince mesajlaşabilirsiniz.`);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Bir hata oluştu.');
    }
  }, [friendPhone, currentUserId]);

  const handleCloseSnapViewer = useCallback(() => {
    setSelectedSnap(null);
  }, []);

  // Tab gösterge pill'inin konumu (2 tab: feed=0, messages=1)
  const tabWidth = (SCREEN_W - 48) / 2;
  const pillTranslateX = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, tabWidth],
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* ── Arka plan dokusu ── */}
      <LinearGradient
        colors={isDark ? ['#060c1a', '#0f172a', '#1a0f06'] : ['#f8fafc', '#eff6ff', '#ffffff']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient ışık huzmesi */}
      <View style={[styles.amberOrb, { backgroundColor: isDark ? 'rgba(245,158,11,0.07)' : 'rgba(96,165,250,0.10)' }]} />

      {/* ── SafeArea + Header ── */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          {/* Sol: Profil butonu — tıklanınca SosyalProfile açılır */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SosyalProfile')}
            style={styles.headerProfileBtn}
          >
            <View style={[styles.headerAvatarCircle, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.15)', borderColor: isDark ? AMBER.border : 'rgba(96,165,250,0.3)' }]}>
              <Text style={[styles.headerAvatarInitial, { color: isDark ? AMBER.warm : LIGHT.accent }]}>
                {profile?.name?.charAt(0).toUpperCase() ?? 'S'}
              </Text>
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>ŞanlıSosyal</Text>
              <Text style={[styles.headerSub, { color: isDark ? AMBER.text : LIGHT.accent }]}>
                {profile?.username ? `@${profile.username}` : 'Anlık · Doğal · Geçici'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* Arkadaş ekle butonu */}
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.8}
              onPress={handleAddFriendPress}
            >
              <UserPlus color={isDark ? AMBER.warm : LIGHT.accent} size={18} strokeWidth={2} />
            </TouchableOpacity>
            {/* ŞanlıSosyal bildirimleri */}
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.8}
              onPress={() => setRequestsModalVisible(true)}
            >
              {incomingRequests.length > 0 && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: isDark ? AMBER.vivid : '#ef4444', zIndex: 1 }} />
              )}
              <Bell color={theme.textSub} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

      </SafeAreaView>

      {/* ── İçerik Katmanı ── */}
      <View style={styles.content}>
        {activeTab === 'feed' ? (
          <FeedView
            snaps={snaps}
            isDark={isDark}
            refreshTick={clockTick}
            onSnapPress={handleSnapPress}
            onAddFriendPress={handleAddFriendPress}
            friends={friends}
            onOpenRadar={() => setRadarModalVisible(true)}
            loading={snapsLoading}
          />
        ) : (
          <MessagesView
            isDark={isDark}
            theme={theme}
            conversations={conversations}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            searchResults={searchResults}
            loading={messagesLoading}
            currentUserId={currentUserId}
            formatMsgTime={formatMsgTime}
            incomingRequests={incomingRequests}
            onShowRequests={() => setRequestsModalVisible(true)}
            onNavigateChat={(userId, userName, userAvatar, username) =>
              navigation.navigate('Chat', { userId, userName })
            }
          />
        )}
      </View>

      {/* ── Yeni Alt Bar: Akış | Kamera Orb | Mesajlar ── */}
      <SafeAreaView edges={['bottom']} style={[styles.sosyalBottomBar, { backgroundColor: isDark ? 'rgba(6,12,26,0.92)' : 'rgba(248,250,252,0.95)', borderTopColor: isDark ? DARK.border : LIGHT.border }]}>
        {/* Akış */}
        <TouchableOpacity
          style={styles.sosyalBottomTab}
          activeOpacity={0.75}
          onPress={() => switchTab('feed')}
        >
          <Users
            size={22}
            strokeWidth={activeTab === 'feed' ? 2.5 : 1.8}
            color={activeTab === 'feed' ? (isDark ? AMBER.warm : LIGHT.accent) : theme.textSub}
          />
          <Text style={[styles.sosyalBottomLabel, { color: activeTab === 'feed' ? (isDark ? AMBER.warm : LIGHT.accent) : theme.textSub, fontWeight: activeTab === 'feed' ? '700' : '500' }]}>
            Akış
          </Text>
        </TouchableOpacity>

        {/* Kamera Orb — merkez, büyük, parlayan */}
        <View style={styles.sosyalOrbWrapper}>
          <Animated.View style={[styles.sosyalOrbPulse, { transform: [{ scale: cameraScale }] }]}>
            {/* Dış halka */}
            <View style={[styles.sosyalOrbRing, { borderColor: isDark ? 'rgba(245,158,11,0.35)' : 'rgba(96,165,250,0.35)' }]} />
          </Animated.View>
          <TouchableOpacity
            onPress={handleCameraPress}
            activeOpacity={0.88}
            style={styles.sosyalOrbTouch}
          >
            <LinearGradient
              colors={isDark ? ['#f59e0b', '#d97706', '#b45309'] : ['#60a5fa', '#818cf8', '#a78bfa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sosyalOrbGradient}
            >
              {/* İç parlama */}
              <View style={[styles.sosyalOrbInnerGlow, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />
              <Camera color="#fff" size={26} strokeWidth={2} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={[styles.sosyalOrbLabel, { color: theme.textSub }]}>Çek</Text>
        </View>

        {/* Mesajlar */}
        <TouchableOpacity
          style={styles.sosyalBottomTab}
          activeOpacity={0.75}
          onPress={() => switchTab('messages')}
        >
          <View>
            <MessageCircle
              size={22}
              strokeWidth={activeTab === 'messages' ? 2.5 : 1.8}
              color={activeTab === 'messages' ? (isDark ? AMBER.warm : LIGHT.accent) : theme.textSub}
            />
            {conversations.some(c => c.unread_count > 0) && (
              <View style={[styles.sosyalUnreadDot, { backgroundColor: isDark ? AMBER.vivid : '#ef4444' }]} />
            )}
          </View>
          <Text style={[styles.sosyalBottomLabel, { color: activeTab === 'messages' ? (isDark ? AMBER.warm : LIGHT.accent) : theme.textSub, fontWeight: activeTab === 'messages' ? '700' : '500' }]}>
            Mesajlar
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Şehir Radarı Tam Ekran Modal ── */}
      <Modal visible={radarModalVisible} animationType="slide" onRequestClose={() => setRadarModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: isDark ? DARK.bg : LIGHT.bg }}>
          <SafeAreaView edges={['top']} style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Radio size={18} color={isDark ? AMBER.warm : LIGHT.accent} strokeWidth={2} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, letterSpacing: -0.4 }}>Şehir Radarı</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRadarModalVisible(false)}
                style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <XIcon size={18} color={theme.textSub} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          <RadarView />
        </View>
      </Modal>

      {/* Kamera Modalı — Tam Ekran Snapchat Tarzı */}
      <Modal visible={cameraVisible} animationType="fade" onRequestClose={() => { setCameraVisible(false); setCapturedPhotoUri(null); setCameraZoom(0); lastZoomRef.current = 0; }} statusBarTranslucent>
        <View style={styles.snapCameraRoot}>
          {!cameraPermission?.granted ? (
            /* İzin ekranı */
            <View style={[styles.permissionState, { backgroundColor: '#000' }]}>
              <Camera color="#f59e0b" size={52} strokeWidth={1.5} />
              <Text style={[styles.permissionTitle, { color: '#fff' }]}>Kamera izni gerekiyor</Text>
              <Text style={[styles.permissionSub, { color: 'rgba(255,255,255,0.5)' }]}>
                ŞanlıSosyal yalnızca anlık fotoğraf çeker, galeriye erişmez.
              </Text>
              <TouchableOpacity activeOpacity={0.85} style={styles.permissionButton} onPress={requestCameraPermission}>
                <Text style={styles.permissionButtonText}>İzin Ver</Text>
              </TouchableOpacity>
            </View>
          ) : capturedPhotoUri ? (
            /* Önizleme ekranı */
            <View style={styles.snapCameraRoot}>
              {/* Fotoğraf arka planda */}
              <Image source={{ uri: capturedPhotoUri }} style={[StyleSheet.absoluteFill, { zIndex: 0 }]} resizeMode="cover" />
              {/* Gradient — dokunuşları geçirsin */}
              <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
                style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                pointerEvents="none"
              />

              {/* Üst bar — önizleme */}
              <View style={[styles.snapCameraTopBar, { paddingTop: insets.top + 8, zIndex: 20 }]}>
                <TouchableOpacity
                  onPress={() => setCapturedPhotoUri(null)}
                  style={styles.snapCameraTopBtn}
                  activeOpacity={0.8}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <XIcon color="#fff" size={28} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.snapCameraTopTitle}>Önizleme</Text>
                <View style={{ width: 44 }} />
              </View>

              {/* Alt bar — Gönder */}
              <View style={[styles.snapCameraBottomBar, { paddingBottom: insets.bottom + 16, zIndex: 20 }]}>
                <Text style={styles.snapCameraHint}>Paylaş ya da tekrar çek</Text>
                <View style={styles.snapCameraBottomRow}>
                  <TouchableOpacity
                    onPress={() => setCapturedPhotoUri(null)}
                    style={styles.snapCameraRetakeBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.snapCameraRetakeText}>Tekrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmPhoto}
                    style={styles.snapCameraConfirmBtn}
                    activeOpacity={0.9}
                  >
                    <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.snapCameraConfirmGrad}>
                      <Text style={styles.snapCameraConfirmText}>Paylaş ✦</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            /* Canlı kamera */
            <View style={styles.snapCameraRoot}>
              {/* Kamera + pinch zoom — absoluteFill ama zIndex düşük */}
              <PinchGestureHandler onGestureEvent={handlePinchGesture} onHandlerStateChange={handlePinchGesture}>
                <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
                  <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    ratio={Platform.OS === 'android' ? '16:9' : undefined}
                    zoom={cameraZoom}
                    enableTorch={false}
                    autofocus="on"
                  />
                </View>
              </PinchGestureHandler>

              {/* Gradient — dokunuş geçirgen */}
              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent', 'transparent', 'rgba(0,0,0,0.65)']}
                style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                pointerEvents="none"
              />

              {/* Üst bar — canlı kamera */}
              <View style={[styles.snapCameraTopBar, { paddingTop: insets.top + 8, zIndex: 20 }]}>
                <TouchableOpacity
                  onPress={() => { setCameraVisible(false); setCameraZoom(0); lastZoomRef.current = 0; }}
                  style={styles.snapCameraTopBtn}
                  activeOpacity={0.8}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <XIcon color="#fff" size={28} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.snapCameraTopTitle}>ŞanlıSosyal</Text>
                <View style={{ width: 44 }} />
              </View>

              {/* Orta — ipucu + zoom göstergesi */}
              <View style={[styles.snapCameraMidHint, { zIndex: 2 }]} pointerEvents="none">
                <Text style={styles.snapCameraTimerBadge}>⏱ 4 saat · Anlık çekim</Text>
                {cameraZoom > 0.02 && (
                  <View style={styles.zoomBadge}>
                    <Text style={styles.zoomBadgeText}>{(1 + cameraZoom * 8).toFixed(1)}x</Text>
                  </View>
                )}
              </View>

              {/* Alt bar — Hikayeler / Çekim / Mesajlar */}
              <View style={[styles.snapCameraBottomBar, { paddingBottom: insets.bottom + 16, zIndex: 20 }]}>
                <View style={styles.snapCameraBottomRow}>
                  {/* Sol: Feed (hikayeler) */}
                  <TouchableOpacity
                    onPress={() => { setCameraVisible(false); switchTab('feed'); }}
                    style={styles.snapCameraSideBtn}
                    activeOpacity={0.8}
                  >
                    <Users color="rgba(255,255,255,0.85)" size={26} strokeWidth={1.8} />
                    <Text style={styles.snapCameraSideLbl}>Hikayeler</Text>
                  </TouchableOpacity>

                  {/* Orta: Çekim butonu */}
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    disabled={cameraBusy}
                    activeOpacity={0.85}
                    style={styles.snapShutterOuter}
                  >
                    <View style={styles.snapShutterInner} />
                  </TouchableOpacity>

                  {/* Sağ: Mesajlar */}
                  <TouchableOpacity
                    onPress={() => { setCameraVisible(false); switchTab('messages'); }}
                    style={styles.snapCameraSideBtn}
                    activeOpacity={0.8}
                  >
                    <MessageCircle color="rgba(255,255,255,0.85)" size={26} strokeWidth={1.8} />
                    <Text style={styles.snapCameraSideLbl}>Mesajlar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Snap Viewer */}
      <Modal visible={!!selectedSnap} animationType="fade" transparent onRequestClose={handleCloseSnapViewer}>
        <View style={styles.snapViewerBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleCloseSnapViewer} />
          {selectedSnap && (
            <View style={styles.snapViewerCard}>
              <Image source={{ uri: selectedSnap.imageUri }} style={styles.snapViewerImage} />
              <LinearGradient colors={['transparent', 'rgba(6,12,26,0.9)']} style={StyleSheet.absoluteFill} />
              <View style={styles.snapViewerTop}>
                <View>
                  <Text style={styles.snapViewerName}>{selectedSnap.user.name}</Text>
                  <Text style={styles.snapViewerMeta}>{selectedSnap.location.label}</Text>
                </View>
                <TouchableOpacity onPress={handleCloseSnapViewer} style={styles.modalCloseBtn} activeOpacity={0.8}>
                  <Text style={styles.modalCloseText}>Kapat</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.snapViewerBottom}>
                <Text style={styles.snapViewerTime}>{formatTimeLeft(selectedSnap)}</Text>
                <Text style={styles.snapViewerNote}>Bu snap geçici. 4 saat sonra silinir.</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Arkadaş Ekle Modalı */}
      <Modal visible={friendModalVisible} animationType="slide" transparent onRequestClose={() => setFriendModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFriendModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>Arkadaş Ekle</Text>
              <TouchableOpacity onPress={() => setFriendModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.friendQrBox, { backgroundColor: isDark ? '#f8fafc0f' : '#f8fafc', borderColor: theme.border }]}>
              <Plus color={isDark ? AMBER.warm : '#60a5fa'} size={34} strokeWidth={2} />
              <Text style={[styles.friendQrCode, { color: theme.text }]}>QR Kod</Text>
              <Text style={[styles.friendQrSub, { color: theme.textSub }]}>Arkadaşınla kapalı çevre kur</Text>
            </View>
            <TextInput
              value={friendPhone}
              onChangeText={setFriendPhone}
              placeholder="Kullanıcı adı gir (örn: mervesude)"
              placeholderTextColor={theme.textSub}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.friendInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            />
            <TouchableOpacity activeOpacity={0.9} style={styles.friendActionBtn} onPress={handleSubmitFriend}>
              <LinearGradient colors={isDark ? [AMBER.vivid, '#d97706'] : ['#60a5fa', '#a78bfa']} style={styles.friendActionGradient}>
                <Text style={styles.friendActionText}>Eklemeyi Gönder</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Arkadaşlık İstekleri Modalı */}
      <Modal visible={requestsModalVisible} animationType="slide" transparent onRequestClose={() => setRequestsModalVisible(false)}>
        <View style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setRequestsModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border, maxHeight: '70%' }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>Arkadaşlık İstekleri</Text>
              <TouchableOpacity onPress={() => setRequestsModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {incomingRequests.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={[styles.msgsEmptyText, { color: theme.textSub }]}>Bekleyen istek yok</Text>
                </View>
              ) : incomingRequests.map((req) => (
                <View key={req.id} style={[styles.msgItem, { borderBottomColor: theme.border }]}>
                  <View style={[styles.msgAvatar, { backgroundColor: isDark ? AMBER.glow : 'rgba(96,165,250,0.15)' }]}>
                    <Text style={[styles.msgAvatarText, { color: isDark ? AMBER.warm : LIGHT.accent }]}>
                      {(req.sender_profile?.name || '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.msgInfo, { flex: 1 }]}>
                    <Text style={[styles.msgName, { color: theme.text }]}>{req.sender_profile?.name || 'Kullanıcı'}</Text>
                    <Text style={[styles.msgSub, { color: theme.textSub }]}>@{req.sender_profile?.username || ''}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => handleAcceptRequest(req.id, req.sender_id)}
                      style={{ backgroundColor: isDark ? AMBER.vivid : '#10b981', borderRadius: 20, padding: 8 }}
                    >
                      <Check color="#fff" size={18} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRejectRequest(req.id)}
                      style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', borderRadius: 20, padding: 8 }}
                    >
                      <XIcon color={theme.textSub} size={18} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
// DARK MAP STYLE — Google Maps karanlık tema
// ─────────────────────────────────────────────

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1117' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1a1f2e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2c3347' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#060c1a' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
];

const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8fafc' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#c7d2fe' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#dbeafe' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#94a3b8' }],
  },
];

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK.bg,
  },

  // Arka plan dekoratif elemanlar
  amberOrb: {
    position: 'absolute',
    width: SCREEN_W * 0.9,
    height: SCREEN_W * 0.9,
    borderRadius: SCREEN_W * 0.45,
    backgroundColor: 'rgba(245,158,11,0.07)',
    top: -SCREEN_W * 0.2,
    left: SCREEN_W * 0.05,
  },

  // Header
  safeTop: {
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK.text,
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 11,
    color: AMBER.text,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: DARK.surface,
    borderWidth: 1,
    borderColor: DARK.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab Bar
  tabBar: {
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabBarBlur: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK.border,
    padding: 4,
    overflow: 'hidden',
  },
  tabPill: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: '33.33%',
    bottom: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AMBER.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK.textSub,
  },
  tabLabelActive: {
    color: AMBER.warm,
  },

  // İçerik
  content: {
    flex: 1,
  },

  // Feed
  feedContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  feedRow: {
    justifyContent: 'space-between',
    gap: 10,
  },
  feedHeaderContainer: {
    paddingVertical: 12,
    paddingBottom: 16,
  },
  feedHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK.text,
  },
  feedHeaderSub: {
    fontSize: 12,
    color: DARK.textSub,
    marginTop: 2,
  },

  // Snap Card
  snapCardOuter: {
    width: (SCREEN_W - 42) / 2,
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  snapCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  snapCardInner: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: DARK.border,
    overflow: 'hidden',
    backgroundColor: DARK.surface,
  },
  snapCardUnseen: {
    borderColor: AMBER.border,
    shadowColor: AMBER.vivid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  snapCardUnseenLight: {
    shadowColor: '#93c5fd',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 0,
  },
  snapImageContainer: {
    height: (SCREEN_W - 42) / 2 * 1.25,
    backgroundColor: '#1a1f2e',
    overflow: 'hidden',
  },
  snapImage: {
    width: '100%',
    height: '100%',
  },
  snapImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
  },
  snapTimeTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(6,12,26,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AMBER.border,
  },
  snapTimeText: {
    fontSize: 10,
    color: AMBER.warm,
    fontWeight: '600',
  },
  snapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 6,
  },
  snapAvatarWrapper: {
    position: 'relative',
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapAvatar: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  snapAvatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  snapUserInfo: {
    flex: 1,
  },
  snapUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: DARK.text,
  },
  snapLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  snapLocationText: {
    fontSize: 10,
    color: DARK.textSub,
    flex: 1,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK.text,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: DARK.textSub,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyAddBtn: {
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AMBER.border,
  },
  emptyAddBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: AMBER.warm,
  },

  // Radar
  radarContainer: {
    flex: 1,
  },
  radarMap: {
    flex: 1,
  },
  radarIosFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  radarHeaderOverlay: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  radarHeaderBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AMBER.border,
    overflow: 'hidden',
  },
  radarHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK.text,
    flex: 1,
  },
  radarLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22c55e',
  },
  radarLiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    letterSpacing: 1,
  },
  radarLegendOuter: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  radarLegendBlur: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DARK.border,
    overflow: 'hidden',
    gap: 10,
  },
  radarLegendTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DARK.text,
  },
  radarLegendBar: {
    gap: 4,
  },
  radarLegendGradient: {
    height: 8,
    borderRadius: 4,
  },
  radarLegendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radarLegendLabel: {
    fontSize: 10,
    color: DARK.textSub,
  },
  radarLegendNote: {
    fontSize: 10,
    color: DARK.textSub,
    textAlign: 'center',
    lineHeight: 14,
  },

  // Camera FAB
  cameraFabSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  cameraFabWrapper: {
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: AMBER.vivid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  cameraFabTouch: {
    borderRadius: 36,
    overflow: 'hidden',
  },
  cameraFabBlur: {
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: AMBER.border,
  },
  cameraFabGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFabHint: {
    fontSize: 11,
    color: DARK.textSub,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Yeni Alt Bar ──────────────────────────────────────────────────────────
  sosyalBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sosyalBottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
  },
  sosyalBottomLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  sosyalOrbWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    gap: 3,
  },
  sosyalOrbPulse: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
  },
  sosyalOrbRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
  },
  sosyalOrbTouch: {
    borderRadius: 34,
    overflow: 'hidden',
    shadowColor: AMBER.vivid,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  sosyalOrbGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosyalOrbInnerGlow: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sosyalOrbLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  sosyalUnreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ── Header Profil Butonu ──────────────────────────────────────────────────
  headerProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    fontSize: 15,
    fontWeight: '800',
  },

  // ── Kompakt Radar Kartı ───────────────────────────────────────────────────
  radarCardOuter: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  radarCardBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
  },
  radarCardLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  radarPulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  radarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCardBody: {
    flex: 1,
    gap: 3,
  },
  radarCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radarCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  radarCardSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  radarCardRight: {
    alignItems: 'center',
    gap: 6,
  },
  radarMiniBar: {
    width: 6,
    height: 36,
    borderRadius: 3,
  },
  radarCardArrow: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 20,
  },

  // Modals
  cameraModalRoot: {
    flex: 1,
    backgroundColor: '#060c1a',
  },
  cameraModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  cameraModalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalCloseBtn: {
    minWidth: 56,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  permissionState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  permissionButton: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#60a5fa',
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraPreviewWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  cameraPreview: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(6,12,26,0.45)',
  },
  cameraActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cameraHint: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  cameraAltButton: {
    minWidth: 92,
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cameraAltButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  captureButtonOuter: {
    borderRadius: 38,
    overflow: 'hidden',
    shadowColor: '#60a5fa',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  captureButtonInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapViewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6,12,26,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  snapViewerCard: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 0.75,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  snapViewerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  snapViewerTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  snapViewerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  snapViewerMeta: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  snapViewerBottom: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 2,
  },
  snapViewerTime: {
    color: '#fbbf24',
    fontSize: 14,
    fontWeight: '700',
  },
  snapViewerNote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  friendModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6,12,26,0.72)',
    justifyContent: 'flex-end',
    paddingHorizontal: 0,
  },
  friendModalCard: {
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    backgroundColor: '#ffffff',
    gap: 14,
    maxHeight: '82%',
  },
  friendModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  friendQrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.18)',
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  friendQrCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  friendQrSub: {
    fontSize: 12,
    textAlign: 'center',
  },
  friendInput: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 14,
  },
  friendActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  friendActionGradient: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  friendActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── MessagesView styles ──
  msgsRoot: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  msgsSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
    overflow: 'hidden',
  },
  msgsSearchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  msgsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  msgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  msgAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  msgAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  msgAvatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  msgInfo: {
    flex: 1,
    gap: 3,
  },
  msgName: {
    fontSize: 15,
    fontWeight: '600',
  },
  msgSub: {
    fontSize: 13,
    fontWeight: '400',
  },
  msgMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  msgTime: {
    fontSize: 12,
  },
  msgUnread: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgUnreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  msgsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 12,
  },
  msgsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  msgsEmptyHint: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    opacity: 0.7,
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  requestsBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  requestsBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  requestsBannerSub: {
    fontSize: 12,
    flex: 1,
  },

  // ── Tam Ekran Snap Kamera ──
  snapCameraRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  snapCameraTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  snapCameraTopBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  snapCameraTopTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  snapCameraMidHint: {
    position: 'absolute',
    top: '12%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  snapCameraTimerBadge: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  zoomBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  zoomBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  snapCameraBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    elevation: 20,
  },
  snapCameraHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  snapCameraBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  snapCameraSideBtn: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  snapCameraSideLbl: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
  snapShutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapShutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  snapCameraRetakeBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  snapCameraRetakeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  snapCameraConfirmBtn: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  snapCameraConfirmGrad: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
  },
  snapCameraConfirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
