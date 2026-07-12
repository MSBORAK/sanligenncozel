import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import type { RootStackParamList } from '@/types/navigation';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { Clean } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';

type AuthMode = 'login' | 'register';
type NestedNav = StackNavigationProp<OnboardingStackParamList, 'Login'>;
type AuthStep = 'email' | 'code';

/**
 * Light, segmented login/register screen — matches onboarding's Clean palette.
 */
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NestedNav>();
  const insets = useSafeAreaInsets();
  const { setGuestMode } = useUser();
  const { t: tr } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [segmentWidth, setSegmentWidth] = useState(0);
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;

  const onModeChange = (next: AuthMode) => {
    setMode(next);
    setStep('email');
    setOtpCode('');
  };

  const indicatorWidth = segmentWidth > 0 ? (segmentWidth - 8) / 2 : 0;

  useEffect(() => {
    Animated.spring(indicatorTranslateX, {
      toValue: mode === 'register' ? indicatorWidth : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [mode, indicatorWidth, indicatorTranslateX]);

  const onSegmentLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) setSegmentWidth(width);
  };

  const goToMain = (asGuest = false) => {
    if (asGuest) {
      setGuestMode();
    }
    const parent = navigation.getParent<StackNavigationProp<RootStackParamList>>();
    if (parent) {
      parent.replace('Main', { screen: 'Home' });
      return;
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' as never, params: { screen: 'Home' } as never }],
      })
    );
  };

  const sendOtpCode = async () => {
    if (!email.trim()) {
      Alert.alert(tr('login.eksikBilgi'), tr('login.epostaGirin'));
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: mode === 'register',
        },
      });
      if (error) throw error;
      setStep('code');
      Alert.alert(tr('login.kodGonderildi'), tr('login.dogrulamaKoduGir'));
    } catch (error) {
      const message = error instanceof Error ? error.message : tr('login.birHataOlustu');
      Alert.alert(tr('common.error'), message);
    }
  };

  const verifyOtpCode = async () => {
    if (!email.trim() || !otpCode.trim()) {
      Alert.alert(tr('login.eksikBilgi'), tr('login.epostaVeKodGirin'));
      return;
    }
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email',
      });
      if (error) throw error;
      goToMain();
    } catch (error) {
      const message = error instanceof Error ? error.message : tr('login.kodDogrulanamadi');
      Alert.alert(tr('login.dogrulamaHatasi'), message);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Clean.bg, paddingTop: insets.top + 24 }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ŞANLIURFA</Text>
            </View>
            <Text style={styles.title}>Şanlı Genç</Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? mode === 'login'
                  ? tr('login.epostaIleGirisKodu')
                  : tr('login.epostaIleHesapOlustur')
                : tr('login.altiHaneliKod')}
            </Text>
          </View>

          <View style={styles.segmentWrap} onLayout={onSegmentLayout}>
            <Animated.View
              style={[
                styles.indicator,
                {
                  width: indicatorWidth,
                  transform: [{ translateX: indicatorTranslateX }],
                },
              ]}
            />
            <Pressable style={styles.segmentButton} onPress={() => onModeChange('login')}>
              <Text style={[styles.segmentLabel, mode === 'login' && styles.segmentLabelActive]}>{tr('login.girisYap')}</Text>
            </Pressable>
            <Pressable style={styles.segmentButton} onPress={() => onModeChange('register')}>
              <Text style={[styles.segmentLabel, mode === 'register' && styles.segmentLabelActive]}>{tr('login.kayitOl')}</Text>
            </Pressable>
          </View>

          <InputField
            icon="✉️"
            placeholder={tr('login.epostaAdresiniz')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={step === 'email'}
          />
          {step === 'code' ? (
            <InputField
              icon="🔐"
              placeholder={tr('login.dogrulamaKodu')}
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="number-pad"
              containerStyle={styles.inputSpacing}
              maxLength={6}
            />
          ) : null}

          {step === 'code' ? (
            <Pressable style={styles.forgotWrap} onPress={() => setStep('email')}>
              <Text style={styles.forgotText}>{tr('login.epostayiDegistir')}</Text>
            </Pressable>
          ) : null}

          <PrimaryButton
            label={step === 'email' ? tr('login.kodGonder') : tr('login.koduDogrula')}
            onPress={step === 'email' ? sendOtpCode : verifyOtpCode}
            style={styles.buttonSpacing}
          />
          <SecondaryButton label={tr('login.misafirOlarakDevam')} onPress={() => goToMain(true)} style={styles.buttonSpacing} />

          <Text style={styles.finePrint}>{tr('login.gizlilikOnay')}</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, justifyContent: 'center' },
  card: {
    paddingHorizontal: 24,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  badge: {
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: Clean.accentSoft,
    marginBottom: 10,
  },
  badgeText: { color: Clean.accent, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  title: { color: Clean.textPrimary, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: Clean.textSecondary, fontSize: 13, textAlign: 'center' },
  segmentWrap: {
    height: 48,
    borderRadius: 16,
    backgroundColor: Clean.chipBg,
    marginBottom: 18,
    padding: 4,
    flexDirection: 'row',
  },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    height: 40,
    borderRadius: 12,
    backgroundColor: Clean.ctaBg,
  },
  segmentButton: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  segmentLabel: { fontSize: 13, fontWeight: '600', color: Clean.textSecondary },
  segmentLabelActive: { color: Clean.ctaText },
  inputSpacing: { marginTop: 10 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 12 },
  forgotText: { color: Clean.accent, fontSize: 12, fontWeight: '600' },
  buttonSpacing: { marginTop: 10 },
  finePrint: {
    marginTop: 14,
    textAlign: 'center',
    color: Clean.textMuted,
    fontSize: 11,
  },
});

export default LoginScreen;
