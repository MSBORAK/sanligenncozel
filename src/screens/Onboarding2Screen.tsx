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

const jumpingLottie = require('@/assets/images/Jumping Lottie Animation.json');

type NavProp = StackNavigationProp<RootStackParamList, 'Onboarding2'>;

const ACCENT = '#F97316';
const ACCENT2 = '#FED7AA';

export const Onboarding2Screen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  const glowAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const badgeAnim = useRef(new Animated.Value(0)).current;
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
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60) {
          Animated.timing(slideX, { toValue: -400, duration: 220, useNativeDriver: true }).start(() => {
            navigation.navigate('Onboarding3');
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
      Animated.spring(card1Anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(card2Anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }),
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ]),
    );
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => { pulse.start(); float.start(); }, 700);
    return () => { clearTimeout(t); pulse.stop(); float.stop(); };
  }, []);

  const handleSkip = async () => {
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
        <Pressable style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Geç</Text>
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
            source={jumpingLottie}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="contain"
          />
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        </Animated.View>

        {/* Content */}
        <View style={styles.contentBlock}>
          <Animated.View style={[styles.badge, {
            opacity: badgeAnim,
            transform: [{ translateY: badgeAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
          }]}>
            <LinearGradient colors={['rgba(249,115,22,0.22)', 'rgba(234,88,12,0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badgeGradient}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>ETKİNLİKLER · FIRSATLAR</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.Text style={[styles.title, {
            opacity: titleAnim,
            transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }]}>
            İndirim mi?{'\n'}Haber Sende
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, {
            opacity: subtitleAnim,
            transform: [{ translateY: subtitleAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }]}>
            Genç Kart ile anlaşmalı yerlerde indir,{'\n'}yakındaki etkinlikleri anında keşfet.
          </Animated.Text>

          <View style={styles.cardsStack}>
            <Animated.View style={[styles.eventCard, styles.cardBack, {
              opacity: card1Anim,
              transform: [
                { translateY: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [20, 6] }) },
                { scale: 0.94 },
              ],
            }]} />

            <Animated.View style={[styles.eventCard, {
              opacity: card1Anim,
              transform: [{ translateY: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            }]}>
              <LinearGradient colors={['#F97316', '#EF4444']} style={styles.eventIcon}>
                <Text style={{ fontSize: 18 }}>🎵</Text>
              </LinearGradient>
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>Açık Hava Konseri</Text>
                <Text style={styles.eventMeta}>📍 Balıklıgöl · Bugün 20:00</Text>
              </View>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>YENİ</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.eventCard, styles.card2, {
              opacity: card2Anim,
              transform: [{ translateY: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [30, 12] }) }],
            }]}>
              <LinearGradient colors={['#8B5CF6', '#3B82F6']} style={styles.eventIcon}>
                <Text style={{ fontSize: 18 }}>🎪</Text>
              </LinearGradient>
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>Gençlik Festivali</Text>
                <Text style={styles.eventMeta}>📍 Harran · Yarın 15:00</Text>
              </View>
              <View style={[styles.newBadge, { backgroundColor: 'rgba(139,92,246,0.22)' }]}>
                <Text style={[styles.newBadgeText, { color: '#C4B5FD' }]}>3 GÜN</Text>
              </View>
            </Animated.View>
          </View>

          <View style={styles.dotsRow}>
            <DotIndicator total={3} active={1} accentColor={ACCENT} />
          </View>
        </View>

        <Animated.View style={[styles.footer, {
          paddingBottom: Math.max(24, insets.bottom + 16),
          opacity: btnAnim,
          transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
        }]}>
          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              onPress={() => navigation.navigate('Onboarding3')}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={styles.pillBtn}
            >
              <LinearGradient
                colors={['#F97316', '#EF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pillGradient}
              >
                <Text style={styles.pillText}>Devam Et</Text>
                <View style={styles.arrowCircle}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
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
    backgroundColor: 'rgba(249,115,22,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.28)',
  },
  skipText: { color: ACCENT2, fontSize: 13, fontWeight: '700' },
  illustrationArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    height: 230,
  },
  glowCircle: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(249,115,22,0.12)',
    shadowColor: ACCENT,
    shadowOpacity: 0.5,
    shadowRadius: 50,
    shadowOffset: { width: 0, height: 0 },
  },
  glowSpread: {
    position: 'absolute',
    bottom: 0,
    width: 180,
    height: 36,
    borderRadius: 90,
    backgroundColor: 'rgba(249,115,22,0.16)',
    shadowColor: ACCENT,
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  lottie: { width: 230, height: 200 },
  liveChip: {
    position: 'absolute',
    top: 10,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(252,165,165,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  liveText: { color: '#FCA5A5', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  contentBlock: { flex: 1, alignItems: 'center' },
  badge: {
    borderRadius: 999,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(253,186,116,0.28)',
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
    marginBottom: 16,
  },
  cardsStack: { width: '100%', position: 'relative', height: 96 },
  eventCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBack: { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' },
  card2: { top: 52 },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventBody: { flex: 1 },
  eventTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  eventMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.22)',
  },
  newBadgeText: { color: ACCENT2, fontWeight: '700', fontSize: 10 },
  dotsRow: { marginTop: 16 },
  footer: { paddingTop: 12 },
  pillBtn: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: ACCENT,
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
});

export default Onboarding2Screen;
