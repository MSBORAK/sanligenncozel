import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { RootStackParamList } from '@/types/navigation';
import { Clean } from '@/constants/Colors';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';
import { useThemeMode } from '@/context/ThemeContext';
import { MOCK_MAGAZINES } from '@/api/mockData';
import type { HeritageCategory } from '@/types';

const CATEGORY_META: Record<HeritageCategory, { title: string; subtitle: string }> = {
  historic: { title: 'Tarihi Yerler', subtitle: "Şanlıurfa'nın binlerce yıllık mirasını keşfetmeye hazır mısın?" },
  faith: { title: 'İnanç ve Kültür', subtitle: 'Şehrin manevi dokusunu ve kutsal mekanlarını keşfet.' },
  nature: { title: 'Doğa & Manzara', subtitle: 'Şanlıurfa çevresindeki doğal güzellikleri keşfet.' },
  museum: { title: 'Müzeler', subtitle: 'Şehrin müzeleri ve kültürel dokusunu keşfet.' },
  bazaar: { title: 'Tarihi Çarşılar & Hanlar', subtitle: 'Geleneksel çarşılar ve tarihi hanları keşfet.' },
};

interface MagazineData {
  id: number;
  baslik: string;
  aciklama?: string;
  kategori?: string;
  resim_url?: string;
}

type Nav = StackNavigationProp<RootStackParamList>;

const HeritageCollectionScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const { category } = route.params as { category: HeritageCategory };
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MagazineData[]>([]);
  const [loading, setLoading] = useState(true);

  const pageBg  = isDark ? '#0C0C0E' : Clean.bgSoft;
  const cardBg  = isDark ? '#18181B' : Clean.surface;
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : Clean.border;
  const txt1    = isDark ? '#F5F5F7' : Clean.textPrimary;
  const txt2    = isDark ? 'rgba(245,245,247,0.55)' : Clean.textSecondary;
  const chipBg  = isDark ? '#1F1F23' : Clean.chipBg;
  const amber   = Clean.accent;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const { data } = await supabase.from('kesfet').select('*').eq('kategori', category);
        setItems(data ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [category]);

  const formatted = useMemo(() => {
    const fromSupabase = items.map((mag) => ({
      id: mag.id.toString(),
      title: mag.baslik,
      description: mag.aciklama,
      image: processImageUrl(mag.resim_url, 'kesfet_resimleri') || cityFallback(mag.id),
    }));
    const fromMock = MOCK_MAGAZINES.filter((m) => m.category === category).map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      image: m.image,
    }));
    return [...fromSupabase, ...fromMock];
  }, [items, category]);

  const meta = CATEGORY_META[category] ?? { title: 'Koleksiyon', subtitle: '' };

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: chipBg }]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <ArrowLeft color={txt1} size={20} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 20 }}>
        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: txt2 }]}>KOLEKSİYON</Text>
          <Text style={[styles.title, { color: txt1 }]}>{meta.title}</Text>
          {!!meta.subtitle && <Text style={[styles.subtitle, { color: txt2 }]}>{meta.subtitle}</Text>}
          <Text style={[styles.count, { color: txt2 }]}>{formatted.length} Mekan</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={txt1} style={{ marginTop: 30 }} />
        ) : (
          <View style={styles.grid}>
            {formatted.map((item, index) => (
              <View key={item.id} style={[styles.cardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
                <TouchableOpacity
                  style={[styles.card, cardInnerClip]}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('HeritageDetail', { id: item.id })}
                >
                  <View style={styles.cardImageWrap}>
                    <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={styles.cardImage} resizeMode="cover" />
                    <View style={[styles.numberBadge, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
                      <Text style={styles.numberBadgeText}>{String(index + 1).padStart(2, '0')}</Text>
                    </View>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, { color: txt1 }]} numberOfLines={1}>{item.title}</Text>
                    {!!item.description && (
                      <Text style={[styles.cardDesc, { color: txt2 }]} numberOfLines={2}>{item.description}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 4,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  grid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  cardOuter: {
    width: '47%',
    borderRadius: 18,
  },
  card: {
    borderRadius: 18,
  },
  cardImageWrap: {
    width: '100%',
    aspectRatio: 1,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  numberBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  numberBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardInfo: {
    padding: 10,
    gap: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 11.5,
    lineHeight: 15,
  },
});

export default HeritageCollectionScreen;
