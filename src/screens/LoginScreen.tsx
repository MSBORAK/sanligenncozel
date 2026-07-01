import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GradientBackground } from '@/components/GradientBackground';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SecondaryButton } from '@/components/SecondaryButton';
import type { RootStackParamList } from '@/types/navigation';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { colors } from '@/theme/colors';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';

type AuthMode = 'login' | 'register';
type NestedNav = StackNavigationProp<OnboardingStackParamList, 'Login'>;
type AuthStep = 'email' | 'code';

/**
 * Glassmorphism authentication screen with segmented login/register.
 */
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NestedNav>();
  const { setGuestMode } = useUser();
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
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta adresinizi girin.');
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
      Alert.alert('Kod Gönderildi', 'E-posta adresine gelen doğrulama kodunu gir.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bir hata oluştu.';
      Alert.alert('Hata', message);
    }
  };

  const verifyOtpCode = async () => {
    if (!email.trim() || !otpCode.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve doğrulama kodunu girin.');
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
      const message = error instanceof Error ? error.message : 'Kod doğrulanamadı.';
      Alert.alert('Doğrulama Hatası', message);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.cardShell}>
          <BlurView intensity={25} tint="dark" style={styles.blur}>
            <View style={styles.card}>
              <View style={styles.header}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ŞANLIURFA</Text>
                </View>
                <Text style={styles.title}>Şanlı Genç</Text>
                <Text style={styles.subtitle}>
                  {step === 'email'
                    ? mode === 'login'
                      ? 'E-posta adresinle giriş kodu al'
                      : 'E-posta adresinle hızlıca hesap oluştur'
                    : 'E-postana gelen 6 haneli kodu gir'}
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
                >
                  <LinearGradient colors={['#F59E0B', '#EF4444']} style={styles.indicatorGradient} />
                </Animated.View>
                <Pressable style={styles.segmentButton} onPress={() => onModeChange('login')}>
                  <Text style={[styles.segmentLabel, mode === 'login' && styles.segmentLabelActive]}>Giriş Yap</Text>
                </Pressable>
                <Pressable style={styles.segmentButton} onPress={() => onModeChange('register')}>
                  <Text style={[styles.segmentLabel, mode === 'register' && styles.segmentLabelActive]}>Kayıt Ol</Text>
                </Pressable>
              </View>

              <InputField
                icon="✉️"
                placeholder="E-posta adresiniz"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                editable={step === 'email'}
              />
              {step === 'code' ? (
                <InputField
                  icon="🔐"
                  placeholder="Doğrulama kodu"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  containerStyle={styles.inputSpacing}
                  maxLength={6}
                />
              ) : null}

              {step === 'code' ? (
                <Pressable style={styles.forgotWrap} onPress={() => setStep('email')}>
                  <Text style={styles.forgotText}>E-postayı değiştir</Text>
                </Pressable>
              ) : null}

              <PrimaryButton
                label={step === 'email' ? 'Kod Gönder' : 'Kodu Doğrula'}
                onPress={step === 'email' ? sendOtpCode : verifyOtpCode}
                style={styles.buttonSpacing}
              />
              <SecondaryButton label="Misafir Olarak Devam Et" onPress={() => goToMain(true)} style={styles.buttonSpacing} />

              <Text style={styles.finePrint}>Devam ederek Gizlilik Politikası'nı kabul edersiniz</Text>
            </View>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cardShell: {
    position: 'absolute',
    top: '20%',
    bottom: '20%',
    left: 24,
    right: 24,
    borderRadius: 24,
  },
  blur: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  card: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: colors.glassBackground,
  },
  header: { alignItems: 'center', marginBottom: 20 },
  badge: {
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 10,
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.5)',
    marginBottom: 10,
  },
  badgeText: { color: '#FCD9A8', fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  title: { color: colors.white, fontSize: 30, fontWeight: '800', marginBottom: 6 },
  subtitle: { color: colors.textSecondary, fontSize: 13, textAlign: 'center' },
  segmentWrap: {
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.09)',
    marginBottom: 16,
    padding: 4,
    flexDirection: 'row',
  },
  indicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
  },
  indicatorGradient: { flex: 1, borderRadius: 12 },
  segmentButton: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  segmentLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  segmentLabelActive: { color: colors.white },
  inputSpacing: { marginTop: 10 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 12 },
  forgotText: { color: '#FCD9A8', fontSize: 11 },
  buttonSpacing: { marginTop: 9 },
  finePrint: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
  },
});

export default LoginScreen;
