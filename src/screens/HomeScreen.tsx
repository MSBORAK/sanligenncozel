import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ImageBackground,
  TouchableOpacity, Modal, Platform, Animated, Easing,
  NativeSyntheticEvent, NativeScrollEvent, RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar, BookOpen, Search, X, ChevronLeft, ChevronRight, Sparkles,
  CloudRain, Sun, Cloud, CloudSnow, CloudLightning, CloudDrizzle,
  Tag, Coffee, Shirt, Smartphone, Ticket, GraduationCap, Gift, Bell,
  Pill, Library, Route, Radio, MapPin,
} from 'lucide-react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import AnimatedPressable from '@/components/AnimatedPressable';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import { MOCK_BUSES } from '@/api/mockData';
import { HomeScreenProps, MainTabParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

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

const LANDMARKS = [
  {
    name: 'Göbeklitepe',
    year: '~12.000 YIL ÖNCE',
    desc: "Dünyanın bilinen en eski tapınak kompleksi. İnsanlık tarihini yeniden yazan keşif.",
    tag: 'UNESCO Dünya Mirası',
    watermark: '12K',
    c: ['rgba(28,10,0,0.55)','rgba(124,45,18,0.72)','rgba(146,64,14,0.88)'] as const,
    image: require('@/assets/images/gobeklitepe.jpg'),
  },
  {
    name: 'Balıklıgöl',
    year: 'HZ. İBRAHİM',
    desc: "Kutsal balıkların yaşadığı göl. Şanlıurfa'nın kalbinde binlerce yıllık inanç merkezi.",
    tag: 'Kutsal Alan',
    watermark: 'GOL',
    c: ['rgba(12,26,46,0.45)','rgba(30,58,95,0.68)','rgba(29,78,216,0.82)'] as const,
    image: require('@/assets/images/balikligol.jpg'),
  },
  {
    name: 'Harran',
    year: 'M.Ö. 3000',
    desc: "Dünyanın hâlâ yaşayan en eski yerleşim yerlerinden biri. Koni evleriyle özgün mimari.",
    tag: 'Tarihi Kent',
    watermark: '3K',
    c: ['rgba(28,10,0,0.45)','rgba(120,53,15,0.65)','rgba(180,83,9,0.85)'] as const,
    image: require('@/assets/images/harran.jpg'),
  },
  {
    name: 'Urfa Kalesi',
    year: 'M.Ö. 3. YÜZYIL',
    desc: "Şehre hâkim tarihi kale. Sütunlarından Balıklıgöl'ün panoramik manzarası.",
    tag: 'Tarihi Yapı',
    watermark: 'KALE',
    c: ['rgba(26,5,51,0.45)','rgba(76,29,149,0.65)','rgba(109,40,217,0.82)'] as const,
    image: require('@/assets/images/urfakalesi.jpg'),
  },
];

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

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const { profile, isGuest } = useUser();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [promoModalVisible,setPromoModalVisible]           = useState(true);
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
  const lmFadeAnim = useRef(new Animated.Value(1)).current;

  const lottieRefs = useRef(QUICK_ACCESS.map(() => React.createRef<LottieView>())).current;
  const iconAnims  = useRef(QUICK_ACCESS.map(() => new Animated.Value(0))).current;
  const rainAnim   = useRef(new Animated.Value(0)).current;

  const API_KEY         = process.env.EXPO_PUBLIC_OPENWEATHER_KEY ?? '';
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

  const fetchFirsatlar = async () => {
    try {
      const {data} = await supabase.from('firsatlar').select('*').order('created_at',{ascending:false});
      if (data) setFirsatlar(data);
    } catch(e){console.log(e);} finally {setLoadingFirsatlar(false);}
  };
  const fetchCalendarEvents = async () => {
    try {
      const {data} = await supabase.from('etkinlikler').select('id,baslik,tarih,konum,kategori').order('created_at',{ascending:false});
      setCalendarEvents((data||[]).map((i:any)=>({id:i.id?.toString()||'',title:i.baslik||'Etkinlik',date:i.tarih||'',location:i.konum||'',category:i.kategori||'Etkinlik'})));
    } catch(e){console.log(e);}
  };
  const fetchAllWeatherData = async () => {
    try {
      const [w,f,a] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${KOORDINAT.lat}&lon=${KOORDINAT.lon}&units=metric&lang=tr&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${KOORDINAT.lat}&lon=${KOORDINAT.lon}&units=metric&lang=tr&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${KOORDINAT.lat}&lon=${KOORDINAT.lon}&appid=${API_KEY}`),
      ]);
      const wj=await w.json(); const fj=await f.json(); const aj=await a.json();
      if(wj.cod===200) setWeatherData(wj);
      if(fj.cod==='200') setForecastData(fj);
      if(aj.list) setAirQualityData(aj);
    } catch(e){console.log(e);}
  };
  const onRefresh = async () => {
    setRefreshing(true); setLoadingFirsatlar(true);
    await Promise.all([fetchAllWeatherData(),fetchFirsatlar(),fetchCalendarEvents()]);
    setRefreshing(false);
  };

  const getWeatherIcon = (sz=20,col='#FCD34D') => {
    if (!weatherData) return <Cloud color={col} size={sz}/>;
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
  const getCategoryTheme=(k:string|null|undefined)=>{
    if(!k)return{icon:Gift,color:'#fb923c',bg:'#ffedd5',bgDark:'#3a2a1c',grad:['#fb923c','#ea580c'] as [string,string]};
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
  const handleCardScroll=(e:NativeSyntheticEvent<NativeScrollEvent>)=>setActiveCardIndex(Math.round(e.nativeEvent.contentOffset.x/(170+12)));
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
  const tempStr  = weatherData?`${Math.round(weatherData.main.temp)}°C`:'--°C';
  const amber    = '#F59E0B';
  const gold     = '#FCD34D';

  // Light / dark shortcuts
  const pageBg  = isDark ? '#09070A' : '#FAF7F2';
  const cardBg  = isDark ? 'rgba(255,255,255,0.055)' : '#FFFFFF';
  const cardBdr = isDark ? 'rgba(255,255,255,0.09)'  : 'rgba(0,0,0,0.07)';
  const txt1    = isDark ? '#F9F8F6' : '#1A1208';
  const txt2    = isDark ? 'rgba(249,248,246,0.42)' : '#A3A09A';

  return (
    <View style={[s.root,{backgroundColor:pageBg}]}>


      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom:130}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={amber} colors={[amber]}/>}
      >

        {/* ═══════════════════════════════════════
            HERO — fotoğraf + kimlik
        ═══════════════════════════════════════ */}
        <View style={[s.hero, {height: 272 + insets.top}]}>
          <ImageBackground
            source={require('@/assets/images/homebackg.jpg')}
            style={StyleSheet.absoluteFill}
            imageStyle={{resizeMode:'cover'}}
          />
          <LinearGradient
            colors={isDark
              ? ['rgba(9,7,10,0.15)','rgba(9,7,10,0.55)','rgba(9,7,10,0.92)','rgba(9,7,10,1)']
              : ['rgba(180,83,9,0.55)','rgba(146,64,14,0.75)','rgba(250,247,242,0.98)']}
            locations={isDark ? [0, 0.45, 0.78, 1] : undefined}
            style={[s.heroGrad, {paddingTop: insets.top + 14}]}
          >
            {/* Üst satır — sadece ikonlar */}
            <View style={s.heroTop}>
              <View style={s.heroIcons}>
                <TouchableOpacity style={s.heroIconBtn} onPress={()=>navigation.navigate('Notifications')} activeOpacity={0.8}>
                  <Bell color="#fff" size={19} strokeWidth={1.8}/>
                </TouchableOpacity>
                <TouchableOpacity style={s.heroIconBtn} onPress={()=>navigation.navigate('GlobalSearch')} activeOpacity={0.8}>
                  <Search color="#fff" size={19} strokeWidth={1.8}/>
                </TouchableOpacity>
              </View>
            </View>

            {/* Selamlama */}
            <View style={s.heroBody}>
              <Text style={s.heroGreet}>Selam, {profile?.name||'Şanlı Genç'} 👋</Text>
              <Text style={s.heroSub}>Urfa'da bugün ne var ne yok, hepsi burada.</Text>

              {/* Hava + takvim pill */}
              <View style={s.heroPill}>
                <TouchableOpacity style={s.heroPillSide} onPress={()=>navigation.navigate('WeatherDetail',{weatherData:weatherData||undefined,forecastData:forecastData||undefined,airQualityData:airQualityData||undefined})} activeOpacity={0.8}>
                  {getWeatherIcon(15,gold)}
                  <Text style={s.heroPillTxt}>{tempStr}</Text>
                  {weatherData&&<Text style={s.heroPillDesc}>{weatherData.weather[0].description}</Text>}
                </TouchableOpacity>
                <View style={s.heroPillDivider}/>
                <TouchableOpacity style={s.heroPillSide} onPress={()=>setCalendarVisible(true)} activeOpacity={0.8}>
                  <Calendar color={gold} size={14} strokeWidth={2}/>
                  <Text style={s.heroPillTxt}>{todayStr}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Hero → içerik geçiş fader */}
        <LinearGradient
          colors={isDark
            ? ['rgba(9,7,10,1)', pageBg as string]
            : [pageBg as string, pageBg as string]}
          style={{ height: isDark ? 12 : 20, marginTop: -1 }}
          pointerEvents="none"
        />

        {/* ═══════════════════════════════════════
            ŞEHRİ KEŞFET — dönen öne çıkan banner
        ═══════════════════════════════════════ */}
        <View style={s.section}>
          <View style={[s.secRow,{paddingHorizontal:20}]}>
            <View style={s.secTitleWrap}>
              <View style={[s.secBar,{backgroundColor:'#F59E0B'}]}/>
              <Text style={[s.secLabel,{color:txt1}]}>Şehri Keşfet</Text>
            </View>
            <TouchableOpacity onPress={()=>navigation.navigate('CulturalRoute')} activeOpacity={0.7}>
              <Text style={[s.secMore,{color:amber}]}>Tümü →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={0.88} onPress={()=>navigation.navigate('CulturalRoute')} style={{marginHorizontal:20}}>
            <Animated.View style={{opacity:lmFadeAnim}}>
              <ImageBackground
                source={LANDMARKS[lmIndex].image}
                style={s.lmBanner}
                imageStyle={{borderRadius:20}}
                resizeMode="cover"
              >
                <LinearGradient colors={LANDMARKS[lmIndex].c} style={StyleSheet.absoluteFill as any} />
                {/* Watermark */}
                <Text style={s.lmWatermark}>{LANDMARKS[lmIndex].watermark}</Text>
                {/* Tag badge */}
                <View style={s.lmTag}>
                  <MapPin color="rgba(255,255,255,0.8)" size={10} strokeWidth={2.5}/>
                  <Text style={s.lmTagTxt}>{LANDMARKS[lmIndex].tag}</Text>
                </View>
                {/* Content */}
                <View style={s.lmBannerBody}>
                  <Text style={s.lmBannerYear}>{LANDMARKS[lmIndex].year}</Text>
                  <Text style={s.lmBannerName}>{LANDMARKS[lmIndex].name}</Text>
                  <Text style={s.lmBannerDesc} numberOfLines={2}>{LANDMARKS[lmIndex].desc}</Text>
                </View>
                {/* Pagination dots */}
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
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════
            ŞANLI SOSYAL — öne çıkan kart
        ═══════════════════════════════════════ */}
        <View style={[s.section,{paddingHorizontal:20}]}>
          <TouchableOpacity activeOpacity={0.88} onPress={handleSosyalPress}>
            <LinearGradient
              colors={isDark ? ['#1A0800','#2D0E00','#1A0500'] : ['#7C1D00','#B22A00','#CC3300']}
              start={{x:0,y:0}} end={{x:1,y:1}}
              style={s.sosyalCard}
            >
              <View style={s.sosyalOrb} pointerEvents="none"/>
              <View style={s.sosyalLeft}>
                <View style={s.sosyalLiveBadge}>
                  <View style={s.sosyalLiveDot}/>
                  <Text style={s.sosyalLiveTxt}>CANLI</Text>
                </View>
                <Text style={s.sosyalTitle}>ŞanlıSosyal</Text>
                <Text style={s.sosyalSub}>Şehir radarı, akış ve{'\n'}kıvılcımlar · son 4 saat</Text>
              </View>
              <View style={s.sosyalRight}>
                <LottieView source={require('@/assets/images/friends.json')} autoPlay loop resizeMode="contain" style={s.sosyalLottie}/>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════════════════════════
            HIZLI ERİŞİM — 3×2 renkli daire grid
        ═══════════════════════════════════════ */}
        <View style={s.section}>
          <View style={[s.secRow,{paddingHorizontal:20}]}>
            <View style={s.secTitleWrap}>
              <View style={[s.secBar,{backgroundColor:'#F97316'}]}/>
              <Text style={[s.secLabel,{color:txt1}]}>Hızlı Erişim</Text>
            </View>
          </View>
          <View style={s.iconGrid}>
            {QUICK_ACCESS.map((item,i)=>(
              <Animated.View key={item.name} style={[s.iconCell,{
                opacity:iconAnims[i],
                transform:[{scale:iconAnims[i].interpolate({inputRange:[0,1],outputRange:[0.7,1]})}],
              }]}>
                <AnimatedPressable
                  scaleTo={0.9}
                  style={s.iconTouch}
                  onPress={()=>{
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    lottieRefs[i].current?.play();
                    if(item.screen==='Sosyal'){handleSosyalPress();return;}
                    navigation.navigate(item.screen as any);
                  }}
                >
                  {/* Renkli daire */}
                  <LinearGradient colors={item.grad} style={s.iconCircle}>
                    <LottieView
                      ref={lottieRefs[i]}
                      source={item.lottie}
                      autoPlay loop
                      resizeMode="contain"
                      style={s.iconLottie}
                    />
                  </LinearGradient>
                  <Text style={[s.iconLabel,{color:txt1}]} numberOfLines={1}>{item.name}</Text>
                </AnimatedPressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ═══════════════════════════════════════
            GENÇ KART FIRSATLARI
        ═══════════════════════════════════════ */}
        <View style={s.section}>
          <View style={[s.secRow,{paddingHorizontal:20}]}>
            <View style={s.secTitleWrap}>
              <View style={[s.secBar,{backgroundColor:'#FB7185'}]}/>
              <Text style={[s.secLabel,{color:txt1}]}>Genç Kart Fırsatları</Text>
            </View>
            <TouchableOpacity onPress={()=>navigation.navigate('Main',{screen:'GencKart' as keyof MainTabParamList})} activeOpacity={0.7}>
              <Text style={[s.secMore,{color:amber}]}>Tümü →</Text>
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
                <Text style={[s.emptyCtaTxt,{color:amber}]}>Genç Kart'ı Keşfet</Text>
              </AnimatedPressable>
            </View>
          ):(
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pScroll}
                onScroll={handleCardScroll} scrollEventThrottle={16} snapToInterval={192+12} decelerationRate="fast">
                {firsatlar.map((p,i)=>{
                  const th=getCategoryTheme(p.kategori);const Icon=th.icon;
                  const discountMatch = p.aciklama?.match(/%([\d]+)/);
                  const discountNum   = discountMatch ? discountMatch[1] : null;
                  return(
                    <AnimatedListItem key={p.id} index={i} delay={80}>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={()=>navigation.navigate('PartnerDetail',{partnerId:p.id.toString()})}
                      >
                        <LinearGradient
                          colors={th.grad}
                          start={{x:0,y:0}} end={{x:1,y:1}}
                          style={s.pCard}
                        >
                          {/* Köşe ikonu */}
                          <View style={s.pIconMini}><Icon color="#fff" size={15}/></View>

                          {/* ÜST: indirim kahraman — ortalı */}
                          <View style={s.pHero}>
                            {discountNum ? (
                              <>
                                <Text style={s.pBigPct}>%{discountNum}</Text>
                                <Text style={s.pBigLabel}>İNDİRİM</Text>
                              </>
                            ):(
                              <Text style={s.pBigFirsat}>FIRSAT</Text>
                            )}
                          </View>

                          {/* Bilet çentiği + kesik çizgi */}
                          <View style={s.pTearRow}>
                            <View style={[s.pNotch,{left:-9,backgroundColor:pageBg}]}/>
                            <View style={s.pDashRow}>
                              {Array.from({length:13}).map((_,di)=>(
                                <View key={di} style={s.pDashSeg}/>
                              ))}
                            </View>
                            <View style={[s.pNotch,{right:-9,backgroundColor:pageBg}]}/>
                          </View>

                          {/* ALT: marka + kategori + CTA — ortalı */}
                          <Text style={s.pName} numberOfLines={1}>{p.baslik}</Text>
                          <Text style={s.pKat} numberOfLines={1}>{p.kategori}</Text>
                          <View style={s.pCta}>
                            <Text style={[s.pCtaTxt,{color:th.grad[1]}]}>Kuponu Kullan →</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </AnimatedListItem>
                  );
                })}
              </ScrollView>
              <View style={s.dots}>
                {firsatlar.map((_,i)=>(
                  <View key={i} style={[s.dot, i===activeCardIndex&&s.dotA, {backgroundColor:i===activeCardIndex?amber:(isDark?'#334155':'#CBD5E1')}]}/>
                ))}
              </View>
            </>
          )}
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

      {/* Promo modal */}
      <Modal visible={promoModalVisible} animationType="fade" transparent onRequestClose={()=>setPromoModalVisible(false)}>
        <View style={s.mBack}>
          <View style={[s.promoCard,isDark&&{backgroundColor:'#0f172a',borderColor:'rgba(148,163,184,0.24)'}]}>
            <TouchableOpacity style={[s.promoClose,isDark&&{backgroundColor:'rgba(15,23,42,0.72)',borderWidth:1,borderColor:'rgba(148,163,184,0.35)'}]} onPress={()=>setPromoModalVisible(false)}>
              <X color={isDark?'#f8fafc':'#475569'} size={15}/>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.92} onPress={()=>{setPromoModalVisible(false);navigation.navigate('Main',{screen:'GencKart' as keyof MainTabParamList});}}>
              <Image source={require('@/assets/images/_ (2).jpeg')} style={s.promoImg}/>
              <View style={s.promoBody}>
                <Text style={[s.promoTitle,isDark&&{color:'#f8fafc'}]}>Bugüne Özel İndirim</Text>
                <Text style={[s.promoSub,isDark&&{color:'#cbd5e1'}]}>Seçili kafelerde %20'ye varan öğrenci indirimi hazır.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Takvim modal */}
      <Modal visible={calendarVisible} animationType="slide" transparent onRequestClose={()=>setCalendarVisible(false)}>
        <View style={s.calBack}>
          <View style={[s.calCard,isDark&&{backgroundColor:'#1e293b'}]}>
            <View style={s.calHead}>
              <Text style={[s.calTitle,isDark&&{color:'#f8fafc'}]}>{calendarView==='month'?'Aylık Takvim':'Yıllık Takvim'}</Text>
              <TouchableOpacity onPress={()=>setCalendarVisible(false)} style={{padding:8}}>
                <X color={isDark?'#94a3b8':'#6b7280'} size={22}/>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:20}}>
              <View style={[s.calTogWrap,isDark&&{backgroundColor:'#0f172a'}]}>
                {(['month','year'] as const).map(v=>(
                  <TouchableOpacity key={v} style={[s.calTogBtn,calendarView===v&&[s.calTogBtnA,isDark&&{backgroundColor:amber}]]} onPress={()=>setCalendarView(v)}>
                    <Text style={[s.calTogTxt,calendarView===v&&s.calTogTxtA,isDark&&calendarView!==v&&{color:'#94a3b8'}]}>{v==='month'?'Aylık':'Yıllık'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {calendarView==='month'&&(
                <View style={{marginBottom:20}}>
                  <View style={s.calNav}>
                    <TouchableOpacity onPress={()=>changeMonth(-1)} style={{padding:8}}><ChevronLeft color={isDark?'#94a3b8':'#6b7280'} size={22}/></TouchableOpacity>
                    <Text style={[s.calMonthLbl,isDark&&{color:'#f8fafc'}]}>{MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={()=>changeMonth(1)} style={{padding:8}}><ChevronRight color={isDark?'#94a3b8':'#6b7280'} size={22}/></TouchableOpacity>
                  </View>
                  <View style={s.calDayNames}>
                    {DAYS.map(d=><Text key={d} style={[s.calDayNm,isDark&&{color:'#94a3b8'}]}>{d}</Text>)}
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
                              isToday&&[s.calDayToday,isDark&&{backgroundColor:amber}],
                              specialDay&&!isToday&&{backgroundColor:specialDay.color+'20',borderWidth:1.5,borderColor:specialDay.color},
                              !specialDay&&dailyEvents.length>0&&!isToday&&{backgroundColor:amber+'22',borderWidth:1,borderColor:amber,borderStyle:'dashed'},
                            ]}>
                              <Text style={[s.calDayTxt,isToday&&s.calDayTodayTxt,isDark&&!isToday&&{color:'#f8fafc'},specialDay&&!isToday&&{color:specialDay.color,fontWeight:'bold'}]}>{day}</Text>
                              <View style={{flexDirection:'row',alignItems:'center',marginTop:-2}}>
                                {specialDay&&<Text style={{fontSize:8}}>{specialDay.emoji}</Text>}
                                {dailyEvents.length>0&&<View style={[s.evDot,isDark&&{backgroundColor:amber}]}/>}
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
                            <Text style={{fontSize:12,color:isDark?'#94a3b8':'#6b7280',marginTop:2}}>{selectedDay.day} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                      {selectedDay.events.map((ev,i)=>(
                        <TouchableOpacity key={i} style={[s.evCard,isDark&&{backgroundColor:'#334155'}]} onPress={()=>{setCalendarVisible(false);navigation.navigate('Events');}}>
                          <View style={[s.evCardIco,{backgroundColor:isDark?'rgba(245,158,11,0.12)':'#FEF3C7'}]}>
                            <Calendar color={amber} size={17}/>
                          </View>
                          <View style={{flex:1}}>
                            <Text style={[s.evCardTxt,isDark&&{color:'#f8fafc'}]}>{ev.title}</Text>
                            <Text style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{ev.location} · {ev.category}</Text>
                          </View>
                          <ChevronRight color="#94a3b8" size={17}/>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={{marginTop:20}}>
                    <Text style={[{fontSize:14,fontWeight:'700',color:'#1e293b',marginBottom:12},isDark&&{color:'#f8fafc'}]}>Bu Aydaki Özel Günler</Text>
                    {(()=>{
                      const list=Object.entries(SPECIAL_DAYS).filter(([k])=>Number(k.split('-')[0])===selectedDate.getMonth()+1).sort((a,b)=>Number(a[0].split('-')[1])-Number(b[0].split('-')[1]));
                      if(!list.length)return<Text style={{fontSize:13,color:'#9ca3af',fontStyle:'italic'}}>Bu ayda özel gün bulunmuyor</Text>;
                      return list.map(([k,v])=>(
                        <View key={k} style={[s.spRow,isDark&&{backgroundColor:'#1e293b'}]}>
                          <View style={[s.spDot,{backgroundColor:v.color}]}/>
                          <Text style={{fontSize:15,marginRight:8}}>{v.emoji}</Text>
                          <Text style={{fontSize:13,fontWeight:'600',color:isDark?'#94a3b8':'#6b7280',marginRight:8,width:22}}>{k.split('-')[1]}</Text>
                          <Text style={{fontSize:13,color:isDark?'#f8fafc':'#374151',flex:1}} numberOfLines={1}>{v.name}</Text>
                        </View>
                      ));
                    })()}
                  </View>
                </View>
              )}

              {calendarView==='year'&&(
                <View style={{marginBottom:20}}>
                  <View style={s.calNav}>
                    <TouchableOpacity onPress={()=>changeYear(-1)} style={{padding:8}}><ChevronLeft color={isDark?'#94a3b8':'#6b7280'} size={22}/></TouchableOpacity>
                    <Text style={{fontSize:24,fontWeight:'bold',color:isDark?'#f8fafc':'#374151'}}>{selectedDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={()=>changeYear(1)} style={{padding:8}}><ChevronRight color={isDark?'#94a3b8':'#6b7280'} size={22}/></TouchableOpacity>
                  </View>
                  <View style={{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'}}>
                    {MONTHS.map((m,i)=>{
                      const cur=i===today.getMonth()&&selectedDate.getFullYear()===today.getFullYear();
                      return(
                        <TouchableOpacity key={m} style={[s.calMCell,cur&&[s.calMCellA,isDark&&{backgroundColor:amber}],isDark&&!cur&&{backgroundColor:'#334155'}]}
                          onPress={()=>{const d=new Date(selectedDate);d.setMonth(i);setSelectedDate(d);setCalendarView('month');}}>
                          <Text style={[s.calMTxt,cur&&{color:'#fff',fontWeight:'bold'},isDark&&!cur&&{color:'#f8fafc'}]}>{m.slice(0,3)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <TouchableOpacity style={[s.calEvBtn,isDark&&{backgroundColor:amber}]} onPress={()=>{setCalendarVisible(false);navigation.navigate('Events');}}>
                <Text style={s.calEvBtnTxt}>Etkinliklere Git</Text>
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
  heroPill:   {flexDirection:'row', alignSelf:'flex-start', backgroundColor:'rgba(0,0,0,0.52)', borderRadius:999, borderWidth:1, borderColor:'rgba(252,211,77,0.2)', overflow:'hidden', marginTop:8},
  heroPillSide:{flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:14, paddingVertical:9},
  heroPillTxt: {fontSize:14, fontWeight:'700', color:'#FCD34D'},
  heroPillDesc:{fontSize:11, color:'rgba(255,255,255,0.55)', fontWeight:'500', textTransform:'capitalize'},
  heroPillDivider:{width:1, backgroundColor:'rgba(255,255,255,0.15)', marginVertical:8},

  // Section
  section:{marginTop:30},
  secRow: {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14, paddingHorizontal:20},
  secTitleWrap:{flexDirection:'row', alignItems:'center', gap:9},
  secBar:  {width:4, height:20, borderRadius:2},
  secLabel:{fontSize:18, fontWeight:'800', letterSpacing:-0.2},
  secMore: {fontSize:13, fontWeight:'700'},

  // Landmarks — rotating banner
  lmBanner:    {borderRadius:28, height:200, overflow:'hidden', justifyContent:'space-between', padding:22,
    shadowColor:'#000', shadowOffset:{width:0,height:10}, shadowOpacity:0.4, shadowRadius:20, elevation:10},
  lmWatermark: {position:'absolute', right:-8, top:10, fontSize:96, fontWeight:'900', color:'rgba(255,255,255,0.07)', letterSpacing:-4},
  lmTag:       {flexDirection:'row', alignItems:'center', gap:5, alignSelf:'flex-start', backgroundColor:'rgba(255,255,255,0.14)', paddingHorizontal:10, paddingVertical:5, borderRadius:999, borderWidth:1, borderColor:'rgba(255,255,255,0.2)'},
  lmTagTxt:    {fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.85)', letterSpacing:0.4},
  lmBannerBody:{gap:3},
  lmBannerYear:{fontSize:11, fontWeight:'700', color:'rgba(255,255,255,0.5)', letterSpacing:1.2},
  lmBannerName:{fontSize:28, fontWeight:'900', color:'#fff', letterSpacing:-0.5},
  lmBannerDesc:{fontSize:13, color:'rgba(255,255,255,0.62)', lineHeight:19},
  lmDots:      {flexDirection:'row', gap:6, alignSelf:'flex-end'},
  lmDot:       {width:6, height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.3)'},
  lmDotA:      {width:20, backgroundColor:'rgba(255,255,255,0.9)', borderRadius:3},

  // Icon grid — 3×2
  iconGrid: {flexDirection:'row', flexWrap:'wrap', paddingHorizontal:12},
  iconCell: {width:'33.33%', alignItems:'center', paddingVertical:10},
  iconTouch:{alignItems:'center', gap:10, width:'100%'},
  iconCircle:{
    width:ICON_SIZE, height:ICON_SIZE, borderRadius:24,
    alignItems:'center', justifyContent:'center',
    shadowOffset:{width:0,height:8}, shadowOpacity:0.35, shadowRadius:16,
    elevation:8,
  },
  iconLottie:{width:52, height:52, backgroundColor:'transparent'},
  iconLabel: {fontSize:12, fontWeight:'600', textAlign:'center'},

  // ŞanlıSosyal
  sosyalCard:   {borderRadius:28, padding:22, flexDirection:'row', alignItems:'center', justifyContent:'space-between', overflow:'hidden', minHeight:130,
    shadowColor:'#7C3AED', shadowOffset:{width:0,height:12}, shadowOpacity:0.5, shadowRadius:24, elevation:12},
  sosyalOrb:    {position:'absolute', width:180, height:180, borderRadius:90, backgroundColor:'rgba(167,139,250,0.15)', top:-40, right:-20},
  sosyalLeft:   {flex:1, gap:6},
  sosyalLiveBadge:{flexDirection:'row', alignItems:'center', gap:5, alignSelf:'flex-start', backgroundColor:'rgba(255,255,255,0.12)', paddingHorizontal:10, paddingVertical:4, borderRadius:999, borderWidth:1, borderColor:'rgba(255,255,255,0.2)'},
  sosyalLiveDot:{width:7, height:7, borderRadius:3.5, backgroundColor:'#4ADE80'},
  sosyalLiveTxt:{fontSize:11, fontWeight:'800', color:'#fff', letterSpacing:0.6},
  sosyalTitle:  {fontSize:26, fontWeight:'800', color:'#fff', letterSpacing:-0.4},
  sosyalSub:    {fontSize:13, color:'rgba(255,255,255,0.6)', fontWeight:'500', lineHeight:19},
  sosyalRight:  {width:100, height:100, alignItems:'center', justifyContent:'center'},
  sosyalLottie: {width:100, height:100, backgroundColor:'transparent'},

  // Partners — kupon / bilet tasarımı
  pScroll:   {paddingHorizontal:20, paddingVertical:4},
  pCard:     {width:192, borderRadius:24, paddingHorizontal:16, paddingTop:16, paddingBottom:16, marginRight:12, minHeight:196, overflow:'hidden'},
  pIconMini: {position:'absolute', top:12, left:12, width:30, height:30, borderRadius:10, backgroundColor:'rgba(255,255,255,0.22)', alignItems:'center', justifyContent:'center'},
  pHero:     {alignItems:'center', paddingTop:6},
  pBigPct:   {fontSize:46, lineHeight:48, fontWeight:'900', color:'#fff', letterSpacing:-1.5},
  pBigLabel: {fontSize:11, fontWeight:'800', color:'rgba(255,255,255,0.9)', letterSpacing:3, marginTop:-2},
  pBigFirsat:{fontSize:30, fontWeight:'900', color:'#fff', letterSpacing:1, paddingVertical:8},
  pTearRow:  {flexDirection:'row', alignItems:'center', height:18, marginVertical:10, marginHorizontal:-16},
  pNotch:    {position:'absolute', top:0, width:18, height:18, borderRadius:9},
  pDashRow:  {flex:1, flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16},
  pDashSeg:  {width:7, height:2, borderRadius:1, backgroundColor:'rgba(255,255,255,0.6)'},
  pName:     {fontSize:15, fontWeight:'800', color:'#fff', textAlign:'center'},
  pKat:      {fontSize:11, fontWeight:'700', letterSpacing:0.3, color:'rgba(255,255,255,0.82)', marginTop:1, marginBottom:10, textAlign:'center'},
  pCta:      {alignSelf:'stretch', paddingVertical:9, borderRadius:12, backgroundColor:'#fff', alignItems:'center'},
  pCtaTxt:   {fontSize:12, fontWeight:'800'},
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
  promoClose:{position:'absolute', top:10, right:10, zIndex:2, width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center', backgroundColor:'rgba(255,255,255,0.8)'},
  promoImg: {width:'100%', height:150},
  promoBody:{paddingHorizontal:16, paddingVertical:14},
  promoTitle:{color:'#0f172a', fontSize:18, fontWeight:'800', marginBottom:6},
  promoSub:  {color:'#475569', fontSize:13, lineHeight:18},

  // Calendar
  calBack:  {flex:1, backgroundColor:'rgba(0,0,0,0.55)', justifyContent:'flex-end'},
  calCard:  {backgroundColor:'#fff', borderTopLeftRadius:32, borderTopRightRadius:32, padding:20, height:'80%'},
  calHead:  {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20},
  calTitle: {fontSize:20, fontWeight:'800', color:'#1e293b'},
  calTogWrap:{flexDirection:'row', backgroundColor:'#f3f4f6', borderRadius:16, padding:4, marginBottom:20},
  calTogBtn: {flex:1, paddingVertical:10, borderRadius:14, alignItems:'center'},
  calTogBtnA:{backgroundColor:'#F59E0B'},
  calTogTxt: {fontWeight:'600', color:'#6b7280'},
  calTogTxtA:{color:'#fff'},
  calNav:    {flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20},
  calMonthLbl:{fontSize:18, fontWeight:'800', color:'#1e293b'},
  calDayNames:{flexDirection:'row', marginBottom:10},
  calDayNm:  {flex:1, textAlign:'center', fontSize:12, fontWeight:'600', color:'#9ca3af'},
  calGrid:   {flexDirection:'row', flexWrap:'wrap'},
  calDayCell:{width:'14.28%', aspectRatio:1, justifyContent:'center', alignItems:'center', marginBottom:4},
  calDay:    {width:34, height:34, borderRadius:17, justifyContent:'center', alignItems:'center'},
  calDayToday:{backgroundColor:'#F59E0B'},
  calDayTxt: {fontSize:13, fontWeight:'500', color:'#374151'},
  calDayTodayTxt:{color:'#fff', fontWeight:'700'},
  evDot:     {width:4, height:4, borderRadius:2, backgroundColor:'#F59E0B', marginLeft:2},
  spCard:    {flexDirection:'row', alignItems:'center', padding:14, borderRadius:16, borderWidth:2},
  spTitle:   {fontSize:15, fontWeight:'700'},
  evCard:    {flexDirection:'row', alignItems:'center', backgroundColor:'#f3f4f6', padding:12, borderRadius:16, gap:10},
  evCardIco: {width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center'},
  evCardTxt: {fontSize:14, fontWeight:'700', color:'#1e293b'},
  spRow:     {flexDirection:'row', alignItems:'center', backgroundColor:'#f9fafb', paddingVertical:10, paddingHorizontal:12, borderRadius:12, marginBottom:8},
  spDot:     {width:7, height:7, borderRadius:3.5, marginRight:10},
  calMCell:  {width:'30%', paddingVertical:18, borderRadius:18, backgroundColor:'#f3f4f6', alignItems:'center', marginBottom:12},
  calMCellA: {backgroundColor:'#F59E0B'},
  calMTxt:   {fontSize:15, fontWeight:'600', color:'#374151'},
  calEvBtn:  {backgroundColor:'#F59E0B', paddingVertical:16, borderRadius:20, alignItems:'center', marginTop:10, marginBottom:20},
  calEvBtnTxt:{color:'#fff', fontSize:16, fontWeight:'800'},
});
