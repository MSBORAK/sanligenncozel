import 'react-native-gesture-handler';
import '@/i18n';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Image, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import AppNavigator from '@/navigation/AppNavigator';
import { ThemeProvider, useThemeMode } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { UserProvider } from '@/context/UserContext';
import { Colors } from '@/constants/Colors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppAlertHost } from '@/lib/alert';

const logo = require('@/assets/SanliGencLogo.jpeg');

const BrandSplash = () => (
  <View style={styles.splash}>
    <Image source={logo} style={styles.splashLogo} resizeMode="contain" />
    <Text style={styles.splashCredit}>MSE SOFT tarafından geliştirilmiştir</Text>
  </View>
);

const AppInner = () => {
  const { mode } = useThemeMode();
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
      <AppAlertHost />
    </>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowBrandSplash(false), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary.indigo} />
      </View>
    );
  }

  if (showBrandSplash) {
    return <BrandSplash />;
  }

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <UserProvider>
            <FavoritesProvider>
              <AppInner />
            </FavoritesProvider>
          </UserProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  splash: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  splashLogo: { width: 160, height: 160 },
  splashCredit: {
    position: 'absolute',
    bottom: 48,
    fontSize: 12,
    fontWeight: '600',
    color: '#A0A0A8',
    letterSpacing: 0.3,
  },
});
