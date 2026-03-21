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
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SnapColors = {
  black: '#000000',
  white: '#FFFFFF',
};

interface RouteParams {
  imageUrl: string;
  messageId?: string;
  canView: boolean;
}

const SnapViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [loading, setLoading] = useState(true);
  const [viewTime, setViewTime] = useState(0);

  useEffect(() => {
    // 10 saniye sonra otomatik kapat
    const timer = setInterval(() => {
      setViewTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // 10 saniye dolduğunda kapat
    if (viewTime >= 10) {
      navigation.goBack();
    }
  }, [viewTime]);

  if (!params.canView) {
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      
      {/* Snap Image */}
      <Image
        source={{ uri: params.imageUrl }}
        style={styles.snapImage}
        resizeMode="contain"
        onLoadEnd={() => setLoading(false)}
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
          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.timerBar}>
              <View 
                style={[
                  styles.timerProgress, 
                  { width: `${(viewTime / 10) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.timerText}>{10 - viewTime}s</Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={() => navigation.goBack()}
          >
            <X color={SnapColors.white} size={28} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Tap to close hint */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SnapColors.black,
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
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  timerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerBar: {
    flex: 1,
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
