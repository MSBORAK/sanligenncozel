import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, X, Calendar, MapPin, BookOpen, Bus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_PARTNERS, MOCK_EVENTS, MOCK_MAGAZINES } from '@/api/mockData';
import { MOCK_STOPS } from '@/data/transport';
import { useAppTheme } from '@/theme/useAppTheme';
import { supabase, processImageUrl } from '@/lib/supabase';

type SearchResult = {
  type: 'event' | 'partner' | 'heritage' | 'stop';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
};

const GlobalSearchScreen = () => {
  const t = useAppTheme();
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<any[]>([]);
  const [magazines, setMagazines] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, magRes] = await Promise.all([
          supabase.from('etkinlikler').select('*'),
          supabase.from('kesfet').select('*'),
        ]);
        if (eventsRes.data?.length) setEvents(eventsRes.data);
        else setEvents(MOCK_EVENTS.map(e => ({ id: e.id, baslik: e.title, tarih: e.date, konum: e.location, kategori: e.category, resim_url: e.image })));
        if (magRes.data?.length) setMagazines(magRes.data);
        else setMagazines(MOCK_MAGAZINES.map(m => ({ id: m.id.toString(), baslik: m.title, aciklama: m.description, kategori: m.category, resim_url: typeof m.image === 'string' ? m.image : undefined })));
      } catch {
        setEvents(MOCK_EVENTS.map(e => ({ id: e.id, baslik: e.title, tarih: e.date, konum: e.location, kategori: e.category, resim_url: e.image })));
        setMagazines(MOCK_MAGAZINES.map(m => ({ id: m.id.toString(), baslik: m.title, aciklama: m.description, kategori: m.category })));
      }
    };
    fetchData();
  }, []);

  const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').trim();
  const match = (text: string) => query && normalize(text).includes(normalize(query));

  const results = useCallback((): SearchResult[] => {
    if (!query.trim()) return [];
    const q = normalize(query);
    const out: SearchResult[] = [];

    events.forEach((e) => {
      const title = e.baslik || e.title || '';
      const loc = e.konum || e.location || '';
      const cat = e.kategori || e.category || '';
      if (match(title) || match(loc) || match(cat)) {
        out.push({
          type: 'event',
          id: String(e.id),
          title: title,
          subtitle: `${loc} · ${cat}`,
          image: processImageUrl(e.resim_url, 'etkinlik_resimleri') || e.image,
        });
      }
    });

    MOCK_PARTNERS.forEach((p) => {
      if (match(p.name) || match(p.offer) || match(p.description || '')) {
        out.push({
          type: 'partner',
          id: p.id,
          title: p.name,
          subtitle: p.offer,
        });
      }
    });

    magazines.forEach((m) => {
      const title = m.baslik || m.title || '';
      const desc = m.aciklama || m.description || '';
      if (match(title) || match(desc)) {
        out.push({
          type: 'heritage',
          id: String(m.id),
          title: title,
          subtitle: desc?.slice(0, 50) + (desc?.length > 50 ? '...' : ''),
          image: processImageUrl(m.resim_url, 'kesfet_resimleri') || (typeof (m as any).image === 'string' ? (m as any).image : undefined),
        });
      }
    });

    MOCK_STOPS.forEach((s) => {
      const lines = s.buses.map((b: any) => b.line).join(' ');
      const routes = s.buses.map((b: any) => b.route).join(' ');
      if (match(s.name) || match(lines) || match(routes) || match(s.region || '')) {
        out.push({
          type: 'stop',
          id: s.id,
          title: s.name,
          subtitle: s.buses.map((b: any) => b.line).slice(0, 5).join(', ') + (s.buses.length > 5 ? '...' : ''),
        });
      }
    });

    return out;
  }, [query, events, magazines]);

  const list = results();

  const handleSelect = (r: SearchResult) => {
    Keyboard.dismiss();
    if (r.type === 'event') navigation.push('EventDetail', { eventId: r.id });
    else if (r.type === 'partner') navigation.push('PartnerDetail', { partnerId: r.id });
    else if (r.type === 'heritage') navigation.push('HeritageDetail', { id: r.id });
    else if (r.type === 'stop') {
      navigation.navigate('Main', { screen: 'Transport' });
    }
  };

  const getIcon = (type: SearchResult['type']) => {
    const c = t.txt2;
    if (type === 'event') return <Calendar color={c} size={20} />;
    if (type === 'partner') return <MapPin color={c} size={20} />;
    if (type === 'heritage') return <BookOpen color={c} size={20} />;
    return <Bus color={c} size={20} />;
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    if (type === 'event') return 'Etkinlik';
    if (type === 'partner') return 'Mekan';
    if (type === 'heritage') return 'Keşfet';
    return 'Durak';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.pageBg }]} edges={['top']}>
      <LinearGradient
        colors={[t.pageBg, t.cardBg]}
        style={styles.header}
      >
        <View style={styles.searchRow}>
          <View style={[styles.searchInputWrap, { backgroundColor: t.chipBg }]}>
            <Search color={t.txt2} size={20} />
            <TextInput
              placeholder="Etkinlik, mekan, durak ara..."
              placeholderTextColor={t.txt2}
              style={[styles.searchInput, { color: t.txt1 }]}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn} activeOpacity={0.8}>
            <X color={t.txt1} size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {query.trim() === '' ? (
          <View style={styles.placeholder}>
            <Search color={t.txt2} size={48} />
            <Text style={[styles.placeholderText, { color: t.txt2 }]}>
              Etkinlik, mekan veya durak adı yazın
            </Text>
          </View>
        ) : list.length === 0 ? (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: t.txt2 }]}>Sonuç bulunamadı</Text>
          </View>
        ) : (
          list.map((r) => (
            <TouchableOpacity
              key={`${r.type}-${r.id}`}
              style={[styles.resultItem, { backgroundColor: t.cardBg, borderColor: t.border }]}
              onPress={() => handleSelect(r)}
              activeOpacity={0.8}
            >
              {r.image ? (
                <View style={styles.resultImageWrap}>
                  <Image source={{ uri: r.image }} style={styles.resultImage} resizeMode="cover" />
                </View>
              ) : (
                <View style={[styles.resultIcon, { backgroundColor: t.chipBg }]}>{getIcon(r.type)}</View>
              )}
              <View style={styles.resultText}>
                <Text style={[styles.resultTitle, { color: t.txt1 }]} numberOfLines={1}>{r.title}</Text>
                {r.subtitle ? (
                  <Text style={[styles.resultSub, { color: t.txt2 }]} numberOfLines={1}>{r.subtitle}</Text>
                ) : null}
                <Text style={[styles.resultType, { color: t.txt2 }]}>{getTypeLabel(r.type)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
  },
  closeBtn: { padding: 8 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: { fontSize: 16, marginTop: 12 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultImageWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  resultImage: { width: '100%', height: '100%' },
  resultText: { flex: 1 },
  resultTitle: { fontSize: 16, fontWeight: '600' },
  resultSub: { fontSize: 13, marginTop: 2 },
  resultType: { fontSize: 11, marginTop: 4 },
});

export default GlobalSearchScreen;
