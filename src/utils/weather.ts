/**
 * Open-Meteo (key gerektirmeyen, ücretsiz) hava durumu servisi için yardımcılar.
 * OpenWeather'dan geçişte, geri kalan ekranların (WeatherDetailScreen) hiç
 * değişmesine gerek kalmasın diye Open-Meteo yanıtı OpenWeather'ın şekline
 * (weather[0].id, main.temp, sys.sunrise vb.) dönüştürülüyor.
 */

export const SANLIURFA_COORDS = { lat: 37.1674, lon: 38.7955 };

/** Şanlıurfa için Open-Meteo forecast URL */
export function buildWeatherUrl(lat = SANLIURFA_COORDS.lat, lon = SANLIURFA_COORDS.lon) {
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,surface_pressure,visibility` +
    `&hourly=temperature_2m,weather_code,precipitation_probability` +
    `&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min` +
    `&timezone=Europe/Istanbul&forecast_days=8`
  );
}

/**
 * Open-Meteo yerel saat string'ini (timezone offset ile) Unix saniyeye çevirir.
 * Örn: "2026-07-08T18:00" + utc_offset=10800 → doğru UTC epoch.
 * `new Date("2026-07-08T18:00")` cihaz TZ'sine bağlı olduğundan kullanılmaz.
 */
export function parseOmLocalToUnix(isoLocal: string, utcOffsetSeconds: number): number {
  if (!isoLocal) return 0;
  const [datePart, timePart = '00:00'] = isoLocal.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm = 0, ss = 0] = timePart.split(':').map(Number);
  // Wall clock Istanbul = UTC + offset → UTC ms = Date.UTC(wall) - offset*1000
  return Math.floor((Date.UTC(y, m - 1, d, hh, mm, ss) - utcOffsetSeconds * 1000) / 1000);
}

/** Yerel HH:MM — gün doğumu/batımı için Date TZ kayması olmasın */
export function formatOmClock(isoLocal?: string): string {
  if (!isoLocal) return '--:--';
  const time = isoLocal.split('T')[1] || isoLocal;
  const [hh = '--', mm = '--'] = time.split(':');
  return `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}`;
}

/** WMO hava kodunu OpenWeather'ın id aralıklarına eşler (ikon seçimi için) */
export function mapWmoToOwmId(code: number): number {
  if (code === 0) return 800;           // açık
  if (code === 1) return 801;           // az bulutlu
  if (code === 2) return 802;           // parçalı bulutlu
  if (code === 3) return 804;           // kapalı
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
  const offset = om?.utc_offset_seconds ?? 10800; // Europe/Istanbul varsayılan
  const sunriseIso = daily?.sunrise?.[0];
  const sunsetIso = daily?.sunset?.[0];
  return {
    cod: 200,
    name: cityName,
    // Open-Meteo metres; yoksa null — UI sabit 10 göstermesin diye bilinçli
    visibility: typeof c.visibility === 'number' ? c.visibility : null,
    main: {
      temp: c.temperature_2m,
      feels_like: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      pressure: Math.round(c.surface_pressure),
      temp_min: daily?.temperature_2m_min?.[0] ?? c.temperature_2m,
      temp_max: daily?.temperature_2m_max?.[0] ?? c.temperature_2m,
    },
    // Open-Meteo km/h → OWM m/s (UI tekrar *3.6 yapıyor)
    wind: { speed: (c.wind_speed_10m ?? 0) / 3.6 },
    weather: [{ id: mapWmoToOwmId(c.weather_code), description: wmoDescriptionTr(c.weather_code) }],
    sys: {
      sunrise: sunriseIso ? parseOmLocalToUnix(sunriseIso, offset) : undefined,
      sunset: sunsetIso ? parseOmLocalToUnix(sunsetIso, offset) : undefined,
      sunriseLocal: formatOmClock(sunriseIso),
      sunsetLocal: formatOmClock(sunsetIso),
    },
  };
}

/** Open-Meteo saatlik verisini OpenWeather /forecast list formatına dönüştürür */
export function toOwmForecast(om: any) {
  const h = om?.hourly;
  if (!h?.time) return { cod: '200', list: [] };
  const offset = om?.utc_offset_seconds ?? 10800;
  // Şu anki saat dilimi diliminin başı (UTC epoch)
  const currentHourStart = Math.floor(Date.now() / 1000 / 3600) * 3600;
  const list = h.time
    .map((t: string, i: number) => {
      const dt = parseOmLocalToUnix(t, offset);
      const localHour = Number((t.split('T')[1] || '0').split(':')[0]);
      return {
        dt,
        localHour,
        localDate: t.split('T')[0], // YYYY-MM-DD Istanbul
        main: { temp: h.temperature_2m?.[i] },
        weather: [{ id: mapWmoToOwmId(h.weather_code?.[i]) }],
        pop: (h.precipitation_probability?.[i] ?? 0) / 100,
      };
    })
    .filter((item: { dt: number }) => item.dt >= currentHourStart);
  return { cod: '200', list };
}
