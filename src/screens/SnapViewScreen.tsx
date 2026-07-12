import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Animated,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Send } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');

interface SnapItem {
  id: string;
  imageUrl: string;
  messageId?: string;
  canView: boolean;
}

interface RouteParams {
  imageUrl: string;
  messageId?: string;
  canView: boolean;
  snapList?: SnapItem[];
  initialIndex?: number;
  userId?: string;
  userName?: string;
  isOwnSnap?: boolean;
  reactionsEnabled?: boolean;
}

const REACTION_EMOJIS = ['🔥', '❤️', '😍', '😂', '👏', '⚡'];

const SNAP_DURATION = 10000; // 10 seconds in milliseconds

const SnapViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const t = useAppTheme();
  const { t: tr } = useTranslation();
  const params = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(params.initialIndex || 0);
  const [replyText, setReplyText] = useState('');
  const [sentReaction, setSentReaction] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const timeIntervalRef = useRef<any>(null);
  const closeTimerRef = useRef<any>(null);
  const timerPausedRef = useRef(false);

  const isOwnSnap = params.isOwnSnap === true;
  const reactionsEnabled = true; // always show reactions

  // Snap listesi varsa kullan, yoksa tek snap göster
  const snapList: SnapItem[] = params.snapList || [{
    id: '1',
    imageUrl: params.imageUrl,
    messageId: params.messageId,
    canView: params.canView,
  }];

  const currentSnap = snapList[currentIndex];

  const pauseTimer = () => {
    timerPausedRef.current = true;
    setIsPaused(true);
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    progressAnim.stopAnimation();
  };

  const resumeTimer = () => {
    timerPausedRef.current = false;
    setIsPaused(false);
    const remaining = remainingTime;
    if (remaining <= 0) return;
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: remaining * 1000,
      useNativeDriver: false,
    }).start();
    timeIntervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) clearInterval(timeIntervalRef.current);
        return newTime;
      });
    }, 1000);
    closeTimerRef.current = setTimeout(() => {
      if (currentIndex < snapList.length - 1) goToNextSnap();
      else navigation.goBack();
    }, remaining * 1000);
  };

  const handleReactionPress = (emoji: string) => {
    setSentReaction(emoji);
    setTimeout(() => setSentReaction(null), 1500);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setReplyText('');
    Keyboard.dismiss();
    resumeTimer();
  };

  const startTimer = () => {
    // Önceki timer'ları temizle
    if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    // Progress animasyonunu sıfırla ve başlat
    progressAnim.setValue(0);
    setRemainingTime(10);

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: SNAP_DURATION,
      useNativeDriver: false,
    }).start();

    // Kalan süreyi güncelle
    timeIntervalRef.current = setInterval(() => {
      setRemainingTime(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timeIntervalRef.current);
        }
        return newTime;
      });
    }, 1000);

    // Otomatik kapanma veya sonraki snap'e geçiş
    closeTimerRef.current = setTimeout(() => {
      if (currentIndex < snapList.length - 1) {
        goToNextSnap();
      } else {
        navigation.goBack();
      }
    }, SNAP_DURATION);
  };

  const goToNextSnap = () => {
    if (currentIndex < snapList.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  const goToPrevSnap = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
    }
  };

  useEffect(() => {
    startTimer();

    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [currentIndex]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (!currentSnap.canView) {
    return (
      <View style={[styles.root, styles.errorContainer]}>
        <Text style={styles.errorText}>{tr('snapView.goruntulenemiyor')}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>{tr('common.close')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderSnapItem = ({ item, index }: { item: SnapItem; index: number }) => (
    <View style={styles.snapContainer}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.snapImage}
        resizeMode="contain"
        onLoadEnd={() => index === currentIndex && setLoading(false)}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      {/* Snap FlatList */}
      <FlatList
        ref={flatListRef}
        data={snapList}
        renderItem={renderSnapItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={true}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        initialScrollIndex={params.initialIndex || 0}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={t.ctaTxt} />
        </View>
      )}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Top Bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.topBarContent}>
          {/* Timer Bars - Multiple bars for multiple snaps */}
          <View style={styles.timerBarsContainer}>
            {snapList.map((snap, index) => (
              <View key={snap.id} style={styles.timerBarWrapper}>
                <View style={styles.timerBar}>
                  <Animated.View 
                    style={[
                      styles.timerProgress, 
                      { 
                        width: index === currentIndex 
                          ? progressAnim.interpolate({
                              inputRange: [0, 100],
                              outputRange: ['0%', '100%'],
                            })
                          : index < currentIndex ? '100%' : '0%'
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>

          <Text style={styles.timerText}>{remainingTime}s</Text>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={() => navigation.goBack()}
          >
            <X color={t.ctaTxt} size={28} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Left/Right tap zones for navigation */}
      <View style={styles.tapZonesContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.leftTapZone}
          activeOpacity={1}
          onPress={goToPrevSnap}
        />
        <TouchableOpacity
          style={styles.rightTapZone}
          activeOpacity={1}
          onPress={goToNextSnap}
        />
      </View>

      {/* Reaction sent feedback */}
      {sentReaction && (
        <View style={styles.sentReactionOverlay} pointerEvents="none">
          <Text style={styles.sentReactionText}>{sentReaction}</Text>
        </View>
      )}

      {/* Bottom reaction bar */}
      {reactionsEnabled && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.reactionBarWrapper}
        >
          <SafeAreaView edges={['bottom']} style={styles.reactionBarInner}>
            {/* Emoji row */}
            <View style={styles.emojiRow}>
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiBtn}
                  onPress={() => handleReactionPress(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Text reply row — hidden for own snaps */}
            {!isOwnSnap && (
              <View style={styles.replyRow}>
                <TextInput
                  style={styles.replyInput}
                  placeholder={tr('snapView.mesajGonder')}
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  value={replyText}
                  onChangeText={setReplyText}
                  onFocus={pauseTimer}
                  onBlur={() => { if (!replyText.trim()) resumeTimer(); }}
                  returnKeyType="send"
                  onSubmitEditing={handleSendReply}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
                  onPress={handleSendReply}
                  disabled={!replyText.trim()}
                >
                  <Send size={18} color={t.ctaTxt} />
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  snapContainer: {
    width,
    height,
  },
  snapImage: {
    width,
    height,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 100,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerBarsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  timerBarWrapper: {
    flex: 1,
  },
  timerBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#fff',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    minWidth: 30,
  },
  closeIconButton: {
    padding: 4,
    zIndex: 101,
  },
  tapZonesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 120,
    flexDirection: 'row',
    zIndex: 1,
  },
  leftTapZone: {
    flex: 1,
  },
  rightTapZone: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reactionBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 200,
  },
  reactionBarBg: {
    ...StyleSheet.absoluteFillObject,
  },
  reactionBarInner: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2F2418',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sentReactionOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  sentReactionText: {
    fontSize: 80,
  },
});

export default SnapViewScreen;
