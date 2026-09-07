import React, { useState, useEffect } from 'react';
import { AppAlert } from '@/lib/alert';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Switch, KeyboardAvoidingView, Alert, Image, Dimensions, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronRight, ChevronDown, Bell, ShieldCheck, User as UserIcon, X,
  HelpCircle, MessageSquare, Send, Heart, Users, LogOut, Flame,
  Star, MapPin, FileText, ScrollText, Trash2, Mail, CreditCard, Palette, Languages,
  Grid3x3,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { MOCK_USER } from '@/api/mockData';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { useAppTheme } from '@/theme/useAppTheme';
import { useThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageCode } from '@/i18n';
import { cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, MainTabParamList } from '@/types/navigation';

const SERIF = Platform.select<string>({ ios: 'Georgia', android: 'serif', default: 'serif' });
import { PRIVACY_POLICY_TEXT, TERMS_OF_USE_TEXT, KVKK_TEXT } from '@/constants/legalTexts';

type Nav = StackNavigationProp<RootStackParamList>;
type ThemeMode = 'light' | 'dark' | 'inverse';

const SUPPORT_EMAIL = 'destek@sanligenc.app';
const APP_VERSION = '1.0.0';
const SCREEN_HEIGHT = Dimensions.get('window').height;

const OTHER_APPS = [
  {
    key: 'tabufun',
    name: 'TabuFun - Tabu & Sessiz Sinema',
    iosUrl: 'https://apps.apple.com/tr/app/tabufun-tabu-sessiz-sinema/id6751104663?l=tr',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.muhammedenesaslan.TabuFun&pcampaignid=web_share',
  },
  {
    key: 'cografyapusulasi',
    name: 'Coğrafya Pusulası - KPSS/YKS',
    iosUrl: 'https://apps.apple.com/tr/app/co%C4%9Frafya-pusulas%C4%B1-kpss-yks/id6760138734?l=tr',
    androidUrl: 'https://play.google.com/store/apps/details?id=com.msbborak.map&pcampaignid=web_share',
  },
] as const;

type LegalDoc = 'privacy' | 'terms' | 'kvkk' | null;

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Genç Kart nedir, nasıl edinirim?',
    a: 'Genç Kart, 18-30 yaş arasındaki Şanlıurfalı gençlere şehirdeki anlaşmalı işletmelerde indirim sağlayan dijital bir kimlik kartıdır. Hesabını oluşturup profilini tamamladığında Genç Kart otomatik olarak hesabına tanımlanır, Genç Kart sekmesinden QR kodunu işletmede okutarak indirimden yararlanabilirsin.',
  },
  {
    q: 'Kupon/fırsatları nasıl kullanırım?',
    a: 'Genç Kart sayfasındaki bir fırsatın üzerine dokun, "Kuponu Kullan" butonuna bas ve işletmede QR kodunu göster. Kart sahibi kimliğin doğrulanır, indirim işletme tarafından uygulanır.',
  },
  {
    q: 'Şanlı Sosyal\'de kimler mesajlarımı görebilir?',
    a: 'Sadece karşılıklı kabul ettiğin arkadaşların seninle mesajlaşabilir ve Kıvılcım (fotoğraf/video) paylaşımlarını görebilir. Arkadaş olmayan biri sana mesaj gönderemez, gönderilerini göremez.',
  },
  {
    q: 'Birini nasıl engellerim veya şikayet ederim?',
    a: 'Şanlı Sosyal\'de kişinin profiline gir, sağ üstteki menüden "Engelle" veya "Şikayet Et" seçeneğine dokun. Engellediğin kişi seni arayamaz, sana istek gönderemez, seni göremez. Engellediklerini Şanlı Sosyal profilindeki "Engellenen Kullanıcılar" bölümünden yönetebilirsin.',
  },
  {
    q: 'Misafir (giriş yapmadan) modda neler kısıtlı?',
    a: 'Misafir modda Keşfet, Gezi Rotaları, Etkinlikler, Ulaşım gibi genel bilgileri görebilirsin ama Genç Kart fırsatlarını kullanamaz, Şanlı Sosyal\'e giremez ve favori ekleyemezsin. Bu özellikler için hesap oluşturman gerekir.',
  },
  {
    q: 'Ulaşım sayfasındaki bilgiler ne kadar güncel?',
    a: 'Otobüs hat ve durak bilgileri Şanlıurfa Büyükşehir Belediyesi\'nin resmi verilerine dayanır. Sefer saatleri belediye tarafından değiştirilebileceğinden, kritik bir yolculuk öncesi güncel saatleri belediyenin resmi kanallarından teyit etmen önerilir.',
  },
  {
    q: 'Bildirim almıyorum, ne yapmalıyım?',
    a: 'Cihazının Ayarlar > Bildirimler bölümünden ŞanlıGenç için bildirimlerin açık olduğundan emin ol. Uygulama içinde de Profil > Görünüm bölümünden bildirim tercihini kontrol edebilirsin.',
  },
  {
    q: 'Hesabımı nasıl silerim?',
    a: 'Profil sayfasının en altındaki "Hesabımı Sil" seçeneğine dokun. Onayladığında hesabın ve tüm verilerin kalıcı olarak silinmesi için talebin oluşturulur.',
  },
  {
    q: 'Bir hata/öneri bildirmek istiyorum, nereden yapabilirim?',
    a: 'Profil > Geri Bildirim bölümünden hata, şikayet veya özellik isteğini doğrudan bize iletebilirsin. İstersen destek@sanligenc.app adresine de yazabilirsin.',
  },
];

const ProfileScreen = () => {
  const t = useAppTheme();
  const { mode, setMode } = useThemeMode();
  const { t: tr, i18n } = useTranslation();
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const { profile, isGuest, refreshProfile } = useUser();
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);
  const [faqVisible, setFaqVisible] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [eventNotificationsEnabled, setEventNotificationsEnabled] = useState(true);
  const [radarVisible, setRadarVisible] = useState(true);
  const [radarVisibleSaving, setRadarVisibleSaving] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [themeModalVisible, setThemeModalVisible] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'complaint' | 'bug' | 'feature'>('complaint');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [friendCount, setFriendCount] = useState(0);
  const navigation = useNavigation<Nav>();

  const userName = profile?.name || (isGuest ? tr('common.misafir') : MOCK_USER.name);
  const userUsername = profile?.username || '';
  const userEmail = profile?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const { isDark, pageBg, cardBg, cardBdr, txt1, txt2, ctaBg, ctaTxt, chipBg, divider } = t;
  const isInverse = mode === 'inverse';
  const logoutColor = isInverse ? '#D1D5DB' : '#ef4444';

  const { events: favEvents, partners: favPartners, heritage: favHeritage, stops: favStops } = useFavorites();
  const favoritesCount = favEvents.length + favPartners.length + favHeritage.length + favStops.length;

  const cardBorder =
    mode === 'inverse'
      ? { borderWidth: 1.2, borderColor: cardBdr }
      : isDark
        ? cardBorderDark
        : cardBorderLight;

  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!profile?.userId) return;
    supabase
      .from('user_profiles')
      .select('radar_visible')
      .eq('user_id', profile.userId)
      .maybeSingle()
      .then(({ data, error }) => {
        console.log('[Şehir Radarı Ayarı] mevcut değer', { data, error });
        if (!error && data) setRadarVisible(data.radar_visible !== false);
      });
  }, [profile?.userId]);

  const handleRadarVisibleChange = async (value: boolean) => {
    if (!profile?.userId || radarVisibleSaving) return;
    setRadarVisible(value);
    setRadarVisibleSaving(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ radar_visible: value })
        .eq('user_id', profile.userId)
        .select();
      console.log('[Şehir Radarı Ayarı] güncelleme sonucu', { data, error });
      if (error || !data || data.length === 0) {
        setRadarVisible(!value);
        AppAlert.alert(tr('common.error'), tr('profileScreen.sehirRadariAyariHata'));
      }
    } catch (e: any) {
      console.error('[Şehir Radarı Ayarı] HATA', e);
      setRadarVisible(!value);
      AppAlert.alert(tr('common.error'), tr('profileScreen.sehirRadariAyariHata'));
    } finally {
      setRadarVisibleSaving(false);
    }
  };

  useEffect(() => {
    if (!profile?.userId) return;
    (async () => {
      try {
        const { count } = await supabase
          .from('friendships')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`sender_id.eq.${profile.userId},receiver_id.eq.${profile.userId}`);
        setFriendCount(count || 0);
      } catch (e) {
        // sessiz geç — arkadaş sayısı 0 kalır
      }
    })();
  }, [profile?.userId]);

  const handleLogout = async () => {
    AppAlert.alert(tr('profile.cikisYap'), tr('profileScreen.oturumuKapatmakIstiyorMusun'), [
      { text: tr('common.cancel'), style: 'cancel' },
      {
        text: tr('profile.cikisYap'), style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Oturum yerelde zaten kapanmış olabilir — yine de kullanıcıyı Login'e gönder
          }
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      if (profile?.userId) {
        await supabase.from('hesap_silme_talepleri').insert({
          kullanici_id: profile.userId,
          eposta: userEmail || null,
          talep_tarihi: new Date().toISOString(),
          durum: 'beklemede',
        });
      }
      try {
        await supabase.auth.signOut();
      } catch (e) {
        // yerelde zaten kapanmış olabilir
      }
      setDeleteAccountVisible(false);
      AppAlert.alert(
        tr('profileScreen.talebinAlindi'),
        tr('profileScreen.hesapSilmeTalebiAciklama'),
        [{ text: tr('sendSnap.tamam'), onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
      );
    } catch (e) {
      AppAlert.alert(tr('common.error'), tr('profileScreen.talebinGonderilemedi') + ' ' + SUPPORT_EMAIL + ' ' + tr('profileScreen.uzerindenIletisimeGec'));
    } finally {
      setDeleting(false);
    }
  };

  // ── Ortak modal stili ──
  const modalCardStyle = [
    styles.modalView,
    { backgroundColor: cardBg, borderColor: cardBdr },
  ];

  const modalInputStyle = [
    styles.modalInput,
    {
      backgroundColor: chipBg,
      borderColor: cardBdr,
      color: txt1,
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
      style={[styles.menuItem, isLast && styles.menuItemLast, { borderBottomColor: divider }]}
      onPress={onPress}
      activeOpacity={0.72}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={styles.menuItemTextCol}>
          <Text style={[styles.menuItemText, { color: isDestructive ? '#ef4444' : txt1 }]}>{label}</Text>
          {subtitle ? (
            <Text style={[styles.menuItemSubtitle, { color: txt2 }]} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      <ChevronRight color={txt2} size={18} strokeWidth={2.2} />
    </TouchableOpacity>
  );

  // ── ToggleRow bileşeni ──
  const ToggleRow = ({
    icon, iconBg, title, subtitle, value, onValueChange, isLast,
  }: {
    icon: React.ReactNode; iconBg: string; title: string; subtitle: string;
    value: boolean; onValueChange: (v: boolean) => void; isLast?: boolean;
  }) => (
    <View style={[styles.toggleRow, isLast && styles.menuItemLast, { borderBottomColor: divider }]}>
      <View style={[styles.menuIconWrap, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.toggleTextCol}>
        <Text style={[styles.menuItemText, { color: txt1 }]}>{title}</Text>
        <Text style={[styles.menuItemSubtitle, { color: txt2 }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor="#fff"
        trackColor={{ false: isDark ? '#2c2c2e' : '#e2e8f0', true: txt1 }}
        ios_backgroundColor={isDark ? '#2c2c2e' : '#e2e8f0'}
      />
    </View>
  );

  const legalContent: Record<Exclude<LegalDoc, null>, { title: string; icon: React.ReactNode; body: string }> = {
    privacy: {
      title: 'Gizlilik Politikası',
      icon: <ShieldCheck color={txt1} size={26} strokeWidth={2} />,
      body: PRIVACY_POLICY_TEXT,
    },
    terms: {
      title: 'Kullanım Şartları',
      icon: <FileText color={txt1} size={26} strokeWidth={2} />,
      body: TERMS_OF_USE_TEXT,
    },
    kvkk: {
      title: 'KVKK Aydınlatma Metni',
      icon: <ScrollText color={txt1} size={26} strokeWidth={2} />,
      body: KVKK_TEXT,
    },
  };

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      {/* ── HERO HEADER ── */}
      <View style={[styles.heroOuter, { backgroundColor: pageBg, paddingTop: insets.top + 18 }]}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.heroLabel, { color: txt2 }]}>PROFİL & AYARLAR</Text>
            <Text style={[styles.heroTitle, { color: txt1 }]} numberOfLines={1}>{userName}</Text>
            {userUsername ? <Text style={[styles.heroUsername, { color: txt2 }]}>@{userUsername}</Text> : null}
            <TouchableOpacity
              style={[styles.gencKartBadge, { backgroundColor: chipBg, borderColor: cardBdr }]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Main', { screen: 'GencKart' as keyof MainTabParamList })}
            >
              <CreditCard color={txt1} size={13} strokeWidth={2.2} />
              <Text style={[styles.gencKartBadgeText, { color: txt1 }]}>{tr('welcome.gencKart')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.avatarOuterRing, { borderColor: cardBdr }]}>
            <View style={[styles.avatarRing, { backgroundColor: chipBg }]}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={[styles.avatarText, { color: txt1 }]}>{userInitial}</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ── STATS KARTLARI ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <Users size={18} color={txt1} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>{friendCount}</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>{tr('profile.arkadas')}</Text>
          </View>

          <TouchableOpacity
            style={[styles.statCard, cardBorder, { backgroundColor: cardBg }]}
            onPress={() => navigation.navigate('Events', { initialTab: 'Favorilerim' })}
            activeOpacity={0.8}
          >
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <Heart size={18} color={txt1} strokeWidth={2.2} fill={favoritesCount > 0 ? txt1 : 'transparent'} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>{favoritesCount}</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>{tr('profileScreen.favori')}</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <Star size={18} color={txt1} strokeWidth={2.2} fill={txt1} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>{tr('profile.genc')}</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>{tr('profile.seviye')}</Text>
          </View>

          <View style={[styles.statCard, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <MapPin size={18} color={txt1} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>{tr('profile.urfa')}</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>{tr('profile.sehir')}</Text>
          </View>
        </View>

        {/* ── GENEL ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>{tr('profile.genel')}</Text>
          <View style={[styles.menuCardOuter, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label={favoritesCount > 0 ? `${tr('profile.favorilerim')} (${favoritesCount})` : tr('profile.favorilerim')}
                subtitle={tr('profileScreen.favorilerimSub')}
                icon={<Heart color={txt1} size={20} strokeWidth={2.2} fill={favoritesCount > 0 ? txt1 : 'transparent'} />}
                iconBg={chipBg}
                onPress={() => navigation.navigate('Events', { initialTab: 'Favorilerim' })}
              />
              <MenuItem
                label={tr('profile.hesapAyarlari')}
                subtitle={tr('profile.hesapAyarlariSub')}
                icon={<UserIcon color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => { setEditName(userName); setEditUsername(userUsername); setEditEmail(userEmail); setAccountSettingsVisible(true); }}
              />
              <MenuItem
                label={tr('profile.geriBildirim')}
                subtitle={tr('profile.geriBildirimSub')}
                icon={<MessageSquare color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setFeedbackModalVisible(true)}
                isLast
              />
            </View>
          </View>
        </View>

        {/* ── TERCİHLER ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>{tr('profile.tercihler')}</Text>
          <View style={[styles.menuCardOuter, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label={tr('profile.gorunum')}
                subtitle={
                  mode === 'light'
                    ? tr('profileScreen.gunDogumu')
                    : mode === 'dark'
                      ? tr('profileScreen.gunBatimi')
                      : tr('profileScreen.gecePariltisi')
                }
                icon={<Palette color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setThemeModalVisible(true)}
              />
              <MenuItem
                label={tr('profile.dil')}
                subtitle={tr(`languages.${language}`)}
                icon={<Languages color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setLanguageModalVisible(true)}
              />
              <ToggleRow
                icon={<Bell color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                title={tr('hizliErisim.bildirimler')}
                subtitle={tr('profileScreen.bildirimlerSub')}
                value={eventNotificationsEnabled}
                onValueChange={setEventNotificationsEnabled}
              />
              <ToggleRow
                icon={<MapPin color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                title={tr('profileScreen.sehirRadariGorunurluk')}
                subtitle={tr('profileScreen.sehirRadariGorunurlukSub')}
                value={radarVisible}
                onValueChange={handleRadarVisibleChange}
                isLast
              />
            </View>
          </View>
        </View>

        {/* ── DİĞER UYGULAMALARIMIZ ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>{tr('profileScreen.digerUygulamalarimiz')}</Text>
          <View style={[styles.menuCardOuter, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              {OTHER_APPS.map((app, idx) => (
                <MenuItem
                  key={app.key}
                  label={app.name}
                  subtitle={tr('profileScreen.magazadaGoruntule')}
                  icon={<Grid3x3 color={txt1} size={20} strokeWidth={2.2} />}
                  iconBg={chipBg}
                  onPress={() => {
                    const url = Platform.OS === 'ios' ? app.iosUrl : app.androidUrl;
                    Linking.openURL(url).catch(() => {
                      AppAlert.alert(tr('common.error'), tr('profileScreen.magazaAcilamadi'));
                    });
                  }}
                  isLast={idx === OTHER_APPS.length - 1}
                />
              ))}
            </View>
          </View>
        </View>

        {/* ── YASAL ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>{tr('profile.yasalGizlilik')}</Text>
          <View style={[styles.menuCardOuter, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label={tr('profileScreen.gizlilikPolitikasi')}
                subtitle={tr('profileScreen.verileriniNasilIsliyoruz')}
                icon={<ShieldCheck color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setLegalDoc('privacy')}
              />
              <MenuItem
                label={tr('profileScreen.kullanimSartlari')}
                subtitle={tr('profileScreen.uygulamayiKullanmaKurallari')}
                icon={<FileText color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setLegalDoc('terms')}
              />
              <MenuItem
                label={tr('profileScreen.kvkkAydinlatmaMetni')}
                subtitle={tr('profileScreen.kvkkHaklarim')}
                icon={<ScrollText color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setLegalDoc('kvkk')}
                isLast
              />
            </View>
          </View>
        </View>

        {/* ── YARDIM ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>{tr('profileScreen.yardim')}</Text>
          <View style={[styles.menuCardOuter, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label={tr('profileScreen.yardimVeSss')}
                subtitle={tr('profileScreen.sikSorulanlar')}
                icon={<HelpCircle color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setFaqVisible(true)}
              />
              <MenuItem
                label={tr('profileScreen.iletisim')}
                subtitle={SUPPORT_EMAIL}
                icon={<Mail color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => AppAlert.alert(tr('profileScreen.iletisim'), tr('profileScreen.bizeUlasabilirsin', { email: SUPPORT_EMAIL }), [{ text: tr('sendSnap.tamam') }])}
              />
              <MenuItem
                label={tr('profileScreen.hakkinda')}
                subtitle={`ŞanlıGenç · ${tr('profileScreen.surum')} ${APP_VERSION}`}
                icon={<Flame color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => AppAlert.alert('ŞanlıGenç', tr('profileScreen.hakkindaMetni', { version: APP_VERSION }), [{ text: tr('sendSnap.tamam') }])}
                isLast
              />
            </View>
          </View>
        </View>

        {/* ── TEHLİKELİ BÖLGE ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>{tr('profileScreen.hesap')}</Text>
          <View style={[styles.menuCardOuter, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label={tr('profile.hesabiniSil')}
                subtitle={tr('profileScreen.hesabinSilinirSub')}
                icon={<Trash2 color="#ef4444" size={20} strokeWidth={2.2} />}
                iconBg={isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2'}
                onPress={() => setDeleteAccountVisible(true)}
                isDestructive
                isLast
              />
            </View>
          </View>
        </View>

        {/* ── ÇIKIŞ ── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                borderColor: isInverse
                  ? 'rgba(255,255,255,0.42)'
                  : isDark
                    ? 'rgba(239,68,68,0.28)'
                    : 'rgba(239,68,68,0.18)',
                backgroundColor: isInverse
                  ? 'rgba(255,255,255,0.05)'
                  : isDark
                    ? 'rgba(239,68,68,0.08)'
                    : '#FEF2F2',
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut color={logoutColor} size={20} strokeWidth={2.2} />
            <Text style={[styles.logoutText, { color: logoutColor }]}>{tr('profile.cikisYap')}</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: txt2 }]}>ŞanlıGenç · {tr('profileScreen.surum')} {APP_VERSION}</Text>
        </View>

        {/* ── MODALlar ── */}

        {/* Yasal doküman (Gizlilik / Şartlar / KVKK) */}
        <Modal animationType="slide" transparent visible={legalDoc !== null} onRequestClose={() => setLegalDoc(null)}>
          <View style={styles.modalBackdrop}>
            <View style={[modalCardStyle, styles.legalModalView]}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setLegalDoc(null)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>
              {legalDoc && (
                <>
                  <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                    {legalContent[legalDoc].icon}
                  </View>
                  <Text style={[styles.modalTitle, { color: txt1 }]}>{legalContent[legalDoc].title}</Text>
                  <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll}>
                    <Text style={[styles.legalBody, { color: txt2 }]}>{legalContent[legalDoc].body}</Text>
                  </ScrollView>
                </>
              )}
              <TouchableOpacity style={styles.modalBtn} onPress={() => setLegalDoc(null)}>
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>{tr('common.close')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Yardım & SSS */}
        <Modal
          animationType="slide"
          transparent
          visible={faqVisible}
          onRequestClose={() => { setFaqVisible(false); setOpenFaqIndex(null); }}
        >
          <View style={styles.modalBackdrop}>
            <View style={[modalCardStyle, styles.legalModalView]}>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => { setFaqVisible(false); setOpenFaqIndex(null); }}
              >
                <X color={txt2} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                <HelpCircle color={txt1} size={26} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: txt1 }]}>{tr('profileScreen.yardim')}</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={styles.legalScroll}>
                {FAQ_ITEMS.map((item, index) => {
                  const isOpen = openFaqIndex === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.8}
                      style={[styles.faqItem, { borderBottomColor: t.divider }]}
                      onPress={() => setOpenFaqIndex(isOpen ? null : index)}
                    >
                      <View style={styles.faqQRow}>
                        <Text style={[styles.faqQ, { color: txt1 }]}>{item.q}</Text>
                        <ChevronDown
                          color={txt2}
                          size={18}
                          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                        />
                      </View>
                      {isOpen && <Text style={[styles.faqA, { color: txt2 }]}>{item.a}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <TouchableOpacity style={styles.modalBtn} onPress={() => { setFaqVisible(false); setOpenFaqIndex(null); }}>
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>{tr('common.close')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Hesap Ayarları */}
        <Modal animationType="slide" transparent visible={accountSettingsVisible} onRequestClose={() => setAccountSettingsVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setAccountSettingsVisible(false)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                <UserIcon color={txt1} size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: txt1 }]}>{tr('profile.hesapAyarlari')}</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 360, width: '100%' }}>
                <Text style={[styles.inputLabel, { color: txt2 }]}>{tr('profileScreen.adiniz')}</Text>
                <TextInput
                  placeholder={tr('profileScreen.adiniz')}
                  placeholderTextColor={txt2}
                  style={modalInputStyle}
                  value={editName}
                  onChangeText={setEditName}
                  autoCapitalize="words"
                />
                <Text style={[styles.inputLabel, { color: txt2 }]}>{tr('profileScreen.kullaniciAdi')}</Text>
                <TextInput
                  placeholder="kullanici_adi"
                  placeholderTextColor={txt2}
                  style={modalInputStyle}
                  value={editUsername}
                  onChangeText={(val) => setEditUsername(val.replace(/[^a-zA-Z0-9_]/g, ''))}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                <Text style={[styles.inputLabel, { color: txt2 }]}>{tr('profileScreen.eposta')}</Text>
                <TextInput
                  placeholder="ornek@email.com"
                  placeholderTextColor={txt2}
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
                  const cleanUsername = editUsername.trim().toLowerCase();
                  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
                    AppAlert.alert(tr('common.error'), tr('completeProfile.kullaniciAdiGecersiz'));
                    return;
                  }
                  try {
                    if (profile?.userId) {
                      const { data: updatedRows, error } = await supabase
                        .from('user_profiles')
                        .upsert(
                          { user_id: profile.userId, name: editName.trim(), username: cleanUsername },
                          { onConflict: 'user_id' }
                        )
                        .select();
                      if (error) {
                        if (error.code === '23505') {
                          AppAlert.alert(tr('common.error'), tr('completeProfile.kullaniciAdiKullanimda'));
                          return;
                        }
                        throw error;
                      }
                      console.log('Güncellenen satırlar:', updatedRows);
                      if (editEmail.trim() && editEmail.trim() !== userEmail) {
                        const { error: emailError } = await supabase.auth.updateUser({ email: editEmail.trim() });
                        if (emailError) throw emailError;
                        AppAlert.alert(tr('profileScreen.onayGerekiyor'), tr('profileScreen.dogrulamaBaglantisiGonderildi'));
                      }
                      await refreshProfile();
                      AppAlert.alert('Başarılı', 'Bilgilerin güncellendi.');
                    }
                    setAccountSettingsVisible(false);
                  } catch (e: any) {
                    console.error('Hesap ayarları kaydetme hatası:', e);
                    AppAlert.alert(tr('common.error'), e?.message || tr('profileScreen.bilgilerKaydedilemedi'));
                  }
                }}
              >
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>{tr('common.save')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Hesabımı Sil */}
        <Modal animationType="slide" transparent visible={deleteAccountVisible} onRequestClose={() => setDeleteAccountVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setDeleteAccountVisible(false)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEF2F2' }]}>
                <Trash2 color="#ef4444" size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: txt1 }]}>{tr('profileScreen.hesabiniSilBaslik')}</Text>
              <Text style={[styles.modalSubtitle, { color: txt2, textAlign: 'left', lineHeight: 22 }]}>
                {tr('profileScreen.hesabiniSilAciklama')}
              </Text>
              <TouchableOpacity
                style={[styles.modalBtn, deleting && { opacity: 0.6 }]}
                disabled={deleting}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.modalBtnGrad, { backgroundColor: '#ef4444' }]}>
                  <Trash2 color="#fff" size={16} />
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>{deleting ? tr('heritageDetail.gonderiliyor') : tr('profileScreen.evetHesabimiSil')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteAccountVisible(false)} disabled={deleting}>
                <Text style={[styles.modalCancelText, { color: txt2 }]}>{tr('profileScreen.vazgec')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Geri Bildirim */}
        <Modal animationType="slide" transparent visible={feedbackModalVisible} onRequestClose={() => setFeedbackModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
            <View style={[modalCardStyle, styles.feedbackModalCard]}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setFeedbackModalVisible(false)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                style={{ width: '100%', flexGrow: 0 }}
                contentContainerStyle={{ alignItems: 'center' }}
              >
                <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                  <MessageSquare color={txt1} size={28} strokeWidth={2} />
                </View>
                <Text style={[styles.modalTitle, { color: txt1 }]}>{tr('profileScreen.geriBildirimBaslik')}</Text>

                {/* Tip seçimi */}
                <View style={styles.feedbackTypes}>
                  {(['complaint', 'bug', 'feature'] as const).map((t) => {
                    const labels = { complaint: tr('profileScreen.oneri'), bug: tr('common.error'), feature: tr('profileScreen.ozellik') };
                    const active = feedbackType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.feedbackTypeBtn,
                          { borderColor: cardBdr },
                          active && { borderColor: txt1, backgroundColor: chipBg },
                        ]}
                        onPress={() => setFeedbackType(t)}
                      >
                        <Text style={[styles.feedbackTypeTxt, active ? { color: txt1, fontWeight: '700' } : { color: txt2 }]}>{labels[t]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.inputLabel, { color: txt2, alignSelf: 'flex-start' }]}>{tr('profileScreen.baslik')}</Text>
                <TextInput
                  placeholder={tr('profileScreen.kisaBaslik')}
                  placeholderTextColor={txt2}
                  style={modalInputStyle}
                  value={feedbackTitle}
                  onChangeText={setFeedbackTitle}
                />
                <Text style={[styles.inputLabel, { color: txt2, alignSelf: 'flex-start' }]}>{tr('profileScreen.aciklama')}</Text>
                <TextInput
                  placeholder={tr('profileScreen.detaylariBurayaYaz')}
                  placeholderTextColor={txt2}
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
                  if (!profile?.userId) {
                    AppAlert.alert(tr('common.error'), tr('profileScreen.girisGerekliGeriBildirim'), [{ text: tr('sendSnap.tamam') }]);
                    return;
                  }
                  try {
                    const { error } = await supabase.from('geri_bildirimler').insert({
                      kullanici_id: profile.userId,
                      tur: feedbackType === 'complaint' ? 'sikayet_oneri' : feedbackType === 'bug' ? 'hata' : 'ozellik_istegi',
                      baslik: feedbackTitle.trim(),
                      aciklama: feedbackDescription.trim(),
                      durum: 'beklemede',
                      olusturma_tarihi: new Date().toISOString(),
                    });
                    if (error) throw error;
                    AppAlert.alert(tr('profileScreen.gonderildi'), tr('profileScreen.geriBildirimTesekkur'), [{ text: tr('sendSnap.tamam'), onPress: () => { setFeedbackModalVisible(false); setFeedbackTitle(''); setFeedbackDescription(''); setFeedbackType('complaint'); } }]);
                  } catch {
                    AppAlert.alert(tr('common.error'), tr('profileScreen.gonderilirkenSorun'), [{ text: tr('sendSnap.tamam') }]);
                  }
                }}
              >
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Send color={ctaTxt} size={16} />
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>{tr('common.send')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Tema Seçimi */}
        <Modal animationType="slide" transparent visible={themeModalVisible} onRequestClose={() => setThemeModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setThemeModalVisible(false)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                <Palette color={txt1} size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: txt1 }]}>{tr('profileScreen.temaSecimi')}</Text>
              <Text style={[styles.modalSubtitle, { color: txt2 }]}>{tr('profileScreen.uygulamaGorunumunuSecebilirsin')}</Text>

              <View style={styles.themeList}>
                {([
                  { key: 'light', label: tr('profileScreen.gunDogumu'), desc: tr('profileScreen.acikVeSade') },
                  { key: 'dark', label: tr('profileScreen.gunBatimi'), desc: tr('profileScreen.sicakKoyu') },
                  // 'inverse' (Gece Parıltısı) geçici olarak kaldırıldı: bu tema
                  // gerçekten siyah arkaplan kullanıyor ama Şanlı Sosyal'deki
                  // (ve başka ekranlardaki) metin renkleri "dark" temanın krem/
                  // kahve tonlarına göre ayarlanmış — inverse'de bu koyu metinler
                  // siyah zeminde okunmaz hale geliyor. Düzgün taranıp
                  // düzeltilene kadar seçenek gizli; ThemeMode tipinden ve
                  // useAppTheme'den kaldırılmadı, sadece kullanıcıya sunulmuyor.
                ] as { key: ThemeMode; label: string; desc: string }[]).map((opt) => {
                  const active = mode === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      activeOpacity={0.86}
                      onPress={() => setMode(opt.key)}
                      style={[
                        styles.themeListItem,
                        {
                          backgroundColor: active ? chipBg : 'transparent',
                          borderColor: active ? ctaBg : cardBdr,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.themeListTitle, { color: txt1 }]}>{opt.label}</Text>
                        <Text style={[styles.themeListDesc, { color: txt2 }]}>{opt.desc}</Text>
                      </View>
                      {active && <Text style={[styles.themeSelected, { color: ctaBg }]}>{tr('profileScreen.secili')}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.modalBtn} onPress={() => setThemeModalVisible(false)}>
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>{tr('common.ok')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Dil Seçimi */}
        <Modal animationType="slide" transparent visible={languageModalVisible} onRequestClose={() => setLanguageModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setLanguageModalVisible(false)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                <Languages color={txt1} size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: txt1 }]}>{tr('languagePicker.title')}</Text>
              <Text style={[styles.modalSubtitle, { color: txt2 }]}>{tr('languagePicker.subtitle')}</Text>

              <View style={styles.themeList}>
                {supportedLanguages.map((code) => {
                  const active = language === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      activeOpacity={0.86}
                      onPress={() => setLanguage(code as LanguageCode)}
                      style={[
                        styles.themeListItem,
                        {
                          backgroundColor: active ? chipBg : 'transparent',
                          borderColor: active ? ctaBg : cardBdr,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.themeListTitle, { color: txt1 }]}>{tr(`languages.${code}`)}</Text>
                      </View>
                      {active && <Text style={[styles.themeSelected, { color: ctaBg }]}>{tr('common.ok')}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.modalBtn} onPress={() => setLanguageModalVisible(false)}>
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>{tr('common.ok')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
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
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 27,
    fontWeight: '500',
    letterSpacing: -0.5,
    fontFamily: SERIF,
  },
  heroUsername: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  avatarOuterRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  gencKartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  gencKartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
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
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
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
  menuCardOuter: {
    borderRadius: 20,
  },
  menuCard: {
    borderRadius: 20,
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
  themeList: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  themeListItem: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeListTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  themeListDesc: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  themeSelected: {
    fontSize: 12,
    fontWeight: '800',
  },

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
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 16,
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
  legalModalView: {
    maxHeight: '82%',
  },
  feedbackModalCard: {
    maxHeight: SCREEN_HEIGHT * 0.82,
    flexShrink: 1,
  },
  legalScroll: {
    width: '100%',
    marginBottom: 4,
  },
  legalBody: {
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'left',
  },
  faqItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  faqQ: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  faqA: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
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
  modalCancelBtn: { marginTop: 12, paddingVertical: 6 },
  modalCancelText: { fontSize: 14, fontWeight: '600' },

  // Feedback
  feedbackTypes: { flexDirection: 'row', gap: 8, marginBottom: 16, width: '100%' },
  feedbackTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  feedbackTypeTxt: { fontSize: 12, fontWeight: '600' },
});

export default ProfileScreen;
