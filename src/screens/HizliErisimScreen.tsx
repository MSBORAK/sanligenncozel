import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Calendar, Search, Pill, Library, Route,
  Sparkles, Bus, QrCode, Bell,
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/theme/useAppTheme';
import { useUser } from '@/context/UserContext';
import { HomeScreenProps, MainTabParamList } from '@/types/navigation';

const SERIF = Platform.select<string>({ ios: 'Georgia', android: 'serif', default: 'serif' });

type Size = 'wide' | 'tall' | 'small';

const SERVICES: { name: string; screen: string; lottie: any; icon: any; size: Size }[] = [
  { name: 'Etkinlik',     screen: 'Events',        lottie: require('@/assets/images/El calendario.json'),    icon: Calendar, size: 'tall'  },
  { name: 'Keşfet',       screen: 'Magazine',      lottie: require('@/assets/images/Map pin location.json'), icon: Search,   size: 'tall'  },
  { name: 'Asistan',      screen: 'Assistant',     lottie: null,                                             icon: Sparkles, size: 'wide'  },
  { name: 'Eczane',       screen: 'PharmacyList',  lottie: require('@/assets/images/AR Tablet.json'),        icon: Pill,     size: 'small' },
  { name: 'Kütüphane',    screen: 'LibraryList',   lottie: require('@/assets/images/Books.json'),            icon: Library,  size: 'small' },
  { name: 'Gezi Rotası',  screen: 'CulturalRoute', lottie: require('@/assets/images/Travel is fun.json'),    icon: Route,    size: 'small' },
  { name: 'Ulaşım',       screen: 'Transport',     lottie: require('@/assets/images/bus vehicle.json'),      icon: Bus,      size: 'small' },
  { name: 'Genç Kart',    screen: 'GencKart',      lottie: null,                                             icon: QrCode,   size: 'small' },
  { name: 'Bildirimler',  screen: 'Notifications', lottie: require('@/assets/images/Notification bell.json'), icon: Bell,     size: 'small' },
];

export default function HizliErisimScreen() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const t = useAppTheme();
  const { isGuest } = useUser();
  const insets = useSafeAreaInsets();

  const handlePress = (item: (typeof SERVICES)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tabScreens = ['GencKart', 'Transport'];
    if (tabScreens.includes(item.screen)) {
      navigation.navigate('Main', { screen: item.screen as keyof MainTabParamList });
    } else {
      navigation.navigate(item.screen as any);
    }
  };

  const tall = SERVICES.filter((i) => i.size === 'tall');
  const wide = SERVICES.find((i) => i.size === 'wide')!;
  const small = SERVICES.filter((i) => i.size === 'small');

  return (
    <View style={[s.root, { backgroundColor: t.pageBg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
      >
        <Text style={[s.eyebrow, { color: t.txt2 }]}>ŞANLIGENÇ</Text>
        <Text style={[s.title, { color: t.txt1 }]}>Hızlı Erişim</Text>

        {/* İki büyük tall kart — lottie belirgin */}
        <View style={s.tallRow}>
          {tall.map((item) => (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.86}
              style={[s.tallCard, { borderColor: t.cardBdr, backgroundColor: t.cardBg }]}
              onPress={() => handlePress(item)}
            >
              {item.lottie ? (
                <LottieView source={item.lottie} autoPlay loop style={s.tallLottie} />
              ) : (
                <View style={[s.tallIconWrap, { backgroundColor: t.chipBg }]}>
                  <item.icon color={t.txt1} size={30} strokeWidth={1.6} />
                </View>
              )}
              <Text style={[s.tallLabel, { color: t.txt1 }]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Geniş banner — Asistan */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handlePress(wide)}
          style={[s.wideCard, { backgroundColor: t.ctaBg, borderColor: t.cardBdr }]}
        >
          <Sparkles color={t.ctaTxt} size={26} strokeWidth={1.8} />
          <Text style={[s.wideLabel, { color: t.ctaTxt }]}>Şanlı Asistan</Text>
          <Text style={[s.wideArrow, { color: t.ctaTxt }]}>→</Text>
        </TouchableOpacity>

        {/* Küçük ikon kutucukları — 4'lü grid */}
        <View style={s.smallGrid}>
          {small.map((item) => (
            <TouchableOpacity
              key={item.name}
              activeOpacity={0.85}
              style={[s.smallCard, { borderColor: t.cardBdr, backgroundColor: t.cardBg }]}
              onPress={() => handlePress(item)}
            >
              {item.lottie ? (
                <LottieView source={item.lottie} autoPlay loop style={s.smallLottie} />
              ) : (
                <View style={[s.smallIconWrap, { backgroundColor: t.chipBg }]}>
                  <item.icon color={t.txt1} size={20} strokeWidth={1.8} />
                </View>
              )}
              <Text style={[s.smallLabel, { color: t.txt1 }]} numberOfLines={1}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingBottom: 126 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.35, marginBottom: 4, textTransform: 'uppercase' },
  title: { fontSize: 26, fontWeight: '700', fontFamily: SERIF, letterSpacing: -0.3, marginBottom: 18 },

  tallRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tallCard: {
    flex: 1, aspectRatio: 0.92, borderRadius: 20, borderWidth: 1.2,
    padding: 12, justifyContent: 'space-between', overflow: 'hidden',
  },
  tallIconWrap: {
    flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  tallLottie: { flex: 1, width: '100%' },
  tallLabel: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2, marginTop: 8 },

  wideCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 18, borderWidth: 1.2, padding: 16, marginBottom: 10,
  },
  wideLabel: { flex: 1, fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2 },
  wideArrow: { fontSize: 18, fontWeight: '700' },

  smallGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallCard: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1.2, paddingVertical: 10, paddingHorizontal: 12,
  },
  smallIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  smallLottie: { width: 40, height: 40 },
  smallLabel: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.1, flexShrink: 1 },
});
