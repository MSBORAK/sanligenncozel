import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PagerView from 'react-native-pager-view';

// Types
import { RootStackParamList } from '@/types/navigation';

// Screens
import HomeScreen from '@/screens/HomeScreen';
import TransportScreen from '@/screens/TransportScreen';
import GencKartScreen from '@/screens/GencKartScreen';
import HizliErisimScreen from '@/screens/HizliErisimScreen';
import AssistantScreen from '@/screens/AssistantScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import EventsScreen from '@/screens/EventsScreen';
import MagazineScreen from '@/screens/MagazineScreen';
import PartnerDetailScreen from '@/screens/PartnerDetailScreen';
import HeritageDetailScreen from '@/screens/HeritageDetailScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import WeatherDetailScreen from '@/screens/WeatherDetailScreen';
import LoginScreen from '@/screens/LoginScreen';
import EventDetailScreen from '@/screens/EventDetailScreen';
import PharmacyListScreen from '@/screens/PharmacyListScreen';
import LibraryListScreen from '@/screens/LibraryListScreen';
import CulturalRouteScreen from '@/screens/CulturalRouteScreen';
import CulturalRouteDetailScreen from '@/screens/CulturalRouteDetailScreen';
import HeritageCollectionScreen from '@/screens/HeritageCollectionScreen';
import GlobalSearchScreen from '@/screens/GlobalSearchScreen';
import SosyalScreen from '@/screens/SosyalScreen';
import ChatScreen from '@/screens/ChatScreen';
import SendSnapScreen from '@/screens/SendSnapScreen';
import SnapViewScreen from '@/screens/SnapViewScreen';
import StoryViewScreen from '@/screens/StoryViewScreen';
import CompleteProfileScreen from '@/screens/CompleteProfileScreen';
import CreatePostScreen from '@/screens/CreatePostScreen';
import SosyalProfileScreen from '@/screens/SosyalProfileScreen';
import BlockedUsersScreen from '@/screens/BlockedUsersScreen';
import OnboardingNavigator from '@/navigation/OnboardingNavigator';
import { hasCompletedOnboarding } from '@/utils/onboarding';
import { supabase } from '@/lib/supabase';

// Custom Tab Bar
import CustomTabBar from './CustomTabBar';
import { useAppTheme } from '@/theme/useAppTheme';

const Stack = createStackNavigator<RootStackParamList>();

// Sayfa isimleri ve sırası
const TAB_NAMES = ['Transport', 'GencKart', 'Home', 'HizliErisim', 'Profile'] as const;
type TabName = typeof TAB_NAMES[number];

const MainTabs = ({ route, navigation }: any) => {
  const { pageBg } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(2);
  const pagerRef = useRef<PagerView>(null);
  const isProgrammaticChangeRef = useRef(false);

  // Stack'ten "Main" içine geçerken gelen { screen } parametresine göre
  // PagerView sayfasını güncelle (örn. Home > "Tümünü Gör" => GencKart).
  // Not: aynı ekrana art arda navigate edildiğinde (örn. iki kez Profile'a basılırsa)
  // route.params.screen değeri değişmediği için useEffect tetiklenmez — bu yüzden
  // işlendikten hemen sonra parametreyi temizliyoruz, böylece bir sonraki aynı
  // değerli navigate çağrısı da gerçek bir "değişiklik" olarak algılanır.
  useEffect(() => {
    const target = route?.params?.screen as TabName | undefined;
    if (!target) return;

    const idx = TAB_NAMES.indexOf(target);
    if (idx < 0) return;

    isProgrammaticChangeRef.current = true;
    setActiveIndex(idx);
    pagerRef.current?.setPage(idx);
    navigation.setParams({ screen: undefined });
  }, [route?.params?.screen]);

  // PagerView'dan sayfa değiştiğinde güncelle (swipe tamamlandığında)
  const handlePageSelected = useCallback((e: any) => {
    const index = e.nativeEvent.position;
    // Eğer programmatik değişiklik yoksa (yani kullanıcı swipe yaptıysa) güncelle
    if (!isProgrammaticChangeRef.current) {
      setActiveIndex(index);
    } else {
      // Programmatik değişiklik bitti, flag'i temizle
      isProgrammaticChangeRef.current = false;
    }
  }, []);

  // Tab bar'dan sayfa değiştirmek için callback
  const handleTabPress = useCallback((index: number) => {
    if (pagerRef.current && index !== activeIndex) {
      // Programmatik değişiklik başladı
      isProgrammaticChangeRef.current = true;
      // Önce state'i güncelle, böylece tab bar anında değişir
      setActiveIndex(index);
      // Sonra PagerView sayfasını değiştir
      pagerRef.current.setPage(index);
    }
  }, [activeIndex]);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={[styles.pagerView, { backgroundColor: pageBg }]}
        initialPage={2}
        onPageSelected={handlePageSelected}
      >
        <View key="0" style={[styles.page, { backgroundColor: pageBg }]}>
          <TransportScreen />
        </View>
        <View key="1" style={[styles.page, { backgroundColor: pageBg }]}>
          <GencKartScreen />
        </View>
        <View key="2" style={[styles.page, { backgroundColor: pageBg }]}>
          <HomeScreen />
        </View>
        <View key="3" style={[styles.page, { backgroundColor: pageBg }]}>
          <HizliErisimScreen />
        </View>
        <View key="4" style={[styles.page, { backgroundColor: pageBg }]}>
          <ProfileScreen />
        </View>
      </PagerView>
      <CustomTabBar 
        activeIndex={activeIndex} 
        onTabPress={handleTabPress}
        tabNames={TAB_NAMES}
      />
    </View>
  );
};

const slideFromRight = ({ current }: any) => ({
  cardStyle: {
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
    ],
    opacity: current.progress,
  },
});

const AppNavigator = () => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [initialRouteName, setInitialRouteName] = useState<'OnboardingFlow' | 'Login' | 'Main'>('OnboardingFlow');

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        // 1) Kayıtlı oturum var mı? Varsa (Instagram gibi) doğrudan ana ekrana geç
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) {
          setInitialRouteName('Main');
          return;
        }
        // 2) Oturum yoksa: dev'de onboarding'i test edebilmek için ona git
        if (__DEV__) {
          setInitialRouteName('OnboardingFlow');
          return;
        }
        // 3) Prod: onboarding tamamlandıysa Login, değilse OnboardingFlow
        const completed = await hasCompletedOnboarding();
        if (!isMounted) return;
        setInitialRouteName(completed ? 'Login' : 'OnboardingFlow');
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };
    bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isBootstrapping) {
    return <View style={styles.bootSplash} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: slideFromRight,
          transitionSpec: {
            open: { animation: 'spring', config: { stiffness: 300, damping: 30 } },
            close: { animation: 'spring', config: { stiffness: 300, damping: 30 } },
          },
        }}
      >
        <Stack.Screen name="OnboardingFlow" component={OnboardingNavigator} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="Magazine" component={MagazineScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PartnerDetail" component={PartnerDetailScreen} />
        <Stack.Screen name="HeritageDetail" component={HeritageDetailScreen} />
        <Stack.Screen name="WeatherDetail" component={WeatherDetailScreen} />
        <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        <Stack.Screen name="PharmacyList" component={PharmacyListScreen} />
        <Stack.Screen name="LibraryList" component={LibraryListScreen} />
        <Stack.Screen name="CulturalRoute" component={CulturalRouteScreen} />
        <Stack.Screen name="CulturalRouteDetail" component={CulturalRouteDetailScreen} />
        <Stack.Screen name="HeritageCollection" component={HeritageCollectionScreen} />
        <Stack.Screen name="GlobalSearch" component={GlobalSearchScreen} />
        <Stack.Screen name="Sosyal" component={SosyalScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="SendSnap" component={SendSnapScreen} />
        <Stack.Screen name="SnapView" component={SnapViewScreen} />
        <Stack.Screen name="StoryView" component={StoryViewScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="Assistant" component={AssistantScreen} />
        <Stack.Screen name="SosyalProfile" component={SosyalProfileScreen} />
        <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  bootSplash: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});

export default AppNavigator;
