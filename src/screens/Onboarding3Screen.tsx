import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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

const friendsLottie = require('@/assets/images/friends.json');

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding3'>;

/**
 * Third onboarding screen focused on social connection.
 */
export const Onboarding3Screen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const handleGoToLogin = async () => {
    await markOnboardingCompleted();
    navigation.replace('Login');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Pressable
          style={[styles.skipButton, { top: Math.max(16, insets.top + 8) }]}
          onPress={handleGoToLogin}
        >
          <Text style={styles.skipText}>Geç</Text>
        </Pressable>
        <View style={[styles.heroBlock, { paddingTop: insets.top }]}>
          <View style={styles.lottieWrap}>
            <LottieView
              source={friendsLottie}
              autoPlay
              loop
              style={styles.lottie}
              resizeMode="contain"
            />
          </View>
          <View style={styles.featureBadge}>
            <Text style={styles.featureBadgeText}>TOPLULUK</Text>
          </View>

          <Text style={styles.title}>Topluluğa Katıl</Text>
          <Text style={styles.subtitle}>
            Gençlerle bağlantı kur, paylaş ve asistanla daha hızlı ilerle.
          </Text>

          <View>
            <DotIndicator total={3} active={2} />
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.fullWidth}>
            <PrimaryButton label="Hemen Başla" variant="onboarding" onPress={handleGoToLogin} />
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
    backgroundColor: 'rgba(16,185,129,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(110,231,183,0.36)',
  },
  skipText: {
    color: '#A7F3D0',
    fontSize: 13,
    fontWeight: '700',
  },
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  lottie: {
    width: 260,
    height: 220,
  },
  featureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(16,185,129,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(110,231,183,0.36)',
    marginBottom: 10,
  },
  featureBadgeText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
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

export default Onboarding3Screen;
