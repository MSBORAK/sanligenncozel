import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Calendar, Search, Pill, Library, Route,
  Bus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/useAppTheme';
import { useUser } from '@/context/UserContext';
import { HomeScreenProps, MainTabParamList } from '@/types/navigation';

const SERIF = Platform.select<string>({ ios: 'Georgia', android: 'serif', default: 'serif' });

type Size = 'wide' | 'tall' | 'small';

// Hepsi tek bir ikon ailesinde (lucide line icon) — önceden her kart farklı
// bir illüstratörün Lottie animasyonunu kullanıyordu, tutarsız duruyordu.
const SERVICES: { nameKey: string; screen: string; icon: any; size: Size }[] = [
  { nameKey: 'hizliErisim.etkinlik',   screen: 'Events',        icon: Calendar, size: 'tall'  },
  { nameKey: 'hizliErisim.kesfet',     screen: 'Magazine',      icon: Search,   size: 'tall'  },
  { nameKey: 'hizliErisim.eczane',     screen: 'PharmacyList',  icon: Pill,     size: 'small' },
  { nameKey: 'hizliErisim.kutuphane',  screen: 'LibraryList',   icon: Library,  size: 'small' },
  { nameKey: 'hizliErisim.geziRotasi', screen: 'CulturalRoute', icon: Route,    size: 'small' },
  { nameKey: 'hizliErisim.ulasim',     screen: 'Transport',     icon: Bus,      size: 'small' },
];

export default function HizliErisimScreen() {
  const navigation = useNavigation<HomeScreenProps['navigation']>();
  const { t: tr } = useTranslation();
  const t = useAppTheme();
  const { isGuest } = useUser();
  const insets = useSafeAreaInsets();

  const handlePress = (item: (typeof SERVICES)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const tabScreens = ['Transport'];
    if (tabScreens.includes(item.screen)) {
      navigation.navigate('Main', { screen: item.screen as keyof MainTabParamList });
    } else {
      navigation.navigate(item.screen as any);
    }
  };

  const tall = SERVICES.filter((i) => i.size === 'tall');
  const small = SERVICES.filter((i) => i.size === 'small');

  return (
    <View style={[s.root, { backgroundColor: t.pageBg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
      >
        <Text style={[s.eyebrow, { color: t.txt2 }]}>{tr('hizliErisim.eyebrow')}</Text>
        <Text style={[s.title, { color: t.txt1 }]}>{tr('hizliErisim.title')}</Text>
        <Text style={[s.subtitle, { color: t.txt2 }]}>{tr('hizliErisim.subtitle')}</Text>

        {/* İki büyük tall kart — küçük kartlarla aynı ikon ailesi (lucide line icon) */}
        <View style={s.tallRow}>
          {tall.map((item) => (
            <TouchableOpacity
              key={tr(item.nameKey)}
              activeOpacity={0.86}
              style={[s.tallCard, { borderColor: t.cardBdr, backgroundColor: t.cardBg }]}
              onPress={() => handlePress(item)}
            >
              <View style={[s.tallIconWrap, { backgroundColor: t.chipBg }]}>
                <item.icon color={t.txt1} size={40} strokeWidth={1.5} />
              </View>
              <Text style={[s.tallLabel, { color: t.txt1 }]} numberOfLines={1}>{tr(item.nameKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Küçük ikon kutucukları — 4'lü grid */}
        <Text style={[s.sectionEyebrow, { color: t.txt2 }]}>{tr('hizliErisim.sehirHizmetleri')}</Text>
        <View style={s.smallGrid}>
          {small.map((item) => (
            <TouchableOpacity
              key={tr(item.nameKey)}
              activeOpacity={0.85}
              style={[s.smallCard, { borderColor: t.cardBdr, backgroundColor: t.cardBg }]}
              onPress={() => handlePress(item)}
            >
              <View style={[s.smallIconWrap, { backgroundColor: t.chipBg }]}>
                <item.icon color={t.txt1} size={20} strokeWidth={1.8} />
              </View>
              <Text style={[s.smallLabel, { color: t.txt1 }]} numberOfLines={1}>{tr(item.nameKey)}</Text>
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
  title: { fontSize: 26, fontWeight: '700', fontFamily: SERIF, letterSpacing: -0.3, marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: '500', marginBottom: 18 },
  sectionEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.35, marginBottom: 10, textTransform: 'uppercase' },

  tallRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tallCard: {
    flex: 1, aspectRatio: 0.92, borderRadius: 20, borderWidth: 1.2,
    padding: 12, justifyContent: 'space-between', overflow: 'hidden',
  },
  tallIconWrap: {
    flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  tallLabel: { fontSize: 15.5, fontWeight: '800', letterSpacing: -0.2, marginTop: 8 },

  smallGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallCard: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1.2, paddingVertical: 10, paddingHorizontal: 12,
  },
  smallIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  smallLabel: { fontSize: 13.5, fontWeight: '800', letterSpacing: -0.1, flexShrink: 1 },
});
