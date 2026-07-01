import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import PagerView from 'react-native-pager-view';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/GradientBackground';
import { DotIndicator } from '@/components/DotIndicator';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { markOnboardingCompleted } from '@/utils/onboarding';

const planningRouteLottie = require('@/assets/images/Man Planning A Sightseeing Route.json');
const jumpingLottie = require('@/assets/images/Jumping Lottie Animation.json');
const friendsLottie = require('@/assets/images/friends.json');

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding'>;

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Slide 1: Full-bleed lottie + bottom sheet panel ───────────────────────
const Slide1: React.FC<{
  isActive: boolean;
  onNext: () => void;
  onLogin: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}> = ({ isActive, onNext, onLogin, insets }) => {
  const panelY = useRef(new Animated.Value(120)).current;
  const panelOpacity = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const chipsAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    panelY.setValue(120); panelOpacity.setValue(0);
    titleAnim.setValue(0); chipsAnim.setValue(0); btnAnim.setValue(0);

    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(panelY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 140 }),
        Animated.timing(panelOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.stagger(80, [
      Animated.delay(300),
      Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(chipsAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }),
    ]).start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => float.start(), 600);
    return () => { clearTimeout(t); float.stop(); };
  }, [isActive]);

  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, damping: 14, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 260 }).start();

  return (
    <View style={styles.slide}>
      {/* Üst başlık satırı — yıl rozeti (sol) + Geç (sağ), animasyonun üstüne binmez */}
      <View style={[styles.topRow, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.floatingBadge, { backgroundColor: 'rgba(245,158,11,0.18)', borderColor: 'rgba(251,191,36,0.4)' }]}>
          <Text style={[styles.floatingBadgeText, { color: '#FCD34D' }]}>✦ ŞANLIURFA · 11.000 YIL ✦</Text>
        </View>
        <Pressable style={styles.skipBtnInline} onPress={onLogin}>
          <Text style={[styles.skipText, { color: '#FCD34D' }]}>Geç</Text>
        </Pressable>
      </View>
      {/* Full-bleed lottie */}
      <Animated.View style={[styles.heroArea, { transform: [{ translateY: floatAnim }] }]}>
        <LottieView source={planningRouteLottie} autoPlay loop style={styles.heroLottie} resizeMode="contain" />
      </Animated.View>

      {/* Bottom sheet panel */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: panelY }], opacity: panelOpacity }]}>
        <BlurView intensity={40} tint="dark" style={styles.blurSheet}>
          <LinearGradient
            colors={['rgba(15,5,35,0.72)', 'rgba(10,4,25,0.96)']}
            style={styles.sheetInner}
          >
            {/* Handle */}
            <View style={styles.sheetHandle} />

            <Animated.Text style={[styles.bigTitle, {
              opacity: titleAnim,
              transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }]}>
              ŞanlıGenç'e{'\n'}Hoş Geldin
            </Animated.Text>

            <Animated.Text style={[styles.bigSubtitle, {
              opacity: titleAnim,
              transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            }]}>
              Şanlıurfa'nın gençlere özel uygulaması.
            </Animated.Text>

            {/* Feature özet satırı */}
            <Animated.Text style={[styles.featureLine, {
              opacity: chipsAnim,
              transform: [{ translateY: chipsAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
            }]}>
              🎟️ Etkinlik · 💳 Genç Kart · 🚌 Ulaşım · 🤖 Asistan
            </Animated.Text>

            <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 4 }}>
              <DotIndicator total={3} active={0} accentColor="#F59E0B" />
            </View>

            {/* Button */}
            <Animated.View style={[{
              opacity: btnAnim,
              transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }, { scale: btnScale }],
              marginTop: 12,
            }]}>
              <Pressable onPress={onNext} onPressIn={onPressIn} onPressOut={onPressOut} style={[styles.pillBtn, { shadowColor: '#F59E0B' }]}>
                <LinearGradient colors={['#F59E0B', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pillGradient}>
                  <Text style={styles.pillText}>Hadi Başlayalım</Text>
                  <View style={styles.arrowCircle}><Text style={styles.arrowText}>→</Text></View>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <View style={styles.linkRow}>
              <Text style={styles.linkBase}>Zaten hesabın var mı? </Text>
              <Pressable onPress={onLogin}><Text style={styles.linkAccent}>Giriş yap</Text></Pressable>
            </View>

            <View style={{ height: Math.max(8, insets.bottom) }} />
          </LinearGradient>
        </BlurView>
      </Animated.View>
    </View>
  );
};

// ─── Slide 2: Split layout — lottie top half, cards peek below ─────────────
const Slide2: React.FC<{
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
  onLogin: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}> = ({ isActive, onNext, onSkip, onLogin, insets }) => {
  const titleAnim = useRef(new Animated.Value(0)).current;
  const card1 = useRef(new Animated.Value(0)).current;
  const card2 = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    [titleAnim, card1, card2, btnAnim].forEach(a => a.setValue(0));

    Animated.stagger(90, [
      Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(card1, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 160 }),
      Animated.spring(card2, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 160 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }),
    ]).start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2600, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => float.start(), 500);
    return () => { clearTimeout(t); float.stop(); };
  }, [isActive]);

  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, damping: 14, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 260 }).start();

  return (
    <View style={[styles.slide, { paddingTop: insets.top + 8 }]}>
      <Pressable style={[styles.skipBtn, { top: insets.top + 12 }]} onPress={onSkip}>
        <Text style={[styles.skipText, { color: '#FED7AA' }]}>Geç</Text>
      </Pressable>

      {/* Lottie */}
      <Animated.View style={[styles.splitLottieArea, { transform: [{ translateY: floatAnim }] }]}>
        <LottieView source={jumpingLottie} autoPlay loop style={styles.splitLottie} resizeMode="contain" />
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.splitTitleBlock, {
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
      }]}>
        <View style={[styles.inlineBadge, { backgroundColor: 'rgba(249,115,22,0.15)', borderColor: 'rgba(253,186,116,0.3)' }]}>
          <View style={[styles.badgeDot, { backgroundColor: '#F97316' }]} />
          <Text style={[styles.inlineBadgeText, { color: '#FED7AA' }]}>ETKİNLİKLER · FIRSATLAR</Text>
        </View>
        <Text style={styles.splitTitle}>İndirim mi?{'\n'}Haber Sende</Text>
        <Text style={styles.splitSubtitle}>Genç Kart ile anlaşmalı yerlerde indir, yakındaki etkinlikleri keşfet.</Text>
      </Animated.View>

      {/* Stacked event cards */}
      <View style={styles.cardStack}>
        <Animated.View style={[styles.eventCard, styles.cardShadow, {
          opacity: card1,
          transform: [{ translateY: card1.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        }]}>
          <LinearGradient colors={['#F97316', '#EF4444']} style={styles.eventIconBox}>
            <Text style={{ fontSize: 18 }}>🎵</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>Açık Hava Konseri</Text>
            <Text style={styles.eventMeta}>📍 Balıklıgöl · Bugün 20:00</Text>
          </View>
          <View style={styles.newBadge}><Text style={styles.newBadgeText}>YENİ</Text></View>
        </Animated.View>

        <Animated.View style={[styles.eventCard, {
          opacity: card2,
          transform: [{ translateY: card2.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }]}>
          <LinearGradient colors={['#8B5CF6', '#3B82F6']} style={styles.eventIconBox}>
            <Text style={{ fontSize: 18 }}>🎪</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle}>Gençlik Festivali</Text>
            <Text style={styles.eventMeta}>📍 Harran · Yarın 15:00</Text>
          </View>
          <View style={[styles.newBadge, { backgroundColor: 'rgba(139,92,246,0.22)' }]}>
            <Text style={[styles.newBadgeText, { color: '#C4B5FD' }]}>3 GÜN</Text>
          </View>
        </Animated.View>
      </View>

      {/* Button */}
      <Animated.View style={[styles.btnWrap, {
        paddingBottom: Math.max(24, insets.bottom + 16),
        opacity: btnAnim,
        transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: btnScale }],
      }]}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <DotIndicator total={3} active={1} accentColor="#F97316" />
        </View>
        <Pressable onPress={onNext} onPressIn={onPressIn} onPressOut={onPressOut} style={[styles.pillBtn, { shadowColor: '#F97316' }]}>
          <LinearGradient colors={['#F97316', '#EF4444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pillGradient}>
            <Text style={styles.pillText}>Devam Et</Text>
            <View style={styles.arrowCircle}><Text style={styles.arrowText}>→</Text></View>
          </LinearGradient>
        </Pressable>
        <View style={styles.linkRow}>
          <Text style={styles.linkBase}>Zaten hesabın var mı? </Text>
          <Pressable onPress={onLogin}><Text style={styles.linkAccent}>Giriş yap</Text></Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Slide 3: Centered community — big lottie, avatars, stats ──────────────
const Slide3: React.FC<{
  isActive: boolean;
  onFinish: () => void;
  onSkip: () => void;
  insets: ReturnType<typeof useSafeAreaInsets>;
}> = ({ isActive, onFinish, onSkip, insets }) => {
  const lottieAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    [lottieAnim, titleAnim, avatarAnim, btnAnim].forEach(a => a.setValue(0));

    Animated.stagger(80, [
      Animated.spring(lottieAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 160 }),
      Animated.spring(avatarAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(titleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
      Animated.spring(btnAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 160 }),
    ]).start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 3000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ]),
    );
    const t = setTimeout(() => float.start(), 600);
    return () => { clearTimeout(t); float.stop(); };
  }, [isActive]);

  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, damping: 14, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 260 }).start();

  return (
    <View style={[styles.slide, { paddingHorizontal: 24, paddingTop: insets.top + 8 }]}>
      <Pressable style={[styles.skipBtn, { top: insets.top + 12 }]} onPress={onSkip}>
        <Text style={[styles.skipText, { color: '#FECDD3' }]}>Geç</Text>
      </Pressable>

      {/* Lottie */}
      <Animated.View style={[styles.communityLottieArea, {
        opacity: lottieAnim,
        transform: [
          { scale: lottieAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) },
          { translateY: floatAnim },
        ],
      }]}>
        <LottieView source={friendsLottie} autoPlay loop style={styles.communityLottie} resizeMode="contain" />

        {/* Floating avatars */}
        <Animated.View style={[styles.avatarStrip, {
          opacity: avatarAnim,
          transform: [{ translateY: avatarAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        }]}>
          {['🧑', '👩', '🧑🏽', '👩🏻', '👦'].map((e, i) => (
            <View key={i} style={[styles.avatarBubble, { marginLeft: i === 0 ? 0 : -9, zIndex: 5 - i }]}>
              <Text style={{ fontSize: 15 }}>{e}</Text>
            </View>
          ))}
          <View style={styles.countPill}><Text style={styles.countPillText}>+12K genç</Text></View>
        </Animated.View>
      </Animated.View>

      {/* Title block */}
      <Animated.View style={[styles.communityTitle, {
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
      }]}>
        <View style={[styles.inlineBadge, { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(253,164,175,0.35)', marginBottom: 14 }]}>
          <View style={[styles.badgeDot, { backgroundColor: '#FB7185' }]} />
          <Text style={[styles.inlineBadgeText, { color: '#FECDD3' }]}>TOPLULUK · KIVILCIM</Text>
        </View>
        <Text style={styles.splitTitle}>Kıvılcım At,{'\n'}Bağlantıda Kal</Text>
        <Text style={styles.splitSubtitle}>Kıvılcım'da anlarını paylaş, yapay zeka asistanın her soruya hazır.</Text>
      </Animated.View>

      {/* Features row */}
      <Animated.View style={[styles.communityFeatures, {
        opacity: titleAnim,
        transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }]}>
        {[
          { icon: '⚡', label: 'Kıvılcım', sub: 'Anları paylaş' },
          { icon: '🤖', label: 'Asistan', sub: 'Her soruya hazır' },
          { icon: '🗺️', label: 'Keşfet', sub: 'Şehri tanı' },
        ].map(f => (
          <View key={f.label} style={styles.featureBlock}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{f.icon}</Text>
            <Text style={styles.featureBlockLabel}>{f.label}</Text>
            <Text style={styles.featureBlockSub}>{f.sub}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Button */}
      <Animated.View style={[styles.btnWrap, {
        paddingBottom: Math.max(24, insets.bottom + 16),
        opacity: btnAnim,
        transform: [{ translateY: btnAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: btnScale }],
      }]}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <DotIndicator total={3} active={2} accentColor="#FB7185" />
        </View>
        <Pressable onPress={onFinish} onPressIn={onPressIn} onPressOut={onPressOut} style={[styles.pillBtn, { shadowColor: '#FB7185' }]}>
          <LinearGradient colors={['#FB7185', '#E11D48']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.pillGradient}>
            <Text style={styles.pillText}>Hemen Katıl</Text>
            <View style={styles.arrowCircle}><Text style={{ fontSize: 18 }}>🎉</Text></View>
          </LinearGradient>
        </Pressable>
        <View style={styles.linkRow}>
          <Text style={styles.linkBase}>Zaten hesabın var mı? </Text>
          <Pressable onPress={onSkip}><Text style={styles.linkAccent}>Giriş yap</Text></Pressable>
        </View>
      </Animated.View>
    </View>
  );
};

// ─── Root ───────────────────────────────────────────────────────────────────
export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [activePage, setActivePage] = useState(0);

  const ACCENT_COLORS = ['#F59E0B', '#F97316', '#FB7185'];

  const goToLogin = async () => {
    await markOnboardingCompleted();
    navigation.replace('Login');
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <PagerView
          ref={pagerRef}
          style={{ flex: 1 }}
          initialPage={0}
          onPageSelected={e => setActivePage(e.nativeEvent.position)}
          overdrag
        >
          <View key="0" style={{ flex: 1 }}>
            <Slide1
              isActive={activePage === 0}
              onNext={() => pagerRef.current?.setPage(1)}
              onLogin={goToLogin}
              insets={insets}
            />
          </View>
          <View key="1" style={{ flex: 1 }}>
            <Slide2
              isActive={activePage === 1}
              onNext={() => pagerRef.current?.setPage(2)}
              onSkip={goToLogin}
              onLogin={goToLogin}
              insets={insets}
            />
          </View>
          <View key="2" style={{ flex: 1 }}>
            <Slide3
              isActive={activePage === 2}
              onFinish={goToLogin}
              onSkip={goToLogin}
              insets={insets}
            />
          </View>
        </PagerView>

      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  slide: { flex: 1 },

  // Slide 1
  heroArea: {
    height: SCREEN_H * 0.44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLottie: { width: '100%', height: '100%' },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  skipBtnInline: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  floatingBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  floatingBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  blurSheet: { flex: 1 },
  sheetInner: {
    paddingTop: 10,
    paddingHorizontal: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  bigTitle: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  bigSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  featureChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  featureChipLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
  featureLine: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginTop: 6,
    marginBottom: 2,
  },

  // Slide 2
  splitLottieArea: {
    height: SCREEN_H * 0.3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  splitLottie: { width: '90%', height: '100%' },
  splitTitleBlock: { paddingHorizontal: 24, marginTop: 8 },
  splitTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  splitSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    lineHeight: 21,
  },
  cardStack: {
    marginTop: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  eventCard: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardShadow: {
    shadowColor: '#F97316',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  card2: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  eventIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  eventMeta: { color: 'rgba(255,255,255,0.48)', fontSize: 11 },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(249,115,22,0.22)',
  },
  newBadgeText: { color: '#FED7AA', fontWeight: '700', fontSize: 10 },

  // Slide 3
  communityLottieArea: {
    alignItems: 'center',
    justifyContent: 'center',
    height: SCREEN_H * 0.3,
    marginTop: 8,
  },
  communityLottie: { width: '95%', height: '100%' },
  avatarStrip: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244,63,94,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(244,63,94,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    marginLeft: 8,
    backgroundColor: 'rgba(244,63,94,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(253,164,175,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countPillText: { color: '#FECDD3', fontSize: 11, fontWeight: '700' },
  communityTitle: { marginTop: 28 },
  communityFeatures: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  featureBlock: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 14,
  },
  featureBlockLabel: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  featureBlockSub: { color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 2, textAlign: 'center', paddingHorizontal: 4 },

  // Shared
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  inlineBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  skipBtn: {
    position: 'absolute',
    right: 24,
    zIndex: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  skipText: { fontSize: 13, fontWeight: '700' },
  pillBtn: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
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
  btnWrap: { paddingHorizontal: 24, marginTop: 'auto' as any, paddingTop: 12 },
  linkRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  linkBase: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  linkAccent: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

export default OnboardingScreen;
