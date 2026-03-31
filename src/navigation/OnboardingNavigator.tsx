import React from 'react';
import { createStackNavigator, StackCardInterpolationProps, StackNavigationOptions } from '@react-navigation/stack';
import Onboarding1Screen from '@/screens/Onboarding1Screen';
import Onboarding2Screen from '@/screens/Onboarding2Screen';
import Onboarding3Screen from '@/screens/Onboarding3Screen';
import LoginScreen from '@/screens/LoginScreen';

export type OnboardingStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

const slideFade = ({ current, layouts }: StackCardInterpolationProps) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width * 0.12, 0],
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  return {
    cardStyle: {
      transform: [{ translateX }],
      opacity,
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.15],
      }),
    },
  };
};

const screenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyleInterpolator: slideFade,
};

/**
 * Dedicated stack for onboarding and authentication flow.
 */
export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Onboarding1" screenOptions={screenOptions}>
      <Stack.Screen name="Onboarding1" component={Onboarding1Screen} />
      <Stack.Screen name="Onboarding2" component={Onboarding2Screen} />
      <Stack.Screen name="Onboarding3" component={Onboarding3Screen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
