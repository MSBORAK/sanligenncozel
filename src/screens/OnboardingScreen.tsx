import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import PagerView from 'react-native-pager-view';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { markOnboardingCompleted } from '@/utils/onboarding';
import { Clean } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

const onboarding1 = require('@/assets/images/onboarding-1.png');
const onboarding2 = require('@/assets/images/onboarding-2.png');
const onboarding3 = require('@/assets/images/onboarding-3.png');

type NavProp = StackNavigationProp<OnboardingStackParamList, 'Onboarding'>;

// Görsellerin kendi zemin renkleri (köşe piksellerinden ölçüldü) — üst alanla birebir kaynaşsın diye
const IMAGE_BG = ['#B5DAFA', '#FD9A79', '#AC8FD5'] as const;
// Her slaytın kendi tonunun koyu/doygun hali — CTA buton ve aktif progress bu renkte
const CTA_COLORS = ['#1E3A5F', '#9A3412', '#5B21B6'] as const;

// ─── Tek, tutarlı slayt şablonu ─────────────────────────────────────────────
const OnboardingSlide: React.FC<{
  isActive: boolean;
  image: any;
  imageBg: string;
  imageScale?: number;
  ctaColor: string;
  titleKey: string;
  subtitleKey: string;
  ctaLabelKey: string;
  onCta: () => void;
  onSkip: () => void;
  onLogin: () => void;
  showLoginLink: boolean;
  progressIndex: number;
  progressTotal: number;
  insets: ReturnType<typeof useSafeAreaInsets>;
}> = ({ isActive, image, imageBg, imageScale = 1, ctaColor, titleKey, subtitleKey, ctaLabelKey, onCta, onSkip, onLogin, showLoginLink, progressIndex, progressTotal, insets }) => {
  const { t: tr } = useTranslation();
  const contentAnim = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) return;
    contentAnim.setValue(0);
    Animated.spring(contentAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 160 }).start();
  }, [isActive]);

  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, damping: 14, stiffness: 300 }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 260 }).start();

  return (
    <View style={styles.slide}>
      <View style={[styles.imageArea, { backgroundColor: imageBg }]}>
        <Image source={image} style={[styles.image, { transform: [{ scale: imageScale }] }]} resizeMode="contain" />
        <Pressable style={[styles.skipBtn, { top: insets.top + 12 }]} onPress={onSkip}>
          <Text style={styles.skipText}>{tr('onboarding2.gec')}</Text>
        </Pressable>
      </View>

      <View style={styles.sheet}>
        <Animated.View style={{
          opacity: contentAnim,
          transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}>
          <Text style={styles.title}>{tr(titleKey)}</Text>
          <Text style={styles.subtitle}>{tr(subtitleKey)}</Text>
        </Animated.View>

        <View style={styles.progressRow}>
          {Array.from({ length: progressTotal }, (_, i) => (
            <View key={i} style={[styles.progressSegment, i === progressIndex && { backgroundColor: ctaColor }]} />
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <Pressable onPress={onCta} onPressIn={onPressIn} onPressOut={onPressOut} style={[styles.ctaBtn, { backgroundColor: ctaColor }]}>
            <Text style={styles.ctaText}>{tr(ctaLabelKey)}</Text>
          </Pressable>
        </Animated.View>

        {showLoginLink && (
          <View style={styles.linkRow}>
            <Text style={styles.linkBase}>{tr('onboarding1.zatenHesabinVarMi')} </Text>
            <Pressable onPress={onLogin}><Text style={styles.linkAccent}>{tr('onboarding1.girisYapKucuk')}</Text></Pressable>
          </View>
        )}

        <View style={{ height: Math.max(8, insets.bottom) }} />
      </View>
    </View>
  );
};

// ─── Root ───────────────────────────────────────────────────────────────────
export const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const pagerRef = useRef<PagerView>(null);
  const [activePage, setActivePage] = useState(0);

  const goToLogin = async () => {
    await markOnboardingCompleted();
    navigation.replace('Login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Clean.bg }}>
      <StatusBar style="dark" />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={e => setActivePage(e.nativeEvent.position)}
        overdrag
      >
        <View key="0" style={{ flex: 1 }}>
          <OnboardingSlide
            isActive={activePage === 0}
            image={onboarding1}
            imageBg={IMAGE_BG[0]}
            ctaColor={CTA_COLORS[0]}
            titleKey="onboardingLegacy.hosGeldin"
            subtitleKey="onboardingLegacy.gencleOzelUygulama"
            ctaLabelKey="onboarding1.hadiBaslayalim"
            onCta={() => pagerRef.current?.setPage(1)}
            onSkip={goToLogin}
            onLogin={goToLogin}
            showLoginLink
            progressIndex={0}
            progressTotal={3}
            insets={insets}
          />
        </View>
        <View key="1" style={{ flex: 1 }}>
          <OnboardingSlide
            isActive={activePage === 1}
            image={onboarding2}
            imageBg={IMAGE_BG[1]}
            ctaColor={CTA_COLORS[1]}
            titleKey="onboarding2.title"
            subtitleKey="onboardingLegacy.slide2Subtitle"
            ctaLabelKey="onboarding2.devamEt"
            onCta={() => pagerRef.current?.setPage(2)}
            onSkip={goToLogin}
            onLogin={goToLogin}
            showLoginLink
            progressIndex={1}
            progressTotal={3}
            insets={insets}
          />
        </View>
        <View key="2" style={{ flex: 1 }}>
          <OnboardingSlide
            isActive={activePage === 2}
            image={onboarding3}
            imageBg={IMAGE_BG[2]}
            ctaColor={CTA_COLORS[2]}
            titleKey="onboarding3.title"
            subtitleKey="onboardingLegacy.slide3Subtitle"
            ctaLabelKey="onboarding3.hemenKatil"
            onCta={goToLogin}
            onSkip={goToLogin}
            onLogin={goToLogin}
            showLoginLink
            progressIndex={2}
            progressTotal={3}
            insets={insets}
          />
        </View>
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  slide: { flex: 1, backgroundColor: Clean.bg },
  imageArea: {
    flex: 1.15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  image: {
    width: '92%',
    height: '92%',
  },
  skipBtn: {
    position: 'absolute',
    top: 0,
    right: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    zIndex: 10,
  },
  skipText: { fontSize: 13, fontWeight: '700', color: Clean.textPrimary },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    color: Clean.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: Clean.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
    marginBottom: 18,
    justifyContent: 'center',
  },
  progressSegment: {
    width: 22,
    height: 4,
    borderRadius: 2,
    backgroundColor: Clean.chipBg,
  },
  ctaBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Clean.ctaBg,
  },
  ctaText: {
    color: Clean.ctaText,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  linkRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  linkBase: { color: Clean.textSecondary, fontSize: 13 },
  linkAccent: { color: Clean.textPrimary, fontSize: 13, fontWeight: '700' },
});

export default OnboardingScreen;
