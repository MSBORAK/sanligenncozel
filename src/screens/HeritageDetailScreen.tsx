import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ImageSourcePropType,
  Linking,
  Platform,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, Landmark, MapPin, Navigation, Heart, Star, X } from 'lucide-react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useUser } from '@/context/UserContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAppTheme } from '@/theme/useAppTheme';
import { cardOuterShadow, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { supabase } from '@/lib/supabase';
import { mapKesfetRow, type KesfetRow } from '@/lib/kesfet';
import { MOCK_MAGAZINES } from '@/api/mockData';
import type { HeritageCategory } from '@/types';

type Props = StackScreenProps<RootStackParamList, 'HeritageDetail'>;

const HERO_RATIO = 0.62;
const RADIUS = 26;
const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W - 32;
const HERO_H = HERO_W * HERO_RATIO;

const categoryLabel: Record<HeritageCategory, string> = {
  historic: 'Tarihi yer',
  faith: 'İnanç ve kültür',
  museum: 'Müze',
  nature: 'Doğa & park',
  bazaar: 'Tarihi çarşı',
};

interface PlaceView {
  title: string;
  description?: string;
  category: HeritageCategory;
  image: string | number;
}

interface ReviewRow {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name?: string;
}

function toPlaceFromMock(id: string): PlaceView | null {
  const m = MOCK_MAGAZINES.find((x) => String(x.id) === String(id));
  if (!m) return null;
  return {
    title: m.title,
    description: m.description,
    category: m.category || 'historic',
    image: typeof m.image === 'string' ? m.image : m.image,
  };
}

function resolveImageSource(image: string | number): ImageSourcePropType {
  if (typeof image === 'string') return { uri: image };
  return image;
}

function openInMaps(placeName: string) {
  const query = encodeURIComponent(`${placeName}, Şanlıurfa`);
  const url = Platform.OS === 'ios'
    ? `maps://?q=${query}`
    : `geo:0,0?q=${query}`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  });
}

const HeritageDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useUser();
  const { isFavoriteHeritage, toggleFavorite } = useFavorites();

  const starYellow = '#EAB308';
  const cardBorder = t.isDark ? cardBorderDark : cardBorderLight;
  const isFav = isFavoriteHeritage(id);

  const [place, setPlace] = useState<PlaceView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [allReviewsModalVisible, setAllReviewsModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPlace = useCallback(
    async (fromRefresh = false) => {
      try {
        if (fromRefresh) setRefreshing(true);
        else setLoading(true);

        const numericId = /^\d+$/.test(id) ? parseInt(id, 10) : null;
        if (numericId != null) {
          const { data, error } = await supabase.from('kesfet').select('*').eq('id', numericId).single();
          if (!error && data) {
            const p = mapKesfetRow(data as KesfetRow);
            setPlace({
              title: p.title,
              description: p.description,
              category: p.category,
              image: p.image,
            });
            return;
          }
        }

        setPlace(toPlaceFromMock(id));
      } catch (e) {
        console.error('Keşfet detay yüklenemedi:', e);
        setPlace(toPlaceFromMock(id));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  const loadReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const { data, error } = await supabase
        .from('kesfet_yorumlar')
        .select('id, user_id, rating, comment, created_at')
        .eq('place_id', id)
        .order('created_at', { ascending: false });
      if (error || !data) {
        setReviews([]);
        return;
      }

      const userIds = [...new Set(data.map((r: any) => r.user_id).filter(Boolean))];
      let namesById: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, name, username')
          .in('user_id', userIds);
        (profiles ?? []).forEach((p: any) => {
          namesById[p.user_id] = p.name || p.username || 'Kullanıcı';
        });
      }

      setReviews(
        (data as ReviewRow[]).map((r) => ({ ...r, reviewer_name: namesById[r.user_id] || 'Kullanıcı' }))
      );
    } catch (e) {
      // Tablo henüz oluşturulmamışsa sessizce boş liste göster
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlace(false);
    loadReviews();
  }, [loadPlace, loadReviews]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const relatedPlaces = useMemo(() => {
    if (!place) return [];
    return MOCK_MAGAZINES.filter((m) => m.category === place.category && String(m.id) !== String(id)).slice(0, 8);
  }, [place, id]);

  const submitReview = async () => {
    if (!profile?.userId) {
      Alert.alert('Giriş Gerekli', 'Yorum yapabilmek için giriş yapmalısın.');
      return;
    }
    if (!newComment.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen bir yorum yaz.');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('kesfet_yorumlar').insert({
        place_id: id,
        user_id: profile.userId,
        rating: newRating,
        comment: newComment.trim(),
      });
      if (error) throw error;
      setReviewModalVisible(false);
      setNewComment('');
      setNewRating(5);
      await loadReviews();
    } catch (e) {
      Alert.alert('Hata', 'Yorum gönderilemedi, lütfen tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !place) {
    return (
      <View style={[styles.screen, { backgroundColor: t.pageBg }]}>
        <StatusBar style={t.isDark ? 'light' : 'dark'} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={t.txt1} />
          <Text style={[styles.loadingLabel, { color: t.txt2 }]}>Yükleniyor…</Text>
        </View>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={[styles.screen, { backgroundColor: t.pageBg }]}>
        <StatusBar style={t.isDark ? 'light' : 'dark'} />
        <View style={[styles.simpleHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backIconBtn, { backgroundColor: t.chipBg }]} hitSlop={12}>
            <ChevronLeft color={t.txt1} size={22} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={[styles.simpleHeaderTitle, { color: t.txt1 }]}>İçerik bulunamadı</Text>
        </View>
        <View style={styles.emptyBody}>
          <Text style={[styles.emptyCopy, { color: t.txt2 }]}>
            Bu mekân bulunamadı veya kaldırılmış olabilir.
          </Text>
        </View>
      </View>
    );
  }

  const imgSource = resolveImageSource(place.image);

  return (
    <View style={[styles.screen, { backgroundColor: t.pageBg }]}>
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 28) }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPlace(true)}
            tintColor={t.txt2}
            progressViewOffset={insets.top}
          />
        }
      >
        <View style={[styles.hero, { height: HERO_H, marginTop: insets.top + 8 }]}>
          <ImageBackground
            source={imgSource}
            style={styles.heroImageBg}
            imageStyle={styles.heroImageRadius}
            resizeMode="cover"
          />
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backFab, { top: insets.top + 20, left: 28, backgroundColor: '#ffffff' }]}
          activeOpacity={0.88}
          hitSlop={8}
        >
          <ChevronLeft color="#111114" size={26} strokeWidth={2.2} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleFavorite('heritage', id)}
          style={[styles.backFab, { top: insets.top + 20, right: 28, left: undefined, backgroundColor: '#ffffff' }]}
          activeOpacity={0.88}
          hitSlop={8}
        >
          <Heart color="#111114" fill={isFav ? '#111114' : 'transparent'} size={22} strokeWidth={2.2} />
        </TouchableOpacity>

        <View style={[styles.sheet, { backgroundColor: t.pageBg }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: t.txt1, flex: 1 }]}>{place.title}</Text>
            {avgRating != null && (
              <View style={[styles.ratingPill, { backgroundColor: t.chipBg }]}>
                <Star color={starYellow} fill={starYellow} size={14} strokeWidth={0} />
                <Text style={[styles.ratingPillTxt, { color: t.txt1 }]}>{avgRating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: t.chipBg }]}>
              <Landmark color={t.accent} size={14} strokeWidth={2.2} />
              <Text style={[styles.chipText, { color: t.txt1 }]}>{categoryLabel[place.category]}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: t.chipBg }]}>
              <MapPin color={t.txt2} size={14} strokeWidth={2.2} />
              <Text style={[styles.chipText, { color: t.txt1 }]}>Şanlıurfa</Text>
            </View>
          </View>

          <View style={[styles.descCard, cardOuterShadow, cardBorder, { backgroundColor: t.cardBg }]}>
            <Text style={[styles.descLabel, { color: t.txt2 }]}>HAKKINDA</Text>
            <Text style={[styles.description, { color: t.txt1 }]}>
              {place.description?.trim() || 'Bu mekân için henüz detaylı açıklama eklenmemiş.'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.mapCta, { backgroundColor: t.txt1 }]}
            activeOpacity={0.88}
            onPress={() => openInMaps(place.title)}
          >
            <Navigation color={t.pageBg} size={18} strokeWidth={2.2} />
            <Text style={[styles.mapCtaText, { color: t.pageBg }]}>Haritada Aç</Text>
          </TouchableOpacity>

          {/* Yorumlar */}
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionTitle, { color: t.txt1 }]}>
              Yorumlar {reviews.length > 0 ? `(${reviews.length})` : ''}
            </Text>
            <TouchableOpacity onPress={() => setReviewModalVisible(true)}>
              <Text style={[styles.sectionAction, { color: starYellow }]}>Yorum Yap</Text>
            </TouchableOpacity>
          </View>

          {reviewsLoading ? (
            <ActivityIndicator color={t.txt2} style={{ marginVertical: 12 }} />
          ) : reviews.length === 0 ? (
            <Text style={[styles.emptyReviewsTxt, { color: t.txt2 }]}>Henüz yorum yok — ilk yorumu sen yaz.</Text>
          ) : (
            <View style={{ gap: 10 }}>
              {reviews.slice(0, 2).map((r) => (
                <View key={r.id} style={[styles.reviewCard, cardOuterShadow, cardBorder, { backgroundColor: t.cardBg }]}>
                  <View style={styles.reviewHeadRow}>
                    <View style={[styles.reviewAvatar, { backgroundColor: t.chipBg }]}>
                      <Text style={[styles.reviewAvatarTxt, { color: t.txt1 }]}>{(r.reviewer_name || 'K').charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.reviewerName, { color: t.txt1 }]} numberOfLines={1}>{r.reviewer_name || 'Kullanıcı'}</Text>
                  </View>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} color={starYellow} fill={i < r.rating ? starYellow : "transparent"} size={13} strokeWidth={1.5} />
                    ))}
                  </View>
                  <Text style={[styles.reviewComment, { color: t.txt1 }]}>{r.comment}</Text>
                </View>
              ))}
              {reviews.length > 2 && (
                <TouchableOpacity onPress={() => setAllReviewsModalVisible(true)} style={styles.seeAllBtn}>
                  <Text style={[styles.sectionAction, { color: t.txt1 }]}>Tümünü Gör ({reviews.length})</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Diğer Yerler */}
          {relatedPlaces.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeadRow}>
                <Text style={[styles.sectionTitle, { color: t.txt1 }]}>Diğer Yerler</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
                {relatedPlaces.map((rp) => {
                  const rpImg = typeof rp.image === 'string' ? { uri: rp.image } : rp.image;
                  const rpFav = isFavoriteHeritage(rp.id);
                  return (
                    <TouchableOpacity
                      key={rp.id}
                      style={[styles.relatedCard, cardOuterShadow, cardBorder, { backgroundColor: t.cardBg }]}
                      activeOpacity={0.9}
                      onPress={() => navigation.push('HeritageDetail', { id: rp.id })}
                    >
                      <View style={styles.relatedImgWrap}>
                        <Image source={rpImg} style={styles.relatedImg} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.relatedHeart}
                          onPress={() => toggleFavorite('heritage', rp.id)}
                          hitSlop={8}
                        >
                          <Heart color={rpFav ? t.accent : '#111114'} fill={rpFav ? t.accent : 'transparent'} size={15} strokeWidth={2.2} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.relatedTitle, { color: t.txt1 }]} numberOfLines={1}>{rp.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Tüm yorumlar modalı */}
      <Modal visible={allReviewsModalVisible} animationType="slide" transparent onRequestClose={() => setAllReviewsModalVisible(false)}>
        <View style={styles.modalBack}>
          <View style={[styles.modalCard, { backgroundColor: t.cardBg, maxHeight: '75%' }]}>
            <View style={styles.modalHeadRow}>
              <Text style={[styles.modalTitle, { color: t.txt1 }]}>Tüm Yorumlar ({reviews.length})</Text>
              <TouchableOpacity onPress={() => setAllReviewsModalVisible(false)} style={[styles.modalCloseBtn, { backgroundColor: t.chipBg }]}>
                <X color={t.txt1} size={18} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 10 }}>
              {reviews.map((r) => (
                <View key={r.id} style={[styles.reviewCard, cardOuterShadow, cardBorder, { backgroundColor: t.pageBg }]}>
                  <View style={styles.reviewHeadRow}>
                    <View style={[styles.reviewAvatar, { backgroundColor: t.chipBg }]}>
                      <Text style={[styles.reviewAvatarTxt, { color: t.txt1 }]}>{(r.reviewer_name || 'K').charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.reviewerName, { color: t.txt1 }]} numberOfLines={1}>{r.reviewer_name || 'Kullanıcı'}</Text>
                  </View>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} color={starYellow} fill={i < r.rating ? starYellow : "transparent"} size={13} strokeWidth={1.5} />
                    ))}
                  </View>
                  <Text style={[styles.reviewComment, { color: t.txt1 }]}>{r.comment}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Yorum ekleme modalı */}
      <Modal visible={reviewModalVisible} animationType="slide" transparent onRequestClose={() => setReviewModalVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalBack}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: t.cardBg }]}>
            <View style={styles.modalHeadRow}>
              <Text style={[styles.modalTitle, { color: t.txt1 }]}>Yorum Yap</Text>
              <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={[styles.modalCloseBtn, { backgroundColor: t.chipBg }]}>
                <X color={t.txt1} size={18} />
              </TouchableOpacity>
            </View>
            <View style={styles.starsPickerRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setNewRating(i + 1)} hitSlop={6}>
                  <Star color={starYellow} fill={i < newRating ? starYellow : "transparent"} size={30} strokeWidth={1.5} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.modalInput, { backgroundColor: t.chipBg, color: t.txt1 }]}
              placeholder="Bu mekân hakkında ne düşünüyorsun?"
              placeholderTextColor={t.txt2}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={4}
              returnKeyType="done"
              blurOnSubmit
            />
            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: t.txt1, opacity: submitting ? 0.6 : 1 }]}
              onPress={submitReview}
              disabled={submitting}
            >
              <Text style={[styles.modalSubmitTxt, { color: t.pageBg }]}>{submitting ? 'Gönderiliyor…' : 'Gönder'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingLabel: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyBody: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  emptyCopy: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  hero: {
    width: HERO_W,
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: '#EEF1F4',
    borderRadius: RADIUS,
    overflow: 'hidden',
  },
  heroImageBg: {
    width: '100%',
    height: '100%',
  },
  heroImageRadius: {
    borderRadius: RADIUS,
  },
  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
  },
  backFab: {
    position: 'absolute',
    left: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  sheet: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 28,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 2,
  },
  ratingPillTxt: {
    fontSize: 13,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  descCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  descLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  description: {
    fontSize: 15.5,
    lineHeight: 24,
  },
  mapCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 24,
  },
  mapCtaText: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyReviewsTxt: {
    fontSize: 13.5,
    fontStyle: 'italic',
  },
  seeAllBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  reviewCard: {
    borderRadius: 16,
    padding: 14,
  },
  reviewHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarTxt: {
    fontSize: 11,
    fontWeight: '800',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  relatedCard: {
    width: 130,
    borderRadius: 16,
    padding: 8,
    overflow: 'hidden',
  },
  relatedImgWrap: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  relatedImg: {
    width: '100%',
    height: '100%',
  },
  relatedHeart: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  modalBack: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
  },
  modalHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  modalInput: {
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalSubmitBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalSubmitTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
});

export default HeritageDetailScreen;
