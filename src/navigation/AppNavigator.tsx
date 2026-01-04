import React, { useState, useRef, useCallback } from 'react';
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
import AssistantScreen from '@/screens/AssistantScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import EventsScreen from '@/screens/EventsScreen';
import MagazineScreen from '@/screens/MagazineScreen';
import PartnerDetailScreen from '@/screens/PartnerDetailScreen';
import WelcomeScreen from '@/screens/WelcomeScreen';
import HeritageDetailScreen from '@/screens/HeritageDetailScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import WeatherDetailScreen from '@/screens/WeatherDetailScreen';
import LoginScreen from '@/screens/LoginScreen';
import EventDetailScreen from '@/screens/EventDetailScreen';
import PharmacyListScreen from '@/screens/PharmacyListScreen';
import LibraryListScreen from '@/screens/LibraryListScreen';
import CulturalRouteScreen from '@/screens/CulturalRouteScreen';

// Custom Tab Bar
import CustomTabBar from './CustomTabBar';

const Stack = createStackNavigator<RootStackParamList>();

// Sayfa isimleri ve sırası
const TAB_NAMES = ['Home', 'Transport', 'GencKart', 'Assistant', 'Profile'] as const;
type TabName = typeof TAB_NAMES[number];

const MainTabs = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const isProgrammaticChangeRef = useRef(false);

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
        style={styles.pagerView}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="0" style={styles.page}>
          <HomeScreen />
        </View>
        <View key="1" style={styles.page}>
          <TransportScreen />
        </View>
        <View key="2" style={styles.page}>
          <GencKartScreen />
        </View>
        <View key="3" style={styles.page}>
          <AssistantScreen />
        </View>
        <View key="4" style={styles.page}>
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

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
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
