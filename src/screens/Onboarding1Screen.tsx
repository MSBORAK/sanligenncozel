import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GradientBackground } from '@/components/GradientBackground';
import { DotIndicator } from '@/components/DotIndicator';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markOnboardingCompleted } from '@/utils/onboarding';

const planningRouteLottie = require('@/assets/images/Man Planning A Sightseeing Route.json');

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding1'>;

/**
 * First onboarding screen introducing city discovery.
 */
export const Onboarding1Screen: React.FC = () => {
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
        <View style={[styles.heroBlock, { paddingTop: insets.top }]}>
          <View style={styles.lottieWrap}>
            <LottieView
              source={planningRouteLottie}
              autoPlay
              loop
              style={styles.lottie}
              resizeMode="contain"
            />
            <View style={styles.chatBubble}>
              <Text style={styles.chatText}>👋</Text>
            </View>
          </View>

          <View style={styles.featureBadge}>
            <Text style={styles.featureBadgeText}>KESFET</Text>
          </View>
          <Text style={styles.title}>Şanlıurfa'yı Tek Ekranda Keşfet</Text>
          <Text style={styles.subtitle}>
            Etkinlikler, fırsatlar ve gençlere özel içerikler şimdi cebinde.
          </Text>

          <View>
            <DotIndicator total={3} active={0} />
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.fullWidth}>
            <PrimaryButton label="Devam" variant="onboarding" onPress={() => navigation.navigate('Onboarding2')} />
          </View>

          <View style={styles.linkRow}>
            <Text style={styles.linkBase}>Zaten hesabın var mı? </Text>
            <Pressable onPress={handleGoToLogin}>
              <Text style={styles.linkAccent}>Giriş yap</Text>
            </Pressable>
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
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  lottie: {
    width: 260,
    height: 220,
  },
  chatBubble: {
    position: 'absolute',
    top: -8,
    right: -10,
    minWidth: 34,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  chatText: { fontSize: 13 },
  featureBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(56,189,248,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.34)',
    marginBottom: 10,
  },
  featureBadgeText: {
    color: '#BAE6FD',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
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
  linkRow: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  linkBase: { color: colors.textSecondary, fontSize: 13 },
  linkAccent: { color: colors.white, fontSize: 13, fontWeight: '700' },
});

export default Onboarding1Screen;
