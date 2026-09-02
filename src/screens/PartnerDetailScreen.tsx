import React, { useState, useEffect, useCallback } from 'react';
import { AppAlert } from '@/lib/alert';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ChevronLeft,
  Heart,
  Tag,
  Coffee,
  Shirt,
  Smartphone,
  Ticket,
  GraduationCap,
  Gift,
  Megaphone,
  Film,
  Utensils,
  ExternalLink,
  Calendar,
  Sparkles,
  Navigation,
  MapPin,
  LucideIcon,
  QrCode,
  CheckCircle2,
  X as XIcon,
} from 'lucide-react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useTranslation } from 'react-i18next';
import i18nInstance from '@/i18n';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFavorites } from '@/context/FavoritesContext';
import { useUser } from '@/context/UserContext';
import { pickLocalized } from '@/lib/localizeContent';
import { cardOuterShadow, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { FontFamily } from '@/constants/Typography';
import { supabase, processImageUrl } from '@/lib/supabase';
import { MOCK_PARTNERS } from '@/api/mockData';

type Props = StackScreenProps<RootStackParamList, 'PartnerDetail'>;

const HERO_RATIO = 0.62;
const RADIUS = 24;
const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W - 32;
const HERO_H = HERO_W * HERO_RATIO;

interface FirsatRow {
  id: number;
  baslik: string;
  aciklama?: string;
  tarih?: string;
  kategori: string;
  resim_url?: string;
}

interface PartnerView {
  id?: number;
  title: string;
  description: string;
  category: string;
  offer?: string;
  imageUrl?: string | null;
  date?: string;
  externalUrl?: string;
}

function getCategoryIcon(kategori: string, name?: string): LucideIcon {
  const nm = (name || '').toLowerCase();
  if (nm) {
    if (nm.includes('kahve') || nm.includes('kafe') || nm.includes('mırra') || nm.includes('çay')) return Coffee;
    if (nm.includes('restoran') || nm.includes('lokanta') || nm.includes('kebap') || nm.includes('yemek')) return Utensils;
    if (nm.includes('sinema') || nm.includes('film')) return Film;
    if (nm.includes('giyim') || nm.includes('moda') || nm.includes('mağaza')) return Shirt;
    if (nm.includes('teknoloji') || nm.includes('telefon')) return Smartphone;
  }
  const k = (kategori || '').toLowerCase();
  if (k.includes('yiyecek') || k.includes('içecek') || k.includes('icecek') || k === 'kafe' || k.includes('kahve')) return Coffee;
  if (k.includes('giyim') || k.includes('moda')) return Shirt;
  if (k.includes('teknoloji') || k.includes('elektronik')) return Smartphone;
  if (k.includes('bilet') || k.includes('etkinlik')) return Ticket;
  if (k.includes('öğrenci') || k.includes('ogrenci')) return GraduationCap;
  if (k.includes('indirim')) return Tag;
  if (k.includes('kampanya')) return Megaphone;
  if (k.includes('sinema') || k.includes('film')) return Film;
  if (k.includes('restoran') || k.includes('yemek')) return Utensils;
  return Gift;
}

function openInMaps(placeName: string) {
  const query = encodeURIComponent(`${placeName}, Şanlıurfa`);
  const url = Platform.OS === 'ios' ? `maps://?q=${query}` : `geo:0,0?q=${query}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  });
}

function fromSupabase(row: FirsatRow, lang: string): PartnerView {
  const desc = pickLocalized(row as any, 'aciklama', lang).trim();
  return {
    id: row.id,
    title: pickLocalized(row as any, 'baslik', lang),
    description: desc || i18nInstance.t('partnerDetail.aciklamaEklenmemis'),
    category: row.kategori,
    imageUrl: processImageUrl(row.resim_url, 'firsat_resimleri'),
    date: row.tarih,
  };
}

function fromMock(id: string): PartnerView | null {
  const m = MOCK_PARTNERS.find((p) => p.id === id);
  if (!m) return null;
  return {
    title: m.name,
    description: m.description,
    category: m.category || i18nInstance.t('partnerDetail.diger'),
    offer: m.offer,
    imageUrl: m.imageUrl || null,
    externalUrl: m.url,
  };
}

const PartnerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { partnerId } = route.params;
  const t = useAppTheme();
  const { i18n, t: tr } = useTranslation();
  const { isDark, pageBg, cardBg, cardBdr, chipBg, txt1, txt2, accent: amber } = t;
  const insets = useSafeAreaInsets();
  const { isFavoritePartner, toggleFavorite } = useFavorites();
  const { profile } = useUser();
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const [partner, setPartner] = useState<PartnerView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [qrScanVisible, setQrScanVisible] = useState(false);
  const [qrScanned, setQrScanned] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const loadPartner = useCallback(
    async (fromRefresh = false, isMountedRef?: { current: boolean }) => {
      try {
        if (fromRefresh) setRefreshing(true);
        else setLoading(true);

        const numId = parseInt(partnerId, 10);
        if (!Number.isNaN(numId)) {
          const { data, error } = await supabase.from('firsatlar').select('*').eq('id', numId).single();
          if (!error && data) {
            if (!isMountedRef || isMountedRef.current) setPartner(fromSupabase(data as FirsatRow, i18n.language));
            return;
          }
        }

        const mock = fromMock(partnerId);
        if (!isMountedRef || isMountedRef.current) setPartner(mock);
      } catch (e) {
        if (__DEV__) console.log('Fırsat detay:', e);
        if (!isMountedRef || isMountedRef.current) setPartner(fromMock(partnerId));
      } finally {
        if (!isMountedRef || isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [partnerId, i18n.language]
  );

  useEffect(() => {
    const isMountedRef = { current: true };
    loadPartner(false, isMountedRef);
    return () => { isMountedRef.current = false; };
  }, [loadPartner]);

  useEffect(() => {
    let isMounted = true;
    const checkRedeemed = async () => {
      if (!partner?.id || !profile?.userId) return;
      const { data } = await supabase
        .from('firsat_kullanimlari')
        .select('id')
        .eq('user_id', profile.userId)
        .eq('firsat_id', partner.id)
        .maybeSingle();
      if (isMounted) setIsRedeemed(!!data);
    };
    checkRedeemed();
    return () => { isMounted = false; };
  }, [partner?.id, profile?.userId]);

  const handleQrScanned = useCallback(async ({ data: qrData }: { data: string }) => {
    if (qrScanned) return;
    setQrScanned(true);

    // QR format: sanligencsosyal://firsat/<qr_token>
    const match = qrData.match(/sanligencsosyal:\/\/firsat\/([0-9a-fA-F-]+)/);
    if (!match) {
      AppAlert.alert(tr('partnerDetail.gecersizQr'), tr('partnerDetail.qrBuFirsataAitDegil'), [
        { text: tr('sosyalMain.tekrarDene'), onPress: () => setQrScanned(false) },
        { text: tr('sosyalMain.kapat'), onPress: () => { setQrScanVisible(false); setQrScanned(false); } },
      ]);
      return;
    }

    setQrScanVisible(false);
    setRedeemLoading(true);
    try {
      const { data, error } = await supabase.rpc('redeem_firsat_qr', { p_qr_token: match[1] });
      const result = Array.isArray(data) ? data[0] : data;
      if (error || !result) throw error || new Error('no result');

      if (result.basarili) {
        setIsRedeemed(true);
        AppAlert.alert(tr('sendSnap.basarili'), tr('partnerDetail.firsatKullanildiMesaj'));
      } else if (result.mesaj === 'zaten_kullanildi') {
        setIsRedeemed(true);
        AppAlert.alert(tr('partnerDetail.zatenKullanildiBaslik'), tr('partnerDetail.zatenKullanildiMesaj'));
      } else {
        AppAlert.alert(tr('partnerDetail.gecersizQr'), tr('partnerDetail.qrBuFirsataAitDegil'));
      }
    } catch {
      AppAlert.alert(tr('common.error'), tr('partnerDetail.firsatKullanilamadi'));
    } finally {
      setRedeemLoading(false);
      setQrScanned(false);
    }
  }, [qrScanned, tr]);

  const handleUseOfferPress = useCallback(async () => {
    if (!profile?.userId) {
      AppAlert.alert(tr('common.error'), tr('partnerDetail.firsatKullanmakIcinGirisYap'));
      return;
    }
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) return;
    }
    setQrScanned(false);
    setQrScanVisible(true);
  }, [profile?.userId, cameraPermission, requestCameraPermission, tr]);

  const Icon = getCategoryIcon(partner?.category || '', partner?.title);
  const isFav = isFavoritePartner(partnerId);
  const rawUrl = partner?.externalUrl?.trim();
  const canOpenLink = Boolean(
    rawUrl && rawUrl !== '#' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
  );
  // İndirim yüzdesi varsa çıkar
  const pctMatch = (partner?.offer || partner?.description || '').match(/%\s*(\d+)/);
  const discountNum = pctMatch ? pctMatch[1] : null;

  if (loading && !partner) {
    return (
      <View style={[styles.screen, { backgroundColor: pageBg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={txt1} />
          <Text style={[styles.loadingLabel, { color: txt2 }]}>{tr('partnerDetail.firsatYukleniyor')}</Text>
        </View>
      </View>
    );
  }

  if (!partner) {
    return (
      <View style={[styles.screen, { backgroundColor: pageBg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 8, borderBottomColor: cardBdr }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIconBtn} hitSlop={12}>
            <ChevronLeft color={txt1} size={28} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, { color: txt1 }]}>{tr('partnerDetail.firsatBulunamadi')}</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyCopy, { color: txt2 }]}>
            {tr('partnerDetail.firsatKaldirilmisOlabilir')}
          </Text>
        </View>
      </View>
    );
  }

  const hasImage = Boolean(partner.imageUrl && partner.imageUrl.length > 0);

  return (
    <View style={[styles.screen, { backgroundColor: pageBg }]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 32) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPartner(true)}
            tintColor={txt2}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.hero, { height: HERO_H, marginTop: insets.top + 8, backgroundColor: chipBg }]}>
          {hasImage ? (
            <ImageBackground
              source={{ uri: partner.imageUrl! }}
              style={styles.heroImageBg}
              imageStyle={styles.heroImageRadius}
              resizeMode="cover"
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                style={styles.heroBottomFade}
                pointerEvents="none"
              />
            </ImageBackground>
          ) : (
            <View style={styles.heroIconCenter}>
              <View style={[styles.heroIconRing, { backgroundColor: cardBg, borderColor: cardBdr }]}>
                <Icon color={txt1} size={46} strokeWidth={1.8} />
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backFab, { top: 14, left: 18, backgroundColor: t.cardBg }]}
            activeOpacity={0.88}
            hitSlop={8}
          >
            <ChevronLeft color="#111114" size={26} strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleFavorite('partner', partnerId)}
            style={[styles.backFab, { top: 14, right: 18, backgroundColor: t.cardBg }]}
            activeOpacity={0.88}
            hitSlop={8}
          >
            <Heart color="#111114" fill={isFav ? '#111114' : 'transparent'} size={22} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sheet, { backgroundColor: pageBg, borderRadius: RADIUS }]}>
          <View style={styles.sheetHandleWrap}>
            <View style={[styles.sheetHandle, { backgroundColor: cardBdr }]} />
          </View>

          <Text style={[styles.title, { color: txt1 }]}>{partner.title}</Text>

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <Tag color={amber} size={14} strokeWidth={2.2} />
              <Text style={[styles.chipText, { color: txt1 }]}>{partner.category}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <MapPin color={txt2} size={14} strokeWidth={2.2} />
              <Text style={[styles.chipText, { color: txt1 }]}>Şanlıurfa</Text>
            </View>
          </View>

          {/* İndirim/fırsat vurgusu */}
          {(discountNum || partner.offer) && (
            <View style={[styles.offerCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <View style={[styles.offerIconWrap, { backgroundColor: chipBg }]}>
                <Sparkles color={amber} size={20} strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.offerLabel, { color: txt2 }]}>{tr('partnerDetail.gencKartFirsati')}</Text>
                <Text style={[styles.offerValue, { color: txt1 }]} numberOfLines={2}>
                  {discountNum ? tr('partnerDetail.yuzdeIndirim', { percent: discountNum }) : partner.offer}
                </Text>
              </View>
            </View>
          )}

          {partner.date ? (
            <View style={[styles.infoRow, { backgroundColor: chipBg }]}>
              <Calendar color={txt2} size={18} strokeWidth={2} />
              <Text style={[styles.infoText, { color: txt1 }]}>{tr('partnerDetail.gecerlilik')}: {partner.date}</Text>
            </View>
          ) : null}

          <View style={[styles.descCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <Text style={[styles.descLabel, { color: txt2 }]}>{tr('heritageDetail.hakkinda')}</Text>
            <Text style={[styles.description, { color: txt1 }]}>{partner.description}</Text>
          </View>

          {partner.id ? (
            <TouchableOpacity
              style={[
                styles.mapCta,
                { backgroundColor: isRedeemed ? chipBg : amber, borderWidth: isRedeemed ? 1 : 0, borderColor: cardBdr },
              ]}
              activeOpacity={0.88}
              onPress={handleUseOfferPress}
              disabled={isRedeemed || redeemLoading}
            >
              {redeemLoading ? (
                <ActivityIndicator color={isRedeemed ? txt2 : pageBg} size="small" />
              ) : isRedeemed ? (
                <CheckCircle2 color={txt2} size={18} strokeWidth={2.2} />
              ) : (
                <QrCode color={pageBg} size={18} strokeWidth={2.2} />
              )}
              <Text style={[styles.mapCtaText, { color: isRedeemed ? txt2 : pageBg }]}>
                {isRedeemed ? tr('partnerDetail.firsatKullanildi') : tr('partnerDetail.firsatiKullan')}
              </Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.mapCta, { backgroundColor: txt1 }]}
            activeOpacity={0.88}
            onPress={() => openInMaps(partner.title)}
          >
            <Navigation color={pageBg} size={18} strokeWidth={2.2} />
            <Text style={[styles.mapCtaText, { color: pageBg }]}>{tr('heritageDetail.haritadaAc')}</Text>
          </TouchableOpacity>

          {canOpenLink ? (
            <TouchableOpacity
              style={[styles.linkCta, { borderColor: cardBdr, backgroundColor: cardBg }]}
              activeOpacity={0.88}
              onPress={() => {
                const u = partner.externalUrl!.trim();
                Linking.openURL(u).catch(() => {});
              }}
            >
              <ExternalLink color={txt1} size={18} strokeWidth={2} />
              <Text style={[styles.linkCtaText, { color: txt1 }]}>{tr('partnerDetail.webSitesiniAc')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={qrScanVisible}
        animationType="slide"
        onRequestClose={() => { setQrScanVisible(false); setQrScanned(false); }}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {cameraPermission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={qrScanned ? undefined : handleQrScanned}
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
              <QrCode color="#fff" size={40} strokeWidth={2} />
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
                {tr('sosyalMain.kameraIzniGerekiyor')}
              </Text>
              <TouchableOpacity onPress={requestCameraPermission} style={{ backgroundColor: amber, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 }}>
                <Text style={{ color: pageBg, fontWeight: '800' }}>{tr('sosyalMain.izinVer')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ position: 'absolute', top: insets.top + 12, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
              {tr('partnerDetail.isletmeQrOkut')}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => { setQrScanVisible(false); setQrScanned(false); }}
            style={{
              position: 'absolute',
              top: insets.top + 12,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  loadingLabel: { marginTop: 14, fontFamily: FontFamily.medium, fontSize: 15 },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backIconBtn: { marginRight: 4, padding: 4 },
  simpleHeaderTitle: { fontFamily: FontFamily.semiBold, fontSize: 18 },
  emptyBody: { flex: 1, justifyContent: 'center', padding: 32 },
  emptyCopy: { fontFamily: FontFamily.medium, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  hero: {
    width: HERO_W,
    alignSelf: 'center',
    position: 'relative',
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  heroImageBg: {
    width: '100%',
    height: '100%',
  },
  heroImageRadius: {
    borderRadius: RADIUS,
  },
  heroIconCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroIconRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBottomFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  backFab: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...cardOuterShadow,
  },
  sheet: {
    marginTop: -RADIUS,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandleWrap: { alignItems: 'center', marginBottom: 14 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2 },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    letterSpacing: -0.4,
    lineHeight: 30,
    marginBottom: 12,
  },
  chipRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  chipText: { fontFamily: FontFamily.semiBold, fontSize: 13, letterSpacing: -0.1 },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  offerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  offerValue: { fontFamily: FontFamily.semiBold, fontSize: 17, letterSpacing: -0.3 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderRadius: 14,
  },
  infoText: { flex: 1, fontFamily: FontFamily.medium, fontSize: 14 },
  descCard: { borderRadius: 18, padding: 18, marginBottom: 18 },
  descLabel: {
    fontFamily: FontFamily.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  description: { fontFamily: FontFamily.regular, fontSize: 15, lineHeight: 24 },
  mapCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  mapCtaText: { fontFamily: FontFamily.semiBold, fontSize: 15, letterSpacing: -0.2 },
  linkCta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
  },
  linkCtaText: { fontFamily: FontFamily.semiBold, fontSize: 15, letterSpacing: -0.2 },
});

export default PartnerDetailScreen;
