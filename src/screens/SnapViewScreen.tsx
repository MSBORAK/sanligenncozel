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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SnapColors = {
  black: '#000000',
  white: '#FFFFFF',
};

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
}

const SNAP_DURATION = 10000; // 10 seconds in milliseconds

const SnapViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [remainingTime, setRemainingTime] = useState(10);
  const [currentIndex, setCurrentIndex] = useState(params.initialIndex || 0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const timeIntervalRef = useRef<any>(null);
  const closeTimerRef = useRef<any>(null);

  // Snap listesi varsa kullan, yoksa tek snap göster
  const snapList: SnapItem[] = params.snapList || [{
    id: '1',
    imageUrl: params.imageUrl,
    messageId: params.messageId,
    canView: params.canView,
  }];

  const currentSnap = snapList[currentIndex];

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
        <Text style={styles.errorText}>Bu snap görüntülenemiyor</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>Kapat</Text>
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
          <ActivityIndicator size="large" color={SnapColors.white} />
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
            <X color={SnapColors.white} size={28} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SnapColors.black,
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
    backgroundColor: SnapColors.black,
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
    backgroundColor: SnapColors.white,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: SnapColors.white,
    minWidth: 30,
  },
  closeIconButton: {
    padding: 4,
    zIndex: 101,
  },
  tapZonesContainer: {
    ...StyleSheet.absoluteFillObject,
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
    color: SnapColors.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: SnapColors.white,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: SnapColors.black,
  },
});

export default SnapViewScreen;
