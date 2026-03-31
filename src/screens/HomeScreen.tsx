import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar, BookOpen, Search,
  Flame, QrCode, X, ChevronLeft, ChevronRight, Sparkles,
  CloudRain, Sun, Cloud, CloudSnow, CloudLightning, CloudDrizzle,
  Tag, Coffee, Shirt, Smartphone, Ticket, GraduationCap, Gift, Bell,
  Pill, Library, Route, Radio
} from 'lucide-react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { Colors, Gradients, DribbbleColors } from '@/constants/Colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import { MOCK_BUSES, MOCK_PARTNERS } from '@/api/mockData';
import { HomeScreenProps, MainTabParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { supabase, processImageUrl } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

// Supabase Veri Tipleri
interface FirsatData {
  id: number;
  baslik: string;
  aciklama: string;
  tarih?: string;
  kategori: string;
  resim_url?: string;
}

interface CalendarEventItem {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
}

/** surface* = ilgili liste sayfasıyla aynı pastel / gece tonu (düz renk, gradient yok) */
const QUICK_ACCESS_NAV = [
  {
    name: 'Etkinlik',
    icon: Calendar,
    color: '#fecaca',
    iconColor: '#b91c1c',
    screen: 'Events',
    surfaceLight: '#EDE7F6',
    surfaceDark: 'rgba(167, 139, 250, 0.24)',
  },
  {
    name: 'Keşfet',
    icon: BookOpen,
    color: '#bfdbfe',
    iconColor: '#1d4ed8',
    screen: 'Magazine',
    surfaceLight: '#f0f9ff',
    surfaceDark: 'rgba(59, 130, 246, 0.22)',
  },
  {
    name: 'Nöbetçi Eczane',
    icon: Pill,
    color: '#fbcfe8',
    iconColor: '#be185d',
    screen: 'PharmacyList',
    surfaceLight: '#fdf2f8',
    surfaceDark: 'rgba(251, 113, 133, 0.2)',
  },
  {
    name: 'Kütüphaneler',
    icon: Library,
    color: '#bbf7d0',
    iconColor: '#15803d',
    screen: 'LibraryList',
    surfaceLight: '#f0fdf4',
    surfaceDark: 'rgba(52, 211, 153, 0.2)',
  },
  {
    name: 'Gezi Rotası',
    icon: Route,
    color: '#ddd6fe',
    iconColor: '#6d28d9',
    screen: 'CulturalRoute',
    surfaceLight: '#f5f3ff',
    surfaceDark: 'rgba(139, 92, 246, 0.22)',
  },
];

const QUOTES_OF_DAY = [
  'Bugün Urfa\'yı keşfet!',
  'Küçük bir adım, büyük bir değişimin başlangıcı olabilir.',
  'Şehrini ne kadar tanırsan, o kadar çok seversin.',
  'Bir etkinlik, bir arkadaşlık, bir anı demek.',
  'Gençken gez, gör, dene; sonrası kendiliğinden gelir.',
];

const PROMO_ANNOUNCEMENT = {
  title: 'Bugüne Özel Indirim',
  subtitle: "Secili kafelerde %20'ye varan ogrenci indirimi seni bekliyor.",
  image: require('@/assets/images/_ (2).jpeg'),
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const { profile, isGuest } = useUser();
  const nextBus = MOCK_BUSES[0];
  const rainAnim = useRef(new Animated.Value(0)).current;
  
  // Takvim Modal State
  const [promoModalVisible, setPromoModalVisible] = useState(true);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [guestSocialModalVisible, setGuestSocialModalVisible] = useState(false);
  const radarPulse = useRef(new Animated.Value(0)).current;
  const radarGlowOpacity = radarPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.10, 0.24],
  });
  const radarGlowScale = radarPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });
  
  // Supabase Fırsatlar State
  const [firsatlar, setFirsatlar] = useState<FirsatData[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [loadingFirsatlar, setLoadingFirsatlar] = useState(true);
  
  const [refreshing, setRefreshing] = useState(false);
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  // Lottie refs - tıklanınca .play() ile tekrar oynat
  const etkinlikLottieRef = useRef<LottieView>(null);
  const kesfetLottieRef = useRef<LottieView>(null);
  const eczaneLottieRef = useRef<LottieView>(null);
  const kutuphaneLottieRef = useRef<LottieView>(null);
  const geziLottieRef = useRef<LottieView>(null);
  // Bento giriş animasyonu (stagger - dalga efekti)
  const bentoAnims = useRef(
    [0, 1, 2, 3, 4].map(() => new Animated.Value(0))
  ).current;
  useEffect(() => {
    Animated.stagger(100, bentoAnims.map(anim =>
      Animated.timing(anim, { toValue: 1, duration: 420, useNativeDriver: true })
    )).start();
  }, []);

  useEffect(() => {
    if (!isDark) {
      radarPulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(radarPulse, { toValue: 0, duration: 1300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [radarPulse, isDark]);
  
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  
  // Türkiye'deki Özel Günler (ay-gün formatında)
  const SPECIAL_DAYS: { [key: string]: { name: string; emoji: string; color: string; type: 'holiday' | 'memorial' | 'special' } } = {
    // Resmi Tatiller
    '1-1': { name: 'Yılbaşı', emoji: '🎉', color: '#f59e0b', type: 'holiday' },
    '4-23': { name: 'Ulusal Egemenlik ve Çocuk Bayramı', emoji: '🇹🇷', color: '#ef4444', type: 'holiday' },
    '5-1': { name: 'Emek ve Dayanışma Günü', emoji: '💪', color: '#ef4444', type: 'holiday' },
    '5-19': { name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı', emoji: '🏃', color: '#ef4444', type: 'holiday' },
    '7-15': { name: 'Demokrasi ve Milli Birlik Günü', emoji: '🕊️', color: '#ef4444', type: 'holiday' },
    '8-30': { name: 'Zafer Bayramı', emoji: '🏆', color: '#ef4444', type: 'holiday' },
    '10-29': { name: 'Cumhuriyet Bayramı', emoji: '🇹🇷', color: '#ef4444', type: 'holiday' },
    // Anma Günleri
    '3-18': { name: 'Çanakkale Zaferi', emoji: '⭐', color: '#dc2626', type: 'memorial' },
    '11-10': { name: 'Atatürk\'ü Anma Günü', emoji: '🖤', color: '#1f2937', type: 'memorial' },
    // Özel Günler
    '2-14': { name: 'Sevgililer Günü', emoji: '❤️', color: '#ec4899', type: 'special' },
    '3-8': { name: 'Dünya Kadınlar Günü', emoji: '👩', color: '#a855f7', type: 'special' },
    '3-21': { name: 'Nevruz', emoji: '🌸', color: '#22c55e', type: 'special' },
    '11-24': { name: 'Öğretmenler Günü', emoji: '📚', color: '#6366f1', type: 'special' },
    '12-31': { name: 'Yılbaşı Gecesi', emoji: '🎊', color: '#f59e0b', type: 'special' },
    // 2026 Dini Günler ve Kandiller (Tahmini)
    '2-19': { name: 'Ramazan Başlangıcı', emoji: '🌙', color: '#10b981', type: 'special' },
    '3-16': { name: 'Kadir Gecesi', emoji: '📿', color: '#10b981', type: 'special' },
    '3-19': { name: 'Ramazan Bayramı Arifesi', emoji: '🍬', color: '#10b981', type: 'special' },
    '3-20': { name: 'Ramazan Bayramı 1. Gün', emoji: '🍬', color: '#10b981', type: 'holiday' },
    '3-21-RELIGIOUS': { name: 'Ramazan Bayramı 2. Gün', emoji: '🍬', color: '#10b981', type: 'holiday' }, 
    '3-22': { name: 'Ramazan Bayramı 3. Gün', emoji: '🍬', color: '#10b981', type: 'holiday' },
    '5-26': { name: 'Kurban Bayramı Arifesi', emoji: '🐑', color: '#10b981', type: 'special' },
    '5-27': { name: 'Kurban Bayramı 1. Gün', emoji: '🐑', color: '#10b981', type: 'holiday' },
    '5-28': { name: 'Kurban Bayramı 2. Gün', emoji: '🐑', color: '#10b981', type: 'holiday' },
    '5-29': { name: 'Kurban Bayramı 3. Gün', emoji: '🐑', color: '#10b981', type: 'holiday' },
    '5-30': { name: 'Kurban Bayramı 4. Gün', emoji: '🐑', color: '#10b981', type: 'holiday' },
  };

  // Özel gün ve etkinlik kontrolü
  const parseEventDate = (rawDate: string) => {
    if (!rawDate) return null;
    const value = rawDate.trim();

    // dd.mm.yyyy or dd/mm/yyyy
    const trNumeric = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (trNumeric) {
      const day = Number(trNumeric[1]);
      const month = Number(trNumeric[2]);
      const year = Number(trNumeric[3]);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return { day, month, year };
      }
    }

    // yyyy-mm-dd
    const isoDate = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoDate) {
      const year = Number(isoDate[1]);
      const month = Number(isoDate[2]);
      const day = Number(isoDate[3]);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        return { day, month, year };
      }
    }

    // "21 Aralık" style
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const monthNameRegex = new RegExp(`^(\\d{1,2})\\s+(${monthNames.join('|')})$`, 'i');
    const named = value.match(monthNameRegex);
    if (named) {
      const day = Number(named[1]);
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === named[2].toLowerCase());
      if (day >= 1 && day <= 31 && monthIndex >= 0) {
        return { day, month: monthIndex + 1 };
      }
    }

    return null;
  };

  const getDayContent = (day: number, month: number) => {
    const key = `${month + 1}-${day}`;
    let specialDay = SPECIAL_DAYS[key] || null;
    
    // 21 Mart çakışması için özel kontrol
    if (key === '3-21') {
      specialDay = SPECIAL_DAYS['3-21-RELIGIOUS'] || SPECIAL_DAYS['3-21'];
    }

    // Etkinlik kontrolü (21 Aralık, 21.12.2025, 2025-12-21 gibi formatları destekler)
    const dailyEvents = calendarEvents.filter(eventItem => {
      const parsed = parseEventDate(eventItem.date);
      if (!parsed) return false;
      const sameDay = parsed.day === day;
      const sameMonth = parsed.month === month + 1;
      if (!sameDay || !sameMonth) return false;
      if (parsed.year) return parsed.year === selectedDate.getFullYear();
      return true;
    });

    return { specialDay, dailyEvents };
  };

  // Seçili gün state'i
  const [selectedDay, setSelectedDay] = useState<{ day: number; specialDay: any; events: any[] } | null>(null);
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };
  
  const changeMonth = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setSelectedDate(newDate);
  };
  
  const changeYear = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + delta);
    setSelectedDate(newDate);
  };

  // --- HAVA DURUMU KISMI ---
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [airQualityData, setAirQualityData] = useState<any>(null);
  const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY ?? ''; 
  const SEHIR_KOORDINAT = { lat: 37.1674, lon: 38.7955 };

  // Fırsatları Supabase'den Çek
  const fetchFirsatlar = async () => {
    try {
      const { data, error } = await supabase
        .from('firsatlar')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setFirsatlar(data);
      if (error) console.log("Fırsat hatası:", error);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingFirsatlar(false);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('etkinlikler')
        .select('id, baslik, tarih, konum, kategori')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Takvim etkinlik hatası:', error);
        return;
      }

      const mapped: CalendarEventItem[] = (data || []).map((item: any) => ({
        id: item.id?.toString?.() || `${item.baslik}-${item.tarih}`,
        title: item.baslik || 'Etkinlik',
        date: item.tarih || '',
        location: item.konum || 'Konum bilgisi yok',
        category: item.kategori || 'Etkinlik',
      }));

      setCalendarEvents(mapped);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchAllWeatherData();
    fetchFirsatlar();
    fetchCalendarEvents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setLoadingFirsatlar(true);
    await Promise.all([
      fetchAllWeatherData(),
      fetchFirsatlar(),
      fetchCalendarEvents(),
    ]);
    setRefreshing(false);
  };

  const fetchAllWeatherData = async () => {
    try {
      // Paralel olarak tüm API'leri çağır
      const [weatherRes, forecastRes, airRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${SEHIR_KOORDINAT.lat}&lon=${SEHIR_KOORDINAT.lon}&units=metric&lang=tr&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${SEHIR_KOORDINAT.lat}&lon=${SEHIR_KOORDINAT.lon}&units=metric&lang=tr&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${SEHIR_KOORDINAT.lat}&lon=${SEHIR_KOORDINAT.lon}&appid=${API_KEY}`)
      ]);

      const weatherJson = await weatherRes.json();
      const forecastJson = await forecastRes.json();
      const airJson = await airRes.json();

      if (weatherJson.cod === 200) setWeatherData(weatherJson);
      if (forecastJson.cod === "200") setForecastData(forecastJson);
      if (airJson.list) setAirQualityData(airJson);
      
    } catch (error) {
      console.log("Hava durumu hatası:", error);
    }
  };

  const getWeatherIcon = (size = 26, color = Colors.white) => {
    if (!weatherData) return <Cloud color={color} size={size} />;
    const conditionId = weatherData.weather[0].id;
    if (conditionId === 800) return <Sun color={color} size={size} />;
    if (conditionId >= 200 && conditionId < 300) return <CloudLightning color={color} size={size} />;
    if (conditionId >= 300 && conditionId < 500) return <CloudDrizzle color={color} size={size} />;
    if (conditionId >= 500 && conditionId < 600) return <CloudRain color={color} size={size} />;
    if (conditionId >= 600 && conditionId < 700) return <CloudSnow color={color} size={size} />;
    if (conditionId >= 700 && conditionId < 800) return <Cloud color={color} size={size} />;
    return <Cloud color={color} size={size} />;
  };

  const handleWeatherDetail = () => {
    navigation.navigate('WeatherDetail', { 
      weatherData: weatherData || undefined,
      forecastData: forecastData || undefined,
      airQualityData: airQualityData || undefined,
    });
  };

  const handleNavigation = (item: typeof QUICK_ACCESS_NAV[0]) => {
    navigation.navigate(item.screen as 'Events' | 'Magazine' | 'PharmacyList' | 'LibraryList' | 'CulturalRoute');
  };

  const handleBentoPress = (item: typeof QUICK_ACCESS_NAV[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleNavigation(item);
  };

  const handleSosyalPress = () => {
    if (isGuest) {
      setGuestSocialModalVisible(true);
      return;
    }
    navigation.navigate('Sosyal');
  };

  const handleGuestGoToLogin = () => {
    setGuestSocialModalVisible(false);
    const parentNav = navigation.getParent<any>();
    if (parentNav) {
      parentNav.navigate('Login');
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' as never }],
      })
    );
  };

  const handlePromoPress = () => {
    setPromoModalVisible(false);
    navigation.navigate('Main', { screen: 'GencKart' as keyof MainTabParamList });
  };

  const handleCardScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = 170 + 12; 
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / slideSize);
    setActiveCardIndex(index);
  };

  // Kategori Temaları
  const getCategoryTheme = (kategori: string | null | undefined) => {
    if (!kategori) {
      return { icon: Gift, color: '#fb923c', bg: '#ffedd5', bgDark: '#3a2a1c' };
    }

    // Kategori değerini normalize et (trim, küçük harfe çevir, boşlukları normalize et)
    const normalizedKategori = kategori.trim().toLowerCase().replace(/\s+/g, ' ');

    // Kategori eşleştirmesi (case-insensitive ve esnek) — bgDark: gece modunda gündüz pastelinin tok tonu
    if (normalizedKategori.includes('yiyecek') || normalizedKategori.includes('içecek')) {
      return { icon: Coffee, color: '#fb923c', bg: '#ffedd5', bgDark: '#3a2a1c' };
    }
    if (normalizedKategori.includes('giyim')) {
      return { icon: Shirt, color: '#a78bfa', bg: '#ede9fe', bgDark: '#2e2642' };
    }
    if (normalizedKategori.includes('teknoloji')) {
      return { icon: Smartphone, color: '#60a5fa', bg: '#dbeafe', bgDark: '#1e2f45' };
    }
    if (normalizedKategori.includes('etkinlik') || normalizedKategori.includes('bileti')) {
      return { icon: Ticket, color: '#f87171', bg: '#fee2e2', bgDark: '#3d2226' };
    }
    if (normalizedKategori.includes('öğrenci') || normalizedKategori.includes('özel')) {
      return { icon: GraduationCap, color: '#4ade80', bg: '#dcfce7', bgDark: '#1c3328' };
    }
    if (normalizedKategori.includes('indirim')) {
      return { icon: Tag, color: '#fb7185', bg: '#ffe4e6', bgDark: '#3a2428' };
    }
    if (normalizedKategori.includes('kampanya')) {
      return { icon: Bell, color: '#fbbf24', bg: '#fef3c7', bgDark: '#3d3420' };
    }

    return { icon: Gift, color: '#fb923c', bg: '#ffedd5', bgDark: '#3a2a1c' };
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(rainAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, [rainAnim]);

  const rainTranslate = rainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  return (
    <View style={styles.root}>
      <LinearGradient colors={isDark ? Gradients.background : Gradients.backgroundLight} style={StyleSheet.absoluteFill} />
      {!isDark ? (
        <>
          <LinearGradient colors={['rgba(240,230,255,0.25)', 'transparent', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.8 }} style={[StyleSheet.absoluteFill, { opacity: 0.9 }]} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(225,240,255,0.2)', 'rgba(254,249,195,0.15)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: 0.9 }]} pointerEvents="none" />
        </>
      ) : null}
      <SafeAreaView style={[styles.statusBarArea, !isDark && { backgroundColor: '#ffffff' }]} edges={['top']} />
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? Colors.dark.accent : Colors.primary.indigo}
              colors={isDark ? [Colors.dark.accent] : [Colors.primary.indigo]}
            />
          }
        >
        {/* Header */}
        <LinearGradient
          colors={isDark ? Gradients.dark : Gradients.headerLight}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View style={[styles.badge, !isDark && { backgroundColor: DribbbleColors.cardWhite, borderWidth: 1, borderColor: DribbbleColors.borderLight }]}>
              <Text style={[styles.badgeText, !isDark && { color: DribbbleColors.textPrimary }]}>◎ ŞANLIURFA</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Notifications')}
                style={styles.headerSearchBtn}
                activeOpacity={0.8}
              >
                <Bell color={isDark ? Colors.white : DribbbleColors.textPrimary} size={22} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('GlobalSearch')}
                style={styles.headerSearchBtn}
                activeOpacity={0.8}
              >
                <Search color={isDark ? Colors.white : DribbbleColors.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.greeting, !isDark && { color: DribbbleColors.textPrimary }]}>Selam, {profile?.name || 'Şanlı Genç'}! 👋</Text>
          <Text style={[styles.greetingSub, !isDark && { color: DribbbleColors.textSecondary }]}>Bugün nasıl gidiyor?</Text>

        </LinearGradient>

        {/* Dashboard */}
        <View style={styles.dashboardInner}>
          <LinearGradient
            colors={isDark ? [Colors.dark.card, Colors.dark.border] : Gradients.statsCardLight}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statsCard, !isDark && { borderColor: DribbbleColors.borderLight, shadowColor: Platform.OS === 'android' ? 'transparent' : '#334155', shadowOpacity: Platform.OS === 'android' ? 0 : 0.06, elevation: Platform.OS === 'android' ? 0 : 12 }]}
          >
              <TouchableOpacity
                style={styles.statsSection}
                activeOpacity={0.9}
                onPress={handleWeatherDetail}
              >
                  <Text style={[styles.statsTitleWhite, !isDark && { color: DribbbleColors.textSecondary }]}>HAVA DURUMU</Text>
                  <View style={styles.weatherStatsRow}>
                    {getWeatherIcon(22, isDark ? Colors.dark.accent : DribbbleColors.progressBlue)}
                    <Text style={[styles.statsValueWhite, { marginLeft: 6 }, !isDark && { color: DribbbleColors.textPrimary }]}>
                      {weatherData ? `${Math.round(weatherData.main.temp)}°` : '--'}
                    </Text>
                  </View>
              </TouchableOpacity>
              
              <View style={[styles.statsDividerWhite, !isDark && { backgroundColor: Platform.OS === 'android' ? '#e5e7eb' : 'rgba(0,0,0,0.08)' }]} />
              
              <TouchableOpacity
                style={styles.statsSection}
                activeOpacity={0.9}
                onPress={() => setCalendarVisible(true)}
              >
                  <Text style={[styles.statsTitleWhite, !isDark && { color: DribbbleColors.textSecondary }]}>TAKVİM</Text>
                  <View style={styles.calendarStatsRow}>
                    <Calendar color={isDark ? Colors.dark.accent : DribbbleColors.progressBlue} size={22} />
                    <Text style={[styles.statsValueWhite, { marginLeft: 6 }, !isDark && { color: DribbbleColors.textPrimary }]}>
                      {new Date().getDate()} {['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][new Date().getMonth()]}
                    </Text>
                  </View>
              </TouchableOpacity>
          </LinearGradient>

          <View style={styles.content}>
            <View style={styles.widgetsContainer}>
                <TouchableOpacity
                  style={[
                    styles.widgetCard,
                    styles.quoteCard,
                    { width: '100%', height: 152, paddingHorizontal: 14, paddingVertical: 11 },
                    !isDark && { borderColor: 'rgba(96,165,250,0.22)', shadowColor: '#60a5fa', shadowOpacity: 0.14, shadowRadius: 22 },
                    isDark && {
                      borderColor: 'rgba(96,165,250,0.35)',
                      shadowColor: '#2563eb',
                      shadowOpacity: 0.28,
                      shadowRadius: 22,
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={handleSosyalPress}
                >
                    {isDark ? (
                      <Animated.View
                        pointerEvents="none"
                        style={[
                          StyleSheet.absoluteFill,
                          styles.radarHeroPulse,
                          {
                            opacity: radarGlowOpacity,
                            transform: [{ scale: radarGlowScale }],
                          },
                          { borderColor: 'rgba(147,197,253,0.35)' },
                        ]}
                      />
                    ) : null}
                    <LinearGradient
                      colors={isDark ? ['#0f172a', '#1e3a8a', '#2563eb'] : ['#cbd5e1', '#bfdbfe', '#eef2ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.radarHeroHeader}>
                      <View style={[styles.radarHeroIcon, isDark && { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(191,219,254,0.45)' }, !isDark && { backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(59,130,246,0.22)' }]}>
                        <Radio color={isDark ? '#e0f2fe' : '#60a5fa'} size={20} strokeWidth={2} />
                      </View>
                      <View style={[styles.radarHeroBadge, !isDark && { backgroundColor: 'rgba(96,165,250,0.10)', borderColor: 'rgba(96,165,250,0.18)' }, isDark && { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(191,219,254,0.35)' }]}>
                        <View style={styles.radarHeroLiveDot} />
                        <Text style={[styles.radarHeroLiveText, !isDark && { color: '#2563eb' }, isDark && { color: '#bfdbfe' }]}>CANLI</Text>
                      </View>
                    </View>
                    <Text style={[styles.radarHeroTitle, isDark && { color: '#f8fafc', fontSize: 22 }, !isDark && { color: '#0f172a', fontSize: 22 }]}>ŞanlıSosyal</Text>
                    <Text style={[styles.radarHeroSub, isDark && { color: 'rgba(224,242,254,0.88)', fontSize: 14 }, !isDark && { color: 'rgba(37,99,235,0.78)', fontSize: 14 }]}>Şehir radarı, akış ve kıvılcımlar · son 4 saat</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, styles.sectionTitleWithMargin, { color: isDark ? Colors.dark.highlight : DribbbleColors.textPremium }, !isDark && { opacity: 0.9 }]}>HIZLI ERİŞİM</Text>
            
            {/* Hızlı erişim — sayfa renkleriyle düz zemin */}
            <View style={styles.bentoGrid}>
              <Animated.View style={[styles.bentoFullWidth, !isDark && Platform.OS !== 'android' && { borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#1e293b', shadowOpacity: 0.08, shadowRadius: 20 }, { opacity: bentoAnims[0], transform: [{ translateY: bentoAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <AnimatedPressable
                  scaleTo={0.96}
                  style={styles.bentoGlassWrapper}
                  fill
                  onPress={() => {
                    etkinlikLottieRef.current?.play();
                    handleBentoPress(QUICK_ACCESS_NAV[0]);
                  }}
                >
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      styles.bentoSurfaceFill,
                      { backgroundColor: isDark ? QUICK_ACCESS_NAV[0].surfaceDark : QUICK_ACCESS_NAV[0].surfaceLight },
                    ]}
                  />
                  <View style={styles.bentoGlass}>
                    <View style={[styles.bentoIconGlow, styles.etkinlikLottieWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowPurple, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                      <LottieView
                        ref={etkinlikLottieRef}
                        source={require('@/assets/images/El calendario.json')}
                        autoPlay
                        loop
                        resizeMode="contain"
                        style={styles.etkinlikLottie}
                      />
                    </View>
                    <Text style={[styles.bentoTitle, { color: isDark ? '#f8fafc' : DribbbleColors.textPremium, opacity: 0.95 }]}>{QUICK_ACCESS_NAV[0].name}</Text>
                  </View>
                </AnimatedPressable>
              </Animated.View>
              {/* Row 2: Keşfet (2/3) + Eczane (1/3) yan yana */}
              <View style={styles.bentoRow2}>
                <Animated.View style={[styles.bentoLarge, !isDark && Platform.OS !== 'android' && { borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#1e293b', shadowOpacity: 0.08, shadowRadius: 20 }, { opacity: bentoAnims[1], transform: [{ translateY: bentoAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      kesfetLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[1]);
                    }}
                  >
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.bentoSurfaceFill,
                        { backgroundColor: isDark ? QUICK_ACCESS_NAV[1].surfaceDark : QUICK_ACCESS_NAV[1].surfaceLight },
                      ]}
                    />
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.etkinlikLottieWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowBlue, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                        <LottieView
                          ref={kesfetLottieRef}
                          source={require('@/assets/images/Map pin location.json')}
                          autoPlay
                          loop
                          resizeMode="contain"
                          style={styles.etkinlikLottie}
                        />
                      </View>
                      <Text style={[styles.bentoTitle, { color: isDark ? '#f8fafc' : DribbbleColors.textPremium, opacity: 0.95 }]}>{QUICK_ACCESS_NAV[1].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
                <Animated.View style={[styles.bentoSmall, !isDark && Platform.OS !== 'android' && { borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#1e293b', shadowOpacity: 0.08, shadowRadius: 20 }, { opacity: bentoAnims[2], transform: [{ translateY: bentoAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      eczaneLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[2]);
                    }}
                  >
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.bentoSurfaceFill,
                        { backgroundColor: isDark ? QUICK_ACCESS_NAV[2].surfaceDark : QUICK_ACCESS_NAV[2].surfaceLight },
                      ]}
                    />
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.bentoLottieSmallWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowPink, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                        <LottieView
                          ref={eczaneLottieRef}
                          source={require('@/assets/images/AR Tablet.json')}
                          autoPlay
                          loop
                          resizeMode="contain"
                          style={styles.bentoLottieSmall}
                        />
                      </View>
                      <Text style={[styles.bentoTitleSmall, { color: isDark ? '#f8fafc' : DribbbleColors.textPremium, opacity: 0.9 }]}>{QUICK_ACCESS_NAV[2].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              </View>
              {/* Row 3: Kütüphane (1/3) + Gezi (2/3) yan yana */}
              <View style={styles.bentoRow2}>
                <Animated.View style={[styles.bentoSmall, !isDark && Platform.OS !== 'android' && { borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#1e293b', shadowOpacity: 0.08, shadowRadius: 20 }, { opacity: bentoAnims[3], transform: [{ translateY: bentoAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      kutuphaneLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[3]);
                    }}
                  >
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.bentoSurfaceFill,
                        { backgroundColor: isDark ? QUICK_ACCESS_NAV[3].surfaceDark : QUICK_ACCESS_NAV[3].surfaceLight },
                      ]}
                    />
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.bentoLottieSmallWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowMint, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                        <LottieView
                          ref={kutuphaneLottieRef}
                          source={require('@/assets/images/Books.json')}
                          autoPlay
                          loop
                          resizeMode="contain"
                          style={styles.bentoLottieSmall}
                        />
                      </View>
                      <Text style={[styles.bentoTitleSmall, { color: isDark ? '#f8fafc' : DribbbleColors.textPremium, opacity: 0.9 }]}>{QUICK_ACCESS_NAV[3].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
                <Animated.View style={[styles.bentoLarge, !isDark && Platform.OS !== 'android' && { borderColor: 'rgba(0,0,0,0.06)', shadowColor: '#1e293b', shadowOpacity: 0.08, shadowRadius: 20 }, { opacity: bentoAnims[4], transform: [{ translateY: bentoAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      geziLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[4]);
                    }}
                  >
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        styles.bentoSurfaceFill,
                        { backgroundColor: isDark ? QUICK_ACCESS_NAV[4].surfaceDark : QUICK_ACCESS_NAV[4].surfaceLight },
                      ]}
                    />
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.etkinlikLottieWrapper, !isDark ? { shadowColor: '#8b5cf6', shadowOpacity: 0.35, shadowRadius: 12 } : { shadowColor: 'rgba(139, 92, 246, 0.45)', shadowOpacity: 0.5, shadowRadius: 14 }]}>
                        <LottieView
                          ref={geziLottieRef}
                          source={require('@/assets/images/Travel is fun.json')}
                          autoPlay
                          loop
                          resizeMode="contain"
                          style={[styles.etkinlikLottie, { backgroundColor: 'transparent' }]}
                        />
                      </View>
                      <Text style={[styles.bentoTitle, { color: isDark ? '#f8fafc' : DribbbleColors.textPremium, opacity: 0.95 }]}>{QUICK_ACCESS_NAV[4].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitleInHeader, { color: isDark ? Colors.dark.highlight : DribbbleColors.textPremium }, !isDark && { opacity: 0.9 }]}>Genç Kart Fırsatları</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Main', { screen: 'GencKart' as keyof MainTabParamList })}
                style={styles.seeAllButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: isDark ? Colors.dark.accent : DribbbleColors.progressBlue }]}>Tümünü Gör</Text>
                <ChevronRight color={isDark ? Colors.dark.accent : DribbbleColors.progressBlue} size={16} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.partnersScrollWrapper}>
              {loadingFirsatlar ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnersScrollContent}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={[styles.partnerCard, isDark ? { backgroundColor: '#1e293b' } : { backgroundColor: DribbbleColors.cardWhite, borderColor: DribbbleColors.borderLight, shadowColor: '#334155', shadowOpacity: 0.05 }]}>
                        <Skeleton width={32} height={32} borderRadius={16} isDark={isDark} />
                        <Skeleton width="80%" height={14} borderRadius={6} isDark={isDark} />
                        <Skeleton width="60%" height={12} borderRadius={6} isDark={isDark} />
                      </View>
                    ))}
                  </ScrollView>
              ) : firsatlar.length === 0 ? (
                  <View style={[styles.emptyFirsatContainer, isDark ? styles.emptyFirsatContainerDark : { backgroundColor: DribbbleColors.cardWhite, borderColor: DribbbleColors.borderLight }]}>
                    <View style={[styles.emptyFirsatIconWrap, isDark && { backgroundColor: '#334155' }]}>
                      <Gift color={isDark ? '#94a3b8' : Colors.primary.indigo} size={32} />
                    </View>
                    <Text style={[styles.emptyFirsatTitle, isDark && { color: '#f8fafc' }]}>
                      Bugün öne çıkan fırsat yok
                    </Text>
                    <Text style={[styles.emptyFirsatSub, isDark && { color: '#94a3b8' }]}>
                      Genç Kart ile indirimler yakında burada
                    </Text>
                    <AnimatedPressable
                      onPress={() => navigation.navigate('Main', { screen: 'GencKart' as keyof MainTabParamList })}
                      style={[styles.emptyFirsatCta, isDark && { backgroundColor: '#334155' }]}
                    >
                      <Sparkles color={Colors.cta} size={18} />
                      <Text style={[styles.emptyFirsatCtaText, isDark && { color: Colors.dark.highlight }]}>Genç Kart'ı Keşfet</Text>
                    </AnimatedPressable>
                  </View>
              ) : (
                  <>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.partnersScrollContent}
                        onScroll={handleCardScroll} 
                        scrollEventThrottle={16}
                        snapToInterval={170 + 12}
                        decelerationRate="fast"
                    >
                        {firsatlar.map((partner, index) => {
                            const theme = getCategoryTheme(partner.kategori);
                            const Icon = theme.icon;
                            return (
                                <AnimatedListItem key={partner.id} index={index} delay={80}>
                                <TouchableOpacity
                                style={[
                                    styles.partnerCard,
                                    !isDark && { backgroundColor: theme.bg || '#ffedd5' },
                                    isDark && {
                                      backgroundColor: theme.bgDark,
                                      borderWidth: 1,
                                      borderColor: 'rgba(255,255,255,0.1)',
                                    },
                                    !isDark && { shadowOpacity: 0, shadowRadius: 0, elevation: 0, shadowOffset: { width: 0, height: 0 } },
                                ]}
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('PartnerDetail', { partnerId: partner.id.toString() })}
                                >
                                <View style={[styles.partnerIconWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)' }]}>
                                    <Icon color={theme.color} size={22} />
                                </View>
                                <Text style={[styles.partnerName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>{partner.baslik}</Text>
                                <Text style={[styles.partnerOffer, isDark && { color: '#cbd5e1' }]} numberOfLines={1}>{partner.kategori}</Text>
                                </TouchableOpacity>
                                </AnimatedListItem>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.paginationContainer}>
                        {firsatlar.map((_, index) => {
                            const isActive = index === activeCardIndex;
                            return (
                            <Animated.View 
                                key={index} 
                                style={[
                                styles.paginationDot,
                                isActive && styles.paginationDotActive,
                                isDark && !isActive && { backgroundColor: '#475569' },
                                isActive && { backgroundColor: isDark ? '#818cf8' : DribbbleColors.progressBlue }
                                ]} 
                            />
                            );
                        })}
                    </View>
                  </>
              )}
            </View>
          </View>
        </View>

        <Modal
          visible={guestSocialModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setGuestSocialModalVisible(false)}
        >
          <View style={styles.guestModalBackdrop}>
            <View style={[styles.guestModalCard, isDark && styles.guestModalCardDark]}>
              <View style={[styles.guestModalBadge, isDark && styles.guestModalBadgeDark]}>
                <Radio color={isDark ? '#7dd3fc' : '#2563eb'} size={18} />
                <Text style={[styles.guestModalBadgeText, isDark && styles.guestModalBadgeTextDark]}>
                  ŞanlıSosyal
                </Text>
              </View>
              <Text style={[styles.guestModalTitle, isDark && styles.guestModalTitleDark]}>
                Giriş Yapman Gerekiyor
              </Text>
              <Text style={[styles.guestModalSubtitle, isDark && styles.guestModalSubtitleDark]}>
                ŞanlıSosyal'e erişmek için hesabınla giriş yapman gerekiyor.
              </Text>
              <View style={styles.guestModalActions}>
                <TouchableOpacity
                  style={[styles.guestModalSecondaryBtn, isDark && styles.guestModalSecondaryBtnDark]}
                  onPress={() => setGuestSocialModalVisible(false)}
                >
                  <Text style={[styles.guestModalSecondaryText, isDark && styles.guestModalSecondaryTextDark]}>
                    Vazgeç
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.guestModalPrimaryBtn, isDark && styles.guestModalPrimaryBtnDark]}
                  onPress={handleGuestGoToLogin}
                >
                  <Text style={styles.guestModalPrimaryText}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={promoModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setPromoModalVisible(false)}
        >
          <View style={styles.promoBackdrop}>
            <View style={[styles.promoCard, isDark && styles.promoCardDark]}>
              <TouchableOpacity
                style={[styles.promoClose, isDark && styles.promoCloseDark]}
                onPress={() => setPromoModalVisible(false)}
              >
                <X color={isDark ? '#f8fafc' : '#475569'} size={18} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.92} onPress={handlePromoPress}>
                <Image source={PROMO_ANNOUNCEMENT.image} style={styles.promoImage} />
                <View style={styles.promoBody}>
                  <Text style={[styles.promoTitle, isDark && styles.promoTitleDark]}>
                    {PROMO_ANNOUNCEMENT.title}
                  </Text>
                  <Text style={[styles.promoSubtitle, isDark && styles.promoSubtitleDark]}>
                    {PROMO_ANNOUNCEMENT.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Calendar Modal */}
        <Modal visible={calendarVisible} animationType="slide" transparent onRequestClose={() => setCalendarVisible(false)}>
          <View style={styles.calendarModalBackdrop}>
            <View style={[styles.calendarModalCard, isDark && { backgroundColor: '#1e293b' }]}>
              {/* Header */}
              <View style={styles.calendarHeader}>
                <Text style={[styles.calendarTitle, isDark && { color: '#f8fafc' }]}>
                  {calendarView === 'month' ? 'Aylık Takvim' : 'Yıllık Takvim'}
                </Text>
                <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.calendarCloseBtn}>
                  <X color={isDark ? '#94a3b8' : '#6b7280'} size={24} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* View Toggle */}
                <View style={[styles.calendarToggle, isDark && { backgroundColor: '#0f172a' }]}>
                  <TouchableOpacity
                    style={[
                      styles.calendarToggleBtn,
                      calendarView === 'month' && styles.calendarToggleBtnActive,
                      calendarView === 'month' && isDark && { backgroundColor: Colors.dark.accent },
                    ]}
                    onPress={() => setCalendarView('month')}
                  >
                    <Text style={[styles.calendarToggleText, calendarView === 'month' && styles.calendarToggleTextActive, isDark && calendarView !== 'month' && { color: '#94a3b8' }]}>Aylık</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.calendarToggleBtn,
                      calendarView === 'year' && styles.calendarToggleBtnActive,
                      calendarView === 'year' && isDark && { backgroundColor: Colors.dark.accent },
                    ]}
                    onPress={() => setCalendarView('year')}
                  >
                    <Text style={[styles.calendarToggleText, calendarView === 'year' && styles.calendarToggleTextActive, isDark && calendarView !== 'year' && { color: '#94a3b8' }]}>Yıllık</Text>
                  </TouchableOpacity>
                </View>

                {/* Month View */}
                {calendarView === 'month' && (
                  <View style={styles.calendarContent}>
                    <View style={styles.calendarNavRow}>
                      <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.calendarNavBtn}>
                        <ChevronLeft color={isDark ? '#94a3b8' : '#6b7280'} size={24} />
                      </TouchableOpacity>
                      <Text style={[styles.calendarMonthText, isDark && { color: '#f8fafc' }]}>
                        {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                      </Text>
                      <TouchableOpacity onPress={() => changeMonth(1)} style={styles.calendarNavBtn}>
                        <ChevronRight color={isDark ? '#94a3b8' : '#6b7280'} size={24} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.calendarDaysHeader}>
                      {DAYS.map((day) => (
                        <Text key={day} style={[styles.calendarDayName, isDark && { color: '#94a3b8' }]}>{day}</Text>
                      ))}
                    </View>

                    <View style={styles.calendarGrid}>
                      {getDaysInMonth(selectedDate).map((day, index) => {
                        const isToday = day === new Date().getDate() && 
                          selectedDate.getMonth() === new Date().getMonth() && 
                          selectedDate.getFullYear() === new Date().getFullYear();
                        
                        const { specialDay, dailyEvents } = day ? getDayContent(day, selectedDate.getMonth()) : { specialDay: null, dailyEvents: [] };
                        const hasContent = specialDay || dailyEvents.length > 0;

                        return (
                          <TouchableOpacity 
                            key={index} 
                            style={styles.calendarDayCell}
                            onPress={() => day && hasContent && setSelectedDay({ day, specialDay, events: dailyEvents })}
                            activeOpacity={hasContent ? 0.7 : 1}
                          >
                            {day && (
                              <View style={[
                                styles.calendarDay, 
                                isToday && styles.calendarDayToday,
                                isToday && isDark && { backgroundColor: Colors.dark.accent },
                                specialDay && !isToday && { backgroundColor: specialDay.color + '20', borderWidth: 1.5, borderColor: specialDay.color },
                                !specialDay && dailyEvents.length > 0 && !isToday && {
                                  backgroundColor: (isDark ? Colors.dark.accent : Colors.primary.indigo) + '22',
                                  borderWidth: 1,
                                  borderColor: isDark ? Colors.dark.accent : Colors.primary.indigo,
                                  borderStyle: 'dashed',
                                }
                              ]}>
                                <Text style={[
                                  styles.calendarDayText, 
                                  isToday && styles.calendarDayTextToday, 
                                  isDark && !isToday && { color: '#f8fafc' },
                                  specialDay && !isToday && { color: specialDay.color, fontWeight: 'bold' },
                                  !specialDay && dailyEvents.length > 0 && !isToday && { color: isDark ? Colors.dark.highlight : Colors.primary.indigo }
                                ]}>
                                  {day}
                                </Text>
                                <View style={styles.indicatorContainer}>
                                  {specialDay && <Text style={styles.specialDayEmojiMini}>{specialDay.emoji}</Text>}
                                  {dailyEvents.length > 0 && (
                                    <View style={[styles.eventDot, isDark && { backgroundColor: Colors.dark.accent }]} />
                                  )}
                                </View>
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Seçili Gün Detayı (Özel Gün veya Etkinlik) */}
                    {selectedDay && (
                      <View style={styles.selectedDayDetailContainer}>
                        {selectedDay.specialDay && (
                          <TouchableOpacity 
                            style={[styles.specialDayCard, { backgroundColor: selectedDay.specialDay.color + '15', borderColor: selectedDay.specialDay.color }]}
                            onPress={() => setSelectedDay(null)}
                            activeOpacity={0.9}
                          >
                            <View style={styles.specialDayCardHeader}>
                              <Text style={styles.specialDayCardEmoji}>{selectedDay.specialDay.emoji}</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.specialDayCardTitle, { color: selectedDay.specialDay.color }]}>
                                  {selectedDay.specialDay.name}
                                </Text>
                                <Text style={[styles.specialDayCardDate, isDark && { color: '#94a3b8' }]}>
                                  {selectedDay.day} {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )}

                        {selectedDay.events.map((event, idx) => (
                          <TouchableOpacity 
                            key={idx}
                            style={[styles.eventDetailCard, isDark && { backgroundColor: '#334155' }]}
                            onPress={() => {
                                setCalendarVisible(false);
                                navigation.navigate('Events');
                            }}
                          >
                            <View style={styles.eventDetailIcon}>
                                <Calendar color={isDark ? Colors.dark.accent : Colors.primary.indigo} size={20} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.eventDetailTitle, isDark && { color: '#f8fafc' }]}>{event.title}</Text>
                                <Text style={styles.eventDetailLocation}>{event.location} • {event.category}</Text>
                            </View>
                            <ChevronRight color="#94a3b8" size={20} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Bu Aydaki Özel Günler Listesi */}
                    <View style={styles.specialDaysSection}>
                      <Text style={[styles.specialDaysSectionTitle, isDark && { color: '#f8fafc' }]}>
                        Bu Aydaki Özel Günler
                      </Text>
                      {(() => {
                        const monthSpecialDays = Object.entries(SPECIAL_DAYS)
                          .filter(([key]) => {
                            const [month] = key.split('-').map(Number);
                            return month === selectedDate.getMonth() + 1;
                          })
                          .sort((a, b) => {
                            const dayA = parseInt(a[0].split('-')[1]);
                            const dayB = parseInt(b[0].split('-')[1]);
                            return dayA - dayB;
                          });
                        
                        if (monthSpecialDays.length === 0) {
                          return (
                            <Text style={[styles.noSpecialDays, isDark && { color: '#64748b' }]}>
                              Bu ayda özel gün bulunmuyor
                            </Text>
                          );
                        }
                        
                        return monthSpecialDays.map(([key, value]) => {
                          const day = key.split('-')[1];
                          return (
                            <View key={key} style={[styles.specialDayRow, isDark && { backgroundColor: '#1e293b' }]}>
                              <View style={[styles.specialDayDot, { backgroundColor: value.color }]} />
                              <Text style={styles.specialDayRowEmoji}>{value.emoji}</Text>
                              <Text style={[styles.specialDayRowDate, isDark && { color: '#94a3b8' }]}>{day}</Text>
                              <Text style={[styles.specialDayRowName, isDark && { color: '#f8fafc' }]} numberOfLines={1}>
                                {value.name}
                              </Text>
                            </View>
                          );
                        });
                      })()}
                    </View>
                  </View>
                )}

                {/* Year View */}
                {calendarView === 'year' && (
                  <View style={styles.calendarContent}>
                    <View style={styles.calendarNavRow}>
                      <TouchableOpacity onPress={() => changeYear(-1)} style={styles.calendarNavBtn}>
                        <ChevronLeft color={isDark ? '#94a3b8' : '#6b7280'} size={24} />
                      </TouchableOpacity>
                      <Text style={[styles.calendarYearText, isDark && { color: '#f8fafc' }]}>
                        {selectedDate.getFullYear()}
                      </Text>
                      <TouchableOpacity onPress={() => changeYear(1)} style={styles.calendarNavBtn}>
                        <ChevronRight color={isDark ? '#94a3b8' : '#6b7280'} size={24} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.calendarMonthsGrid}>
                      {MONTHS.map((month, index) => {
                        const isCurrentMonth = index === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear();
                        return (
                          <TouchableOpacity
                            key={month}
                            style={[
                              styles.calendarMonthCell,
                              isCurrentMonth && styles.calendarMonthCellActive,
                              isCurrentMonth && isDark && { backgroundColor: Colors.dark.accent },
                              isDark && !isCurrentMonth && { backgroundColor: '#334155' },
                            ]}
                            onPress={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setMonth(index);
                              setSelectedDate(newDate);
                              setCalendarView('month');
                            }}
                          >
                            <Text style={[
                              styles.calendarMonthName, 
                              isCurrentMonth && styles.calendarMonthNameActive, 
                              isDark && !isCurrentMonth && { color: '#f8fafc' }
                            ]}>
                              {month.slice(0, 3)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Go to Events Button */}
                <TouchableOpacity
                  style={[styles.calendarEventsBtn, isDark && { backgroundColor: Colors.dark.accent }]}
                  onPress={() => {
                    setCalendarVisible(false);
                    navigation.navigate('Events');
                  }}
                >
                  <Text style={styles.calendarEventsBtnText}>Etkinliklere Git</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    ambientOrbsContainer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
    ambientOrb: {
      position: 'absolute',
      borderRadius: 999,
      width: 180,
      height: 180,
    },
    ambientOrb1: { top: '38%', left: '-15%', backgroundColor: 'rgba(229, 157, 44, 0.06)' },
    ambientOrb2: { top: '42%', right: '-10%', backgroundColor: 'rgba(243, 213, 141, 0.05)' },
    ambientOrb3: { top: '52%', left: '25%', backgroundColor: 'rgba(235, 221, 197, 0.04)' },
    statusBarArea: { backgroundColor: 'transparent' },
    container: { flex: 1, backgroundColor: 'transparent' },
    dashboardInner: { paddingBottom: 24 },
    header: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    headerSearchBtn: { padding: 8 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24 },
    badgeText: { fontFamily: 'PlusJakartaSans_700Bold', color: Colors.white },
    greeting: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: Colors.white, marginTop: 10 },
    greetingSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
    statsCard: {
      flexDirection: 'row',
      borderRadius: 30,
      marginHorizontal: 20,
      marginTop: -26,
      height: 100,
      shadowColor: Platform.OS === 'android' ? 'transparent' : '#0f1a2e',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: Platform.OS === 'android' ? 0 : 0.2,
      shadowRadius: Platform.OS === 'android' ? 0 : 24,
      elevation: Platform.OS === 'android' ? 0 : 12,
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)'
    },
    statsSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    statsLeft: { flex: 1, alignItems: 'center' },
    statsRight: { flex: 1, alignItems: 'center' },
    statsDivider: { width: 1, backgroundColor: '#e5e7eb', height: '60%' },
    statsDividerWhite: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', height: '60%' },
    statsTitle: { color: '#9ca3af', fontWeight: '600', fontSize: 10, marginBottom: 4 },
    statsTitleWhite: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 12, marginBottom: 4 },
    statsValue: { fontSize: 14, fontWeight: 'bold', color: Colors.darkGray },
    statsValueWhite: { fontSize: 18, fontWeight: 'bold', color: Colors.white },
    weatherStatsRow: { flexDirection: 'row', alignItems: 'center' },
    calendarStatsRow: { flexDirection: 'row', alignItems: 'center' },
    content: { paddingVertical: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.primaryHex, paddingHorizontal: 20, marginBottom: 12 },
    sectionTitleWithMargin: { marginTop: 24 },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20,
        marginTop: 28,
        marginBottom: 12,
    },
    sectionTitleInHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.primaryHex,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seeAllText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary.indigo,
    },
    quickAccessContainer: { paddingHorizontal: 20, marginTop: 8 },
    bentoGrid: { paddingHorizontal: 20, marginTop: 12, gap: 12 },
    bentoRow1: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    bentoRow2: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    bentoSurfaceFill: { borderRadius: 30 },
    bentoFullWidth: {
      width: '100%', minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, marginBottom: 12,
      shadowColor: Platform.OS === 'android' ? 'transparent' : '#0f1a2e',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: Platform.OS === 'android' ? 0 : 0.18,
      shadowRadius: Platform.OS === 'android' ? 0 : 24,
      elevation: Platform.OS === 'android' ? 0 : 10,
    },
    bentoLarge: {
      flex: 2, minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin,
      shadowColor: Platform.OS === 'android' ? 'transparent' : '#0f1a2e',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: Platform.OS === 'android' ? 0 : 0.18,
      shadowRadius: Platform.OS === 'android' ? 0 : 24,
      elevation: Platform.OS === 'android' ? 0 : 10,
    },
    bentoSmall: {
      flex: 1, minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin,
      shadowColor: Platform.OS === 'android' ? 'transparent' : '#0f1a2e',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: Platform.OS === 'android' ? 0 : 0.18,
      shadowRadius: Platform.OS === 'android' ? 0 : 24,
      elevation: Platform.OS === 'android' ? 0 : 10,
    },
    bentoMedium: { flex: 1, minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    bentoSquare: { flex: 1, aspectRatio: 1, minHeight: 90, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    bentoWide: { minHeight: 80, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    bentoGlassWrapper: { position: 'relative', flex: 1 },
    bentoOverlay: { borderRadius: 30 },
    bentoGlass: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' },
    bentoIconGlow: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 4,
    },
    etkinlikLottieWrapper: {
      width: 48,
      height: 48,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      borderRadius: 12,
    },
    etkinlikLottie: {
      width: 48,
      height: 48,
      backgroundColor: 'transparent',
    },
    bentoLottieSmallWrapper: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: 'transparent',
      borderRadius: 10,
    },
    bentoLottieSmall: {
      width: 40,
      height: 40,
      backgroundColor: 'transparent',
    },
    bentoTitle: { marginTop: 10, fontSize: 13, fontWeight: '400', letterSpacing: 1.2, color: Colors.primaryHex },
    bentoTitleSmall: { marginTop: 8, fontSize: 10, fontWeight: '400', letterSpacing: 0.8, color: Colors.primaryHex },

    // ŞanlıSosyal ana sayfa kutucuğu (mavi kart)
    radarAmberOrb: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(56,189,248,0.1)',
      top: -60,
      right: -40,
    },
    radarDot: {
      position: 'absolute',
      borderRadius: 50,
      backgroundColor: '#38bdf8',
    },
    radarIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8,
    },
    radarIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(56,189,248,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(56,189,248,0.32)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    radarLiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(34,197,94,0.15)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(34,197,94,0.3)',
    },
    radarLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#22c55e',
    },
    radarLiveLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#22c55e',
      letterSpacing: 1,
    },
    radarBentoTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#7dd3fc',
      letterSpacing: -0.3,
    },
    radarBentoSub: {
      fontSize: 12,
      color: 'rgba(125,211,252,0.65)',
      marginTop: 3,
      fontWeight: '500',
    },
    quickAccessGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    quickAccessGridBottom: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 12,
    },
    quickAccessItem: { 
        alignItems: 'center', 
        width: '31%',
    },
    quickAccessIcon: { 
        width: 56, 
        height: 56, 
        borderRadius: 18, 
        overflow: 'hidden', 
        borderWidth: 1, 
        borderColor: 'rgba(255, 255, 255, 0.5)' 
    },
    blurView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    colorOverlay: { ...StyleSheet.absoluteFillObject },
    quickAccessText: { 
        marginTop: 10, 
        fontWeight: '500', 
        color: Colors.darkGray, 
        fontSize: 10, 
        textAlign: 'center',
        opacity: 0.8,
        lineHeight: 14,
    },
    partnersScrollContent: { paddingHorizontal: 20, paddingVertical: 4 },
    emptyFirsatContainer: { minHeight: 140, justifyContent: 'center', alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, marginHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    emptyFirsatContainerDark: { backgroundColor: 'rgba(51,65,85,0.5)', borderColor: 'rgba(255,255,255,0.1)' },
    emptyFirsatIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(13,148,136,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    emptyFirsatTitle: { fontSize: 16, fontWeight: '600', color: Colors.darkGray, marginBottom: 4 },
    emptyFirsatSub: { fontSize: 14, color: '#64748b', marginBottom: 16 },
    emptyFirsatCta: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(13,148,136,0.12)', borderRadius: 12 },
    emptyFirsatCtaText: { fontSize: 14, fontWeight: '600', color: Colors.primary.indigo },
    partnerCard: { width: 170, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 14, marginRight: 12, justifyContent: 'space-between', backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
    partnerIconWrapper: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    partnerName: { fontSize: 14, fontWeight: '600', color: Colors.darkGray, marginBottom: 4 },
    partnerOffer: { fontSize: 13, fontWeight: '500', color: '#4b5563' },
    widgetsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, marginBottom: 8, justifyContent: 'space-between' },
    // widgetCard styles (General shape)
    widgetCard: { borderRadius: 24, paddingHorizontal: 10, paddingVertical: 8, width: '48%', height: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    widgetLabel: { color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: 4, fontSize: 10 },
    // Weather card internals (Layout)
    weatherCard: { justifyContent: 'space-between', flexDirection: 'row', alignItems: 'center' },
    weatherTemp: { color: Colors.white, fontSize: 24, fontWeight: 'bold' },
    weatherIconWrapper: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    quoteCard: { position: 'relative', borderRadius: 24, height: 112, paddingHorizontal: 14, paddingVertical: 12, justifyContent: 'flex-start', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    quoteHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    widgetLabelQuote: { color: '#ffffff' },
    quoteText: { marginTop: 4, fontSize: 11, lineHeight: 15, fontWeight: '600', color: '#ffffff' },
    radarHeroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    radarHeroIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(56,189,248,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(56,189,248,0.28)',
    },
    radarHeroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: 'rgba(34,197,94,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(34,197,94,0.24)',
    },
    radarHeroLiveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#22c55e',
    },
    radarHeroLiveText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#22c55e',
      letterSpacing: 0.6,
    },
    radarHeroTitle: {
      fontSize: 21,
      fontWeight: '800',
      color: '#7dd3fc',
      letterSpacing: -0.4,
    },
    radarHeroSub: {
      marginTop: 2,
      fontSize: 14,
      lineHeight: 19,
      fontWeight: '600',
      color: 'rgba(125,211,252,0.82)',
      maxWidth: '100%',
    },
    radarHeroPulse: {
      borderRadius: 26,
      borderWidth: 1,
      borderColor: 'rgba(96,165,250,0.18)',
      shadowColor: '#60a5fa',
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    promoBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(2,6,23,0.58)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    promoCard: {
      width: '100%',
      borderRadius: 20,
      backgroundColor: '#ffffff',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(15,23,42,0.08)',
    },
    promoCardDark: {
      backgroundColor: '#0f172a',
      borderColor: 'rgba(148,163,184,0.24)',
    },
    promoClose: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 2,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.78)',
    },
    promoCloseDark: {
      backgroundColor: 'rgba(15,23,42,0.72)',
      borderWidth: 1,
      borderColor: 'rgba(148,163,184,0.35)',
    },
    promoImage: {
      width: '100%',
      height: 150,
    },
    promoBody: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    promoTitle: {
      color: '#0f172a',
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 6,
    },
    promoTitleDark: {
      color: '#f8fafc',
    },
    promoSubtitle: {
      color: '#475569',
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
    },
    promoSubtitleDark: {
      color: '#cbd5e1',
    },
    guestModalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(2, 6, 23, 0.58)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    guestModalCard: {
      width: '100%',
      borderRadius: 22,
      backgroundColor: '#ffffff',
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(15,23,42,0.08)',
    },
    guestModalCardDark: {
      backgroundColor: '#0f172a',
      borderColor: 'rgba(148,163,184,0.2)',
    },
    guestModalBadge: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'rgba(37,99,235,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(37,99,235,0.18)',
      marginBottom: 12,
    },
    guestModalBadgeDark: {
      backgroundColor: 'rgba(14,165,233,0.18)',
      borderColor: 'rgba(125,211,252,0.35)',
    },
    guestModalBadgeText: {
      color: '#1d4ed8',
      fontSize: 12,
      fontWeight: '700',
    },
    guestModalBadgeTextDark: {
      color: '#bae6fd',
    },
    guestModalTitle: {
      textAlign: 'center',
      color: '#0f172a',
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 8,
    },
    guestModalTitleDark: {
      color: '#f8fafc',
    },
    guestModalSubtitle: {
      textAlign: 'center',
      color: '#475569',
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
    },
    guestModalSubtitleDark: {
      color: '#cbd5e1',
    },
    guestModalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    guestModalSecondaryBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e2e8f0',
    },
    guestModalSecondaryBtnDark: {
      backgroundColor: '#1e293b',
    },
    guestModalSecondaryText: {
      color: '#334155',
      fontSize: 14,
      fontWeight: '700',
    },
    guestModalSecondaryTextDark: {
      color: '#cbd5e1',
    },
    guestModalPrimaryBtn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#2563eb',
    },
    guestModalPrimaryBtnDark: {
      backgroundColor: '#0ea5e9',
    },
    guestModalPrimaryText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    // Calendar Modal Styles
    calendarModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    calendarModalCard: { backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, height: '80%' },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    calendarTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.darkGray },
    calendarCloseBtn: { padding: 8 },
    calendarToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 16, padding: 4, marginBottom: 20 },
    calendarToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
    calendarToggleBtnActive: { backgroundColor: Colors.primary.indigo },
    calendarToggleText: { fontWeight: '600', color: '#6b7280' },
    calendarToggleTextActive: { color: Colors.white },
    calendarContent: { marginBottom: 20 },
    calendarNavRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    calendarNavBtn: { padding: 8 },
    calendarMonthText: { fontSize: 18, fontWeight: 'bold', color: Colors.darkGray },
    calendarYearText: { fontSize: 24, fontWeight: 'bold', color: Colors.darkGray },
    calendarDaysHeader: { flexDirection: 'row', marginBottom: 10 },
    calendarDayName: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#9ca3af' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calendarDayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    calendarDay: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    calendarDayToday: { backgroundColor: Colors.primary.indigo },
    calendarDayText: { fontSize: 14, fontWeight: '500', color: Colors.darkGray },
    calendarDayTextToday: { color: Colors.white, fontWeight: 'bold' },
    calendarMonthsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    calendarMonthCell: { width: '30%', paddingVertical: 20, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', marginBottom: 12 },
    calendarMonthCellActive: { backgroundColor: Colors.primary.indigo },
    calendarMonthName: { fontSize: 16, fontWeight: '600', color: Colors.darkGray },
    calendarMonthNameActive: { color: Colors.white },
    calendarEventsBtn: { backgroundColor: Colors.primary.indigo, paddingVertical: 16, borderRadius: 20, alignItems: 'center', marginTop: 10, marginBottom: 20 },
    calendarEventsBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
    // Özel Günler Stilleri
    specialDayEmoji: { fontSize: 10, marginTop: 2 },
    specialDayCard: { marginTop: 16, padding: 14, borderRadius: 16, borderWidth: 2 },
    specialDayCardHeader: { flexDirection: 'row', alignItems: 'center' },
    specialDayCardEmoji: { fontSize: 32, marginRight: 12 },
    specialDayCardTitle: { fontSize: 16, fontWeight: 'bold' },
    specialDayCardDate: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    specialDayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    specialDayBadgeText: { color: 'white', fontSize: 11, fontWeight: '600' },
    specialDaysSection: { marginTop: 20 },
    specialDaysSectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.darkGray, marginBottom: 12 },
    noSpecialDays: { fontSize: 13, color: '#9ca3af', fontStyle: 'italic' },
    specialDayRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8 },
    specialDayDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    specialDayRowEmoji: { fontSize: 16, marginRight: 8 },
    specialDayRowDate: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginRight: 8, width: 24 },
    specialDayRowName: { fontSize: 13, fontWeight: '500', color: Colors.darkGray, flex: 1 },
    // Genç Kart Fırsatları Stilleri
    partnersScrollWrapper: { position: 'relative', width: '100%' },
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      gap: 8,
    },
    paginationDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#d1d5db',
    },
    paginationDotActive: {
      width: 24,
      backgroundColor: Colors.primary.indigo,
    },
    // Yeni Etkinlik Stilleri
    indicatorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: -2 },
    specialDayEmojiMini: { fontSize: 8 },
    eventDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.primary.indigo, marginLeft: 2 },
    selectedDayDetailContainer: { marginTop: 16, gap: 8 },
    eventDetailCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 12, borderRadius: 20, gap: 12 },
    eventDetailIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center' },
    eventDetailTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.darkGray },
    eventDetailLocation: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});

export default HomeScreen;