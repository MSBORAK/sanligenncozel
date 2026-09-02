import React, { useState } from 'react';
import { AppAlert } from '@/lib/alert';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Mail, KeyRound } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { InputField } from '@/components/InputField';
import { PrimaryButton } from '@/components/PrimaryButton';
import type { RootStackParamList } from '@/types/navigation';
import type { OnboardingStackParamList } from '../navigation/OnboardingNavigator';
import { Clean } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { useTranslation } from 'react-i18next';

type AuthMode = 'login' | 'register';
type NestedNav = StackNavigationProp<OnboardingStackParamList, 'Login'>;
type AuthStep = 'email' | 'code';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Light, segmented login/register screen — matches onboarding's Clean palette.
 */
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NestedNav>();
  const insets = useSafeAreaInsets();
  const { setGuestMode } = useUser();
  const { t: tr } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('register');
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const emailInvalid = emailTouched && email.trim().length > 0 && !EMAIL_REGEX.test(email.trim());

  const onModeChange = (next: AuthMode) => {
    setMode(next);
    setStep('email');
    setOtpCode('');
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
    if (submitting) return;
    if (!email.trim()) {
      AppAlert.alert(tr('login.eksikBilgi'), tr('login.epostaGirin'));
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      AppAlert.alert(tr('login.eksikBilgi'), tr('login.epostaGecersiz'));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: mode === 'register',
        },
      });
      if (error) throw error;
      setStep('code');
      AppAlert.alert(tr('login.kodGonderildi'), tr('login.dogrulamaKoduGir'));
    } catch (error) {
      const message = error instanceof Error ? error.message : tr('login.birHataOlustu');
      AppAlert.alert(tr('common.error'), message);
    } finally {
      setSubmitting(false);
    }
  };

  const verifyOtpCode = async () => {
    if (submitting) return;
    if (!email.trim() || !otpCode.trim()) {
      AppAlert.alert(tr('login.eksikBilgi'), tr('login.epostaVeKodGirin'));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email',
      });
      if (error) throw error;
      if (mode === 'register') {
        const parent = navigation.getParent<StackNavigationProp<RootStackParamList>>();
        if (parent) {
          parent.replace('CompleteProfile');
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'CompleteProfile' as never }],
            })
          );
        }
      } else {
        goToMain();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : tr('login.kodDogrulanamadi');
      AppAlert.alert(tr('login.dogrulamaHatasi'), message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Clean.bg }]}>
      <LinearGradient
        colors={[Clean.accentSoft, Clean.bg]}
        style={[styles.topGlow, { height: insets.top + 280 }]}
        pointerEvents="none"
      />
      <View style={{ flex: 1, paddingTop: insets.top + 24 }}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoRing}>
              <Image
                source={require('@/assets/SanliGencLogo.jpeg')}
                style={styles.logo}
              />
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ŞANLIURFA</Text>
            </View>
            <Text style={styles.title}>
              {mode === 'login' ? tr('login.girisYap') : tr('login.kayitOl')}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email'
                ? mode === 'login'
                  ? tr('login.epostaIleGirisKodu')
                  : tr('login.epostaIleHesapOlustur')
                : tr('login.altiHaneliKod')}
            </Text>
          </View>

          <InputField
            icon={<Mail size={18} color={Clean.textSecondary} />}
            placeholder={tr('login.epostaAdresiniz')}
            value={email}
            onChangeText={(t) => { setEmail(t); if (!emailTouched) setEmailTouched(true); }}
            onBlur={() => setEmailTouched(true)}
            keyboardType="email-address"
            editable={step === 'email'}
            error={emailInvalid}
          />
          {emailInvalid && (
            <Text style={styles.emailErrorText}>{tr('login.epostaGecersiz')}</Text>
          )}
          {step === 'code' ? (
            <InputField
              icon={<KeyRound size={18} color={Clean.textSecondary} />}
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
            style={[styles.buttonSpacing, styles.primaryButtonNarrow]}
            disabled={submitting}
          />
          <Pressable style={styles.guestLink} onPress={() => goToMain(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.guestLinkText}>{tr('login.misafirOlarakDevam')}</Text>
          </Pressable>

          <Pressable
            style={styles.switchModeWrap}
            onPress={() => onModeChange(mode === 'login' ? 'register' : 'login')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'login' ? tr('login.hesabinYokMu') : tr('login.hesabinVarMi')}{' '}
              <Text style={styles.switchModeLink}>
                {mode === 'login' ? tr('login.kayitOl') : tr('login.girisYap')}
              </Text>
            </Text>
          </Pressable>

          <Text style={styles.finePrint}>{tr('login.gizlilikOnay')}</Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-start', paddingTop: 24 },
  card: {
    paddingHorizontal: 24,
  },
  header: { alignItems: 'center', marginBottom: 28 },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Clean.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
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
  inputSpacing: { marginTop: 10 },
  emailErrorText: { color: '#e74c3c', fontSize: 12, fontWeight: '600', marginTop: 6, marginLeft: 4 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: 8, marginBottom: 12 },
  forgotText: { color: Clean.accent, fontSize: 12, fontWeight: '600' },
  buttonSpacing: { marginTop: 10 },
  primaryButtonNarrow: { width: '76%', alignSelf: 'center' },
  guestLink: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 4,
  },
  guestLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: Clean.textSecondary,
  },
  switchModeWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 13,
    color: Clean.textSecondary,
  },
  switchModeLink: {
    color: Clean.ctaBg,
    fontWeight: '700',
  },
  finePrint: {
    marginTop: 14,
    textAlign: 'center',
    color: Clean.textMuted,
    fontSize: 11,
  },
});

export default LoginScreen;
