import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, Platform, Switch, KeyboardAvoidingView, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ChevronRight, Bell, ShieldCheck, User as UserIcon, X,
  HelpCircle, MessageSquare, Send, Heart, Users, LogOut, Flame,
  Star, MapPin, FileText, ScrollText, Trash2, Mail, CreditCard,
} from 'lucide-react-native';
import { MOCK_USER } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { Clean } from '@/constants/Colors';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList, MainTabParamList } from '@/types/navigation';

type Nav = StackNavigationProp<RootStackParamList>;

const SUPPORT_EMAIL = 'destek@sanligenc.app';
const APP_VERSION = '1.0.0';

type LegalDoc = 'privacy' | 'terms' | 'kvkk' | null;

const ProfileScreen = () => {
  const { mode } = useThemeMode();
  const { profile, refreshProfile } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);
  const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [eventNotificationsEnabled, setEventNotificationsEnabled] = useState(true);
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

  const pageBg  = isDark ? '#0C0C0E' : Clean.bgSoft;
  const cardBg  = isDark ? '#18181B' : Clean.surface;
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : Clean.border;
  const txt1    = isDark ? '#F5F5F7' : Clean.textPrimary;
  const txt2    = isDark ? 'rgba(245,245,247,0.55)' : Clean.textSecondary;
  const ctaBg   = isDark ? '#F5F5F7' : Clean.ctaBg;
  const ctaTxt  = isDark ? '#111114' : Clean.ctaText;
  const chipBg  = isDark ? '#1F1F23' : Clean.chipBg;
  const divider = isDark ? 'rgba(255,255,255,0.06)' : Clean.divider;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const insets = useSafeAreaInsets();

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
    Alert.alert('Çıkış Yap', 'Oturumunu kapatmak istiyor musun?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
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
      Alert.alert(
        'Talebin Alındı',
        'Hesabını silme talebin ekibimize iletildi. Hesabın ve verilerin KVKK kapsamında en geç 30 gün içinde kalıcı olarak silinecek.',
        [{ text: 'Tamam', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }) }]
      );
    } catch (e) {
      Alert.alert('Hata', 'Talebin gönderilemedi, lütfen tekrar dene veya bizimle ' + SUPPORT_EMAIL + ' üzerinden iletişime geç.');
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
      body:
`Son güncelleme: 2026

ŞanlıGenç ("Uygulama"), Şanlıurfa'daki gençlere yönelik bir şehir ve gençlik platformudur. Bu politika, uygulamayı kullanırken hangi verilerinin toplandığını, nasıl kullanıldığını ve haklarını açıklar.

1. Topladığımız veriler
• Hesap bilgileri: ad soyad, kullanıcı adı, e-posta adresi
• Profil fotoğrafı (yüklersen)
• Uygulama içi etkileşimler: favoriler, yorumlar, puanlamalar, katıldığın etkinlikler
• Konum bilgisi: yalnızca "yakınımdaki duraklar/mekânlar" gibi özellikleri kullanman için, ve yalnızca izin verdiğinde
• Cihaz ve kullanım verileri: uygulama sürümü, hata kayıtları, genel kullanım istatistikleri

2. Verilerini nasıl kullanıyoruz
Verilerin yalnızca; hesabını yönetmek, sana etkinlik/fırsat/duyuru göstermek, sosyal özellikleri (ŞanlıSosyal) çalıştırmak, uygulamayı iyileştirmek ve yasal yükümlülüklerimizi yerine getirmek için kullanılır.

3. Paylaşım
Verilerin hiçbir şekilde reklam amacıyla üçüncü taraflara satılmaz. Verilerin yalnızca uygulamayı çalıştırmamıza yardımcı olan alt yüklenicilerle (barındırma ve veritabanı hizmeti) paylaşılır; bu hizmet sağlayıcılar da verilerini yalnızca bizim talimatlarımız doğrultusunda işler.

4. Güvenlik
Verilerin şifreli bağlantılar üzerinden iletilir ve erişim yetkilendirmesi olan güvenli sunucularda saklanır.

5. Saklama süresi
Hesabın aktif olduğu sürece verilerin saklanır. Hesabını sildiğinde, verilerin KVKK'da öngörülen süreler saklı kalmak kaydıyla makul bir süre içinde silinir veya anonim hale getirilir.

6. Haklarım nelerdir?
Verilerine erişme, düzeltilmesini isteme, silinmesini talep etme ve işlemeye itiraz etme hakkına sahipsin. Detaylar için "KVKK Aydınlatma Metni"ne bakabilirsin.

7. Bize ulaş
Sorularınız için: ${SUPPORT_EMAIL}`,
    },
    terms: {
      title: 'Kullanım Şartları',
      icon: <FileText color={txt1} size={26} strokeWidth={2} />,
      body:
`Son güncelleme: 2026

Bu Kullanım Şartları, ŞanlıGenç uygulamasını kullanırken uyman gereken kuralları belirler. Uygulamayı kullanarak bu şartları kabul etmiş sayılırsın.

1. Hesap
13 yaşından büyük olman ve hesap bilgilerinin doğru olması gerekir. Hesabının güvenliğinden sen sorumlusun; şifreni kimseyle paylaşma.

2. Kullanım kuralları
• Başkalarına hakaret, taciz veya nefret söylemi içeren paylaşım yapamazsın.
• Sahte bilgi, spam veya yanıltıcı içerik paylaşamazsın.
• ŞanlıSosyal ve yorum alanlarında yalnızca yasal ve saygılı içerik paylaşabilirsin.
• Uygulamanın işleyişini bozacak (bot, otomasyon, tersine mühendislik vb.) hiçbir girişimde bulunamazsın.

3. İçerikler
Genç Kart fırsatları, etkinlik bilgileri ve tarihi yer içerikleri bilgilendirme amaçlıdır; anlaşmalı işletmelerin sunduğu kampanya koşulları önceden haber verilmeksizin değişebilir.

4. Sorumluluk sınırı
Uygulama "olduğu gibi" sunulur. Üçüncü taraf işletmelerin sunduğu hizmet/kampanyalardan veya kullanıcıların paylaştığı içeriklerden doğabilecek anlaşmazlıklardan uygulama sorumlu tutulamaz.

5. Hesap kapatma
Kurallara aykırı davranış tespit edilirse hesabın askıya alınabilir veya kapatılabilir. Hesabını istediğin zaman "Hesabımı Sil" seçeneğiyle kapatabilirsin.

6. Değişiklikler
Bu şartlar zaman zaman güncellenebilir; önemli değişikliklerde uygulama içinden bilgilendirilirsin.

7. İletişim
${SUPPORT_EMAIL}`,
    },
    kvkk: {
      title: 'KVKK Aydınlatma Metni',
      icon: <ScrollText color={txt1} size={26} strokeWidth={2} />,
      body:
`6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla ŞanlıGenç uygulaması olarak seni bilgilendiriyoruz.

1. Kişisel verilerin işlenme amacı
Ad-soyad, kullanıcı adı, e-posta, profil fotoğrafı, konum (izin verilirse) ve uygulama içi etkileşim verilerin; üyeliğinin oluşturulması, hizmetlerin sunulması, Genç Kart fırsatlarının ve etkinliklerin sana özel gösterilmesi, ŞanlıSosyal üzerinden diğer gençlerle bağlantı kurabilmen ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir.

2. İşlenen verilerin aktarılabileceği taraflar
Verilerin, hizmetin sunulabilmesi için zorunlu olduğu ölçüde barındırma/veritabanı altyapı sağlayıcımızla ve yetkili kamu kurum ve kuruluşlarıyla (yasal zorunluluk halinde) paylaşılabilir. Verilerin pazarlama amacıyla üçüncü kişilere satılmaz veya kiralanmaz.

3. Kişisel veri toplamanın yöntemi ve hukuki sebebi
Verilerin, uygulamayı kullanman sırasında elektronik ortamda; sözleşmenin kurulması ve ifası, açık rızan (konum gibi opsiyonel veriler için) ve meşru menfaat hukuki sebeplerine dayanılarak toplanır.

4. KVKK'nın 11. maddesi kapsamındaki hakların
Kişisel verinin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme, eksik/yanlış işlenmişse düzeltilmesini isteme, KVKK'da öngörülen şartlar çerçevesinde silinmesini/yok edilmesini isteme, yapılan işlemlerin ilgili üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine bir sonucun ortaya çıkmasına itiraz etme ve kanuna aykırı işlenme sebebiyle zarara uğraman hâlinde zararın giderilmesini talep etme haklarına sahipsin.

5. Başvuru
Bu haklarını kullanmak için Profil > Hesabımı Sil / Hesap Ayarları üzerinden ya da ${SUPPORT_EMAIL} adresinden bizimle iletişime geçebilirsin. Talebin en geç 30 gün içinde sonuçlandırılır.`,
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
              <Text style={[styles.gencKartBadgeText, { color: txt1 }]}>Genç Kart</Text>
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
          <View style={[styles.statCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <Users size={18} color={txt1} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>{friendCount}</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>Arkadaş</Text>
          </View>

          <TouchableOpacity
            style={[styles.statCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}
            onPress={() => navigation.navigate('Events', { initialTab: 'Favorilerim' })}
            activeOpacity={0.8}
          >
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <Heart size={18} color={txt1} strokeWidth={2.2} fill={favoritesCount > 0 ? txt1 : 'transparent'} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>{favoritesCount}</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>Favori</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <Star size={18} color={txt1} strokeWidth={2.2} fill={txt1} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>Genç</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>Seviye</Text>
          </View>

          <View style={[styles.statCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.statIcon, { backgroundColor: chipBg }]}>
              <MapPin size={18} color={txt1} strokeWidth={2.2} />
            </View>
            <Text style={[styles.statValue, { color: txt1 }]}>Urfa</Text>
            <Text style={[styles.statLabel, { color: txt2 }]}>Şehir</Text>
          </View>
        </View>

        {/* ── GENEL ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>Genel</Text>
          <View style={[styles.menuCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label={favoritesCount > 0 ? `Favorilerim (${favoritesCount})` : 'Favorilerim'}
                subtitle="Etkinlikler, mekânlar ve duraklar"
                icon={<Heart color={txt1} size={20} strokeWidth={2.2} fill={favoritesCount > 0 ? txt1 : 'transparent'} />}
                iconBg={chipBg}
                onPress={() => navigation.navigate('Events', { initialTab: 'Favorilerim' })}
              />
              <MenuItem
                label="Hesap Ayarları"
                subtitle="Ad ve iletişim bilgileri"
                icon={<UserIcon color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => { setEditName(userName); setEditEmail(userEmail); setAccountSettingsVisible(true); }}
              />
              <MenuItem
                label="Geri Bildirim"
                subtitle="Şikâyet, hata veya özellik isteği"
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
          <Text style={[styles.groupLabel, { color: txt2 }]}>Tercihler</Text>
          <View style={[styles.menuCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <ToggleRow
                icon={<Bell color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                title="Bildirimler"
                subtitle="Etkinlik ve duyuru bildirimleri"
                value={eventNotificationsEnabled}
                onValueChange={setEventNotificationsEnabled}
              />
              <ToggleRow
                icon={<ShieldCheck color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                title="Kullanım Analitiği"
                subtitle="Uygulamayı iyileştirmemize yardımcı ol"
                value={analyticsEnabled}
                onValueChange={setAnalyticsEnabled}
              />
              <ToggleRow
                icon={<UserIcon color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                title="Kişiselleştirme"
                subtitle="Sana özel öneri ve fırsatlar"
                value={personalizationEnabled}
                onValueChange={setPersonalizationEnabled}
                isLast
              />
            </View>
          </View>
        </View>

        {/* ── YASAL ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>Yasal & Gizlilik</Text>
          <View style={[styles.menuCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label="Gizlilik Politikası"
                subtitle="Verilerini nasıl işliyoruz"
                icon={<ShieldCheck color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setLegalDoc('privacy')}
              />
              <MenuItem
                label="Kullanım Şartları"
                subtitle="Uygulamayı kullanma kuralları"
                icon={<FileText color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => setLegalDoc('terms')}
              />
              <MenuItem
                label="KVKK Aydınlatma Metni"
                subtitle="6698 sayılı Kanun kapsamında haklarım"
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
          <Text style={[styles.groupLabel, { color: txt2 }]}>Yardım</Text>
          <View style={[styles.menuCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label="Yardım & SSS"
                subtitle="Sık sorulanlar ve ipuçları"
                icon={<HelpCircle color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => Alert.alert('Yardım', 'Yakında SSS ve destek bağlantıları eklenecek.\nGeri bildirimden bize ulaşabilirsin.', [{ text: 'Tamam' }])}
              />
              <MenuItem
                label="İletişim"
                subtitle={SUPPORT_EMAIL}
                icon={<Mail color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => Alert.alert('İletişim', `Bize ${SUPPORT_EMAIL} adresinden ulaşabilirsin.`, [{ text: 'Tamam' }])}
              />
              <MenuItem
                label="Hakkında"
                subtitle={`ŞanlıGenç · Sürüm ${APP_VERSION}`}
                icon={<Flame color={txt1} size={20} strokeWidth={2.2} />}
                iconBg={chipBg}
                onPress={() => Alert.alert('ŞanlıGenç', `Şanlıurfa gençlik platformu\nSürüm: ${APP_VERSION}\n\nŞehri keşfet, bağlantı kur, büyü.`, [{ text: 'Tamam' }])}
                isLast
              />
            </View>
          </View>
        </View>

        {/* ── TEHLİKELİ BÖLGE ── */}
        <View style={styles.section}>
          <Text style={[styles.groupLabel, { color: txt2 }]}>Hesap</Text>
          <View style={[styles.menuCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={[styles.menuCard, cardInnerClip]}>
              <MenuItem
                label="Hesabımı Sil"
                subtitle="Hesabın ve tüm verilerin kalıcı olarak silinir"
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
            style={[styles.logoutBtn, { borderColor: isDark ? 'rgba(239,68,68,0.28)' : 'rgba(239,68,68,0.18)', backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2' }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut color="#ef4444" size={20} strokeWidth={2.2} />
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: txt2 }]}>ŞanlıGenç · Sürüm {APP_VERSION}</Text>
        </View>

        {/* ── MODALlar ── */}

        {/* Doğrulama */}
        <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setModalVisible(false)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                <ShieldCheck color={txt1} size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: txt1 }]}>Hesabını Doğrula</Text>
              <Text style={[styles.modalSubtitle, { color: txt2 }]}>
                Tüm avantajlardan faydalanmak için telefon numaranı doğrula.
              </Text>
              <TextInput
                placeholder="Telefon numaranız"
                placeholderTextColor={txt2}
                style={modalInputStyle}
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
              />
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>Doğrula ve Devam Et</Text>
                </View>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

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
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>Kapat</Text>
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
              <Text style={[styles.modalTitle, { color: txt1 }]}>Hesap Ayarları</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, width: '100%' }}>
                <Text style={[styles.inputLabel, { color: txt2 }]}>Kullanıcı Adı</Text>
                <TextInput
                  placeholder="Adınız"
                  placeholderTextColor={txt2}
                  style={modalInputStyle}
                  value={editName}
                  onChangeText={setEditName}
                  autoCapitalize="words"
                />
                <Text style={[styles.inputLabel, { color: txt2 }]}>E-posta</Text>
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
                  try {
                    if (profile?.userId) {
                      await supabase.from('user_profiles').update({ name: editName.trim() }).eq('user_id', profile.userId);
                      if (editEmail.trim() && editEmail.trim() !== userEmail) {
                        const { error: emailError } = await supabase.auth.updateUser({ email: editEmail.trim() });
                        if (emailError) throw emailError;
                        Alert.alert('Onay Gerekiyor', 'Yeni e-posta adresine bir doğrulama bağlantısı gönderildi.');
                      }
                      await refreshProfile();
                    }
                    setAccountSettingsVisible(false);
                  } catch (e: any) {
                    Alert.alert('Hata', e?.message || 'Bilgiler kaydedilemedi, lütfen tekrar dene.');
                  }
                }}
              >
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>Kaydet</Text>
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
              <Text style={[styles.modalTitle, { color: txt1 }]}>Hesabını Sil</Text>
              <Text style={[styles.modalSubtitle, { color: txt2, textAlign: 'left', lineHeight: 22 }]}>
                Bu işlem geri alınamaz. Hesabın silinme talebini gönderdiğinde:{'\n\n'}
                • Profilin, yorumların ve favorilerin kalıcı olarak silinir{'\n'}
                • ŞanlıSosyal'deki bağlantıların kaldırılır{'\n'}
                • Verilerin KVKK kapsamında en geç 30 gün içinde tamamen silinir{'\n\n'}
                Emin misin?
              </Text>
              <TouchableOpacity
                style={[styles.modalBtn, deleting && { opacity: 0.6 }]}
                disabled={deleting}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.modalBtnGrad, { backgroundColor: '#ef4444' }]}>
                  <Trash2 color="#fff" size={16} />
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>{deleting ? 'Gönderiliyor…' : 'Evet, Hesabımı Sil'}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setDeleteAccountVisible(false)} disabled={deleting}>
                <Text style={[styles.modalCancelText, { color: txt2 }]}>Vazgeç</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Geri Bildirim */}
        <Modal animationType="slide" transparent visible={feedbackModalVisible} onRequestClose={() => setFeedbackModalVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
            <View style={modalCardStyle}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setFeedbackModalVisible(false)}>
                <X color={txt2} size={22} />
              </TouchableOpacity>
              <View style={[styles.modalIconWrap, { backgroundColor: chipBg }]}>
                <MessageSquare color={txt1} size={28} strokeWidth={2} />
              </View>
              <Text style={[styles.modalTitle, { color: txt1 }]}>Geri Bildirim</Text>

              {/* Tip seçimi */}
              <View style={styles.feedbackTypes}>
                {(['complaint', 'bug', 'feature'] as const).map((t) => {
                  const labels = { complaint: 'Öneri', bug: 'Hata', feature: 'Özellik' };
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

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 260, width: '100%' }}>
                <Text style={[styles.inputLabel, { color: txt2 }]}>Başlık</Text>
                <TextInput
                  placeholder="Kısa bir başlık..."
                  placeholderTextColor={txt2}
                  style={modalInputStyle}
                  value={feedbackTitle}
                  onChangeText={setFeedbackTitle}
                />
                <Text style={[styles.inputLabel, { color: txt2 }]}>Açıklama</Text>
                <TextInput
                  placeholder="Detayları buraya yaz..."
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
                  try {
                    await supabase.from('geri_bildirimler').insert({
                      kullanici_id: profile?.userId || MOCK_USER.name,
                      tur: feedbackType === 'complaint' ? 'sikayet_oneri' : feedbackType === 'bug' ? 'hata' : 'ozellik_istegi',
                      baslik: feedbackTitle.trim(),
                      aciklama: feedbackDescription.trim(),
                      durum: 'beklemede',
                      olusturma_tarihi: new Date().toISOString(),
                    });
                    Alert.alert('Gönderildi', 'Geri bildiriminiz için teşekkürler!', [{ text: 'Tamam', onPress: () => { setFeedbackModalVisible(false); setFeedbackTitle(''); setFeedbackDescription(''); setFeedbackType('complaint'); } }]);
                  } catch {
                    Alert.alert('Hata', 'Gönderilirken sorun oluştu.', [{ text: 'Tamam' }]);
                  }
                }}
              >
                <View style={[styles.modalBtnGrad, { backgroundColor: ctaBg }]}>
                  <Send color={ctaTxt} size={16} />
                  <Text style={[styles.modalBtnText, { color: ctaTxt }]}>Gönder</Text>
                </View>
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
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
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
  legalScroll: {
    width: '100%',
    marginBottom: 4,
  },
  legalBody: {
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: 'left',
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
