import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Modal, Platform, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar, BookOpen, Search, X, ChevronLeft, ChevronRight, Sparkles,
  CloudRain, Sun, Cloud, CloudSnow, CloudLightning, CloudDrizzle,
  Tag, Coffee, Shirt, Smartphone, Ticket, GraduationCap, Gift, Bell,
  Pill, Library, Route, Radio, MapPin, ArrowUpRight,
  Scissors, Dumbbell, Film, UtensilsCrossed, ShoppingBag, Stethoscope, Cake, Glasses,
} from 'lucide-react-native';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Skeleton from '@/components/Skeleton';
import { MOCK_BUSES, MOCK_MAGAZINES } from '@/api/mockData';
import { localizeHeritageItem, CURATED_LANDMARK_TRANSLATIONS } from '@/data/mockLocalization';
import { HomeScreenProps, MainTabParamList } from '@/types/navigation';
import { useAppTheme } from '@/theme/useAppTheme';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { pickLocalized } from '@/lib/localizeContent';
import { Clean } from '@/constants/Colors';
import { Editorial } from '@/theme/colors';
import { cardOuterShadow } from '@/constants/Shadows';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import Svg, { Path } from 'react-native-svg';
import { buildWeatherUrl, toOwmCurrent, toOwmForecast } from '@/utils/weather';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FirsatData { id:number; baslik:string; aciklama:string; tarih?:string; kategori:string; resim_url?:string; }
interface CalendarEventItem { id:string; title:string; date:string; location:string; category:string; }

// ─── Static data ──────────────────────────────────────────────────────────────

// Elle düzenlenmiş, daha zengin metinli 4 öne çıkan yer
const CURATED_LANDMARK_META: Record<string, { year: string; desc: string; tag: string }> = {
  m1: { year: '~12.000 YIL ÖNCE', desc: "Dünyanın bilinen en eski tapınak kompleksi. İnsanlık tarihini yeniden yazan keşif.", tag: 'UNESCO Dünya Mirası' },
  m2: { year: 'HZ. İBRAHİM', desc: "Kutsal balıkların yaşadığı göl. Şanlıurfa'nın kalbinde binlerce yıllık inanç merkezi.", tag: 'Kutsal Alan' },
  m4: { year: 'M.Ö. 3000', desc: "Dünyanın hâlâ yaşayan en eski yerleşim yerlerinden biri. Koni evleriyle özgün mimari.", tag: 'Tarihi Kent' },
  m3: { year: 'M.Ö. 3. YÜZYIL', desc: "Şehre hâkim tarihi kale. Sütunlarından Balıklıgöl'ün panoramik manzarası.", tag: 'Tarihi Yapı' },
};

const LANDMARK_CATEGORY_LABEL: Record<string, string> = {
  historic: 'Tarihi Yer',
  faith: 'İnanç ve Kültür',
  nature: 'Doğa & Manzara',
  museum: 'Müze',
  bazaar: 'Tarihi Çarşı',
};

const getLandmarks = (lang: string) =>
  MOCK_MAGAZINES.map((raw) => {
    const m = localizeHeritageItem(raw, lang);
    const curated = lang === 'tr' ? CURATED_LANDMARK_META[m.id] : CURATED_LANDMARK_TRANSLATIONS[lang]?.[m.id];
    return {
      id: m.id,
      name: m.title,
      year: curated?.year ?? '',
      desc: curated?.desc ?? (m.description ?? ''),
      tag: curated?.tag ?? (LANDMARK_CATEGORY_LABEL[m.category ?? 'historic'] ?? 'Keşfet'),
      image: m.image,
    };
  });

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
// Editoryal, sıcak-krem "The Lunch Box" ilham temasında büyük başlıklar için serif — yeni font indirmeden, sistem serif'i
const SERIF = Platform.select<string>({ ios: 'Georgia', android: 'serif', default: 'serif' });
const DAYS   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];

const SPECIAL_DAYS: Record<string,{name:string;emoji:string;color:string;type:string}> = {
  '1-1': {name:'Yılbaşı',emoji:'🎉',color:'#f59e0b',type:'holiday'},
  '4-23':{name:'Ulusal Egemenlik ve Çocuk Bayramı',emoji:'🇹🇷',color:'#ef4444',type:'holiday'},
  '5-1': {name:'Emek ve Dayanışma Günü',emoji:'💪',color:'#ef4444',type:'holiday'},
  '5-19':{name:"Atatürk'ü Anma, Gençlik ve Spor Bayramı",emoji:'🏃',color:'#ef4444',type:'holiday'},
  '7-15':{name:'Demokrasi ve Milli Birlik Günü',emoji:'🕊️',color:'#ef4444',type:'holiday'},
  '8-30':{name:'Zafer Bayramı',emoji:'🏆',color:'#ef4444',type:'holiday'},
  '10-29':{name:'Cumhuriyet Bayramı',emoji:'🇹🇷',color:'#ef4444',type:'holiday'},
  '3-18':{name:'Çanakkale Zaferi',emoji:'⭐',color:'#dc2626',type:'memorial'},
  '11-10':{name:"Atatürk'ü Anma Günü",emoji:'🖤',color:'#1f2937',type:'memorial'},
  '2-14':{name:'Sevgililer Günü',emoji:'❤️',color:'#ec4899',type:'special'},
  '3-8': {name:'Dünya Kadınlar Günü',emoji:'👩',color:'#a855f7',type:'special'},
  '3-21':{name:'Nevruz',emoji:'🌸',color:'#22c55e',type:'special'},
  '11-24':{name:'Öğretmenler Günü',emoji:'📚',color:'#6366f1',type:'special'},
  '12-31':{name:'Yılbaşı Gecesi',emoji:'🎊',color:'#f59e0b',type:'special'},
  '2-19':{name:'Ramazan Başlangıcı',emoji:'🌙',color:'#10b981',type:'special'},
  '3-20':{name:'Ramazan Bayramı 1. Gün',emoji:'🍬',color:'#10b981',type:'holiday'},
  '3-22':{name:'Ramazan Bayramı 3. Gün',emoji:'🍬',color:'#10b981',type:'holiday'},
  '5-27':{name:'Kurban Bayramı 1. Gün',emoji:'🐑',color:'#10b981',type:'holiday'},
  '5-28':{name:'Kurban Bayramı 2. Gün',emoji:'🐑',color:'#10b981',type:'holiday'},
  '5-29':{name:'Kurban Bayramı 3. Gün',emoji:'🐑',color:'#10b981',type:'holiday'},
  '5-30':{name:'Kurban Bayramı 4. Gün',emoji:'🐑',color:'#10b981',type:'holiday'},
};

/**
 * Gerçek bilet siluetini çizen path — yarım daire çentikler kartın
 * kendi şeklinden kesiliyor (renk taklidi değil), bu yüzden arkasında
 * ne olursa olsun (gölge, sayfa zemini) doğru şekilde görünür.
 */
const buildTicketPath = (w: number, h: number, r: number, notchY: number, nr: number) => [
  `M ${r} 0`,
  `L ${w - r} 0`,
  `Q ${w} 0 ${w} ${r}`,
  `L ${w} ${notchY - nr}`,
  `A ${nr} ${nr} 0 0 0 ${w} ${notchY + nr}`,
  `L ${w} ${h - r}`,
  `Q ${w} ${h} ${w - r} ${h}`,
  `L ${r} ${h}`,
  `Q 0 ${h} 0 ${h - r}`,
  `L 0 ${notchY + nr}`,
  `A ${nr} ${nr} 0 0 0 0 ${notchY - nr}`,
  `L 0 ${r}`,
  `Q 0 0 ${r} 0`,
  `Z`,
].join(' ');

const TICKET_RADIUS = 16;
const TICKET_NOTCH_RADIUS = 8;
const PROMO_LAST_SEEN_OFFER_ID_KEY = 'home_promo_last_seen_offer_id_v1';

/** Keşfet paletinin soft pastelleri — ticket gövdesi */
const DEAL_ACCENTS = ['#F6E4EA', '#ECF3D8', '#F8F0D0', '#D8F0F0'] as const;

/** Genç Kart fırsat kartı — gerçek bilet siluetiyle (SVG kesik) */
function FirsatTicketCard({
  p, th, Icon, discountNum, onPress, ctaBg, ctaTxt, isDark, accent,
}: {
  p: FirsatData; th: any; Icon: any; discountNum: string | null; onPress: () => void;
  ctaBg: string; ctaTxt: string; isDark: boolean;
  accent: string;
}) {
  const [size, setSize] = useState({ width: 128, height: 148 });
  const [notchY, setNotchY] = useState(74);
  const { t: tr } = useTranslation();
  // Pastel gövde üzerinde koyu ink; dark mode'da da okunabilir kalsın
  const ink = '#111114';
  const inkMuted = 'rgba(17,17,20,0.62)';

  return (
    <View
      style={{ marginRight: 12, borderRadius: TICKET_RADIUS, backgroundColor: 'transparent' }}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
        <Path
          d={buildTicketPath(size.width, size.height, TICKET_RADIUS, notchY, TICKET_NOTCH_RADIUS)}
          fill={accent}
          stroke={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(17,17,20,0.35)'}
          strokeWidth={1}
        />
      </Svg>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: size.width }}>
        <View style={[s.pCard, { backgroundColor: 'transparent', marginRight: 0, borderRadius: TICKET_RADIUS }]}>
          {/* ÜST: indirim kahraman — ortalı */}
          <View style={s.pHero}>
            <View style={[s.pIconWrap,{backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: 'rgba(17,17,20,0.18)'}]}>
              <Icon color={ink} size={20} strokeWidth={2} />
            </View>
            {discountNum ? (
              <>
                <Text style={[s.pBigPct,{color:ink}]}>%{discountNum}</Text>
                <Text style={[s.pBigLabel,{color:inkMuted}]}>{tr('home.indirim')}</Text>
              </>
            ):(
              <Text style={[s.pOfferText,{color:ink}]} numberOfLines={2}>{p.aciklama || 'Fırsat'}</Text>
            )}
          </View>

          {/* Kesik çizgi — gerçek çentik artık kartın kendi siluetinde */}
          <View style={s.pTearRow} onLayout={(e) => setNotchY(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)}>
            <View style={s.pDashRow}>
              {Array.from({length:10}).map((_,di)=>(
                <View key={di} style={[s.pDashSeg,{backgroundColor: 'rgba(17,17,20,0.28)'}]}/>
              ))}
            </View>
          </View>

          {/* ALT: marka + kategori + CTA — ortalı */}
          <Text style={[s.pName,{color:ink}]} numberOfLines={1}>{p.baslik}</Text>
          <Text style={[s.pKat,{color:inkMuted}]} numberOfLines={1}>{p.kategori}</Text>
          <View style={[s.pCta,{backgroundColor:ctaBg}]}>
            <Text style={[s.pCtaTxt,{color:ctaTxt}]}>{tr('home.kuponuKullan')}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const cardShadowForTicket = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const { t: tr, i18n } = useTranslation();
  const { profile, isGuest } = useUser();
  const homeTheme = useAppTheme();
  const isDark = homeTheme.isDark;

  const [promoModalVisible,setPromoModalVisible]           = useState(false);
  const [promoOffer,setPromoOffer]                         = useState<{ baslik: string; aciklama: string; kategori: string } | null>(null);
  const [newOfferToastVisible, setNewOfferToastVisible]    = useState(false);
  const [promoSize,setPromoSize]                           = useState({width:300,height:220});
  const [promoNotchY,setPromoNotchY]                       = useState(110);
  const [calendarVisible,setCalendarVisible]               = useState(false);
  const [calendarView,setCalendarView]                     = useState<'month'|'year'>('month');
  const [selectedDate,setSelectedDate]                     = useState(new Date());
  const [selectedDay,setSelectedDay]                       = useState<{day:number;specialDay:any;events:any[]}|null>(null);
  const [guestModalVisible,setGuestModalVisible]           = useState(false);
  const [gencDealsVisible,setGencDealsVisible]             = useState(false);
  const [firsatlar,setFirsatlar]                           = useState<FirsatData[]>([]);
  const [calendarEvents,setCalendarEvents]                 = useState<CalendarEventItem[]>([]);
  const [loadingFirsatlar,setLoadingFirsatlar]             = useState(true);
  const [refreshing,setRefreshing]                         = useState(false);
  const [weatherData,setWeatherData]                       = useState<any>(null);
  const [forecastData,setForecastData]                     = useState<any>(null);
  const [airQualityData,setAirQualityData]                 = useState<any>(null);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAllWeatherData(); fetchCalendarEvents();
  }, []);

  useEffect(() => {
    fetchFirsatlar();
  }, [i18n.language]);

  useEffect(() => {
    if (!newOfferToastVisible) return;
    const timer = setTimeout(() => setNewOfferToastVisible(false), 3200);
    return () => clearTimeout(timer);
  }, [newOfferToastVisible]);

  // Zil ikonundaki rozet — ŞanlıSosyal'den gelen okunmamış mesajlar + bekleyen arkadaşlık istekleri.
  // Ana sayfaya her dönüldüğünde (örn. mesaj gönderip geri gelince) tazelenir.
  const fetchUnreadCount = async () => {
    if (!profile?.userId) { setUnreadCount(0); return; }
    try {
      const { data: cp } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', profile.userId);
      const conversationIds = (cp ?? []).map((row: any) => row.conversation_id);

      let unreadMessages = 0;
      if (conversationIds.length > 0) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', profile.userId)
          .eq('is_read', false);
        unreadMessages = count || 0;
      }

      const { count: pendingRequests } = await supabase
        .from('friendships')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', profile.userId)
        .eq('status', 'pending');

      setUnreadCount(unreadMessages + (pendingRequests || 0));
    } catch (e) {
      if (__DEV__) console.log(e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadCount();
    }, [profile?.userId])
  );

  const fetchFirsatlar = async () => {
    try {
      const {data} = await supabase.from('firsatlar').select('*').order('created_at',{ascending:false});
      if (data) {
        const localized = data.map((row: any) => ({
          ...row,
          baslik: pickLocalized(row, 'baslik', i18n.language),
          aciklama: pickLocalized(row, 'aciklama', i18n.language),
        }));
        setFirsatlar(localized);
        const latestOffer = data[0];
        if (latestOffer?.id != null) {
          const latestId = String(latestOffer.id);
          const lastSeenId = await AsyncStorage.getItem(PROMO_LAST_SEEN_OFFER_ID_KEY);
          if (lastSeenId == null) {
            // İlk kurulumda mevcut fırsatı "görülmüş" kabul et; sadece yeni girilende göster.
            await AsyncStorage.setItem(PROMO_LAST_SEEN_OFFER_ID_KEY, latestId);
          } else if (lastSeenId !== latestId) {
            setPromoOffer({
              baslik: pickLocalized(latestOffer, 'baslik', i18n.language) || latestOffer.baslik || '',
              aciklama: pickLocalized(latestOffer, 'aciklama', i18n.language) || latestOffer.aciklama || '',
              kategori: latestOffer.kategori || '',
            });
            setPromoModalVisible(true);
            setNewOfferToastVisible(true);
            await AsyncStorage.setItem(PROMO_LAST_SEEN_OFFER_ID_KEY, latestId);
          }
        }
      }
    } catch(e){if (__DEV__) console.log(e);} finally {setLoadingFirsatlar(false);}
  };
  const fetchCalendarEvents = async () => {
    try {
      const {data} = await supabase.from('etkinlikler').select('id,baslik,tarih,konum,kategori').order('created_at',{ascending:false});
      setCalendarEvents((data||[]).map((i:any)=>({id:i.id?.toString()||'',title:i.baslik||'Etkinlik',date:i.tarih||'',location:i.konum||'',category:i.kategori||'Etkinlik'})));
    } catch(e){if (__DEV__) console.log(e);}
  };
  const fetchAllWeatherData = async () => {
    try {
      const res = await fetch(buildWeatherUrl());
      const om = await res.json();
      if (om?.current) {
        setWeatherData(toOwmCurrent(om, 'Şanlıurfa'));
        setForecastData(toOwmForecast(om));
      }
    } catch(e){if (__DEV__) console.log(e);}
  };
  const onRefresh = async () => {
    setRefreshing(true); setLoadingFirsatlar(true);
    await Promise.all([fetchAllWeatherData(), fetchFirsatlar(), fetchCalendarEvents()]);
    setRefreshing(false);
  };

  const getWeatherIcon = (sz=20,col='#FCD34D') => {
    if (!weatherData?.weather?.[0]) return <Cloud color={col} size={sz}/>;
    const id=weatherData.weather[0].id;
    if(id===800) return <Sun color={col} size={sz}/>;
    if(id>=200&&id<300) return <CloudLightning color={col} size={sz}/>;
    if(id>=300&&id<500) return <CloudDrizzle color={col} size={sz}/>;
    if(id>=500&&id<600) return <CloudRain color={col} size={sz}/>;
    if(id>=600&&id<700) return <CloudSnow color={col} size={sz}/>;
    return <Cloud color={col} size={sz}/>;
  };

  const parseDate = (raw:string) => {
    if(!raw) return null;
    const v=raw.trim();
    const m1=v.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if(m1){const d=+m1[1],mo=+m1[2],y=+m1[3];if(d>=1&&d<=31&&mo>=1&&mo<=12)return{day:d,month:mo,year:y};}
    const m2=v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(m2){const y=+m2[1],mo=+m2[2],d=+m2[3];if(d>=1&&d<=31&&mo>=1&&mo<=12)return{day:d,month:mo,year:y};}
    return null;
  };
  const getDayContent=(day:number,month:number)=>{
    const key=`${month+1}-${day}`;
    const specialDay=SPECIAL_DAYS[key]||null;
    const dailyEvents=calendarEvents.filter(e=>{
      const p=parseDate(e.date);if(!p)return false;
      if(p.day!==day||p.month!==month+1)return false;
      return p.year?p.year===selectedDate.getFullYear():true;
    });
    return {specialDay,dailyEvents};
  };
  const getDaysInMonth=(date:Date)=>{
    const y=date.getFullYear(),m=date.getMonth();
    const first=new Date(y,m,1);let start=first.getDay()-1;if(start<0)start=6;
    const total=new Date(y,m+1,0).getDate();
    const days:(number|null)[]=[];
    for(let i=0;i<start;i++)days.push(null);
    for(let i=1;i<=total;i++)days.push(i);
    return days;
  };
  const getCategoryTheme=(k:string|null|undefined,name?:string|null)=>{
    const base={icon:Gift,color:'#fb923c',bg:'#ffedd5',bgDark:'#3a2a1c',grad:['#fb923c','#ea580c'] as [string,string]};
    // Önce mekan adına göre daha spesifik ikon seç — böylece aynı kategoride bile farklı ikon çıkar
    const nm=(name||'').trim().toLowerCase();
    if(nm){
      if(nm.includes('kahve')||nm.includes('kafe')||nm.includes('mırra')||nm.includes('çay')||nm.includes('coffee'))return{...base,icon:Coffee};
      if(nm.includes('restoran')||nm.includes('lokanta')||nm.includes('kebap')||nm.includes('mutfak')||nm.includes('yemek')||nm.includes('pizza')||nm.includes('burger'))return{...base,icon:UtensilsCrossed};
      if(nm.includes('pastane')||nm.includes('tatlı')||nm.includes('fırın')||nm.includes('börek')||nm.includes('dondurma'))return{...base,icon:Cake};
      if(nm.includes('kuaför')||nm.includes('berber')||nm.includes('saç')||nm.includes('güzellik'))return{...base,icon:Scissors};
      if(nm.includes('spor')||nm.includes('gym')||nm.includes('fitness'))return{...base,icon:Dumbbell};
      if(nm.includes('sinema')||nm.includes('film'))return{...base,icon:Film};
      if(nm.includes('kitap')||nm.includes('kırtasiye'))return{...base,icon:BookOpen};
      if(nm.includes('optik')||nm.includes('gözlük'))return{...base,icon:Glasses};
      if(nm.includes('eczane')||nm.includes('sağlık')||nm.includes('diş')||nm.includes('klinik'))return{...base,icon:Stethoscope};
      if(nm.includes('giyim')||nm.includes('mağaza')||nm.includes('moda')||nm.includes('butik'))return{...base,icon:ShoppingBag};
      if(nm.includes('teknoloji')||nm.includes('telefon')||nm.includes('bilgisayar'))return{...base,icon:Smartphone};
    }
    if(!k)return base;
    const n=k.trim().toLowerCase();
    if(n.includes('yiyecek')||n.includes('içecek'))return{icon:Coffee,color:'#fb923c',bg:'#ffedd5',bgDark:'#3a2a1c',grad:['#fb923c','#ea580c'] as [string,string]};
    if(n.includes('giyim'))return{icon:Shirt,color:'#a78bfa',bg:'#ede9fe',bgDark:'#2e2642',grad:['#a78bfa','#7c3aed'] as [string,string]};
    if(n.includes('teknoloji'))return{icon:Smartphone,color:'#60a5fa',bg:'#dbeafe',bgDark:'#1e2f45',grad:['#60a5fa','#2563eb'] as [string,string]};
    if(n.includes('etkinlik')||n.includes('bilet'))return{icon:Ticket,color:'#f87171',bg:'#fee2e2',bgDark:'#3d2226',grad:['#f87171','#dc2626'] as [string,string]};
    if(n.includes('öğrenci')||n.includes('özel'))return{icon:GraduationCap,color:'#4ade80',bg:'#dcfce7',bgDark:'#1c3328',grad:['#4ade80','#16a34a'] as [string,string]};
    if(n.includes('indirim'))return{icon:Tag,color:'#fb7185',bg:'#ffe4e6',bgDark:'#3a2428',grad:['#fb7185','#e11d48'] as [string,string]};
    if(n.includes('kampanya'))return{icon:Bell,color:'#fbbf24',bg:'#fef3c7',bgDark:'#3d3420',grad:['#fbbf24','#d97706'] as [string,string]};
    return{icon:Gift,color:'#fb923c',bg:'#ffedd5',bgDark:'#3a2a1c',grad:['#fb923c','#ea580c'] as [string,string]};
  };

  const getDealDisplay = (p: FirsatData) => {
    const discountRaw = p.aciklama?.match(/% ?([\d]+)/)?.[1] ?? p.baslik?.match(/% ?([\d]+)/)?.[1];
    const cleanText = (value?: string | null) => {
      const text = (value || '').trim();
      const normalized = text.toLocaleLowerCase('tr-TR');
      if (!text) return '';
      if (['fırsat', 'yeni fırsat', 'kampanya', 'yeni kampanya', 'indirim'].includes(normalized)) return '';
      return text;
    };
    return {
      discountText: discountRaw ? `%${discountRaw}` : null,
      detailText: cleanText(p.aciklama) || cleanText(p.kategori) || 'Detayları gör',
    };
  };

  const changeMonth=(d:number)=>{const n=new Date(selectedDate);n.setMonth(n.getMonth()+d);setSelectedDate(n);};
  const changeYear =(d:number)=>{const n=new Date(selectedDate);n.setFullYear(n.getFullYear()+d);setSelectedDate(n);};
  const handleSosyalPress=()=>{if(isGuest){setGuestModalVisible(true);return;}navigation.navigate('Sosyal');};
  const handleGuestLogin=()=>{
    setGuestModalVisible(false);
    const p=navigation.getParent<any>();
    if(p){p.navigate('Login');return;}
    navigation.dispatch(CommonActions.reset({index:0,routes:[{name:'Login' as never}]}));
  };

  const insets   = useSafeAreaInsets();
  const today    = new Date();
  const todayStr = `${today.getDate()} ${MONTHS[today.getMonth()]}`;
  const tempStr  = weatherData?.main?.temp!=null?`${Math.round(weatherData.main.temp)}°C`:'--°C';
  // Bugünkü gerçek etkinlikler — "Recent activities" tarzı liste için (Ofspace dashboard esintili)
  const todaysEvents = calendarEvents.filter(e=>{
    const p = parseDate(e.date);
    if (!p) return false;
    return p.day===today.getDate() && p.month===today.getMonth()+1 && (p.year?p.year===today.getFullYear():true);
  });
  const landmarks = React.useMemo(() => getLandmarks(i18n.language), [i18n.language]);
  const lunchBoxPicks = [landmarks[0], landmarks[1]].filter(Boolean);
  const amber    = Clean.accent;
  const gold     = Clean.accent;

  // Light (Clean, mono) / dark (Editorial, toprak tonu) tema kısayolları
  const { pageBg, cardBg, cardBdr, txt1, txt2, ctaBg, ctaTxt, chipBg } = homeTheme;

  return (
    <View style={[s.root,{backgroundColor:pageBg}]}>


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.lunchScroll,{paddingTop:insets.top + 8}]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={amber} colors={[amber]}/>}
      >
        <View style={[s.lunchTopBar,{borderColor:cardBdr}]}>
          <View style={{flex:1}}>
            <Text style={[s.lunchDate,{color:txt2}]}>ŞANLIGENÇ · {DAYS[(today.getDay()+6)%7].toUpperCase()} · {todayStr.toUpperCase()}</Text>
            <Text style={[s.lunchHello,{color:txt1}]} numberOfLines={1}>{tr('home.hello', { name: profile?.name || tr('home.defaultName') })}</Text>
          </View>
          <View style={s.lunchTopActions}>
            <TouchableOpacity style={[s.lunchAvatar,{backgroundColor:ctaBg}]} onPress={()=>navigation.navigate('Main',{screen:'Profile' as keyof MainTabParamList})} activeOpacity={0.8}>
              {profile?.avatarUrl ? (
                <Image source={{uri:profile.avatarUrl}} style={{width:38,height:38,borderRadius:19}}/>
              ) : (
                <Text style={[s.heroCleanAvatarTxt,{color:ctaTxt}]}>{(profile?.name||'Ş').charAt(0).toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={[s.lunchInfoRow,{borderColor:cardBdr}]}>
          <TouchableOpacity
            style={s.lunchInfoPill}
            onPress={()=>navigation.navigate('WeatherDetail',{weatherData:weatherData||undefined,forecastData:forecastData||undefined,airQualityData:airQualityData||undefined})}
            activeOpacity={0.82}
          >
            {getWeatherIcon(16,txt1)}
            <Text style={[s.lunchInfoText,{color:txt1}]}>{tempStr}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.lunchInfoPill}
            onPress={()=>setCalendarVisible(true)}
            activeOpacity={0.82}
          >
            <Calendar color={txt1} size={15} strokeWidth={2}/>
            <Text style={[s.lunchInfoText,{color:txt1}]}>{todayStr}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.88} onPress={handleSosyalPress} style={[s.lunchSocialCard,{backgroundColor:ctaBg, borderColor:cardBdr}]}>
          <View style={s.sosyalLeft}>
            <View style={s.sosyalLiveBadge}>
              <View style={[s.sosyalLiveDot,{backgroundColor:'#22C55E'}]}/>
              <Text style={[s.sosyalLiveTxt,{color:ctaTxt}]}>{tr('home.live')}</Text>
            </View>
            <Text style={[s.sosyalTitle,{color:ctaTxt}]}>{tr('home.sanliSosyal')}</Text>
            <Text style={[s.sosyalSub,{color:ctaTxt, opacity:0.62}]}>{tr('home.sanliSosyalSub')}</Text>
          </View>
          <LottieView source={require('@/assets/images/friends.json')} autoPlay loop resizeMode="contain" style={s.sosyalLottie}/>
        </TouchableOpacity>

        <View style={s.lunchSection}>
          <View style={s.lunchSectionHead}>
            <Text style={[s.lunchSectionTitle,{color:txt1}]}>{tr('home.discover')}</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('Magazine')} activeOpacity={0.7}>
              <Text style={[s.secMore,{color:txt1}]}>{tr('common.seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.lunchMealCard,{backgroundColor:cardBg,borderColor:cardBdr}]}>
            {lunchBoxPicks.map((item,i)=>(
              <TouchableOpacity key={item.id} activeOpacity={0.86} onPress={()=>navigation.push('HeritageDetail',{id:item.id})} style={[s.lunchMealRow, i===lunchBoxPicks.length-1 && {borderBottomWidth:0}]}>
                <View style={{flex:1}}>
                  <Text style={[s.lunchMealTitle,{color:txt1}]} numberOfLines={1}>{item.name}</Text>
                  <View style={s.lunchMealMetaRow}>
                    <View style={[s.lunchMealDot,{backgroundColor:'#ECA7B6'}]}/>
                    <View style={[s.lunchMealDot,{backgroundColor:'#BEDB7A'}]}/>
                    <View style={[s.lunchMealDot,{backgroundColor:'#F2C84B'}]}/>
                    <Text style={[s.lunchMealMeta,{color:txt2}]} numberOfLines={1}>{item.tag}</Text>
                  </View>
                </View>
                <Image source={typeof item.image === 'string' ? { uri: item.image as string } : item.image} style={s.lunchMealThumb} resizeMode="cover"/>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={()=>navigation.navigate('Assistant')}
            style={[s.assistantBanner,{backgroundColor:ctaBg}]}
          >
            <View style={s.assistantBannerLeft}>
              <Sparkles color={ctaTxt} size={20} strokeWidth={2}/>
              <View style={{flex:1}}>
                <Text style={[s.assistantBannerTitle,{color:ctaTxt}]}>{tr('home.sanliAsistan')}</Text>
                <Text style={[s.assistantBannerSub,{color:ctaTxt,opacity:0.6}]}>{tr('home.sanliAsistanSub')}</Text>
              </View>
            </View>
            <Text style={{color:ctaTxt,fontSize:16}}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={s.lunchSection}>
          <View style={s.lunchSectionHead}>
            <Text style={[s.lunchSectionTitle,{color:txt1}]}>{tr('home.gencKartFirsatlari')}</Text>
            <TouchableOpacity
              onPress={()=>navigation.navigate('Main',{screen:'GencKart' as keyof MainTabParamList})}
              activeOpacity={0.7}
            >
              <Text style={[s.secMore,{color:txt1}]}>{tr('home.firsatlariKesfet')}</Text>
            </TouchableOpacity>
          </View>
          {newOfferToastVisible && (
            <View style={[s.newOfferToast, { backgroundColor: chipBg, borderColor: cardBdr }]}>
              <Sparkles color={txt1} size={14} strokeWidth={2} />
              <Text style={[s.newOfferToastText, { color: txt1 }]}>Yeni Genç Kart fırsatı eklendi</Text>
            </View>
          )}
          {loadingFirsatlar ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dealScroll}>
              {[1,2,3].map(i=>(
                <View key={i} style={[s.dealScrollCard,{backgroundColor:cardBg,borderColor:cardBdr}]}>
                  <Skeleton width="100%" height={80} borderRadius={14} isDark={isDark}/>
                </View>
              ))}
            </ScrollView>
          ) : firsatlar.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dealScroll} snapToInterval={140} decelerationRate="fast">
              {firsatlar.map((p, idx)=>{
                const th=getCategoryTheme(p.kategori,p.baslik);const Icon=th.icon;
                const discountRaw = p.aciklama?.match(/%([\d]+)/)?.[1] ?? null;
                return (
                  <FirsatTicketCard
                    key={p.id}
                    p={p}
                    th={th}
                    Icon={Icon}
                    discountNum={discountRaw}
                    onPress={()=>navigation.navigate('PartnerDetail',{partnerId:p.id.toString()})}
                    ctaBg={ctaBg}
                    ctaTxt={ctaTxt}
                    isDark={isDark}
                    accent={DEAL_ACCENTS[idx % DEAL_ACCENTS.length]}
                  />
                );
              })}
            </ScrollView>
          ) : (
            <TouchableOpacity activeOpacity={0.86} onPress={()=>navigation.navigate('Main',{screen:'GencKart' as keyof MainTabParamList})} style={[s.gencDealEmpty,{backgroundColor:cardBg,borderColor:cardBdr}]}>
              <Gift color={amber} size={20}/>
              <Text style={[s.emptyTitle,{color:txt1}]}>{tr('home.gencKartFirsatlariYakinda')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {todaysEvents.length > 0 && (
          <View style={s.lunchSection}>
            <View style={s.lunchSectionHead}>
              <Text style={[s.lunchSectionTitle,{color:txt1}]}>{tr('home.bugunNelerVar')}</Text>
              <TouchableOpacity onPress={()=>setCalendarVisible(true)} activeOpacity={0.7}>
                <Text style={[s.secMore,{color:txt1}]}>{tr('home.takvim')}</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.lunchMealCard,{backgroundColor:cardBg,borderColor:cardBdr}]}>
              {todaysEvents.slice(0,3).map((ev,i)=>(
                <TouchableOpacity key={ev.id} activeOpacity={0.85} onPress={()=>{setCalendarVisible(false);navigation.navigate('Events');}} style={[s.lunchEventRow, i===Math.min(todaysEvents.length,3)-1 && {borderBottomWidth:0}]}>
                  <View style={[s.lunchEventIcon,{backgroundColor:chipBg}]}>
                    <Calendar color={txt1} size={15} strokeWidth={2}/>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={[s.activityTitle,{color:txt1}]} numberOfLines={1}>{ev.title}</Text>
                    <Text style={[s.activitySub,{color:txt2}]} numberOfLines={1}>{ev.location || ev.category}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}


      </ScrollView>

      {/* ═══════════════════════════════════════
          MODALS — aynı
      ═══════════════════════════════════════ */}

      {/* Misafir modal */}
      <Modal visible={guestModalVisible} animationType="fade" transparent onRequestClose={()=>setGuestModalVisible(false)}>
        <View style={s.mBack}>
          <View style={[s.mCard,isDark&&{backgroundColor:'#0f172a',borderColor:'rgba(148,163,184,0.2)'}]}>
            <View style={[s.mBadge,isDark?{backgroundColor:'rgba(14,165,233,0.18)',borderColor:'rgba(125,211,252,0.35)'}:{backgroundColor:'rgba(37,99,235,0.1)',borderColor:'rgba(37,99,235,0.18)'}]}>
              <Radio color={isDark?'#7dd3fc':'#2563eb'} size={15}/>
              <Text style={[s.mBadgeTxt,{color:isDark?'#bae6fd':'#1d4ed8'}]}>{tr('home.sanliSosyal')}</Text>
            </View>
            <Text style={[s.mTitle,isDark&&{color:'#f8fafc'}]}>{tr('home.girisYapmanGerekiyor')}</Text>
            <Text style={[s.mSub,isDark&&{color:'#cbd5e1'}]}>ŞanlıSosyal'e erişmek için hesabınla giriş yapman gerekiyor.</Text>
            <View style={s.mRow}>
              <TouchableOpacity style={[s.mSec,isDark&&{backgroundColor:'#1e293b'}]} onPress={()=>setGuestModalVisible(false)}>
                <Text style={[s.mSecTxt,isDark&&{color:'#cbd5e1'}]}>{tr('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mPri,isDark&&{backgroundColor:'#0ea5e9'}]} onPress={handleGuestLogin}>
                <Text style={s.mPriTxt}>{tr('home.girisYap')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Genç Kart fırsatları — Home'u kalabalıklaştırmadan tüm fırsatları gösteren yüzen panel */}
      <Modal visible={gencDealsVisible} animationType="slide" transparent onRequestClose={()=>setGencDealsVisible(false)}>
        <View style={s.gencSheetBack}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={()=>setGencDealsVisible(false)}/>
          <View style={[s.gencSheet,{backgroundColor:cardBg,borderColor:cardBdr}]}>
            <View style={s.gencSheetHandle}/>
            <View style={s.gencSheetHead}>
              <View>
                <Text style={[s.gencSheetEyebrow,{color:txt2}]}>{tr('welcome.gencKart').toUpperCase()}</Text>
                <Text style={[s.gencSheetTitle,{color:txt1}]}>{tr('home.firsatlariKesfetBaslik')}</Text>
              </View>
              <TouchableOpacity style={[s.gencSheetClose,{backgroundColor:chipBg}]} onPress={()=>setGencDealsVisible(false)} activeOpacity={0.8}>
                <X color={txt1} size={18}/>
              </TouchableOpacity>
            </View>

            {loadingFirsatlar ? (
              <View style={{gap:10}}>
                {[1,2,3,4].map(i=>(
                  <View key={i} style={[s.gencSheetDeal,{borderColor:cardBdr}]}>
                    <Skeleton width="100%" height={54} borderRadius={14} isDark={isDark}/>
                  </View>
                ))}
              </View>
            ) : firsatlar.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:18, gap:10}}>
                {firsatlar.map((p)=>{
                  const th=getCategoryTheme(p.kategori,p.baslik);const Icon=th.icon;
                  const { discountText, detailText } = getDealDisplay(p);
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.86}
                      style={[s.gencSheetDeal,{borderColor:cardBdr}]}
                      onPress={()=>{
                        setGencDealsVisible(false);
                        navigation.navigate('PartnerDetail',{partnerId:p.id.toString()});
                      }}
                    >
                      <View style={[s.gencDealIcon,{backgroundColor:chipBg}]}>
                        <Icon color={txt1} size={16} strokeWidth={2}/>
                      </View>
                      <View style={{flex:1}}>
                        <Text style={[s.gencDealTitle,{color:txt1}]} numberOfLines={1}>{p.baslik}</Text>
                        <Text style={[s.gencDealMeta,{color:txt2}]} numberOfLines={1}>{detailText}</Text>
                      </View>
                      {discountText ? (
                        <Text style={[s.gencDealBadge,{color:txt1}]}>{discountText}</Text>
                      ) : (
                        <ArrowUpRight color={txt2} size={16} strokeWidth={2.2}/>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={[s.gencSheetEmpty,{borderColor:cardBdr}]}>
                <Gift color={amber} size={22}/>
                <Text style={[s.emptyTitle,{color:txt1}]}>{tr('home.firsatBulunamadi')}</Text>
                <Text style={[s.emptySub,{color:txt2}]}>{tr('home.yeniFirsatYakinda')}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Promo modal — Genç Kart fırsat kartlarıyla birebir aynı bilet tasarımı */}
      <Modal visible={promoModalVisible} animationType="fade" transparent onRequestClose={()=>setPromoModalVisible(false)}>
        <View style={s.mBack}>
          <View style={{ width: '100%' }}>
            <View
              style={{ width: '100%', borderRadius: TICKET_RADIUS, backgroundColor: 'transparent' }}
              onLayout={(e) => setPromoSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
            >
              <Svg width={promoSize.width} height={promoSize.height} style={StyleSheet.absoluteFill}>
                <Path
                  d={buildTicketPath(promoSize.width, promoSize.height, TICKET_RADIUS, promoNotchY, TICKET_NOTCH_RADIUS)}
                  fill={cardBg}
                  stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,20,1)'}
                  strokeWidth={1.5}
                />
              </Svg>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={()=>{setPromoModalVisible(false);navigation.navigate('Main',{screen:'GencKart' as keyof MainTabParamList});}}
                style={{ width: '100%', backgroundColor: 'transparent', borderRadius: TICKET_RADIUS }}
              >
                <View style={[s.promoAccentBlock,{backgroundColor: isDark?'rgba(242,96,12,0.12)':'rgba(242,96,12,0.07)', borderTopLeftRadius:TICKET_RADIUS, borderTopRightRadius:TICKET_RADIUS}]}>
                  <View style={s.promoTopRow}>
                    <View style={[s.promoIconCircle,{backgroundColor:isDark?'rgba(242,96,12,0.18)':'#fff'}]}>
                      {(() => { const PromoIcon = getCategoryTheme(promoOffer?.kategori, promoOffer?.baslik).icon; return <PromoIcon color={amber} size={20}/>; })()}
                    </View>
                    <Text style={[s.promoEyebrow,{color:txt2}]}>{tr('home.gencKartIndirim')}</Text>
                  </View>

                  <View style={s.promoHero}>
                    {(() => {
                      const promoDiscount = promoOffer?.aciklama?.match(/%([\d]+)/)?.[1] ?? null;
                      return promoDiscount ? (
                        <>
                          <Text style={[s.promoBigPct,{color:amber}]}>%{promoDiscount}</Text>
                          <Text style={[s.pBigLabel,{color:txt2, marginTop:2}]}>{tr('home.indirim')}</Text>
                        </>
                      ) : (
                        <Text style={[s.pBigLabel,{color:txt1, textAlign:'center'}]} numberOfLines={2}>
                          {promoOffer?.kategori || tr('home.yeniFirsat')}
                        </Text>
                      );
                    })()}
                  </View>
                </View>

                <View style={s.pTearRow} onLayout={(e) => setPromoNotchY(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)}>
                  <View style={s.pDashRow}>
                    {Array.from({length:20}).map((_,di)=>(
                      <View key={di} style={[s.pDashSeg,{backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(17,17,20,0.22)'}]}/>
                    ))}
                  </View>
                </View>

                <View style={{paddingHorizontal:22, paddingTop:16, paddingBottom:20}}>
                  <Text style={[s.promoBigName,{color:txt1}]} numberOfLines={1}>{promoOffer?.baslik || tr('home.bugunOzelIndirim')}</Text>
                  <Text style={[s.promoBigKat,{color:txt2}]} numberOfLines={2}>{promoOffer?.aciklama || tr('home.ogrenciIndirimi')}</Text>
                  <View style={[s.pCta,{backgroundColor:amber, paddingVertical:13}]}>
                    <Text style={[s.pCtaTxt,{color:'#fff', fontSize:13.5}]}>{tr('home.gencKarttaGoruntule')}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.promoClose} onPress={()=>setPromoModalVisible(false)}>
              <X color="#475569" size={15}/>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Takvim modal */}
      <Modal visible={calendarVisible} animationType="slide" transparent onRequestClose={()=>setCalendarVisible(false)}>
        <View style={s.calBack}>
          <View style={[s.calCard,{backgroundColor:cardBg}]}>
            <View style={s.calHead}>
              <Text style={[s.calTitle,{color:txt1}]}>{calendarView==='month'?'Aylık Takvim':'Yıllık Takvim'}</Text>
              <TouchableOpacity onPress={()=>setCalendarVisible(false)} style={[{padding:8, borderRadius:18, backgroundColor:chipBg}]}>
                <X color={txt1} size={20}/>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:20}}>
              <View style={[s.calTogWrap,{backgroundColor:chipBg}]}>
                {(['month','year'] as const).map(v=>(
                  <TouchableOpacity key={v} style={[s.calTogBtn,calendarView===v&&{backgroundColor:ctaBg}]} onPress={()=>setCalendarView(v)}>
                    <Text style={[s.calTogTxt,{color: calendarView===v ? ctaTxt : txt2}]}>{v==='month'?'Aylık':'Yıllık'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {calendarView==='month'&&(
                <View style={{marginBottom:20}}>
                  <View style={s.calNav}>
                    <TouchableOpacity onPress={()=>changeMonth(-1)} style={{padding:8}}><ChevronLeft color={txt2} size={22}/></TouchableOpacity>
                    <Text style={[s.calMonthLbl,{color:txt1}]}>{MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={()=>changeMonth(1)} style={{padding:8}}><ChevronRight color={txt2} size={22}/></TouchableOpacity>
                  </View>
                  <View style={s.calDayNames}>
                    {DAYS.map(d=><Text key={d} style={[s.calDayNm,{color:txt2}]}>{d}</Text>)}
                  </View>
                  <View style={s.calGrid}>
                    {getDaysInMonth(selectedDate).map((day,idx)=>{
                      const isToday=day===today.getDate()&&selectedDate.getMonth()===today.getMonth()&&selectedDate.getFullYear()===today.getFullYear();
                      const {specialDay,dailyEvents}=day?getDayContent(day,selectedDate.getMonth()):{specialDay:null,dailyEvents:[]};
                      return(
                        <TouchableOpacity key={idx} style={s.calDayCell}
                          onPress={()=>day&&(specialDay||dailyEvents.length>0)&&setSelectedDay({day,specialDay,events:dailyEvents})}
                          activeOpacity={(specialDay||dailyEvents.length>0)?0.7:1}>
                          {day&&(
                            <View style={[s.calDay,
                              isToday&&{backgroundColor:amber},
                              specialDay&&!isToday&&{backgroundColor:specialDay.color+'20',borderWidth:1.5,borderColor:specialDay.color},
                              !specialDay&&dailyEvents.length>0&&!isToday&&{backgroundColor:amber+'22',borderWidth:1,borderColor:amber,borderStyle:'dashed'},
                            ]}>
                              <Text style={[s.calDayTxt,{color:txt1},isToday&&s.calDayTodayTxt,specialDay&&!isToday&&{color:specialDay.color,fontWeight:'bold'}]}>{day}</Text>
                              <View style={{flexDirection:'row',alignItems:'center',marginTop:-2}}>
                                {specialDay&&<Text style={{fontSize:8}}>{specialDay.emoji}</Text>}
                                {dailyEvents.length>0&&<View style={[s.evDot,{backgroundColor:amber}]}/>}
                              </View>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {selectedDay&&(
                    <View style={{marginTop:16,gap:8}}>
                      {selectedDay.specialDay&&(
                        <TouchableOpacity style={[s.spCard,{backgroundColor:selectedDay.specialDay.color+'15',borderColor:selectedDay.specialDay.color}]} onPress={()=>setSelectedDay(null)} activeOpacity={0.9}>
                          <Text style={{fontSize:28,marginRight:12}}>{selectedDay.specialDay.emoji}</Text>
                          <View style={{flex:1}}>
                            <Text style={[s.spTitle,{color:selectedDay.specialDay.color}]}>{selectedDay.specialDay.name}</Text>
                            <Text style={{fontSize:12,color:txt2,marginTop:2}}>{selectedDay.day} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      {selectedDay.events.map((ev,i)=>(
                        <TouchableOpacity key={i} style={[s.evCard,{backgroundColor:chipBg}]} onPress={()=>{setCalendarVisible(false);navigation.navigate('Events');}}>
                          <View style={[s.evCardIco,{backgroundColor:isDark?'rgba(245,158,11,0.12)':'#FEF3C7'}]}>
                            <Calendar color={amber} size={17}/>
                          </View>
                          <View style={{flex:1}}>
                            <Text style={[s.evCardTxt,{color:txt1}]}>{ev.title}</Text>
                            <Text style={{fontSize:11,color:txt2,marginTop:2}}>{ev.location} · {ev.category}</Text>
                          </View>
                          <ChevronRight color={txt2} size={17}/>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={{marginTop:20}}>
                    <Text style={{fontSize:14,fontWeight:'700',color:txt1,marginBottom:12}}>{tr('home.ozelGunler')}</Text>
                    {(()=>{
                      const list=Object.entries(SPECIAL_DAYS).filter(([k])=>Number(k.split('-')[0])===selectedDate.getMonth()+1).sort((a,b)=>Number(a[0].split('-')[1])-Number(b[0].split('-')[1]));
                      if(!list.length)return<Text style={{fontSize:13,color:txt2,fontStyle:'italic'}}>{tr('home.ozelGunYok')}</Text>;
                      return list.map(([k,v])=>(
                        <View key={k} style={[s.spRow,{backgroundColor:chipBg}]}>
                          <View style={[s.spDot,{backgroundColor:v.color}]}/>
                          <Text style={{fontSize:15,marginRight:8}}>{v.emoji}</Text>
                          <Text style={{fontSize:13,fontWeight:'600',color:txt2,marginRight:8,width:22}}>{k.split('-')[1]}</Text>
                          <Text style={{fontSize:13,color:txt1,flex:1}} numberOfLines={1}>{v.name}</Text>
                        </View>
                      ));
                    })()}
                  </View>
                </View>
              )}

              {calendarView==='year'&&(
                <View style={{marginBottom:20}}>
                  <View style={s.calNav}>
                    <TouchableOpacity onPress={()=>changeYear(-1)} style={{padding:8}}><ChevronLeft color={txt2} size={22}/></TouchableOpacity>
                    <Text style={{fontSize:24,fontWeight:'bold',color:txt1}}>{selectedDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={()=>changeYear(1)} style={{padding:8}}><ChevronRight color={txt2} size={22}/></TouchableOpacity>
                  </View>
                  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>
                    {MONTHS.map((m,i)=>{
                      const cur=i===today.getMonth()&&selectedDate.getFullYear()===today.getFullYear();
                      return(
                        <TouchableOpacity key={m} style={[s.calMCell,{backgroundColor:chipBg},cur&&{backgroundColor:ctaBg}]}
                          onPress={()=>{const d=new Date(selectedDate);d.setMonth(i);setSelectedDate(d);setCalendarView('month');}}>
                          <Text style={[s.calMTxt,{color: cur ? ctaTxt : txt1},cur&&{fontWeight:'bold'}]}>{m.slice(0,3)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <TouchableOpacity style={[s.calEvBtn,{backgroundColor:ctaBg}]} onPress={()=>{setCalendarVisible(false);navigation.navigate('Events');}}>
                <Text style={[s.calEvBtnTxt,{color:ctaTxt}]}>{tr('home.etkinliklereGit')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ICON_SIZE = 72;

const s = StyleSheet.create({
  root: {flex:1},
  orb:  {position:'absolute',borderRadius:999},

  // Lunch Box inspired HomeScreen
  lunchScroll:{paddingHorizontal:18, paddingBottom:126},
  lunchTopBar:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', gap:14, marginBottom:6},
  lunchDate:{fontSize:9.5, fontWeight:'900', letterSpacing:1.4, marginBottom:4, textTransform:'uppercase'},
  lunchHello:{fontSize:23, lineHeight:27, fontWeight:'500', fontFamily:SERIF, letterSpacing:-0.35},
  lunchTopActions:{flexDirection:'row', alignItems:'center', gap:9},
  lunchIconBtn:{width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', borderWidth:1, position:'relative'},
  lunchAvatar:{width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', overflow:'hidden'},
  lunchCover:{borderRadius:22, borderWidth:1.35, minHeight:360, paddingTop:14, paddingHorizontal:16, paddingBottom:16, alignItems:'center', overflow:'hidden'},
  lunchCoverLine:{position:'absolute', top:0, bottom:0, width:1.2, backgroundColor:'rgba(17,17,20,0.34)'},
  lunchCoverHead:{alignSelf:'stretch', alignItems:'center', borderBottomWidth:1.2, borderBottomColor:'rgba(17,17,20,0.42)', paddingBottom:9, marginHorizontal:-16},
  lunchCoverHeadGlass:{borderRadius:999, overflow:'hidden', paddingHorizontal:14, paddingVertical:4, backgroundColor:'rgba(255,248,234,0.5)', borderWidth:1, borderColor:'rgba(255,255,255,0.45)'},
  lunchCoverWord:{fontSize:18, lineHeight:23, fontWeight:'500', letterSpacing:1.2, fontFamily:SERIF},
  lunchBlob:{position:'absolute', width:42, height:42, borderRadius:21, opacity:0.55},
  lunchCoverArt:{marginTop:16, marginBottom:4},
  lunchGlassTag:{position:'absolute', left:12, right:12, bottom:12, borderRadius:16, overflow:'hidden', paddingHorizontal:10, paddingVertical:6, backgroundColor:'rgba(248,248,250,0.9)', borderWidth:1, borderColor:'rgba(255,255,255,0.5)'},
  lunchGlassTagText:{fontSize:11, fontWeight:'900', letterSpacing:1, textTransform:'uppercase'},
  lunchGlassTagSub:{fontSize:12.5, fontWeight:'700', marginTop:2},
  lunchCoverTitle:{fontSize:25, lineHeight:30, fontWeight:'500', fontFamily:SERIF, textAlign:'center', letterSpacing:-0.25},
  lunchCoverSub:{fontSize:12, lineHeight:17, fontWeight:'500', textAlign:'center', marginTop:5, paddingHorizontal:14},
  lunchNext:{height:42, borderRadius:999, borderWidth:1.1, alignSelf:'stretch', marginTop:12, paddingLeft:18, paddingRight:4, flexDirection:'row', alignItems:'center', justifyContent:'space-between', overflow:'hidden', backgroundColor:'rgba(255,248,234,0.48)'},
  lunchNextTxt:{fontSize:13.5, fontWeight:'700'},
  lunchNextCircle:{width:34, height:34, borderRadius:17, borderWidth:1.1, alignItems:'center', justifyContent:'center'},
  lunchInfoRow:{flexDirection:'row', gap:0, marginTop:6, borderBottomWidth:1.2},
  lunchInfoPill:{flex:1, minHeight:38, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingHorizontal:5},
  lunchInfoText:{fontSize:11.5, fontWeight:'800'},
  lunchSection:{marginTop:24},
  lunchSectionHead:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12},
  lunchSectionTitle:{fontSize:11.5, fontWeight:'900', letterSpacing:1.35, textTransform:'uppercase'},
  newOfferToast:{
    marginHorizontal:20,
    marginBottom:10,
    borderRadius:12,
    borderWidth:1,
    paddingHorizontal:12,
    paddingVertical:9,
    flexDirection:'row',
    alignItems:'center',
    gap:8,
  },
  newOfferToastText:{fontSize:12.5, fontWeight:'800', letterSpacing:-0.1},
  lunchFeatureScroll:{paddingRight:18, gap:10},
  lunchFeatureCard:{width:172, height:148, borderRadius:18, borderWidth:1.2, padding:6, overflow:'hidden'},
  lunchFeatureImage:{width:'100%', height:'100%', borderRadius:13},
  lunchFeatureCaption:{position:'absolute', left:12, right:12, bottom:11, borderRadius:999, overflow:'hidden', backgroundColor:'rgba(248,248,250,0.9)', borderWidth:1, borderColor:'rgba(255,255,255,0.46)', paddingHorizontal:10, paddingVertical:5},
  lunchFeatureName:{fontSize:13.5, fontWeight:'500', fontFamily:SERIF, letterSpacing:-0.1, textAlign:'center'},
  lunchFeatureMeta:{fontSize:11.5, fontWeight:'700', marginTop:3, marginHorizontal:4, marginBottom:3},
  lunchEmpty:{borderRadius:22, borderWidth:1, padding:22, alignItems:'center', gap:8},
  dealScroll:{paddingLeft:18, paddingRight:8, gap:10},
  dealScrollCard:{width:138, borderRadius:18, borderWidth:1.2, padding:14, gap:8, justifyContent:'space-between', minHeight:160},
  dealScrollIcon:{width:38, height:38, borderRadius:12, alignItems:'center', justifyContent:'center'},
  dealScrollTitle:{fontSize:14, fontWeight:'800', letterSpacing:-0.2},
  dealScrollMeta:{fontSize:11, fontWeight:'500'},
  dealScrollBadge:{fontSize:22, fontWeight:'900', letterSpacing:-0.5, marginTop:4},
  assistantBanner:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderRadius:14,padding:14,marginTop:10},
  assistantBannerLeft:{flexDirection:'row',alignItems:'center',gap:12,flex:1},
  assistantBannerTitle:{fontSize:15,fontWeight:'800',letterSpacing:-0.2},
  assistantBannerSub:{fontSize:12,fontWeight:'500'},
  gencDealGrid:{gap:10},
  gencDealHero:{borderRadius:22, borderWidth:1.2, padding:18, gap:10},
  gencDealHeroIcon:{width:44, height:44, borderRadius:14, alignItems:'center', justifyContent:'center'},
  gencDealHeroTitle:{fontSize:18, fontWeight:'800', letterSpacing:-0.3},
  gencDealHeroMeta:{fontSize:13, fontWeight:'500', lineHeight:18},
  gencDealHeroBadge:{fontSize:28, fontWeight:'900', letterSpacing:-1, marginTop:2},
  gencDealHeroCta:{flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6, paddingVertical:12, borderRadius:14, marginTop:4},
  gencDealHeroCtaTxt:{fontSize:13.5, fontWeight:'700'},
  gencDealCard:{minHeight:70, borderRadius:18, borderWidth:1.2, paddingHorizontal:12, paddingVertical:10, flexDirection:'row', alignItems:'center', gap:10},
  gencTicketDash:{height:42, borderLeftWidth:1.1, borderStyle:'dashed', marginHorizontal:2},
  gencDealIcon:{width:34, height:34, borderRadius:13, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(17,17,20,0.14)'},
  gencDealTitle:{fontSize:14.5, fontWeight:'700', letterSpacing:-0.15},
  gencDealMeta:{fontSize:11.5, fontWeight:'700', marginTop:3},
  gencDealBadge:{fontSize:13, fontWeight:'900', letterSpacing:-0.1, minWidth:46, textAlign:'center'},
  gencDealEmpty:{borderRadius:18, borderWidth:1.2, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8},
  gencSheetBack:{flex:1, backgroundColor:'rgba(19,14,9,0.42)', justifyContent:'flex-end'},
  gencSheet:{maxHeight:'76%', borderTopLeftRadius:28, borderTopRightRadius:28, borderWidth:1.35, paddingHorizontal:18, paddingTop:10, paddingBottom:Platform.OS==='ios'?28:18},
  gencSheetHandle:{alignSelf:'center', width:44, height:4, borderRadius:2, backgroundColor:'rgba(17,17,20,0.28)', marginBottom:14},
  gencSheetHead:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16},
  gencSheetEyebrow:{fontSize:10, fontWeight:'900', letterSpacing:1.35, marginBottom:3},
  gencSheetTitle:{fontSize:25, lineHeight:30, fontWeight:'500', fontFamily:SERIF, letterSpacing:-0.25},
  gencSheetClose:{width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(17,17,20,0.14)'},
  gencSheetDeal:{minHeight:68, borderRadius:18, borderWidth:1.2, paddingHorizontal:12, paddingVertical:10, flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'rgba(255,248,234,0.72)'},
  gencSheetEmpty:{borderRadius:18, borderWidth:1.2, padding:20, alignItems:'center', gap:8, backgroundColor:'rgba(255,248,234,0.72)'},
  lunchMealCard:{borderRadius:18, borderWidth:1.2, overflow:'hidden'},
  lunchMealRow:{minHeight:82, flexDirection:'row', alignItems:'center', gap:13, paddingLeft:16, paddingRight:9, paddingVertical:9, borderBottomWidth:1, borderBottomColor:'rgba(17,17,20,0.14)'},
  lunchMealTitle:{fontSize:18, fontWeight:'500', fontFamily:SERIF, letterSpacing:-0.15, marginBottom:7},
  lunchMealMetaRow:{flexDirection:'row', alignItems:'center', gap:5},
  lunchMealDot:{width:13, height:13, borderRadius:6.5, borderWidth:1, borderColor:'rgba(17,17,20,0.2)'},
  lunchMealMeta:{fontSize:11.5, fontWeight:'700', marginLeft:3, flex:1},
  lunchMealThumb:{width:92, height:64, borderRadius:10, borderWidth:1, borderColor:'rgba(17,17,20,0.22)', overflow:'hidden'},
  lunchQuickScroll:{gap:10, paddingRight:20},
  lunchQuickGrid:{flexDirection:'row', flexWrap:'wrap', gap:10},
  lunchQuickCard:{width:'31.4%', minHeight:88, borderRadius:18, borderWidth:1, paddingVertical:11, paddingHorizontal:6, alignItems:'center', justifyContent:'center', gap:7, backgroundColor:'#FFFFFF'},
  lunchQuickIcon:{width:42, height:42, borderRadius:15, borderWidth:1, borderColor:'rgba(17,17,20,0.14)', alignItems:'center', justifyContent:'center', overflow:'hidden'},
  lunchQuickText:{fontSize:11, fontWeight:'800', color:'#111114', textAlign:'center', letterSpacing:-0.1},
  lunchEventRow:{minHeight:66, flexDirection:'row', alignItems:'center', gap:12, paddingHorizontal:14, paddingVertical:10, borderBottomWidth:1, borderBottomColor:'rgba(17,17,20,0.12)'},
  lunchEventIcon:{width:38, height:38, borderRadius:14, alignItems:'center', justifyContent:'center'},
  lunchSocialCard:{marginTop:16, borderRadius:20, borderWidth:1.35, padding:18, minHeight:122, flexDirection:'row', alignItems:'center', justifyContent:'space-between', overflow:'hidden', backgroundColor:'rgba(255,248,234,0.86)'},
  sosyalCompact:{marginTop:14, borderRadius:14, borderWidth:1.2, paddingHorizontal:16, paddingVertical:14, flexDirection:'row', alignItems:'center', gap:10},
  sosyalCompactDot:{width:8, height:8, borderRadius:4},
  sosyalCompactTitle:{fontSize:15, fontWeight:'800', flex:1},
  sosyalCompactSub:{fontSize:12, fontWeight:'500'},
  assistantCard:{marginTop:20, borderRadius:18, borderWidth:1.2, padding:14, flexDirection:'row', alignItems:'center', gap:12},
  assistantIconWrap:{width:42, height:42, borderRadius:14, alignItems:'center', justifyContent:'center'},
  assistantTitle:{fontSize:15, fontWeight:'800', letterSpacing:-0.2},
  assistantSub:{fontSize:12, fontWeight:'500', marginTop:2},

  // Hero
  hero:       {height:272, overflow:'hidden'},
  heroGrad:   {flex:1, paddingHorizontal:20, paddingTop:14, paddingBottom:24, justifyContent:'space-between'},
  heroTop:    {flexDirection:'row', justifyContent:'flex-end', alignItems:'center'},
  heroIcons:  {flexDirection:'row', gap:8},
  heroIconBtn:{width:38, height:38, borderRadius:19, backgroundColor:'rgba(0,0,0,0.35)', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'rgba(255,255,255,0.15)'},
  heroBody:   {gap:5},
  heroGreet:  {fontSize:33, fontWeight:'800', color:'#fff', letterSpacing:-0.5},
  heroSub:    {fontSize:15, color:'rgba(255,255,255,0.68)', fontWeight:'500'},

  // Hero — sade/temiz versiyon
  heroClean:      {paddingHorizontal:20, paddingBottom:14, gap:10},
  heroCleanGreet: {fontSize:24, fontWeight:'700', letterSpacing:-0.2, fontFamily:SERIF},
  heroCleanGreetLight:{fontSize:19, fontWeight:'500', letterSpacing:-0.2},
  heroCleanGreetEmoji:{fontSize:19},
  heroEyebrow:{fontSize:11, fontWeight:'800', letterSpacing:1.2, marginBottom:8},
  heroCleanTop:   {flexDirection:'row', alignItems:'center', gap:12},
  heroCleanIcons: {flexDirection:'row', alignItems:'center', gap:10, marginRight:Platform.OS==='ios'?11:8},
  heroCleanIconBtn:{width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', position:'relative'},
  notifBadge:{position:'absolute', top:-2, right:-2, minWidth:16, height:16, borderRadius:8, backgroundColor:'#111114', alignItems:'center', justifyContent:'center', paddingHorizontal:3, borderWidth:1.5, borderColor:'#fff'},
  notifBadgeTxt:{color:'#fff', fontSize:9, fontWeight:'800'},
  heroCleanAvatar:{width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', overflow:'hidden'},
  heroCleanAvatarTxt:{fontSize:16, fontWeight:'800'},
  quickGrid:      {flexDirection:'row', flexWrap:'wrap', rowGap:18, marginTop:14},
  quickSquareCard:{alignItems:'center', width:'33.33%', gap:8},
  quickSquareFrame:{width:64, height:64, borderRadius:22, alignItems:'center', justifyContent:'center'},
  quickSquareIconWrap:{width:52, height:52, borderRadius:16, alignItems:'center', justifyContent:'center', overflow:'hidden'},
  quickSquareLottie:{width:34, height:34},
  quickSquareLabel:{fontSize:11, fontWeight:'700', textAlign:'center'},

  heroPill:   {flexDirection:'row', alignSelf:'flex-start', borderRadius:999, borderWidth:1, overflow:'hidden'},
  heroPillSide:{flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:13, paddingVertical:8},
  heroPillTxt: {fontSize:12.5, fontWeight:'700'},
  heroPillDesc:{fontSize:10, fontWeight:'500', textTransform:'capitalize'},
  heroPillDivider:{width:1, marginVertical:6},

  statRow:   {flexDirection:'row', gap:12, marginTop:16},
  statTile:  {flex:1, borderRadius:22, padding:16, gap:10},
  statIconCircle:{width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center'},
  statLabel: {fontSize:12.5, fontWeight:'600', color:'rgba(17,17,20,0.55)'},
  statValue: {fontSize:24, fontWeight:'800', color:'#111114', letterSpacing:-0.4, marginTop:-6},

  editorialHeroCard:{borderRadius:28, borderWidth:1.2, paddingTop:18, paddingHorizontal:18, paddingBottom:20, marginTop:10, overflow:'hidden', alignItems:'center'},
  editorialGridLine:{position:'absolute', top:0, bottom:0, width:1, backgroundColor:'rgba(17,17,20,0.11)'},
  editorialHeroHeader:{alignSelf:'stretch', alignItems:'center', borderBottomWidth:1, borderBottomColor:'rgba(17,17,20,0.16)', paddingBottom:12, marginHorizontal:-18},
  editorialWordmark:{fontSize:23, fontWeight:'500', letterSpacing:0.8, fontFamily:SERIF},
  editorialHeaderRule:{position:'absolute', top:-18, bottom:-12, left:'50%', width:1, backgroundColor:'rgba(17,17,20,0.12)'},
  editorialHeroArt:{marginTop:18, marginBottom:10},
  editorialHeroTitle:{fontSize:28, lineHeight:34, fontWeight:'500', fontFamily:SERIF, textAlign:'center', letterSpacing:-0.2},
  editorialNextPill:{height:46, borderRadius:999, borderWidth:1.2, alignSelf:'stretch', marginTop:16, paddingLeft:22, paddingRight:5, flexDirection:'row', alignItems:'center', justifyContent:'space-between'},
  editorialNextTxt:{fontSize:14, fontWeight:'600'},
  editorialNextIcon:{width:36, height:36, borderRadius:18, borderWidth:1.2, alignItems:'center', justifyContent:'center'},

  comparisonPanel:{backgroundColor:'#DCEAF5', borderRadius:24, paddingVertical:16, marginHorizontal:20},
  comparisonFooter:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, marginTop:14, paddingTop:14, borderTopWidth:1, borderTopColor:'rgba(17,17,20,0.08)'},
  comparisonFooterLabel:{fontSize:13, fontWeight:'600', color:'rgba(17,17,20,0.6)'},
  comparisonFooterBadge:{backgroundColor:'#111114', borderRadius:12, paddingHorizontal:12, paddingVertical:6},
  comparisonFooterBadgeTxt:{fontSize:12.5, fontWeight:'800', color:'#fff'},

  dotsTop:{flexDirection:'row', gap:5},
  dotTop: {width:6, height:6, borderRadius:3},

  featuredCard:{width:168, height:170, marginRight:12, borderRadius:20, borderWidth:1, padding:6, overflow:'hidden'},
  featuredPhoto:{width:'100%', height:'100%', borderRadius:15},
  featuredPhotoFallback:{alignItems:'center', justifyContent:'center'},

  detailCard:{marginTop:16, borderRadius:22, borderWidth:1, padding:20},
  detailTitle:{fontSize:19, fontWeight:'700', letterSpacing:-0.3, fontFamily:SERIF, marginBottom:6},
  detailDesc: {fontSize:13, lineHeight:19, marginBottom:16},
  detailSectionLabel:{fontSize:11, fontWeight:'800', letterSpacing:1.2, textTransform:'uppercase', marginBottom:12},
  detailRow:  {flexDirection:'row', alignItems:'center', gap:10, marginBottom:6},
  detailDotIcon:{width:26, height:26, borderRadius:13, alignItems:'center', justifyContent:'center'},
  detailRowLabel:{flex:1, fontSize:13.5, fontWeight:'600'},
  detailRowValue:{fontSize:13, fontWeight:'700'},
  detailProgressTrack:{height:3, borderRadius:2, backgroundColor:'rgba(17,17,20,0.08)', marginLeft:36, marginBottom:14, overflow:'hidden'},
  detailProgressFill:{height:3, borderRadius:2},
  detailCta:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#111114', borderRadius:26, paddingLeft:20, paddingRight:6, height:48, marginTop:4},
  detailCtaTxt:{fontSize:14, fontWeight:'700', color:'#fff', fontFamily:SERIF},

  todayBoxList:{borderRadius:24, borderWidth:1, overflow:'hidden'},
  todayBoxRow:{minHeight:86, flexDirection:'row', alignItems:'center', gap:14, paddingLeft:18, paddingRight:10, paddingVertical:10, borderBottomWidth:1, borderBottomColor:'rgba(17,17,20,0.12)'},
  todayBoxTitle:{fontSize:19, fontWeight:'500', fontFamily:SERIF, letterSpacing:-0.15, marginBottom:8},
  todayBoxMetaRow:{flexDirection:'row', alignItems:'center', gap:5},
  todayBoxDot:{width:13, height:13, borderRadius:6.5, borderWidth:1, borderColor:'rgba(17,17,20,0.2)'},
  todayBoxMeta:{fontSize:11.5, fontWeight:'700', marginLeft:3, flex:1},
  todayBoxThumb:{width:96, height:66, borderRadius:13, borderWidth:1, borderColor:'rgba(17,17,20,0.18)'},

  splashCard:{borderRadius:28, borderWidth:1, paddingVertical:28, paddingHorizontal:20, alignItems:'center'},
  splashWordmark:{fontSize:15, fontWeight:'700', letterSpacing:4, fontFamily:SERIF, marginBottom:22},
  splashStarWrap:{marginBottom:22},
  splashTagline:{fontSize:24, fontWeight:'700', letterSpacing:-0.3, fontFamily:SERIF, textAlign:'center', lineHeight:30},
  splashSub:{fontSize:13, fontWeight:'500', marginTop:8},

  activityList:{borderRadius:20, borderWidth:1, paddingHorizontal:16},
  activityRow:{flexDirection:'row', alignItems:'center', gap:12, paddingVertical:14, borderBottomWidth:1, borderBottomColor:'rgba(17,17,20,0.06)'},
  activityIconCircle:{width:44, height:44, borderRadius:13, alignItems:'center', justifyContent:'center'},
  activityTitle:{fontSize:14.5, fontWeight:'700', letterSpacing:-0.2},
  activityBadgeRow:{flexDirection:'row', alignItems:'center', gap:6, marginTop:5, flexWrap:'wrap'},
  activityBadge:{width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center'},
  activitySub:{fontSize:12.5, fontWeight:'500'},

  // Section
  section:{marginTop:30},
  secRow: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingHorizontal:20},
  secTitleWrap:{flexDirection:'row', alignItems:'center', gap:9},
  secBar:  {width:4, height:20, borderRadius:2},
  secLabel:{fontSize:13, fontWeight:'700', letterSpacing:1.2, textTransform:'uppercase'},
  secMore: {fontSize:13, fontWeight:'700'},

  // Landmarks — kart anatomisi: görsel üstte, içerik altta
  lmCard:      {borderRadius:20, overflow:'hidden',
    shadowOffset:{width:0,height:6}, shadowOpacity:0.08, shadowRadius:16, elevation:3},
  lmImageWrap: {padding:10},
  lmImage:     {height:180, justifyContent:'flex-end', overflow:'hidden'},
  lmImageRadius:{borderRadius:18},
  lmBannerBody:{gap:6, padding:16, paddingTop:12},
  lmBannerName:{fontSize:24, fontWeight:'700', letterSpacing:-0.2, fontFamily:SERIF},
  lmBannerSubRow:{flexDirection:'row', alignItems:'center', gap:5},
  lmBannerSub: {fontSize:12.5, fontWeight:'600'},
  lmBannerDesc:{fontSize:12.5, lineHeight:18},
  lmNextPill:  {flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderRadius:26, paddingLeft:20, paddingRight:6, height:48},
  lmNextPillTxt:{fontSize:14, fontWeight:'700', color:'#fff', fontFamily:SERIF},
  lmArrowBtn:  {width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center', backgroundColor:'#fff'},
  lmDots:      {flexDirection:'row', gap:6, alignSelf:'flex-end', margin:14},
  lmDot:       {width:6, height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.4)'},
  lmDotA:      {width:20, backgroundColor:'#fff', borderRadius:3},

  // Icon grid — 3×2
  iconGrid: {flexDirection:'row', flexWrap:'wrap', paddingHorizontal:12},
  iconCell: {width:'33.33%', alignItems:'center', paddingVertical:10},
  iconTouch:{alignItems:'center', gap:10, width:'100%'},
  iconCircle:{
    width:ICON_SIZE, height:ICON_SIZE, borderRadius:24,
    alignItems:'center', justifyContent:'center',
    shadowColor:'#111114', shadowOffset:{width:0,height:3}, shadowOpacity:0.05, shadowRadius:6,
    elevation:1,
  },
  iconLottie:{width:52, height:52, backgroundColor:'transparent'},
  iconLabel: {fontSize:12, fontWeight:'600', textAlign:'center'},

  // ŞanlıSosyal
  sosyalCard:   {borderRadius:28, padding:22, flexDirection:'row', alignItems:'center', justifyContent:'space-between', overflow:'hidden', minHeight:130,
    shadowColor:'#111114', shadowOffset:{width:0,height:8}, shadowOpacity:0.16, shadowRadius:20, elevation:8},
  sosyalLeft:   {flex:1, gap:8},
  sosyalLiveBadge:{flexDirection:'row', alignItems:'center', gap:5, alignSelf:'flex-start', backgroundColor:'rgba(255,248,234,0.12)', paddingHorizontal:10, paddingVertical:4, borderRadius:999, borderWidth:1, borderColor:'rgba(255,248,234,0.22)'},
  sosyalLiveDot:{width:7, height:7, borderRadius:3.5, backgroundColor:'#4ADE80'},
  sosyalLiveTxt:{fontSize:11, fontWeight:'800', color:'#fff', letterSpacing:0.6},
  sosyalTitle:  {fontSize:26, fontWeight:'800', color:'#fff', letterSpacing:-0.4},
  sosyalSub:    {fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:'500', lineHeight:19},
  sosyalRight:  {width:100, height:100, alignItems:'center', justifyContent:'center'},
  sosyalLottie: {width:100, height:100, backgroundColor:'transparent'},

  // Partners — kupon / bilet tasarımı
  pScroll:   {paddingHorizontal:20, paddingVertical:14},
  pCard:     {width:128, borderRadius:16, paddingHorizontal:10, paddingTop:10, paddingBottom:10, marginRight:10, height:158, overflow:'hidden'},
  pHero:     {flex:1, alignItems:'center', justifyContent:'center', paddingTop:2},
  pIconWrap: {width:34, height:34, borderRadius:17, justifyContent:'center', alignItems:'center', marginBottom:6},
  pBigPct:   {fontSize:28, lineHeight:30, fontWeight:'900', color:'#fff', letterSpacing:-1},
  pBigLabel: {fontSize:9, fontWeight:'800', color:'rgba(255,255,255,0.9)', letterSpacing:2, marginTop:-2},
  pBigFirsat:{fontSize:22, fontWeight:'900', color:'#fff', letterSpacing:0.5, paddingVertical:6},
  pOfferText:{fontSize:15, fontWeight:'800', color:'#fff', letterSpacing:-0.2, textAlign:'center', paddingHorizontal:2},
  pTearRow:  {flexDirection:'row', alignItems:'center', height:14, marginVertical:8, marginHorizontal:-13},
  pNotchWrapLeft:  {position:'absolute', left:0, top:0, width:7, height:14, overflow:'hidden', zIndex:5},
  pNotchWrapRight: {position:'absolute', right:0, top:0, width:7, height:14, overflow:'hidden', zIndex:5},
  pNotchCircle: {position:'absolute', top:0, width:14, height:14, borderRadius:7},
  pDashRow:  {flex:1, flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:13},
  pDashSeg:  {width:6, height:2, borderRadius:1, backgroundColor:'rgba(255,255,255,0.6)'},
  pName:     {fontSize:11, fontWeight:'800', color:'#fff', textAlign:'center'},
  pKat:      {fontSize:9, fontWeight:'700', letterSpacing:0.3, color:'rgba(255,255,255,0.82)', marginTop:1, marginBottom:6, textAlign:'center'},
  pCta:      {alignSelf:'stretch', paddingVertical:6, borderRadius:8, backgroundColor:'#fff', alignItems:'center'},
  pCtaTxt:   {fontSize:10, fontWeight:'800'},
  empty:  {marginHorizontal:20, borderRadius:22, padding:24, alignItems:'center', borderWidth:1, gap:8},
  emptyIcon:{width:54, height:54, borderRadius:27, alignItems:'center', justifyContent:'center', marginBottom:4},
  emptyTitle:{fontSize:16, fontWeight:'700'},
  emptySub:  {fontSize:13, textAlign:'center'},
  emptyCta:  {flexDirection:'row', alignItems:'center', gap:8, paddingHorizontal:16, paddingVertical:10, borderRadius:12, marginTop:4},
  emptyCtaTxt:{fontSize:14, fontWeight:'600'},
  dots:   {flexDirection:'row', justifyContent:'center', gap:6, marginTop:12},
  dot:    {width:6,  height:6,  borderRadius:3},
  dotA:   {width:22, borderRadius:3},

  // Modals
  mBack:    {flex:1, backgroundColor:'rgba(2,6,23,0.65)', justifyContent:'center', alignItems:'center', paddingHorizontal:24},
  mCard:    {width:'100%', borderRadius:22, backgroundColor:'#fff', paddingHorizontal:20, paddingTop:18, paddingBottom:16, borderWidth:1, borderColor:'rgba(15,23,42,0.08)'},
  mBadge:   {alignSelf:'center', flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:6, borderRadius:999, borderWidth:1, marginBottom:12},
  mBadgeTxt:{fontSize:12, fontWeight:'700'},
  mTitle:   {textAlign:'center', fontSize:20, fontWeight:'800', color:'#0f172a', marginBottom:8},
  mSub:     {textAlign:'center', fontSize:14, color:'#475569', lineHeight:20, marginBottom:16},
  mRow:     {flexDirection:'row', gap:10},
  mSec:     {flex:1, height:46, borderRadius:12, alignItems:'center', justifyContent:'center', backgroundColor:'#e2e8f0'},
  mSecTxt:  {fontSize:14, fontWeight:'700', color:'#334155'},
  mPri:     {flex:1, height:46, borderRadius:12, alignItems:'center', justifyContent:'center', backgroundColor:'#2563eb'},
  mPriTxt:  {fontSize:14, fontWeight:'700', color:'#fff'},
  promoCard:{width:'100%', borderRadius:20, backgroundColor:'#fff', overflow:'hidden', borderWidth:1, borderColor:'rgba(15,23,42,0.08)'},
  promoClose:{position:'absolute', top:-12, right:-12, zIndex:3, width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center', backgroundColor:'#fff', ...cardOuterShadow},
  promoImg: {width:'100%', height:150},
  promoTitle:{color:'#fff', fontSize:18, fontWeight:'800', marginBottom:6, textAlign:'center'},
  promoSub:  {color:'rgba(255,255,255,0.88)', fontSize:13, lineHeight:18, textAlign:'center'},
  promoAccentBlock:{paddingHorizontal:22, paddingTop:20, paddingBottom:6},
  promoTopRow:{flexDirection:'row', alignItems:'center', gap:10},
  promoIconCircle:{width:40, height:40, borderRadius:13, alignItems:'center', justifyContent:'center'},
  promoEyebrow:{fontSize:11, fontWeight:'800', letterSpacing:1},
  promoHero:{alignItems:'center', paddingVertical:14},
  promoBigPct:{fontSize:46, lineHeight:48, fontWeight:'900', letterSpacing:-1.5},
  promoBigName:{fontSize:17, fontWeight:'800', textAlign:'center'},
  promoBigKat:{fontSize:12.5, lineHeight:17, fontWeight:'600', textAlign:'center', marginTop:4, marginBottom:14},

  // Calendar
  calBack:  {flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'flex-end'},
  calCard:  {borderTopLeftRadius:32, borderTopRightRadius:32, padding:20, height:'80%'},
  calHead:  {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20},
  calTitle: {fontSize:20, fontWeight:'800'},
  calTogWrap:{flexDirection:'row', borderRadius:16, padding:4, marginBottom:20},
  calTogBtn: {flex:1, paddingVertical:10, borderRadius:14, alignItems:'center'},
  calTogTxt: {fontWeight:'600'},
  calNav:    {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20},
  calMonthLbl:{fontSize:18, fontWeight:'800'},
  calDayNames:{flexDirection:'row', marginBottom:10},
  calDayNm:  {flex:1, textAlign:'center', fontSize:12, fontWeight:'600'},
  calGrid:   {flexDirection:'row', flexWrap:'wrap'},
  calDayCell:{width:'14.28%', aspectRatio:1, justifyContent:'center', alignItems:'center', marginBottom:4},
  calDay:    {width:34, height:34, borderRadius:17, justifyContent:'center', alignItems:'center'},
  calDayTxt: {fontSize:13, fontWeight:'500'},
  calDayTodayTxt:{color:'#fff', fontWeight:'700'},
  evDot:     {width:4, height:4, borderRadius:2, marginLeft:2},
  spCard:    {flexDirection:'row', alignItems:'center', padding:14, borderRadius:16, borderWidth:2},
  spTitle:   {fontSize:15, fontWeight:'700'},
  evCard:    {flexDirection:'row', alignItems:'center', padding:12, borderRadius:16, gap:10},
  evCardIco: {width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center'},
  evCardTxt: {fontSize:14, fontWeight:'700'},
  spRow:     {flexDirection:'row', alignItems:'center', paddingVertical:10, paddingHorizontal:12, borderRadius:12, marginBottom:8},
  spDot:     {width:7, height:7, borderRadius:3.5, marginRight:10},
  calMCell:  {width:'30%', paddingVertical:18, borderRadius:18, alignItems:'center', marginBottom:12},
  calMTxt:   {fontSize:15, fontWeight:'600'},
  calEvBtn:  {paddingVertical:16, borderRadius:20, alignItems:'center', marginTop:10, marginBottom:20},
  calEvBtnTxt:{fontSize:16, fontWeight:'800'},
});
