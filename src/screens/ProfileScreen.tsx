import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Switch, KeyboardAvoidingView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight, Bell, ShieldCheck, User as UserIcon, X, Settings,
  HelpCircle, Info, Moon, MessageSquare, Send, AlertCircle, Lightbulb,
  Heart, Users, LogOut, Flame, Star, MapPin,
} from 'lucide-react-native';
import { MOCK_USER } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<RootStackParamList>;

// ── Tema renkleri ────────────────────────────────
const FIRE = {
  vivid:   '#FF4500',
  warm:    '#FF6B35',
  deep:    '#CC3700',
  glow:    'rgba(255,69,0,0.18)',
  border:  'rgba(255,69,0,0.25)',
  text:    '#FF9166',
};

const LIGHT = {
  bg:      '#FFF8F5',
  card:    '#FFFFFF',
  text:    '#1a0800',
  sub:     '#78350f',
  muted:   '#a16207',
  border:  'rgba(255,69,0,0.10)',
  divider: 'rgba(0,0,0,0.06)',
};

const DARK = {
  bg:      '#0C0C0E',
  card:    '#161618',
  card2:   '#1C1C1F',
  text:    '#F5F5F7',
  sub:     '#A0A0A8',
  muted:   'rgba(160,160,168,0.6)',
  border:  'rgba(255,255,255,0.08)',
  divider: 'rgba(255,255,255,0.06)',
};

// ────────────────────────────────────────────────

const ProfileScreen = () => {
  const { mode, modeLabel, toggleTheme } = useThemeMode();
  const { profile, refreshProfile } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [eventNotificationsEnabled, setEventNotificationsEnabled] = useState(true);
  const [discountNotificationsEnabled, setDiscountNotificationsEnabled] = useState(true);
  const [locationNotificationsEnabled, setLocationNotificationsEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'complaint' | 'bug' | 'feature'>('complaint');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [friendCount, setFriendCount] = useState(0);
  const navigation = useNavigation<Nav>();

  const userName = profile?.name || MOCK_USER.name;
  const userUsername = profile?.username || '';
  const userEmail = profile?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const isDark = mode === 'dark';

  const { events: favEvents, partners: favPartners, heritage: favHeritage, stops: favStops } = useFavorites();
  const favoritesCount = favEvents.length + favPartners.length + favHeritage.length + favStops.length;

  const C = isDark ? DARK : LIGHT;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!profile?.userId) return;
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`sender_id.eq.${profile.userId},receiver_id.eq.${profile.userId}`)
      .then(({ count }) => setFriendCount(count || 0));
  }, [profile?.userId]);

  const handleLogout = async () => {
    Alert.alert('Çıkış Yap', 'Oturumunu kapatmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  // ── Ortak modal stili ──
  const modalCardStyle = [
    styles.modalView,
    { backgroundColor: isDark ? '#1C1C1F' : LIGHT.card, borderColor: isDark ? 'rgba(255,255,255,0.08)' : LIGHT.border },
  ];

  const modalInputStyle = [
    styles.modalInput,
    {
      backgroundColor: isDark ? 'rgba(255,69,0,0.08)' : 'rgba(255,69,0,0.05)',
      borderColor: isDark ? DARK.border : LIGHT.border,
      color: isDark ? DARK.text : LIGHT.text,
    },
  ];

  // ── MenuItem bileşeni ──
  const MenuItem = ({
    label, subtitle, icon, iconBg, onPress, isLast, isDestructive,
  }: {
    label: string; subtitle?: string; icon: React.ReactNode; iconBg: string;
    onPress?: () => void; isLast?: boolean; isDestructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.menuItemLast, { borderBottomColor: C.divider }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={styles.menuItemTextCol}>
          <Text style={[styles.menuItemText, { color: isDestructive ? '#f87171' : C.text }]}>{label}</Text>
          {subtitle ? (
            <Text style={[styles.menuItemSubtitle, { color: C.muted }]} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <ChevronRight color={isDark ? 'rgba(255,145,102,0.4)' : 'rgba(255,69,0,0.3)'} size={18} strokeWidth={2.2} />
    </TouchableOpacity>
  );

  // ── ToggleRow bileşeni ──
  const ToggleRow = ({
    icon, iconBg, title, subtitle, value, onValueChange, isLast,
  }: {
    icon: React.ReactNode; iconBg: string; title: string; subtitle: string;
    value: boolean; onValueChange: (v: boolean) => void; isLast?: boolean;
  }) => (
    <View style={[styles.toggleRow, isLast && styles.menuItemLast, { borderBottomColor: C.divider }]}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.toggleTextCol}>
        <Text style={[styles.menuItemText, { color: C.text }]}>{title}</Text>
        <Text style={[styles.menuItemSubtitle, { color: C.muted }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor="#fff"
        trackColor={{ false: isDark ? '#2c2c2e' : '#e2e8f0', true: FIRE.vivid }}
        ios_backgroundColor={isDark ? '#2c2c2e' : '#e2e8f0'}
      />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* ── HERO HEADER ── */}
      <LinearGradient
        colors={isDark
          ? ['#3D0E00', '#CC3700', '#FF4500', DARK.bg]
          : ['#CC3700', '#FF4500', '#FF6B35', LIGHT.bg]}
        style={[styles.heroOuter, { paddingTop: insets.top + 18 }]}
      >
        {/* Dekoratif daireler */}
        <View style={styles.heroDeco1} />
        <View style={styles.heroDeco2} />

        {/* İçerik */}
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>PROFİL & AYARLAR</Text>
            <Text style={styles.heroTitle}>{userName}</Text>
            {userUsername ? <Text style={styles.heroUsername}>@{userUsername}</Text> : null}
          </View>
          <LinearGradient
            colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.10)']}
            style={styles.avatarRing}
          >
            <View style={[styles.avatarInner, { backgroundColor: isDark ? '#1C1C1F' : '#FFF3EE' }]}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
          </LinearGradient>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── STATS KARTLARI ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: isDark ? DARK.card2 : LIGHT.card, borderColor: C.border }]}>
            <View style={[styles.statIcon, { backgroundColor: FIRE.glow }]}>
              <Users size={18} color={FIRE.vivid} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>{friendCount}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Arkadaş</Text>
          </View>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: isDark ? DARK.card2 : LIGHT.card, borderColor: C.border }]}
            onPress={() => navigation.navigate('Events', { initialTab: 'Favorilerim' })}
            activeOpacity={0.8}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(244,63,94,0.12)' }]}>
              <Heart size={18} color="#f43f5e" strokeWidth={2.2} fill={favoritesCount > 0 ? '#f43f5e' : 'transparent'} />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>{favoritesCount}</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Favori</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, { backgroundColor: isDark ? DARK.card2 : LIGHT.card, borderColor: C.border }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(234,179,8,0.12)' }]}>
              <Star size={18} color="#ca8a04" strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>Genç</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Seviye</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: isDark ? DARK.card2 : LIGHT.card, borderColor: C.border }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16,185,129,0.10)' }]}>
              <MapPin size={18} color="#059669" strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: C.text }]}>Urfa</Text>
            <Text style={[styles.statLabel, { color: C.muted }]}>Şehir</Text>
          </View>
        </View>

        {/* ── GENEL ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: FIRE.text }]}>Genel</Text>
          <View style={[styles.menuCard, { backgroundColor: isDark ? DARK.card2 : LIGHT.card, borderColor: C.border }]}>
            <MenuItem
              label={favoritesCount > 0 ? `Favorilerim (${favoritesCount})` : 'Favorilerim'}
              subtitle="Etkinlikler, mekânlar ve duraklar"
              icon={<Heart color="#f43f5e" size={20} strokeWidth={2.2} fill={favoritesCount > 0 ? '#f43f5e' : 'transparent'} />}
              iconBg="rgba(244,63,94,0.12)"
              onPress={() => navigation.navigate('Events', { initialTab: 'Favorilerim' })}
            />
            <MenuItem
              label="Hesap Ayarları"
              subtitle="Ad ve iletişim bilgileri"
              icon={<UserIcon color={FIRE.vivid} size={20} strokeWidth={2.2} />}
              iconBg={FIRE.glow}
              onPress={() => { setEditName(userName); setEditEmail(userEmail); setAccountSettingsVisible(true); }}
            />
            <MenuItem
              label="Gizlilik ve Güvenlik"
              subtitle="Verilerin ve güvenliğin"
              icon={<ShieldCheck color="#059669" size={20} strokeWidth={2.2} />}
              iconBg="rgba(16,185,129,0.12)"
              onPress={() => setPrivacyModalVisible(true)}
            />
            <MenuItem
              label="Geri Bildirim"
              subtitle="Şikâyet, hata veya özellik isteği"
              icon={<MessageSquare color="#d97706" size={20} strokeWidth={2.2} />}
              iconBg="rgba(245,158,11,0.12)"
              onPress={() => setFeedbackModalVisible(true)}
              isLast
            />
          </View>
        </View>

        {/* ── TERCİHLER ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: FIRE.text }]}>Tercihler</Text>
          <View style={[styles.menuCard, { backgroundColor: isDark ? DARK.card2 : LIGHT.card, borderColor: C.border }]}>
            <ToggleRow
              icon={<Bell color={FIRE.vivid} size={20} strokeWidth={2.2} />}
              iconBg={FIRE.glow}
              title="Bildirimler"
              subtitle="Etkinlik ve duyuru bildirimleri"
              value={eventNotificationsEnabled}
              onValueChange={setEventNotificationsEnabled}
            />
            <ToggleRow
              icon={<Moon color={isDark ? '#c4b5fd' : '#7c3aed'} size={20} strokeWidth={2.2} />}
              iconBg="rgba(139,92,246,0.12)"
              title="Karanlık Mod"
              subtitle={`Şu an: ${modeLabel.toLowerCase()} tema`}
              value={isDark}
              onValueChange={toggleTheme}
              isLast
            />
          </View>
        </View>

        {/* ── YARDIM ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: FIRE.text }]}>Yardım</Text>
          <View style={[styles.menuCard, { backgroundColor: isDark ? DARK.card2 : LIGHT.card, borderColor: C.border }]}>
            <MenuItem
              label="Yardım & SSS"
              subtitle="Sık sorulanlar ve ipuçları"
              icon={<HelpCircle color="#0284c7" size={20} strokeWidth={2.2} />}
              iconBg="rgba(14,165,233,0.12)"
              onPress={() => Alert.alert('Yardım', 'Yakında SSS ve destek bağlantıları eklenecek.\nGeri bildirimden bize ulaşabilirsin.', [{ text: 'Tamam' }])}
            />
            <MenuItem
              label="Hakkında"
              subtitle="ŞanlıGenç · Sürüm 1.0.0"
              icon={<Flame color={FIRE.vivid} size={20} strokeWidth={2.2} />}
              iconBg={FIRE.glow}
              onPress={() => Alert.alert('ŞanlıGenç', 'Şanlıurfa gençlik platformu\nSürüm: 1.0.0\n\nŞehri keşfet, bağlantı kur, büyü. 🔥', [{ text: 'Tamam' }])}
              isLast
            />
          </View>
        </View>

        {/* ── ÇIKIŞ ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)' }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut color="#ef4444" size={20} strokeWidth={2.2} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* ── MODALlar ── */}

        {/* Doğrulama */}
        <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                <X color={isDark ? DARK.muted : '#9ca3af'} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: FIRE.glow }]}>
                <ShieldCheck color={FIRE.vivid} size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: C.text }]}>Hesabını Doğrula</Text>
              <Text style={[styles.modalSubtitle, { color: C.muted }]}>
                Tüm avantajlardan faydalanmak için telefon numaranı doğrula.
              </Text>
              <TextInput
                placeholder="Telefon numaranız"
                placeholderTextColor={isDark ? DARK.muted : '#9ca3af'}
                style={modalInputStyle}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <LinearGradient colors={['#CC3700', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtnGrad}>
                  <Text style={styles.modalBtnText}>Doğrula ve Devam Et</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Gizlilik */}
        <Modal animationType="slide" transparent visible={privacyModalVisible} onRequestClose={() => setPrivacyModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setPrivacyModalVisible(false)}>
                <X color={isDark ? DARK.muted : '#9ca3af'} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <ShieldCheck color="#059669" size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: C.text }]}>Gizlilik ve Güvenlik</Text>
              <Text style={[styles.modalSubtitle, { color: C.muted, textAlign: 'left', lineHeight: 22 }]}>
                Uygulamamız kişisel verilerini güvenle saklar. Konum, kullanım ve tercih bilgilerin yalnızca hizmetleri iyileştirmek için kullanılır.{'\n\n'}
                Veriler şifrelenmiş olarak tutulur ve üçüncü taraflarla paylaşılmaz.
              </Text>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setPrivacyModalVisible(false)}>
                <LinearGradient colors={['#CC3700', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtnGrad}>
                  <Text style={styles.modalBtnText}>Anladım</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Hesap Ayarları */}
        <Modal animationType="slide" transparent visible={accountSettingsVisible} onRequestClose={() => setAccountSettingsVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setAccountSettingsVisible(false)}>
                <X color={isDark ? DARK.muted : '#9ca3af'} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: FIRE.glow }]}>
                <UserIcon color={FIRE.vivid} size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: C.text }]}>Hesap Ayarları</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, width: '100%' }}>
                <Text style={[styles.inputLabel, { color: C.muted }]}>Kullanıcı Adı</Text>
                <TextInput
                  placeholder="Adınız"
                  placeholderTextColor={isDark ? DARK.muted : '#9ca3af'}
                  style={modalInputStyle}
                  value={editName}
                  onChangeText={setEditName}
                  autoCapitalize="words"
                />
                <Text style={[styles.inputLabel, { color: C.muted }]}>E-posta</Text>
                <TextInput
                  placeholder="ornek@email.com"
                  placeholderTextColor={isDark ? DARK.muted : '#9ca3af'}
                  style={modalInputStyle}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </ScrollView>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={async () => {
                  if (profile?.userId) {
                    await supabase.from('user_profiles').update({ name: editName.trim() }).eq('user_id', profile.userId);
                    await refreshProfile();
                  }
                  setAccountSettingsVisible(false);
                }}
              >
                <LinearGradient colors={['#CC3700', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtnGrad}>
                  <Text style={styles.modalBtnText}>Kaydet</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Geri Bildirim */}
        <Modal animationType="slide" transparent visible={feedbackModalVisible} onRequestClose={() => setFeedbackModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setFeedbackModalVisible(false)}>
                <X color={isDark ? DARK.muted : '#9ca3af'} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                <MessageSquare color="#d97706" size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: C.text }]}>Geri Bildirim</Text>

              {/* Tip seçimi */}
              <View style={styles.feedbackTypes}>
                {(['complaint', 'bug', 'feature'] as const).map((t) => {
                  const labels = { complaint: '💬 Öneri', bug: '🐛 Hata', feature: '💡 Özellik' };
                  const active = feedbackType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.feedbackTypeBtn, active && styles.feedbackTypeBtnActive, isDark && { borderColor: DARK.border }, active && { borderColor: FIRE.vivid, backgroundColor: FIRE.glow }]}
                      onPress={() => setFeedbackType(t)}
                    >
                      <Text style={[styles.feedbackTypeTxt, active && { color: FIRE.vivid, fontWeight: '700' }, !active && { color: C.muted }]}>{labels[t]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 260, width: '100%' }}>
                <Text style={[styles.inputLabel, { color: C.muted }]}>Başlık</Text>
                <TextInput
                  placeholder="Kısa bir başlık..."
                  placeholderTextColor={isDark ? DARK.muted : '#9ca3af'}
                  style={modalInputStyle}
                  value={feedbackTitle}
                  onChangeText={setFeedbackTitle}
                />
                <Text style={[styles.inputLabel, { color: C.muted }]}>Açıklama</Text>
                <TextInput
                  placeholder="Detayları buraya yaz..."
                  placeholderTextColor={isDark ? DARK.muted : '#9ca3af'}
                  style={[modalInputStyle, { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={feedbackDescription}
                  onChangeText={setFeedbackDescription}
                  multiline
                  numberOfLines={4}
                />
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalBtn, (!feedbackTitle.trim() || !feedbackDescription.trim()) && { opacity: 0.4 }]}
                disabled={!feedbackTitle.trim() || !feedbackDescription.trim()}
                onPress={async () => {
                  try {
                    await supabase.from('geri_bildirimler').insert({
                      kullanici_id: MOCK_USER.name,
                      tur: feedbackType === 'complaint' ? 'sikayet_oneri' : feedbackType === 'bug' ? 'hata' : 'ozellik_istegi',
                      baslik: feedbackTitle.trim(),
                      aciklama: feedbackDescription.trim(),
                      durum: 'beklemede',
                      olusturma_tarihi: new Date().toISOString(),
                    });
                    Alert.alert('Gönderildi 🔥', 'Geri bildiriminiz için teşekkürler!', [{ text: 'Tamam', onPress: () => { setFeedbackModalVisible(false); setFeedbackTitle(''); setFeedbackDescription(''); setFeedbackType('complaint'); } }]);
                  } catch {
                    Alert.alert('Hata', 'Gönderilirken sorun oluştu.', [{ text: 'Tamam' }]);
                  }
                }}
              >
                <LinearGradient colors={['#CC3700', '#FF4500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalBtnGrad}>
                  <Send color="#fff" size={16} />
                  <Text style={styles.modalBtnText}>Gönder</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 110 },

  // Hero
  heroOuter: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroDeco1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -50,
  },
  heroDeco2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: 30,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroUsername: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: FIRE.vivid,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 0,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
    ...Platform.select({
      ios: { shadowColor: '#FF4500', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },
  menuCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#FF4500', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16 },
      android: { elevation: 2 },
    }),
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 8 },
  menuIconWrap: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  menuItemTextCol: { flex: 1, gap: 2 },
  menuItemText: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  menuItemSubtitle: { fontSize: 12, fontWeight: '500', lineHeight: 17 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  toggleTextCol: { flex: 1, gap: 2, paddingRight: 4 },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
    letterSpacing: 0.2,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  modalView: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingTop: 20,
    paddingBottom: 36,
    alignItems: 'center',
  },
  modalClose: { alignSelf: 'flex-end', padding: 4, marginBottom: 8 },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  modalBtn: { width: '100%', marginTop: 16 },
  modalBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
  },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },

  // Feedback
  feedbackTypes: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' },
  feedbackTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  feedbackTypeBtnActive: {},
  feedbackTypeTxt: { fontSize: 12, fontWeight: '600' },
});

export default ProfileScreen;
