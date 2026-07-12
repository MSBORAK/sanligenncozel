import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Editorial } from '@/theme/colors';
import BackgroundImage from '@/assets/images/background.jpg';
import { useThemeMode } from '@/context/ThemeContext';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useTranslation } from 'react-i18next';

type Props = StackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { t: tr } = useTranslation();
  const { mode } = useThemeMode();
  const isDark = mode !== 'light';
  const handleEnterApp = () => {
    navigation.replace('Main', { screen: 'Home' });
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground
      source={BackgroundImage}
      style={styles.bg}
      imageStyle={styles.bgImage}
    >
      <View
        style={[
          styles.bgOverlay,
          isDark && { backgroundColor: 'rgba(0,0,0,0.88)' },
        ]}
      />

      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>ŞG</Text>
          </View>
          <Text style={styles.title}>ŞanlıGenç</Text>
          <Text style={styles.subtitle}>{tr('welcome.subtitle')}</Text>
        </View>

        <View style={styles.content}>
          <LinearGradient
            colors={[Editorial.coffee, Editorial.coffeeSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardOuter}
          >
          <LinearGradient
            colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.08)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Üst mini modüller */}
            <View style={styles.topRow}>
              <View style={styles.topPill}>
                <Text style={styles.topPillTitle}>{tr('welcome.sehrinKalbi')}</Text>
                <Text style={styles.topPillSubtitle}>{tr('welcome.etkinlikler')}</Text>
              </View>
              <View style={styles.topPill}>
                <Text style={styles.topPillTitle}>{tr('welcome.gencKart')}</Text>
                <Text style={styles.topPillSubtitle}>{tr('welcome.avantajlar')}</Text>
              </View>
            </View>

            <Text style={styles.welcomeText}>{tr('welcome.sanliurfaHazir')}</Text>
            <Text style={styles.subtitleText}>{tr('welcome.senDeHazirMisin')}</Text>

            <View style={styles.buttons}>
              <TouchableOpacity style={styles.primaryButtonWrapper} activeOpacity={0.9} onPress={handleLogin}>
                <LinearGradient
                  colors={[Editorial.coffee, Editorial.coffeeSoft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>{tr('login.girisYap')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.9}
                onPress={handleEnterApp}
              >
                <Text style={styles.secondaryButtonText}>{tr('login.misafirOlarakDevam')}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.footerText}>
              {tr('welcome.footerText')}
            </Text>
          </LinearGradient>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  bgImage: {
    resizeMode: 'cover',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(47,36,24,0.48)',
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 20,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 22,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  cardOuter: {
    borderRadius: 32,
    padding: 1.5,
    marginTop: -8,
    shadowColor: Editorial.coffeeSoft,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 18,
  },
  card: {
    borderRadius: 30,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  topPill: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Editorial.creamText,
  },
  topPillTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
  },
  topPillSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Editorial.coffee,
    marginTop: 2,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  buttons: {
    gap: 12,
  },
  primaryButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#4b5563',
    fontSize: 15,
    fontWeight: '500',
  },
  footerText: {
    marginTop: 18,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default WelcomeScreen;

