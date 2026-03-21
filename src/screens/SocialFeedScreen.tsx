import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, Users, Radio } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { supabase, processImageUrl } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

// Şanlıurfa koordinatları
const SANLIURFA_REGION = {
  latitude: 37.1591,
  longitude: 38.7969,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const SnapColors = {
  yellow: '#FFFC00',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#8E8E93',
  darkGray: '#1C1C1E',
  darkCard: '#2C2C2E',
  blue: '#0FADFF',
  red: '#FF2D55',
  orange: '#FF9500',
  green: '#34C759',
  purple: '#AF52DE',
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
  const [activeTab, setActiveTab] = useState<'feed' | 'map'>('feed');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
            name: profile?.name || 'Kullanıcı',
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

    if (diffHours < 1) return 'Az önce';
    if (diffHours < 24) return `${diffHours}s önce`;
    return `${diffDays}g önce`;
  };

  const getRandomColor = (index: number) => {
    const colors = [SnapColors.orange, SnapColors.green, SnapColors.purple, SnapColors.blue, SnapColors.red];
    return colors[index % colors.length];
  };

  const renderFeedView = () => (
    <ScrollView
      style={styles.feedContainer}
      contentContainerStyle={styles.feedContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SnapColors.white} />
      }
    >
      <View style={styles.feedGrid}>
        {posts.map((post, index) => (
          <TouchableOpacity
            key={post.id}
            style={styles.feedCard}
            activeOpacity={0.9}
            onPress={() => {
              navigation.navigate('StoryView', {
                userId: post.user_id,
              });
            }}
          >
            <Image
              source={{ uri: processImageUrl(post.image_url) ?? 'https://via.placeholder.com/300' }}
              style={styles.feedImage}
            />
            
            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.feedGradient}
            >
              {/* Time Badge */}
              <View style={styles.timeBadge}>
                <Clock size={12} color={SnapColors.white} />
                <Text style={styles.timeBadgeText}>{getTimeAgo(post.created_at)}</Text>
              </View>

              {/* User Info */}
              <View style={styles.feedUserInfo}>
                <View style={[styles.feedAvatar, { borderColor: getRandomColor(index) }]}>
                  {post.user.avatar_url ? (
                    <Image
                      source={{ uri: processImageUrl(post.user.avatar_url) ?? undefined }}
                      style={styles.feedAvatarImage}
                    />
                  ) : (
                    <View style={[styles.feedAvatarPlaceholder, { backgroundColor: getRandomColor(index) }]}>
                      <Text style={styles.feedAvatarText}>
                        {post.user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.feedUserText}>
                  <Text style={styles.feedUserName} numberOfLines={1}>
                    {post.user.name}
                  </Text>
                  {post.location && (
                    <View style={styles.feedLocation}>
                      <MapPin size={10} color={SnapColors.gray} />
                      <Text style={styles.feedLocationText} numberOfLines={1}>
                        {post.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {posts.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Users size={48} color={SnapColors.gray} />
          <Text style={styles.emptyStateTitle}>Henüz içerik yok</Text>
          <Text style={styles.emptyStateText}>
            Arkadaşların hikaye paylaştığında burada görünecek
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
        customMapStyle={darkMapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {posts.map((post, index) => (
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
            <View style={[styles.markerContainer, { borderColor: getRandomColor(index) }]}>
              {post.user.avatar_url ? (
                <Image
                  source={{ uri: processImageUrl(post.user.avatar_url) ?? undefined }}
                  style={styles.markerImage}
                />
              ) : (
                <View style={[styles.markerPlaceholder, { backgroundColor: getRandomColor(index) }]}>
                  <Text style={styles.markerText}>
                    {post.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Activity Indicator */}
      <View style={styles.activityBar}>
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.6)']}
          style={styles.activityBarGradient}
        >
          <Radio size={16} color={SnapColors.green} />
          <Text style={styles.activityText}>Son 4 saatteki hareketlilik</Text>
        </LinearGradient>
        <View style={styles.heatBar}>
          <View style={[styles.heatSegment, { backgroundColor: '#34C759' }]} />
          <View style={[styles.heatSegment, { backgroundColor: '#FFCC00' }]} />
          <View style={[styles.heatSegment, { backgroundColor: '#FF9500' }]} />
          <View style={[styles.heatSegment, { backgroundColor: '#FF3B30' }]} />
        </View>
      </View>

      {/* Live Badge */}
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>CANLI</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.headerContent}>
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
              onPress={() => setActiveTab('feed')}
            >
              <Users size={20} color={activeTab === 'feed' ? SnapColors.yellow : SnapColors.gray} />
              <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
                Akış
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'map' && styles.tabActive]}
              onPress={() => setActiveTab('map')}
            >
              <MapPin size={20} color={activeTab === 'map' ? SnapColors.yellow : SnapColors.gray} />
              <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>
                Şehir Radarı
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.subtitle}>
          {activeTab === 'feed' ? 'Arkadaşlarının son 4 saati' : 'Şehirdeki son paylaşımlar'}
        </Text>
      </SafeAreaView>

      {/* Content */}
      {activeTab === 'feed' ? renderFeedView() : renderMapView()}
    </View>
  );
};

// Dark map style (Snapchat tarzı)
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8ec3b9" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1a3646" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#64779e" }]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#334e87" }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6f9ba5" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3C7680" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#304a7d" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#2c6675" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#255763" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#b0d5ce" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#3a4762" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0e1626" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#4e6d70" }]
  }
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SnapColors.black,
  },
  header: {
    backgroundColor: SnapColors.darkCard,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    paddingTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: SnapColors.darkGray,
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
  tabActive: {
    backgroundColor: SnapColors.darkCard,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: SnapColors.gray,
  },
  tabTextActive: {
    color: SnapColors.yellow,
  },
  subtitle: {
    fontSize: 13,
    color: SnapColors.gray,
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
  feedCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: SnapColors.darkCard,
  },
  feedImage: {
    width: '100%',
    height: '100%',
  },
  feedGradient: {
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: SnapColors.white,
  },
  feedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
  },
  feedAvatarImage: {
    width: '100%',
    height: '100%',
  },
  feedAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: SnapColors.white,
  },
  feedUserText: {
    flex: 1,
  },
  feedUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: SnapColors.white,
  },
  feedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  feedLocationText: {
    fontSize: 11,
    color: SnapColors.gray,
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
    color: SnapColors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: SnapColors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: SnapColors.gray,
    marginTop: 16,
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
    borderWidth: 3,
    overflow: 'hidden',
    backgroundColor: SnapColors.white,
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
    color: SnapColors.white,
  },
  activityBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityBarGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  activityText: {
    fontSize: 13,
    fontWeight: '600',
    color: SnapColors.white,
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SnapColors.green,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: SnapColors.white,
  },
});

export default SocialFeedScreen;
