import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, Users, Radio } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { supabase, processImageUrl } from '@/lib/supabase';
import { cityFallback } from '@/lib/imageFallback';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useAppTheme } from '@/theme/useAppTheme';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// Şanlıurfa koordinatları
const SANLIURFA_REGION = {
  latitude: 37.1591,
  longitude: 38.7969,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

interface FeedPost {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  user: {
    name: string;
    username: string;
    avatar_url: string | null;
  };
  location?: string;
  latitude?: number;
  longitude?: number;
}

const SocialFeedScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { t: tr } = useTranslation();
  const t = useAppTheme();
  const isDark = t.isDark;
  const [activeTab, setActiveTab] = useState<'feed' | 'map'>('feed');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pageBg  = t.pageBg;
  const cardBg  = t.cardBg;
  const cardBdr = t.cardBdr;
  const txt1    = t.txt1;
  const txt2    = t.txt2;
  const ctaBg   = t.ctaBg;
  const ctaTxt  = t.ctaTxt;
  const chipBg  = t.chipBg;
  const amber   = t.accent;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      // Herkese açık hikayeleri çek (son 24 saat)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: storiesData, error } = await supabase
        .from('social_stories')
        .select('*')
        .is('recipient_id', null) // Herkese açık
        .gt('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (!storiesData || storiesData.length === 0) {
        setPosts([]);
        return;
      }

      // Kullanıcı profillerini çek
      const userIds = [...new Set(storiesData.map((s: any) => s.user_id))];
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', userIds);

      // Profilleri map'e çevir
      const profilesMap = new Map();
      profilesData?.forEach((profile: any) => {
        profilesMap.set(profile.user_id, profile);
      });

      // Post'ları formatla
      const formattedPosts: FeedPost[] = storiesData.map((story: any, index: number) => {
        const profile = profilesMap.get(story.user_id);

        // Rastgele konum oluştur (Şanlıurfa merkez etrafında)
        const randomLat = SANLIURFA_REGION.latitude + (Math.random() - 0.5) * 0.08;
        const randomLng = SANLIURFA_REGION.longitude + (Math.random() - 0.5) * 0.08;

        return {
          id: story.id,
          user_id: story.user_id,
          image_url: story.image_url,
          created_at: story.created_at,
          user: {
            name: profile?.name || tr('common.kullanici'),
            username: profile?.username || 'user',
            avatar_url: profile?.avatar_url,
          },
          location: 'Şanlıurfa',
          latitude: randomLat,
          longitude: randomLng,
        };
      });

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Fetch posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return tr('weather.simdi');
    if (diffHours < 24) return tr('common.saatOnce', { count: diffHours });
    return tr('common.gunOnce', { count: diffDays });
  };

  const renderFeedView = () => (
    <ScrollView
      style={styles.feedContainer}
      contentContainerStyle={styles.feedContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={txt1} />
      }
    >
      <View style={styles.feedGrid}>
        {posts.map((post) => (
          <View key={post.id} style={[styles.feedCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
            <TouchableOpacity
              style={[styles.feedCard, cardInnerClip]}
              activeOpacity={0.9}
              onPress={() => {
                navigation.navigate('StoryView', {
                  userId: post.user_id,
                });
              }}
            >
              <Image
                source={{ uri: processImageUrl(post.image_url) ?? cityFallback(post.id) }}
                style={styles.feedImage}
              />

              <View style={styles.feedOverlay}>
                {/* Time Badge */}
                <View style={[styles.timeBadge, { backgroundColor: cardBg }]}>
                  <Clock size={12} color={txt1} />
                  <Text style={[styles.timeBadgeText, { color: txt1 }]}>{getTimeAgo(post.created_at)}</Text>
                </View>

                {/* User Info */}
                <View style={[styles.feedUserInfoBar, { backgroundColor: cardBg }]}>
                  <View style={[styles.feedAvatar, { backgroundColor: chipBg }]}>
                    {post.user.avatar_url ? (
                      <Image
                        source={{ uri: processImageUrl(post.user.avatar_url) ?? undefined }}
                        style={styles.feedAvatarImage}
                      />
                    ) : (
                      <Text style={[styles.feedAvatarText, { color: txt1 }]}>
                        {post.user.name.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.feedUserText}>
                    <Text style={[styles.feedUserName, { color: txt1 }]} numberOfLines={1}>
                      {post.user.name}
                    </Text>
                    {post.location && (
                      <View style={styles.feedLocation}>
                        <MapPin size={10} color={txt2} />
                        <Text style={[styles.feedLocationText, { color: txt2 }]} numberOfLines={1}>
                          {post.location}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {posts.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Users size={48} color={txt2} />
          <Text style={[styles.emptyStateTitle, { color: txt1 }]}>{tr('socialFeed.icerikYok')}</Text>
          <Text style={[styles.emptyStateText, { color: txt2 }]}>
            {tr('socialFeed.icerikYokAciklama')}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderMapView = () => (
    <View style={styles.mapContainer}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={SANLIURFA_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {posts.map((post) => (
          <Marker
            key={post.id}
            coordinate={{
              latitude: post.latitude || SANLIURFA_REGION.latitude,
              longitude: post.longitude || SANLIURFA_REGION.longitude,
            }}
            onPress={() => {
              navigation.navigate('StoryView', {
                userId: post.user_id,
              });
            }}
          >
            <View style={[styles.markerContainer, { backgroundColor: cardBg, borderColor: cardBdr }]}>
              {post.user.avatar_url ? (
                <Image
                  source={{ uri: processImageUrl(post.user.avatar_url) ?? undefined }}
                  style={styles.markerImage}
                />
              ) : (
                <View style={[styles.markerPlaceholder, { backgroundColor: chipBg }]}>
                  <Text style={[styles.markerText, { color: txt1 }]}>
                    {post.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Activity Indicator */}
      <View style={[styles.activityBar, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
        <View style={styles.activityBarInner}>
          <Radio size={16} color={amber} />
          <Text style={[styles.activityText, { color: txt1 }]}>{tr('socialFeed.sonHareketlilik')}</Text>
        </View>
        <View style={styles.heatBar}>
          <View style={[styles.heatSegment, { backgroundColor: '#34C759' }]} />
          <View style={[styles.heatSegment, { backgroundColor: '#FFCC00' }]} />
          <View style={[styles.heatSegment, { backgroundColor: '#FF9500' }]} />
          <View style={[styles.heatSegment, { backgroundColor: '#FF3B30' }]} />
        </View>
      </View>

      {/* Live Badge */}
      <View style={[styles.liveBadge, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
        <View style={[styles.liveDot, { backgroundColor: amber }]} />
        <Text style={[styles.liveText, { color: txt1 }]}>{tr('socialFeed.canli')}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: pageBg }]}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: pageBg }]}>
        <View style={styles.headerContent}>
          {/* Tabs */}
          <View style={[styles.tabs, { backgroundColor: chipBg }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'feed' && { backgroundColor: ctaBg }]}
              onPress={() => setActiveTab('feed')}
            >
              <Users size={20} color={activeTab === 'feed' ? ctaTxt : txt2} />
              <Text style={[styles.tabText, { color: activeTab === 'feed' ? ctaTxt : txt2 }]}>
                {tr('socialFeed.akis')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'map' && { backgroundColor: ctaBg }]}
              onPress={() => setActiveTab('map')}
            >
              <MapPin size={20} color={activeTab === 'map' ? ctaTxt : txt2} />
              <Text style={[styles.tabText, { color: activeTab === 'map' ? ctaTxt : txt2 }]}>
                {tr('socialFeed.sehirRadari')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.subtitle, { color: txt2 }]}>
          {activeTab === 'feed' ? tr('socialFeed.arkadaslarinSonSaati') : tr('socialFeed.sehirdekiSonPaylasimlar')}
        </Text>
      </SafeAreaView>

      {/* Content */}
      {activeTab === 'feed' ? renderFeedView() : renderMapView()}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    paddingTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  feedContainer: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
  },
  feedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  feedCardOuter: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 16,
  },
  feedCard: {
    flex: 1,
    borderRadius: 16,
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    justifyContent: 'space-between',
    height: '50%',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedUserInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 6,
    alignSelf: 'flex-start',
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  feedAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  feedUserText: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 13,
    fontWeight: '600',
  },
  feedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  feedLocationText: {
    fontSize: 11,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    overflow: 'hidden',
  },
  markerImage: {
    width: '100%',
    height: '100%',
  },
  markerPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 20,
    fontWeight: '700',
  },
  activityBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
  },
  activityBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heatBar: {
    flexDirection: 'row',
    height: 4,
  },
  heatSegment: {
    flex: 1,
  },
  liveBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SocialFeedScreen;
