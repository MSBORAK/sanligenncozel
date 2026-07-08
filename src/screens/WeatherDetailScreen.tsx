import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { cardOuterShadow, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { useAppTheme } from '@/theme/useAppTheme';
import {
  ArrowLeft,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
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
  Leaf,
  Sparkles,
  RefreshCw,
  CloudFog,
} from 'lucide-react-native';
import { toOwmCurrent, toOwmForecast } from '@/utils/weather';

const { width } = Dimensions.get('window');

type WeatherDetailScreenProps = StackScreenProps<RootStackParamList, 'WeatherDetail'>;

const SEHIR_KOORDINAT = { lat: 37.1674, lon: 38.7955 };

// Gün isimleri
const GUNLER = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

const WeatherDetailScreen: React.FC<WeatherDetailScreenProps> = ({ route, navigation }) => {
  const { weatherData: initialWeather, forecastData: initialForecast } = route.params || {};
  const t = useAppTheme();
  const { isDark, pageBg, cardBg, cardBdr, chipBg, txt1, txt2 } = t;
  const sunColor  = '#EAB308'; // güneş/şimşek — sarı, uygulamanın turuncu vurgusundan bağımsız
  const rainBlue  = '#3B82F6'; // yağış olasılığı / nem — mavi
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  // State
  const [weatherData, setWeatherData] = useState<any>(initialWeather);
  const [forecastData, setForecastData] = useState<any>(initialForecast);
  const [refreshing, setRefreshing] = useState(false);

  // Pull to Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${SEHIR_KOORDINAT.lat}&longitude=${SEHIR_KOORDINAT.lon}` +
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
    } catch (error) {
      console.log("Yenileme hatası:", error);
    }
    setRefreshing(false);
  }, []);

  // Hata durumu
  if (!weatherData?.weather?.[0]) {
    return (
      <View style={[styles.container, { backgroundColor: pageBg }]}>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Cloud color={txt2} size={80} strokeWidth={1.5} />
          <Text style={[styles.errorText, { color: txt1 }]}>Hava durumu verisi yüklenemedi</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.errorBackBtn, { backgroundColor: chipBg }]}>
            <Text style={[styles.errorBackText, { color: txt1 }]}>Geri Dön</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
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

  // Ana hava ikonu
  const MainWeatherIcon = () => {
    const iconSize = 88;
    if (weatherConditionId === 800) return <Sun color={sunColor} size={iconSize} strokeWidth={1.5} />;
    if (weatherConditionId >= 801 && weatherConditionId <= 802) return <CloudSun color={txt1} size={iconSize} strokeWidth={1.5} />;
    if (weatherConditionId >= 803 && weatherConditionId <= 804) return <Cloud color={txt1} size={iconSize} strokeWidth={1.5} />;
    if (weatherConditionId >= 500 && weatherConditionId < 600) return <CloudRain color={txt1} size={iconSize} strokeWidth={1.5} />;
    if (weatherConditionId >= 600 && weatherConditionId < 700) return <CloudSnow color={txt1} size={iconSize} strokeWidth={1.5} />;
    if (weatherConditionId >= 200 && weatherConditionId < 300) return <CloudLightning color={sunColor} size={iconSize} strokeWidth={1.5} />;
    if (weatherConditionId >= 700 && weatherConditionId < 800) return <CloudFog color={txt1} size={iconSize} strokeWidth={1.5} />;
    return <Cloud color={txt1} size={iconSize} strokeWidth={1.5} />;
  };

  // Saatlik tahmin (gerçek veri)
  const getHourlyForecast = () => {
    if (!forecastData?.list) return [];

    const result: any[] = [];

    if (weatherData) {
      const currentHour = new Date().getHours();
      const isNight = currentHour < 6 || currentHour > 19;
      result.push({
        time: 'Şimdi',
        temp: Math.round(weatherData.main.temp),
        icon: weatherData.weather[0].id,
        isNight,
        pop: 0,
      });
    }

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

  // 7 günlük tahmin (gerçek veri)
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

    return Object.entries(dailyMap).slice(0, 7).map(([dateKey, data]) => {
      const temps = data.items.map((i: any) => i.main.temp);
      const date = new Date(data.timestamp * 1000);
      const isToday = dateKey === todayKey;

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
    if (conditionId === 800) return <Sun color={sunColor} size={size} />;
    if (conditionId >= 801 && conditionId <= 802) return <CloudSun color={txt1} size={size} />;
    if (conditionId >= 803 && conditionId <= 804) return <Cloud color={txt1} size={size} />;
    if (conditionId >= 500 && conditionId < 600) return <CloudRain color={txt1} size={size} />;
    if (conditionId >= 600 && conditionId < 700) return <CloudSnow color={txt1} size={size} />;
    if (conditionId >= 200 && conditionId < 300) return <CloudLightning color={sunColor} size={size} />;
    if (conditionId >= 700 && conditionId < 800) return <CloudFog color={txt1} size={size} />;
    return <Cloud color={txt1} size={size} />;
  };

  // Akıllı öneriler
  const getSmartSuggestions = () => {
    const suggestions = [];

    if (temperature >= 35) {
      suggestions.push({ icon: Droplets, text: 'Bol su için, serin yerlerde kalın', color: '#3B82F6' });
    } else if (temperature >= 30) {
      suggestions.push({ icon: Glasses, text: 'Güneş gözlüğü ve şapka takın', color: sunColor });
    } else if (temperature <= 5) {
      suggestions.push({ icon: Shirt, text: 'Kalın giyinin, soğuk hava var', color: '#818CF8' });
    } else if (temperature <= 15) {
      suggestions.push({ icon: Shirt, text: 'Mont veya ceket alın', color: txt2 });
    }

    if (weatherConditionId >= 500 && weatherConditionId < 600) {
      suggestions.push({ icon: Umbrella, text: 'Şemsiye almayı unutmayın!', color: '#3B82F6' });
    }

    const hourlyData = getHourlyForecast();
    const maxPop = Math.max(...hourlyData.map((h: { pop: number }) => h.pop), 0);
    if (maxPop > 50 && weatherConditionId < 500) {
      suggestions.push({ icon: CloudRain, text: `Bugün %${maxPop} yağış olasılığı`, color: '#6366F1' });
    }

    if (windSpeed > 40) {
      suggestions.push({ icon: Wind, text: 'Kuvvetli rüzgar, dikkatli olun', color: txt2 });
    }

    if (suggestions.length === 0) {
      if (weatherConditionId === 800) {
        suggestions.push({ icon: Sparkles, text: 'Güzel bir gün! Dışarı çıkın', color: '#10B981' });
      } else {
        suggestions.push({ icon: Leaf, text: 'İyi bir gün geçirmeniz dileğiyle', color: '#22C55E' });
      }
    }

    return suggestions.slice(0, 3);
  };

  const hourlyForecast = getHourlyForecast();
  const dailyForecast = getDailyForecast();
  const suggestions = getSmartSuggestions();

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerBtn, { backgroundColor: chipBg }]}>
            <ArrowLeft color={txt1} size={20} strokeWidth={2}/>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.locationRow}>
              <MapPin color={txt2} size={13}/>
              <Text style={[styles.locationText, { color: txt1 }]}>{cityName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onRefresh} style={[styles.headerBtn, { backgroundColor: chipBg }]}>
            <RefreshCw color={txt1} size={18} strokeWidth={2}/>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={txt2} colors={[txt2]} />
          }
        >
          {/* Ana Hava Durumu */}
          <View style={styles.mainWeather}>
            <MainWeatherIcon />
            <Text style={[styles.temperature, { color: txt1 }]}>{temperature}°</Text>
            <Text style={[styles.description, { color: txt2 }]}>{description}</Text>
            <Text style={[styles.highLow, { color: txt2 }]}>En Yüksek: {tempMax}°  En Düşük: {tempMin}°</Text>
          </View>

          {/* Akıllı Öneriler */}
          <View style={[styles.card, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <View style={styles.suggestionsHeader}>
              <Sparkles color={txt2} size={15}/>
              <Text style={[styles.cardTitle, { color: txt2 }]}>AKILLI ÖNERİLER</Text>
            </View>
            {suggestions.map((suggestion, index) => (
              <View key={index} style={styles.suggestionRow}>
                <View style={[styles.suggestionIcon, { backgroundColor: chipBg }]}>
                  <suggestion.icon color={suggestion.color} size={18} />
                </View>
                <Text style={[styles.suggestionText, { color: txt1 }]}>{suggestion.text}</Text>
              </View>
            ))}
          </View>

          {/* Saatlik Tahmin */}
          <View style={[styles.card, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: txt2 }]}>SAATLİK TAHMİN</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.hourlyContainer}>
                {hourlyForecast.map((hour: any, index: number) => (
                  <View key={index} style={[styles.hourlyItem, index === 0 && { backgroundColor: chipBg }]}>
                    <Text style={[styles.hourlyTime, { color: txt2 }, index === 0 && { color: txt1, fontWeight: '700' }]}>{hour.time}</Text>
                    {hour.isNight ? <Moon color={txt2} size={22}/> : getSmallIcon(hour.icon, 22)}
                    <Text style={[styles.hourlyTemp, { color: txt1 }]}>{hour.temp}°</Text>
                    {hour.pop > 0 && <Text style={[styles.hourlyPop, { color: rainBlue }]}>{hour.pop}%</Text>}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 5 Günlük Tahmin */}
          <View style={[styles.card, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: txt2 }]}>7 GÜNLÜK TAHMİN</Text>
            {dailyForecast.map((day, index) => (
              <View key={index} style={[styles.dailyRow, { borderTopColor: cardBdr }, index === 0 && { borderTopWidth: 0 }]}>
                <Text style={[styles.dailyDay, { color: txt1 }]}>{day.day}</Text>
                <View style={styles.dailyIconContainer}>
                  {getSmallIcon(day.icon)}
                  {day.pop > 0 && <Text style={[styles.dailyPop, { color: rainBlue }]}>{day.pop}%</Text>}
                </View>
                <View style={styles.dailyTempRow}>
                  <Text style={[styles.dailyLow, { color: txt2 }]}>{day.low}°</Text>
                  <View style={[styles.tempBar, { backgroundColor: chipBg }]}>
                    <View style={[styles.tempBarFill, { width: `${Math.min(100, ((day.high - day.low) / 20) * 100)}%`, backgroundColor: txt2 }]} />
                  </View>
                  <Text style={[styles.dailyHigh, { color: txt1 }]}>{day.high}°</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Detay Kartları */}
          <View style={styles.detailsGrid}>
            <View style={[styles.detailCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <View style={styles.detailHeader}>
                <Thermometer color={txt2} size={15}/>
                <Text style={[styles.detailLabel, { color: txt2 }]}>HİSSEDİLEN</Text>
              </View>
              <Text style={[styles.detailValue, { color: txt1 }]}>{feelsLike}°</Text>
              <Text style={[styles.detailNote, { color: txt2 }]}>
                {feelsLike > temperature ? 'Daha sıcak hissediyor' : feelsLike < temperature ? 'Daha soğuk hissediyor' : 'Gerçek sıcaklık ile aynı'}
              </Text>
            </View>

            <View style={[styles.detailCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <View style={styles.detailHeader}>
                <Droplets color={txt2} size={15}/>
                <Text style={[styles.detailLabel, { color: txt2 }]}>NEM</Text>
              </View>
              <Text style={[styles.detailValue, { color: txt1 }]}>%{humidity}</Text>
              <Text style={[styles.detailNote, { color: txt2 }]}>
                {humidity > 70 ? 'Yüksek nem' : humidity < 30 ? 'Düşük nem' : 'Normal seviye'}
              </Text>
            </View>

            <View style={[styles.detailCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <View style={styles.detailHeader}>
                <Wind color={txt2} size={15}/>
                <Text style={[styles.detailLabel, { color: txt2 }]}>RÜZGAR</Text>
              </View>
              <Text style={[styles.detailValue, { color: txt1 }]}>{windSpeed} km/sa</Text>
              <Text style={[styles.detailNote, { color: txt2 }]}>
                {windSpeed > 40 ? 'Kuvvetli rüzgar' : windSpeed > 20 ? 'Orta şiddetli' : 'Hafif esinti'}
              </Text>
            </View>

            <View style={[styles.detailCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <View style={styles.detailHeader}>
                <Eye color={txt2} size={15}/>
                <Text style={[styles.detailLabel, { color: txt2 }]}>GÖRÜŞ</Text>
              </View>
              <Text style={[styles.detailValue, { color: txt1 }]}>{visibility} km</Text>
              <Text style={[styles.detailNote, { color: txt2 }]}>
                {visibility >= 10 ? 'Mükemmel' : visibility >= 5 ? 'İyi' : 'Sınırlı'}
              </Text>
            </View>

            <View style={[styles.detailCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <View style={styles.detailHeader}>
                <Gauge color={txt2} size={15}/>
                <Text style={[styles.detailLabel, { color: txt2 }]}>BASINÇ</Text>
              </View>
              <Text style={[styles.detailValue, { color: txt1 }]}>{pressure}</Text>
              <Text style={[styles.detailNote, { color: txt2 }]}>hPa</Text>
            </View>

            <View style={[styles.detailCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
              <View style={styles.detailHeader}>
                <Sunrise color={txt2} size={15}/>
                <Text style={[styles.detailLabel, { color: txt2 }]}>GÜN DÖNGÜSÜ</Text>
              </View>
              <View style={styles.sunTimesRow}>
                <View style={styles.sunTimeItem}>
                  <Sunrise color={sunColor} size={17}/>
                  <Text style={[styles.sunTimeText, { color: txt1 }]}>{formatTime(sunrise)}</Text>
                </View>
                <View style={styles.sunTimeItem}>
                  <Sunset color="#6366F1" size={17}/>
                  <Text style={[styles.sunTimeText, { color: txt1 }]}>{formatTime(sunset)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Kaynak */}
          <View style={styles.sourceRow}>
            <Text style={[styles.sourceText, { color: txt2 }]}>Open-Meteo tarafından sağlanmaktadır</Text>
            <Text style={[styles.updateText, { color: txt2 }]}>Son güncelleme: Şimdi</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { alignItems: 'center' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  mainWeather: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  temperature: {
    fontSize: 88,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -2,
  },
  description: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  highLow: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  hourlyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  hourlyItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 18,
    minWidth: 60,
    gap: 6,
  },
  hourlyTime: {
    fontSize: 13,
    fontWeight: '600',
  },
  hourlyTemp: {
    fontSize: 16,
    fontWeight: '700',
  },
  hourlyPop: {
    fontSize: 11,
    fontWeight: '700',
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  dailyDay: {
    width: 55,
    fontSize: 15,
    fontWeight: '600',
  },
  dailyIconContainer: {
    width: 50,
    alignItems: 'center',
  },
  dailyPop: {
    fontSize: 10,
    fontWeight: '700',
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
    fontSize: 15,
    textAlign: 'right',
  },
  dailyHigh: {
    width: 32,
    fontSize: 15,
    fontWeight: '700',
  },
  tempBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  tempBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailCard: {
    width: (width - 52) / 2,
    borderRadius: 18,
    padding: 14,
    minHeight: 116,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailNote: {
    fontSize: 11.5,
    lineHeight: 15,
  },
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
    fontSize: 13,
    fontWeight: '700',
  },
  sourceRow: {
    marginTop: 8,
    alignItems: 'center',
  },
  sourceText: {
    fontSize: 12,
  },
  updateText: {
    fontSize: 11,
    marginTop: 4,
  },
  errorText: {
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorBackBtn: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorBackText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

export default WeatherDetailScreen;
