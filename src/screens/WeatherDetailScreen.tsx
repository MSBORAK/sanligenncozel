import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  RefreshControl,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { Colors } from '@/constants/Colors';
import { 
  ArrowLeft, 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudDrizzle,
  Droplets,
  Wind,
  Thermometer,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  CloudSun,
  Moon,
  MapPin,
  Umbrella,
  Shirt,
  Glasses,
  AlertTriangle,
  Heart,
  Leaf,
  Sparkles,
  RefreshCw,
  CloudFog,
} from 'lucide-react-native';
import { useThemeMode } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

type WeatherDetailScreenProps = StackScreenProps<RootStackParamList, 'WeatherDetail'>;

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY ?? '';
const SEHIR_KOORDINAT = { lat: 37.1674, lon: 38.7955 };

// Gün isimleri
const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

const WeatherDetailScreen: React.FC<WeatherDetailScreenProps> = ({ route, navigation }) => {
  const { weatherData: initialWeather, forecastData: initialForecast } = route.params || {};
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  
  // State
  const [weatherData, setWeatherData] = useState<any>(initialWeather);
  const [forecastData, setForecastData] = useState<any>(initialForecast);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rainAnim = useRef(new Animated.Value(0)).current;

  // Başlangıç animasyonları
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Sürekli dönen animasyon (güneş için)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Yağmur animasyonu
    Animated.loop(
      Animated.timing(rainAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [weatherRes, forecastRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${SEHIR_KOORDINAT.lat}&lon=${SEHIR_KOORDINAT.lon}&units=metric&lang=tr&appid=${API_KEY}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${SEHIR_KOORDINAT.lat}&lon=${SEHIR_KOORDINAT.lon}&units=metric&lang=tr&appid=${API_KEY}`),
      ]);

      const weatherJson = await weatherRes.json();
      const forecastJson = await forecastRes.json();

      if (weatherJson.cod === 200) setWeatherData(weatherJson);
      if (forecastJson.cod === "200") setForecastData(forecastJson);
    } catch (error) {
      console.log("Yenileme hatası:", error);
    }
    setRefreshing(false);
  }, []);

  // Hata durumu
  if (!weatherData) {
    return (
      <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.errorContainer}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Cloud color="rgba(255,255,255,0.3)" size={80} />
          <Text style={styles.errorText}>Hava durumu verisi yüklenemedi</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBackBtn}>
            <Text style={styles.errorBackText}>Geri Dön</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Veri işleme
  const weatherConditionId = weatherData.weather[0].id;
  const temperature = Math.round(weatherData.main.temp);
  const feelsLike = Math.round(weatherData.main.feels_like);
  const humidity = weatherData.main.humidity;
  const windSpeed = Math.round(weatherData.wind.speed * 3.6);
  const description = weatherData.weather[0].description.charAt(0).toUpperCase() + weatherData.weather[0].description.slice(1);
  const cityName = weatherData.name;
  const tempMin = Math.round(weatherData.main.temp_min);
  const tempMax = Math.round(weatherData.main.temp_max);
  const visibility = weatherData.visibility ? Math.round(weatherData.visibility / 1000) : 10;
  const pressure = weatherData.main.pressure;
  const sunrise = weatherData.sys.sunrise;
  const sunset = weatherData.sys.sunset;

  // Gün doğumu/batımı formatla
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Gradient renkleri
  const getGradientColors = (): [string, string, string] => {
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;
    
    if (isNight) return ['#0f0c29', '#302b63', '#24243e'];
    if (weatherConditionId === 800) return ['#4facfe', '#0072ff', '#1e3c72'];
    if (weatherConditionId >= 801 && weatherConditionId <= 804) return ['#667eea', '#764ba2', '#f093fb'];
    if (weatherConditionId >= 500 && weatherConditionId < 600) return ['#4b6cb7', '#182848', '#2c3e50'];
    if (weatherConditionId >= 600 && weatherConditionId < 700) return ['#e6dada', '#274046', '#536976'];
    if (weatherConditionId >= 200 && weatherConditionId < 300) return ['#373b44', '#4286f4', '#373b44'];
    if (weatherConditionId >= 700 && weatherConditionId < 800) return ['#757f9a', '#d7dde8', '#a8c0ff'];
    return ['#667eea', '#764ba2', '#f093fb'];
  };

  // Animasyonlu İkon
  const AnimatedWeatherIcon = () => {
    const rotate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const rainTranslate = rainAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    });

    const iconSize = 100;
    const iconColor = 'rgba(255,255,255,0.95)';

    // Güneşli
    if (weatherConditionId === 800) {
      return (
        <Animated.View style={{ transform: [{ rotate }, { scale: pulseAnim }] }}>
          <Sun color="#fbbf24" size={iconSize} strokeWidth={1.5} />
        </Animated.View>
      );
    }

    // Parçalı bulutlu
    if (weatherConditionId >= 801 && weatherConditionId <= 802) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <CloudSun color={iconColor} size={iconSize} strokeWidth={1.5} />
        </Animated.View>
      );
    }

    // Bulutlu
    if (weatherConditionId >= 803 && weatherConditionId <= 804) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Cloud color={iconColor} size={iconSize} strokeWidth={1.5} />
        </Animated.View>
      );
    }

    // Yağmurlu
    if (weatherConditionId >= 500 && weatherConditionId < 600) {
      return (
        <View>
          <CloudRain color={iconColor} size={iconSize} strokeWidth={1.5} />
          <Animated.View 
            style={[
              styles.rainDrops, 
              { transform: [{ translateY: rainTranslate }], opacity: rainAnim }
            ]}
          >
            <View style={styles.rainDrop} />
            <View style={[styles.rainDrop, { marginLeft: 20 }]} />
            <View style={[styles.rainDrop, { marginLeft: 10 }]} />
          </Animated.View>
        </View>
      );
    }

    // Karlı
    if (weatherConditionId >= 600 && weatherConditionId < 700) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <CloudSnow color={iconColor} size={iconSize} strokeWidth={1.5} />
        </Animated.View>
      );
    }

    // Fırtınalı
    if (weatherConditionId >= 200 && weatherConditionId < 300) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <CloudLightning color="#fbbf24" size={iconSize} strokeWidth={1.5} />
        </Animated.View>
      );
    }

    // Sisli
    if (weatherConditionId >= 700 && weatherConditionId < 800) {
      return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <CloudFog color={iconColor} size={iconSize} strokeWidth={1.5} />
        </Animated.View>
      );
    }

    return <Cloud color={iconColor} size={iconSize} strokeWidth={1.5} />;
  };

  // Saatlik tahmin (gerçek veri)
  const getHourlyForecast = () => {
    if (!forecastData?.list) return [];
    
    const result: any[] = [];
    
    // İlk eleman: "Şimdi" - Current weather verisini kullan
    if (weatherData) {
      const currentHour = new Date().getHours();
      const isNight = currentHour < 6 || currentHour > 19;
      result.push({
        time: 'Şimdi',
        temp: Math.round(weatherData.main.temp), // Current weather'dan al
        icon: weatherData.weather[0].id, // Current weather'dan al
        isNight,
        pop: 0, // Current weather'da yağış olasılığı yok
      });
    }
    
    // Sonraki saatler için forecast verisini kullan (ilk 7 eleman)
    forecastData.list.slice(0, 7).forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const hour = date.getHours();
      const isNight = hour < 6 || hour > 19;
      
      result.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        temp: Math.round(item.main.temp),
        icon: item.weather[0].id,
        isNight,
        pop: Math.round((item.pop || 0) * 100),
      });
    });
    
    return result;
  };

  // 5 günlük tahmin (gerçek veri)
  const getDailyForecast = () => {
    if (!forecastData?.list) return [];
    
    const dailyMap: { [key: string]: { items: any[], timestamp: number } } = {};
    
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { items: [], timestamp: item.dt };
      }
      dailyMap[dateKey].items.push(item);
    });

    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    return Object.entries(dailyMap).slice(0, 5).map(([dateKey, data], index) => {
      const temps = data.items.map((i: any) => i.main.temp);
      const date = new Date(data.timestamp * 1000);
      const isToday = dateKey === todayKey;
      
      // Yarın kontrolü
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowKey = `${tomorrow.getFullYear()}-${tomorrow.getMonth()}-${tomorrow.getDate()}`;
      const isTomorrow = dateKey === tomorrowKey;
      
      let dayName: string;
      if (isToday) {
        dayName = 'Bugün';
      } else if (isTomorrow) {
        dayName = 'Yarın';
      } else {
        dayName = GUNLER[date.getDay()];
      }
      
      return {
        day: dayName,
        high: Math.round(Math.max(...temps)),
        low: Math.round(Math.min(...temps)),
        icon: data.items[Math.floor(data.items.length / 2)].weather[0].id,
        pop: Math.round(Math.max(...data.items.map((i: any) => (i.pop || 0) * 100))),
      };
    });
  };

  // Küçük hava ikonu
  const getSmallIcon = (conditionId: number, size = 22) => {
    const color = 'rgba(255,255,255,0.9)';
    if (conditionId === 800) return <Sun color="#fbbf24" size={size} />;
    if (conditionId >= 801 && conditionId <= 802) return <CloudSun color={color} size={size} />;
    if (conditionId >= 803 && conditionId <= 804) return <Cloud color={color} size={size} />;
    if (conditionId >= 500 && conditionId < 600) return <CloudRain color={color} size={size} />;
    if (conditionId >= 600 && conditionId < 700) return <CloudSnow color={color} size={size} />;
    if (conditionId >= 200 && conditionId < 300) return <CloudLightning color="#fbbf24" size={size} />;
    if (conditionId >= 700 && conditionId < 800) return <CloudFog color={color} size={size} />;
    return <Cloud color={color} size={size} />;
  };

  // Akıllı öneriler
  const getSmartSuggestions = () => {
    const suggestions = [];
    
    // Sıcaklık bazlı
    if (temperature >= 35) {
      suggestions.push({ icon: Droplets, text: 'Bol su için, serin yerlerde kalın', color: '#60a5fa' });
    } else if (temperature >= 30) {
      suggestions.push({ icon: Glasses, text: 'Güneş gözlüğü ve şapka takın', color: '#fbbf24' });
    } else if (temperature <= 5) {
      suggestions.push({ icon: Shirt, text: 'Kalın giyinin, soğuk hava var', color: '#818cf8' });
    } else if (temperature <= 15) {
      suggestions.push({ icon: Shirt, text: 'Mont veya ceket alın', color: '#94a3b8' });
    }

    // Yağmur kontrolü
    if (weatherConditionId >= 500 && weatherConditionId < 600) {
      suggestions.push({ icon: Umbrella, text: 'Şemsiye almayı unutmayın!', color: '#3b82f6' });
    }

    // Yağış olasılığı
    const hourlyData = getHourlyForecast();
    const maxPop = Math.max(...hourlyData.map((h: { pop: number }) => h.pop));
    if (maxPop > 50 && weatherConditionId < 500) {
      suggestions.push({ icon: CloudRain, text: `Bugün %${maxPop} yağış olasılığı`, color: '#6366f1' });
    }

    // Rüzgar
    if (windSpeed > 40) {
      suggestions.push({ icon: Wind, text: 'Kuvvetli rüzgar, dikkatli olun', color: '#758956' });
    }

    // Varsayılan öneri
    if (suggestions.length === 0) {
      if (weatherConditionId === 800) {
        suggestions.push({ icon: Sparkles, text: 'Güzel bir gün! Dışarı çıkın', color: '#10b981' });
      } else {
        suggestions.push({ icon: Leaf, text: 'İyi bir gün geçirmeniz dileğiyle', color: '#22c55e' });
      }
    }

    return suggestions.slice(0, 3);
  };

  const hourlyForecast = getHourlyForecast();
  const dailyForecast = getDailyForecast();
  const suggestions = getSmartSuggestions();

  return (
    <LinearGradient colors={getGradientColors()} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ArrowLeft color="white" size={24} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.locationRow}>
                <MapPin color="white" size={14} />
                <Text style={styles.locationText}>{cityName}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <RefreshCw color="white" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="white"
                colors={['white']}
              />
            }
          >
            {/* Ana Hava Durumu */}
            <View style={styles.mainWeather}>
              <AnimatedWeatherIcon />
              <Text style={styles.temperature}>{temperature}°</Text>
              <Text style={styles.description}>{description}</Text>
              <Text style={styles.highLow}>En Yüksek: {tempMax}°  En Düşük: {tempMin}°</Text>
            </View>

            {/* Akıllı Öneriler */}
            <BlurView intensity={25} tint="light" style={styles.suggestionsCard}>
              <View style={styles.suggestionsHeader}>
                <Sparkles color="rgba(255,255,255,0.8)" size={16} />
                <Text style={styles.cardTitle}>AKILLI ÖNERİLER</Text>
              </View>
              {suggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionRow}>
                  <View style={[styles.suggestionIcon, { backgroundColor: suggestion.color + '30' }]}>
                    <suggestion.icon color={suggestion.color} size={18} />
                  </View>
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </View>
              ))}
            </BlurView>

            {/* Saatlik Tahmin */}
            <BlurView intensity={25} tint="light" style={styles.forecastCard}>
              <Text style={styles.cardTitle}>SAATLİK TAHMİN</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.hourlyContainer}>
                  {hourlyForecast.map((hour: any, index: number) => (
                    <View key={index} style={[styles.hourlyItem, index === 0 && styles.hourlyItemNow]}>
                      <Text style={[styles.hourlyTime, index === 0 && styles.hourlyTimeNow]}>{hour.time}</Text>
                      {hour.isNight ? (
                        <Moon color="rgba(255,255,255,0.9)" size={24} />
                      ) : (
                        getSmallIcon(hour.icon, 24)
                      )}
                      <Text style={styles.hourlyTemp}>{hour.temp}°</Text>
                      {hour.pop > 0 && (
                        <Text style={styles.hourlyPop}>{hour.pop}%</Text>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </BlurView>

            {/* 5 Günlük Tahmin */}
            <BlurView intensity={25} tint="light" style={styles.forecastCard}>
              <Text style={styles.cardTitle}>5 GÜNLÜK TAHMİN</Text>
              {dailyForecast.map((day, index) => (
                <View key={index} style={[styles.dailyRow, index === 0 && styles.dailyRowFirst]}>
                  <Text style={styles.dailyDay}>{day.day}</Text>
                  <View style={styles.dailyIconContainer}>
                    {getSmallIcon(day.icon)}
                    {day.pop > 0 && (
                      <Text style={styles.dailyPop}>{day.pop}%</Text>
                    )}
                  </View>
                  <View style={styles.dailyTempRow}>
                    <Text style={styles.dailyLow}>{day.low}°</Text>
                    <View style={styles.tempBar}>
                      <View style={[styles.tempBarFill, { width: `${Math.min(100, ((day.high - day.low) / 20) * 100)}%` }]} />
                    </View>
                    <Text style={styles.dailyHigh}>{day.high}°</Text>
                  </View>
                </View>
              ))}
            </BlurView>

            {/* Detay Kartları */}
            <View style={styles.detailsGrid}>
              {/* Hissedilen */}
              <BlurView intensity={25} tint="light" style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Thermometer color="rgba(255,255,255,0.7)" size={16} />
                  <Text style={styles.detailLabel}>HİSSEDİLEN</Text>
                </View>
                <Text style={styles.detailValue}>{feelsLike}°</Text>
                <Text style={styles.detailNote}>
                  {feelsLike > temperature ? 'Daha sıcak hissediyor' : feelsLike < temperature ? 'Daha soğuk hissediyor' : 'Gerçek sıcaklık ile aynı'}
                </Text>
              </BlurView>

              {/* Nem */}
              <BlurView intensity={25} tint="light" style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Droplets color="rgba(255,255,255,0.7)" size={16} />
                  <Text style={styles.detailLabel}>NEM</Text>
                </View>
                <Text style={styles.detailValue}>%{humidity}</Text>
                <Text style={styles.detailNote}>
                  {humidity > 70 ? 'Yüksek nem' : humidity < 30 ? 'Düşük nem' : 'Normal seviye'}
                </Text>
              </BlurView>

              {/* Rüzgar */}
              <BlurView intensity={25} tint="light" style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Wind color="rgba(255,255,255,0.7)" size={16} />
                  <Text style={styles.detailLabel}>RÜZGAR</Text>
                </View>
                <Text style={styles.detailValue}>{windSpeed} km/sa</Text>
                <Text style={styles.detailNote}>
                  {windSpeed > 40 ? 'Kuvvetli rüzgar' : windSpeed > 20 ? 'Orta şiddetli' : 'Hafif esinti'}
                </Text>
              </BlurView>

              {/* Görüş Mesafesi */}
              <BlurView intensity={25} tint="light" style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Eye color="rgba(255,255,255,0.7)" size={16} />
                  <Text style={styles.detailLabel}>GÖRÜŞ</Text>
                </View>
                <Text style={styles.detailValue}>{visibility} km</Text>
                <Text style={styles.detailNote}>
                  {visibility >= 10 ? 'Mükemmel' : visibility >= 5 ? 'İyi' : 'Sınırlı'}
                </Text>
              </BlurView>

              {/* Basınç */}
              <BlurView intensity={25} tint="light" style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Gauge color="rgba(255,255,255,0.7)" size={16} />
                  <Text style={styles.detailLabel}>BASINÇ</Text>
                </View>
                <Text style={styles.detailValue}>{pressure}</Text>
                <Text style={styles.detailNote}>hPa</Text>
              </BlurView>

              {/* Gün Doğumu/Batımı */}
              <BlurView intensity={25} tint="light" style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Sunrise color="rgba(255,255,255,0.7)" size={16} />
                  <Text style={styles.detailLabel}>GÜN DÖNGÜSÜ</Text>
                </View>
                <View style={styles.sunTimesRow}>
                  <View style={styles.sunTimeItem}>
                    <Sunrise color="#fbbf24" size={18} />
                    <Text style={styles.sunTimeText}>{formatTime(sunrise)}</Text>
                  </View>
                  <View style={styles.sunTimeItem}>
                    <Sunset color="#f97316" size={18} />
                    <Text style={styles.sunTimeText}>{formatTime(sunset)}</Text>
                  </View>
                </View>
              </BlurView>
            </View>

            {/* Kaynak */}
            <View style={styles.sourceRow}>
              <Text style={styles.sourceText}>OpenWeatherMap tarafından sağlanmaktadır</Text>
              <Text style={styles.updateText}>Son güncelleme: Şimdi</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  mainWeather: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  temperature: {
    fontSize: 96,
    fontWeight: '200',
    color: 'white',
    marginTop: -10,
  },
  description: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
    marginTop: -5,
  },
  highLow: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    fontWeight: '500',
  },
  // Akıllı Öneriler
  suggestionsCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  // Forecast kartları
  forecastCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  cardTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  hourlyContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  hourlyItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 30,
    minWidth: 60,
  },
  hourlyItemNow: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  hourlyTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 8,
  },
  hourlyTimeNow: {
    fontWeight: '700',
  },
  hourlyTemp: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
    marginTop: 8,
  },
  hourlyPop: {
    fontSize: 11,
    color: '#60a5fa',
    fontWeight: '600',
    marginTop: 4,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  dailyRowFirst: {
    borderTopWidth: 0,
  },
  dailyDay: {
    width: 55,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  dailyIconContainer: {
    width: 50,
    alignItems: 'center',
  },
  dailyPop: {
    fontSize: 10,
    color: '#60a5fa',
    fontWeight: '600',
    marginTop: 2,
  },
  dailyTempRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyLow: {
    width: 32,
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
  },
  dailyHigh: {
    width: 32,
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  tempBar: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tempBarFill: {
    height: '100%',
    backgroundColor: 'rgba(255,200,100,0.9)',
    borderRadius: 3,
  },
  // Detay kartları
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    minHeight: 120,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 28,
    color: 'white',
    fontWeight: '500',
    marginBottom: 4,
  },
  detailNote: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 16,
  },
  // Gün döngüsü
  sunTimesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  sunTimeItem: {
    alignItems: 'center',
    gap: 4,
  },
  sunTimeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // Rain animation
  rainDrops: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
  },
  rainDrop: {
    width: 3,
    height: 15,
    backgroundColor: 'rgba(96,165,250,0.7)',
    borderRadius: 2,
  },
  // Kaynak
  sourceRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  updateText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  // Error states
  errorContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 20,
    textAlign: 'center',
  },
  errorBackBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  errorBackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WeatherDetailScreen;
