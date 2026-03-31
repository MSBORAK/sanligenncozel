import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { DotIndicator } from '@/components/DotIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { colors } from '@/theme/colors';
import { markOnboardingCompleted } from '@/utils/onboarding';

const jumpingLottie = require('@/assets/images/Jumping Lottie Animation.json');

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding2'>;

/**
 * Second onboarding screen emphasizing nearby events.
 */
export const Onboarding2Screen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const handleSkip = async () => {
    await markOnboardingCompleted();
    navigation.replace('Login');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Pressable
          style={[styles.skipButton, { top: Math.max(16, insets.top + 8) }]}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Geç</Text>
        </Pressable>
        <View style={[styles.heroBlock, { paddingTop: insets.top }]}>
          <View style={styles.lottieWrap}>
            <LottieView
              source={jumpingLottie}
              autoPlay
              loop
              style={styles.lottie}
              resizeMode="contain"
            />
          </View>
          <View style={styles.featureBadge}>
            <Text style={styles.featureBadgeText}>ETKINLIK</Text>
          </View>

          <View style={styles.eventCard}>
            <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.eventIcon}>
              <Text style={styles.eventIconText}>🎵</Text>
            </LinearGradient>
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>Açık Hava Konseri</Text>
              <Text style={styles.eventMeta}>📍 Balıklıgöl · Bugün 20:00</Text>
            </View>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>YENİ</Text>
            </View>
          </View>

          <Text style={styles.title}>Sana Uygun Etkinlikleri Bul</Text>
          <Text style={styles.subtitle}>Yakındaki konser, buluşma ve fırsatları anında gör.</Text>

          <View>
            <DotIndicator total={3} active={1} />
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.fullWidth}>
            <PrimaryButton label="Devam" variant="onboarding" onPress={() => navigation.navigate('Onboarding3')} />
          </View>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    zIndex: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.35)',
  },
  skipText: {
    color: '#FCD34D',
    fontSize: 13,
    fontWeight: '700',
  },
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  lottie: {
    width: 260,
    height: 220,
  },
  featureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.34)',
    marginBottom: 10,
  },
  featureBadgeText: {
    color: '#FCD34D',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  eventCard: {
    width: '100%',
    borderRadius: 16,
    padding: 12,
    backgroundColor: colors.glassBackground,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventIconText: { fontSize: 16 },
  eventBody: { flex: 1 },
  eventTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 2 },
  eventMeta: { color: colors.textSecondary, fontSize: 11 },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245,158,11,0.24)',
  },
  newBadgeText: { color: '#FCD34D', fontWeight: '700', fontSize: 10 },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    paddingHorizontal: 24,
  },
  fullWidth: { width: '100%' },
});

export default Onboarding2Screen;
