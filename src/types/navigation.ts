import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { StackScreenProps } from '@react-navigation/stack';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Alttaki Tab Menüsünün Ekranları
export type MainTabParamList = {
  Home: undefined;
  Transport: undefined;
  GencKart: undefined;
  HizliErisim: undefined;
  Profile: undefined;
};

// Ana Stack Navigasyonun Ekranları
export type RootStackParamList = {
  OnboardingFlow: undefined;
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Welcome: undefined;
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList>; // Tab menüsünü bir ekran olarak içerir
  Events: { initialTab?: string } | undefined;
  Magazine: undefined;
  Rewards: undefined;
  Notifications: undefined;
  PartnerDetail: { partnerId: string };
  WeatherDetail: { weatherData?: any; forecastData?: any; airQualityData?: any };
   HeritageDetail: { id: string };
   HeritageCollection: { category: import('./index').HeritageCategory };
   EventDetail: { eventId: string };
   PharmacyList: undefined;
   LibraryList: undefined;
   CulturalRoute: undefined;
   CulturalRouteDetail: { id: string };
  GlobalSearch: undefined;
  Sosyal: undefined;
  Chat: { userId?: string; userName?: string; userAvatar?: string; username?: string } | undefined;
  SendSnap: { recipientId?: string; imageUri?: string } | undefined;
  SnapView: { snapId?: string; imageUrl?: string; messageId?: string; canView?: boolean; snapList?: any[]; initialIndex?: number; userId?: string; userName?: string; isOwnSnap?: boolean; reactionsEnabled?: boolean } | undefined;
  SocialFeed: undefined;
  StoryView: { storyId?: string; userId?: string } | undefined;
  CompleteProfile: undefined;
  CreatePost: undefined;
  Assistant: undefined;
  SosyalProfile: { userId?: string };
};

// HomeScreen için özel tip oluşturma. Bu, hem Stack hem de Tab tiplerini birleştirir.
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;
