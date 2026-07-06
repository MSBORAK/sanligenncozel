/**
 * Open-Meteo (key gerektirmeyen, ücretsiz) hava durumu servisi için yardımcılar.
 * OpenWeather'dan geçişte, geri kalan ekranların (WeatherDetailScreen) hiç
 * değişmesine gerek kalmasın diye Open-Meteo yanıtı OpenWeather'ın şekline
 * (weather[0].id, main.temp, sys.sunrise vb.) dönüştürülüyor.
 */

/** WMO hava kodunu OpenWeather'ın id aralıklarına eşler (ikon seçimi için) */
export function mapWmoToOwmId(code: number): number {
  if (code === 0) return 800;
  if (code === 1 || code === 2 || code === 3) return 801;
  if (code === 45 || code === 48) return 741;
  if (code >= 51 && code <= 57) return 300;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 500;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 600;
  if (code === 95 || code === 96 || code === 99) return 200;
  return 801;
}

const WMO_DESCRIPTIONS_TR: Record<number, string> = {
  0: 'Açık', 1: 'Az bulutlu', 2: 'Parçalı bulutlu', 3: 'Kapalı',
  45: 'Sisli', 48: 'Kırağı sisi',
  51: 'Hafif çisenti', 53: 'Çisenti', 55: 'Yoğun çisenti',
  56: 'Donan çisenti', 57: 'Yoğun donan çisenti',
  61: 'Hafif yağmur', 63: 'Yağmur', 65: 'Şiddetli yağmur',
  66: 'Donan yağmur', 67: 'Şiddetli donan yağmur',
  71: 'Hafif kar', 73: 'Kar', 75: 'Yoğun kar', 77: 'Kar taneleri',
  80: 'Hafif sağanak', 81: 'Sağanak', 82: 'Şiddetli sağanak',
  85: 'Kar sağanağı', 86: 'Yoğun kar sağanağı',
  95: 'Gök gürültülü fırtına', 96: 'Dolulu fırtına', 99: 'Şiddetli dolulu fırtına',
};

export function wmoDescriptionTr(code: number): string {
  return WMO_DESCRIPTIONS_TR[code] || 'Değişken hava';
}

/** Open-Meteo yanıtını OpenWeather /weather formatına dönüştürür */
export function toOwmCurrent(om: any, cityName: string) {
  const c = om?.current;
  const daily = om?.daily;
  if (!c) return null;
  return {
    cod: 200,
    name: cityName,
    visibility: 10000,
    main: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      pressure: c.surface_pressure,
      temp_min: daily?.temperature_2m_min?.[0] ?? c.temperature_2m,
      temp_max: daily?.temperature_2m_max?.[0] ?? c.temperature_2m,
    },
    wind: { speed: (c.wind_speed_10m ?? 0) / 3.6 },
    weather: [{ id: mapWmoToOwmId(c.weather_code), description: wmoDescriptionTr(c.weather_code) }],
    sys: {
      sunrise: daily?.sunrise?.[0] ? Math.floor(new Date(daily.sunrise[0]).getTime() / 1000) : undefined,
      sunset: daily?.sunset?.[0] ? Math.floor(new Date(daily.sunset[0]).getTime() / 1000) : undefined,
    },
  };
}

/** Open-Meteo saatlik verisini OpenWeather /forecast list formatına dönüştürür */
export function toOwmForecast(om: any) {
  const h = om?.hourly;
  if (!h?.time) return { cod: '200', list: [] };
  const list = h.time.map((t: string, i: number) => ({
    dt: Math.floor(new Date(t).getTime() / 1000),
    main: { temp: h.temperature_2m?.[i] },
    weather: [{ id: mapWmoToOwmId(h.weather_code?.[i]) }],
    pop: (h.precipitation_probability?.[i] ?? 0) / 100,
  }));
  return { cod: '200', list };
}
