import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { MOCK_PARTNERS } from '@/api/mockData';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useThemeMode } from '@/context/ThemeContext';
import { supabase, processImageUrl } from '@/lib/supabase';
import { Tag, Coffee, Shirt, Smartphone, Ticket, GraduationCap, Gift, Megaphone } from 'lucide-react-native';

type Props = StackScreenProps<RootStackParamList, 'PartnerDetail'>;

interface FirsatData {
  id: number;
  baslik: string;
  aciklama: string;
  tarih?: string;
  kategori: string;
  resim_url?: string;
}

const PartnerDetailScreen: React.FC<Props> = ({ route }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { partnerId } = route.params;
  const [partner, setPartner] = useState<FirsatData | null>(null);
  const [loading, setLoading] = useState(true);

  // Kategori Temaları
  const getCategoryTheme = (kategori: string) => {
    switch (kategori) {
      case 'Yiyecek/İçecek': return { icon: Coffee, color: '#e67e22', bg: '#fff7ed' }; 
      case 'Giyim': return { icon: Shirt, color: '#9b59b6', bg: '#fbf7ff' }; 
      case 'Teknoloji': return { icon: Smartphone, color: '#3498db', bg: '#f0f9ff' }; 
      case 'Etkinlik Bileti': return { icon: Ticket, color: '#e74c3c', bg: '#fef2f2' }; 
      case 'Öğrenci Özel': return { icon: GraduationCap, color: '#2ecc71', bg: '#f0fdf4' }; 
      case 'İndirim': return { icon: Tag, color: '#f43f5e', bg: '#fff1f2' }; 
      case 'Kampanya': return { icon: Megaphone, color: '#f59e0b', bg: '#fffbeb' };
      default: return { icon: Gift, color: '#FF6B35', bg: '#fff7ed' }; 
    }
  };

  // Supabase'den fırsat detayını çek
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const { data, error } = await supabase
          .from('firsatlar')
          .select('*')
          .eq('id', parseInt(partnerId))
          .single();
        
        if (data) setPartner(data);
        if (error) console.log("Fırsat detay hatası:", error);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPartner();
  }, [partnerId]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}
        edges={['top']}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary.indigo} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!partner) {
    return (
      <SafeAreaView
        style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>Fırsat Bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const theme = getCategoryTheme(partner.kategori);
  const Icon = theme.icon;

  return (
    <SafeAreaView
      style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>{partner.baslik}</Text>
          <Text style={[styles.headerSubtitle, isDark && { color: '#94a3b8' }]}>Genç Kart'a özel fırsat</Text>
        </View>

        {partner.resim_url && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: processImageUrl(partner.resim_url, 'firsat_resimleri') || '' }} style={styles.partnerImage} />
          </View>
        )}

        <View style={[styles.card, isDark && { backgroundColor: '#1e293b' }]}>
          <View style={[styles.iconContainer, { backgroundColor: theme.bg }]}>
            <Icon color={theme.color} size={32} />
          </View>
          <View style={styles.categoryBadge}>
            <Text style={[styles.categoryText, { color: theme.color }]}>{partner.kategori}</Text>
          </View>
          <Text style={[styles.description, isDark && { color: '#cbd5e1' }]}>{partner.aciklama}</Text>
          {partner.tarih && (
            <Text style={[styles.dateText, isDark && { color: '#94a3b8' }]}>Geçerlilik: {partner.tarih}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.lightGray,
  },
  imageContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  partnerImage: {
    width: '100%',
    height: 200, // Ayarlanabilir yükseklik
    resizeMode: 'cover',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkGray,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PartnerDetailScreen;

