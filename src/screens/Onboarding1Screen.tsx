import React, { useEffect, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GradientBackground } from '@/components/GradientBackground';
import { DotIndicator } from '@/components/DotIndicator';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markOnboardingCompleted } from '@/utils/onboarding';
import { LinearGradient } from 'expo-linear-gradient';

const planningRouteLottie = require('@/assets/images/Man Planning A Sightseeing Route.json');

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding1'>;

const ACCENT = '#F59E0B';
const ACCENT2 = '#FCD34D';

export const Onboarding1Screen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  // Entrance anims
  const glowAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  // Continuous anims
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Swipe gesture
  const slideX = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 40,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) slideX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60) {
          Animated.timing(slideX, { toValue: -400, duration: 220, useNativeDriver: true }).start(() => {
            navigation.navigate('Onboarding2');
            slideX.setValue(0);
          });
        } else {
          Animated.spring(slideX, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 300 }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    Animated.stagger(70, [
      Animated.spring(glowAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 160 }),
      Animated.spring(badgeAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(subtitleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ]),
    );
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2400, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2400, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => { pulse.start(); float.start(); }, 700);
    return () => { clearTimeout(t); pulse.stop(); float.stop(); };
  }, []);

  const handleGoToLogin = async () => {
    await markOnboardingCompleted();
    navigation.replace('Login');
  };

  const btnScale = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, damping: 14, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 260 }).start();

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <Animated.View
        style={[styles.container, { paddingTop: insets.top + 8, transform: [{ translateX: slideX }] }]}
        {...panResponder.panHandlers}
      >
        {/* Lottie + glow */}
        <Animated.View style={[styles.illustrationArea, {
          opacity: glowAnim,
          transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }, { translateY: floatAnim }],
        }]}>
          <LottieView
            source={planningRouteLottie}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
          <View style={styles.yearChip}>
            <Text style={styles.yearChipText}>11.000 YIL</Text>
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.contentBlock}>
          <Animated.View style={[styles.badge, {
            opacity: badgeAnim,
            transform: [{ translateY: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }]}>
            <LinearGradient colors={['rgba(245,158,11,0.22)', 'rgba(251,191,36,0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badgeGradient}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>ŞANLIURFA · KEŞFEDİLİYOR</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text style={[styles.title, {
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }]}>
            ŞanlıGenç'e{'\n'}Hoş Geldin
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, {
            opacity: subtitleAnim,
            transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }]}>
            Şanlıurfa'nın gençlere özel uygulaması.{'\n'}Etkinlik, indirim, ulaşım ve yapay zeka{'\n'}— hepsi cebinde.
          </Animated.Text>

          <Animated.View style={[styles.featuresRow, {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          }]}>
            {[
              { icon: '🗺️', label: 'Harita' },
              { icon: '🎟️', label: 'Etkinlik' },
              { icon: '💳', label: 'Genç Kart' },
              { icon: '🤖', label: 'Asistan' },
            ].map(f => (
              <View key={f.label} style={styles.featureChip}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </Animated.View>

          <View style={styles.dotsRow}>
            <DotIndicator total={3} active={0} accentColor={ACCENT} />
          </View>
        </View>

        {/* Footer */}
        <Animated.View style={[styles.footer, {
          paddingBottom: Math.max(24, insets.bottom + 16),
          opacity: btnAnim,
          transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={() => navigation.navigate('Onboarding2')}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={styles.pillBtn}
            >
              <LinearGradient
                colors={['#F59E0B', '#F97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pillGradient}
              >
                <Text style={styles.pillText}>Hadi Başlayalım</Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <View style={styles.linkRow}>
            <Text style={styles.linkBase}>Zaten hesabın var mı? </Text>
            <Pressable onPress={handleGoToLogin}>
              <Text style={styles.linkAccent}>Giriş yap</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    height: 240,
  },
  glowCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245,158,11,0.14)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.5,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  glowSpread: {
    position: 'absolute',
    bottom: 0,
    width: 180,
    height: 40,
    borderRadius: 90,
    backgroundColor: 'rgba(245,158,11,0.18)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.6,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
  },
  lottie: {
    width: 250,
    height: 210,
  },
  yearChip: {
    position: 'absolute',
    bottom: 14,
    right: 20,
    backgroundColor: 'rgba(245,158,11,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  yearChipText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  contentBlock: {
    flex: 1,
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    marginBottom: 14,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    color: '#FCD34D',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featureChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  featureIcon: { fontSize: 18 },
  featureLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '600' },
  dotsRow: { marginTop: 18 },
  footer: { paddingTop: 12 },
  pillBtn: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pillGradient: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  linkRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  linkBase: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  linkAccent: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default Onboarding1Screen;
