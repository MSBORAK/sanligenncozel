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
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { DotIndicator } from '@/components/DotIndicator';
import type { RootStackParamList } from '@/types/navigation';
import { markOnboardingCompleted } from '@/utils/onboarding';
import { Editorial } from '@/theme/colors';
import { useTranslation } from 'react-i18next';

const friendsLottie = require('@/assets/images/friends.json');

type NavProp = StackNavigationProp<RootStackParamList, 'Onboarding3'>;

const ACCENT = Editorial.coffee;
const ACCENT2 = Editorial.chip;

const COMMUNITY_STATS = [
  { value: '🗺️', labelKey: 'onboarding3.sanliSosyal' },
  { value: '🤖', labelKey: 'onboarding3.yapayZeka' },
  { value: '🚌', labelKey: 'onboarding3.ulasim' },
];

export const Onboarding3Screen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { t: tr } = useTranslation();
  const insets = useSafeAreaInsets();

  const glowAnim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const slideX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 10 && Math.abs(gs.dy) < 40,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) slideX.setValue(gs.dx);
      },
      onPanResponderRelease: async (_, gs) => {
        if (gs.dx < -60) {
          Animated.timing(slideX, { toValue: -400, duration: 220, useNativeDriver: true }).start(async () => {
            await markOnboardingCompleted();
            navigation.replace('Login');
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
      Animated.spring(avatarAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(statsAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 2400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2400, useNativeDriver: true }),
      ]),
    );
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
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
        <Pressable style={styles.skipButton} onPress={handleGoToLogin}>
          <Text style={styles.skipText}>{tr('onboarding2.gec')}</Text>
        </Pressable>

        {/* Lottie + glow */}
        <Animated.View style={[styles.illustrationArea, {
          opacity: glowAnim,
          transform: [
            { scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
            { translateY: floatAnim },
          ],
        }]}>
          <LottieView
            source={friendsLottie}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
          <Animated.View style={[styles.avatarRow, {
            opacity: avatarAnim,
            transform: [{ translateY: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
          }]}>
            {['🧑', '👩', '🧑🏽', '👩🏻', '👦'].map((emoji, i) => (
              <View key={i} style={[styles.avatarCircle, { marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i }]}>
                <Text style={{ fontSize: 14 }}>{emoji}</Text>
              </View>
            ))}
            <View style={styles.countBubble}>
              <Text style={styles.countText}>+12K</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Content */}
        <View style={styles.contentBlock}>
          <Animated.View style={[styles.badge, {
            opacity: badgeAnim,
            transform: [{ translateY: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }]}>
            <LinearGradient colors={['rgba(139,92,246,0.22)', 'rgba(109,40,217,0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badgeGradient}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{tr('onboarding3.badge')}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text style={[styles.title, {
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }]}>
            {tr('onboarding3.title')}
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, {
            opacity: subtitleAnim,
            transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }]}>
            {tr('onboarding3.subtitle')}
          </Animated.Text>

          <Animated.View style={[styles.statsRow, {
            opacity: statsAnim,
            transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
          }]}>
            {COMMUNITY_STATS.map((s, i) => (
              <React.Fragment key={s.labelKey}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { fontSize: 24 }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{tr(s.labelKey)}</Text>
                </View>
                {i < COMMUNITY_STATS.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </Animated.View>

          <View style={styles.dotsRow}>
            <DotIndicator total={3} active={2} accentColor={ACCENT} />
          </View>
        </View>

        <Animated.View style={[styles.footer, {
          paddingBottom: Math.max(24, insets.bottom + 16),
          opacity: btnAnim,
          transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={handleGoToLogin}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={styles.pillBtn}
            >
              <LinearGradient
                colors={['#8B5CF6', '#6D28D9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pillGradient}
              >
                <Text style={styles.pillText}>{tr('onboarding3.hemenKatil')}</Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>🎉</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <View style={styles.linkRow}>
            <Text style={styles.linkBase}>{tr('onboarding1.zatenHesabinVarMi')} </Text>
            <Pressable onPress={handleGoToLogin}>
              <Text style={styles.linkAccent}>{tr('onboarding1.girisYapKucuk')}</Text>
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
  skipButton: {
    position: 'absolute',
    right: 24,
    top: 56,
    zIndex: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.28)',
  },
  skipText: { color: ACCENT2, fontSize: 13, fontWeight: '700' },
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
    backgroundColor: 'rgba(139,92,246,0.13)',
    shadowColor: ACCENT,
    shadowOpacity: 0.5,
    shadowRadius: 52,
    shadowOffset: { width: 0, height: 0 },
  },
  glowSpread: {
    position: 'absolute',
    bottom: 20,
    width: 180,
    height: 36,
    borderRadius: 90,
    backgroundColor: 'rgba(139,92,246,0.18)',
    shadowColor: ACCENT,
    shadowOpacity: 0.6,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 8 },
  },
  lottie: { width: 230, height: 190 },
  avatarRow: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(139,92,246,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBubble: {
    marginLeft: 6,
    backgroundColor: 'rgba(139,92,246,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.3)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: { color: ACCENT2, fontSize: 11, fontWeight: '700' },
  contentBlock: { flex: 1, alignItems: 'center' },
  badge: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.28)',
    marginBottom: 12,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  badgeText: { color: ACCENT2, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { color: 'rgba(255,255,255,0.48)', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
  dotsRow: { marginTop: 18 },
  footer: { paddingTop: 12 },
  pillBtn: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: ACCENT,
    shadowOpacity: 0.45,
    shadowRadius: 22,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 16 },
  linkRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  linkBase: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  linkAccent: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default Onboarding3Screen;
