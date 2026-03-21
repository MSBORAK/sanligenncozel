import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase, processImageUrl } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SnapColors = {
  black: '#000000',
  white: '#FFFFFF',
};

interface Story {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  user_profiles: {
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

const StoryViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { userId: string };
  
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchUserStories();
  }, []);

  useEffect(() => {
    if (stories.length === 0) return;

    // 5 saniye progress bar
    const duration = 5000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = Math.min(1, elapsed / duration);
      setProgress(newProgress);

      if (newProgress >= 1) {
        clearInterval(timer);
        handleNext();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, stories]);

  const fetchUserStories = async () => {
    try {
      // Herkese açık hikayeleri çek (recipient_id NULL)
      const { data: storiesData, error } = await supabase
        .from('social_stories')
        .select('*')
        .eq('user_id', params.userId)
        .is('recipient_id', null) // Sadece herkese açık hikayeler
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!storiesData || storiesData.length === 0) {
        navigation.goBack();
        return;
      }

      // Kullanıcı profilini çek
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('name, username, avatar_url')
        .eq('user_id', params.userId)
        .single();

      // Story'lere profil bilgisini ekle
      const storiesWithProfile = storiesData.map((story: any) => ({
        ...story,
        user_profiles: profileData || {
          name: 'Kullanıcı',
          username: 'user',
          avatar_url: null,
        },
      }));

      setStories(storiesWithProfile as any);
      
      // İlk story'yi görüntülendi olarak işaretle
      const { data: { user } } = await supabase.auth.getUser();
      if (user && storiesData[0].user_id !== user.id) {
        await supabase.rpc('mark_story_as_viewed', {
          p_story_id: storiesData[0].id,
          p_viewer_id: user.id,
        });
      }
    } catch (error) {
      console.error('Fetch stories error:', error);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
      
      // Yeni story'yi görüntülendi olarak işaretle
      const nextStory = stories[currentIndex + 1];
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user && nextStory.user_id !== user.id) {
          supabase.rpc('mark_story_as_viewed', {
            p_story_id: nextStory.id,
            p_viewer_id: user.id,
          });
        }
      });
    } else {
      navigation.goBack();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={SnapColors.white} />
      </View>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  const currentStory = stories[currentIndex];
  const timeAgo = getTimeAgo(currentStory.created_at);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      {/* Story Image */}
      <Image
        source={{ uri: processImageUrl(currentStory.image_url) || 'https://via.placeholder.com/400' }}
        style={styles.storyImage}
        resizeMode="cover"
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.3)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Touch Areas */}
      <View style={styles.touchAreas}>
        <TouchableOpacity
          style={styles.touchAreaLeft}
          onPress={handlePrevious}
          activeOpacity={1}
        />
        <TouchableOpacity
          style={styles.touchAreaRight}
          onPress={handleNext}
          activeOpacity={1}
        />
      </View>

      {/* Top Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {stories.map((_, index) => (
            <View key={index} style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      index < currentIndex
                        ? 100
                        : index === currentIndex
                        ? progress * 100
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Image
            source={{
              uri: processImageUrl(currentStory.user_profiles.avatar_url) || 'https://i.pravatar.cc/150',
            }}
            style={styles.userAvatar}
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.userName}>{currentStory.user_profiles.name}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <X color={SnapColors.white} size={28} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const storyDate = new Date(timestamp);
  const diffMs = now.getTime() - storyDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Şimdi';
  if (diffMins < 60) return `${diffMins}d önce`;
  if (diffHours < 24) return `${diffHours}s önce`;
  return `${Math.floor(diffHours / 24)}g önce`;
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SnapColors.black,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyImage: {
    width,
    height,
  },
  touchAreas: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  touchAreaLeft: {
    flex: 1,
  },
  touchAreaRight: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: SnapColors.white,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: SnapColors.white,
  },
  userTextContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: SnapColors.white,
  },
  timeAgo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
});

export default StoryViewScreen;
