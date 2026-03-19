import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  PanResponder,
  Animated,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  Calendar, BookOpen, User, Megaphone, Palette, Bus, Users, Search,
  Flame, QrCode, X, ChevronLeft, ChevronRight, Sparkles,
  CloudRain, Sun, Cloud, CloudSnow, CloudLightning, CloudDrizzle,
  Tag, Coffee, Shirt, Smartphone, Ticket, GraduationCap, Gift,
  Pill, Library, Route, Radio
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Gradients, DribbbleColors } from '@/constants/Colors';
import AnimatedPressable from '@/components/AnimatedPressable';
import AnimatedListItem from '@/components/AnimatedListItem';
import Skeleton from '@/components/Skeleton';
import { MOCK_BUSES, MOCK_PARTNERS, MOCK_EVENTS } from '@/api/mockData';
import { HomeScreenProps, MainTabParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
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

interface StoryData {
  id: number;
  baslik: string;
  aciklama?: string;
  resim_url?: string;
  icon?: string;
  sira?: number;
}

// Icon mapping
const ICON_MAP: Record<string, any> = {
  'user': User,
  'megaphone': Megaphone,
  'palette': Palette,
  'bus': Bus,
  'users': Users,
};

const DEFAULT_STORIES = [
  { name: 'Kültür Sanat', icon: Palette, image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=2670&auto=format&fit=crop' },
  { name: 'Ulaşım', icon: Bus, image: 'https://images.unsplash.com/photo-1570125909232-eb263c1869e7?q=80&w=2670&auto=format&fit=crop' },
  { name: 'Gençlik', icon: Users, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop' },
  { name: 'Duyurular', icon: Megaphone, image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2670&auto=format&fit=crop' },
];

const QUICK_ACCESS_NAV = [
    { name: 'Etkinlik', icon: Calendar, color: '#fecaca', iconColor: '#b91c1c', screen: 'Events', type: 'stack' },
    { name: 'Keşfet', icon: BookOpen, color: '#bfdbfe', iconColor: '#1d4ed8', screen: 'Magazine', type: 'stack' },
    { name: 'Nöbetçi Eczane', icon: Pill, color: '#fbcfe8', iconColor: '#be185d', screen: 'PharmacyList', type: 'stack' },
    { name: 'Kütüphaneler', icon: Library, color: '#bbf7d0', iconColor: '#15803d', screen: 'LibraryList', type: 'stack' },
    { name: 'Gezi Rotası', icon: Route, color: '#ddd6fe', iconColor: '#6d28d9', screen: 'CulturalRoute', type: 'stack' },
];

const QUOTES_OF_DAY = [
  'Bugün Urfa\'yı keşfet!',
  'Küçük bir adım, büyük bir değişimin başlangıcı olabilir.',
  'Şehrini ne kadar tanırsan, o kadar çok seversin.',
  'Bir etkinlik, bir arkadaşlık, bir anı demek.',
  'Gençken gez, gör, dene; sonrası kendiliğinden gelir.',
];

const STORY_DETAILS: Record<string, { description: string }> = {
  'Kültür Sanat': { description: 'Konserler, sergiler, tiyatrolar ve çok daha fazlası burada.' },
  Ulaşım: { description: 'Otobüs hatları, seferler ve kampüs ulaşımı hakkında hızlı bilgiler.' },
  Gençlik: { description: 'Gençlik merkezleri, kulüpler ve etkinliklerden haberdar ol.' },
  Duyurular: { description: 'Önemli duyurular, haberler ve güncellemeler burada.' },
};

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const nextBus = MOCK_BUSES[0];
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0); 
  const rainAnim = useRef(new Animated.Value(0)).current;
  
  // Takvim Modal State
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarView, setCalendarView] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeCardIndex, setActiveCardIndex] = useState(0);
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
  const [loadingFirsatlar, setLoadingFirsatlar] = useState(true);
  
  // Supabase Story State
  const [stories, setStories] = useState<StoryData[]>([]);
  const [loadingStories, setLoadingStories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(radarPulse, { toValue: 0, duration: 1300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [radarPulse]);
  
  // Story detayları - Supabase'den gelen veriler varsa onları kullan
  const getStoryDetails = (storyName: string): { description: string } => {
    const story = stories.find(s => s.baslik === storyName);
    if (story && story.aciklama) {
      return { description: story.aciklama };
    }
    
    // Default detaylar
    const DEFAULT_STORY_DETAILS: Record<string, { description: string }> = {
      'Kültür Sanat': { description: 'Konserler, sergiler, tiyatrolar ve çok daha fazlası burada.' },
      Ulaşım: { description: 'Otobüs hatları, seferler ve kampüs ulaşımı hakkında hızlı bilgiler.' },
      Gençlik: { description: 'Gençlik merkezleri, kulüpler ve etkinliklerden haberdar ol.' },
      Duyurular: { description: 'Önemli duyurular, haberler ve güncellemeler burada.' },
    };
    
    return DEFAULT_STORY_DETAILS[storyName] || { description: '' };
  };
  
  // HEADER_NAV - Her zaman Kültür Sanat, Ulaşım, Gençlik, Duyurular (varsayılan hikayeler)
  const headerNav = DEFAULT_STORIES;
  
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
  const getDayContent = (day: number, month: number) => {
    const key = `${month + 1}-${day}`;
    let specialDay = SPECIAL_DAYS[key] || null;
    
    // 21 Mart çakışması için özel kontrol
    if (key === '3-21') {
      specialDay = SPECIAL_DAYS['3-21-RELIGIOUS'] || SPECIAL_DAYS['3-21'];
    }

    // Etkinlik kontrolü
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const dateStr = `${day} ${monthNames[month]}`;
    const dailyEvents = MOCK_EVENTS.filter(e => e.date === dateStr);

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

  // Hikayeleri Supabase'den Çek
  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from('hikayeler')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data && data.length > 0) {
        setStories(data);
      }
      if (error) console.log("Hikaye hatası:", error);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    fetchAllWeatherData();
    fetchFirsatlar();
    fetchStories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    setLoadingFirsatlar(true);
    setLoadingStories(true);
    await Promise.all([
      fetchAllWeatherData(),
      fetchFirsatlar(),
      fetchStories(),
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

  const activeStory = activeStoryIndex !== null ? headerNav[activeStoryIndex] : null;

  const handleNavigation = (item: typeof QUICK_ACCESS_NAV[0]) => {
      if(item.type === 'tab') {
          navigation.navigate('Main', { screen: item.screen as keyof MainTabParamList });
      } else {
          navigation.navigate(item.screen as 'Events' | 'Magazine' | 'PharmacyList' | 'LibraryList' | 'CulturalRoute');
      }
  };

  const handleBentoPress = (item: typeof QUICK_ACCESS_NAV[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleNavigation(item);
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
      return { icon: Gift, color: '#FF6B35', bg: '#fff7ed' };
    }
    
    // Kategori değerini normalize et (trim, küçük harfe çevir, boşlukları normalize et)
    const normalizedKategori = kategori.trim().toLowerCase().replace(/\s+/g, ' ');
    
    // Kategori eşleştirmesi (case-insensitive ve esnek)
    if (normalizedKategori.includes('yiyecek') || normalizedKategori.includes('içecek')) {
      return { icon: Coffee, color: '#e67e22', bg: '#fff7ed' };
    }
    if (normalizedKategori.includes('giyim')) {
      return { icon: Shirt, color: '#9b59b6', bg: '#fbf7ff' };
    }
    if (normalizedKategori.includes('teknoloji')) {
      return { icon: Smartphone, color: '#3498db', bg: '#f0f9ff' };
    }
    if (normalizedKategori.includes('etkinlik') || normalizedKategori.includes('bileti')) {
      return { icon: Ticket, color: '#e74c3c', bg: '#fef2f2' };
    }
    if (normalizedKategori.includes('öğrenci') || normalizedKategori.includes('özel')) {
      return { icon: GraduationCap, color: '#2ecc71', bg: '#f0fdf4' };
    }
    if (normalizedKategori.includes('indirim')) {
      return { icon: Tag, color: '#f43f5e', bg: '#fff1f2' };
    }
    if (normalizedKategori.includes('kampanya')) {
      return { icon: Megaphone, color: '#f59e0b', bg: '#fffbeb' };
    }
    
    // Default tema
    return { icon: Gift, color: '#FF6B35', bg: '#fff7ed' };
  };

  const handleNextStory = () => {
    if (activeStoryIndex === null) return;
    const nextIndex = activeStoryIndex + 1;
    if (nextIndex < headerNav.length) {
      setActiveStoryIndex(nextIndex);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handleStoryDetail = () => {
    if (activeStoryIndex === null) return;
    const story = headerNav[activeStoryIndex];
    setActiveStoryIndex(null); // Modal'ı kapat
    switch (story.name) {
      case 'Ulaşım': 
        navigation.navigate('Main', { screen: 'Transport' as keyof MainTabParamList }); 
        break;
      case 'Kültür Sanat': 
        navigation.navigate('Magazine'); 
        break;
      case 'Gençlik': 
        navigation.navigate('Events'); 
        break;
      case 'Duyurular':
        navigation.navigate('Notifications');
        break;
      default: 
        break;
    }
  };

  useEffect(() => {
    if (activeStoryIndex === null) {
      setStoryProgress(0);
      return;
    }
    setStoryProgress(0);
    const totalDuration = 5000;
    const intervalMs = 50;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const ratio = Math.min(1, elapsed / totalDuration);
      setStoryProgress(ratio);
      if (ratio >= 1) {
        clearInterval(timer);
        handleNextStory();
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [activeStoryIndex]);

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 10,
      onPanResponderRelease: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy < -40) handleStoryDetail();
        else if (dy > 40) setActiveStoryIndex(null);
        else handleNextStory();
      },
    })
  ).current;

  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  return (
    <View style={styles.root}>
      <LinearGradient colors={isDark ? Gradients.background : Gradients.backgroundLight} style={StyleSheet.absoluteFill} />
      {isDark ? (
        <>
          <LinearGradient colors={Gradients.meshMarigold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.meshLayer]} pointerEvents="none" />
          <LinearGradient colors={Gradients.meshNavy} start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }} style={[StyleSheet.absoluteFill, styles.meshLayer]} pointerEvents="none" />
          <LinearGradient colors={Gradients.meshPearl} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0.5 }} style={[StyleSheet.absoluteFill, styles.meshLayer]} pointerEvents="none" />
          <LinearGradient colors={Gradients.meshBuff} start={{ x: 0.5, y: 1 }} end={{ x: 0.5, y: 0.3 }} style={[StyleSheet.absoluteFill, styles.meshLayer]} pointerEvents="none" />
        </>
      ) : (
        <>
          <LinearGradient colors={['rgba(240,230,255,0.25)', 'transparent', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.8 }} style={[StyleSheet.absoluteFill, { opacity: 0.9 }]} pointerEvents="none" />
          <LinearGradient colors={['transparent', 'rgba(225,240,255,0.2)', 'rgba(254,249,195,0.15)']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: 0.9 }]} pointerEvents="none" />
        </>
      )}
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
              colors={[Colors.primary.indigo]}
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
            <TouchableOpacity
              onPress={() => navigation.navigate('GlobalSearch')}
              style={styles.headerSearchBtn}
              activeOpacity={0.8}
            >
              <Search color={isDark ? Colors.white : DribbbleColors.textPrimary} size={22} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.greeting, !isDark && { color: DribbbleColors.textPrimary }]}>Selam, Mert! 👋</Text>
          <Text style={[styles.greetingSub, !isDark && { color: DribbbleColors.textSecondary }]}>Bugün nasıl gidiyor?</Text>

          <View style={styles.headerNavContainer}>
              {headerNav.map((item, index) => (
                  <TouchableOpacity
                    key={item.name}
                    style={styles.headerNavItem}
                    activeOpacity={0.9}
                    onPress={() => setActiveStoryIndex(index)}
                  >
                      <View style={[styles.storyBorder, !isDark && { borderColor: DribbbleColors.storyBorder }]}>
                        <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.headerNavImage} />
                      </View>
                      <Text style={[styles.headerNavText, !isDark && { color: DribbbleColors.textPrimary }]}>{item.name}</Text>
                  </TouchableOpacity>
              ))}
          </View>
        </LinearGradient>

        {/* Dashboard */}
        <View style={styles.dashboardInner}>
          <LinearGradient
            colors={isDark ? [Colors.dark.card, Colors.dark.border] : Gradients.statsCardLight}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.statsCard, !isDark && { borderColor: DribbbleColors.borderLight, shadowColor: '#334155', shadowOpacity: 0.06 }]}
          >
              <TouchableOpacity
                style={styles.statsSection}
                activeOpacity={0.9}
                onPress={handleWeatherDetail}
              >
                  <Text style={[styles.statsTitleWhite, !isDark && { color: DribbbleColors.textSecondary }]}>HAVA DURUMU</Text>
                  <View style={styles.weatherStatsRow}>
                    {getWeatherIcon(22, isDark ? Colors.buff : DribbbleColors.progressBlue)}
                    <Text style={[styles.statsValueWhite, { marginLeft: 6 }, !isDark && { color: DribbbleColors.textPrimary }]}>
                      {weatherData ? `${Math.round(weatherData.main.temp)}°` : '--'}
                    </Text>
                  </View>
              </TouchableOpacity>
              
              <View style={[styles.statsDividerWhite, !isDark && { backgroundColor: 'rgba(0,0,0,0.08)' }]} />
              
              <TouchableOpacity
                style={styles.statsSection}
                activeOpacity={0.9}
                onPress={() => setCalendarVisible(true)}
              >
                  <Text style={[styles.statsTitleWhite, !isDark && { color: DribbbleColors.textSecondary }]}>TAKVİM</Text>
                  <View style={styles.calendarStatsRow}>
                    <Calendar color={isDark ? Colors.primaryHex : DribbbleColors.progressBlue} size={22} />
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
                    { width: '100%', height: 152 },
                    !isDark && { borderColor: 'rgba(96,165,250,0.22)', shadowColor: '#60a5fa', shadowOpacity: 0.14, shadowRadius: 22 },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Sosyal')}
                >
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        StyleSheet.absoluteFill,
                        styles.radarHeroPulse,
                        {
                          opacity: radarGlowOpacity,
                          transform: [{ scale: radarGlowScale }],
                        },
                        !isDark && { borderColor: 'rgba(96,165,250,0.28)' },
                      ]}
                    />
                    <LinearGradient
                      colors={isDark ? ['#060c1a', '#0f172a', '#1a0a00'] : ['#cbd5e1', '#bfdbfe', '#eef2ff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.radarHeroHeader}>
                      <View style={[styles.radarHeroIcon, !isDark && { backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(59,130,246,0.22)' }]}>
                        <Radio color={isDark ? '#f59e0b' : '#60a5fa'} size={18} strokeWidth={2} />
                      </View>
                      <View style={[styles.radarHeroBadge, !isDark && { backgroundColor: 'rgba(96,165,250,0.10)', borderColor: 'rgba(96,165,250,0.18)' }]}>
                        <View style={styles.radarHeroLiveDot} />
                        <Text style={[styles.radarHeroLiveText, !isDark && { color: '#2563eb' }]}>CANLI</Text>
                      </View>
                    </View>
                    <Text style={[styles.radarHeroTitle, !isDark && { color: '#0f172a', fontSize: 17 }]}>Şehir Radarı</Text>
                    <Text style={[styles.radarHeroSub, !isDark && { color: 'rgba(37,99,235,0.68)' }]}>ŞanlıSosyal · son 4 saatteki anonim hareketlilik</Text>
                    <View style={styles.radarHeroMiniMap}>
                      <View style={[styles.radarHeroDot, { top: 16, left: 20, width: 14, height: 14, opacity: 0.24, backgroundColor: isDark ? '#f59e0b' : '#60a5fa' }]} />
                      <View style={[styles.radarHeroDot, { top: 30, left: 95, width: 18, height: 18, opacity: 0.32, backgroundColor: isDark ? '#f59e0b' : '#3b82f6' }]} />
                      <View style={[styles.radarHeroDot, { top: 10, left: 160, width: 10, height: 10, opacity: 0.20, backgroundColor: isDark ? '#f59e0b' : '#93c5fd' }]} />
                      <View style={[styles.radarHeroDot, { top: 46, left: 140, width: 24, height: 24, opacity: 0.26, backgroundColor: isDark ? '#f59e0b' : '#818cf8' }]} />
                    </View>
                </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, styles.sectionTitleWithMargin, { color: isDark ? Colors.buff : DribbbleColors.textPremium }, !isDark && { opacity: 0.9 }]}>HIZLI ERİŞİM</Text>
            
            {/* Bento Grid - Glassmorphism (Blur + Police Blue %15 + asimetrik border + inner shadow) */}
            <View style={styles.bentoGrid}>
              {/* Row 1: Etkinlik (eski haline döndü) */}
              <Animated.View style={[styles.bentoFullWidth, !isDark && { borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#1e293b', shadowOpacity: 0.06, shadowRadius: 24 }, { opacity: bentoAnims[0], transform: [{ translateY: bentoAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <AnimatedPressable
                  scaleTo={0.96}
                  style={styles.bentoGlassWrapper}
                  fill
                  onPress={() => {
                    etkinlikLottieRef.current?.play();
                    handleBentoPress(QUICK_ACCESS_NAV[0]);
                  }}
                >
                  {isDark ? (
                    <>
                      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={[StyleSheet.absoluteFill, styles.bentoPoliceOverlay]} />
                      <LinearGradient colors={Gradients.innerShadow} style={[StyleSheet.absoluteFill, styles.bentoInnerShadow]} />
                      <LinearGradient colors={Gradients.glassReflection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.bentoGlassReflection]} pointerEvents="none" />
                    </>
                  ) : (
                    <LinearGradient colors={Gradients.bentoLavender} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  )}
                  <View style={styles.bentoGlass}>
                    <View style={[styles.bentoIconGlow, styles.etkinlikLottieWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowPurple, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                      <LottieView
                        ref={etkinlikLottieRef}
                        source={require('@/assets/images/El calendario.json')}
                        autoPlay
                        loop
                        style={styles.etkinlikLottie}
                      />
                    </View>
                    <Text style={[styles.bentoTitle, !isDark && { color: DribbbleColors.textPremium, opacity: 0.95 }]}>{QUICK_ACCESS_NAV[0].name}</Text>
                  </View>
                </AnimatedPressable>
              </Animated.View>
              {/* Row 2: Keşfet (2/3) + Eczane (1/3) yan yana */}
              <View style={styles.bentoRow2}>
                <Animated.View style={[styles.bentoLarge, !isDark && { borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#1e293b', shadowOpacity: 0.06, shadowRadius: 24 }, { opacity: bentoAnims[1], transform: [{ translateY: bentoAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      kesfetLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[1]);
                    }}
                  >
                    {isDark ? (
                      <>
                        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={[StyleSheet.absoluteFill, styles.bentoPoliceOverlay]} />
                        <LinearGradient colors={Gradients.innerShadow} style={[StyleSheet.absoluteFill, styles.bentoInnerShadow]} />
                        <LinearGradient colors={Gradients.glassReflection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.bentoGlassReflection]} pointerEvents="none" />
                      </>
                    ) : (
                      <LinearGradient colors={Gradients.bentoLightBlue} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    )}
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.etkinlikLottieWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowBlue, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                        <LottieView
                          ref={kesfetLottieRef}
                          source={require('@/assets/images/Map pin location.json')}
                          autoPlay
                          loop
                          style={styles.etkinlikLottie}
                        />
                      </View>
                      <Text style={[styles.bentoTitle, !isDark && { color: DribbbleColors.textPremium, opacity: 0.95 }]}>{QUICK_ACCESS_NAV[1].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
                <Animated.View style={[styles.bentoSmall, !isDark && { borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#1e293b', shadowOpacity: 0.06, shadowRadius: 24 }, { opacity: bentoAnims[2], transform: [{ translateY: bentoAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      eczaneLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[2]);
                    }}
                  >
                    {isDark ? (
                      <>
                        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={[StyleSheet.absoluteFill, styles.bentoPoliceOverlay]} />
                        <LinearGradient colors={Gradients.innerShadow} style={[StyleSheet.absoluteFill, styles.bentoInnerShadow]} />
                        <LinearGradient colors={Gradients.glassReflection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.bentoGlassReflection]} pointerEvents="none" />
                      </>
                    ) : (
                      <LinearGradient colors={Gradients.bentoPink} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    )}
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.bentoLottieSmallWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowPink, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                        <LottieView
                          ref={eczaneLottieRef}
                          source={require('@/assets/images/AR Tablet.json')}
                          autoPlay
                          loop
                          style={styles.bentoLottieSmall}
                        />
                      </View>
                      <Text style={[styles.bentoTitleSmall, !isDark && { color: DribbbleColors.textPremium, opacity: 0.85 }]}>{QUICK_ACCESS_NAV[2].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              </View>
              {/* Row 3: Kütüphane (1/3) + Gezi (2/3) yan yana */}
              <View style={styles.bentoRow2}>
                <Animated.View style={[styles.bentoSmall, !isDark && { borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#1e293b', shadowOpacity: 0.06, shadowRadius: 24 }, { opacity: bentoAnims[3], transform: [{ translateY: bentoAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      kutuphaneLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[3]);
                    }}
                  >
                    {isDark ? (
                      <>
                        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={[StyleSheet.absoluteFill, styles.bentoPoliceOverlay]} />
                        <LinearGradient colors={Gradients.innerShadow} style={[StyleSheet.absoluteFill, styles.bentoInnerShadow]} />
                        <LinearGradient colors={Gradients.glassReflection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.bentoGlassReflection]} pointerEvents="none" />
                      </>
                    ) : (
                      <LinearGradient colors={Gradients.bentoMint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    )}
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.bentoLottieSmallWrapper, !isDark && { shadowColor: DribbbleColors.iconGlowMint, shadowOpacity: 0.4, shadowRadius: 12 }]}>
                        <LottieView
                          ref={kutuphaneLottieRef}
                          source={require('@/assets/images/Books.json')}
                          autoPlay
                          loop
                          style={styles.bentoLottieSmall}
                        />
                      </View>
                      <Text style={[styles.bentoTitleSmall, !isDark && { color: DribbbleColors.textPremium, opacity: 0.85 }]}>{QUICK_ACCESS_NAV[3].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
                <Animated.View style={[styles.bentoLarge, !isDark && { borderColor: 'rgba(255,255,255,0.4)', shadowColor: '#1e293b', shadowOpacity: 0.06, shadowRadius: 24 }, { opacity: bentoAnims[4], transform: [{ translateY: bentoAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                  <AnimatedPressable
                    scaleTo={0.96}
                    style={styles.bentoGlassWrapper}
                    fill
                    onPress={() => {
                      geziLottieRef.current?.play();
                      handleBentoPress(QUICK_ACCESS_NAV[4]);
                    }}
                  >
                    {isDark ? (
                      <>
                        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={[StyleSheet.absoluteFill, styles.bentoPoliceOverlay]} />
                        <LinearGradient colors={Gradients.innerShadow} style={[StyleSheet.absoluteFill, styles.bentoInnerShadow]} />
                        <LinearGradient colors={Gradients.glassReflection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, styles.bentoGlassReflection]} pointerEvents="none" />
                      </>
                    ) : (
                      <LinearGradient colors={Gradients.bentoYellow} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    )}
                    <View style={styles.bentoGlass}>
                      <View style={[styles.bentoIconGlow, styles.etkinlikLottieWrapper, !isDark ? { shadowColor: DribbbleColors.iconGlowYellow, shadowOpacity: 0.4, shadowRadius: 12 } : { shadowColor: Colors.cta }]}>
                        <LottieView
                          ref={geziLottieRef}
                          source={require('@/assets/images/Travel is fun.json')}
                          autoPlay
                          loop
                          style={[styles.etkinlikLottie, { backgroundColor: 'transparent' }]}
                        />
                      </View>
                      <Text style={[styles.bentoTitle, !isDark && { color: DribbbleColors.textPremium, opacity: 0.95 }]}>{QUICK_ACCESS_NAV[4].name}</Text>
                    </View>
                  </AnimatedPressable>
                </Animated.View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitleInHeader, { color: isDark ? Colors.buff : DribbbleColors.textPremium }, !isDark && { opacity: 0.9 }]}>Genç Kart Fırsatları</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Main', { screen: 'GencKart' as keyof MainTabParamList })}
                style={styles.seeAllButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: isDark ? Colors.primaryHex : DribbbleColors.progressBlue }]}>Tümünü Gör</Text>
                <ChevronRight color={isDark ? Colors.primaryHex : DribbbleColors.progressBlue} size={16} />
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
                      <Text style={[styles.emptyFirsatCtaText, isDark && { color: '#e2e8f0' }]}>Genç Kart'ı Keşfet</Text>
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
                                    { backgroundColor: theme.bg || '#fff7ed' }, 
                                    isDark && { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }
                                ]}
                                activeOpacity={0.9}
                                onPress={() => navigation.navigate('PartnerDetail', { partnerId: partner.id.toString() })}
                                >
                                <View style={[styles.partnerIconWrapper, { backgroundColor: isDark ? '#334155' : 'rgba(255,255,255,0.8)' }]}>
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

        {/* Story Modal */}
        <Modal visible={activeStoryIndex !== null} animationType="fade" transparent onRequestClose={() => setActiveStoryIndex(null)}>
          <View style={styles.storyModalBackdrop}>
            {activeStory && (
              <View style={styles.storyModalCard} {...panResponder.panHandlers}>
                <View style={styles.storyProgressBarBackground}>
                  <View style={[styles.storyProgressBarFill, { width: `${storyProgress * 100}%` }]} />
                </View>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleNextStory} activeOpacity={1}>
                  <Image source={typeof activeStory.image === 'string' ? { uri: activeStory.image } : activeStory.image} style={styles.storyImage} />
                </TouchableOpacity>
                <View style={styles.storyTextOverlay}>
                  <Text style={styles.storyTitle}>{activeStory.name}</Text>
                  {getStoryDetails(activeStory.name).description && (
                    <Text style={styles.storyDescription}>{getStoryDetails(activeStory.name).description}</Text>
                  )}
                  <View style={styles.storyCtaRow}>
                    <Text style={styles.storyHintText}>Yukarı kaydır → Detay</Text>
                    <TouchableOpacity style={styles.storyCtaButton} activeOpacity={0.9} onPress={handleStoryDetail}>
                      <Text style={styles.storyCtaText}>
                        {activeStory.name === 'Kültür Sanat' || activeStory.name === 'Gençlik' ? 'Etkinliklere Git' : activeStory.name === 'Ulaşım' ? 'Ulaşım Ekranına Git' : 'Detaya Git'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
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
                    style={[styles.calendarToggleBtn, calendarView === 'month' && styles.calendarToggleBtnActive]}
                    onPress={() => setCalendarView('month')}
                  >
                    <Text style={[styles.calendarToggleText, calendarView === 'month' && styles.calendarToggleTextActive, isDark && calendarView !== 'month' && { color: '#94a3b8' }]}>Aylık</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.calendarToggleBtn, calendarView === 'year' && styles.calendarToggleBtnActive]}
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
                                specialDay && !isToday && { backgroundColor: specialDay.color + '20', borderWidth: 1.5, borderColor: specialDay.color },
                                !specialDay && dailyEvents.length > 0 && !isToday && { backgroundColor: Colors.primary.indigo + '15', borderWidth: 1, borderColor: Colors.primary.indigo, borderStyle: 'dashed' }
                              ]}>
                                <Text style={[
                                  styles.calendarDayText, 
                                  isToday && styles.calendarDayTextToday, 
                                  isDark && !isToday && { color: '#f8fafc' },
                                  specialDay && !isToday && { color: specialDay.color, fontWeight: 'bold' },
                                  !specialDay && dailyEvents.length > 0 && !isToday && { color: Colors.primary.indigo }
                                ]}>
                                  {day}
                                </Text>
                                <View style={styles.indicatorContainer}>
                                  {specialDay && <Text style={styles.specialDayEmojiMini}>{specialDay.emoji}</Text>}
                                  {dailyEvents.length > 0 && <View style={styles.eventDot} />}
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
                                <Calendar color={Colors.primary.indigo} size={20} />
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
                              isDark && !isCurrentMonth && { backgroundColor: '#334155' }
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
                  style={styles.calendarEventsBtn}
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
    meshLayer: { opacity: 1 },
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
    headerSearchBtn: { padding: 8 },
    badge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 24 },
    badgeText: { fontFamily: 'PlusJakartaSans_700Bold', color: Colors.white },
    greeting: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 32, color: Colors.white, marginTop: 10 },
    greetingSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
    headerNavContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
    headerNavItem: { alignItems: 'center' },
    storyBorder: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f4a823' },
    headerNavImage: { width: 54, height: 54, borderRadius: 27, borderWidth: 0 },
    headerNavText: { color: Colors.white, marginTop: 8, fontWeight: '600' },
    statsCard: { flexDirection: 'row', borderRadius: 30, marginHorizontal: 20, marginTop: -50, height: 100, shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 12, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
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
    bentoGlassReflection: { borderRadius: 30, pointerEvents: 'none' },
    bentoFullWidth: {
      width: '100%', minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, marginBottom: 12,
      shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10,
    },
    bentoLarge: {
      flex: 2, minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin,
      shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10,
    },
    bentoSmall: {
      flex: 1, minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin,
      shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10,
    },
    bentoMedium: { flex: 1, minHeight: 100, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    bentoSquare: { flex: 1, aspectRatio: 1, minHeight: 90, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    bentoWide: { minHeight: 80, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: Colors.glassBorderThin, shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 },
    bentoGlassWrapper: { position: 'relative', flex: 1 },
    bentoPoliceOverlay: { backgroundColor: Colors.glassOverlay, borderRadius: 30 },
    bentoInnerShadow: { borderRadius: 30, pointerEvents: 'none' },
    bentoOverlay: { borderRadius: 30 },
    bentoGlass: { flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' },
    bentoIconGlow: {
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 4,
    },
    etkinlikLottieWrapper: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    etkinlikLottie: { width: 48, height: 48 },
    bentoLottieSmallWrapper: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    bentoLottieSmall: { width: 40, height: 40 },
    bentoTitle: { marginTop: 10, fontSize: 13, fontWeight: '400', letterSpacing: 1.2, color: Colors.primaryHex },
    bentoTitleSmall: { marginTop: 8, fontSize: 10, fontWeight: '400', letterSpacing: 0.8, color: Colors.primaryHex },

    // ŞanlıSosyal — Şehir Radarı bento kartı
    radarAmberOrb: {
      position: 'absolute',
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(245,158,11,0.12)',
      top: -60,
      right: -40,
    },
    radarDot: {
      position: 'absolute',
      borderRadius: 50,
      backgroundColor: '#f59e0b',
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
      backgroundColor: 'rgba(245,158,11,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.35)',
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
      color: '#fcd34d',
      letterSpacing: -0.3,
    },
    radarBentoSub: {
      fontSize: 12,
      color: 'rgba(252,211,77,0.6)',
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
    partnerCard: { width: 170, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 14, marginRight: 12, justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', shadowColor: '#0f1a2e', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
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
      marginBottom: 6,
    },
    radarHeroIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(245,158,11,0.14)',
      borderWidth: 1,
      borderColor: 'rgba(245,158,11,0.3)',
    },
    radarHeroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
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
      fontSize: 10,
      fontWeight: '700',
      color: '#22c55e',
      letterSpacing: 1,
    },
    radarHeroTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fcd34d',
      letterSpacing: -0.2,
    },
    radarHeroSub: {
      marginTop: 2,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '500',
      color: 'rgba(252,211,77,0.72)',
      maxWidth: '92%',
    },
    radarHeroMiniMap: {
      height: 30,
      marginTop: 6,
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.03)',
    },
    radarHeroDot: {
      position: 'absolute',
      borderRadius: 999,
      backgroundColor: '#f59e0b',
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
    storyModalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    storyModalCard: { width: '100%', maxWidth: 420, aspectRatio: 9 / 16, borderRadius: 28, overflow: 'hidden', backgroundColor: Colors.black, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    storyProgressBarBackground: { position: 'absolute', top: 10, left: 12, right: 12, height: 3, borderRadius: 999, backgroundColor: 'rgba(148,163,184,0.6)', overflow: 'hidden', zIndex: 2 },
    storyProgressBarFill: { height: '100%', backgroundColor: Colors.white, borderRadius: 999 },
    storyImage: { width: '100%', height: '100%', position: 'absolute' },
    storyTextOverlay: { position: 'absolute', left: 16, right: 16, bottom: 20 },
    storyTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 4 },
    storyDescription: { fontSize: 14, color: 'rgba(249,250,251,0.9)' },
    storyCtaRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    storyHintText: { fontSize: 11, color: 'rgba(209,213,219,0.9)' },
    storyCtaButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(79,70,229,0.9)' },
    storyCtaText: { fontSize: 12, fontWeight: '600', color: Colors.white },
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