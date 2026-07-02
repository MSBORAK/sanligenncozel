/**
 * ŞanlıSosyal — Ana Ekran İskeleti
 *
 * Felsefe: Anlık · Doğal · Geçici
 *  - Galeri erişimi YOK, sadece kamera
 *  - Her snap 4 saat sonra otomatik silinir
 *  - İki katmanlı deneyim: Arkadaş Akışı + Şehir Radarı (heatmap)
 *  - Anonim şehir verisi, kişisel arkadaş bağı
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
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
  QrCode,
  RefreshCw,
  ArrowLeft,
  Zap,
  ZapOff,
  Grid3x3,
  Timer,
  Eye,
} from 'lucide-react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Heatmap, Marker } from 'react-native-maps';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase, processImageUrl, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { notify } from '@/lib/notifications';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface SnapPost {
  id: string;
  userId: string; // Snap sahibinin user_id'si
  user: {
    id: string;
    name: string;
    username: string;
    avatarColor: string; // Renk kodu — gerçek avatar yokken kullanılır
    avatarUrl?: string; // Profil resmi URL'i
  };
  imageUri: string; // Foto veya video dosyasının URI / public URL
  /** true ise imageUri bir videoyu gösterir */
  isVideo?: boolean;
  location: {
    lat: number;
    lng: number;
    label?: string; // "Kapalıçarşı bölgesi" gibi anonim bölge adı
  };
  created_at: Date;
  expires_at: Date; // created_at + 4 saat — kesin kural
  seen: boolean;
  viewedBy?: string[]; // Görüntüleyen kullanıcı ID'leri
  isPublic?: boolean; // Gizlilik ayarı: true = herkese açık, false = sadece arkadaşlar
}

export interface HeatPoint {
  latitude: number;
  longitude: number;
  weight: number; // 0-1 arası yoğunluk
  district?: string;
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

/** Kıvılcım — ateş/spark aksanı */
const AMBER = {
  vivid:   '#FF4500',
  warm:    '#FF6B35',
  glow:    'rgba(255,69,0,0.25)',
  border:  'rgba(255,69,0,0.35)',
  text:    '#FF9166',
  light:   'rgba(255,69,0,0.12)',
  deep:    'rgba(120,20,0,0.4)',
};

/** Gece modu — kıvılcım spark */
const NIGHT = {
  vivid:   '#FF4500',
  warm:    '#FF6B35',
  glow:    'rgba(255,69,0,0.22)',
  border:  'rgba(255,107,53,0.32)',
  text:    '#FF9166',
  light:   'rgba(255,69,0,0.12)',
  deep:    'rgba(120,20,0,0.45)',
};

const DARK = {
  bg:        '#000000',
  surface:   'rgba(255,255,255,0.05)',
  surfaceHi: 'rgba(255,255,255,0.09)',
  border:    'rgba(255,255,255,0.10)',
  text:      '#f1f5f9',
  textSub:   'rgba(241,245,249,0.55)',
  glass:     'rgba(6, 12, 26, 0.65)',
  tabBg:     'rgba(255,255,255,0.06)',
  tabActiveBg: 'rgba(255,69,0,0.18)',
  accentSoft: 'rgba(255,69,0,0.12)',
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
  amberSoft: 'rgba(255,69,0,0.10)',
  amberBorder: 'rgba(255,69,0,0.16)',
  accent: '#FF4500',
  accentSoft: 'rgba(255,69,0,0.10)',
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

/** Kalan süreyi "3sa 42dk" formatında gösterir */
function formatTimeLeft(snap: SnapPost, referenceTime: Date = new Date()): string {
  const msLeft = snap.expires_at.getTime() - referenceTime.getTime();
  if (msLeft <= 0) return 'Süre doldu';
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  if (h > 0) return `${h}sa ${m}dk`;
  return `${m}dk`;
}

/** Grup kıvılcımı: aynı anda 2–5 arkadaş */
const GROUP_KIVILCIM_MIN = 2;
const GROUP_KIVILCIM_MAX = 5;

function SnapMediaThumb({
  uri,
  isVideo,
  style,
  imageResizeMode = 'cover',
}: {
  uri: string;
  isVideo?: boolean;
  style: object;
  imageResizeMode?: 'cover' | 'contain';
}) {
  if (!uri) {
    return <View style={[style, { backgroundColor: '#1a1f2e' }]} />;
  }
  if (isVideo) {
    return (
      <View style={style}>
        <Video
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isMuted
          useNativeControls={false}
        />
        <View
          style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}
          pointerEvents="none"
        >
          <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>VIDEO</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={style}
      resizeMode={imageResizeMode}
    />
  );
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
  isDark?: boolean;
}

function CountdownRing({ progress, size = 58, strokeWidth = 2.5, seen = false, isDark = true }: CountdownRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const remaining = circumference * (1 - progress);

  // Renk: yeni → gece buz / gündüz amber, eski → soluk
  const ringColor = seen
    ? DARK.textSub
    : progress < 0.5
    ? (isDark ? NIGHT.warm : AMBER.warm)
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
          {/* Fotoğraf Alanı — kullanıcı bilgisi overlay içinde */}
          <View style={[styles.snapImageContainer, { backgroundColor: isDark ? '#1a1f2e' : '#eef2ff' }]}>
            <SnapMediaThumb uri={snap.imageUri} isVideo={snap.isVideo} style={styles.snapImage} />

            {/* Kalan süre etiketi — üst sağ */}
            <View style={[styles.snapTimeTag, { backgroundColor: 'rgba(0,0,0,0.45)', borderColor: 'rgba(255,255,255,0.15)' }]}>
              <Clock color="#fff" size={10} strokeWidth={2.5} />
              <Text style={[styles.snapTimeText, { color: '#fff' }]}>{timeLeft}</Text>
            </View>

            {/* Alt gradient — kullanıcı bilgisi için zemin */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.72)']}
              style={[styles.snapImageOverlay, { justifyContent: 'flex-end', paddingHorizontal: 8, paddingBottom: 8 }]}
              pointerEvents="none"
            />

            {/* Kullanıcı Bilgisi — fotoğrafın üzerinde */}
            <View style={styles.snapOverlayFooter}>
              <View style={styles.snapAvatarWrapper}>
                <CountdownRing progress={progress} size={34} seen={snap.seen} isDark={true} />
                <View style={[styles.snapAvatar, { width: 28, height: 28, borderRadius: 14, backgroundColor: snap.user.avatarColor + '44' }]}>
                  <Text style={[styles.snapAvatarText, { color: '#fff', fontSize: 12 }]}>
                    {snap.user.name.charAt(0)}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.snapOverlayName} numberOfLines={1}>{snap.user.name}</Text>
                <View style={styles.snapLocationRow}>
                  <MapPin color="rgba(255,255,255,0.7)" size={9} strokeWidth={2.5} />
                  <Text style={styles.snapOverlayLocation} numberOfLines={1}>{snap.location.label}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: SnapGroupCard
// Aynı kullanıcının tüm snap'leri tek kart içinde
// ─────────────────────────────────────────────

function SnapGroupCard({ group, onPress, isDark, currentUserId, onAvatarPress }: {
  group: SnapGroup;
  onPress: (snap: SnapPost) => void;
  isDark: boolean;
  currentUserId?: string;
  onAvatarPress?: (userId: string) => void;
}) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? NIGHT.warm : LIGHT.accent;
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [cardWidth, setCardWidth] = useState((SCREEN_W - 32 - 12) / 2);

  const activeSnap = group.snaps[activeIdx];
  const progress = getExpiryProgress(activeSnap);
  const timeLeft = formatTimeLeft(activeSnap);

  const viewCount = group.snaps[activeIdx]?.viewedBy?.length ?? 0;
  const isUrgent = progress > 0.75;

  return (
    <View
      style={{ width: '100%' }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && Math.abs(w - cardWidth) > 1) setCardWidth(w);
      }}
    >
      {/* Fotoğraf alanı — yatay kaydırılabilir */}
      <View style={{
        width: cardWidth,
        height: cardWidth * 1.05,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.35 : 0.1,
        shadowRadius: 10,
        elevation: 4,
      }}>
      <View style={[styles.snapImageContainer, { width: cardWidth, height: cardWidth * 1.05, borderWidth: 0, borderRadius: 20 }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth}
          decelerationRate="fast"
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
            setActiveIdx(idx);
          }}
        >
          {group.snaps.map((snap) => (
            <TouchableOpacity
              key={snap.id}
              activeOpacity={0.92}
              onPress={() => onPress(snap)}
              style={{ width: cardWidth, height: cardWidth * 1.05 }}
            >
              <SnapMediaThumb
                uri={snap.imageUri}
                isVideo={snap.isVideo}
                style={{ width: cardWidth, height: cardWidth * 1.05 }}
                imageResizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Birden fazla snap varsa üstte nokta göstergesi */}
        {group.snaps.length > 1 && (
          <View style={{ position: 'absolute', top: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
            {group.snaps.map((_, i) => (
              <View key={i} style={{
                width: i === activeIdx ? 18 : 6,
                height: 4,
                borderRadius: 2,
                backgroundColor: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.45)',
              }} />
            ))}
          </View>
        )}

        {/* Kalan süre etiketi — sağ üst köşe pill */}
        <View style={[
          styles.snapTimeTagPill,
          { backgroundColor: isUrgent ? 'rgba(220,38,38,0.92)' : 'rgba(0,0,0,0.55)' },
        ]} pointerEvents="none">
          <Clock color="#fff" size={11} strokeWidth={2.5} />
          <Text style={styles.snapTimeText}>{timeLeft}</Text>
        </View>
      </View>
      </View>

      {/* Kullanıcı bilgisi — fotoğrafın ALTINDA, kart dışında */}
      <View style={styles.snapMetaRow}>
        <TouchableOpacity
          style={styles.snapMetaLeft}
          onPress={() => onAvatarPress?.(group.userId)}
        >
          <View style={[styles.snapMetaAvatar, { backgroundColor: group.avatarColor + '44', borderWidth: 1.5, borderColor: theme.border }]}>
            {group.snaps[0]?.user?.avatarUrl ? (
              <Image
                source={{ uri: processImageUrl(group.snaps[0].user.avatarUrl) || undefined }}
                style={{ width: 26, height: 26, borderRadius: 13 }}
              />
            ) : (
              <Text style={[styles.snapAvatarText, { color: theme.text, fontSize: 11 }]}>
                {group.userName.charAt(0)}
              </Text>
            )}
          </View>
          <Text style={[styles.snapMetaUsername, { color: theme.text }]} numberOfLines={1}>
            @{group.username}
          </Text>
        </TouchableOpacity>

        <View style={styles.snapMetaRight}>
          <Eye color={theme.textSub} size={14} strokeWidth={2} />
          <Text style={[styles.snapMetaCount, { color: theme.textSub }]}>{viewCount}</Text>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: FeedView
// Arkadaş akışı — sadece arkadaşlar görünür
// ─────────────────────────────────────────────

// ─── Kompakt Radar Kartı (Akış içinde) ──────────────────────────────────────

function RadarCompactCard({ isDark, onPress }: { isDark: boolean; onPress: () => void }) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? NIGHT.warm : LIGHT.accent;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [activeCount, setActiveCount] = useState<number | null>(null);

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

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('social_posts')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since)
          .not('latitude', 'is', null);
        setActiveCount(count ?? 0);
      } catch {
        setActiveCount(null);
      }
    };
    fetchCount();
  }, []);

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.radarCardOuter}>
      <LinearGradient
        colors={isDark
          ? ['rgba(255,69,0,0.18)', 'rgba(30,8,0,0.95)']
          : ['rgba(255,69,0,0.08)', 'rgba(255,255,252,0.97)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.radarCardBlur, { borderColor: isDark ? NIGHT.border : 'rgba(255,69,0,0.2)' }]}
      >
        {/* Sol: ikon + pulse */}
        <View style={styles.radarCardLeft}>
          <Animated.View style={[styles.radarPulseRing, { transform: [{ scale: pulseAnim }], backgroundColor: 'rgba(255,69,0,0.18)' }]} />
          <LinearGradient
            colors={['#FF4500', '#FF6B35']}
            style={styles.radarIconCircle}
          >
            <Radio size={18} color="#fff" strokeWidth={2} />
          </LinearGradient>
        </View>

        {/* Orta: metin */}
        <View style={styles.radarCardBody}>
          <View style={styles.radarCardTitleRow}>
            <Text style={[styles.radarCardTitle, { color: theme.text }]}>Şehir Radarı</Text>
            <View style={styles.radarLiveDot} />
            <Text style={[styles.radarLiveText, { color: '#FF4500' }]}>CANLI</Text>
          </View>
          <Text style={[styles.radarCardSub, { color: theme.textSub }]}>
            Son 4 saatte {activeCount !== null ? `${activeCount} paylaşım` : 'yükleniyor...'}
          </Text>
        </View>

        {/* Sağ: mini ısı çubuğu */}
        <View style={styles.radarCardRight}>
          <LinearGradient
            colors={['#22c55e', '#FF6B35', '#FF4500']}
            style={styles.radarMiniBar}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={[styles.radarCardArrow, { color: accentColor }]}>›</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// Kullanıcı bazlı gruplandırılmış snap'ler
interface SnapGroup {
  userId: string;
  userName: string;
  username: string;
  avatarColor: string;
  snaps: SnapPost[];
  hasUnseen: boolean;
}

function groupSnapsByUser(snaps: SnapPost[]): SnapGroup[] {
  const map = new Map<string, SnapGroup>();
  for (const snap of snaps) {
    const uid = snap.user.id;
    if (!map.has(uid)) {
      map.set(uid, {
        userId: uid,
        userName: snap.user.name,
        username: snap.user.username,
        avatarColor: snap.user.avatarColor,
        snaps: [],
        hasUnseen: false,
      });
    }
    const group = map.get(uid)!;
    group.snaps.push(snap);
    if (!snap.seen) group.hasUnseen = true;
  }
  return Array.from(map.values());
}

function StoryBar({
  groups,
  isDark,
  onPress,
}: {
  groups: SnapGroup[];
  isDark: boolean;
  onPress: (group: SnapGroup) => void;
}) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? NIGHT.warm : LIGHT.accent;
  if (groups.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 14 }}
    >
      {groups.map((g) => (
        <TouchableOpacity
          key={g.userId}
          activeOpacity={0.8}
          onPress={() => onPress(g)}
          style={{ alignItems: 'center', gap: 5 }}
        >
          {/* Hikaye halkası */}
          <View style={{
            width: 66,
            height: 66,
            borderRadius: 33,
            padding: 2.5,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            borderColor: g.hasUnseen ? accentColor : 'rgba(148,163,184,0.3)',
          }}>
            <View style={{
              flex: 1,
              borderRadius: 30,
              backgroundColor: g.avatarColor + '33',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {g.snaps[0]?.user?.avatarUrl ? (
                <Image
                  source={{ uri: processImageUrl(g.snaps[0].user.avatarUrl) || undefined }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <Text style={{ color: g.avatarColor, fontSize: 22, fontWeight: '800' }}>
                  {g.userName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          </View>
          {/* Snap sayısı badge */}
          {g.snaps.length > 1 && (
            <View style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: accentColor,
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{g.snaps.length}</Text>
            </View>
          )}
          <Text style={{ color: theme.textSub, fontSize: 11, fontWeight: '500', maxWidth: 64, textAlign: 'center' }} numberOfLines={1}>
            {g.username || g.userName}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
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
  streakPersonal,
  streakBest,
  streakBuddyLabel,
  buddyMutual,
  onOpenStreakBuddy,
  streakLoggedIn,
  currentUserId,
  navigation,
}: {
  snaps: SnapPost[];
  isDark: boolean;
  refreshTick: number;
  onAddFriendPress: () => void;
  friends: UserProfile[];
  onOpenRadar: () => void;
  loading?: boolean;
  streakPersonal: number;
  streakBest: number;
  streakBuddyLabel: string;
  buddyMutual: number;
  onOpenStreakBuddy: () => void;
  streakLoggedIn: boolean;
  currentUserId?: string;
  navigation: any;
}) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? NIGHT.warm : LIGHT.accent;
  const [feedFilter, setFeedFilter] = useState<'everyone' | 'friends'>('friends');
  
  const friendIds = useMemo(() => new Set(friends.map(f => f.user_id)), [friends]);
  
  const filteredSnaps = useMemo(() => {
    if (feedFilter === 'everyone') {
      // Herkes sekmesi: Sadece herkese açık snap'ler (isPublic: true)
      return snaps.filter(snap => snap.isPublic !== false);
    }
    // Arkadaşlar sekmesi: Arkadaşların snap'leri + kendi snap'lerin
    return snaps.filter(snap => 
      friendIds.has(snap.userId) || snap.userId === currentUserId
    );
  }, [snaps, feedFilter, friendIds, currentUserId]);

  // Kullanıcı başına tek kart, kart içinde kullanıcının tüm snap'leri
  const groups = useMemo(() => {
    const g = groupSnapsByUser(filteredSnaps);
    if (g.length % 2 !== 0) {
      return [...g, { userId: '__placeholder__' } as SnapGroup];
    }
    return g;
  }, [filteredSnaps]);
  
  const handleSnapPress = useCallback((snap: SnapPost) => {
    // Tıklanan kart sahibinin tüm snap'lerini sırayla aç
    const userSnaps = filteredSnaps
      .filter(s => s.userId === snap.userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const snapList = userSnaps.map(s => ({
      id: s.id,
      imageUrl: s.imageUri,
      canView: true,
    }));
    
    // Tıklanan snap'in index'ini bul
    const initialIndex = userSnaps.findIndex(s => s.id === snap.id);
    
    // SnapView ekranına git
    navigation.navigate('SnapView', {
      imageUrl: snap.imageUri,
      canView: true,
      snapList,
      initialIndex: initialIndex >= 0 ? initialIndex : 0,
      userId: snap.userId,
      userName: snap.user?.name ?? snap.user?.username ?? '',
      isOwnSnap: snap.userId === currentUserId,
      reactionsEnabled: true,
    });
  }, [filteredSnaps, navigation]);
  
  const renderGroup = useCallback(({ item }: { item: SnapGroup }) => {
    if (item.userId === '__placeholder__') {
      return <View style={{ flex: 1 }} />;
    }
    return (
    <View style={{ flex: 1 }}>
      <SnapGroupCard
        group={item}
        onPress={handleSnapPress}
        isDark={isDark}
        currentUserId={currentUserId}
        onAvatarPress={(userId) => {
          navigation.navigate('SosyalProfile', { userId });
        }}
      />
    </View>
    );
  }, [handleSnapPress, isDark, currentUserId, navigation]);

  return (
    <FlatList
      data={groups}
      renderItem={renderGroup}
      keyExtractor={(item) => item.userId}
      extraData={refreshTick}
      numColumns={2}
      columnWrapperStyle={{ gap: 20 }}
      contentContainerStyle={styles.feedContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          <FeedHeader 
            isDark={isDark} 
            friends={friends} 
            onAddFriendPress={onAddFriendPress}
            feedFilter={feedFilter}
            onFilterChange={setFeedFilter}
          />
          <RadarCompactCard isDark={isDark} onPress={onOpenRadar} />
          <StreakStrip
            isDark={isDark}
            personal={streakPersonal}
            best={streakBest}
            buddyLabel={streakBuddyLabel}
            mutual={buddyMutual}
            onPressBuddy={onOpenStreakBuddy}
            loggedIn={streakLoggedIn}
          />
          {loading && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator size="small" color={accentColor} />
              <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 6 }}>Yükleniyor...</Text>
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

function FeedHeader({ 
  isDark, 
  friends, 
  onAddFriendPress, 
  feedFilter, 
  onFilterChange 
}: { 
  isDark: boolean; 
  friends: UserProfile[]; 
  onAddFriendPress: () => void;
  feedFilter: 'everyone' | 'friends';
  onFilterChange: (filter: 'everyone' | 'friends') => void;
}) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? NIGHT.warm : LIGHT.accent;
  
  return (
    <View style={styles.feedHeaderContainer}>
      <Text style={[styles.feedHeaderTitle, { color: theme.text }]}>Akış</Text>
      <Text style={[styles.feedHeaderSub, { color: theme.textSub }]}>
        {feedFilter === 'friends' ? 'Arkadaşlarının son 4 saati' : 'Herkesten son 4 saat'}
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={{ marginTop: 12 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {(['everyone', 'friends'] as const).map((f) => {
          const active = feedFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => onFilterChange(f)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? accentColor : 'transparent',
                borderWidth: 1.5,
                borderColor: active ? accentColor : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'),
              }}
            >
              <Text style={{
                color: active ? '#fff' : theme.textSub,
                fontSize: 14,
                fontWeight: '600',
              }}>
                {f === 'everyone' ? 'Herkes' : 'Arkadaşlar'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function StreakStrip({
  isDark,
  personal,
  best,
  buddyLabel,
  mutual,
  onPressBuddy,
  loggedIn,
}: {
  isDark: boolean;
  personal: number;
  best: number;
  buddyLabel: string;
  mutual: number;
  onPressBuddy: () => void;
  loggedIn: boolean;
}) {
  const theme = isDark ? DARK : LIGHT;
  const accentColor = isDark ? NIGHT.warm : LIGHT.accent;
  if (!loggedIn) return null;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressBuddy}
      style={{
        marginTop: 12,
        marginBottom: 4,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: isDark ? NIGHT.border : LIGHT.border,
        backgroundColor: isDark ? 'rgba(255,69,0,0.1)' : 'rgba(255,69,0,0.06)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Flame color={accentColor} size={22} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: '800' }}>
              {personal} gün zincir · en iyi {best}
            </Text>
            <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
              {buddyLabel
                ? `İkili: ${mutual} gün · ${buddyLabel}`
                : 'İkili zincir için dokunup arkadaş seç'}
            </Text>
          </View>
        </View>
        <Text style={{ color: accentColor, fontSize: 12, fontWeight: '700' }}>Düzenle</Text>
      </View>
    </TouchableOpacity>
  );
}

function FeedEmpty({ isDark, onAddFriendPress }: { isDark: boolean; onAddFriendPress: () => void }) {
  const theme = isDark ? DARK : LIGHT;
  return (
    <View style={styles.emptyContainer}>
      <Users color={isDark ? NIGHT.text : LIGHT.accent} size={40} strokeWidth={1.5} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>Henüz kıvılcım yok</Text>
      <Text style={[styles.emptySub, { color: theme.textSub }]}>
        Arkadaşlarını ekle ve anlık paylaşımlarını gör.
      </Text>
      <TouchableOpacity style={styles.emptyAddBtn} activeOpacity={0.85} onPress={onAddFriendPress}>
        <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.emptyAddBlur}>
          <UserPlus color={isDark ? NIGHT.warm : LIGHT.accent} size={16} strokeWidth={2} />
          <Text style={[styles.emptyAddText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>Arkadaş Ekle</Text>
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
  onDeleteConversation: (conversationId: string) => void;
  incomingRequests: FriendRequest[];
  onShowRequests: () => void;
}

function MessagesView({
  isDark, theme, conversations, searchQuery, setSearchQuery,
  isSearching, searchResults, loading, currentUserId, formatMsgTime, onNavigateChat,
  onDeleteConversation, incomingRequests, onShowRequests,
}: MessagesViewProps) {
  const accentColor = isDark ? NIGHT.warm : LIGHT.accent;

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
      <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
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
      onLongPress={() => {
        Alert.alert(
          'Sohbeti Sil',
          `${conv.other_user.name} ile olan tüm mesajlaşmayı silmek istediğine emin misin?`,
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Sil',
              style: 'destructive',
              onPress: () => onDeleteConversation(conv.conversation_id),
            },
          ]
        );
      }}
      delayLongPress={400}
    >
      <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
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
          style={[styles.requestsBanner, { backgroundColor: isDark ? 'rgba(255,69,0,0.14)' : 'rgba(255,69,0,0.09)', borderColor: isDark ? NIGHT.warm : LIGHT.accent }]}
        >
          <View style={[styles.requestsBadge, { backgroundColor: isDark ? NIGHT.vivid : LIGHT.accent }]}>
            <Text style={styles.requestsBadgeText}>{incomingRequests.length}</Text>
          </View>
          <Text style={[styles.requestsBannerText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
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

interface UserSnapMarker {
  latitude: number;
  longitude: number;
  avatarUrl: string | null;
  username: string;
  userId: string;
}

function RadarView() {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const theme = isDark ? DARK : LIGHT;
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [userMarkers, setUserMarkers] = useState<UserSnapMarker[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [districtSummary, setDistrictSummary] = useState('');
  const [loading, setLoading] = useState(true);

  const URFA_CENTER = {
    latitude: 37.1591,
    longitude: 38.7969,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  useEffect(() => {
    const fetchRadarData = async () => {
      try {
        const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
        let radarRows: any[] = [];

        // Önce anonim tabloyu dene (kimliksiz radar kaynağı)
        const { data: anonRows, error: anonErr } = await supabase
          .from('anonymous_posts')
          .select('latitude, longitude, district, created_at')
          .gte('created_at', since)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (!anonErr && anonRows && anonRows.length > 0) {
          radarRows = anonRows;
        } else {
          // Anonim tablo yoksa/yoksa social_posts ile devam et
          const { data: postRows, error: postErr } = await supabase
            .from('social_posts')
            .select('latitude, longitude, created_at, content, user_id')
            .gte('created_at', since)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (postErr || !postRows || postRows.length === 0) {
            setActiveCount(0);
            setDistrictSummary('');
            setUserMarkers([]);
            return;
          }
          radarRows = postRows.map((r: any) => ({
            ...r,
            district: typeof r.content === 'string' ? String(r.content).split(',')[0] : undefined,
          }));
        }

        // Kullanıcı profil resimlerini çek
        const userIds = [...new Set(radarRows.map(r => r.user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, avatar_url, username')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Kullanıcı marker'larını oluştur
        const markers: UserSnapMarker[] = radarRows
          .filter(r => r.user_id && profileMap.has(r.user_id))
          .map(r => {
            const profile = profileMap.get(r.user_id)!;
            return {
              latitude: r.latitude,
              longitude: r.longitude,
              avatarUrl: profile.avatar_url,
              username: profile.username,
              userId: r.user_id,
            };
          });

        // Her noktanın ağırlığını hesapla — yakın zamanlı = daha yüksek ağırlık
        const now = Date.now();
        const points: HeatPoint[] = radarRows.map((row: any) => {
          const age = now - new Date(row.created_at).getTime();
          const freshness = Math.max(0.2, 1 - age / (4 * 60 * 60 * 1000));
          return {
            latitude: row.latitude,
            longitude: row.longitude,
            weight: freshness,
            district: row.district ?? undefined,
          };
        });

        const districtCounts: Record<string, number> = {};
        points.forEach((p) => {
          const key = p.district?.trim();
          if (!key) return;
          districtCounts[key] = (districtCounts[key] ?? 0) + 1;
        });
        const topDistricts = Object.entries(districtCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => `${name} (${count})`);

        setHeatPoints(points);
        setUserMarkers(markers);
        setActiveCount(points.length);
        setDistrictSummary(topDistricts.join(', '));
      } catch {
        // Hata durumunda mock veri kalır
      } finally {
        setLoading(false);
      }
    };

    fetchRadarData();
    // Her 2 dakikada bir yenile
    const interval = setInterval(fetchRadarData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
        {Platform.OS === 'android' && heatPoints.length > 0 && (
          <Heatmap
            points={heatPoints}
            radius={40}
            opacity={0.85}
            gradient={{
              colors: isDark ? ['#22c55e', '#38bdf8', '#ef4444'] : ['#86efac', '#fbbf24', '#fb7185'],
              startPoints: [0.1, 0.5, 1.0],
              colorMapSize: 256,
            }}
          />
        )}

        {/* Kullanıcı profil resimleri marker'ları */}
        {userMarkers.map((marker, i) => (
          <Marker
            key={`user-${marker.userId}-${i}`}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 3,
              borderColor: isDark ? '#FF4500' : '#f59e0b',
              backgroundColor: isDark ? '#1e293b' : '#fff',
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}>
              {marker.avatarUrl ? (
                <Image
                  source={{ uri: processImageUrl(marker.avatarUrl) || undefined }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: isDark ? '#334155' : '#e2e8f0',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    {marker.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </Marker>
        ))}

        {/* iOS: gerçek noktalara marker (heatmap için) */}
        {Platform.OS !== 'android' && heatPoints.map((pt, i) => (
          <Marker
            key={`heat-${i}`}
            coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={{
              width: Math.max(10, (pt.weight ?? 0.5) * 24),
              height: Math.max(10, (pt.weight ?? 0.5) * 24),
              borderRadius: 99,
              backgroundColor: isDark
                ? `rgba(14,165,233,${0.28 + (pt.weight ?? 0.5) * 0.52})`
                : `rgba(239,68,68,${0.25 + (pt.weight ?? 0.5) * 0.45})`,
            }} />
          </Marker>
        ))}
      </MapView>

      {/* iOS'ta gerçek veri varsa hafif gradient overlay */}
      {Platform.OS !== 'android' && heatPoints.length > 0 && (
        <View pointerEvents="none" style={styles.radarIosFallback}>
          <LinearGradient
            colors={isDark
              ? ['rgba(34,197,94,0.08)', 'rgba(56,189,248,0.07)', 'rgba(239,68,68,0.04)']
              : ['rgba(134,239,172,0.08)', 'rgba(251,191,36,0.05)', 'rgba(251,113,133,0.04)']}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}

      {/* Veri yoksa boş durum mesajı */}
      {!loading && heatPoints.length === 0 && (
        <View pointerEvents="none" style={{ position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ backgroundColor: isDark ? 'rgba(6,12,26,0.75)' : 'rgba(255,255,255,0.80)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ color: theme.textSub, fontSize: 13, textAlign: 'center' }}>
              Henüz bu bölgede paylaşım yok
            </Text>
          </View>
        </View>
      )}

      {/* Üst Radar Başlığı */}
      <View style={styles.radarHeaderOverlay}>
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={[styles.radarHeaderBlur, { borderColor: 'rgba(255,69,0,0.35)' }]}>
          <LinearGradient colors={['#FF4500', '#FF6B35']} style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
            <Radio color="#fff" size={15} strokeWidth={2.2} />
          </LinearGradient>
          <Text style={[styles.radarHeaderText, { color: theme.text }]}>Şehir Radarı</Text>
          <View style={styles.radarLiveDot} />
          <Text style={styles.radarLiveText}>CANLI</Text>
          {loading && <ActivityIndicator size="small" color="#FF4500" style={{ marginLeft: 6 }} />}
        </BlurView>
      </View>

      {/* Alt açıklama kartı */}
      <View style={styles.radarLegendOuter}>
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.radarLegendBlur}>
          <Text style={[styles.radarLegendTitle, { color: theme.text }]}>
            Son 4 saatteki hareketlilik
            {activeCount > 0 ? ` · ${activeCount} paylaşım` : ''}
          </Text>
          {districtSummary ? (
            <Text style={[styles.radarLegendNote, { color: theme.textSub, marginBottom: 6 }]}>
              En hareketli bölgeler: {districtSummary}
            </Text>
          ) : null}
          <View style={styles.radarLegendBar}>
            <LinearGradient
              colors={['#22c55e', '#FF6B35', '#FF4500']}
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
  const [friendSearchResults, setFriendSearchResults] = useState<UserProfile[]>([]);
  const [friendSearching, setFriendSearching] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrScanVisible, setQrScanVisible] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState<SnapPost | null>(null);
  const [snapReplyText, setSnapReplyText] = useState('');
  const [snapReplySending, setSnapReplySending] = useState(false);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [capturedIsVideo, setCapturedIsVideo] = useState(false);
  const [cameraCaptureMode, setCameraCaptureMode] = useState<'photo' | 'video'>('photo');
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [friendPhone, setFriendPhone] = useState('');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const cameraRef = useRef<any>(null);
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [snapGroupMode, setSnapGroupMode] = useState(false);
  const [groupRecipientIds, setGroupRecipientIds] = useState<string[]>([]);
  const [groupPickModalVisible, setGroupPickModalVisible] = useState(false);
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [streakBest, setStreakBest] = useState(0);
  const [streakBuddyUserId, setStreakBuddyUserId] = useState<string | null>(null);
  const [streakBuddyLabel, setStreakBuddyLabel] = useState('');
  const [buddyMutual, setBuddyMutual] = useState(0);
  const [streakBuddyModalVisible, setStreakBuddyModalVisible] = useState(false);
  const [streakBuddyPickId, setStreakBuddyPickId] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(0);
  const tabAnim = useRef(new Animated.Value(0)).current;
  const cameraScale = useRef(new Animated.Value(1)).current;

  // Tepki state
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const [reactionInput, setReactionInput] = useState('');
  const [reactionSending, setReactionSending] = useState(false);
  const REACTION_EMOJIS = ['🔥', '❤️', '😍', '😂', '👏', '⚡'];

  // Zoom state
  const [cameraZoom, setCameraZoom] = useState(0);
  const lastZoomRef = useRef(0);
  const [flashMode, setFlashMode] = useState<'off' | 'auto' | 'on'>('off');
  const [gridVisible, setGridVisible] = useState(false);
  const [timerSec, setTimerSec] = useState<0 | 3 | 10>(0);
  const [timerCountdown, setTimerCountdown] = useState<number | null>(null);
  const [exposure, setExposure] = useState(0);
  const exposurePanY = useRef(new Animated.Value(0)).current;
  const exposurePanRef = useRef<any>(null);

  const cycleFlash = useCallback(() => {
    setFlashMode(f => f === 'off' ? 'auto' : f === 'auto' ? 'on' : 'off');
  }, []);
  const cycleTimer = useCallback(() => {
    setTimerSec(t => t === 0 ? 3 : t === 3 ? 10 : 0);
  }, []);

  const handleTakePhotoWithTimer = useCallback(() => {
    if (timerSec === 0) { handleTakePhoto(); return; }
    setTimerCountdown(timerSec);
    let count = timerSec;
    const iv = setInterval(() => {
      count -= 1;
      setTimerCountdown(count);
      if (count === 0) {
        clearInterval(iv);
        setTimerCountdown(null);
        handleTakePhoto();
      }
    }, 1000);
  }, [timerSec, handleTakePhoto]);

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
  // Snap bildirimlerinde arkadaş listesine erişmek için ref
  const friendsRef = useRef<UserProfile[]>([]);

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
    } else {
      setStreakCurrent(0);
      setStreakBest(0);
      setStreakBuddyUserId(null);
      setStreakBuddyLabel('');
      setBuddyMutual(0);
    }
  }, [currentUserId]);

  // Ekrana her dönüşte snap feed'ini arka planda yenile (mevcut snap'leri silmeden)
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        // Küçük gecikme ile yenile — ekran geçişi tamamlansın
        const timer = setTimeout(() => {
          fetchFriends(currentUserId);
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [currentUserId])
  );

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

  const loadStreakData = useCallback(async (userId: string) => {
    const resetAll = () => {
      setStreakCurrent(0);
      setStreakBest(0);
      setStreakBuddyUserId(null);
      setStreakBuddyLabel('');
      setBuddyMutual(0);
    };
    try {
      // Önce sadece streak sayıları — buddy kolonu DB'de yoksa bile uygulama kırılmasın
      const { data: row, error } = await supabase
        .from('user_profiles')
        .select('snap_streak_current, snap_streak_best')
        .eq('user_id', userId)
        .single();
      if (error || !row) {
        resetAll();
        return;
      }
      setStreakCurrent(Number(row.snap_streak_current) || 0);
      setStreakBest(Number(row.snap_streak_best) || 0);

      let bid: string | null = null;
      const buddyRow = await supabase
        .from('user_profiles')
        .select('streak_buddy_user_id')
        .eq('user_id', userId)
        .maybeSingle();
      if (!buddyRow.error && buddyRow.data) {
        bid = (buddyRow.data as { streak_buddy_user_id?: string | null }).streak_buddy_user_id ?? null;
      }
      setStreakBuddyUserId(bid);
      if (bid) {
        const { data: bp } = await supabase
          .from('user_profiles')
          .select('name, username')
          .eq('user_id', bid)
          .single();
        setStreakBuddyLabel(bp?.username ? `@${bp.username}` : (bp?.name ?? ''));
        const { data: mutual, error: mErr } = await supabase.rpc('buddy_mutual_snap_streak', {
          p_a: userId,
          p_b: bid,
        });
        setBuddyMutual(!mErr && typeof mutual === 'number' ? mutual : 0);
      } else {
        setStreakBuddyLabel('');
        setBuddyMutual(0);
      }
    } catch {
      resetAll();
    }
  }, []);

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

      if (friendIds.length === 0) {
        setFriends([]);
        await loadStreakData(userId);
        return;
      }

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', friendIds);
      if (profiles) {
        setFriends(profiles);
        friendsRef.current = profiles;
        // Arkadaşların snap'lerini de çek
        await fetchFriendSnaps([userId, ...friendIds]);
      }
      await loadStreakData(userId);
    } catch {
      // sessiz hata
    }
  };

  const fetchFriendSnaps = async (userIds: string[]) => {
    setSnapsLoading(true);
    const userId = profile?.userId;
    try {
      const expiryThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      // Snap'leri çek — son 4 saat; foto (image_url) veya video (video_url)
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select('id, user_id, image_url, video_url, content, latitude, longitude, created_at, expires_at, viewed_by, recipient_user_ids')
        .in('user_id', userIds)
        .or('image_url.not.is.null,video_url.not.is.null')
        .gte('created_at', expiryThreshold)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Hata varsa mevcut snap'leri koru, silme
        return;
      }
      const visiblePosts = (posts ?? []).filter((post: any) => {
        const hasImg = post.image_url && String(post.image_url).trim() !== '';
        const hasVid = post.video_url && String(post.video_url).trim() !== '';
        if (!hasImg && !hasVid) return false;
        
        // Kendi kıvılcımlarımız listede kalabilir
        if (post.user_id === userId) return true;
        
        // Recipient kontrolü
        const rec = post.recipient_user_ids;
        if (Array.isArray(rec) && rec.length > 0) {
          if (!userId || !rec.includes(userId)) return false;
        }
        
        // Tüm snap'leri göster (görülmüş olanlar dahil) - filtreleme yok
        return true;
      });

      if (visiblePosts.length === 0) {
        // Supabase'de kayıt yoksa local snap'leri de temizle
        // ama sadece Supabase'e kaydedilmiş olanları — local URI'leri koru
        setSnaps(prev => prev.filter(s => s.imageUri.startsWith('http')));
        return;
      }

      // Benzersiz user_id'leri topla, profilleri tek sorguda çek (is_public dahil)
      const uniqueUserIds = [...new Set(visiblePosts.map((p: any) => p.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name, username, avatar_url, is_public')
        .in('user_id', uniqueUserIds);

      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p; });

      const mapped: SnapPost[] = visiblePosts.map((post: any) => {
        const createdAt = new Date(post.created_at);
        const expiresAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000);
        const prof = profileMap[post.user_id];
        const vUrl = post.video_url && String(post.video_url).trim() !== '' ? post.video_url : '';
        const isVid = !!vUrl;
        return {
          id: post.id,
          userId: post.user_id,
          user: {
            id: post.user_id,
            name: prof?.name ?? 'Kullanıcı',
            username: prof?.username ?? '',
            avatarColor: '#f59e0b',
            avatarUrl: prof?.avatar_url,
          },
          imageUri: isVid ? vUrl : (post.image_url ?? ''),
          ...(isVid ? { isVideo: true } : {}),
          location: {
            lat: post.latitude ?? 37.1591,
            lng: post.longitude ?? 38.7969,
            label: post.content || 'Şanlıurfa',
          },
          created_at: createdAt,
          expires_at: expiresAt,
          seen: false,
          viewedBy: Array.isArray(post.viewed_by) ? post.viewed_by : [],
          isPublic: prof?.is_public ?? true, // Gizlilik ayarı
        };
      });
      setSnaps(mapped);
    } catch {
      // Hata durumunda mevcut snap'leri koru
    } finally {
      setSnapsLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    const userId = profile?.userId;
    if (!userId) return;
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

      // Gönderene "isteğin kabul edildi" bildirimi gönder
      const myName = profile?.name || profile?.username || 'Biri';
      notify.friendAccepted(senderId, myName).catch(() => {});

      await fetchIncomingRequests(userId);
      await fetchConversations(userId);
      await fetchFriends(userId);
      Alert.alert('Arkadaş Eklendi! 🎉', 'Artık mesajlaşabilir ve anlık görüntü atabilirsiniz.');
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const userId = profile?.userId;
    if (!userId) return;
    try {
      await supabase
        .from('friendships')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);
      await fetchIncomingRequests(userId);
    } catch (e: any) {
      Alert.alert('Hata', e.message);
    }
  };

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    const userId = profile?.userId;
    if (!userId) return;
    try {
      // Sadece bu kullanıcı için gizle (veritabanından silme)
      await supabase
        .from('conversation_participants')
        .update({ hidden: true })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      
      // Listeden kaldır
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId));
    } catch {
      Alert.alert('Hata', 'Sohbet gizlenemedi.');
    }
  }, [profile?.userId]);

  const fetchConversations = async (userId: string) => {
    setMessagesLoading(true);
    try {
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId)
        .or('hidden.is.null,hidden.eq.false'); // null veya false olanları getir
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

  const createLocalSnap = useCallback((uri: string, isVideo = false): SnapPost => ({
    id: `local-${Date.now()}`,
    userId: profile?.userId ?? 'me',
    user: {
      id: profile?.userId ?? 'me',
      name: profile?.name ?? 'Sen',
      username: profile?.username ?? 'me',
      avatarColor: isDark ? '#FF4500' : '#FF6B35',
      avatarUrl: profile?.avatarUrl,
    },
    imageUri: uri,
    ...(isVideo ? { isVideo: true } : {}),
    location: { lat: 37.1591, lng: 38.7969, label: 'Şanlıurfa' },
    created_at: new Date(),
    expires_at: new Date(Date.now() + SNAP_EXPIRES_MS),
    seen: false,
    isPublic: true, // Local snap'ler için varsayılan
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
    setSnapGroupMode(false);
    setGroupRecipientIds([]);
    setCameraCaptureMode('photo');
    setIsRecordingVideo(false);
    recordingPromiseRef.current = null;
    setCameraVisible(true);
  }, [cameraScale, cameraPermission, requestCameraPermission]);

  const handleTakePhoto = useCallback(async () => {
    if (cameraCaptureMode !== 'photo' || !cameraRef.current || cameraBusy) return;
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
        // Ön kameradaysa fotoğrafı yatay flip et
        if (cameraFacing === 'front') {
          const flipped = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
          );
          setCapturedIsVideo(false);
          setCapturedPhotoUri(flipped.uri);
        } else {
          setCapturedIsVideo(false);
          setCapturedPhotoUri(photo.uri);
        }
      }
    } finally {
      setCameraBusy(false);
    }
  }, [cameraBusy, cameraCaptureMode, cameraFacing]);

  const handleVideoRecordToggle = useCallback(async () => {
    if (cameraCaptureMode !== 'video' || !cameraRef.current || cameraBusy) return;

    if (!isRecordingVideo) {
      const mic = microphonePermission ?? await requestMicrophonePermission();
      if (!mic?.granted) {
        Alert.alert('Mikrofon', 'Video kıvılcımı için mikrofon iznine ihtiyaç var.');
        return;
      }
      try {
        setCameraBusy(true);
        await new Promise<void>(r => setTimeout(r, 320));
        const p = cameraRef.current.recordAsync({ maxDuration: 60 });
        recordingPromiseRef.current = p;
        setIsRecordingVideo(true);
      } catch (e: any) {
        recordingPromiseRef.current = null;
        Alert.alert('Video', e?.message ?? 'Kayıt başlatılamadı.');
      } finally {
        setCameraBusy(false);
      }
      return;
    }

    try {
      setCameraBusy(true);
      cameraRef.current?.stopRecording?.();
      setIsRecordingVideo(false);
      const result = await recordingPromiseRef.current;
      recordingPromiseRef.current = null;
      if (result?.uri) {
        setCapturedIsVideo(true);
        setCapturedPhotoUri(result.uri);
      } else {
        Alert.alert('Video', 'Kayıt dosyası alınamadı.');
      }
    } catch (e: any) {
      recordingPromiseRef.current = null;
      setIsRecordingVideo(false);
    } finally {
      setCameraBusy(false);
    }
  }, [cameraCaptureMode, isRecordingVideo]);

  const toggleCameraFacing = useCallback(() => {
    setCameraFacing(prev => prev === 'back' ? 'front' : 'back');
  }, []);

  const handleDiscardPhoto = useCallback(() => {
    setCapturedPhotoUri(null);
    setCapturedIsVideo(false);
  }, []);

  const uploadSnapToSupabase = useCallback(async (
    mediaUri: string,
    userId: string,
    localSnapId: string,
    recipientIds: string[] | null,
    isVideo: boolean,
  ) => {
    try {
      // 1. Auth token
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      if (!authToken) {
        Alert.alert('Oturum Hatası', 'Lütfen tekrar giriş yap.');
        return;
      }

      // 2. Dosyayı yükle
      const ext = isVideo ? 'mp4' : 'jpg';
      const contentType = isVideo ? 'video/mp4' : 'image/jpeg';
      const fileName = `${userId}/${Date.now()}.${ext}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/snaps/${fileName}`;

      const fetchResp = await fetch(mediaUri);
      if (!fetchResp.ok) {
        Alert.alert('Dosya Hatası', `Medya okunamadı: ${fetchResp.status}`);
        return;
      }
      const blob = await fetchResp.blob();
      if (blob.size === 0) {
        Alert.alert('Dosya Hatası', 'Dosya boş geldi.');
        return;
      }

      const uploadResp = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: blob,
      });

      if (!uploadResp.ok) {
        const errText = await uploadResp.text();
        Alert.alert('Yükleme Hatası', `${uploadResp.status}: ${errText}`);
        return;
      }

      // 3. Public URL al
      const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // 4. Konum al (sessizce, hata olursa varsayılan)
      let latitude: number = 37.1591 + (Math.random() - 0.5) * 0.04;
      let longitude: number = 38.7969 + (Math.random() - 0.5) * 0.04;
      let locationLabel = 'Şanlıurfa';
      try {
        const locPerm = await Location.getForegroundPermissionsAsync();
        if (locPerm.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
          // Koordinatları mahalle/ilçe adına çevir
          const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo) {
            const parts = [geo.district || geo.subregion, geo.city || geo.region].filter(Boolean);
            locationLabel = parts.join(', ') || 'Şanlıurfa';
          }
        }
      } catch { /* konum alınamazsa varsayılan kullan */ }

      // 5. Veritabanına kaydet
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
      const row: Record<string, unknown> = {
        user_id: userId,
        content: locationLabel,
        latitude,
        longitude,
        expires_at: expiresAt,
      };
      if (isVideo) {
        row.video_url = publicUrl;
        row.image_url = null;
      } else {
        row.image_url = publicUrl;
      }
      if (recipientIds && recipientIds.length >= GROUP_KIVILCIM_MIN) {
        row.recipient_user_ids = recipientIds.slice(0, GROUP_KIVILCIM_MAX);
      }

      const { error: insertError } = await supabase.from('social_posts').insert(row);

      if (insertError) {
        Alert.alert('Kayıt Hatası', insertError.message);
        return;
      }

      // Radar anonim veri kaynağı: kimliksiz nokta kaydı (tablo yoksa sessizce geç)
      await supabase.from('anonymous_posts').insert({
        latitude,
        longitude,
        district: locationLabel,
        created_at: new Date().toISOString(),
      });

      const { error: rpcErr } = await supabase.rpc('refresh_snap_streak', { p_user_id: userId });
      if (rpcErr) {
        /* Kolon/RPC yoksa streak sunucuda güncellenmez; yine de profili yenile */
      }
      void loadStreakData(userId);

      // 6. Local snap'i gerçek URL ile güncelle
      setSnaps(prev =>
        prev.map(s =>
          s.id === localSnapId
            ? { ...s, imageUri: publicUrl, ...(isVideo ? { isVideo: true } : { isVideo: undefined }) }
            : s
        )
      );

      // 7. Arkadaşlara bildirim (grup veya tümü)
      const myName = profile?.name || profile?.username || 'Biri';
      const targets =
        recipientIds && recipientIds.length >= GROUP_KIVILCIM_MIN
          ? recipientIds.slice(0, GROUP_KIVILCIM_MAX)
          : friendsRef.current.map(f => f.user_id);
      const n = targets.length;
      targets.forEach((fid) => {
        if (recipientIds && recipientIds.length >= GROUP_KIVILCIM_MIN) {
          notify.groupSnap(fid, myName, n).catch(() => {});
        } else {
          notify.newSnap(fid, myName).catch(() => {});
        }
      });
    } catch (e: any) {
      Alert.alert('Beklenmeyen Hata', e?.message ?? 'Kıvılcım kaydedilemedi.');
    }
  }, [profile, loadStreakData]);

  const handleConfirmPhoto = useCallback(async () => {
    if (!capturedPhotoUri) {
      Alert.alert('Hata', 'Medya bulunamadı.');
      return;
    }
    if (!profile?.userId) {
      Alert.alert(
        'Giriş Gerekiyor',
        'Kıvılcım paylaşmak için ŞanlıSosyal hesabınla giriş yapman gerekiyor.',
        [{ text: 'Tamam', style: 'default' }]
      );
      return;
    }

    // URI'yi local değişkene al — state sıfırlanmadan önce kullanmak için
    const photoUri = capturedPhotoUri;
    const isVid = capturedIsVideo;
    const userId = profile.userId;

    if (snapGroupMode) {
      if (friends.length < GROUP_KIVILCIM_MIN) {
        Alert.alert(
          'Grup kıvılcımı',
          `Grup kıvılcımı için en az ${GROUP_KIVILCIM_MIN} arkadaşın olmalı.`,
        );
        return;
      }
      if (groupRecipientIds.length < GROUP_KIVILCIM_MIN) {
        Alert.alert(
          'Grup kıvılcımı',
          `En az ${GROUP_KIVILCIM_MIN}, en fazla ${GROUP_KIVILCIM_MAX} arkadaş seç.`,
        );
        return;
      }
    }

    const recipientsForUpload =
      snapGroupMode && groupRecipientIds.length >= GROUP_KIVILCIM_MIN
        ? groupRecipientIds.slice(0, GROUP_KIVILCIM_MAX)
        : null;

    // Önce local snap ile UI'ı anında güncelle (optimistic)
    const localSnap = createLocalSnap(photoUri, isVid);
    setSnaps(prev => [localSnap, ...prev]);
    setSelectedSnap(localSnap);
    setCapturedPhotoUri(null);
    setCapturedIsVideo(false);
    setCameraVisible(false);
    setSnapGroupMode(false);
    setGroupRecipientIds([]);

    // Arka planda Supabase'e yükle
    uploadSnapToSupabase(photoUri, userId, localSnap.id, recipientsForUpload, isVid);
  }, [
    capturedPhotoUri,
    capturedIsVideo,
    createLocalSnap,
    profile?.userId,
    snapGroupMode,
    groupRecipientIds,
    friends.length,
    uploadSnapToSupabase,
  ]);

  const handleRetakePhoto = useCallback(() => {
    setCapturedPhotoUri(null);
    setCapturedIsVideo(false);
  }, []);

  // Snap'in Supabase ID'sini tutmak için ref (kapanışta silmek için)
  const viewingSnapDbId = useRef<string | null>(null);

  const handleAddFriendPress = useCallback(() => {
    setFriendPhone('');
    setFriendSearchResults([]);
    setFriendModalVisible(true);
  }, []);

  const handleSearchFriend = useCallback(async (query: string) => {
    setFriendPhone(query);
    
    if (query.trim().length < 2) {
      setFriendSearchResults([]);
      return;
    }

    setFriendSearching(true);
    try {
      const cleanInput = query.trim().toLowerCase().replace('@', '');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, name, username, avatar_url')
        .or(`username.ilike.%${cleanInput}%,name.ilike.%${cleanInput}%`)
        .limit(10);

      if (!error && data) {
        // Kendini filtrele
        const filtered = data.filter((u: any) => u.user_id !== currentUserId);
        setFriendSearchResults(filtered);
      } else {
        setFriendSearchResults([]);
      }
    } catch {
      setFriendSearchResults([]);
    } finally {
      setFriendSearching(false);
    }
  }, [currentUserId]);

  const handleSelectFriendFromSearch = useCallback(async (selectedUser: UserProfile) => {
    try {
      const userId = profile?.userId;
      if (!userId) return;

      // Zaten arkadaş veya istek var mı kontrol et
      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${userId})`)
        .single();

      if (existing) {
        if (existing.status === 'accepted') {
          Alert.alert('Zaten Arkadaşsınız', `${selectedUser.name || selectedUser.username} ile zaten arkadaşsınız.`);
        } else if (existing.status === 'pending') {
          Alert.alert('İstek Gönderildi', `${selectedUser.name || selectedUser.username} kullanıcısına zaten istek gönderilmiş, onay bekleniyor.`);
        }
        return;
      }

      // Arkadaşlık isteği gönder
      const { error: insertError } = await supabase
        .from('friendships')
        .insert({ sender_id: userId, receiver_id: selectedUser.user_id, status: 'pending' });

      if (insertError) throw insertError;

      // Alıcıya bildirim gönder
      const myName = profile?.name || profile?.username || 'Biri';
      notify.friendRequest(selectedUser.user_id, myName).catch(() => {});

      setFriendPhone('');
      setFriendSearchResults([]);
      setFriendModalVisible(false);
      Alert.alert('İstek Gönderildi! 🎉', `${selectedUser.name || selectedUser.username} kullanıcısına arkadaşlık isteği gönderildi. Kabul edince mesajlaşabilirsiniz.`);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Bir hata oluştu.');
    }
  }, [profile, currentUserId]);

  const handleQrScanned = useCallback(async ({ data: qrData }: { data: string }) => {
    if (qrScanned) return;
    setQrScanned(true);

    // QR format: sanligencsosyal://add/<username>
    const match = qrData.match(/sanligencsosyal:\/\/add\/(.+)/);
    if (!match) {
      Alert.alert('Geçersiz QR', 'Bu QR kodu ŞanlıSosyal\'e ait değil.', [
        { text: 'Tekrar Dene', onPress: () => setQrScanned(false) },
        { text: 'Kapat', onPress: () => { setQrScanVisible(false); setQrScanned(false); } },
      ]);
      return;
    }

    const scannedUsername = match[1].toLowerCase();
    setQrScanVisible(false);

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, name, username')
        .ilike('username', scannedUsername)
        .single();

      if (error || !data) {
        Alert.alert('Bulunamadı', 'Bu QR koduna ait kullanıcı bulunamadı.');
        setQrScanned(false);
        return;
      }

      const userId = profile?.userId;
      if (!userId) { setQrScanned(false); return; }
      if (data.user_id === userId) {
        Alert.alert('Bu senin QR kodun!', 'Kendi QR kodunu okutamazsın.');
        setQrScanned(false);
        return;
      }

      const { data: existing } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${data.user_id}),and(sender_id.eq.${data.user_id},receiver_id.eq.${currentUserId})`)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'accepted') {
          Alert.alert('Zaten Arkadaşsınız', `@${data.username} ile zaten arkadaşsınız.`);
        } else {
          Alert.alert('İstek Mevcut', `@${data.username} kullanıcısına zaten istek gönderilmiş.`);
        }
        setQrScanned(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('friendships')
        .insert({ sender_id: currentUserId, receiver_id: data.user_id, status: 'pending' });

      if (insertError) throw insertError;

      // Alıcıya bildirim gönder
      const myName = profile?.name || profile?.username || 'Biri';
      notify.friendRequest(data.user_id, myName).catch(() => {});

      Alert.alert('İstek Gönderildi! 🎉', `@${data.username} kullanıcısına arkadaşlık isteği gönderildi.`);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Bir hata oluştu.');
    } finally {
      setQrScanned(false);
    }
  }, [qrScanned, currentUserId, profile]);

  const toggleGroupRecipient = useCallback((id: string) => {
    setGroupRecipientIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= GROUP_KIVILCIM_MAX) return prev;
      return [...prev, id];
    });
  }, []);

  const saveStreakBuddy = useCallback(async () => {
    const userId = profile?.userId;
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ streak_buddy_user_id: streakBuddyPickId })
        .eq('user_id', userId);
      if (error) throw error;
      setStreakBuddyModalVisible(false);
      await loadStreakData(userId);
    } catch (e: any) {
      const msg = e?.message ?? '';
      const schemaHint =
        /schema cache|could not find|column/i.test(msg)
          ? '\n\nSupabase SQL Editor’da database/14_streak_and_group_snap.sql dosyasını çalıştırın. Sonra Dashboard → Project Settings → Data API → Reload schema (veya birkaç dakika bekleyin).'
          : '';
      Alert.alert('Hata', (msg || 'Kaydedilemedi.') + schemaHint);
    }
  }, [profile?.userId, streakBuddyPickId, loadStreakData]);

  const handleCloseSnapViewer = useCallback(() => {
    const snapId = viewingSnapDbId.current;
    viewingSnapDbId.current = null;
    setSelectedSnap(null);

    if (snapId && profile?.userId) {
      // Görüntülendi olarak işaretle ve feed'den kaldır
      (async () => {
        try {
          await supabase.rpc('mark_snap_viewed', {
            snap_id: snapId,
            viewer_id: profile.userId,
          });
        } catch { /* sessiz */ }
        // Her durumda feed'den kaldır
        setSnaps(prev => prev.filter(s => s.id !== snapId));
      })();
    }
  }, [profile?.userId]);

  const handleSnapReply = useCallback(async (text: string) => {
    const userId = profile?.userId;
    if (!selectedSnap || !userId || !text.trim()) return;
    const recipientId = selectedSnap.user.id;
    if (recipientId === userId) return; // Kendi snap'ine yanıt yok

    setSnapReplySending(true);
    try {
      const trimmed = text.trim();
      const isQuickReaction = /^(❤️|🔥|😂|😮|👏)$/.test(trimmed);
      const created = selectedSnap.created_at instanceof Date
        ? selectedSnap.created_at
        : new Date(selectedSnap.created_at);
      const timeStr = created.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const who = selectedSnap.user.username
        ? `${selectedSnap.user.name} (@${selectedSnap.user.username})`
        : selectedSnap.user.name;
      const locPart = selectedSnap.location?.label
        ? `\n📍 ${selectedSnap.location.label}`
        : '';
      /** Mesajda hangi kıvılcıma tepki verildiği net görünsün */
      const snapRefBlock =
        `Hangisi: ${who} kıvılcımı\n📅 ${timeStr}${locPart}`;
      const messageContent = isQuickReaction
        ? `Tepki: ${trimmed}\n────────\n${snapRefBlock}`
        : `Yanıt: ${trimmed}\n────────\n${snapRefBlock}`;

      // Konuşmayı bul veya oluştur
      const { data: convData } = await supabase.rpc('get_or_create_conversation', {
        user1_id: currentUserId,
        user2_id: recipientId,
      });
      const convId = convData;
      if (!convId) throw new Error('Konuşma oluşturulamadı');

      // Önizleme: sadece kalıcı URL (Supabase); file:// karşı tarafa gitmez
      const previewUrl =
        selectedSnap.imageUri && selectedSnap.imageUri.startsWith('http')
          ? selectedSnap.imageUri
          : null;

      // Mesajı gönder (görsel önizleme = hangi kıvılcıma tepki)
      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: currentUserId,
        content: messageContent,
        ...(previewUrl ? { image_url: previewUrl } : {}),
      });

      setSnapReplyText('');
      // Snap'i kapat
      handleCloseSnapViewer();
    } catch {
      Alert.alert('Hata', 'Yanıt gönderilemedi.');
    } finally {
      setSnapReplySending(false);
    }
  }, [selectedSnap, profile?.userId, handleCloseSnapViewer]);

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
        colors={isDark ? ['#0A0200', '#0F0300', '#000000'] : ['#FFF8F5', '#FFF2EC', '#ffffff']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Ambient ışık huzmesi */}
      <View style={[styles.amberOrb, { backgroundColor: isDark ? 'rgba(255,69,0,0.08)' : 'rgba(255,107,53,0.07)' }]} />

      {/* ── SafeArea + Header ── */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          {/* Geri butonu */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.border, marginRight: 8 }]}
          >
            <ArrowLeft color={isDark ? NIGHT.warm : LIGHT.accent} size={20} strokeWidth={2} />
          </TouchableOpacity>
          
          {/* Sol: Profil butonu — tıklanınca SosyalProfile açılır */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SosyalProfile')}
            style={styles.headerProfileBtn}
          >
            <View style={[styles.headerAvatarCircle, { backgroundColor: isDark ? NIGHT.glow : 'rgba(96,165,250,0.15)', borderColor: isDark ? NIGHT.border : 'rgba(96,165,250,0.3)' }]}>
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: processImageUrl(profile.avatarUrl) || undefined }}
                  style={{ width: '100%', height: '100%', borderRadius: 18 }}
                />
              ) : (
                <Text style={[styles.headerAvatarInitial, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
                  {profile?.name?.charAt(0).toUpperCase() ?? 'S'}
                </Text>
              )}
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>⚡ Kıvılcım</Text>
              <Text style={[styles.headerSub, { color: isDark ? NIGHT.text : LIGHT.accent }]}>
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
              <UserPlus color={isDark ? NIGHT.warm : LIGHT.accent} size={18} strokeWidth={2} />
            </TouchableOpacity>
            {/* ŞanlıSosyal bildirimleri */}
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.8}
              onPress={() => setRequestsModalVisible(true)}
            >
              {incomingRequests.length > 0 && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: isDark ? NIGHT.vivid : '#ef4444', zIndex: 1 }} />
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
            onAddFriendPress={handleAddFriendPress}
            friends={friends}
            onOpenRadar={() => setRadarModalVisible(true)}
            loading={snapsLoading}
            streakPersonal={streakCurrent}
            streakBest={streakBest}
            streakBuddyLabel={streakBuddyLabel}
            buddyMutual={buddyMutual}
            streakLoggedIn={!!currentUserId}
            currentUserId={profile?.userId}
            navigation={navigation}
            onOpenStreakBuddy={() => {
              setStreakBuddyPickId(streakBuddyUserId);
              setStreakBuddyModalVisible(true);
            }}
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
            onDeleteConversation={handleDeleteConversation}
            onNavigateChat={(userId, userName, userAvatar, username) =>
              navigation.navigate('Chat', { userId, userName, userAvatar, username })
            }
          />
        )}
      </View>

      {/* ── Yeni Alt Bar: Akış | Kamera Orb | Mesajlar ── */}
      <SafeAreaView edges={['bottom']} style={[styles.sosyalBottomBar, { backgroundColor: isDark ? 'rgba(0,0,0,0.94)' : 'rgba(248,250,252,0.95)', borderTopColor: isDark ? DARK.border : LIGHT.border }]}>
        {/* Akış */}
        <TouchableOpacity
          style={styles.sosyalBottomTab}
          activeOpacity={0.75}
          onPress={() => switchTab('feed')}
        >
          <Users
            size={22}
            strokeWidth={activeTab === 'feed' ? 2.5 : 1.8}
            color={activeTab === 'feed' ? (isDark ? NIGHT.warm : LIGHT.accent) : theme.textSub}
          />
          <Text style={[styles.sosyalBottomLabel, { color: activeTab === 'feed' ? (isDark ? NIGHT.warm : LIGHT.accent) : theme.textSub, fontWeight: activeTab === 'feed' ? '700' : '500' }]}>
            Akış
          </Text>
        </TouchableOpacity>

        {/* Kamera Orb — merkez, büyük, parlayan */}
        <View style={styles.sosyalOrbWrapper}>
          <Animated.View style={[styles.sosyalOrbPulse, { transform: [{ scale: cameraScale }] }]}>
            {/* Dış halka */}
            <View style={[styles.sosyalOrbRing, { borderColor: 'rgba(255,69,0,0.4)' }]} />
          </Animated.View>
          <TouchableOpacity
            onPress={handleCameraPress}
            activeOpacity={0.88}
            style={styles.sosyalOrbTouch}
          >
            <LinearGradient
              colors={['#FF4500', '#FF6B35', '#FF9166']}
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
              color={activeTab === 'messages' ? (isDark ? NIGHT.warm : LIGHT.accent) : theme.textSub}
            />
            {conversations.some(c => c.unread_count > 0) && (
              <View style={[styles.sosyalUnreadDot, { backgroundColor: isDark ? NIGHT.vivid : '#ef4444' }]} />
            )}
          </View>
          <Text style={[styles.sosyalBottomLabel, { color: activeTab === 'messages' ? (isDark ? NIGHT.warm : LIGHT.accent) : theme.textSub, fontWeight: activeTab === 'messages' ? '700' : '500' }]}>
            Mesajlar
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Şehir Radarı Tam Ekran Modal ── */}
      <Modal visible={radarModalVisible} animationType="slide" onRequestClose={() => setRadarModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: isDark ? DARK.bg : LIGHT.bg }}>
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: insets.top + 8,
              paddingBottom: 8,
              zIndex: 30,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Radio size={18} color={isDark ? NIGHT.warm : LIGHT.accent} strokeWidth={2} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text, letterSpacing: -0.4 }}>Şehir Radarı</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRadarModalVisible(false)}
                style={[
                  styles.headerBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border, width: 44, height: 44, borderRadius: 22 },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <XIcon size={18} color={theme.textSub} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
          <RadarView />
        </View>
      </Modal>

      {/* Kamera Modalı — Tam Ekran Snapchat Tarzı */}
      <Modal visible={cameraVisible} animationType="fade" onRequestClose={() => {
        if (isRecordingVideo && cameraRef.current?.stopRecording) {
          try {
            cameraRef.current.stopRecording();
          } catch { /* */ }
        }
        setIsRecordingVideo(false);
        recordingPromiseRef.current = null;
        setCameraVisible(false);
        setCapturedPhotoUri(null);
        setCapturedIsVideo(false);
        setCameraCaptureMode('photo');
        setCameraZoom(0);
        lastZoomRef.current = 0;
        setSnapGroupMode(false);
        setGroupRecipientIds([]);
      }} statusBarTranslucent>
        <View style={styles.snapCameraRoot}>
          {!cameraPermission?.granted ? (
            /* İzin ekranı */
            <View style={[styles.permissionState, { backgroundColor: '#000' }]}>
              <Camera color="#FF4500" size={52} strokeWidth={1.5} />
              <Text style={[styles.permissionTitle, { color: '#fff' }]}>Kamera izni gerekiyor</Text>
              <Text style={[styles.permissionSub, { color: 'rgba(255,255,255,0.5)' }]}>
                Anlık foto ve kısa video çekilir; galeriye erişilmez.
              </Text>
              <TouchableOpacity activeOpacity={0.85} style={styles.permissionButton} onPress={requestCameraPermission}>
                <Text style={styles.permissionButtonText}>İzin Ver</Text>
              </TouchableOpacity>
            </View>
          ) : capturedPhotoUri ? (
            /* Önizleme ekranı */
            <View style={styles.snapCameraRoot}>
              {/* Önizleme: foto veya video */}
              {capturedIsVideo ? (
                <Video
                  source={{ uri: capturedPhotoUri }}
                  style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay
                  isLooping
                  isMuted={false}
                  useNativeControls
                />
              ) : (
                <Image source={{ uri: capturedPhotoUri }} style={[StyleSheet.absoluteFill, { zIndex: 0 }]} resizeMode="cover" />
              )}
              {/* Gradient — dokunuşları geçirsin */}
              <LinearGradient
                colors={['rgba(0,0,0,0.55)', 'transparent', 'transparent', 'rgba(0,0,0,0.75)']}
                style={[StyleSheet.absoluteFill, { zIndex: 1 }]}
                pointerEvents="none"
              />

              {/* Üst bar — önizleme */}
              <View style={[styles.snapCameraTopBar, { paddingTop: insets.top + 8, zIndex: 20 }]}>
                <TouchableOpacity
                  onPress={() => { setCapturedPhotoUri(null); setCapturedIsVideo(false); }}
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
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setSnapGroupMode(false);
                      setGroupRecipientIds([]);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: !snapGroupMode ? 'rgba(14,165,233,0.35)' : 'rgba(255,255,255,0.12)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Tüm arkadaşlar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (friends.length < GROUP_KIVILCIM_MIN) {
                        Alert.alert(
                          'Grup kıvılcımı',
                          `En az ${GROUP_KIVILCIM_MIN} arkadaşın olmalı.`,
                        );
                        return;
                      }
                      setSnapGroupMode(true);
                      setGroupPickModalVisible(true);
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: snapGroupMode ? 'rgba(14,165,233,0.35)' : 'rgba(255,255,255,0.12)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.25)',
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Grup (2–5)</Text>
                  </TouchableOpacity>
                </View>
                {snapGroupMode && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setGroupPickModalVisible(true)}
                    style={{ marginBottom: 10 }}
                  >
                    <Text style={{ color: 'rgba(125,211,252,0.95)', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                      Kişi seç · {groupRecipientIds.length}/{GROUP_KIVILCIM_MAX} seçili (en az {GROUP_KIVILCIM_MIN})
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.snapCameraHint}>Kıvılcım at ya da tekrar çek</Text>
                <View style={styles.snapCameraBottomRow}>
                  <TouchableOpacity
                    onPress={() => { setCapturedPhotoUri(null); setCapturedIsVideo(false); }}
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
                    <LinearGradient colors={['#CC3700', '#FF4500']} style={styles.snapCameraConfirmGrad}>
                      <Text style={styles.snapCameraConfirmText}>Kıvılcım At ✦</Text>
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
                    facing={cameraFacing}
                    mode={cameraCaptureMode === 'video' ? 'video' : 'picture'}
                    ratio={Platform.OS === 'android' ? '16:9' : undefined}
                    zoom={cameraZoom}
                    enableTorch={flashMode === 'on'}
                    flash={flashMode}
                    autofocus="on"
                    mirror={false}
                    exposure={exposure}
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
                  onPress={() => {
                    if (isRecordingVideo && cameraRef.current?.stopRecording) {
                      try {
                        cameraRef.current.stopRecording();
                      } catch { /* */ }
                    }
                    setIsRecordingVideo(false);
                    recordingPromiseRef.current = null;
                    setCameraVisible(false);
                    setCameraZoom(0);
                    lastZoomRef.current = 0;
                    setSnapGroupMode(false);
                    setGroupRecipientIds([]);
                    setCameraCaptureMode('photo');
                  }}
                  style={styles.snapCameraTopBtn}
                  activeOpacity={0.8}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                >
                  <XIcon color="#fff" size={28} strokeWidth={2} />
                </TouchableOpacity>
                <Text style={styles.snapCameraTopTitle}>ŞanlıSosyal</Text>
                <TouchableOpacity
                  onPress={toggleCameraFacing}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={20} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Foto / Video seçimi */}
              <View style={{
                position: 'absolute',
                top: insets.top + 52,
                left: 0,
                right: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                zIndex: 20,
              }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isRecordingVideo}
                  onPress={() => setCameraCaptureMode('photo')}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: cameraCaptureMode === 'photo' ? 'rgba(255,69,0,0.55)' : 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Foto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isRecordingVideo}
                  onPress={() => setCameraCaptureMode('video')}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: cameraCaptureMode === 'video' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.3)',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>Video</Text>
                </TouchableOpacity>
              </View>

              {/* Sağ kenar — Flash / Grid / Timer (tek panelde) */}
              <View style={{
                position: 'absolute',
                right: 12,
                top: insets.top + 110,
                gap: 10,
                zIndex: 20,
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.28)',
                borderRadius: 26,
                paddingVertical: 10,
                paddingHorizontal: 5,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.12)',
              }}>
                {/* Flash */}
                <TouchableOpacity
                  onPress={cycleFlash}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: flashMode !== 'off' ? '#FFD700' : 'rgba(255,255,255,0.2)' }}
                  activeOpacity={0.8}
                >
                  {flashMode === 'off'
                    ? <ZapOff color="rgba(255,255,255,0.7)" size={18} strokeWidth={2} />
                    : flashMode === 'auto'
                    ? <Zap color="#FFD700" size={18} strokeWidth={2} />
                    : <Zap color="#FFD700" size={18} strokeWidth={2} fill="#FFD700" />
                  }
                  {flashMode !== 'off' && (
                    <Text style={{ color: '#FFD700', fontSize: 8, fontWeight: '800', marginTop: 1 }}>
                      {flashMode === 'auto' ? 'OTO' : 'AÇIK'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Grid */}
                <TouchableOpacity
                  onPress={() => setGridVisible(g => !g)}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: gridVisible ? '#FF4500' : 'rgba(255,255,255,0.2)' }}
                  activeOpacity={0.8}
                >
                  <Grid3x3 color={gridVisible ? '#FF4500' : 'rgba(255,255,255,0.7)'} size={18} strokeWidth={2} />
                </TouchableOpacity>

                {/* Timer */}
                <TouchableOpacity
                  onPress={cycleTimer}
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: timerSec > 0 ? '#FF4500' : 'rgba(255,255,255,0.2)' }}
                  activeOpacity={0.8}
                >
                  <Timer color={timerSec > 0 ? '#FF4500' : 'rgba(255,255,255,0.7)'} size={18} strokeWidth={2} />
                  {timerSec > 0 && (
                    <Text style={{ color: '#FF4500', fontSize: 8, fontWeight: '800', marginTop: 1 }}>{timerSec}sn</Text>
                  )}
                </TouchableOpacity>

              </View>

              {/* Sol kenar — Pozlama slider (yukarı=açık / aşağı=koyu) */}
              <View style={{
                position: 'absolute',
                left: 14,
                top: insets.top + 110,
                bottom: 140,
                zIndex: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <View style={{ height: 160, width: 36, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ height: 140, width: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'visible' }}>
                    <View style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${((exposure + 1) / 2) * 100}%`,
                      backgroundColor: exposure > 0.1 ? '#FFD700' : exposure < -0.1 ? '#60a5fa' : 'rgba(255,255,255,0.5)',
                      borderRadius: 2,
                    }} />
                  </View>
                  <TouchableOpacity
                    onPress={() => setExposure(e => Math.min(1, parseFloat((e + 0.25).toFixed(2))))}
                    style={{ position: 'absolute', top: 0, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20, fontWeight: '300' }}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setExposure(e => Math.max(-1, parseFloat((e - 0.25).toFixed(2))))}
                    style={{ position: 'absolute', bottom: 0, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20, fontWeight: '300' }}>−</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Grid overlay */}
              {gridVisible && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 3 }]} pointerEvents="none">
                  {[1, 2].map(i => (
                    <View key={`h${i}`} style={{ position: 'absolute', top: `${(i / 3) * 100}%`, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                  ))}
                  {[1, 2].map(i => (
                    <View key={`v${i}`} style={{ position: 'absolute', left: `${(i / 3) * 100}%`, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.35)' }} />
                  ))}
                </View>
              )}

              {/* Timer geri sayım overlay */}
              {timerCountdown !== null && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 30, alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
                  <Text style={{ fontSize: 96, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 20 }}>
                    {timerCountdown}
                  </Text>
                </View>
              )}

              {/* Alt ipucu + zoom göstergesi — çekim butonunun hemen üstünde */}
              <View style={[styles.snapCameraMidHint, { bottom: insets.bottom + 130, zIndex: 12 }]} pointerEvents="none">
                <Text style={styles.snapCameraTimerBadge}>
                  {cameraCaptureMode === 'video'
                    ? (isRecordingVideo ? '● Kayıt… · durmak için tekrar dokun' : 'Video · başlatmak için dokun · en fazla 60 sn')
                    : '⏱ 4 saat · Anlık çekim'}
                </Text>
                {cameraCaptureMode === 'photo' && cameraZoom > 0.02 && (
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
                    <Text style={styles.snapCameraSideLbl}>Akış</Text>
                  </TouchableOpacity>

                  {/* Orta: Foto shutter veya Video kayıt */}
                  {cameraCaptureMode === 'photo' ? (
                    <TouchableOpacity
                      onPress={handleTakePhotoWithTimer}
                      disabled={cameraBusy || timerCountdown !== null}
                      activeOpacity={0.85}
                      style={styles.snapShutterOuter}
                    >
                      <View style={styles.snapShutterInner} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleVideoRecordToggle}
                      disabled={cameraBusy}
                      activeOpacity={0.85}
                      style={[styles.snapShutterOuter, { borderColor: 'rgba(239,68,68,0.9)' }]}
                    >
                      <View
                        style={{
                          width: isRecordingVideo ? 26 : 54,
                          height: isRecordingVideo ? 26 : 54,
                          borderRadius: isRecordingVideo ? 5 : 27,
                          backgroundColor: '#ef4444',
                        }}
                      />
                    </TouchableOpacity>
                  )}

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
      <Modal visible={!!selectedSnap} animationType="fade" transparent={false} onRequestClose={handleCloseSnapViewer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: '#000' }}
        >
          {selectedSnap && (
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              {/* Fotoğraf / Video — tam ekran */}
              {selectedSnap.isVideo ? (
                <Video
                  source={{ uri: selectedSnap.imageUri }}
                  style={StyleSheet.absoluteFill}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay
                  isLooping
                  isMuted={false}
                />
              ) : (
                <Image source={{ uri: selectedSnap.imageUri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
              )}

              {/* Üst gradient */}
              <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }} pointerEvents="none" />
              {/* Alt gradient */}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 }} pointerEvents="none" />

              {/* Üst bar */}
              <View style={[styles.snapViewerTop, { paddingTop: insets.top + 8 }]}>
                <View>
                  <Text style={styles.snapViewerName}>{selectedSnap.user.name}</Text>
                  <Text style={styles.snapViewerMeta}>{selectedSnap.location.label}</Text>
                </View>
                <TouchableOpacity onPress={handleCloseSnapViewer} style={styles.modalCloseBtn} activeOpacity={0.8}>
                  <XIcon color="#fff" size={22} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>

              {/* Alt alan — süre + tepkiler */}
              <View style={[styles.snapViewerBottom, { paddingBottom: insets.bottom + 16 }]}>
                <Text style={[styles.snapViewerTime, { color: '#FF9166' }]}>{formatTimeLeft(selectedSnap)}</Text>

                {reactionsEnabled && (
                  <>
                    {/* Emoji tepkileri */}
                    <View style={styles.snapReactionRow}>
                      {['🔥', '❤️', '😍', '😂', '👏', '⚡'].map(emoji => (
                        <TouchableOpacity
                          key={emoji}
                          style={styles.snapReactionBtn}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (selectedSnap.user.id !== currentUserId) handleSnapReply(emoji);
                          }}
                        >
                          <Text style={{ fontSize: 28 }}>{emoji}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {/* Metin yanıtı */}
                    {selectedSnap.user.id !== currentUserId ? (
                      <View style={styles.snapReplyRow}>
                        <TextInput
                          style={styles.snapReplyInput}
                          placeholder="Kıvılcıma yanıt yaz..."
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          value={snapReplyText}
                          onChangeText={setSnapReplyText}
                          returnKeyType="send"
                          onSubmitEditing={() => handleSnapReply(snapReplyText)}
                          editable={!snapReplySending}
                        />
                        <TouchableOpacity
                          style={[styles.snapReplySendBtn, { opacity: snapReplyText.trim() ? 1 : 0.4 }]}
                          activeOpacity={0.8}
                          onPress={() => handleSnapReply(snapReplyText)}
                          disabled={!snapReplyText.trim() || snapReplySending}
                        >
                          {snapReplySending
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Gönder</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.snapViewerNote}>Kendi kıvılcımın — 4 saat sonra silinir.</Text>
                    )}
                  </>
                )}
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Grup kıvılcımı — arkadaş seçimi */}
      <Modal visible={groupPickModalVisible} animationType="slide" transparent onRequestClose={() => setGroupPickModalVisible(false)}>
        <View style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setGroupPickModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border, maxHeight: '72%' }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>Grup kıvılcımı</Text>
              <TouchableOpacity onPress={() => setGroupPickModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>Tamam</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSub, fontSize: 13, marginBottom: 12, paddingHorizontal: 4 }}>
              {GROUP_KIVILCIM_MIN}–{GROUP_KIVILCIM_MAX} kişi seç. Yalnızca seçilenler görür ve bildirim alır.
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {friends.map((f) => {
                const on = groupRecipientIds.includes(f.user_id);
                return (
                  <TouchableOpacity
                    key={f.user_id}
                    activeOpacity={0.75}
                    onPress={() => toggleGroupRecipient(f.user_id)}
                    style={[styles.msgItem, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
                      {f.avatar_url ? (
                        <Image source={{ uri: processImageUrl(f.avatar_url) ?? undefined }} style={styles.msgAvatarImg} />
                      ) : (
                        <Text style={[styles.msgAvatarText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
                          {f.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.msgInfo, { flex: 1 }]}>
                      <Text style={[styles.msgName, { color: theme.text }]}>{f.name}</Text>
                      <Text style={[styles.msgSub, { color: theme.textSub }]}>@{f.username}</Text>
                    </View>
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: on ? (isDark ? NIGHT.warm : LIGHT.accent) : theme.border,
                      backgroundColor: on ? (isDark ? NIGHT.glow : 'rgba(96,165,250,0.2)') : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {on && <Check color={isDark ? NIGHT.warm : LIGHT.accent} size={16} strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Zincir arkadaşı seçimi */}
      <Modal visible={streakBuddyModalVisible} animationType="slide" transparent onRequestClose={() => setStreakBuddyModalVisible(false)}>
        <View style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setStreakBuddyModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border, maxHeight: '72%' }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>İkili zincir</Text>
              <TouchableOpacity onPress={() => setStreakBuddyModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSub, fontSize: 13, marginBottom: 12 }}>
              Aynı gün içinde ikiniz de kıvılcım attığınız ardışık günler sayılır (İstanbul saati).
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setStreakBuddyPickId(null)}
                style={[styles.msgItem, { borderBottomColor: theme.border }]}
              >
                <Text style={[styles.msgName, { color: theme.text, flex: 1 }]}>Kimse (sadece kişisel zincir)</Text>
                {!streakBuddyPickId && <Check color={isDark ? NIGHT.warm : LIGHT.accent} size={18} strokeWidth={2.5} />}
              </TouchableOpacity>
              {friends.map((f) => {
                const on = streakBuddyPickId === f.user_id;
                return (
                  <TouchableOpacity
                    key={f.user_id}
                    activeOpacity={0.75}
                    onPress={() => setStreakBuddyPickId(f.user_id)}
                    style={[styles.msgItem, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
                      <Text style={[styles.msgAvatarText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
                        {f.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={[styles.msgInfo, { flex: 1 }]}>
                      <Text style={[styles.msgName, { color: theme.text }]}>{f.name}</Text>
                      <Text style={[styles.msgSub, { color: theme.textSub }]}>@{f.username}</Text>
                    </View>
                    {on && <Check color={isDark ? NIGHT.warm : LIGHT.accent} size={18} strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity activeOpacity={0.9} style={[styles.friendActionBtn, { marginTop: 12 }]} onPress={saveStreakBuddy}>
              <LinearGradient colors={isDark ? ['#CC3700', '#FF4500'] : ['#FF6B35', '#FF4500']} style={styles.friendActionGradient}>
                <Text style={styles.friendActionText}>Kaydet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
            {/* QR butonları — yan yana */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* QR Göster */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setFriendModalVisible(false); setQrModalVisible(true); }}
                style={[styles.friendQrBox, { flex: 1, backgroundColor: isDark ? '#f8fafc0f' : '#f8fafc', borderColor: theme.border }]}
              >
                <LinearGradient
                  colors={['#CC3700', '#FF4500']}
                  style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
                >
                  <QrCode color="#fff" size={22} strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.friendQrCode, { color: theme.text, fontSize: 13 }]}>QR Göster</Text>
                <Text style={[styles.friendQrSub, { color: theme.textSub }]}>Arkadaşına tarat</Text>
              </TouchableOpacity>

              {/* QR Okut */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setFriendModalVisible(false); setQrScanned(false); setQrScanVisible(true); }}
                style={[styles.friendQrBox, { flex: 1, backgroundColor: isDark ? '#f8fafc0f' : '#f8fafc', borderColor: theme.border }]}
              >
                <LinearGradient
                  colors={['#FF4500', '#FF6B35']}
                  style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Camera color="#fff" size={22} strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.friendQrCode, { color: theme.text, fontSize: 13 }]}>QR Okut</Text>
                <Text style={[styles.friendQrSub, { color: theme.textSub }]}>Arkadaşından tara</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={friendPhone}
              onChangeText={handleSearchFriend}
              placeholder="İsim veya kullanıcı adı ara..."
              placeholderTextColor={theme.textSub}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.friendInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            />
            
            {/* Arama Sonuçları */}
            {friendSearching && (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator color={isDark ? NIGHT.warm : LIGHT.accent} />
              </View>
            )}
            {!friendSearching && friendSearchResults.length > 0 && (
              <ScrollView style={{ maxHeight: 300, width: '100%' }} showsVerticalScrollIndicator={false}>
                {friendSearchResults.map((user) => (
                  <TouchableOpacity
                    key={user.user_id}
                    onPress={() => handleSelectFriendFromSearch(user)}
                    style={[styles.searchResultItem, { borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
                      {user.avatar_url ? (
                        <Image source={{ uri: processImageUrl(user.avatar_url) ?? undefined }} style={{ width: '100%', height: '100%', borderRadius: 20 }} />
                      ) : (
                        <Text style={[styles.msgAvatarText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
                          {(user.name || '?').charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.msgName, { color: theme.text }]}>{user.name}</Text>
                      <Text style={[styles.msgSub, { color: theme.textSub }]}>@{user.username}</Text>
                    </View>
                    <UserPlus size={20} color={isDark ? NIGHT.warm : LIGHT.accent} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {!friendSearching && friendPhone.trim().length >= 2 && friendSearchResults.length === 0 && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={[styles.msgsEmptyText, { color: theme.textSub }]}>Kullanıcı bulunamadı</Text>
              </View>
            )}
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
                  <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
                    <Text style={[styles.msgAvatarText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
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
                      style={{ backgroundColor: isDark ? NIGHT.vivid : '#10b981', borderRadius: 20, padding: 8 }}
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

      {/* QR Kod Modalı */}
      <Modal visible={qrModalVisible} animationType="fade" transparent onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setQrModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: theme.surfaceHi, borderColor: theme.border, alignItems: 'center', paddingBottom: 28 }]}>
            {/* Başlık */}
            <View style={[styles.friendModalHeader, { width: '100%' }]}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>QR Kodum</Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            {/* QR Kodu */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              padding: 20,
              marginVertical: 20,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }}>
              <QRCode
                value={`sanligencsosyal://add/${profile?.username || profile?.name || 'kullanici'}`}
                size={200}
                color="#0f172a"
                backgroundColor="#ffffff"
              />
            </View>

            {/* Kullanıcı adı */}
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text, letterSpacing: 0.3 }}>
                {profile?.name || 'İsimsiz'}
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? 'rgba(56,189,248,0.14)' : 'rgba(96,165,250,0.12)',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 6,
                marginTop: 4,
              }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? NIGHT.warm : '#60a5fa' }}>
                  @{profile?.username || 'kullanici'}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: theme.textSub, marginTop: 10, textAlign: 'center' }}>
                Bu kodu arkadaşına tarat — seni otomatik eklesin
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Tarama Modalı — Tam Ekran Kamera */}
      <Modal visible={qrScanVisible} animationType="slide" onRequestClose={() => { setQrScanVisible(false); setQrScanned(false); }} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {cameraPermission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={qrScanned ? undefined : handleQrScanned}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <QrCode color="#38bdf8" size={52} strokeWidth={1.5} />
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Kamera izni gerekiyor</Text>
              <TouchableOpacity onPress={requestCameraPermission} style={{ backgroundColor: '#0ea5e9', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 }}>
                <Text style={{ color: '#000', fontWeight: '700' }}>İzin Ver</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tarama çerçevesi */}
          <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
            {/* Karartma — üst */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '25%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
            {/* Karartma — alt */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
            {/* Karartma — sol */}
            <View style={{ position: 'absolute', top: '25%', left: 0, width: '10%', height: '45%', backgroundColor: 'rgba(0,0,0,0.6)' }} />
            {/* Karartma — sağ */}
            <View style={{ position: 'absolute', top: '25%', right: 0, width: '10%', height: '45%', backgroundColor: 'rgba(0,0,0,0.6)' }} />

            {/* Köşe çerçeveleri */}
            {[
              { top: '25%', left: '10%', borderTopWidth: 3, borderLeftWidth: 3 },
              { top: '25%', right: '10%', borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: '30%', left: '10%', borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: '30%', right: '10%', borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((corner, i) => (
              <View key={i} style={[{ position: 'absolute', width: 28, height: 28, borderColor: '#38bdf8' } as const, corner as any]} />
            ))}
          </View>

          {/* Üst bar */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => { setQrScanVisible(false); setQrScanned(false); }}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <XIcon color="#fff" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>
              QR Kodu Tara
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Alt açıklama */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20, paddingBottom: insets.bottom + 32, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingTop: 20 }}>
            <QrCode color="#38bdf8" size={28} strokeWidth={1.8} />
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginTop: 10 }}>Arkadaşının QR kodunu çerçeveye getir</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>Otomatik tanınır ve istek gönderilir</Text>
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
    stylers: [{ color: '#000000' }],
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
    backgroundColor: 'rgba(14,165,233,0.08)',
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
    color: NIGHT.text,
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
    borderColor: NIGHT.border,
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
    color: NIGHT.warm,
  },

  // İçerik
  content: {
    flex: 1,
  },

  // Feed
  feedContent: {
    paddingHorizontal: 32,
    paddingBottom: 120,
    gap: 12,
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
    width: '100%',
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
    borderColor: NIGHT.border,
    shadowColor: NIGHT.vivid,
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
    width: '100%',
    aspectRatio: 1,
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
    height: 80,
  },
  snapOverlayFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 4,
    gap: 6,
  },
  snapOverlayName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  snapOverlayLocation: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  snapTimeTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  snapTimeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  snapTimeTagPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  snapMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 2,
  },
  snapMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  snapMetaAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapMetaUsername: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  snapMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  snapMetaCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewedBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
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
    width: 38,
    height: 38,
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
    borderColor: NIGHT.border,
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
    color: NIGHT.warm,
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
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: NIGHT.border,
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
    borderWidth: 1.5,
    borderColor: 'rgba(255,69,0,0.4)',
    overflow: 'hidden',
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  radarLegendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
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
    color: 'rgba(255,255,255,0.7)',
  },
  radarLegendNote: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
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
    shadowColor: NIGHT.vivid,
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
    borderColor: NIGHT.border,
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
    shadowColor: NIGHT.vivid,
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
    backgroundColor: '#000000',
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
    backgroundColor: '#000',
    justifyContent: 'flex-start',
  },
  snapViewerCard: {
    flex: 1,
    backgroundColor: '#000',
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
    bottom: 0,
    zIndex: 2,
  },
  snapViewerTime: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '700',
  },
  snapViewerNote: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  snapReactionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  snapReactionBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapReplyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snapReplyInput: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  snapReplySendBtn: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#FF4500',
    alignItems: 'center',
    justifyContent: 'center',
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
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
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
