import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search, X, Calendar, MapPin, BookOpen, Bus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_STOPS } from '@/data/transport';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { supabase, processImageUrl } from '@/lib/supabase';
import { pickLocalized } from '@/lib/localizeContent';

type EventRow = { id: string; title: string; location: string; category: string };
type PartnerRow = { id: string; name: string; offer: string; description: string };
type HeritageRow = { id: string; title: string; description: string; image?: string };

type SearchResult = {
  type: 'event' | 'partner' | 'heritage' | 'stop';
  id: string;
  title: string;
  subtitle?: string;
  image?: string | any; // URL string veya require() objesi
};

const GlobalSearchScreen = ({ route }: any) => {
  const t = useAppTheme();
  const { t: tr, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const filterType = route?.params?.filterType; // 'heritage' | undefined
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<EventRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [heritage, setHeritage] = useState<HeritageRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      let eventRows, firsatRows, kesfetRows;
      try {
        const results = await Promise.all([
          supabase.from('etkinlikler').select('id, baslik, konum, kategori'),
          supabase.from('firsatlar').select('id, baslik, aciklama'),
          supabase.from('kesfet').select('id, baslik, aciklama, resim_url'),
        ]);
        eventRows = results[0].data;
        firsatRows = results[1].data;
        kesfetRows = results[2].data;
      } catch {
        if (isMounted) setDataLoading(false);
        return;
      }
      if (!isMounted) return;

      setEvents((eventRows || []).map((e: any) => ({
        id: String(e.id),
        title: pickLocalized(e, 'baslik', i18n.language) || e.baslik || '',
        location: e.konum || '',
        category: e.kategori || '',
      })));

      setPartners((firsatRows || []).map((p: any) => ({
        id: String(p.id),
        name: pickLocalized(p, 'baslik', i18n.language) || p.baslik || '',
        offer: pickLocalized(p, 'aciklama', i18n.language) || p.aciklama || '',
        description: pickLocalized(p, 'aciklama', i18n.language) || p.aciklama || '',
      })));

      setHeritage((kesfetRows || []).map((m: any) => ({
        id: String(m.id),
        title: pickLocalized(m, 'baslik', i18n.language) || m.baslik || '',
        description: pickLocalized(m, 'aciklama', i18n.language) || m.aciklama || '',
        image: processImageUrl(m.resim_url, 'kesfet_resimleri') || undefined,
      })));
      setDataLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [i18n.language]);

  const normalize = (s: string) => s.toLocaleLowerCase('tr-TR').trim();
  const match = (text: string) => query && normalize(text).includes(normalize(query));

  const results = useCallback((): SearchResult[] => {
    if (!query.trim()) return [];
    const out: SearchResult[] = [];

    // Eğer sadece keşfet araması istenmişse, diğer tipleri atla
    if (!filterType || filterType === 'event') {
      events.forEach((e) => {
        if (match(e.title) || match(e.location) || match(e.category)) {
          out.push({
            type: 'event',
            id: e.id,
            title: e.title,
            subtitle: `${e.location} · ${e.category}`,
          });
        }
      });
    }

    if (!filterType || filterType === 'partner') {
      partners.forEach((p) => {
        if (match(p.name) || match(p.offer) || match(p.description)) {
          out.push({
            type: 'partner',
            id: p.id,
            title: p.name,
            subtitle: p.offer,
          });
        }
      });
    }

    if (!filterType || filterType === 'heritage') {
      heritage.forEach((m) => {
        if (match(m.title) || match(m.description)) {
          out.push({
            type: 'heritage',
            id: m.id,
            title: m.title,
            subtitle: m.description.slice(0, 50) + (m.description.length > 50 ? '...' : ''),
            image: m.image,
          });
        }
      });
    }

    if (!filterType || filterType === 'stop') {
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
    }

    return out;
  }, [query, filterType, events, partners, heritage]);

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
    if (type === 'event') return tr('hizliErisim.etkinlik');
    if (type === 'partner') return tr('search.mekan');
    if (type === 'heritage') return tr('hizliErisim.kesfet');
    return tr('transport.durak');
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
              placeholder={filterType === 'heritage' ? 'Keşfet içeriklerinde ara...' : tr('search.placeholder')}
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
              {tr('search.emptyHint')}
            </Text>
          </View>
        ) : dataLoading ? (
          <View style={styles.placeholder}>
            <ActivityIndicator color={t.accent} />
          </View>
        ) : list.length === 0 ? (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: t.txt2 }]}>{tr('transport.sonucBulunamadi')}</Text>
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
                  <Image 
                    source={typeof r.image === 'string' ? { uri: r.image } : r.image} 
                    style={styles.resultImage} 
                    resizeMode="cover" 
                  />
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
