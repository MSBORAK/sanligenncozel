import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ImageBackground,
  TouchableOpacity, Modal, Platform, Animated, Easing,
  NativeSyntheticEvent, NativeScrollEvent, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Calendar, BookOpen, Search, X, ChevronLeft, ChevronRight, Sparkles,
  CloudRain, Sun, Cloud, CloudSnow, CloudLightning, CloudDrizzle,
  Tag, Coffee, Shirt, Smartphone, Ticket, GraduationCap, Gift, Bell,
  Pill, Library, Route, Radio, MapPin, ArrowUpRight,
  Scissors, Dumbbell, Film, UtensilsCrossed, ShoppingBag, Stethoscope, Cake, Glasses,
} from 'lucide-react-native';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import AnimatedPressable from '@/components/AnimatedPressable';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import { MOCK_BUSES, MOCK_MAGAZINES } from '@/api/mockData';
import { HomeScreenProps, MainTabParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import { Clean } from '@/constants/Colors';
import { cardBorderLight, cardBorderDark, cardOuterShadow, cardInnerClip } from '@/constants/Shadows';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import Svg, { Path } from 'react-native-svg';
import { toOwmCurrent, toOwmForecast } from '@/utils/weather';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FirsatData { id:number; baslik:string; aciklama:string; tarih?:string; kategori:string; resim_url?:string; }
interface CalendarEventItem { id:string; title:string; date:string; location:string; category:string; }

// ─── Static data ──────────────────────────────────────────────────────────────
const QUICK_ACCESS = [
  { name:'Etkinlik',    screen:'Events',       lottie:require('@/assets/images/El calendario.json'),      grad:['#5B21B6','#7C3AED'] as const },
  { name:'Keşfet',      screen:'Magazine',     lottie:require('@/assets/images/Map pin location.json'),   grad:['#1D4ED8','#3B82F6'] as const },
  { name:'Eczane',      screen:'PharmacyList', lottie:require('@/assets/images/AR Tablet.json'),          grad:['#9D174D','#EC4899'] as const },
  { name:'Kütüphane',   screen:'LibraryList',  lottie:require('@/assets/images/Books.json'),              grad:['#065F46','#10B981'] as const },
  { name:'Gezi Rotası', screen:'CulturalRoute',lottie:require('@/assets/images/Travel is fun.json'),      grad:['#92400E','#F59E0B'] as const },
];

// Elle düzenlenmiş, daha zengin metinli 4 öne çıkan yer (aynı kalıyor)
const CURATED_LANDMARK_META: Record<string, { year: string; desc: string; tag: string }> = {
  m1: { year: '~12.000 YIL ÖNCE', desc: "Dünyanın bilinen en eski tapınak kompleksi. İnsanlık tarihini yeniden yazan keşif.", tag: 'UNESCO Dünya Mirası' },
  m2: { year: 'HZ. İBRAHİM', desc: "Kutsal balıkların yaşadığı göl. Şanlıurfa'nın kalbinde binlerce yıllık inanç merkezi.", tag: 'Kutsal Alan' },
  m4: { year: 'M.Ö. 3000', desc: "Dünyanın hâlâ yaşayan en eski yerleşim yerlerinden biri. Koni evleriyle özgün mimari.", tag: 'Tarihi Kent' },
  m3: { year: 'M.Ö. 3. YÜZYIL', desc: "Şehre hâkim tarihi kale. Sütunlarından Balıklıgöl'ün panoramik manzarası.", tag: 'Tarihi Yapı' },
};

// Diğer kategoriler için genel etiket (Keşfet'teki 5 kategoriyle aynı)
const LANDMARK_CATEGORY_LABEL: Record<string, string> = {
  historic: 'Tarihi Yer',
  faith: 'İnanç ve Kültür',
  nature: 'Doğa & Manzara',
  museum: 'Müze',
  bazaar: 'Tarihi Çarşı',
};

// Şehri Keşfet banner'ı artık Keşfet'teki TÜM 16 yeri kapsıyor — sadece 4 tanesi değil
const LANDMARKS = MOCK_MAGAZINES.map((m) => {
  const curated = CURATED_LANDMARK_META[m.id];
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

const TICKET_RADIUS = 20;
const TICKET_NOTCH_RADIUS = 8;

/** Genç Kart fırsat kartı — gerçek bilet siluetiyle (SVG kesik) */
function FirsatTicketCard({
  p, th, Icon, discountNum, onPress, cardBg, chipBg, amber, txt1, txt2, ctaBg, ctaTxt, pageBg, isDark,
}: {
  p: FirsatData; th: any; Icon: any; discountNum: string | null; onPress: () => void;
  cardBg: string; chipBg: string; amber: string; txt1: string; txt2: string; ctaBg: string; ctaTxt: string; pageBg: string; isDark: boolean;
}) {
  const [size, setSize] = useState({ width: 152, height: 168 });
  const [notchY, setNotchY] = useState(84);

  return (
    <View
      style={{ marginRight: 12, borderRadius: TICKET_RADIUS, backgroundColor: 'transparent' }}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
    >
      <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
        <Path
          d={buildTicketPath(size.width, size.height, TICKET_RADIUS, notchY, TICKET_NOTCH_RADIUS)}
          fill={cardBg}
          stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,20,0.14)'}
          strokeWidth={1.5}
        />
      </Svg>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={{ width: size.width }}>
        <View style={[s.pCard, { backgroundColor: 'transparent', marginRight: 0, borderRadius: TICKET_RADIUS }]}>
          {/* ÜST: indirim kahraman — ortalı */}
          <View style={s.pHero}>
            <View style={[s.pIconWrap,{backgroundColor:chipBg}]}>
              <Icon color={txt1} size={20} strokeWidth={2} />
            </View>
            {discountNum ? (
              <>
                <Text style={[s.pBigPct,{color:txt1}]}>%{discountNum}</Text>
                <Text style={[s.pBigLabel,{color:txt2}]}>İNDİRİM</Text>
              </>
            ):(
              <Text style={[s.pOfferText,{color:txt1}]} numberOfLines={2}>{p.aciklama || 'Fırsat'}</Text>
            )}
          </View>

          {/* Kesik çizgi — gerçek çentik artık kartın kendi siluetinde */}
          <View style={s.pTearRow} onLayout={(e) => setNotchY(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)}>
            <View style={s.pDashRow}>
              {Array.from({length:10}).map((_,di)=>(
                <View key={di} style={[s.pDashSeg,{backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(17,17,20,0.22)'}]}/>
              ))}
            </View>
          </View>

          {/* ALT: marka + kategori + CTA — ortalı */}
          <Text style={[s.pName,{color:txt1}]} numberOfLines={1}>{p.baslik}</Text>
          <Text style={[s.pKat,{color:txt2}]} numberOfLines={1}>{p.kategori}</Text>
          <View style={[s.pCta,{backgroundColor:ctaBg}]}>
            <Text style={[s.pCtaTxt,{color:ctaTxt}]}>Kuponu Kullan →</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const cardShadowForTicket = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 5 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const { profile, isGuest } = useUser();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [promoModalVisible,setPromoModalVisible]           = useState(true);
  const [promoSize,setPromoSize]                           = useState({width:300,height:220});
  const [promoNotchY,setPromoNotchY]                       = useState(110);
  const [calendarVisible,setCalendarVisible]               = useState(false);
  const [calendarView,setCalendarView]                     = useState<'month'|'year'>('month');
  const [selectedDate,setSelectedDate]                     = useState(new Date());
  const [selectedDay,setSelectedDay]                       = useState<{day:number;specialDay:any;events:any[]}|null>(null);
  const [activeCardIndex,setActiveCardIndex]               = useState(0);
  const [guestModalVisible,setGuestModalVisible]           = useState(false);
  const [firsatlar,setFirsatlar]                           = useState<FirsatData[]>([]);
  const [calendarEvents,setCalendarEvents]                 = useState<CalendarEventItem[]>([]);
  const [loadingFirsatlar,setLoadingFirsatlar]             = useState(true);
  const [refreshing,setRefreshing]                         = useState(false);
  const [weatherData,setWeatherData]                       = useState<any>(null);
  const [forecastData,setForecastData]                     = useState<any>(null);
  const [airQualityData,setAirQualityData]                 = useState<any>(null);

  const [lmIndex, setLmIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const lmFadeAnim = useRef(new Animated.Value(1)).current;

  const lottieRefs = useRef(QUICK_ACCESS.map(() => React.createRef<LottieView>())).current;
  const iconAnims  = useRef(QUICK_ACCESS.map(() => new Animated.Value(0))).current;
  const rainAnim   = useRef(new Animated.Value(0)).current;

  const KOORDINAT       = { lat:37.1674, lon:38.7955 };

  useEffect(() => {
    Animated.stagger(55, iconAnims.map(a => Animated.spring(a,{toValue:1,useNativeDriver:true,tension:100,friction:9}))).start();
    Animated.loop(Animated.timing(rainAnim,{toValue:1,duration:1000,useNativeDriver:true,easing:Easing.linear})).start();
    fetchAllWeatherData(); fetchFirsatlar(); fetchCalendarEvents();

    const interval = setInterval(() => {
      Animated.timing(lmFadeAnim, {toValue:0, duration:300, useNativeDriver:true, easing:Easing.out(Easing.ease)}).start(() => {
        setLmIndex(prev => (prev + 1) % LANDMARKS.length);
        Animated.timing(lmFadeAnim, {toValue:1, duration:400, useNativeDriver:true, easing:Easing.in(Easing.ease)}).start();
      });
    }, 3500);
    return () => clearInterval(interval);
  }, []);

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
      if (data) setFirsatlar(data);
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
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${KOORDINAT.lat}&longitude=${KOORDINAT.lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure` +
        `&hourly=temperature_2m,weather_code,precipitation_probability` +
        `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min` +
        `&timezone=auto&forecast_days=8`;
      const res = await fetch(url);
      const om = await res.json();
      if (om?.current) {
        setWeatherData(toOwmCurrent(om, 'Şanlıurfa'));
        setForecastData(toOwmForecast(om));
      }
    } catch(e){if (__DEV__) console.log(e);}
  };
  const onRefresh = async () => {
    setRefreshing(true); setLoadingFirsatlar(true);
    await Promise.all([fetchAllWeatherData(),fetchFirsatlar(),fetchCalendarEvents()]);
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

  const changeMonth=(d:number)=>{const n=new Date(selectedDate);n.setMonth(n.getMonth()+d);setSelectedDate(n);};
  const changeYear =(d:number)=>{const n=new Date(selectedDate);n.setFullYear(n.getFullYear()+d);setSelectedDate(n);};
  const handleCardScroll=(e:NativeSyntheticEvent<NativeScrollEvent>)=>setActiveCardIndex(Math.round(e.nativeEvent.contentOffset.x/(152+12)));
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
  // ── DENEME: "Lemonade Glass" paleti — Light Blue / Moonstone / Saffron / Gunmetal ──
  // Beğenilmezse GLASS_TRIAL'ı false yap, her şey eski Clean temaya döner.
  const GLASS_TRIAL = false;
  // ŞanlıSosyal kutusuna deneme amaçlı gerçek cam (blur) efekti — Şehri Keşfet eski haline döndü
  const SOSYAL_GLASS = false;
  const PALETTE = {
    lightBlue: '#C3E7F1',
    moonstone: '#519CAB',
    saffron:   '#FFC64F',
    gunmetal:  '#20373B',
  };

  const amber    = GLASS_TRIAL ? PALETTE.saffron : Clean.accent;
  const gold     = GLASS_TRIAL ? PALETTE.saffron : Clean.accent;

  // Light / dark shortcuts — sade tema (Clean)
  const pageBg  = GLASS_TRIAL ? PALETTE.lightBlue : (isDark ? '#0C0C0E' : Clean.bgSoft);
  const cardBg  = GLASS_TRIAL ? 'rgba(255,255,255,0.42)' : (isDark ? '#18181B' : Clean.surface);
  const cardBdr = GLASS_TRIAL ? 'rgba(255,255,255,0.65)' : (isDark ? 'rgba(255,255,255,0.08)' : Clean.border);
  const txt1    = GLASS_TRIAL ? PALETTE.gunmetal : (isDark ? '#F5F5F7' : Clean.textPrimary);
  const txt2    = GLASS_TRIAL ? 'rgba(32,55,59,0.62)' : (isDark ? 'rgba(245,245,247,0.55)' : Clean.textSecondary);
  const ctaBg   = GLASS_TRIAL ? PALETTE.gunmetal : (isDark ? '#F5F5F7' : Clean.ctaBg);
  const ctaTxt  = GLASS_TRIAL ? '#FFFFFF' : (isDark ? '#111114' : Clean.ctaText);
  const chipBg  = GLASS_TRIAL ? 'rgba(255,255,255,0.38)' : (isDark ? '#1F1F23' : Clean.chipBg);

  return (
    <View style={[s.root,{backgroundColor:pageBg}]}>
      {GLASS_TRIAL && (
        <LinearGradient
          colors={[PALETTE.lightBlue, '#DCEEF4', '#EFF8F9']}
          start={{x:0,y:0}} end={{x:0.3,y:1}}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom:130}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={amber} colors={[amber]}/>}
      >

        {/* ═══════════════════════════════════════
            HERO — sade, beyaz zemin, kimlik odaklı
        ═══════════════════════════════════════ */}
        <View style={[s.heroClean, {paddingTop: insets.top + 8, backgroundColor: pageBg}]}>
          <View style={s.heroCleanTop}>
            <Text style={[s.heroCleanGreet,{color:txt1, flex:1}]} numberOfLines={1}>Selam, {profile?.name||'Şanlı Genç'} 👋</Text>
            <View style={[s.heroCleanIcons,{flexShrink:0}]}>
              <TouchableOpacity style={[s.heroCleanIconBtn,{backgroundColor:chipBg}]} onPress={()=>navigation.navigate('Notifications')} activeOpacity={0.8}>
                <Bell color={txt1} size={18} strokeWidth={1.8}/>
                {unreadCount > 0 && (
                  <View style={s.notifBadge}>
                    <Text style={s.notifBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={[s.heroCleanAvatar,{backgroundColor:ctaBg}]} onPress={()=>navigation.navigate('Main',{screen:'Profile' as keyof MainTabParamList})} activeOpacity={0.8}>
                {profile?.avatarUrl ? (
                  <Image source={{uri:profile.avatarUrl}} style={{width:38,height:38,borderRadius:19}}/>
                ) : (
                  <Text style={[s.heroCleanAvatarTxt,{color:ctaTxt}]}>{(profile?.name||'Ş').charAt(0).toUpperCase()}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Hava + takvim pill — kendi satırında, altta */}
          <View style={[s.heroPill,{backgroundColor:chipBg, borderColor:cardBdr, alignSelf:'flex-start'}]}>
            <TouchableOpacity style={s.heroPillSide} onPress={()=>navigation.navigate('WeatherDetail',{weatherData:weatherData||undefined,forecastData:forecastData||undefined,airQualityData:airQualityData||undefined})} activeOpacity={0.8}>
              {getWeatherIcon(15,txt1)}
              <Text style={[s.heroPillTxt,{color:txt1}]}>{tempStr}</Text>
            </TouchableOpacity>
            <View style={[s.heroPillDivider,{backgroundColor:cardBdr}]}/>
            <TouchableOpacity style={s.heroPillSide} onPress={()=>setCalendarVisible(true)} activeOpacity={0.8}>
              <Calendar color={txt1} size={14} strokeWidth={2}/>
              <Text style={[s.heroPillTxt,{color:txt1}]} numberOfLines={1}>{todayStr}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ═══════════════════════════════════════
            ŞANLI SOSYAL — öne çıkan kart
        ═══════════════════════════════════════ */}
        <View style={[s.section,{paddingHorizontal:20}]}>
          {SOSYAL_GLASS ? (
            <View style={[cardOuterShadow, {borderRadius:28}]}>
              <BlurView intensity={85} tint="dark" experimentalBlurMethod="dimezisBlurView" blurReductionFactor={2} style={[cardInnerClip,{borderRadius:28}]}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.16)','rgba(255,255,255,0.02)']}
                  start={{x:0,y:0}} end={{x:1,y:1}}
                  style={StyleSheet.absoluteFill as any}
                  pointerEvents="none"
                />
                <TouchableOpacity activeOpacity={0.88} onPress={handleSosyalPress} style={s.sosyalCard}>
                  <View style={s.sosyalLeft}>
                    <View style={s.sosyalLiveBadge}>
                      <View style={[s.sosyalLiveDot,{backgroundColor:'#22C55E'}]}/>
                      <Text style={[s.sosyalLiveTxt,{color:'#fff'}]}>CANLI</Text>
                    </View>
                    <Text style={[s.sosyalTitle,{color:'#fff'}]}>ŞanlıSosyal</Text>
                    <Text style={[s.sosyalSub,{color:'rgba(255,255,255,0.65)'}]}>Şehir radarı, akış ve{'\n'}kıvılcımlar · son 4 saat</Text>
                  </View>
                  <View style={s.sosyalRight}>
                    <LottieView source={require('@/assets/images/friends.json')} autoPlay loop resizeMode="contain" style={s.sosyalLottie}/>
                  </View>
                </TouchableOpacity>
              </BlurView>
            </View>
          ) : (
          <View style={[cardOuterShadow, cardBorderDark, {backgroundColor:ctaBg, borderRadius:28}]}>
            <TouchableOpacity activeOpacity={0.88} onPress={handleSosyalPress} style={[s.sosyalCard, cardInnerClip, {borderRadius:28}]}>
              <View style={s.sosyalLeft}>
                <View style={s.sosyalLiveBadge}>
                  <View style={[s.sosyalLiveDot,{backgroundColor:'#22C55E'}]}/>
                  <Text style={[s.sosyalLiveTxt,{color:ctaTxt}]}>CANLI</Text>
                </View>
                <Text style={[s.sosyalTitle,{color:ctaTxt}]}>ŞanlıSosyal</Text>
                <Text style={[s.sosyalSub,{color: isDark ? 'rgba(17,17,20,0.6)' : 'rgba(255,255,255,0.6)'}]}>Şehir radarı, akış ve{'\n'}kıvılcımlar · son 4 saat</Text>
              </View>
              <View style={s.sosyalRight}>
                <LottieView source={require('@/assets/images/friends.json')} autoPlay loop resizeMode="contain" style={s.sosyalLottie}/>
              </View>
            </TouchableOpacity>
          </View>
          )}
        </View>

        {/* ═══════════════════════════════════════
            GENÇ KART FIRSATLARI
        ═══════════════════════════════════════ */}
        <View style={s.section}>
          <View style={[s.secRow,{paddingHorizontal:20}]}>
            <Text style={[s.secLabel,{color:txt1}]}>Genç Kart Fırsatları</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('Main',{screen:'GencKart' as keyof MainTabParamList})} activeOpacity={0.7}>
              <Text style={[s.secMore,{color:GLASS_TRIAL?PALETTE.moonstone:txt1}]}>Tümü →</Text>
            </TouchableOpacity>
          </View>

          {loadingFirsatlar?(
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pScroll}>
              {[1,2,3].map(i=>(
                <View key={i} style={[s.pCard,{backgroundColor:cardBg,borderColor:cardBdr}]}>
                  <Skeleton width={44} height={44} borderRadius={14} isDark={isDark}/>
                  <Skeleton width="80%" height={13} borderRadius={6} isDark={isDark}/>
                  <Skeleton width="55%" height={10} borderRadius={6} isDark={isDark}/>
                  <Skeleton width="40%" height={28} borderRadius={10} isDark={isDark}/>
                </View>
              ))}
            </ScrollView>
          ):firsatlar.length===0?(
            <View style={[s.empty,{backgroundColor:cardBg,borderColor:cardBdr}]}>
              <View style={[s.emptyIcon,{backgroundColor:isDark?'rgba(245,158,11,0.1)':'#FEF3C7'}]}>
                <Gift color={amber} size={26}/>
              </View>
              <Text style={[s.emptyTitle,{color:txt1}]}>Bugün öne çıkan fırsat yok</Text>
              <Text style={[s.emptySub,  {color:txt2}]}>Genç Kart ile indirimler yakında</Text>
              <AnimatedPressable onPress={()=>navigation.navigate('Main',{screen:'GencKart' as keyof MainTabParamList})} style={[s.emptyCta,{backgroundColor:isDark?'rgba(245,158,11,0.1)':'#FEF3C7'}]}>
                <Sparkles color={amber} size={15}/>
                <Text style={[s.emptyCtaTxt,{color:txt1}]}>Genç Kart'ı Keşfet</Text>
              </AnimatedPressable>
            </View>
          ):(
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pScroll}
                onScroll={handleCardScroll} scrollEventThrottle={16} snapToInterval={152+12} decelerationRate="fast">
                {firsatlar.map((p,i)=>{
                  const th=getCategoryTheme(p.kategori,p.baslik);const Icon=th.icon;
                  const discountMatch = p.aciklama?.match(/%([\d]+)/);
                  const discountNum   = discountMatch ? discountMatch[1] : null;
                  return(
                    <AnimatedListItem key={p.id} index={i} delay={80}>
                      <FirsatTicketCard
                        p={p} th={th} Icon={Icon} discountNum={discountNum}
                        onPress={()=>navigation.navigate('PartnerDetail',{partnerId:p.id.toString()})}
                        cardBg={cardBg} chipBg={chipBg} amber={amber} txt1={txt1} txt2={txt2}
                        ctaBg={ctaBg} ctaTxt={ctaTxt} pageBg={pageBg} isDark={isDark}
                      />
                    </AnimatedListItem>
                  );
                })}
              </ScrollView>
              <View style={s.dots}>
                {firsatlar.map((_,i)=>(
                  <View key={i} style={[s.dot, i===activeCardIndex&&s.dotA, {backgroundColor:i===activeCardIndex?txt1:(GLASS_TRIAL?'rgba(32,55,59,0.22)':(isDark?'#334155':'#CBD5E1'))}]}/>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ═══════════════════════════════════════
            HIZLI ERİŞİM — 3'lü grid
        ═══════════════════════════════════════ */}
        <View style={[s.section,{paddingHorizontal:20, marginTop:22}]}>
          <View style={s.quickGrid}>
            {QUICK_ACCESS.map((item)=>(
              <TouchableOpacity
                key={item.name}
                activeOpacity={0.85}
                style={s.quickSquareCard}
                onPress={()=>{
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if(item.screen==='Sosyal'){handleSosyalPress();return;}
                  navigation.navigate(item.screen as any);
                }}
              >
                <View style={[s.quickSquareIconWrap,{backgroundColor:'#111114'}]}>
                  <LottieView source={item.lottie} autoPlay loop style={s.quickSquareLottie}/>
                </View>
                <Text style={[s.quickSquareLabel,{color:txt1}]} numberOfLines={1}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════
            ŞEHRİ KEŞFET — dönen öne çıkan banner
        ═══════════════════════════════════════ */}
        <View style={s.section}>
          <View style={[s.secRow,{paddingHorizontal:20}]}>
            <Text style={[s.secLabel,{color:txt1}]}>Şehri Keşfet</Text>
            <TouchableOpacity onPress={()=>navigation.navigate('Magazine')} activeOpacity={0.7}>
              <Text style={[s.secMore,{color:GLASS_TRIAL?PALETTE.moonstone:txt1}]}>Tümü →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={()=>navigation.navigate('HeritageDetail',{id:LANDMARKS[lmIndex].id})} style={{marginHorizontal:20}}>
            {/* DIŞ wrapper — shadow burada, overflow YOK. Kutu sabit, hiç animasyona girmiyor.
                GLASS_TRIAL'da gerçek blur (BlurView) — sadece renkli değil, gerçek buzlu cam. */}
            {(() => {
              const imageSource = typeof LANDMARKS[lmIndex].image === 'string' ? { uri: LANDMARKS[lmIndex].image as string } : LANDMARKS[lmIndex].image;

              // ── GLASS_TRIAL: fotoğraf TÜM kartı kaplar, bilgi paneli fotoğrafın
              // alt kısmına GERÇEKTEN biner — BlurView orada gerçek foto pikselini
              // bulanıklaştırır (iOS Control Center'daki cam düğmeler gibi). ──
              if (GLASS_TRIAL) {
                return (
                  <View style={[cardOuterShadow, {borderRadius:27}]}>
                    <View style={[cardInnerClip, {borderRadius:27}]}>
                      <Animated.View style={{opacity:lmFadeAnim}}>
                        <ImageBackground source={imageSource} style={s.lmImageFull} resizeMode="cover">
                          <LinearGradient colors={['rgba(0,0,0,0.15)','transparent']} style={StyleSheet.absoluteFill as any} pointerEvents="none"/>
                          {/* Sayfalama noktaları — fotoğrafın üstünde yüzen küçük cam kapsül */}
                          <BlurView intensity={70} tint="dark" experimentalBlurMethod="dimezisBlurView" style={s.lmDotsGlass}>
                            <View style={{flexDirection:'row', gap:6}}>
                              {LANDMARKS.map((_,i)=>(
                                <TouchableOpacity key={i} onPress={()=>{
                                  Animated.timing(lmFadeAnim,{toValue:0,duration:200,useNativeDriver:true}).start(()=>{
                                    setLmIndex(i);
                                    Animated.timing(lmFadeAnim,{toValue:1,duration:300,useNativeDriver:true}).start();
                                  });
                                }}>
                                  <View style={[s.lmDot, i===lmIndex&&s.lmDotA]}/>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </BlurView>

                          {/* Bilgi paneli — fotoğrafın alt kısmına BİNİYOR, gerçek foto pikselini bulanıklaştırıyor */}
                          <BlurView
                            intensity={80}
                            tint="dark"
                            experimentalBlurMethod="dimezisBlurView"
                            blurReductionFactor={2}
                            style={s.lmGlassPanel}
                          >
                            <LinearGradient
                              colors={['rgba(255,255,255,0.22)','rgba(255,255,255,0.04)']}
                              start={{x:0,y:0}} end={{x:0,y:1}}
                              style={StyleSheet.absoluteFill as any}
                              pointerEvents="none"
                            />
                            <View style={s.lmBannerBody}>
                              <Text style={[s.lmBannerName,{color:'#fff'}]}>{LANDMARKS[lmIndex].name}</Text>
                              <View style={s.lmBannerSubRow}>
                                <MapPin color="rgba(255,255,255,0.75)" size={12} strokeWidth={2.2}/>
                                <Text style={[s.lmBannerSub,{color:'rgba(255,255,255,0.75)'}]} numberOfLines={1}>{LANDMARKS[lmIndex].tag}{LANDMARKS[lmIndex].year ? ` · ${LANDMARKS[lmIndex].year}` : ''}</Text>
                              </View>
                              <View style={s.lmBannerBottomRow}>
                                <Text style={[s.lmBannerDesc,{color:'rgba(255,255,255,0.75)'}]} numberOfLines={2}>{LANDMARKS[lmIndex].desc}</Text>
                                <View style={[s.lmArrowBtn,{backgroundColor:PALETTE.saffron}]}>
                                  <ArrowUpRight color={PALETTE.gunmetal} size={18} strokeWidth={2.4}/>
                                </View>
                              </View>
                            </View>
                          </BlurView>
                        </ImageBackground>
                      </Animated.View>
                    </View>
                  </View>
                );
              }

              return (
                <View style={[cardOuterShadow, isDark ? cardBorderDark : cardBorderLight, {
                  backgroundColor:cardBg, borderRadius:26,
                }]}>
                  <View style={[cardInnerClip, {borderRadius:26}]}>
                    <Animated.View style={{opacity:lmFadeAnim}}>
                      <View style={s.lmImageWrap}>
                        <ImageBackground source={imageSource} style={s.lmImage} imageStyle={s.lmImageRadius} resizeMode="cover">
                          <LinearGradient colors={['transparent','rgba(0,0,0,0.32)']} style={[StyleSheet.absoluteFill as any, s.lmImageRadius]} />
                          <View style={s.lmDots}>
                            {LANDMARKS.map((_,i)=>(
                              <TouchableOpacity key={i} onPress={()=>{
                                Animated.timing(lmFadeAnim,{toValue:0,duration:200,useNativeDriver:true}).start(()=>{
                                  setLmIndex(i);
                                  Animated.timing(lmFadeAnim,{toValue:1,duration:300,useNativeDriver:true}).start();
                                });
                              }}>
                                <View style={[s.lmDot, i===lmIndex&&s.lmDotA]}/>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </ImageBackground>
                      </View>
                      <View style={s.lmBannerBody}>
                        <Text style={[s.lmBannerName,{color:txt1}]}>{LANDMARKS[lmIndex].name}</Text>
                        <View style={s.lmBannerSubRow}>
                          <MapPin color={txt2} size={12} strokeWidth={2.2}/>
                          <Text style={[s.lmBannerSub,{color:txt2}]} numberOfLines={1}>{LANDMARKS[lmIndex].tag}{LANDMARKS[lmIndex].year ? ` · ${LANDMARKS[lmIndex].year}` : ''}</Text>
                        </View>
                        <View style={s.lmBannerBottomRow}>
                          <Text style={[s.lmBannerDesc,{color:txt2}]} numberOfLines={2}>{LANDMARKS[lmIndex].desc}</Text>
                          <View style={[s.lmArrowBtn,{backgroundColor:'#111114'}]}>
                            <ArrowUpRight color="#fff" size={18} strokeWidth={2.2}/>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
                  </View>
                </View>
              );
            })()}
          </TouchableOpacity>
        </View>

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
              <Text style={[s.mBadgeTxt,{color:isDark?'#bae6fd':'#1d4ed8'}]}>ŞanlıSosyal</Text>
            </View>
            <Text style={[s.mTitle,isDark&&{color:'#f8fafc'}]}>Giriş Yapman Gerekiyor</Text>
            <Text style={[s.mSub,isDark&&{color:'#cbd5e1'}]}>ŞanlıSosyal'e erişmek için hesabınla giriş yapman gerekiyor.</Text>
            <View style={s.mRow}>
              <TouchableOpacity style={[s.mSec,isDark&&{backgroundColor:'#1e293b'}]} onPress={()=>setGuestModalVisible(false)}>
                <Text style={[s.mSecTxt,isDark&&{color:'#cbd5e1'}]}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mPri,isDark&&{backgroundColor:'#0ea5e9'}]} onPress={handleGuestLogin}>
                <Text style={s.mPriTxt}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
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
                  stroke={isDark ? 'rgba(255,255,255,0.16)' : 'rgba(17,17,20,0.14)'}
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
                    <View style={[s.promoIconCircle,{backgroundColor:isDark?'rgba(242,96,12,0.18)':'#fff'}]}><Tag color={amber} size={20}/></View>
                    <Text style={[s.promoEyebrow,{color:txt2}]}>GENÇ KART İNDİRİMİ</Text>
                  </View>

                  <View style={s.promoHero}>
                    <Text style={[s.promoBigPct,{color:txt1}]}>%20</Text>
                    <Text style={[s.pBigLabel,{color:txt1}]}>İNDİRİM</Text>
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
                  <Text style={[s.promoBigName,{color:txt1}]} numberOfLines={1}>Bugüne Özel İndirim</Text>
                  <Text style={[s.promoBigKat,{color:txt2}]} numberOfLines={2}>Seçili kafelerde %20'ye varan öğrenci indirimi</Text>
                  <View style={[s.pCta,{backgroundColor:amber, paddingVertical:13}]}>
                    <Text style={[s.pCtaTxt,{color:'#fff', fontSize:13.5}]}>Genç Kart'ta Görüntüle →</Text>
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
                    <Text style={{fontSize:14,fontWeight:'700',color:txt1,marginBottom:12}}>Bu Aydaki Özel Günler</Text>
                    {(()=>{
                      const list=Object.entries(SPECIAL_DAYS).filter(([k])=>Number(k.split('-')[0])===selectedDate.getMonth()+1).sort((a,b)=>Number(a[0].split('-')[1])-Number(b[0].split('-')[1]));
                      if(!list.length)return<Text style={{fontSize:13,color:txt2,fontStyle:'italic'}}>Bu ayda özel gün bulunmuyor</Text>;
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
                <Text style={[s.calEvBtnTxt,{color:ctaTxt}]}>Etkinliklere Git</Text>
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
  heroCleanGreet: {fontSize:23, fontWeight:'800', letterSpacing:-0.4},
  heroCleanTop:   {flexDirection:'row', alignItems:'center', gap:12},
  heroCleanIcons: {flexDirection:'row', alignItems:'center', gap:10, marginRight:Platform.OS==='ios'?11:8},
  heroCleanIconBtn:{width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', position:'relative'},
  notifBadge:{position:'absolute', top:-2, right:-2, minWidth:16, height:16, borderRadius:8, backgroundColor:'#111114', alignItems:'center', justifyContent:'center', paddingHorizontal:3, borderWidth:1.5, borderColor:'#fff'},
  notifBadgeTxt:{color:'#fff', fontSize:9, fontWeight:'800'},
  heroCleanAvatar:{width:40, height:40, borderRadius:20, alignItems:'center', justifyContent:'center', overflow:'hidden'},
  heroCleanAvatarTxt:{fontSize:16, fontWeight:'800'},
  quickGrid:      {flexDirection:'row', flexWrap:'wrap', rowGap:18},
  quickSquareCard:{alignItems:'center', width:'33.33%', gap:6},
  quickSquareIconWrap:{width:56, height:56, borderRadius:18, alignItems:'center', justifyContent:'center', overflow:'hidden'},
  quickSquareLottie:{width:36, height:36},
  quickSquareLabel:{fontSize:11, fontWeight:'700', textAlign:'center'},

  heroPill:   {flexDirection:'row', alignSelf:'flex-start', borderRadius:999, borderWidth:1, overflow:'hidden'},
  heroPillSide:{flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:11, paddingVertical:6},
  heroPillTxt: {fontSize:12.5, fontWeight:'700'},
  heroPillDesc:{fontSize:10, fontWeight:'500', textTransform:'capitalize'},
  heroPillDivider:{width:1, marginVertical:6},

  // Section
  section:{marginTop:30},
  secRow: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingHorizontal:20},
  secTitleWrap:{flexDirection:'row', alignItems:'center', gap:9},
  secBar:  {width:4, height:20, borderRadius:2},
  secLabel:{fontSize:18, fontWeight:'800', letterSpacing:-0.2},
  secMore: {fontSize:13, fontWeight:'700'},

  // Landmarks — kart anatomisi: görsel üstte, içerik altta
  lmCard:      {borderRadius:20, overflow:'hidden',
    shadowOffset:{width:0,height:6}, shadowOpacity:0.08, shadowRadius:16, elevation:3},
  lmImageWrap: {padding:10},
  lmImage:     {height:180, justifyContent:'flex-end', overflow:'hidden'},
  lmImageRadius:{borderRadius:18},
  // GLASS_TRIAL — fotoğraf tüm kartı kaplar, bilgi paneli fotoğrafın üstüne biner
  lmImageFull: {height:290, justifyContent:'flex-end'},
  lmDotsGlass: {flexDirection:'row', alignSelf:'flex-end', margin:14, paddingHorizontal:10, paddingVertical:7, borderRadius:14, overflow:'hidden'},
  lmGlassPanel:{margin:10, marginTop:-56, borderRadius:20, overflow:'hidden'},
  lmBannerBody:{gap:6, padding:16, paddingTop:12},
  lmBannerName:{fontSize:19, fontWeight:'800', letterSpacing:-0.3},
  lmBannerSubRow:{flexDirection:'row', alignItems:'center', gap:5},
  lmBannerSub: {fontSize:12.5, fontWeight:'600'},
  lmBannerBottomRow:{flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', gap:12, marginTop:4},
  lmBannerDesc:{fontSize:12.5, lineHeight:18, flex:1},
  lmArrowBtn:  {width:38, height:38, borderRadius:19, alignItems:'center', justifyContent:'center'},
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
  sosyalLeft:   {flex:1, gap:6},
  sosyalLiveBadge:{flexDirection:'row', alignItems:'center', gap:5, alignSelf:'flex-start', backgroundColor:'rgba(255,255,255,0.12)', paddingHorizontal:10, paddingVertical:4, borderRadius:999, borderWidth:1, borderColor:'rgba(255,255,255,0.2)'},
  sosyalLiveDot:{width:7, height:7, borderRadius:3.5, backgroundColor:'#4ADE80'},
  sosyalLiveTxt:{fontSize:11, fontWeight:'800', color:'#fff', letterSpacing:0.6},
  sosyalTitle:  {fontSize:26, fontWeight:'800', color:'#fff', letterSpacing:-0.4},
  sosyalSub:    {fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:'500', lineHeight:19},
  sosyalRight:  {width:100, height:100, alignItems:'center', justifyContent:'center'},
  sosyalLottie: {width:100, height:100, backgroundColor:'transparent'},

  // Partners — kupon / bilet tasarımı
  pScroll:   {paddingHorizontal:20, paddingVertical:14},
  pCard:     {width:152, borderRadius:20, paddingHorizontal:13, paddingTop:13, paddingBottom:13, marginRight:12, height:188, overflow:'hidden'},
  pHero:     {flex:1, alignItems:'center', justifyContent:'center', paddingTop:4},
  pIconWrap: {width:40, height:40, borderRadius:12, justifyContent:'center', alignItems:'center', marginBottom:8},
  pBigPct:   {fontSize:34, lineHeight:36, fontWeight:'900', color:'#fff', letterSpacing:-1},
  pBigLabel: {fontSize:9, fontWeight:'800', color:'rgba(255,255,255,0.9)', letterSpacing:2, marginTop:-2},
  pBigFirsat:{fontSize:22, fontWeight:'900', color:'#fff', letterSpacing:0.5, paddingVertical:6},
  pOfferText:{fontSize:15, fontWeight:'800', color:'#fff', letterSpacing:-0.2, textAlign:'center', paddingHorizontal:2},
  pTearRow:  {flexDirection:'row', alignItems:'center', height:14, marginVertical:8, marginHorizontal:-13},
  pNotchWrapLeft:  {position:'absolute', left:0, top:0, width:7, height:14, overflow:'hidden', zIndex:5},
  pNotchWrapRight: {position:'absolute', right:0, top:0, width:7, height:14, overflow:'hidden', zIndex:5},
  pNotchCircle: {position:'absolute', top:0, width:14, height:14, borderRadius:7},
  pDashRow:  {flex:1, flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:13},
  pDashSeg:  {width:6, height:2, borderRadius:1, backgroundColor:'rgba(255,255,255,0.6)'},
  pName:     {fontSize:13, fontWeight:'800', color:'#fff', textAlign:'center'},
  pKat:      {fontSize:10, fontWeight:'700', letterSpacing:0.3, color:'rgba(255,255,255,0.82)', marginTop:1, marginBottom:8, textAlign:'center'},
  pCta:      {alignSelf:'stretch', paddingVertical:7, borderRadius:10, backgroundColor:'#fff', alignItems:'center'},
  pCtaTxt:   {fontSize:11, fontWeight:'800'},
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
