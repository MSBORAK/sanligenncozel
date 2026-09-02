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
  ArrowRight,
  Zap,
  ZapOff,
  Grid3x3,
  Timer,
  Eye,
  Trash2,
} from 'lucide-react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Heatmap, Marker } from 'react-native-maps';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { useUser } from '@/context/UserContext';
import { supabase, processImageUrl, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { notify } from '@/lib/notifications';
import { useAppTheme } from '@/theme/useAppTheme';
import { Clean } from '@/constants/Colors';
import { Editorial } from '@/theme/colors';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { AppAlert } from '@/lib/alert';

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
  replayedBy?: string[]; // Tekrar oynatan kullanıcı ID'leri
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
  receiver_profile?: UserProfile;
}

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
  bg: Editorial.bg,
  surface: 'rgba(255,248,234,0.92)',
  surfaceHi: Editorial.surface,
  border: Editorial.borderSoft,
  text: Editorial.ink,
  textSub: Editorial.coffeeSoft,
  glass: 'rgba(255,248,234,0.72)',
  card: Editorial.surface,
  amberSoft: 'rgba(47,36,24,0.10)',
  amberBorder: 'rgba(58,42,26,0.18)',
  accent: Editorial.coffee,
  accentSoft: 'rgba(47,36,24,0.10)',
  tabBg: 'rgba(255,248,234,0.92)',
  tabActiveBg: Editorial.surface,
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
  if (msLeft <= 0) return i18n.t('chat.sureDoldu');
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
  const { t: tr } = useTranslation();
  const txt1   = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2   = isDark ? Editorial.coffeeSoft : Clean.textSecondary;
  const cardBg = isDark ? Editorial.surface : Clean.surface;
  const chipBg = isDark ? Editorial.chip : Clean.bgSoft;
  const amber  = Clean.accent;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const [cardWidth, setCardWidth] = useState(Math.ceil((SCREEN_W - 32 - 12) / 2));
  const cardHeight = Math.ceil(cardWidth);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [viewersList, setViewersList] = useState<Array<{ id: string; name: string; username: string; avatarUrl?: string; replayed: boolean }>>([]);

  const activeSnap = group.snaps[activeIdx];
  const progress = getExpiryProgress(activeSnap);
  const timeLeft = formatTimeLeft(activeSnap);

  const viewCount = group.snaps[activeIdx]?.viewedBy?.length ?? 0;
  const isOwnSnap = !!currentUserId && activeSnap?.userId === currentUserId;
  const isUrgent = progress > 0.75;

  const handleOpenViewers = useCallback(async () => {
    if (!isOwnSnap || !activeSnap) return;
    const viewerIds = activeSnap.viewedBy ?? [];
    if (viewerIds.length === 0) {
      setViewersList([]);
      setViewersModalVisible(true);
      return;
    }
    setViewersModalVisible(true);
    setViewersLoading(true);
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', viewerIds);
      const replaySet = new Set(activeSnap.replayedBy ?? []);
      const list = (data ?? []).map((p: any) => ({
        id: p.user_id,
        name: p.name || tr('common.kullanici'),
        username: p.username || '',
        avatarUrl: p.avatar_url,
        replayed: replaySet.has(p.user_id),
      }));
      // Tekrar oynatanlar üstte
      list.sort((a, b) => Number(b.replayed) - Number(a.replayed));
      setViewersList(list);
    } catch {
      setViewersList([]);
    } finally {
      setViewersLoading(false);
    }
  }, [isOwnSnap, activeSnap]);

  return (
    <View
      style={{ width: '100%' }}
      onLayout={(e) => {
        const w = Math.ceil(e.nativeEvent.layout.width);
        if (w > 0 && Math.abs(w - cardWidth) > 1) setCardWidth(w);
      }}
    >
      {/* Tek parça kart: fotoğraf + kullanıcı bilgisi aynı gövdede */}
      <View style={[cardOuterShadow, cardBorder, { width: cardWidth, borderRadius: 20, backgroundColor: cardBg }]}>
        <View style={[cardInnerClip, { borderRadius: 20 }]}>
          {/* Fotoğraf alanı — yatay kaydırılabilir */}
          <View style={{ width: cardWidth, height: cardHeight, backgroundColor: chipBg }}>
            <ScrollView
              ref={scrollRef}
              style={{ width: cardWidth, height: cardHeight }}
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
                  style={{ width: cardWidth, height: cardHeight }}
                >
                  <SnapMediaThumb
                    uri={snap.imageUri}
                    isVideo={snap.isVideo}
                    style={{ width: cardWidth + 2, height: cardHeight + 2, marginLeft: -1, marginTop: -1 }}
                    imageResizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Birden fazla snap varsa üstte nokta göstergesi */}
            {group.snaps.length > 1 && (
              <View style={{ position: 'absolute', top: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 }}>
                {group.snaps.map((_, i) => (
                  <View key={i} style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === activeIdx ? amber : 'rgba(255,255,255,0.55)',
                  }} />
                ))}
              </View>
            )}

            {/* Kalan süre etiketi — sağ üst köşe pill */}
            <View style={[
              styles.snapTimeTagPill,
              { backgroundColor: isUrgent ? 'rgba(220,38,38,0.92)' : 'rgba(0,0,0,0.55)' },
            ]} pointerEvents="none">
              <Clock color="#fff" size={9} strokeWidth={2.5} />
              <Text style={styles.snapTimeText}>{timeLeft}</Text>
            </View>
          </View>

          {/* Kullanıcı bilgisi — fotoğrafın altında, kartın gövdesinde */}
          <View style={[styles.snapMetaRow, { backgroundColor: cardBg }]}>
            <TouchableOpacity
              style={styles.snapMetaLeft}
              onPress={() => onAvatarPress?.(group.userId)}
            >
              <View style={[styles.snapMetaAvatar, { backgroundColor: chipBg }]}>
                {group.snaps[0]?.user?.avatarUrl ? (
                  <Image
                    source={{ uri: processImageUrl(group.snaps[0].user.avatarUrl) || undefined }}
                    style={{ width: 26, height: 26, borderRadius: 13 }}
                  />
                ) : (
                  <Text style={[styles.snapAvatarText, { color: txt1, fontSize: 11 }]}>
                    {group.userName.charAt(0)}
                  </Text>
                )}
              </View>
              <Text style={[styles.snapMetaUsername, { color: txt1 }]} numberOfLines={1}>
                @{group.username}
              </Text>
            </TouchableOpacity>

            {isOwnSnap ? (
              <TouchableOpacity
                style={styles.snapMetaRight}
                activeOpacity={0.7}
                onPress={handleOpenViewers}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Eye color={txt2} size={14} strokeWidth={2} />
                <Text style={[styles.snapMetaCount, { color: txt2 }]}>{viewCount}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.snapMetaRight}>
                <Eye color={txt2} size={14} strokeWidth={2} />
                <Text style={[styles.snapMetaCount, { color: txt2 }]}>{viewCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {isOwnSnap && (
        <Modal
          visible={viewersModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setViewersModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingTop: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: chipBg, alignSelf: 'center', marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: txt1 }}>
                  {tr('sosyalMain.goruntuleyenler')} · {viewersList.length}
                </Text>
                <TouchableOpacity onPress={() => setViewersModalVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <XIcon color={txt2} size={20} />
                </TouchableOpacity>
              </View>
              {viewersLoading ? (
                <ActivityIndicator style={{ marginVertical: 24 }} color={amber} />
              ) : viewersList.length === 0 ? (
                <Text style={{ color: txt2, textAlign: 'center', paddingVertical: 24, paddingHorizontal: 20 }}>
                  {tr('sosyalMain.henuzGoruntuleyenYok')}
                </Text>
              ) : (
                <FlatList
                  data={viewersList}
                  keyExtractor={(item) => item.id}
                  style={{ paddingHorizontal: 20 }}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: chipBg, alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' }}>
                        {item.avatarUrl ? (
                          <Image source={{ uri: processImageUrl(item.avatarUrl) || undefined }} style={{ width: 36, height: 36 }} />
                        ) : (
                          <Text style={{ color: txt1, fontWeight: '700', fontSize: 13 }}>{item.name.charAt(0).toUpperCase()}</Text>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: txt1, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>{item.name}</Text>
                        {!!item.username && (
                          <Text style={{ color: txt2, fontSize: 12 }} numberOfLines={1}>@{item.username}</Text>
                        )}
                      </View>
                      {item.replayed && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: chipBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                          <RefreshCw color={amber} size={12} strokeWidth={2.5} />
                          <Text style={{ color: amber, fontSize: 11, fontWeight: '700' }}>{tr('sosyalMain.tekrarOynatti')}</Text>
                        </View>
                      )}
                    </View>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// SUB-COMPONENT: FeedView
// Arkadaş akışı — sadece arkadaşlar görünür
// ─────────────────────────────────────────────

// ─── Kompakt Radar Kartı (Akış içinde) ──────────────────────────────────────

function RadarCompactCard({ isDark, feedFilter, friendIds, onPress }: { 
  isDark: boolean; 
  feedFilter: 'everyone' | 'friends';
  friendIds: Set<string>;
  onPress: () => void;
}) {
  const cardBg  = isDark ? Editorial.surface : Clean.surface;
  const cardBdr = isDark ? 'rgba(255,255,255,0.12)' : Editorial.border;
  const txt1    = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2    = isDark ? Editorial.coffeeSoft : Clean.textSecondary;
  const chipBg  = isDark ? Editorial.chip : Clean.bgSoft;
  const amber   = Clean.accent;
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [heatPoints, setHeatPoints] = useState<HeatPoint[]>([]);
  const [userMarkers, setUserMarkers] = useState<UserSnapMarker[]>([]);

  const URFA_CENTER = {
    latitude: 37.1591,
    longitude: 38.7969,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

        let radarRows: any[] = [];

        if (feedFilter === 'friends') {
          // Sadece arkadaşların konumları
          const { data: postRows } = await supabase
            .from('social_posts')
            .select('latitude, longitude, created_at, user_id')
            .gte('created_at', since)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);
          
          if (postRows) {
            radarRows = postRows.filter((r: any) => r.user_id && friendIds.has(r.user_id));
          }

          // Kullanıcı profil resimlerini çek
          const userIds = [...new Set(radarRows.map(r => r.user_id).filter(Boolean))];
          if (userIds.length > 0) {
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

            if (isMounted) setUserMarkers(markers);
          }
        } else {
          // Herkes modunda kullanıcı marker'ları yok
          if (isMounted) setUserMarkers([]);

          // Herkes: Önce anonim tabloyu dene
          const { data: anonRows, error: anonErr } = await supabase
            .from('anonymous_posts')
            .select('latitude, longitude, created_at')
            .gte('created_at', since)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (!anonErr) {
            // anonymous_posts sorgusu başarılıysa sonucu (boş dahi olsa) kullan —
            // konumunu radardan gizleyen kullanıcılar zaten bu tabloya hiç
            // eklenmiyor, bu yüzden "sonuç boş" demek "gösterilecek kimse yok"
            // demektir, "ham social_posts'a düş" demek DEĞİLDİR (aksi hâlde
            // radar_visible=false diyen kullanıcıların konumu yine sızardı).
            radarRows = anonRows || [];
          } else {
            // Yalnızca GERÇEK bir sorgu hatasında (ör. tablo mevcut değil)
            // eski/ham social_posts'a düş.
            const { data: postRows } = await supabase
              .from('social_posts')
              .select('latitude, longitude, created_at')
              .gte('created_at', since)
              .not('latitude', 'is', null)
              .not('longitude', 'is', null);

            if (postRows) radarRows = postRows;
          }
        }

        if (!isMounted) return;
        setActiveCount(radarRows.length);

        // Heatmap noktalarını oluştur
        const now = Date.now();
        const points: HeatPoint[] = radarRows.map((row: any) => {
          const age = now - new Date(row.created_at).getTime();
          const freshness = Math.max(0.2, 1 - age / (4 * 60 * 60 * 1000));
          return {
            latitude: row.latitude,
            longitude: row.longitude,
            weight: freshness,
          };
        });

        if (isMounted) setHeatPoints(points);
      } catch {
        if (isMounted) setActiveCount(null);
      }
    };
    fetchCount();
    return () => { isMounted = false; };
  }, [feedFilter, friendIds]);

  return (
    <View style={[styles.radarCardOuter, cardOuterShadow, isDark ? cardBorderDark : cardBorderLight, { backgroundColor: cardBg }]}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[styles.radarCardBlur, cardInnerClip]}>
        {/* Harita Önizlemesi */}
        <View style={styles.radarMapPreview}>
          <MapView
            style={{ flex: 1 }}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            initialRegion={URFA_CENTER}
            customMapStyle={Platform.OS === 'android' ? (isDark ? darkMapStyle : lightMapStyle) : []}
            userInterfaceStyle={isDark ? 'dark' : 'light'}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            toolbarEnabled={false}
            showsUserLocation={false}
            showsCompass={false}
            showsScale={false}
          >
            {/* Arkadaşlar modunda: Kullanıcı profil resimleri */}
            {feedFilter === 'friends' && userMarkers.map((marker, i) => (
              <Marker
                key={`user-${marker.userId}-${i}`}
                coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: isDark ? '#FF4500' : '#f59e0b',
                  backgroundColor: isDark ? '#1e293b' : '#fff',
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 4,
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
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                        {marker.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              </Marker>
            ))}

            {/* Herkes modunda: Heatmap veya marker'lar */}
            {feedFilter === 'everyone' && Platform.OS === 'android' && heatPoints.length > 0 && (
              <Heatmap
                points={heatPoints}
                radius={30}
                opacity={0.7}
                gradient={{
                  colors: isDark ? ['#22c55e', '#38bdf8', '#ef4444'] : ['#86efac', '#fbbf24', '#fb7185'],
                  startPoints: [0.1, 0.5, 1.0],
                  colorMapSize: 256,
                }}
              />
            )}

            {/* iOS veya Herkes modunda: marker'lar ile göster */}
            {feedFilter === 'everyone' && Platform.OS !== 'android' && heatPoints.slice(0, 15).map((pt, i) => (
              <Marker
                key={`heat-${i}`}
                coordinate={{ latitude: pt.latitude, longitude: pt.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={{
                  width: Math.max(8, (pt.weight ?? 0.5) * 16),
                  height: Math.max(8, (pt.weight ?? 0.5) * 16),
                  borderRadius: 99,
                  backgroundColor: isDark
                    ? `rgba(14,165,233,${0.3 + (pt.weight ?? 0.5) * 0.5})`
                    : `rgba(239,68,68,${0.3 + (pt.weight ?? 0.5) * 0.4})`,
                }} />
              </Marker>
            ))}
          </MapView>

          {/* Overlay gradient */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={isDark 
                ? ['rgba(26,26,30,0.3)', 'rgba(26,26,30,0.1)', 'rgba(26,26,30,0.3)']
                : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.2)']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>

        {/* Bilgi Overlay */}
        <View style={styles.radarCardInfo}>
          <View style={[styles.radarCardInfoBg, { backgroundColor: cardBg }]}>
            <View style={styles.radarCardInfoTop}>
              <View style={[styles.radarIconCircleSmall, { backgroundColor: chipBg }]}>
                <Radio size={12} color={txt1} strokeWidth={2} />
              </View>
              <Text style={[styles.radarCardTitle, { color: txt1 }]}>Şehir Radarı</Text>
              <View style={[styles.radarLiveDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.radarLiveText, { color: txt1 }]}>CANLI</Text>
            </View>
            <Text style={[styles.radarCardSub, { color: txt2 }]}>
              Son 4 saatte {activeCount !== null ? `${activeCount} paylaşım` : '...'}
            </Text>
          </View>
          <View style={[styles.radarCardArrowBtn, styles.radarCardArrowBtnAbsolute, { backgroundColor: chipBg }]}>
            <ArrowRight size={14} color={txt1} strokeWidth={2.2} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
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
  const feedFilter = 'friends' as const;

  const friendIds = useMemo(() => new Set(friends.map(f => f.user_id)), [friends]);

  const filteredSnaps = useMemo(() => {
    // ŞanlıSosyal artık sadece arkadaşlara özel — "Herkes" akışı kaldırıldı.
    return snaps.filter(snap =>
      friendIds.has(snap.userId) || snap.userId === currentUserId
    );
  }, [snaps, friendIds, currentUserId]);

  // Kullanıcı başına tek kart, kart içinde kullanıcının tüm snap'leri
  const groups = useMemo(() => groupSnapsByUser(filteredSnaps), [filteredSnaps]);
  
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
    return (
    <View style={{ flex: 1, maxWidth: '50%' }}>
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
            friendIds={friendIds}
            onFilterChange={() => {}}
          />
          <RadarCompactCard 
            isDark={isDark} 
            feedFilter={feedFilter}
            friendIds={friendIds}
            onPress={onOpenRadar} 
          />
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
              <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 6 }}>{i18n.t('common.loading')}</Text>
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
}: {
  isDark: boolean;
  friends: UserProfile[];
  onAddFriendPress: () => void;
  feedFilter: 'friends';
  friendIds: Set<string>;
  onFilterChange: (filter: 'friends') => void;
}) {
  const { t: tr } = useTranslation();
  const txt1   = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2   = isDark ? Editorial.coffeeSoft : Clean.textSecondary;

  return (
    <View style={styles.feedHeaderContainer}>
      <Text style={[styles.feedHeaderTitle, { color: txt1 }]}>{tr('socialFeed.akis')}</Text>
      <Text style={[styles.feedHeaderSub, { color: txt2 }]}>
        {tr('socialFeed.arkadaslarinSonSaati')}
      </Text>
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
  const { t: tr } = useTranslation();
  const txt1    = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2    = isDark ? Editorial.coffeeSoft : Clean.textSecondary;
  const chipBg  = isDark ? Editorial.chip : Clean.bgSoft;
  const cardBdr = isDark ? 'rgba(255,255,255,0.12)' : Editorial.border;
  const amber   = Clean.accent;
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
        borderColor: cardBdr,
        backgroundColor: chipBg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark ? Editorial.surface : Clean.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Flame color={amber} size={22} strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: txt1, fontSize: 15, fontWeight: '800' }}>
              {tr('sosyalMain.gunZincirEnIyi', { personal, best })}
            </Text>
            <Text style={{ color: txt2, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
              {buddyLabel
                ? tr('sosyalMain.ikiliGun', { mutual, buddyLabel })
                : tr('sosyalMain.ikiliZincirSec')}
            </Text>
          </View>
        </View>
        <Text style={{ color: txt1, fontSize: 12, fontWeight: '700' }}>{tr('sosyalMain.duzenle')}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FeedEmpty({ isDark, onAddFriendPress }: { isDark: boolean; onAddFriendPress: () => void }) {
  const { t: tr } = useTranslation();
  const txt1   = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2   = isDark ? Editorial.coffeeSoft : Clean.textSecondary;
  const chipBg = isDark ? Editorial.chip : Clean.bgSoft;
  return (
    <View style={styles.emptyContainer}>
      <Users color={txt1} size={40} strokeWidth={1.5} />
      <Text style={[styles.emptyTitle, { color: txt1 }]}>{tr('sosyalMain.henuzKivilcimYok')}</Text>
      <Text style={[styles.emptySub, { color: txt2 }]}>
        {tr('sosyalMain.arkadasEkleAciklama')}
      </Text>
      <TouchableOpacity style={[styles.emptyAddBtn, styles.emptyAddBlur, { backgroundColor: chipBg, borderWidth: 0 }]} activeOpacity={0.85} onPress={onAddFriendPress}>
        <UserPlus color={txt1} size={16} strokeWidth={2} />
        <Text style={[styles.emptyAddText, { color: txt1 }]}>{tr('sosyalMain.arkadasEkle')}</Text>
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
  onSearchUserPress: (user: UserProfile) => void;
  friendIds: Set<string>;
}

function MessagesView({
  isDark, theme, conversations, searchQuery, setSearchQuery,
  isSearching, searchResults, loading, currentUserId, formatMsgTime, onNavigateChat,
  onDeleteConversation, incomingRequests, onShowRequests, onSearchUserPress, friendIds,
}: MessagesViewProps) {
  const { t: tr } = useTranslation();
  const txt1    = isDark ? Editorial.ink : Clean.textPrimary;
  const txt2    = isDark ? Editorial.coffeeSoft : Clean.textSecondary;
  const cardBg  = isDark ? Editorial.surface : Clean.surface;
  const cardBdr = isDark ? 'rgba(58,42,26,1)' : 'rgba(17,17,20,1)';
  const chipBg  = isDark ? Editorial.chip : Clean.bgSoft;
  const amber   = Clean.accent;

  const renderUserItem = (user: UserProfile) => (
    <TouchableOpacity
      key={user.user_id}
      style={[styles.msgItem, { borderColor: cardBdr }]}
      activeOpacity={0.75}
      onPress={() => onSearchUserPress(user)}
    >
      <View style={[styles.msgAvatar, { backgroundColor: chipBg }]}>
        {user.avatar_url ? (
          <Image source={{ uri: processImageUrl(user.avatar_url) ?? undefined }} style={styles.msgAvatarImg} />
        ) : (
          <Text style={[styles.msgAvatarText, { color: txt1 }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.msgInfo}>
        <Text style={[styles.msgName, { color: txt1 }]}>{user.name}</Text>
        <Text style={[styles.msgSub, { color: txt2 }]}>@{user.username}</Text>
      </View>
      {friendIds.has(user.user_id) ? (
        <MessageCircle color={txt1} size={18} strokeWidth={2} />
      ) : (
        <UserPlus color={txt1} size={18} strokeWidth={2} />
      )}
    </TouchableOpacity>
  );

  const confirmDeleteConversation = (conv: Conversation) => {
    AppAlert.alert(
      tr('sosyalMain.sohbetiSil'),
      tr('sosyalMain.sohbetiSilOnay', { name: conv.other_user.name }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('chat.sil'),
          style: 'destructive',
          onPress: () => onDeleteConversation(conv.conversation_id),
        },
      ]
    );
  };

  const renderConvItem = (conv: Conversation) => (
    <TouchableOpacity
      key={conv.conversation_id}
      style={[styles.msgItem, { borderColor: cardBdr }]}
      activeOpacity={0.75}
      onPress={() => onNavigateChat(
        conv.other_user.user_id, conv.other_user.name,
        processImageUrl(conv.other_user.avatar_url) ?? 'https://i.pravatar.cc/150',
        conv.other_user.username,
      )}
      onLongPress={() => confirmDeleteConversation(conv)}
      delayLongPress={400}
    >
      <View style={[styles.msgAvatar, { backgroundColor: chipBg }]}>
        {conv.other_user.avatar_url ? (
          <Image source={{ uri: processImageUrl(conv.other_user.avatar_url) ?? undefined }} style={styles.msgAvatarImg} />
        ) : (
          <Text style={[styles.msgAvatarText, { color: txt1 }]}>
            {conv.other_user.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.msgInfo}>
        <Text style={[styles.msgName, { color: txt1 }]}>{conv.other_user.name}</Text>
        <Text style={[styles.msgSub, { color: txt2 }]} numberOfLines={1}>
          {conv.last_message?.sender_id === currentUserId ? `${tr('sosyalMain.sen')}: ` : ''}
          {conv.last_message?.content || tr('sosyalMain.henuzMesajYok')}
        </Text>
      </View>
      <View style={styles.msgMeta}>
        {conv.last_message && (
          <Text style={[styles.msgTime, { color: txt2 }]}>
            {formatMsgTime(conv.last_message.created_at)}
          </Text>
        )}
        {conv.unread_count > 0 && (
          <View style={[styles.msgUnread, { backgroundColor: amber }]}>
            <Text style={styles.msgUnreadText}>{conv.unread_count}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={() => confirmDeleteConversation(conv)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ paddingLeft: 10 }}
      >
        <Trash2 size={17} color={txt2} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.msgsRoot}>
      {/* Gelen istekler banner */}
      {incomingRequests.length > 0 && (
        <TouchableOpacity
          onPress={onShowRequests}
          activeOpacity={0.85}
          style={[styles.requestsBanner, { backgroundColor: chipBg, borderColor: cardBdr }]}
        >
          <View style={[styles.requestsBadge, { backgroundColor: amber }]}>
            <Text style={styles.requestsBadgeText}>{incomingRequests.length}</Text>
          </View>
          <Text style={[styles.requestsBannerText, { color: txt1 }]}>
            {tr('sosyalMain.arkadaslikIstegi')}
          </Text>
          <Text style={[styles.requestsBannerSub, { color: txt2 }]}>
            {incomingRequests[0]?.sender_profile?.name} {incomingRequests.length > 1 ? tr('sosyalMain.veKisiDaha', { count: incomingRequests.length - 1 }) : ''} {tr('sosyalMain.seniEklemekIstiyor')}
          </Text>
        </TouchableOpacity>
      )}

      {/* Arama çubuğu */}
      <View style={[styles.msgsSearchBar, { backgroundColor: chipBg, borderColor: cardBdr }]}>
        <Search color={txt2} size={16} strokeWidth={2} />
        <TextInput
          style={[styles.msgsSearchInput, { color: txt1 }]}
          placeholder={tr('sosyalMain.kullaniciAra')}
          placeholderTextColor={txt2}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: txt2, fontSize: 14, paddingHorizontal: 4 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {loading ? (
          <ActivityIndicator color={txt1} style={{ marginTop: 40 }} />
        ) : isSearching ? (
          <>
            <Text style={[styles.msgsSectionTitle, { color: txt2 }]}>
              {tr('sosyalMain.kullaniciSayisi', { count: searchResults.length })}
            </Text>
            {searchResults.length > 0
              ? searchResults.map(renderUserItem)
              : (
                <View style={styles.msgsEmpty}>
                  <Search color={txt2} size={36} strokeWidth={1.5} />
                  <Text style={[styles.msgsEmptyText, { color: txt2 }]}>{tr('sendSnap.kullaniciBulunamadi')}</Text>
                </View>
              )
            }
          </>
        ) : conversations.length > 0 ? (
          <>
            <Text style={[styles.msgsSectionTitle, { color: txt2 }]}>{tr('sosyalMain.mesajlar')}</Text>
            {conversations.map(renderConvItem)}
          </>
        ) : (
          <View style={styles.msgsEmpty}>
            <MessageCircle color={txt2} size={44} strokeWidth={1.5} />
            <Text style={[styles.msgsEmptyText, { color: txt2 }]}>{tr('sosyalMain.henuzMesajYok')}</Text>
            <Text style={[styles.msgsEmptyHint, { color: txt2 }]}>
              {tr('sosyalMain.arkadaslariAramakIcin')}
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

function RadarView({ feedFilter, friendIds }: { feedFilter: 'everyone' | 'friends'; friendIds: Set<string> }) {
  const { t: tr } = useTranslation();
  const t = useAppTheme();
  const isDark = t.isDark;
  const txt1    = t.txt1;
  const txt2    = t.txt2;
  const cardBg  = t.cardBg;
  const cardBdr = t.cardBdr;
  const chipBg  = t.chipBg;
  const amber   = t.accent;
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

        if (feedFilter === 'friends') {
          // Sadece arkadaşların konumları
          const { data: postRows } = await supabase
            .from('social_posts')
            .select('latitude, longitude, created_at, content, user_id')
            .gte('created_at', since)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (postRows) {
            radarRows = postRows
              .filter((r: any) => r.user_id && friendIds.has(r.user_id))
              .map((r: any) => ({
                ...r,
                district: typeof r.content === 'string' ? String(r.content).split(',')[0] : undefined,
              }));
          }
        } else {
          // Herkes: Önce anonim tabloyu dene
          const { data: anonRows, error: anonErr } = await supabase
            .from('anonymous_posts')
            .select('latitude, longitude, district, created_at')
            .gte('created_at', since)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);

          if (!anonErr) {
            // anonymous_posts sorgusu başarılıysa sonucu (boş dahi olsa) kullan —
            // radar_visible=false diyen kullanıcılar zaten bu tabloya hiç
            // eklenmiyor, bu yüzden ham social_posts'a düşmek onların
            // konumunu sızdırır.
            radarRows = anonRows || [];
          } else {
            // Yalnızca GERÇEK bir sorgu hatasında (ör. tablo mevcut değil)
            // eski/ham social_posts'a düş.
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
        }

        // Kullanıcı profil resimlerini çek (sadece arkadaşlar modunda)
        const userIds = feedFilter === 'friends' ? [...new Set(radarRows.map(r => r.user_id).filter(Boolean))] : [];
        const { data: profiles } = userIds.length > 0 
          ? await supabase
              .from('user_profiles')
              .select('user_id, avatar_url, username')
              .in('user_id', userIds)
          : { data: [] };

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Kullanıcı marker'larını oluştur (sadece arkadaşlar modunda)
        const markers: UserSnapMarker[] = feedFilter === 'friends'
          ? radarRows
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
              })
          : [];

        // Her noktanın ağırlığını hesapla
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
        // Hata durumunda mevcut veri (varsa) ekranda kalır, sahte veri gösterilmez
      } finally {
        setLoading(false);
      }
    };

    fetchRadarData();
    // Her 2 dakikada bir yenile
    const interval = setInterval(fetchRadarData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [feedFilter, friendIds]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={URFA_CENTER}
        customMapStyle={Platform.OS === 'android' ? (isDark ? darkMapStyle : lightMapStyle) : []}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
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
          <View style={{ backgroundColor: cardBg, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ color: txt2, fontSize: 13, textAlign: 'center' }}>
              {tr('sosyalMain.buBolgedePaylasimYok')}
            </Text>
          </View>
        </View>
      )}

      {/* Üst Radar Başlığı */}
      <View style={[styles.radarHeaderOverlay, cardOuterShadow, { overflow: 'visible' }]}>
        <View style={[styles.radarHeaderBlur, isDark ? cardBorderDark : cardBorderLight, { backgroundColor: cardBg }]}>
          <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: chipBg }}>
            <Radio color={txt1} size={15} strokeWidth={2.2} />
          </View>
          <Text style={[styles.radarHeaderText, { color: txt1 }]}>{tr('socialFeed.sehirRadari')}</Text>
          <View style={[styles.radarLiveDot, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.radarLiveText, { color: txt1 }]}>{tr('socialFeed.canli')}</Text>
          {loading && <ActivityIndicator size="small" color={txt1} style={{ marginLeft: 6 }} />}
        </View>
      </View>

      {/* Alt açıklama kartı */}
      <View style={[styles.radarLegendOuter, cardOuterShadow, { overflow: 'visible' }]}>
        <View style={[styles.radarLegendBlur, isDark ? cardBorderDark : cardBorderLight, { backgroundColor: cardBg }]}>
          <Text style={[styles.radarLegendTitle, { color: txt1 }]}>
            {tr('socialFeed.sonHareketlilik')}
            {activeCount > 0 ? ` · ${tr('sosyalMain.paylasimSayisi', { count: activeCount })}` : ''}
          </Text>
          {districtSummary ? (
            <Text style={[styles.radarLegendNote, { color: txt2, marginBottom: 6 }]}>
              {tr('sosyalMain.enHareketliBolgeler')}: {districtSummary}
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
              <Text style={[styles.radarLegendLabel, { color: txt2 }]}>{tr('sosyalMain.sakin')}</Text>
              <Text style={[styles.radarLegendLabel, { color: txt2 }]}>{tr('sosyalMain.orta')}</Text>
              <Text style={[styles.radarLegendLabel, { color: txt2 }]}>{tr('sosyalMain.yogun')}</Text>
            </View>
          </View>
          <Text style={[styles.radarLegendNote, { color: txt2 }]}>
            {tr('sosyalMain.bireylerDegilBolgeler')}
          </Text>
        </View>
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
  const { t: tr } = useTranslation();
  const t = useAppTheme();
  const { profile } = useUser();
  const isDark = t.isDark;
  const insets = useSafeAreaInsets();
  const theme = isDark ? DARK : LIGHT;
  const pageBg  = t.pageBg;
  const isInverse = pageBg === '#000000';
  const cardBg  = t.cardBg;
  const cardBdr = t.cardBdr;
  const txt1    = t.txt1;
  const txt2    = t.txt2;
  const ctaBg   = t.ctaBg;
  const ctaTxt  = t.ctaTxt;
  const chipBg  = t.chipBg;
  const amber   = t.accent;
  const [snaps, setSnaps] = useState<SnapPost[]>([]);
  const [snapsLoading, setSnapsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [cameraVisible, setCameraVisible] = useState(false);
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [friendSearchResults, setFriendSearchResults] = useState<UserProfile[]>([]);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);
  const [sentToUserIds, setSentToUserIds] = useState<Set<string>>(new Set());
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
  const [savedGroups, setSavedGroups] = useState<{ id: string; name: string; member_user_ids: string[] }[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [savingGroup, setSavingGroup] = useState(false);
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
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
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
      fetchOutgoingRequests(currentUserId);
      fetchFriends(currentUserId);
      fetchSavedGroups(currentUserId);
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
          // Bir sohbetten geri dönüldüğünde (ör. mesaj okundu işaretlendi)
          // "Mesajlar" sekmesindeki okunmamış sayısı da güncellensin —
          // activeTab değişmediği için önceki useEffect tek başına yetmiyordu.
          if (activeTab === 'messages') {
            fetchConversations(currentUserId);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [currentUserId, activeTab])
  );

  // Mesajlar sekmesi açıldığında yenile
  useEffect(() => {
    if (activeTab === 'messages' && currentUserId) {
      fetchConversations(currentUserId);
      fetchIncomingRequests(currentUserId);
      fetchOutgoingRequests(currentUserId);
    }
  }, [activeTab, currentUserId]);

  // Radar modal state
  const [radarModalVisible, setRadarModalVisible] = useState(false);
  const feedFilter = 'friends' as const;

  // friendIds hesaplama
  const friendIds = useMemo(() => new Set(friends.map(f => f.user_id)), [friends]);

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
        const [{ data }, { data: blocks }] = await Promise.all([
          supabase
            .from('user_profiles')
            .select('user_id, name, username, avatar_url')
            .neq('user_id', currentUserId)
            .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
            .limit(20),
          supabase
            .from('blocked_users')
            .select('blocker_id, blocked_id')
            .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
        ]);
        const blockedIds = new Set(
          (blocks ?? []).map((b: any) => (b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id))
        );
        setSearchResults((data ?? []).filter((u: any) => !blockedIds.has(u.user_id)));
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
      console.log('[Gelen İstekler] fetchIncomingRequests', { userId, count: data?.length, error });
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

  const fetchOutgoingRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('sender_id', userId)
        .eq('status', 'pending');
      if (error || !data) return;

      const withProfiles = await Promise.all(data.map(async (req: any) => {
        const { data: receiverProfile } = await supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url')
          .eq('user_id', req.receiver_id)
          .single();
        return { ...req, receiver_profile: receiverProfile };
      }));
      setOutgoingRequests(withProfiles);
    } catch {
      // sessiz hata
    }
  };

  const handleCancelOutgoingRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from('friendships').delete().eq('id', requestId);
      if (error) throw error;
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      AppAlert.alert(tr('common.error'), tr('sosyalProfile.islemBasarisiz'));
    }
  };

  const fetchSavedGroups = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('snap_groups')
        .select('id, name, member_user_ids')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });
      setSavedGroups(data ?? []);
    } catch {
      // sessiz hata
    }
  };

  const handleSaveGroup = async () => {
    const userId = profile?.userId;
    const name = newGroupName.trim();
    if (!userId || !name) return;
    if (groupRecipientIds.length < GROUP_KIVILCIM_MIN || groupRecipientIds.length > GROUP_KIVILCIM_MAX) return;
    setSavingGroup(true);
    try {
      const { error } = await supabase.from('snap_groups').insert({
        owner_id: userId,
        name,
        member_user_ids: groupRecipientIds,
      });
      if (error) {
        AppAlert.alert(tr('common.error'), error.message);
        return;
      }
      setNewGroupName('');
      await fetchSavedGroups(userId);
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e?.message ?? '');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    const userId = profile?.userId;
    if (!userId) return;
    try {
      await supabase.from('snap_groups').delete().eq('id', groupId).eq('owner_id', userId);
      setSavedGroups(prev => prev.filter(g => g.id !== groupId));
    } catch {
      // sessiz hata
    }
  };

  const handlePickSavedGroup = (group: { member_user_ids: string[] }) => {
    const validIds = new Set(friendsRef.current.map(f => f.user_id));
    const stillValid = group.member_user_ids.filter(id => validIds.has(id));
    setGroupRecipientIds(stillValid.slice(0, GROUP_KIVILCIM_MAX));
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
        friendsRef.current = [];
        // Arkadaş yok ama herkese açık profillerin snap'leri hâlâ görünmeli
        await fetchFriendSnaps();
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
        // Arkadaşların + herkese açık profillerin snap'lerini çek
        await fetchFriendSnaps();
      }
      await loadStreakData(userId);
    } catch {
      // sessiz hata
    }
  };

  const fetchFriendSnaps = async () => {
    setSnapsLoading(true);
    const userId = profile?.userId;
    try {
      const expiryThreshold = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();

      // Snap'leri çek — son 4 saat; foto (image_url) veya video (video_url)
      // Kimin görebileceği (kendi + arkadaşlar + herkese açık profiller) zaten
      // database/28_social_privacy_rls.sql politikası tarafından belirleniyor.
      const { data: posts, error } = await supabase
        .from('social_posts')
        .select('id, user_id, image_url, video_url, content, latitude, longitude, created_at, expires_at, viewed_by, replayed_by, recipient_user_ids')
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
            name: prof?.name ?? tr('common.kullanici'),
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
          replayedBy: Array.isArray(post.replayed_by) ? post.replayed_by : [],
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
      const { error: updateError, data: updateData } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select();
      if (updateError) throw updateError;
      if (!updateData || updateData.length === 0) {
        throw new Error('İstek güncellenemedi (satır bulunamadı veya yetki yok).');
      }

      // Kabul edince sohbet oluştur
      const { data: convId, error: convError } = await supabase.rpc('get_or_create_conversation', {
        user1_id: currentUserId,
        user2_id: senderId,
      });
      console.log('[Arkadaşlık Kabul] konuşma oluştur sonucu', { convId, convError });
      if (convError) throw convError;
      if (!convId) throw new Error('Konuşma oluşturulamadı');

      // Gönderene "isteğin kabul edildi" bildirimi gönder
      const myName = profile?.name || profile?.username || tr('sosyalMain.biri');
      notify.friendAccepted(senderId, myName).catch(() => {});

      await fetchIncomingRequests(userId);
      await fetchConversations(userId);
      await fetchFriends(userId);
      AppAlert.alert(tr('sosyalMain.arkadasEklendi'), tr('sosyalMain.artikMesajlasabilirsiniz'));
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const userId = profile?.userId;
    if (!userId) return;
    try {
      const { error: rejectError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);
      if (rejectError) throw rejectError;
      await fetchIncomingRequests(userId);
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message);
    }
  };

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    const userId = profile?.userId;
    if (!userId) return;
    try {
      // Sadece bu kullanıcı için gizle + sıfırlama noktası koy (veritabanından silme değil,
      // ama bu kullanıcı için silme anından önceki mesajlar bir daha görünmez)
      const { data, error } = await supabase
        .from('conversation_participants')
        .update({ hidden: true, hidden_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .select();
      console.log('[Sohbeti Sil] update sonucu', { conversationId, userId, data, error });
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Sohbet gizlenemedi (satır güncellenmedi — yetki sorunu olabilir).');
      }

      // Listeden kaldır
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId));
    } catch (e: any) {
      console.error('[Sohbeti Sil] HATA', e);
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalMain.sohbetGizlenemedi'));
    }
  }, [profile?.userId]);

  const fetchConversations = async (userId: string) => {
    setMessagesLoading(true);
    try {
      const { data: participantData, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id, hidden_at')
        .eq('user_id', userId)
        .or('hidden.is.null,hidden.eq.false'); // null veya false olanları getir
      if (error || !participantData) { setMessagesLoading(false); return; }

      const convIds = participantData.map((p: any) => p.conversation_id);
      if (convIds.length === 0) { setConversations([]); setMessagesLoading(false); return; }
      const hiddenAtMap = new Map(participantData.map((p: any) => [p.conversation_id, p.hidden_at]));

      const convPromises = convIds.map(async (convId: string) => {
        try {
          const hiddenAt: string | null = hiddenAtMap.get(convId) ?? null;

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

          let lastMsgQuery = supabase
            .from('messages')
            .select('content, created_at, sender_id, is_snap')
            .eq('conversation_id', convId);
          if (hiddenAt) lastMsgQuery = lastMsgQuery.gt('created_at', hiddenAt);
          const { data: lastMsgData } = await lastMsgQuery
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          let unreadQuery = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', convId)
            .neq('sender_id', userId)
            .eq('is_read', false);
          if (hiddenAt) unreadQuery = unreadQuery.gt('created_at', hiddenAt);
          const { count: unreadCount } = await unreadQuery;

          return {
            conversation_id: convId,
            other_user: profile
              ? { ...profile, name: profile.name || profile.username || tr('common.kullanici') }
              : { user_id: otherParticipant.user_id, name: tr('common.kullanici'), username: '' },
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
    if (diffMins < 1) return tr('weather.simdi');
    if (diffMins < 60) return `${diffMins}d`;
    const diffH = Math.floor(diffMins / 60);
    if (diffH < 24) return `${diffH}s`;
    return `${Math.floor(diffH / 24)}g`;
  };

  const switchTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    // "Mesajlar" sekmesine her geçişte listeyi tazele — eskiden sadece ekran
    // odağı değiştiğinde (navigation focus) yenileniyordu, aynı ekran
    // içindeki sekme geçişinde (ör. Kıvılcım'dan dönüp Mesajlar'a tıklamak)
    // hiç tazelenmiyordu, bu yüzden az önce gelen/gönderilen mesaj görünmüyordu.
    if (tab === 'messages' && currentUserId) {
      fetchConversations(currentUserId);
    }
    const toValue = tab === 'feed' ? 0 : 1;
    Animated.spring(tabAnim, {
      toValue,
      useNativeDriver: true,
      damping: 18,
      stiffness: 200,
    }).start();
  }, [tabAnim, currentUserId]);

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

  const handleVideoRecordToggle = useCallback(async () => {
    if (cameraCaptureMode !== 'video' || !cameraRef.current || cameraBusy) return;

    if (!isRecordingVideo) {
      const mic = microphonePermission ?? await requestMicrophonePermission();
      if (!mic?.granted) {
        AppAlert.alert(tr('sosyalMain.mikrofon'), tr('sosyalMain.mikrofonIzniAciklama'));
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
        AppAlert.alert(tr('sosyalMain.video'), e?.message ?? tr('sosyalMain.kayitBaslatilamadi'));
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
        AppAlert.alert(tr('sosyalMain.video'), tr('sosyalMain.kayitDosyasiAlinamadi'));
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
        AppAlert.alert(tr('sosyalMain.oturumHatasi'), tr('sosyalMain.lutfenTekrarGiris'));
        return;
      }

      // 2. Dosyayı yükle
      const ext = isVideo ? 'mp4' : 'jpg';
      const contentType = isVideo ? 'video/mp4' : 'image/jpeg';
      const fileName = `${userId}/${Date.now()}.${ext}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/snaps/${fileName}`;

      const fetchResp = await fetch(mediaUri);
      if (!fetchResp.ok) {
        AppAlert.alert(tr('sosyalMain.dosyaHatasi'), `${tr('sosyalMain.medyaOkunamadi')}: ${fetchResp.status}`);
        return;
      }
      const blob = await fetchResp.blob();
      if (blob.size === 0) {
        AppAlert.alert(tr('sosyalMain.dosyaHatasi'), tr('sosyalMain.dosyaBosGeldi'));
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
        AppAlert.alert(tr('sosyalProfile.yuklemeHatasi'), `${uploadResp.status}: ${errText}`);
        return;
      }

      // 3. Public URL al
      const { data: urlData } = supabase.storage.from('snaps').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      // 4. Konum al — izin yoksa/alınamazsa UYDURMA, null bırak (Şehir Radarı sadece gerçek konumları gösterir)
      let latitude: number | null = null;
      let longitude: number | null = null;
      let locationLabel = 'Şanlıurfa';
      let hasRealLocation = false;
      try {
        const locPerm = await Location.getForegroundPermissionsAsync();
        if (locPerm.status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = loc.coords.latitude;
          longitude = loc.coords.longitude;
          hasRealLocation = true;
          // Koordinatları mahalle/ilçe adına çevir
          const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geo) {
            const parts = [geo.district || geo.subregion, geo.city || geo.region].filter(Boolean);
            locationLabel = parts.join(', ') || 'Şanlıurfa';
          }
        }
      } catch { /* konum alınamazsa null kalır, sahte konum uydurulmaz */ }

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
        AppAlert.alert(tr('sosyalMain.kayitHatasi'), insertError.message);
        return;
      }

      // Radar anonim veri kaynağı: sadece gerçek konum varsa VE kullanıcı
      // "Şehir Radarımda Konumumu Göster" ayarını kapatmamışsa ekle
      // (sahte konum uydurulmaz; kapatan kullanıcının konumu kimliksiz
      // bile olsa Şehir Radarı'nda hiç görünmemeli — gizlilik tercihine saygı)
      if (hasRealLocation) {
        const { data: ownProfile } = await supabase
          .from('user_profiles')
          .select('radar_visible')
          .eq('user_id', userId)
          .maybeSingle();
        if (ownProfile?.radar_visible !== false) {
          await supabase.from('anonymous_posts').insert({
            latitude,
            longitude,
            district: locationLabel,
            created_at: new Date().toISOString(),
          });
        }
      }

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
      const myName = profile?.name || profile?.username || tr('sosyalMain.biri');
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
      AppAlert.alert(tr('sosyalMain.beklenmeyenHata'), e?.message ?? tr('sosyalMain.kivilcimKaydedilemedi'));
    }
  }, [profile, loadStreakData]);

  const handleConfirmPhoto = useCallback(async () => {
    if (!capturedPhotoUri) {
      AppAlert.alert(tr('common.error'), tr('sosyalMain.medyaBulunamadi'));
      return;
    }
    if (!profile?.userId) {
      AppAlert.alert(
        tr('sosyalMain.girisGerekiyor'),
        tr('sosyalMain.kivilcimPaylasmakIcinGiris'),
        [{ text: tr('sendSnap.tamam'), style: 'default' }]
      );
      return;
    }

    // URI'yi local değişkene al — state sıfırlanmadan önce kullanmak için
    const photoUri = capturedPhotoUri;
    const isVid = capturedIsVideo;
    const userId = profile.userId;

    if (snapGroupMode) {
      if (friends.length < GROUP_KIVILCIM_MIN) {
        AppAlert.alert(
          tr('sosyalMain.grupKivilcimi'),
          tr('sosyalMain.grupKivilcimiEnAz', { count: GROUP_KIVILCIM_MIN }),
        );
        return;
      }
      if (groupRecipientIds.length < GROUP_KIVILCIM_MIN) {
        AppAlert.alert(
          tr('sosyalMain.grupKivilcimi'),
          tr('sosyalMain.enAzEnFazlaArkadas', { min: GROUP_KIVILCIM_MIN, max: GROUP_KIVILCIM_MAX }),
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

      const [{ data, error }, { data: blocks }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('user_id, name, username, avatar_url')
          .or(`username.ilike.%${cleanInput}%,name.ilike.%${cleanInput}%`)
          .limit(10),
        supabase
          .from('blocked_users')
          .select('blocker_id, blocked_id')
          .or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`),
      ]);

      if (!error && data) {
        const blockedIds = new Set(
          (blocks ?? []).map((b: any) => (b.blocker_id === currentUserId ? b.blocked_id : b.blocker_id))
        );
        // Kendini ve engellenenleri filtrele
        const filtered = data.filter((u: any) => u.user_id !== currentUserId && !blockedIds.has(u.user_id));
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
    if (sendingRequestTo) return; // çift tıklamayı engelle
    setSendingRequestTo(selectedUser.user_id);
    try {
      const userId = profile?.userId;
      if (!userId) return;

      // Zaten arkadaş veya istek var mı kontrol et
      const { data: existingRows, error: existingError } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${selectedUser.user_id}),and(sender_id.eq.${selectedUser.user_id},receiver_id.eq.${userId})`);
      console.log('[Arkadaşlık İsteği - arama] mevcut kayıt kontrolü', { userId, target: selectedUser.user_id, existingRows, existingError });
      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (existing) {
        if (existing.status === 'accepted') {
          // Aramadan yanlışlıkla arkadaşlıktan çıkarma riskini önlemek için
          // burada sadece bilgilendiriyoruz — gerçek çıkarma işlemi kişinin
          // profilinden bilinçli olarak yapılır.
          AppAlert.alert(
            tr('sosyalMain.zatenArkadassiniz') || 'Zaten Arkadaşsınız',
            tr('sosyalMain.ileZatenArkadassiniz', { name: selectedUser.name || selectedUser.username }) || `${selectedUser.name || selectedUser.username} ile zaten arkadaşsınız.`
          );
          return;
        } else if (existing.status === 'pending') {
          AppAlert.alert(tr('sosyalMain.istekGonderildi') || 'İstek İletildi', tr('sosyalMain.zatenIstekGonderilmis', { name: selectedUser.name || selectedUser.username }) || 'Bu kişiye zaten bir arkadaşlık isteği gönderilmiş.');
          return;
        } else {
          // 'rejected' (veya beklenmeyen bir durum) — eski kaydı temizleyip
          // yeni bir istek gönderilmesine izin ver, sessizce hiçbir şey
          // yapmadan çıkma (önceki hata buydu).
          console.log('[Arkadaşlık İsteği - arama] eski/rejected kayıt temizleniyor', existing);
          const { error: cleanupError } = await supabase.from('friendships').delete().eq('id', existing.id);
          if (cleanupError) throw cleanupError;
        }
      }

      // Arkadaşlık isteği gönder
      const { data: insertData, error: insertError } = await supabase
        .from('friendships')
        .insert({ sender_id: userId, receiver_id: selectedUser.user_id, status: 'pending' })
        .select();
      console.log('[Arkadaşlık İsteği - arama] insert sonucu', { insertData, insertError });

      if (insertError) throw insertError;
      if (!insertData || insertData.length === 0) {
        throw new Error('İstek kaydedilemedi (satır dönmedi).');
      }

      // Alıcıya bildirim gönder
      const myName = profile?.name || profile?.username || tr('sosyalMain.biri');
      notify.friendRequest(selectedUser.user_id, myName).catch(() => {});

      // Satırda hemen bir "✓ gönderildi" tik göster, sonra kapat
      setSentToUserIds((prev) => new Set(prev).add(selectedUser.user_id));
      if (currentUserId) fetchOutgoingRequests(currentUserId);
      setTimeout(() => {
        setFriendPhone('');
        setFriendSearchResults([]);
        setFriendModalVisible(false);
      }, 900);
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalMain.birHataOlustu'));
    } finally {
      setSendingRequestTo(null);
    }
  }, [profile, currentUserId, sendingRequestTo]);

  // Mesajlar sekmesindeki "Kullanıcı ara" kutusunda bir sonuca dokunulduğunda
  // çalışır. Önceki hata: gerçek arkadaşlık durumuna hiç bakmadan her zaman
  // "önce istek gönder" uyarısı gösteriyordu — arkadaş olsalar bile. Şimdi
  // gerçek durumu kontrol ediyor: zaten arkadaşsa direkt sohbete gidiyor,
  // değilse gerçek bir istek gönderiyor (buton artık gerçekten çalışıyor).
  const handleMessagesSearchUserPress = useCallback(async (user: UserProfile) => {
    const userId = profile?.userId;
    if (!userId || sendingRequestTo) return;
    try {
      const { data: existingRows, error: existingError } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${user.user_id}),and(sender_id.eq.${user.user_id},receiver_id.eq.${userId})`);
      console.log('[Mesajlar Arama] mevcut kayıt kontrolü', { userId, target: user.user_id, existingRows, existingError });
      const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

      if (existing && existing.status === 'accepted') {
        navigation.navigate('Chat', { userId: user.user_id, userName: user.name, userAvatar: user.avatar_url || '', username: user.username });
        return;
      }

      if (existing && existing.status === 'pending') {
        AppAlert.alert(
          tr('sosyalMain.istekGonderildi') || 'İstek İletildi',
          tr('sosyalMain.zatenIstekGonderilmis', { name: user.name || user.username }) || 'Bu kişiye zaten bir arkadaşlık isteği gönderilmiş.'
        );
        return;
      }

      // Arkadaş değiller: gerçekten istek gönder mi diye sor.
      AppAlert.alert(
        user.name,
        tr('sosyalMain.oncelikleArkadaslikIstegi', { username: user.username }),
        [
          { text: tr('common.cancel'), style: 'cancel' },
          { text: tr('sosyalMain.istekGonder'), onPress: () => handleSelectFriendFromSearch(user) },
        ]
      );
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalMain.birHataOlustu'));
    }
  }, [profile, sendingRequestTo, handleSelectFriendFromSearch, navigation]);

  const handleQrScanned = useCallback(async ({ data: qrData }: { data: string }) => {
    if (qrScanned) return;
    setQrScanned(true);

    // QR format: sanligencsosyal://add/<username>
    const match = qrData.match(/sanligencsosyal:\/\/add\/(.+)/);
    if (!match) {
      AppAlert.alert(tr('sosyalMain.gecersizQr'), tr('sosyalMain.qrAitDegil'), [
        { text: tr('sosyalMain.tekrarDene'), onPress: () => setQrScanned(false) },
        { text: tr('sosyalMain.kapat'), onPress: () => { setQrScanVisible(false); setQrScanned(false); } },
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
        AppAlert.alert(tr('sosyalMain.bulunamadi'), tr('sosyalMain.qrKullaniciBulunamadi'));
        setQrScanned(false);
        return;
      }

      const userId = profile?.userId;
      if (!userId) { setQrScanned(false); return; }
      if (data.user_id === userId) {
        AppAlert.alert(tr('sosyalMain.buSeninQrKodun'), tr('sosyalMain.kendiQrKoduOkutamaz'));
        setQrScanned(false);
        return;
      }

      const { data: existingQrRows } = await supabase
        .from('friendships')
        .select('id, status')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${data.user_id}),and(sender_id.eq.${data.user_id},receiver_id.eq.${currentUserId})`);
      const existing = existingQrRows && existingQrRows.length > 0 ? existingQrRows[0] : null;
      console.log('[Arkadaşlık İsteği - QR] mevcut kayıt kontrolü', existing);

      if (existing) {
        if (existing.status === 'accepted') {
          AppAlert.alert(tr('sosyalMain.zatenArkadassiniz'), tr('sosyalMain.ileZatenArkadassiniz', { name: `@${data.username}` }));
          setQrScanned(false);
          return;
        } else if (existing.status === 'pending') {
          AppAlert.alert(tr('sosyalMain.istekMevcut'), tr('sosyalMain.zatenIstekGonderilmis', { name: `@${data.username}` }));
          setQrScanned(false);
          return;
        } else {
          // 'rejected' — eski kaydı temizleyip yeni isteğe izin ver
          const { error: cleanupError } = await supabase.from('friendships').delete().eq('id', existing.id);
          if (cleanupError) throw cleanupError;
        }
      }

      const { data: qrInsertData, error: insertError } = await supabase
        .from('friendships')
        .insert({ sender_id: currentUserId, receiver_id: data.user_id, status: 'pending' })
        .select();
      console.log('[Arkadaşlık İsteği - QR] insert sonucu', { qrInsertData, insertError });

      if (insertError) throw insertError;
      if (!qrInsertData || qrInsertData.length === 0) {
        throw new Error('İstek kaydedilemedi (satır dönmedi).');
      }

      // Alıcıya bildirim gönder
      const myName = profile?.name || profile?.username || tr('sosyalMain.biri');
      notify.friendRequest(data.user_id, myName).catch(() => {});

      if (currentUserId) fetchOutgoingRequests(currentUserId);
      AppAlert.alert(tr('sosyalMain.istekGonderildiUnlem'), tr('sosyalMain.arkadaslikIstegiGonderildi', { name: `@${data.username}` }));
    } catch (e: any) {
      AppAlert.alert(tr('common.error'), e.message || tr('sosyalMain.birHataOlustu'));
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
    } catch {
      AppAlert.alert(tr('common.error'), tr('sosyalMain.kaydedilemedi'));
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
    console.log('[Kıvılcım Tepki] handleSnapReply çağrıldı', {
      text, userId, hasSelectedSnap: !!selectedSnap,
      snapUserId: selectedSnap?.user?.id, currentUserId,
    });
    if (!selectedSnap || !userId || !text.trim()) {
      console.log('[Kıvılcım Tepki] erken çıkış — selectedSnap/userId/text eksik');
      return;
    }
    const recipientId = selectedSnap.user.id;
    if (recipientId === userId) {
      console.log('[Kıvılcım Tepki] erken çıkış — kendi snap\'i');
      return; // Kendi snap'ine yanıt yok
    }

    setSnapReplySending(true);
    try {
      const trimmed = text.trim();
      const isQuickReaction = /^(🔥|❤️|😍|😂|👏|⚡)$/.test(trimmed);
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
        `${tr('sosyalMain.hangisi')}: ${who} ${tr('sosyalProfile.kivilcim').toLowerCase()}\n📅 ${timeStr}${locPart}`;
      const messageContent = isQuickReaction
        ? `${tr('sosyalMain.tepki')}: ${trimmed}\n────────\n${snapRefBlock}`
        : `${tr('chat.yanitlaniyor')}: ${trimmed}\n────────\n${snapRefBlock}`;

      // Konuşmayı bul veya oluştur
      const { data: convData, error: convError } = await supabase.rpc('get_or_create_conversation', {
        user1_id: currentUserId,
        user2_id: recipientId,
      });
      console.log('[Kıvılcım Tepki] konuşma sonucu', { convData, convError });
      if (convError) throw convError;
      const convId = convData;
      if (!convId) throw new Error(tr('sosyalMain.konusmaOlusturulamadi'));

      // Önizleme: sadece kalıcı URL (Supabase); file:// karşı tarafa gitmez
      const previewUrl =
        selectedSnap.imageUri && selectedSnap.imageUri.startsWith('http')
          ? selectedSnap.imageUri
          : null;

      // Mesajı gönder (görsel önizleme = hangi kıvılcıma tepki)
      const { data: msgData, error: msgError } = await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: currentUserId,
        content: messageContent,
        ...(previewUrl ? { image_url: previewUrl } : {}),
      }).select();
      console.log('[Kıvılcım Tepki] mesaj insert sonucu', { msgData, msgError });
      if (msgError) throw msgError;
      if (!msgData || msgData.length === 0) {
        throw new Error(tr('sosyalMain.yanitGonderilemedi'));
      }

      setSnapReplyText('');
      // Snap'i kapat
      handleCloseSnapViewer();
    } catch (e: any) {
      console.error('[Kıvılcım Tepki] HATA', e);
      AppAlert.alert(tr('common.error'), tr('sosyalMain.yanitGonderilemedi'));
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
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      {/* ── SafeArea + Header ── */}
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          {/* Geri butonu */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={[styles.headerBtn, { backgroundColor: chipBg, borderWidth: 0, marginRight: 8 }]}
          >
            <ArrowLeft color={txt1} size={20} strokeWidth={2} />
          </TouchableOpacity>

          {/* Sol: Profil butonu — tıklanınca SosyalProfile açılır */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SosyalProfile', { userId: profile?.userId })}
            style={styles.headerProfileBtn}
          >
            <View style={[styles.headerAvatarCircle, { backgroundColor: chipBg, borderWidth: 0 }]}>
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: processImageUrl(profile.avatarUrl) || undefined }}
                  style={{ width: '100%', height: '100%', borderRadius: 18 }}
                />
              ) : (
                <Text style={[styles.headerAvatarInitial, { color: txt1 }]}>
                  {profile?.name?.charAt(0).toUpperCase() ?? 'S'}
                </Text>
              )}
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: txt1 }]}>{tr('sosyalProfile.kivilcim')}</Text>
              <Text style={[styles.headerSub, { color: txt2 }]}>
                {profile?.username ? `@${profile.username}` : tr('sosyalMain.anlikDogalGecici')}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {/* Arkadaş ekle butonu */}
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: chipBg, borderWidth: 0 }]}
              activeOpacity={0.8}
              onPress={handleAddFriendPress}
            >
              <UserPlus color={txt1} size={18} strokeWidth={2} />
            </TouchableOpacity>
            {/* ŞanlıSosyal bildirimleri */}
            <TouchableOpacity
              style={[styles.headerBtn, { backgroundColor: chipBg, borderWidth: 0 }]}
              activeOpacity={0.8}
              onPress={() => setRequestsModalVisible(true)}
            >
              {incomingRequests.length > 0 && (
                <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: amber, zIndex: 1 }} />
              )}
              <Bell color={txt2} size={20} strokeWidth={2} />
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
            onSearchUserPress={handleMessagesSearchUserPress}
            friendIds={friendIds}
          />
        )}
      </View>

      {/* ── Alt Bar: Akış | Kamera | Mesajlar ── */}
      <SafeAreaView edges={['bottom']} style={[styles.sosyalBottomBar, { backgroundColor: cardBg, borderTopColor: cardBdr }]}>
        {/* Akış */}
        <TouchableOpacity
          style={styles.sosyalBottomTab}
          activeOpacity={0.75}
          onPress={() => switchTab('feed')}
        >
          <Users
            size={22}
            strokeWidth={activeTab === 'feed' ? 2.5 : 1.8}
            color={activeTab === 'feed' ? amber : txt2}
          />
          <Text style={[styles.sosyalBottomLabel, { color: activeTab === 'feed' ? txt1 : txt2, fontWeight: activeTab === 'feed' ? '700' : '500' }]}>
            {tr('socialFeed.akis')}
          </Text>
        </TouchableOpacity>

        {/* Kamera butonu */}
        <View style={styles.sosyalOrbWrapper}>
          <TouchableOpacity
            onPress={handleCameraPress}
            activeOpacity={0.88}
            style={[styles.sosyalOrbTouch, { shadowOpacity: 0, elevation: 0 }]}
          >
            <View style={[styles.sosyalOrbGradient, { backgroundColor: ctaBg }]}>
              <Camera color={ctaTxt} size={26} strokeWidth={2} />
            </View>
          </TouchableOpacity>
          <Text style={[styles.sosyalOrbLabel, { color: txt2 }]}>{tr('sosyalMain.cek')}</Text>
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
              color={activeTab === 'messages' ? amber : txt2}
            />
            {conversations.some(c => c.unread_count > 0) && (
              <View style={[styles.sosyalUnreadDot, { backgroundColor: amber, borderColor: cardBg }]} />
            )}
          </View>
          <Text style={[styles.sosyalBottomLabel, { color: activeTab === 'messages' ? txt1 : txt2, fontWeight: activeTab === 'messages' ? '700' : '500' }]}>
            {tr('sosyalMain.mesajlar')}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Şehir Radarı Tam Ekran Modal ── */}
      <Modal visible={radarModalVisible} animationType="slide" onRequestClose={() => setRadarModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: pageBg }}>
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
                <Radio size={18} color={txt1} strokeWidth={2} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: txt1, letterSpacing: -0.4 }}>{tr('socialFeed.sehirRadari')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRadarModalVisible(false)}
                style={[
                  styles.headerBtn,
                  { backgroundColor: chipBg, borderWidth: 0, width: 44, height: 44, borderRadius: 22 },
                ]}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <XIcon size={18} color={txt2} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
          <RadarView feedFilter={feedFilter} friendIds={friendIds} />
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
              <Text style={[styles.permissionTitle, { color: '#fff' }]}>{tr('sosyalMain.kameraIzniGerekiyor')}</Text>
              <Text style={[styles.permissionSub, { color: 'rgba(255,255,255,0.5)' }]}>
                {tr('sosyalMain.kameraIzniAciklamaUzun')}
              </Text>
              <TouchableOpacity activeOpacity={0.85} style={styles.permissionButton} onPress={requestCameraPermission}>
                <Text style={styles.permissionButtonText}>{tr('sosyalMain.izinVer')}</Text>
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
                <Text style={styles.snapCameraTopTitle}>{tr('sosyalMain.onizleme')}</Text>
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
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tr('sosyalMain.tumArkadaslar')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (friends.length < GROUP_KIVILCIM_MIN) {
                        AppAlert.alert(
                          tr('sosyalMain.grupKivilcimi'),
                          tr('sosyalMain.grupKivilcimiEnAz', { count: GROUP_KIVILCIM_MIN }),
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
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{tr('sosyalMain.grupParantez')}</Text>
                  </TouchableOpacity>
                </View>
                {snapGroupMode && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setGroupPickModalVisible(true)}
                    style={{ marginBottom: 10 }}
                  >
                    <Text style={{ color: 'rgba(125,211,252,0.95)', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                      {tr('sosyalMain.kisiSecSayisi', { selected: groupRecipientIds.length, max: GROUP_KIVILCIM_MAX, min: GROUP_KIVILCIM_MIN })}
                    </Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.snapCameraHint}>{tr('sosyalMain.kivilcimAtYaTekrarCek')}</Text>
                <View style={styles.snapCameraBottomRow}>
                  <TouchableOpacity
                    onPress={() => { setCapturedPhotoUri(null); setCapturedIsVideo(false); }}
                    style={styles.snapCameraRetakeBtn}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.snapCameraRetakeText}>{tr('chat.tekrar')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmPhoto}
                    style={styles.snapCameraConfirmBtn}
                    activeOpacity={0.9}
                  >
                    <LinearGradient colors={['#CC3700', '#FF4500']} style={styles.snapCameraConfirmGrad}>
                      <Text style={styles.snapCameraConfirmText}>{tr('sosyalMain.kivilcimAt')} ✦</Text>
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
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{tr('sosyalMain.foto')}</Text>
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
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>{tr('sosyalMain.video')}</Text>
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
                      {flashMode === 'auto' ? tr('sosyalMain.oto') : tr('sosyalMain.acik')}
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
                    ? (isRecordingVideo ? tr('sosyalMain.kayitDurdurmakIcin') : tr('sosyalMain.videoBaslatmakIcin'))
                    : tr('sosyalMain.anlikCekimSaat')}
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
                    <Text style={styles.snapCameraSideLbl}>{tr('socialFeed.akis')}</Text>
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
                    <Text style={styles.snapCameraSideLbl}>{tr('sosyalMain.mesajlar')}</Text>
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
                            console.log('[Kıvılcım Tepki] emoji butonuna basıldı', { emoji, snapUserId: selectedSnap.user.id, currentUserId });
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
                          placeholder={tr('sosyalMain.kivilcimaYanitYaz')}
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
                            : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{tr('common.send')}</Text>
                          }
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={styles.snapViewerNote}>{tr('sosyalMain.kendiKivilciminNot')}</Text>
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
          <View style={[styles.friendModalCard, { backgroundColor: isInverse ? '#111114' : '#ffffff', borderColor: theme.border, maxHeight: '72%' }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>{tr('sosyalMain.grupKivilcimi')}</Text>
              <TouchableOpacity onPress={() => setGroupPickModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>{tr('sendSnap.tamam')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSub, fontSize: 13, marginBottom: 12, paddingHorizontal: 4 }}>
              {tr('sosyalMain.kisiSecGorurBildirim', { min: GROUP_KIVILCIM_MIN, max: GROUP_KIVILCIM_MAX })}
            </Text>

            {savedGroups.length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: '700', marginBottom: 8, paddingHorizontal: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {tr('sosyalMain.kayitliGruplar')}
                </Text>
                {savedGroups.map((g) => (
                  <View
                    key={g.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.border,
                      marginBottom: 8,
                    }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handlePickSavedGroup(g)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Users color={isDark ? NIGHT.warm : LIGHT.accent} size={18} strokeWidth={2} />
                      <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>{g.name}</Text>
                        <Text style={{ color: theme.textSub, fontSize: 12 }}>
                          {tr('sosyalMain.kisiSayisi', { count: g.member_user_ids.length })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => handleDeleteGroup(g.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <XIcon color={theme.textSub} size={16} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false}>
              {friends.map((f) => {
                const on = groupRecipientIds.includes(f.user_id);
                return (
                  <TouchableOpacity
                    key={f.user_id}
                    activeOpacity={0.75}
                    onPress={() => toggleGroupRecipient(f.user_id)}
                    style={[styles.msgItem, { borderColor: theme.border }]}
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

            {groupRecipientIds.length >= GROUP_KIVILCIM_MIN && groupRecipientIds.length <= GROUP_KIVILCIM_MAX && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                <TextInput
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder={tr('sosyalMain.grupAdiPlaceholder')}
                  placeholderTextColor={theme.textSub}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: theme.border,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 9,
                    color: theme.text,
                    fontSize: 14,
                  }}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={!newGroupName.trim() || savingGroup}
                  onPress={handleSaveGroup}
                  style={{
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    justifyContent: 'center',
                    backgroundColor: !newGroupName.trim() || savingGroup ? theme.border : (isDark ? NIGHT.warm : LIGHT.accent),
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>{tr('sosyalMain.grubuKaydet')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Zincir arkadaşı seçimi */}
      <Modal visible={streakBuddyModalVisible} animationType="slide" transparent onRequestClose={() => setStreakBuddyModalVisible(false)}>
        <View style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setStreakBuddyModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: isInverse ? '#111114' : '#ffffff', borderColor: theme.border, maxHeight: '72%' }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>{tr('sosyalMain.ikiliZincir')}</Text>
              <TouchableOpacity onPress={() => setStreakBuddyModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>{tr('sosyalMain.kapat')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textSub, fontSize: 13, marginBottom: 12 }}>
              {tr('sosyalMain.ikiliZincirAciklama')}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setStreakBuddyPickId(null)}
                style={[styles.msgItem, { borderColor: theme.border }]}
              >
                <Text style={[styles.msgName, { color: theme.text, flex: 1 }]}>{tr('sosyalMain.kimseKisiselZincir')}</Text>
                {!streakBuddyPickId && <Check color={isDark ? NIGHT.warm : LIGHT.accent} size={18} strokeWidth={2.5} />}
              </TouchableOpacity>
              {friends.map((f) => {
                const on = streakBuddyPickId === f.user_id;
                return (
                  <TouchableOpacity
                    key={f.user_id}
                    activeOpacity={0.75}
                    onPress={() => setStreakBuddyPickId(f.user_id)}
                    style={[styles.msgItem, { borderColor: theme.border }]}
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
                <Text style={styles.friendActionText}>{tr('sosyalMain.kaydet')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Arkadaş Ekle Modalı */}
      <Modal visible={friendModalVisible} animationType="slide" transparent onRequestClose={() => setFriendModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFriendModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: isInverse ? '#111114' : '#ffffff', borderColor: theme.border }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>{tr('sosyalMain.arkadasEkle')}</Text>
              <TouchableOpacity onPress={() => setFriendModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>{tr('sosyalMain.kapat')}</Text>
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
                  colors={[Editorial.ink, Editorial.coffee]}
                  style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
                >
                  <QrCode color="#fff" size={22} strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.friendQrCode, { color: theme.text, fontSize: 13 }]}>{tr('sosyalMain.qrGoster')}</Text>
                <Text style={[styles.friendQrSub, { color: theme.textSub }]}>{tr('sosyalMain.arkadasinaTarat')}</Text>
              </TouchableOpacity>

              {/* QR Okut */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setFriendModalVisible(false); setQrScanned(false); setQrScanVisible(true); }}
                style={[styles.friendQrBox, { flex: 1, backgroundColor: isDark ? '#f8fafc0f' : '#f8fafc', borderColor: theme.border }]}
              >
                <LinearGradient
                  colors={[Editorial.coffee, Editorial.ink]}
                  style={{ width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Camera color="#fff" size={22} strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.friendQrCode, { color: theme.text, fontSize: 13 }]}>{tr('sosyalMain.qrOkut')}</Text>
                <Text style={[styles.friendQrSub, { color: theme.textSub }]}>{tr('sosyalMain.arkadasindanTara')}</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={friendPhone}
              onChangeText={handleSearchFriend}
              placeholder={tr('sosyalMain.isimVeyaKullaniciAdiAra')}
              placeholderTextColor={theme.textSub}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.friendInput, { color: theme.text, borderColor: theme.border, backgroundColor: isInverse ? theme.surface : '#f8fafc' }]}
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
                    disabled={sendingRequestTo === user.user_id || sentToUserIds.has(user.user_id)}
                    style={[styles.searchResultItem, { borderBottomColor: theme.border, opacity: sendingRequestTo === user.user_id ? 0.5 : 1 }]}
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
                    {sendingRequestTo === user.user_id ? (
                      <ActivityIndicator size="small" color={isDark ? NIGHT.warm : LIGHT.accent} />
                    ) : sentToUserIds.has(user.user_id) ? (
                      <Check size={20} color="#10b981" strokeWidth={2.5} />
                    ) : (
                      <UserPlus size={20} color={isDark ? NIGHT.warm : LIGHT.accent} strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            {!friendSearching && friendPhone.trim().length >= 2 && friendSearchResults.length === 0 && (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={[styles.msgsEmptyText, { color: theme.textSub }]}>{tr('sendSnap.kullaniciBulunamadi')}</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Arkadaşlık İstekleri Modalı */}
      <Modal visible={requestsModalVisible} animationType="slide" transparent onRequestClose={() => setRequestsModalVisible(false)}>
        <View style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setRequestsModalVisible(false)} />
          <View style={[styles.friendModalCard, { backgroundColor: isInverse ? '#111114' : '#ffffff', borderColor: theme.border, maxHeight: '70%' }]}>
            <View style={styles.friendModalHeader}>
              <Text style={[styles.friendModalTitle, { color: theme.text }]}>{tr('sosyalMain.arkadaslikIstekleri')}</Text>
              <TouchableOpacity onPress={() => setRequestsModalVisible(false)} style={styles.modalCloseBtn} activeOpacity={0.8}>
                <Text style={styles.modalCloseText}>{tr('sosyalMain.kapat')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Text style={[styles.msgsEmptyText, { color: theme.textSub }]}>{tr('sosyalMain.bekleyenIstekYok')}</Text>
                </View>
              ) : (
                <>
                  {incomingRequests.length > 0 && (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSub, marginBottom: 6, marginTop: 4 }}>
                        {tr('sosyalMain.gelenIstekler')}
                      </Text>
                      {incomingRequests.map((req) => (
                        <View key={req.id} style={[styles.msgItem, { borderColor: theme.border }]}>
                          <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
                            <Text style={[styles.msgAvatarText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
                              {(req.sender_profile?.name || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.msgInfo, { flex: 1 }]}>
                            <Text style={[styles.msgName, { color: theme.text }]}>{req.sender_profile?.name || tr('common.kullanici')}</Text>
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
                    </>
                  )}

                  {outgoingRequests.length > 0 && (
                    <>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSub, marginBottom: 6, marginTop: 16 }}>
                        {tr('sosyalMain.gonderilenIstekler')}
                      </Text>
                      {outgoingRequests.map((req) => (
                        <View key={req.id} style={[styles.msgItem, { borderColor: theme.border }]}>
                          <View style={[styles.msgAvatar, { backgroundColor: isDark ? NIGHT.glow : 'rgba(255,69,0,0.12)' }]}>
                            <Text style={[styles.msgAvatarText, { color: isDark ? NIGHT.warm : LIGHT.accent }]}>
                              {(req.receiver_profile?.name || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                          <View style={[styles.msgInfo, { flex: 1 }]}>
                            <Text style={[styles.msgName, { color: theme.text }]}>{req.receiver_profile?.name || tr('common.kullanici')}</Text>
                            <Text style={[styles.msgSub, { color: theme.textSub }]}>@{req.receiver_profile?.username || ''}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleCancelOutgoingRequest(req.id)}
                            style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}
                          >
                            <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textSub }}>{tr('sosyalProfile.geriAl')}</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Kod Modalı */}
      <Modal visible={qrModalVisible} animationType="fade" transparent onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.friendModalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setQrModalVisible(false)} />
          <View style={[
            styles.friendModalCard, 
            { 
              backgroundColor: cardBg, 
              borderColor: cardBdr,
              borderWidth: 1,
              alignItems: 'center', 
              paddingBottom: 32,
              paddingHorizontal: 24,
              paddingTop: 20,
              maxWidth: 380,
              borderRadius: 24,
              ...cardOuterShadow,
            }
          ]}>
            {/* Başlık */}
            <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: chipBg, alignItems: 'center', justifyContent: 'center' }}>
                  <QrCode color={ctaBg} size={22} strokeWidth={2.5} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: txt1, letterSpacing: -0.5 }}>
                  {tr('sosyalMain.qrKodum')}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setQrModalVisible(false)} 
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: chipBg, alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.7}
              >
                <XIcon color={txt2} size={18} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* QR Kodu Container */}
            <View style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              ...cardInnerClip,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            }}>
              <QRCode
                value={`sanligencsosyal://add/${profile?.username || profile?.name || tr('common.kullanici').toLowerCase()}`}
                size={220}
                color="#0f172a"
                backgroundColor="#ffffff"
              />
            </View>

            {/* Kullanıcı Bilgisi */}
            <View style={{ alignItems: 'center', gap: 8, width: '100%' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: txt1, letterSpacing: -0.3 }}>
                {profile?.name || tr('sosyalMain.isimsiz')}
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: chipBg,
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: ctaBg }}>
                  @{profile?.username || tr('common.kullanici').toLowerCase()}
                </Text>
              </View>
              
              {/* Açıklama */}
              <View style={{ 
                marginTop: 16, 
                paddingTop: 16, 
                borderTopWidth: 1, 
                borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                width: '100%',
              }}>
                <Text style={{ fontSize: 14, color: txt2, textAlign: 'center', lineHeight: 20 }}>
                  {tr('sosyalMain.buKoduArkadasinaTarat')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Tarama Modalı — Tam Ekran Kamera */}
      <Modal visible={qrScanVisible} animationType="slide" onRequestClose={() => { setQrScanVisible(false); setQrScanned(false); }} statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: pageBg }}>
          {cameraPermission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={qrScanned ? undefined : handleQrScanned}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 32 }}>
              <View style={{ 
                width: 80, 
                height: 80, 
                borderRadius: 40, 
                backgroundColor: chipBg, 
                alignItems: 'center', 
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: cardBdr,
              }}>
                <QrCode color={ctaBg} size={40} strokeWidth={2} />
              </View>
              <Text style={{ color: txt1, fontSize: 20, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 }}>
                {tr('sosyalMain.kameraIzniGerekiyor')}
              </Text>
              <Text style={{ color: txt2, fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                QR kod taramak için kamera erişimine izin vermen gerekiyor
              </Text>
              <TouchableOpacity 
                onPress={requestCameraPermission} 
                style={{ 
                  backgroundColor: ctaBg, 
                  borderRadius: 16, 
                  paddingHorizontal: 32, 
                  paddingVertical: 16,
                  marginTop: 8,
                }}
              >
                <Text style={{ color: ctaTxt, fontWeight: '800', fontSize: 16 }}>
                  {tr('sosyalMain.izinVer')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Tarama çerçevesi - Gradient overlay */}
          <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
            {/* Üst gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '30%' }}
            />
            {/* Alt gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%' }}
            />
            {/* Sol gradient */}
            <LinearGradient
              colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', top: '30%', left: 0, width: '12%', height: '40%' }}
            />
            {/* Sağ gradient */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ position: 'absolute', top: '30%', right: 0, width: '12%', height: '40%' }}
            />

            {/* Köşe çerçeveleri - Tema renginde */}
            {[
              { top: '30%', left: '12%', borderTopWidth: 4, borderLeftWidth: 4 },
              { top: '30%', right: '12%', borderTopWidth: 4, borderRightWidth: 4 },
              { bottom: '35%', left: '12%', borderBottomWidth: 4, borderLeftWidth: 4 },
              { bottom: '35%', right: '12%', borderBottomWidth: 4, borderRightWidth: 4 },
            ].map((corner, i) => (
              <View 
                key={i} 
                style={[
                  { 
                    position: 'absolute', 
                    width: 32, 
                    height: 32, 
                    borderColor: amber,
                    borderRadius: 4,
                  } as const, 
                  corner as any
                ]} 
              />
            ))}
            
            {/* Merkez çerçeve çizgisi */}
            <View style={{ 
              width: '76%', 
              height: '35%', 
              borderWidth: 2, 
              borderColor: 'rgba(255,255,255,0.2)', 
              borderRadius: 20,
              borderStyle: 'dashed',
            }} />
          </View>

          {/* Üst bar */}
          <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
              <TouchableOpacity
                onPress={() => { setQrScanVisible(false); setQrScanned(false); }}
                style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: 22, 
                  backgroundColor: 'rgba(0,0,0,0.6)', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <XIcon color="#fff" size={22} strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={{ 
                backgroundColor: 'rgba(0,0,0,0.6)', 
                borderRadius: 20, 
                paddingHorizontal: 20, 
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
              }}>
                <Text style={{ 
                  color: '#fff', 
                  fontSize: 17, 
                  fontWeight: '800', 
                  textShadowColor: 'rgba(0,0,0,0.3)', 
                  textShadowOffset: { width: 0, height: 1 }, 
                  textShadowRadius: 3,
                  letterSpacing: -0.3,
                }}>
                  {tr('sosyalMain.qrKoduTara')}
                </Text>
              </View>
              <View style={{ width: 44 }} />
            </View>
          </SafeAreaView>

          {/* Alt açıklama */}
          <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 }}>
            <View style={{ 
              alignItems: 'center', 
              backgroundColor: 'rgba(0,0,0,0.8)', 
              paddingVertical: 28,
              paddingHorizontal: 32,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderTopWidth: 1,
              borderLeftWidth: 1,
              borderRightWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}>
              <View style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 24, 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <QrCode color={amber} size={26} strokeWidth={2.2} />
              </View>
              <Text style={{ 
                color: '#fff', 
                fontSize: 16, 
                fontWeight: '700', 
                marginBottom: 6,
                letterSpacing: -0.2,
              }}>
                {tr('sosyalMain.qrKoduCerceveyeGetir')}
              </Text>
              <Text style={{ 
                color: 'rgba(255,255,255,0.65)', 
                fontSize: 14, 
                textAlign: 'center',
                lineHeight: 20,
              }}>
                {tr('sosyalMain.otomatikTaninirIstekGonderilir')}
              </Text>
            </View>
          </SafeAreaView>
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
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
  },
  snapTimeTagPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 20,
  },
  snapMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
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
    overflow: 'hidden',
  },
  radarHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  radarLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  radarLiveText: {
    fontSize: 10,
    fontWeight: '700',
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
    overflow: 'hidden',
    gap: 10,
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
    height: 130,
  },
  radarCardBlur: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  radarMapPreview: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    overflow: 'hidden',
  },
  radarCardInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  radarCardInfoBg: {
    padding: 8,
    borderRadius: 10,
    gap: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  radarCardInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  radarIconCircleSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCardArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCardArrowBtnAbsolute: {
    position: 'absolute',
    right: 12,
    bottom: 9,
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
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  radarCardSub: {
    fontSize: 11,
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
    paddingHorizontal: 12,
    borderWidth: 1.2,
    borderRadius: 16,
    marginBottom: 8,
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
